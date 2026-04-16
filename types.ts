
export enum RiskLevel {
  LOW = 'Thấp',
  MEDIUM = 'Trung bình',
  HIGH = 'Cao rủi ro'
}

export type BoardRating = 'ĐẠT YÊU CẦU' | 'ĐẠT Ở MỨC TRUNG BÌNH' | 'CHƯA ĐẠT YÊU CẦU';

export interface BoardEvaluation {
  rating: BoardRating;
  generalComment: string;
  pros: string[];
  cons: string[];
  recommendation: string;
}

export interface PlagiarismFinding {
  excerpt: string;
  sourceDescription: string;
  sourceLink?: string;
  analysis: string;
  percent: number;
}

export interface SegmentAnalysis {
  text: string;
  plagiarismPercent: number;
  aiPercent: number;
  comments: string;
  likelySource?: string;
  sourceUrl?: string;
}

export interface AISignDetails {
  rhythm: string;
  repetition: string;
  balance: string;
  personalization: string;
  riskScore: number;
}

export interface EditSuggestion {
  originalText: string;
  suggestedRewrite: string;
  reason: string;
  impactGoal: 'Giảm đạo văn' | 'Giảm AI' | 'Tăng cá nhân' | 'Tăng thực tế';
}

export interface RevisionDetail {
  segment: string;
  changeType: 'Nhẹ' | 'Trung bình' | 'Đáng kể';
  description: string;
}

export interface AnalysisReport {
  metrics: {
    plagiarism: number;
    aiSign: number;
    personalVoice: number;
    practicality: number;
  };
  segments: SegmentAnalysis[];
  overallRisk: RiskLevel;
  styleCompatibility: string;
  suitabilityForBoard: 'Có' | 'Cần chỉnh sửa' | 'Chưa phù hợp';
  finalConclusion: string;
  boardEvaluation: BoardEvaluation;
  suggestions: EditSuggestion[];
  plagiarismAnalysis: {
    ideaOverlap: string;
    structureOverlap: string;
    expressionOverlap: string;
    academicLogic: string;
    findings: PlagiarismFinding[];
  };
  aiDetection: AISignDetails;
  isIdenticalToPrevious?: boolean;
  isRevision?: boolean;
  revisionDetails?: RevisionDetail[];
}

export interface HistoryItem {
  text: string;
  report: AnalysisReport;
  timestamp: number;
}
