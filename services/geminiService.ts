
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisReport, HistoryItem } from "../types";

const SYSTEM_INSTRUCTION = `Bạn là một trợ lý chuyên gia cấp cao trong lĩnh vực giáo dục và ngôn ngữ học tiếng Việt. 
Nhiệm vụ của bạn là thẩm định định lượng văn bản giáo dục (SKKN, luận văn) theo các tiêu chí chuyên sâu.

CƠ CHẾ ĐÁNH GIÁ ĐỊNH LƯỢNG (%):
1. Nguy cơ đạo văn (Plagiarism Risk %): Dựa trên ý tưởng phổ biến, cấu trúc quen thuộc, diễn đạt rập khuôn.
2. Dấu hiệu AI (AI Signs %): Đánh giá độ "mượt" và tính phi cá nhân.
3. Tính cá nhân (Personal Voice %): Dấu ấn riêng, trải nghiệm thực tế.
4. Tính thực tế (Practicality %): Khả năng áp dụng tại lớp học Việt Nam.

CƠ CHẾ ĐÁNH GIÁ KẾT QUẢ CUỐI CÙNG THEO CHUẨN HỘI ĐỒNG (BẮT BUỘC):
Đưa ra đánh giá tổng hợp theo quy trình của Hội đồng chấm SKKN/Nghiên cứu sư phạm.

CĂN CỨ ĐÁNH GIÁ:
- Nội dung và tính khoa học: Lập luận logic, mạch lạc.
- Tính mới và tính sáng tạo: Không trùng lặp máy móc.
- Tính trung thực học thuật: Ngưỡng đạo văn cho phép.
- Dấu ấn cá nhân: Trải nghiệm, quan sát thực tế.
- Hình thức trình bày: Đúng chuyên môn.

NGƯỠNG THAM CHIẾU XẾP LOẠI:
- Đạo văn: Thấp (<=15%), TB (16-30%), Cao (>30%).
- Dấu hiệu AI: Thấp (<=30%), TB (31-50%), Cao (>50%).
- Tính cá nhân & thực tế: Tốt (>=50%), TB (30-49%), Thấp (<30%).

TRÌNH BÀY KẾT LUẬN ĐÁNH GIÁ THEO HỘI ĐỒNG:
- Xếp loại: ĐẠT YÊU CẦU / ĐẠT Ở MỨC TRUNG BÌNH / CHƯA ĐẠT YÊU CẦU.
- Nhận xét tổng quát: Ưu điểm, hạn chế.
- Kiến nghị: Có thể nộp / Cần sửa / Cần xây dựng lại.

TRẢ VỀ: JSON chính xác theo schema.`;

export async function analyzePedagogicalText(text: string, previousAnalysis?: HistoryItem, fileName?: string): Promise<AnalysisReport> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  
  const sourceContext = fileName ? `(Nội dung trích xuất từ file: ${fileName})` : "";
  let userPrompt = `Hãy thẩm định định lượng văn bản sư phạm sau đây ${sourceContext}: \n\n${text}`;
  
  if (previousAnalysis) {
    userPrompt = `Đây là văn bản sư phạm mới ${sourceContext}: \n\n${text}\n\n--- THÔNG TIN PHIÊN BẢN TRƯỚC ---\nKết quả thẩm định cũ: ${JSON.stringify(previousAnalysis.report)}\nVăn bản cũ: ${previousAnalysis.text}\n\nNhiệm vụ: So sánh và giữ vững logic nhất quán.`;
  }

  const response = await ai.models.generateContent({
    model: 'gemini-1.5-pro',
    contents: userPrompt,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          metrics: {
            type: Type.OBJECT,
            properties: {
              plagiarism: { type: Type.NUMBER },
              aiSign: { type: Type.NUMBER },
              personalVoice: { type: Type.NUMBER },
              practicality: { type: Type.NUMBER }
            },
            required: ["plagiarism", "aiSign", "personalVoice", "practicality"]
          },
          segments: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                plagiarismPercent: { type: Type.NUMBER },
                aiPercent: { type: Type.NUMBER },
                comments: { type: Type.STRING },
                likelySource: { type: Type.STRING },
                sourceUrl: { type: Type.STRING }
              },
              required: ["text", "plagiarismPercent", "aiPercent", "comments"]
            }
          },
          overallRisk: { type: Type.STRING },
          styleCompatibility: { type: Type.STRING },
          suitabilityForBoard: { type: Type.STRING },
          finalConclusion: { type: Type.STRING },
          boardEvaluation: {
            type: Type.OBJECT,
            properties: {
              rating: { type: Type.STRING, enum: ['ĐẠT YÊU CẦU', 'ĐẠT Ở MỨC TRUNG BÌNH', 'CHƯA ĐẠT YÊU CẦU'] },
              generalComment: { type: Type.STRING },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              recommendation: { type: Type.STRING }
            },
            required: ["rating", "generalComment", "pros", "cons", "recommendation"]
          },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                originalText: { type: Type.STRING },
                suggestedRewrite: { type: Type.STRING },
                reason: { type: Type.STRING },
                impactGoal: { type: Type.STRING }
              }
            }
          },
          plagiarismAnalysis: {
            type: Type.OBJECT,
            properties: {
              ideaOverlap: { type: Type.STRING },
              structureOverlap: { type: Type.STRING },
              expressionOverlap: { type: Type.STRING },
              academicLogic: { type: Type.STRING },
              findings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    excerpt: { type: Type.STRING },
                    sourceDescription: { type: Type.STRING },
                    sourceLink: { type: Type.STRING },
                    analysis: { type: Type.STRING },
                    percent: { type: Type.NUMBER }
                  }
                }
              }
            }
          },
          aiDetection: {
            type: Type.OBJECT,
            properties: {
              rhythm: { type: Type.STRING },
              repetition: { type: Type.STRING },
              balance: { type: Type.STRING },
              personalization: { type: Type.STRING },
              riskScore: { type: Type.NUMBER }
            }
          },
          isIdenticalToPrevious: { type: Type.BOOLEAN }
        },
        required: ["metrics", "segments", "overallRisk", "suitabilityForBoard", "finalConclusion", "boardEvaluation", "suggestions", "plagiarismAnalysis", "aiDetection"]
      }
    }
  });

  try {
    const report: AnalysisReport = JSON.parse(response.text || '{}');
    return report;
  } catch (error) {
    console.error("Failed to parse AI response", error);
    throw new Error("Không thể phân tích dữ liệu trả về từ hệ thống.");
  }
}
