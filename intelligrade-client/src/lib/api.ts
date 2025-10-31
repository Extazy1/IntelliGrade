import { ExamResponse } from "@/types/exam";
import { axiosInstance } from "./axios";
import { defaultExamData } from "@/mock/default-exam-data";
import { PDFReponse } from "@/components/landing-page/types";
import { Class, ExamSchedule, ExamScheduleResult, LLMSubjectiveInput, Student, SubjectiveLLMResponse } from "@/types/types";
import { defaultScheduleResult } from "@/mock/default-schedule-result";

const TEST_EXAM_ID = 'be82n8i3il88737l6hpw378q'
const TEST_STUDENTS_IDs = ['e3qrlbh166g0n3awbmfw6elo', 'ti9estvbsu5me28i7vu14u3m', 'hayxqtevvesmosqnudz2014u']
const TEST_CLASS_ID = 'q4p834olws2mr7mp9isy08z3'

const cloneDefaultScheduleResult = (): ExamScheduleResult =>
    JSON.parse(JSON.stringify(defaultScheduleResult));

const normaliseScheduleResult = <T extends { result: unknown }>(item: T): T & { result: ExamScheduleResult } => {
    let result = item.result as ExamScheduleResult | string | undefined | null;

    if (typeof result === "string") {
        try {
            result = JSON.parse(result) as ExamScheduleResult;
        } catch (error) {
            console.error("[pipeline] failed to parse schedule result", error);
            result = cloneDefaultScheduleResult();
        }
    } else if (!result || typeof result !== "object") {
        result = cloneDefaultScheduleResult();
    }

    if (typeof result.error === "undefined") {
        result.error = null;
    }

    return {
        ...item,
        result,
    };
};

const normaliseScheduleCollection = <T extends { result: unknown }>(items: T[]): Array<T & { result: ExamScheduleResult }> =>
    items.map((item) => normaliseScheduleResult(item));

export async function getExamByUserId(userDocumentId: string): Promise<{ data: ExamResponse[] }> {
    const response = await axiosInstance.get(`/exams?populate=*&filters[user][documentId][$eq]=${userDocumentId}&pagination[limit]=10000`);
    return response.data;
}

export async function getExamById(id: string): Promise<{ data: ExamResponse }> {
    const response = await axiosInstance.get(`/exams/${id}?pagination[limit]=10000`);
    return response.data;
}

export async function deleteExamById(id: string) {
    if (id === TEST_EXAM_ID) {
        alert('TEST_ONLY exam cannot be deleted')
        return
    }
    const response = await axiosInstance.delete(`/exams/${id}`);
    return response.data;
}

export async function createExam(projectName: string, userId: string) {
    const response = await axiosInstance.post('/exams', {
        data: {
            projectName,
            user: userId,
            examData: defaultExamData
        }
    });
    return response.data;
}

export async function updateExam(documentId: string, examData: ExamResponse) {
    if (documentId === TEST_EXAM_ID) {
        alert('TEST_ONLY exam cannot be modified')
        throw new Error('TEST_ONLY exam cannot be modified')
    }
    const updatedExamData: Partial<ExamResponse> = {
        projectName: examData.projectName,
        examData: examData.examData
    }
    const response = await axiosInstance.put(`/exams/${documentId}`, {
        data: updatedExamData
    });
    return response.data;
}

const shouldForceHttp = () =>
    (process.env.NEXT_PUBLIC_PDF_FORCE_HTTP ?? "true").toLowerCase() !== "false";

const ensureAbsolutePdfUrl = (rawUrl: string) => {
    if (typeof window === "undefined") {
        return rawUrl;
    }

    try {
        const resolved = new URL(rawUrl, window.location.origin);

        if (shouldForceHttp()) {
            resolved.protocol = "http:";
        }

        return resolved.toString();
    } catch (error) {
        console.warn("[pdf] failed to normalise url", error);
        return rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
    }
};

export async function getExportedPDFUrl(documentId: string) {
    const response = await axiosInstance.get<PDFReponse>(`/pdfs/${documentId}`);
    const payload = response.data as PDFReponse & {
        error?: { message?: string };
        success?: boolean;
    };

    if (!payload?.data?.url) {
        const message = payload?.error?.message || "PDF generation failed";
        throw new Error(message);
    }

    return ensureAbsolutePdfUrl(payload.data.url);
}

/**
 * 获取用户的学生列表
 * Strapi的BUG，只能通过id查询用户，不能用documentId...
 * @param userId 
 * @returns 
 */
export async function getStudentByUserId(userId: string): Promise<Student[]> {
    const response = await axiosInstance.get(`/users/${userId}?populate=students&pagination[limit]=10000`);
    return response.data.students;
}

export async function createStudent(userDocumentId: string, student: { name: string, studentId: string }) {
    // 1. 先检查数据库中有没有userId相同的学生
    const sameStudents = await axiosInstance.get(`/students?populate=*&filters[studentId][$eq]=${student.studentId}&pagination[limit]=10000`);
    // 如果存在，则给学生添加老师
    if (sameStudents.data.data.length > 0) {
        const response = await axiosInstance.put(`/students/${sameStudents.data.data[0].documentId}`, {
            data: {
                teacher: {
                    connect: [userDocumentId]
                }
            }
        });
        return response.data;
    } else {
        // 2. 创建学生
        const response = await axiosInstance.post(`/students`, {
            data: {
                name: student.name,
                studentId: student.studentId,
                teacher: {
                    connect: [userDocumentId]
                }
            }
        });
        return response.data;
    }
}

/**
 * 不真实删除，只是从teacher中移除
 */
export async function deleteStudentById(userDocumentId: string, studentDocumentId: string) {
    if (TEST_STUDENTS_IDs.includes(studentDocumentId)) {
        alert('TEST_ONLY student cannot be deleted')
        return
    }
    // 1. 先检查这个学生有没有绑定的导师
    const teacher = await axiosInstance.get(`/students/${studentDocumentId}?populate=teacher&pagination[limit]=10000`);
    // 2. 如果这个学生有绑定的导师,且大于一个，则删除当前老师
    if (teacher.data.data.teacher.length > 1) {
        const response = await axiosInstance.put(`/students/${studentDocumentId}`, {
            data: {
                teacher: {
                    disconnect: [userDocumentId]
                }
            }
        });
        return response.data;
    } else {
        // 3. 如果这个学生有绑定的导师,且只有一个，则删除当前学生
        const response = await axiosInstance.delete(`/students/${studentDocumentId}`);
        return response.data;
    }
}

export async function createNewClass(className: string, studentsDocIds: string[], teacherDocId: string) {
    const response = await axiosInstance.post(`/classes`, {
        data: {
            name: className,
            students: studentsDocIds,
            teacher: teacherDocId
        }
    });
    return response.data;
}

export async function getAllClassesByUserId(userDocumentId: string): Promise<Class[]> {
    const response = await axiosInstance.get(`/classes?populate=*&filters[teacher][documentId][$eq]=${userDocumentId}&pagination[limit]=10000`);
    return response.data.data;
}

export async function getClassById(classDocumentId: string): Promise<Class> {
    const response = await axiosInstance.get(`/classes/${classDocumentId}?populate=*&pagination[limit]=10000`);
    return response.data.data;
}

/**
 * Update the students in a class
 * @param classDocumentId The document ID of the class to update
 * @param studentDocIds Array of student document IDs to assign to the class
 */
export async function updateClassStudents(classDocumentId: string, studentDocIds: string[]) {
    const response = await axiosInstance.put(`/classes/${classDocumentId}`, {
        data: {
            students: {
                set: studentDocIds
            }
        }
    });
    return response.data;
}

export async function deleteClassById(classDocumentId: string) {
    if (classDocumentId === TEST_CLASS_ID) {
        alert('TEST_ONLY class cannot be deleted')
        return
    }
    const response = await axiosInstance.delete(`/classes/${classDocumentId}`);
    return response.data;
}

export async function getExamSchedulesByUserId(userDocumentId: string): Promise<ExamSchedule[]> {
    const response = await axiosInstance.get(`/schedules?populate=*&filters[teacher][documentId][$eq]=${userDocumentId}&pagination[limit]=10000`);
    const schedules = Array.isArray(response.data.data) ? response.data.data : [];
    return normaliseScheduleCollection(schedules) as ExamSchedule[];
}

export async function getExamScheduleById(examScheduleDocumentId: string): Promise<ExamSchedule> {
    const response = await axiosInstance.get(`/schedules/${examScheduleDocumentId}?populate=*`);
    return normaliseScheduleResult(response.data.data) as ExamSchedule;
}

export async function createExamSchedule(examSchedule: {
    name: string;
    exam: string;
    class: string;
    teacher: string;
}) {
    const response = await axiosInstance.post(`/schedules`, {
        data: {
            ...examSchedule,
            result: defaultScheduleResult
        }
    });
    return response.data;
}

export async function deleteExamScheduleById(examScheduleDocumentId: string) {
    const response = await axiosInstance.delete(`/schedules/${examScheduleDocumentId}`);
    return response.data;
}

export async function uploadPDF(formData: FormData, examScheduleDocumentId: string) {
    const response = await axiosInstance.post('/upload', formData); // 上传PDF
    const pdfUrl = response.data[0].url
    // 更新examSchedule的progress和pdfId
    await axiosInstance.put(`/schedules/${examScheduleDocumentId}`, {
        data: {
            result: {
                ...defaultScheduleResult,
                progress: 'UPLOADED',
                pdfUrl: pdfUrl
            }
        }
    });
    return response.data;
}

export async function startMatching(examScheduleDocumentId: string) {
    const response = await axiosInstance.post(`/schedules/${examScheduleDocumentId}/startMatching`);
    const result = await axiosInstance.get(`/schedules/${examScheduleDocumentId}`);
    const normalisedSchedule = normaliseScheduleResult(result.data.data);
    await axiosInstance.put(`/schedules/${examScheduleDocumentId}`, {
        data: {
            result: {
                ...normalisedSchedule.result,
                progress: 'MATCH_START', // 开始匹配
                error: null,
            }
        }
    });
    return response.data;
}

export async function updateExamSchedule(examScheduleDocumentId: string, examSchedule: Partial<ExamSchedule>) {
    const response = await axiosInstance.put(`/schedules/${examScheduleDocumentId}`, {
        data: examSchedule
    });
    return response.data;
}

export async function startMarkingObjective(examScheduleDocumentId: string) {
    const response = await axiosInstance.post(`/schedules/${examScheduleDocumentId}/startObjective`);
    return response.data;
}

export async function startSubjective(examScheduleDocumentId: string) {
    const response = await axiosInstance.post(`/schedules/${examScheduleDocumentId}/startSubjective`);
    return response.data;
}

export async function getSubjectiveLLMResponse(requestBody: LLMSubjectiveInput): Promise<SubjectiveLLMResponse> {
    const response = await axiosInstance.post('/schedules/askSubjective', {
        question: requestBody.question,
        answer: requestBody.answer,
        score: requestBody.score,
        imageUrl: requestBody.imageUrl
    });
    return response.data;
}

// 开始计算结果的数据
export async function startResult(examScheduleDocumentId: string) {
    const response = await axiosInstance.post(`/schedules/${examScheduleDocumentId}/calcResult`);
    return response.data;
}