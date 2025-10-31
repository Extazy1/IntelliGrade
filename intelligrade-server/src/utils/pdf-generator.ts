import fs from "fs/promises";
import path from "path";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type {
  BlankComponent,
  ExamResponse,
  FillInBlankQuestionData,
  MultipleChoiceQuestionData,
  OpenQuestionData,
  UnionComponent,
} from "../../types/exam";

const A4_WIDTH = 595.28; // 210mm
const A4_HEIGHT = 841.89; // 297mm
const DEFAULT_MARGIN = 50;
const LINE_SPACING = 1.35;

const htmlEntityMap: Record<string, string> = {
  "&nbsp;": " ",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

const decodeHtmlEntities = (value: string) =>
  value.replace(/(&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;)/g, (match) => htmlEntityMap[match] ?? match);

const htmlToPlainText = (value: string) =>
  decodeHtmlEntities(
    value
      .replace(/<\s*br\s*\/?\s*>/gi, "\n")
      .replace(/<\/?p[^>]*>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\u00a0/g, " ")
    .replace(/\$\{input\}/g, "__________")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const wrapText = (text: string, font: PDFFont, fontSize: number, maxWidth: number) => {
  if (!text) {
    return [""];
  }

  const lines: string[] = [];
  const paragraphs = text.split(/\r?\n/);

  const wrapParagraph = (paragraph: string) => {
    const words = paragraph.split(/\s+/).filter(Boolean);

    if (!words.length) {
      lines.push("");
      return;
    }

    let currentLine = "";

    const pushCurrentLine = () => {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = "";
      }
    };

    const pushLongWord = (word: string) => {
      let buffer = "";
      for (const char of word) {
        const candidate = buffer + char;
        if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
          buffer = candidate;
        } else {
          if (buffer) {
            lines.push(buffer);
          }
          buffer = char;
        }
      }
      if (buffer) {
        currentLine = buffer;
      }
    };

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
        pushLongWord(word);
      } else {
        currentLine = word;
      }
    }

    pushCurrentLine();
  };

  paragraphs.forEach((paragraph, index) => {
    wrapParagraph(paragraph.trim());
    if (index < paragraphs.length - 1) {
      lines.push("");
    }
  });

  return lines.length ? lines : [""];
};

class PdfBuilder {
  private readonly doc: PDFDocument;

  private page: PDFPage;

  private cursor: number;

  private readonly regularFont: PDFFont;

  private readonly boldFont: PDFFont;

  private readonly margin: number;

  constructor(doc: PDFDocument, regularFont: PDFFont, boldFont: PDFFont, margin = DEFAULT_MARGIN) {
    this.doc = doc;
    this.regularFont = regularFont;
    this.boldFont = boldFont;
    this.margin = margin;
    this.page = this.doc.addPage([A4_WIDTH, A4_HEIGHT]);
    this.cursor = this.page.getHeight() - this.margin;
  }

  private addPage() {
    this.page = this.doc.addPage([A4_WIDTH, A4_HEIGHT]);
    this.cursor = this.page.getHeight() - this.margin;
  }

  private ensureSpace(height: number) {
    if (this.cursor - height < this.margin) {
      this.addPage();
    }
  }

  private advance(height: number) {
    this.ensureSpace(height);
    this.cursor -= height;
    return this.cursor;
  }

  private drawLine(text: string, font: PDFFont, fontSize: number, indent = 0) {
    const lineHeight = fontSize * LINE_SPACING;
    const baseline = this.advance(lineHeight);
    const x = this.margin + indent;
    this.page.drawText(text, {
      x,
      y: baseline,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
      maxWidth: this.page.getWidth() - this.margin * 2 - indent,
    });
  }

  private moveDown(points: number) {
    if (points <= 0) {
      return;
    }
    this.advance(points);
  }

  private drawParagraph(options: {
    text: string;
    font?: PDFFont;
    fontSize?: number;
    indent?: number;
    gapAfter?: number;
  }) {
    const {
      text,
      font = this.regularFont,
      fontSize = 12,
      indent = 0,
      gapAfter = fontSize * 0.6,
    } = options;

    const sanitized = htmlToPlainText(text);
    const lines = wrapText(sanitized, font, fontSize, this.page.getWidth() - this.margin * 2 - indent);

    lines.forEach((line) => {
      if (!line.trim()) {
        this.moveDown(fontSize * LINE_SPACING);
      } else {
        this.drawLine(line, font, fontSize, indent);
      }
    });

    this.moveDown(gapAfter);
  }

  private drawCentered(text: string, font: PDFFont, fontSize: number, gapAfter = fontSize) {
    const lineHeight = fontSize * LINE_SPACING;
    const baseline = this.advance(lineHeight);
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const availableWidth = this.page.getWidth() - this.margin * 2;
    const x = this.margin + Math.max((availableWidth - textWidth) / 2, 0);
    this.page.drawText(text, {
      x,
      y: baseline,
      size: fontSize,
      font,
      color: rgb(0, 0, 0),
    });
    this.moveDown(gapAfter);
  }

  private drawDivider() {
    const gap = 12;
    const baseline = this.advance(gap);
    const startX = this.margin;
    const endX = this.page.getWidth() - this.margin;
    this.page.drawLine({
      start: { x: startX, y: baseline },
      end: { x: endX, y: baseline },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.7),
    });
    this.moveDown(6);
  }

  private drawBlankLines(count: number, indent = 0) {
    const startX = this.margin + indent;
    const endX = this.page.getWidth() - this.margin;
    for (let i = 0; i < count; i += 1) {
      const baseline = this.advance(18);
      this.page.drawLine({
        start: { x: startX, y: baseline + 4 },
        end: { x: endX, y: baseline + 4 },
        thickness: 0.5,
        color: rgb(0.2, 0.2, 0.2),
      });
    }
    this.moveDown(6);
  }

  renderExam(exam: ExamResponse) {
    const title = exam.examData?.title || exam.projectName || "Exam";
    this.drawCentered(title, this.boldFont, 20, 12);

    const subtitleParts = [exam.examData?.university, exam.examData?.course].filter(Boolean);
    if (subtitleParts.length) {
      this.drawCentered(subtitleParts.join(" • "), this.regularFont, 12, 6);
    }

    const metaLines: string[] = [];
    if (exam.examData?.duration) {
      metaLines.push(`Duration: ${exam.examData.duration}`);
    }
    if (exam.examData?.examDate) {
      metaLines.push(`Exam Date: ${exam.examData.examDate}`);
    }
    if (exam.examData?.semester || exam.examData?.year) {
      metaLines.push(
        `Term: ${[exam.examData.semester, exam.examData.year].filter(Boolean).join(" ")}`
      );
    }

    if (metaLines.length) {
      metaLines.forEach((line) => {
        this.drawCentered(line, this.regularFont, 11, 4);
      });
      this.moveDown(8);
    }

    if (exam.examData?.description) {
      this.drawParagraph({
        text: `Description: ${htmlToPlainText(exam.examData.description)}`,
        fontSize: 12,
      });
      this.moveDown(6);
    }

    this.drawDivider();

    exam.examData?.components?.forEach((component) => {
      this.renderComponent(component);
    });
  }

  private renderComponent(component: UnionComponent) {
    switch (component.type) {
      case "multiple-choice":
        this.renderMultipleChoice(component);
        break;
      case "fill-in-blank":
        this.renderFillInBlank(component);
        break;
      case "open":
        this.renderOpenQuestion(component);
        break;
      case "blank":
        this.renderBlankSection(component);
        break;
      case "divider":
        this.drawDivider();
        break;
      default:
        // default-header or unknown components
        break;
    }
  }

  private renderQuestionHeading(
    component: MultipleChoiceQuestionData | FillInBlankQuestionData | OpenQuestionData
  ) {
    const heading = `${component.questionNumber}. (${component.score} pts)`;
    this.drawParagraph({
      text: heading,
      font: this.boldFont,
      fontSize: 13,
      gapAfter: 2,
    });
  }

  private renderMultipleChoice(component: MultipleChoiceQuestionData) {
    this.renderQuestionHeading(component);
    this.drawParagraph({
      text: component.question,
      fontSize: 12,
      gapAfter: 4,
    });

    component.options.forEach((option) => {
      this.drawParagraph({
        text: `${option.label}. ${htmlToPlainText(option.content)}`,
        fontSize: 11,
        indent: 16,
        gapAfter: 2,
      });
    });

    this.moveDown(10);
  }

  private renderFillInBlank(component: FillInBlankQuestionData) {
    this.renderQuestionHeading(component);
    this.drawParagraph({ text: component.content, fontSize: 12, gapAfter: 8 });
    this.drawBlankLines(1);
  }

  private renderOpenQuestion(component: OpenQuestionData) {
    this.renderQuestionHeading(component);
    this.drawParagraph({ text: component.content, fontSize: 12, gapAfter: 6 });
    this.drawBlankLines(Math.max(component.lines, 3));
  }

  private renderBlankSection(component: BlankComponent) {
    this.drawBlankLines(Math.max(component.lines, 1));
  }
}

export const generateExamPdf = async (exam: ExamResponse, pdfPath: string) => {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const builder = new PdfBuilder(pdfDoc, regularFont, boldFont);
  builder.renderExam(exam);

  const pdfBytes = await pdfDoc.save();
  await fs.mkdir(path.dirname(pdfPath), { recursive: true });
  await fs.writeFile(pdfPath, pdfBytes);
};
