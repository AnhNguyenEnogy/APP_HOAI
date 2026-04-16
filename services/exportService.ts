
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from "docx";
import saveAs from "file-saver";
import { AnalysisReport } from "../types";

export function exportToTxt(report: AnalysisReport, filename: string, version: number) {
  const content = `
BÁO CÁO THẨM ĐỊNH HỌC THUẬT EDUPRO
---------------------------------------

A. THÔNG TIN CHUNG
- Tên văn bản: ${filename || 'Văn bản nhập trực tiếp'}
- Phiên bản: Lần ${version}
- Thời điểm: ${new Date().toLocaleString('vi-VN')}

B. KẾT QUẢ ĐỊNH LƯỢNG TỔNG HỢP
- Nguy cơ đạo văn: ${report.metrics.plagiarism}%
- Dấu hiệu AI: ${report.metrics.aiSign}%
- Tính cá nhân: ${report.metrics.personalVoice}%
- Tính thực tế: ${report.metrics.practicality}%

C. PHÂN TÍCH CHI TIẾT THEO ĐOẠN
${report.segments.map((seg, i) => `
Đoạn ${i + 1}:
- Nội dung: "${seg.text.substring(0, 100)}..."
- % Đạo văn: ${seg.plagiarismPercent}%
- % AI: ${seg.aiPercent}%
- Nhận xét: ${seg.comments}
- Nguồn: ${seg.likelySource || 'Không xác định'}
`).join('\n')}

D. KẾT LUẬN ĐÁNH GIÁ THEO HỘI ĐỒNG (QUAN TRỌNG)
- XẾP LOẠI: ${report.boardEvaluation.rating}
- Nhận xét tổng quát: ${report.boardEvaluation.generalComment}
- Ưu điểm: ${report.boardEvaluation.pros.join(', ')}
- Hạn chế: ${report.boardEvaluation.cons.join(', ')}
- Kiến nghị hội đồng: ${report.boardEvaluation.recommendation}

E. KIẾN NGHỊ CHỈNH SỬA
${report.suggestions.map((s, i) => `
Kiến nghị ${i + 1}:
- Mục tiêu: ${s.impactGoal}
- Gốc: ${s.originalText}
- Sửa: ${s.suggestedRewrite}
- Lý do: ${s.reason}
`).join('\n')}

--- Hết báo cáo ---
  `;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  saveAs(blob, `EduPro_BaoCao_${new Date().getTime()}.txt`);
}

export async function exportToDocx(report: AnalysisReport, filename: string, version: number) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: "BÁO CÁO THẨM ĐỊNH HỌC THUẬT EDUPRO",
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: "" }),

        new Paragraph({ text: "A. THÔNG TIN CHUNG", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: "Tên văn bản: ", bold: true }), new TextRun(filename || "Văn bản nhập trực tiếp")] }),
        new Paragraph({ children: [new TextRun({ text: "Phiên bản: ", bold: true }), new TextRun(`Lần ${version}`)] }),
        new Paragraph({ children: [new TextRun({ text: "Thời điểm: ", bold: true }), new TextRun(new Date().toLocaleString('vi-VN'))] }),
        new Paragraph({ text: "" }),

        new Paragraph({ text: "B. KẾT QUẢ ĐỊNH LƯỢNG TỔNG HỢP", heading: HeadingLevel.HEADING_1 }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [new TableCell({ children: [new Paragraph("Chỉ số")] }), new TableCell({ children: [new Paragraph("Tỷ lệ (%)")] })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph("Nguy cơ đạo văn")] }), new TableCell({ children: [new Paragraph(`${report.metrics.plagiarism}%`)] })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph("Dấu hiệu AI")] }), new TableCell({ children: [new Paragraph(`${report.metrics.aiSign}%`)] })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph("Tính cá nhân")] }), new TableCell({ children: [new Paragraph(`${report.metrics.personalVoice}%`)] })] }),
            new TableRow({ children: [new TableCell({ children: [new Paragraph("Tính thực tế")] }), new TableCell({ children: [new Paragraph(`${report.metrics.practicality}%`)] })] }),
          ],
        }),
        new Paragraph({ text: "" }),

        new Paragraph({ text: "C. PHÂN TÍCH CHI TIẾT THEO ĐOẠN", heading: HeadingLevel.HEADING_1 }),
        ...report.segments.flatMap((seg, i) => [
          new Paragraph({ children: [new TextRun({ text: `Đoạn ${i + 1}:`, bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: `"${seg.text}"`, italics: true })] }),
          new Paragraph({ children: [new TextRun({ text: `- % Đạo văn: `, bold: true }), new TextRun(`${seg.plagiarismPercent}%`)] }),
          new Paragraph({ children: [new TextRun({ text: `- % AI: `, bold: true }), new TextRun(`${seg.aiPercent}%`)] }),
          new Paragraph({ children: [new TextRun({ text: `- Nhận xét: `, bold: true }), new TextRun(seg.comments)] }),
          new Paragraph({ text: "" }),
        ]),

        new Paragraph({ text: "D. KẾT LUẬN ĐÁNH GIÁ THEO HỘI ĐỒNG", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: "XẾP LOẠI: ", bold: true }), new TextRun({ text: report.boardEvaluation.rating, bold: true, color: "0000FF" })] }),
        new Paragraph({ text: `Nhận xét: ${report.boardEvaluation.generalComment}` }),
        new Paragraph({ children: [new TextRun({ text: "Ưu điểm: ", bold: true }), new TextRun(report.boardEvaluation.pros.join(", "))] }),
        new Paragraph({ children: [new TextRun({ text: "Hạn chế: ", bold: true }), new TextRun(report.boardEvaluation.cons.join(", "))] }),
        new Paragraph({ children: [new TextRun({ text: "Kiến nghị: ", bold: true }), new TextRun({ text: report.boardEvaluation.recommendation, bold: true })] }),
        new Paragraph({ text: "" }),

        new Paragraph({ text: "E. KIẾN NGHỊ CHỈNH SỬA", heading: HeadingLevel.HEADING_1 }),
        ...report.suggestions.flatMap((s, i) => [
          new Paragraph({ children: [new TextRun({ text: `Kiến nghị ${i + 1} (${s.impactGoal}):`, bold: true })] }),
          new Paragraph({ children: [new TextRun({ text: `Gốc: "${s.originalText}"`, color: "666666" })] }),
          new Paragraph({ children: [new TextRun({ text: `Sửa: "${s.suggestedRewrite}"`, bold: true })] }),
          new Paragraph({ text: `Lý do: ${s.reason}` }),
          new Paragraph({ text: "" }),
        ]),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `EduPro_BaoCao_${new Date().getTime()}.docx`);
}
