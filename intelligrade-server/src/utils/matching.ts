import path from "path";
import fs from "fs";
import sharp from "sharp";
import { PDFDocument } from "pdf-lib";
import { Class, ExamSchedule, Paper, Student, User } from "../../types/type";
import { ExamResponse } from "../../types/exam";
import pdf2png from "./pdf2png";
import { ensureScheduleResult, mmToPixels, serialiseScheduleResult } from "./tools";
import { recognizeHeader, LLMRequestError } from "./llm";

const PADDING = 10;

const MATCH_STAGE = "MATCH";

const createPaperId = (index: number) => `student-${index + 1}`;

const normaliseUploadsPath = (rawUrl: string) => {
    if (!rawUrl) {
        return "";
    }

    let url = rawUrl.trim();

    if (!url) {
        return "";
    }

    try {
        const parsed = new URL(url);
        url = parsed.pathname || "";
    } catch (error) {
        // If parsing fails we assume the URL is already relative
    }

    url = url.replace(/^\/+/, "");
    url = url.replace(/^strapi\//, "");

    return url;
};

const logMatchStep = (documentId: string, message: string) => {
    strapi.log.info(`[matching:${documentId}] ${message}`);
};

const toPosixPath = (...segments: string[]) => path.posix.join(...segments);

const isoTimestamp = () => new Date().toISOString();

// Calculate similarity between two strings (0 = completely different, 1 = identical)
const calculateSimilarity = (str1: string, str2: string): number => {
    if (str1 === str2) return 1;
    if (!str1 || !str2) return 0;
    
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1;
    
    // Calculate Levenshtein distance
    const editDistance = (s1: string, s2: string): number => {
        s1 = s1.toLowerCase();
        s2 = s2.toLowerCase();
        
        const costs: number[] = [];
        for (let i = 0; i <= s1.length; i++) {
            let lastValue = i;
            for (let j = 0; j <= s2.length; j++) {
                if (i === 0) {
                    costs[j] = j;
                } else if (j > 0) {
                    let newValue = costs[j - 1];
                    if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
                        newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
                    }
                    costs[j - 1] = lastValue;
                    lastValue = newValue;
                }
            }
            if (i > 0) costs[s2.length] = lastValue;
        }
        return costs[s2.length];
    };
    
    const distance = editDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
};

async function persistScheduleResult(schedule: ExamSchedule) {
    await strapi.documents('api::schedule.schedule').update({
        documentId: schedule.documentId,
        data: {
            result: serialiseScheduleResult(schedule.result),
        },
    });
}

async function markMatchError(
    schedule: ExamSchedule,
    documentId: string,
    message: string,
    error?: unknown,
) {
    const details = error instanceof Error
        ? error.stack || error.message
        : typeof error === "string"
            ? error
            : undefined;

    strapi.log.error(`startMatching(${documentId}): ${message}`, error instanceof Error ? error : undefined);
    schedule.result.error = {
        stage: MATCH_STAGE,
        message,
        details,
        timestamp: isoTimestamp(),
    };
    await persistScheduleResult(schedule);
}

export async function startMatching(documentId: string) {
    let schedule: ExamSchedule | null = null;

    try {
        // 1. 先通过documentId获得schedule
        logMatchStep(documentId, "fetching schedule data...");
        const scheduleData = await strapi.documents('api::schedule.schedule').findOne({
            documentId,
            populate: ['exam', 'class', 'teacher']
        });

        if (!scheduleData) {
            strapi.log.error(`startMatching(${documentId}): schedule not found`);
            return;
        }

        schedule = scheduleData as unknown as ExamSchedule;
        schedule.result = ensureScheduleResult(schedule.result);

        logMatchStep(documentId, `loaded schedule payload - ID: ${schedule.documentId}, Exam: ${schedule.exam?.documentId}, Class: ${schedule.class?.documentId}`);

        // 初始化状态
        if (schedule.result.progress !== 'MATCH_START') {
            schedule.result.progress = 'MATCH_START';
        }
        schedule.result.error = null;
        await persistScheduleResult(schedule);

        logMatchStep(documentId, "initialised result state to MATCH_START");

        // 2. 拿到pdfId (从result属性中获取)
        const pdfUrl = schedule.result.pdfUrl?.trim();
        logMatchStep(documentId, `PDF URL from result: "${pdfUrl}"`);

        if (!pdfUrl) {
            await markMatchError(schedule, documentId, 'PDF url is missing on the schedule result. Please ensure the PDF was uploaded correctly.');
            return;
        }

        // 3. 通过pdfId直接从文件夹中获取pdf文件
        const rootDir = process.cwd();
        const uploadsPath = normaliseUploadsPath(pdfUrl);
        const pdfPath = path.join(rootDir, 'public', uploadsPath);

        logMatchStep(documentId, `resolved PDF path: root="${rootDir}", uploads="${uploadsPath}", full="${pdfPath}"`);

        // 4. 检查pdf文件是否存在
        if (!fs.existsSync(pdfPath)) {
            await markMatchError(schedule, documentId, `PDF file not found at path: ${pdfPath}. Please check if the file was uploaded correctly.`);
            return;
        }

        // 验证文件确实是 PDF
        const pdfStats = fs.statSync(pdfPath);
        logMatchStep(documentId, `PDF file exists, size: ${pdfStats.size} bytes`);

    logMatchStep(documentId, "loading exam and class metadata...");

    // 5. 获得Exam, Class, Teacher数据
    const examData = await strapi.documents('api::exam.exam').findOne({
        documentId: schedule.exam.documentId,
    });
    
    if (!examData) {
        await markMatchError(schedule, documentId, `Exam not found with documentId: ${schedule.exam.documentId}`);
        return;
    }
    
    const classRawData = await strapi.documents('api::class.class').findOne({
        documentId: schedule.class.documentId,
        populate: ['students', 'teacher']
    });
    
    if (!classRawData) {
        await markMatchError(schedule, documentId, `Class not found with documentId: ${schedule.class.documentId}`);
        return;
    }
    
    const teacherData = await strapi.documents('plugin::users-permissions.user').findOne({
        documentId: schedule.teacher.documentId
    });
    
    if (!teacherData) {
        await markMatchError(schedule, documentId, `Teacher not found with documentId: ${schedule.teacher.documentId}`);
        return;
    }
    
    const exam = examData as unknown as ExamResponse;
    const classData = classRawData as unknown as Class;
    const teacher = teacherData as unknown as User;

    logMatchStep(documentId, `loaded metadata - Exam: "${exam.projectName || 'N/A'}", Class: ${classData.students?.length || 0} students, Teacher: "${teacher.userName || 'N/A'}"`);

    // 5. 验证 exam 组件是否有 position 数据
    const components = Array.isArray(exam.examData?.components) ? exam.examData.components : [];
    logMatchStep(documentId, `exam has ${components.length} components`);
    
    // 检查所有题目组件是否有 position
    const QUESTION_TYPES = ['multiple-choice', 'fill-in-blank', 'open'];
    const questionComponents = components.filter(c => QUESTION_TYPES.includes(c.type));
    const questionsWithoutPosition = questionComponents.filter(c => !c.position || typeof c.position.pageIndex !== 'number');
    
    if (questionsWithoutPosition.length > 0) {
        const missingDetails = questionsWithoutPosition
            .map(c => `  • Question ${(c as any).questionNumber || 'N/A'} (${c.type})`)
            .join('\n');
        
        const errorMsg = [
            `❌ Exam Setup Incomplete: ${questionsWithoutPosition.length} question(s) missing position data`,
            '',
            'Missing questions:',
            missingDetails,
            '',
            '📝 Required Action:',
            '1. Open the exam in the Editor',
            '2. Wait for all components to render (this calculates their positions)',
            '3. Save the exam',
            '4. Return here and upload the PDF again',
            '',
            '⚠️ Without component positions, questions cannot be extracted from scanned PDFs and grading is impossible.',
        ].join('\n');
        
        await markMatchError(schedule, documentId, errorMsg);
        return;
    }
    
    logMatchStep(documentId, `validated: all ${questionComponents.length} question components have position data`);

    // 6. 根据Exam的数据分割PDF文件成多份试卷，保存到不同的文件夹
    // 6.1 校验PDF的页数是否等于(学生人数 * 试卷页数)
    const studentCount = classData.students?.length || 0;
    
    if (studentCount <= 0) {
        await markMatchError(schedule, documentId, 'The class has no students. Cannot proceed with matching.');
        return;
    }
    
    logMatchStep(documentId, `class has ${studentCount} students`);
    
    const positionedPageIndices = components
        .map((component) => component.position?.pageIndex)
        .filter((pageIndex): pageIndex is number => typeof pageIndex === 'number' && Number.isFinite(pageIndex));
    
    logMatchStep(documentId, `found ${positionedPageIndices.length} positioned components with page indices: [${positionedPageIndices.join(', ')}]`);

    // 加载并验证 PDF
    logMatchStep(documentId, `loading PDF from ${pdfPath}...`);
    let pdfBuffer: Buffer;
    let pdfDoc: any;
    let actualTotalPages: number;
    
    try {
        pdfBuffer = fs.readFileSync(pdfPath);
        logMatchStep(documentId, `read PDF buffer: ${pdfBuffer.length} bytes`);
        
        pdfDoc = await PDFDocument.load(pdfBuffer);
        actualTotalPages = pdfDoc.getPageCount();
        
        logMatchStep(documentId, `loaded PDF successfully: ${actualTotalPages} total pages`);
    } catch (error) {
        await markMatchError(schedule, documentId, `Failed to load PDF file: ${error instanceof Error ? error.message : 'unknown error'}`, error);
        return;
    }

    // 计算每份试卷的页数
    let pagesPerExam: number | null = null;

    if (positionedPageIndices.length > 0) {
        pagesPerExam = Math.max(...positionedPageIndices) + 1;
        logMatchStep(documentId, `calculated pagesPerExam from positioned components: ${pagesPerExam}`);
    }

    // 如果计算出的页数不匹配，尝试使用回退方案
    if (!pagesPerExam || actualTotalPages !== studentCount * pagesPerExam) {
        const fallback = actualTotalPages % studentCount === 0
            ? actualTotalPages / studentCount
            : null;

        if (fallback) {
            if (!pagesPerExam) {
                logMatchStep(documentId, `no positioned components found, using fallback: pagesPerExam=${fallback}`);
                strapi.log.warn(`startMatching(${documentId}): derived pagesPerExam=${fallback} from PDF page count because no component positions were found.`);
            } else {
                logMatchStep(documentId, `page count mismatch (${actualTotalPages} != ${studentCount} * ${pagesPerExam}), using fallback: ${fallback}`);
                strapi.log.warn(`startMatching(${documentId}): overriding pagesPerExam=${pagesPerExam} with ${fallback} because PDF page count (${actualTotalPages}) does not equal studentCount (${studentCount}) * pagesPerExam.`);
            }
            pagesPerExam = fallback;
        }
    }

    if (!pagesPerExam) {
        await markMatchError(schedule, documentId, `Unable to determine exam page count. No component positions found and PDF pages (${actualTotalPages}) cannot be evenly distributed across ${studentCount} students.`);
        return;
    }

    const totalPages = studentCount * pagesPerExam;
    if (actualTotalPages !== totalPages) {
        const msg = `PDF page count mismatch: expected ${totalPages} pages (${studentCount} students × ${pagesPerExam} pages per exam) but got ${actualTotalPages} pages. Please verify the PDF file is correct.`;
        await markMatchError(schedule, documentId, msg);
        return;
    }

    logMatchStep(documentId, `validated PDF structure: ${actualTotalPages} pages = ${studentCount} students × ${pagesPerExam} pages per exam`);

    // 5.2 把PDF转换成图片
    // 创建public/pipeline/{scheduleDocumentId}/all文件夹,保存PDF的所有图片
    const pipelineDir = path.join(rootDir, 'public', 'pipeline', schedule.documentId);
    logMatchStep(documentId, `preparing pipeline directory: ${pipelineDir}`);
    
    if (fs.existsSync(pipelineDir)) {
        logMatchStep(documentId, `cleaning existing pipeline directory`);
        fs.rmSync(pipelineDir, { recursive: true, force: true });
    }
    fs.mkdirSync(pipelineDir, { recursive: true });

    logMatchStep(documentId, `converting PDF to images (${actualTotalPages} pages)...`);
    
    try {
        await pdf2png(pdfPath, pipelineDir);
        logMatchStep(documentId, "PDF conversion completed");
    } catch (error) {
        await markMatchError(schedule, documentId, `Failed to convert PDF to images: ${error instanceof Error ? error.message : 'unknown error'}`, error);
        return;
    }

    const pageImages = fs.readdirSync(pipelineDir)
        .filter((file) => /^page-\d+\.png$/i.test(file))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    logMatchStep(documentId, `found ${pageImages.length} page images: ${pageImages.slice(0, 3).join(', ')}${pageImages.length > 3 ? '...' : ''}`);

    if (pageImages.length !== actualTotalPages) {
        await markMatchError(schedule, documentId, `PDF conversion error: expected ${actualTotalPages} page images but found ${pageImages.length}. Conversion may have failed.`);
        return;
    }

    const papers: Paper[] = [];
    const headerComponent = components.find(com => com.type === "default-header");
    if (!headerComponent) {
        await markMatchError(schedule, documentId, "Unable to locate header component in exam definition. Please ensure the exam has a header component.");
        return;
    }
    const headerComponentId = headerComponent.id;
    const headerPageIndex = headerComponent.position?.pageIndex;
    
    // Ensure header has valid position data - create if missing or fix if invalid
    if (!headerComponent.position) {
        logMatchStep(documentId, `[HEADER WARNING] header component has no position data, creating default position at page 0`);
        headerComponent.position = {
            pageIndex: 0,
            top: 0,
            left: 0,
            width: 210,  // A4 width in mm
            height: 60,  // Approximate header height
        };
    } else if (typeof headerPageIndex !== 'number' || !Number.isFinite(headerPageIndex) || headerPageIndex < 0) {
        logMatchStep(documentId, `[HEADER WARNING] header component has invalid pageIndex (${headerPageIndex}), defaulting to page 0`);
        headerComponent.position.pageIndex = 0;
    } else if (headerPageIndex >= pagesPerExam) {
        logMatchStep(documentId, `[HEADER WARNING] header pageIndex (${headerPageIndex}) is >= pagesPerExam (${pagesPerExam}), defaulting to page 0`);
        headerComponent.position.pageIndex = 0;
    }
    
    // Validate position dimensions
    if (!headerComponent.position.width || !headerComponent.position.height) {
        logMatchStep(documentId, `[HEADER WARNING] header position missing dimensions, setting defaults (width: 210mm, height: 60mm)`);
        headerComponent.position.width = headerComponent.position.width || 210;
        headerComponent.position.height = headerComponent.position.height || 60;
    }
    
    logMatchStep(documentId, `found header component: id="${headerComponentId}", pageIndex=${headerComponent.position.pageIndex}, dimensions=${headerComponent.position.width}x${headerComponent.position.height}mm`);
    
    const headerTasks: { diskPath: string; paperIndex: number }[] = [];

    logMatchStep(documentId, `splitting PDF into ${studentCount} individual exam papers...`);

    for (let studentIndex = 0; studentIndex < studentCount; studentIndex++) {
        const paperId = createPaperId(studentIndex);
        const paperDir = path.join(pipelineDir, paperId);
        fs.mkdirSync(paperDir, { recursive: true });

        const startPage = studentIndex * pagesPerExam;
        const endPage = startPage + pagesPerExam;

        // Copy page images for this student's exam
        for (let pageOffset = 0; pageOffset < pagesPerExam; pageOffset++) {
            const globalPageIndex = startPage + pageOffset;
            const pageFileName = pageImages[globalPageIndex];
            if (!pageFileName) {
                await markMatchError(schedule, documentId, `Missing page image for global index ${globalPageIndex} (student ${studentIndex + 1}, page ${pageOffset + 1}).`);
                return;
            }

            const sourceImagePath = path.join(pipelineDir, pageFileName);
            const targetImagePath = path.join(paperDir, `page-${pageOffset}.png`);
            
            try {
                fs.copyFileSync(sourceImagePath, targetImagePath);
            } catch (error) {
                await markMatchError(schedule, documentId, `Failed to copy page image from ${sourceImagePath} to ${targetImagePath}: ${error instanceof Error ? error.message : 'unknown error'}`, error);
                return;
            }
        }
        
        if ((studentIndex + 1) % 10 === 0 || studentIndex === 0) {
            logMatchStep(documentId, `split paper ${studentIndex + 1}/${studentCount} (pages ${startPage + 1}-${endPage})`);
        }

        const questionsDir = path.join(paperDir, 'questions');
        fs.mkdirSync(questionsDir, { recursive: true });

        const questionImageMap: Record<string, string> = {};
        let headerDiskPath: string | null = null;
        let headerRelativePath: string | null = null;
        let extractedComponentCount = 0;
        let headerExtractionAttempted = false;

        // Extract component images from each page
        for (let pageOffset = 0; pageOffset < pagesPerExam; pageOffset++) {
            const imgPath = path.join(paperDir, `page-${pageOffset}.png`);
            
            let image: any;
            let imageInfo: any;
            
            try {
                image = sharp(imgPath);
                imageInfo = await image.metadata();
            } catch (error) {
                await markMatchError(schedule, documentId, `Failed to load page image ${imgPath}: ${error instanceof Error ? error.message : 'unknown error'}`, error);
                return;
            }

            const pageComponents = components
                .filter(com => com.position?.pageIndex === pageOffset)
                .sort((a, b) => {
                    const posA = a.position ?? { top: 0, left: 0 };
                    const posB = b.position ?? { top: 0, left: 0 };
                    if (posA.top !== posB.top) {
                        return posA.top - posB.top;
                    }
                    return posA.left - posB.left;
                });

            for (let compIndex = 0; compIndex < pageComponents.length; compIndex++) {
                const comp = pageComponents[compIndex];
                const rect = comp.position;
                const isHeaderComponent = comp.id === headerComponentId;

                if (isHeaderComponent) {
                    headerExtractionAttempted = true;
                }

                if (!rect || !imageInfo.width || !imageInfo.height) {
                    const msg = `skipping component ${comp.id} (type: ${comp.type}) on page ${pageOffset}: invalid position or image metadata`;
                    if (isHeaderComponent) {
                        logMatchStep(documentId, `[HEADER WARNING] ${msg} - rect=${!!rect}, imageInfo.width=${imageInfo.width}, imageInfo.height=${imageInfo.height}`);
                    } else {
                        logMatchStep(documentId, `[COMPONENT WARNING] ${msg}`);
                    }
                    continue;
                }

                const widthMm = Number(rect.width);
                const heightMm = Number(rect.height);
                if (!Number.isFinite(widthMm) || !Number.isFinite(heightMm) || widthMm <= 0 || heightMm <= 0) {
                    const msg = `skipping component ${comp.id} on page ${pageOffset}: invalid dimensions (${widthMm}×${heightMm}mm)`;
                    if (isHeaderComponent) {
                        logMatchStep(documentId, `[HEADER WARNING] ${msg} - width=${rect.width}, height=${rect.height}`);
                    } else {
                        logMatchStep(documentId, msg);
                    }
                    continue;
                }

                const leftMm = Number(rect.left ?? 0);
                const topMm = Number(rect.top ?? 0);

                const left = Math.max(mmToPixels(leftMm, imageInfo, "x") - PADDING, 0);
                const top = Math.max(mmToPixels(topMm, imageInfo, "y") - PADDING, 0);
                const widthPx = mmToPixels(widthMm, imageInfo, "x") + PADDING * 2;
                const heightPx = mmToPixels(heightMm, imageInfo, "y") + PADDING * 2;

                const maxWidth = imageInfo.width ?? 0;
                const maxHeight = imageInfo.height ?? 0;
                const extractWidth = Math.min(widthPx, Math.max(maxWidth - left, 0));
                const extractHeight = Math.min(heightPx, Math.max(maxHeight - top, 0));

                if (extractWidth <= 0 || extractHeight <= 0) {
                    logMatchStep(documentId, `skipping component ${comp.id} on page ${pageOffset}: computed dimensions invalid (${extractWidth}×${extractHeight}px)`);
                    continue;
                }

                const outputFileName = `page${pageOffset}_${compIndex}.png`;
                const outputFilePath = path.join(questionsDir, outputFileName);

                try {
                    await image.clone().extract({
                        left,
                        top,
                        width: extractWidth,
                        height: extractHeight,
                    }).toFile(outputFilePath);
                    
                    extractedComponentCount++;
                } catch (error) {
                    await markMatchError(schedule, documentId, `Failed to extract component ${comp.id} from page ${pageOffset} for student ${studentIndex + 1}: ${error instanceof Error ? error.message : 'unknown error'}`, error);
                    return;
                }

                const relativePath = toPosixPath('pipeline', schedule.documentId, paperId, 'questions', outputFileName);
                questionImageMap[comp.id] = relativePath;

                if (comp.id === headerComponentId) {
                    headerDiskPath = outputFilePath;
                    headerRelativePath = relativePath;
                }
            }
        }

        if (!headerDiskPath || !headerRelativePath) {
            const debugInfo = headerExtractionAttempted 
                ? `Header component "${headerComponentId}" was found but extraction failed. Check logs for skipped component warnings.` 
                : `Header component "${headerComponentId}" was not found on any page (0-${pagesPerExam-1}). Component may have invalid pageIndex.`;
            
            logMatchStep(documentId, `[HEADER ERROR] Paper ${paperId}: ${debugInfo}`);
            
            // Log all components with their pageIndex for debugging
            const componentPageMap = components
                .filter(c => c.id === headerComponentId)
                .map(c => `id=${c.id}, pageIndex=${c.position?.pageIndex}, type=${c.type}`)
                .join('; ');
            logMatchStep(documentId, `[HEADER DEBUG] Header component info: ${componentPageMap || 'not found'}`);
            
            await markMatchError(schedule, documentId, `Unable to locate header image for paper ${paperId} (student ${studentIndex + 1}). ${debugInfo} Please ensure the exam definition contains a header component with valid positioning data.`);
            return;
        }

        const paperIndex = papers.length;
        headerTasks.push({ diskPath: headerDiskPath, paperIndex });

        papers.push({
            paperId,
            startPage,
            endPage,
            name: '',
            studentId: '',
            headerImgUrl: headerRelativePath,
            studentDocumentId: '',
            questionImageMap,
        });
        
        if ((studentIndex + 1) % 10 === 0 || studentIndex === studentCount - 1) {
            logMatchStep(documentId, `extracted ${extractedComponentCount} components for paper ${studentIndex + 1}/${studentCount}`);
        }
        
        // Log extracted component details for debugging
        const extractedComponentIds = Object.keys(questionImageMap);
        if (extractedComponentIds.length < questionComponents.length) {
            const missingComponents = questionComponents.filter(c => !questionImageMap[c.id]);
            logMatchStep(documentId, `[WARNING] Paper ${paperId}: extracted ${extractedComponentIds.length}/${questionComponents.length} question components`);
            missingComponents.forEach(c => {
                logMatchStep(documentId, `  - Missing: ${c.id} (type: ${c.type}, pageIndex: ${c.position?.pageIndex})`);
            });
        }
    }
    
    logMatchStep(documentId, `completed splitting: created ${papers.length} papers with ${headerTasks.length} headers`);

    // Check for components without position data
    const componentsWithoutPosition = components.filter(c => !c.position || typeof c.position.pageIndex !== 'number');
    if (componentsWithoutPosition.length > 0) {
        logMatchStep(documentId, `[WARNING] ${componentsWithoutPosition.length} component(s) have no position data and will not be extracted:`);
        componentsWithoutPosition.forEach(c => {
            logMatchStep(documentId, `  - ${c.id} (type: ${c.type})`);
        });
        logMatchStep(documentId, `Please render the exam in the editor to calculate component positions, or these components will be unavailable for grading.`);
    }

    // 6. VLM识别姓名和学号
    // 6.1 识别所有header
    const modelName = process.env.MATCHING_MODEL_NAME ?? "configured model";
    logMatchStep(documentId, `starting header recognition for ${headerTasks.length} papers using ${modelName}...`);
    
    const scheduleId = schedule.documentId;
    let headerResults: { header: { name: string; studentId: string }; paperIndex: number }[];
    
    try {
        headerResults = await Promise.all(headerTasks.map(async ({ diskPath, paperIndex }, index) => {
            try {
                const header = await recognizeHeader(diskPath, {
                    scheduleId,
                    headerIndex: index,
                    totalHeaders: headerTasks.length,
                });
                
                if ((index + 1) % 10 === 0 || index === 0 || index === headerTasks.length - 1) {
                    logMatchStep(documentId, `recognized header ${index + 1}/${headerTasks.length}: name="${header.name}", studentId="${header.studentId}"`);
                }
                
                return { header, paperIndex };
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'unknown error';
                strapi.log.error(`startMatching(${documentId}): header recognition failed for paper ${paperIndex + 1} (${diskPath}): ${errorMsg}`, error instanceof Error ? error : undefined);
                throw error;
            }
        }));
        
        logMatchStep(documentId, `header recognition completed successfully for all ${headerResults.length} papers`);
    } catch (error) {
        // This will be caught by the outer try-catch and handled by markMatchError
        throw error;
    }

    // 6.2 更新papers数组,追加name和studentId
    headerResults.forEach(({ header, paperIndex }) => {
        const paper = papers[paperIndex];
        paper.name = header.name;
        paper.studentId = header.studentId;
    });
    
    logMatchStep(documentId, `updated paper metadata with recognized names and student IDs`);

    // 7. 和students和papers进行比对和关联
    const students = classData.students;
    logMatchStep(documentId, `matching ${papers.length} papers with ${students.length} students...`);

    // 创建匹配和未匹配记录
    const matchedPairs: { paper: Paper, student: Student }[] = []; // 已经匹配好的对
    const unmatchedPapers: Paper[] = []; // 未匹配到学生的试卷
    const matchedStudentIds = new Set<string>();

    // 第一轮：精确匹配
    for (const paper of papers) {
        const matchedStudent = students.find(student => student.studentId === paper.studentId);
        if (matchedStudent) {
            matchedPairs.push({
                paper,
                student: matchedStudent
            });
            matchedStudentIds.add(matchedStudent.studentId);
            logMatchStep(documentId, `exact match: ${paper.paperId} -> ${matchedStudent.studentId} (${matchedStudent.name})`);
        } else {
            unmatchedPapers.push(paper);
        }
    }
    
    // 第二轮：模糊匹配未匹配的试卷（用于处理 OCR 识别错误）
    const SIMILARITY_THRESHOLD = 0.75; // 75% 相似度阈值
    const stillUnmatched: Paper[] = [];
    
    for (const paper of unmatchedPapers) {
        // 跳过识别为 Unknown 的试卷
        if (paper.studentId === 'Unknown' || !paper.studentId) {
            stillUnmatched.push(paper);
            continue;
        }
        
        // 找到未匹配的学生中相似度最高的
        let bestMatch: Student | null = null;
        let bestSimilarity = 0;
        
        const availableStudents = students.filter(s => !matchedStudentIds.has(s.studentId));
        
        for (const student of availableStudents) {
            const similarity = calculateSimilarity(paper.studentId, student.studentId);
            if (similarity > bestSimilarity && similarity >= SIMILARITY_THRESHOLD) {
                bestSimilarity = similarity;
                bestMatch = student;
            }
        }
        
        if (bestMatch) {
            matchedPairs.push({
                paper,
                student: bestMatch
            });
            matchedStudentIds.add(bestMatch.studentId);
            logMatchStep(documentId, `fuzzy match (${(bestSimilarity * 100).toFixed(1)}% similar): ${paper.paperId} with studentId="${paper.studentId}" -> ${bestMatch.studentId} (${bestMatch.name})`);
        } else {
            stillUnmatched.push(paper);
            logMatchStep(documentId, `unmatched paper: ${paper.paperId}, recognized studentId="${paper.studentId}", name="${paper.name}"`);
        }
    }
    
    // 找出未匹配的学生
    const unmatchedStudents = students.filter(student => !matchedStudentIds.has(student.studentId));
    
    if (unmatchedStudents.length > 0) {
        logMatchStep(documentId, `unmatched students: ${unmatchedStudents.map(s => `${s.studentId} (${s.name})`).join(', ')}`);
    }
    
    // 记录匹配和未匹配信息
    logMatchStep(documentId, `matching complete: ${matchedPairs.length} matched (including fuzzy), ${stillUnmatched.length} unmatched papers, ${unmatchedStudents.length} unmatched students`);

    // 8. 更新Schedule的result和papers，添加匹配结果
    logMatchStep(documentId, "preparing result data...");
    
    const matchResult = {
        matched: matchedPairs.map(pair => ({
            studentId: pair.student.studentId,
            paperId: pair.paper.paperId,
            headerImgUrl: pair.paper.headerImgUrl,
        })),
        unmatched: {
            studentIds: unmatchedStudents.map(student => student.studentId),
            papers: stillUnmatched.map(paper => ({
                paperId: paper.paperId,
                headerImgUrl: paper.headerImgUrl,
            }))
        },
        done: stillUnmatched.length === 0 && unmatchedStudents.length === 0
    };
    
    const updatedResult = {
        ...schedule.result,
        papers,
        progress: 'MATCH_DONE' as const,
        matchResult,
    };

    schedule.result = {
        ...updatedResult,
        error: null,
    };

    logMatchStep(documentId, "saving results to database...");
    
    try {
        await persistScheduleResult(schedule);
        logMatchStep(documentId, "results saved successfully");
    } catch (error) {
        strapi.log.error(`startMatching(${documentId}): failed to persist results`, error instanceof Error ? error : undefined);
        throw error;
    }

    const statusMsg = matchResult.done 
        ? "matching completed successfully - all papers and students matched" 
        : `matching completed with ${stillUnmatched.length} unmatched papers and ${unmatchedStudents.length} unmatched students`;
    logMatchStep(documentId, statusMsg);

    // END: 当前流水线结束，在前端展示结果，前端通过接口开启下一个流水线
    } catch (error) {
        if (schedule) {
            const message = (() => {
                if (error instanceof LLMRequestError) {
                    const meta = error.meta ?? {};
                    const header = typeof meta.header === "string" ? meta.header : undefined;
                    const model = typeof meta.model === "string" ? meta.model : undefined;
                    const parts = [error.message];
                    if (header || model) {
                        const contextParts = [header ? `header ${header}` : null, model ? `via ${model}` : null].filter(Boolean);
                        parts.push(`(${contextParts.join(" ")})`);
                    }
                    return parts.join(" ");
                }
                return error instanceof Error ? error.message : 'Unknown matching error';
            })();

            await markMatchError(
                schedule,
                documentId,
                message,
                error,
            );
        } else {
            strapi.log.error(`startMatching(${documentId}) failed before schedule initialisation`, error instanceof Error ? error : undefined);
        }
    }
}
