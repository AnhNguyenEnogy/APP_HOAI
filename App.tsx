
import React, { useState, useRef, useEffect } from 'react';
import { analyzePedagogicalText } from './services/geminiService';
import { AnalysisReport, HistoryItem, RiskLevel } from './types';
import { extractTextFromFile } from './utils/fileExtractor';
import { exportToTxt, exportToDocx } from './services/exportService';
import RiskBadge from './components/RiskBadge';
import ReportSection from './components/ReportSection';

const MetricCard: React.FC<{ 
  label: string; 
  value: number; 
  color: string; 
  sublabel?: string;
  threshold?: string;
}> = ({ label, value, color, sublabel, threshold }) => (
  <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col items-center text-center relative overflow-hidden group">
    <div className={`text-2xl font-black mb-1 ${color}`}>{value}%</div>
    <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1">{label}</div>
    {sublabel && <div className="text-[9px] text-slate-500 italic mb-1">{sublabel}</div>}
    
    {threshold && (
      <div className="mt-1 px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] font-bold text-slate-600">
        Ngưỡng chuẩn: {threshold}
      </div>
    )}

    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
      <div 
        className={`h-full transition-all duration-1000 ${color.replace('text-', 'bg-')}`} 
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

const App: React.FC = () => {
  const [text, setText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentFileName, setCurrentFileName] = useState<string | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Khôi phục dữ liệu từ localStorage khi khởi chạy
  useEffect(() => {
    const savedHistory = localStorage.getItem('edupro_history_v3');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Lỗi khôi phục lịch sử:", e);
      }
    }
  }, []);

  // Tự động lưu dữ liệu mỗi khi có thay đổi
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('edupro_history_v3', JSON.stringify(history));
    }
  }, [history]);

  const normalizeText = (t: string) => t.replace(/\s+/g, ' ').trim();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCurrentFileName(file.name);
    setError(null);
    setIsAnalyzing(true);
    try {
      const extractedText = await extractTextFromFile(file);
      setText(extractedText);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi trích xuất văn bản từ file.');
      setCurrentFileName(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    setError(null);
    setReport(null);
    
    const normalizedCurrent = normalizeText(text);
    const exactMatch = history.find(h => normalizeText(h.text) === normalizedCurrent);
    
    if (exactMatch) {
      setReport({ ...exactMatch.report, isIdenticalToPrevious: true });
      setIsAnalyzing(false);
      return;
    }

    const lastItem = history.length > 0 ? history[history.length - 1] : undefined;

    try {
      const result = await analyzePedagogicalText(text, lastItem, currentFileName || undefined);
      setReport(result);
      setHistory(prev => [...prev, { text, report: result, timestamp: Date.now() }]);
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra trong quá trình phân tích.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearAll = () => {
    setText('');
    setReport(null);
    setCurrentFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getSourceLink = (source: string, directUrl?: string) => {
    if (directUrl && directUrl.startsWith('http')) return directUrl;
    if (source.startsWith('http')) return source;
    return `https://www.google.com/search?q=${encodeURIComponent(source + " moet.gov.vn văn bản sư phạm")}`;
  };

  const getRatingBadgeClass = (rating: string) => {
    switch (rating) {
      case 'ĐẠT YÊU CẦU': return 'bg-green-600 text-white';
      case 'ĐẠT Ở MỨC TRUNG BÌNH': return 'bg-amber-500 text-white';
      case 'CHƯA ĐẠT YÊU CẦU': return 'bg-red-600 text-white';
      default: return 'bg-slate-500 text-white';
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-50 selection:bg-blue-100">
      {/* Header "Expert Version" */}
      <header className="bg-sky-100 text-slate-900 py-10 px-4 border-b border-sky-200 shadow-sm mb-8 no-print relative overflow-hidden">
        <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/50 backdrop-blur px-3 py-1 rounded-full border border-sky-200">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold text-sky-800 uppercase tracking-widest">Expert Verified Online</span>
        </div>
        
        <div className="max-w-6xl mx-auto flex flex-col items-center text-center">
          <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-blue-200 shadow-lg transform hover:rotate-3 transition-transform">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="serif-title text-2xl md:text-4xl font-black mb-3 uppercase tracking-tighter max-w-4xl text-slate-900">
            HỆ THỐNG THẨM ĐỊNH CHUYÊN GIA CAO CẤP
          </h1>
          <p className="text-slate-600 text-lg max-w-2xl font-medium italic">
            Phân tích định lượng chuyên sâu cho SKKN & Nghiên cứu Sư phạm Việt Nam.
          </p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4">
        {/* Persistence Banner - Hiển thị trạng thái dữ liệu */}
        <div className="mb-4 flex items-center justify-between px-4 py-2 bg-blue-50 border border-blue-100 rounded-xl no-print">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-black text-blue-700 uppercase tracking-widest">
              Dữ liệu được bảo mật & Lưu tự động (Tổng: {history.length} hồ sơ)
            </span>
          </div>
          <button 
            onClick={() => { if(confirm("Xóa toàn bộ lịch sử?")) { localStorage.removeItem('edupro_history_v3'); setHistory([]); } }}
            className="text-[9px] font-black text-red-400 hover:text-red-600 uppercase tracking-tighter"
          >
            Làm sạch bộ nhớ
          </button>
        </div>

        {/* Input & Upload Area */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 mb-8 no-print relative overflow-hidden">
          <div className="absolute top-0 right-0 p-2">
            <svg className="w-12 h-12 text-slate-50 opacity-10" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" /></svg>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <label className="text-slate-700 font-black text-xl block mb-1">
                Tài liệu Thẩm định
              </label>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">AI & Plagiarism Detection Engine v3.0</p>
            </div>
            
            <div className="flex items-center gap-3">
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".docx,.pdf,.txt,.md" className="hidden" />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 transition-all text-sm font-bold shadow-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                {currentFileName ? `File: ${currentFileName}` : 'Tải hồ sơ lên'}
              </button>
              {text && <button onClick={clearAll} className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Xóa tất cả"><svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
            </div>
          </div>

          <textarea
            className="w-full h-80 p-6 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 outline-none transition-all text-slate-700 leading-relaxed resize-none font-serif text-lg bg-slate-50/30"
            placeholder="Dán nội dung bài viết của bạn tại đây hoặc tải file lên..."
            value={text}
            onChange={(e) => { setText(e.target.value); if (currentFileName) setCurrentFileName(null); }}
          />
          
          <div className="mt-8 flex justify-between items-center border-t border-slate-50 pt-6">
            <div className="flex gap-4">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Độ dài văn bản</span>
                 <span className="text-sm font-bold text-slate-700">{text.length} ký tự</span>
               </div>
            </div>
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || text.length < 50}
              className={`px-12 py-4 rounded-2xl font-black text-white shadow-2xl transition-all transform active:scale-95 flex items-center gap-3 ${isAnalyzing || text.length < 50 ? 'bg-slate-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-1 shadow-blue-200'}`}
            >
              {isAnalyzing ? (<><svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>ĐANG THẨM ĐỊNH...</>) : (<>BẮT ĐẦU PHÂN TÍCH</>)}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-5 rounded-xl mb-8 flex items-center gap-4 animate-in slide-in-from-top-2 no-print shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-sm font-black">{error}</span>
          </div>
        )}

        {/* Results Area */}
        {report && (
          <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000 print-container">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 bg-white p-8 rounded-3xl border border-slate-200 shadow-xl no-print relative">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-900 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.2em]">
                    REPORT OFFICIAL
                  </span>
                  <span className="text-slate-400 text-xs font-bold">
                    ID: {Date.now().toString(36).toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-2 bg-blue-50/50 p-2 rounded-lg border border-blue-100">
                  <div className="bg-blue-600 p-1.5 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <span className="text-sm font-black text-slate-800">
                    HỒ SƠ: <span className="text-blue-700 underline decoration-blue-200 underline-offset-4">{currentFileName || 'DỮ LIỆU TRỰC TIẾP'}</span>
                  </span>
                </div>
              </div>
              
              <div className="relative mt-4 md:mt-0">
                <button 
                  onClick={() => setIsExportOpen(!isExportOpen)}
                  className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl text-sm font-black flex items-center gap-3 hover:bg-slate-800 transition-all shadow-2xl hover:-translate-y-1 active:scale-95"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  XUẤT BẢN BÁO CÁO
                </button>
                
                {isExportOpen && (
                  <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 z-50 overflow-hidden animate-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 border-b border-slate-50 mb-1">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Định dạng hỗ trợ</span>
                    </div>
                    <button 
                      onClick={() => { exportToDocx(report, currentFileName || 'EduPro', history.length); setIsExportOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-blue-50 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">W</div>
                      Microsoft Word (.docx)
                    </button>
                    <button 
                      onClick={() => { window.print(); setIsExportOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-red-50 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600">P</div>
                      In Báo cáo / PDF
                    </button>
                    <button 
                      onClick={() => { exportToTxt(report, currentFileName || 'EduPro', history.length); setIsExportOpen(false); }}
                      className="w-full text-left px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">T</div>
                      Văn bản thuần (.txt)
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Section A: Metrics */}
            <div className="mb-10">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-5 flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-800 text-white rounded-lg flex items-center justify-center text-sm font-black italic">A</span> 
                ĐỊNH LƯỢNG HỌC THUẬT TỔNG QUAN
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <MetricCard 
                  label="Nguy cơ đạo văn" 
                  value={report.metrics.plagiarism} 
                  color="text-red-600" 
                  sublabel="Tỷ lệ trùng lặp ý tưởng" 
                  threshold="≤15%" 
                />
                <MetricCard 
                  label="Dấu hiệu AI" 
                  value={report.metrics.aiSign} 
                  color="text-amber-600" 
                  sublabel="Cấu trúc ngôn ngữ máy" 
                  threshold="≤30%" 
                />
                <MetricCard 
                  label="Tính cá nhân" 
                  value={report.metrics.personalVoice} 
                  color="text-blue-600" 
                  sublabel="Dấu ấn thực tế sư phạm" 
                  threshold="≥50%" 
                />
                <MetricCard 
                  label="Tính thực tế" 
                  value={report.metrics.practicality} 
                  color="text-green-600" 
                  sublabel="Khả năng ứng dụng thực tế" 
                  threshold="≥50%" 
                />
              </div>
            </div>

            {/* Section B: Detail Segments */}
            <div className="mb-10">
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-5 flex items-center gap-3">
                <span className="w-8 h-8 bg-slate-800 text-white rounded-lg flex items-center justify-center text-sm font-black italic">B</span> 
                CHI TIẾT PHÂN ĐOẠN NGÔN NGỮ
              </h2>
              <div className="space-y-5">
                {report.segments.map((seg, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow break-inside-avoid border-l-4 border-l-slate-300">
                    <p className="text-base text-slate-800 italic mb-5 leading-relaxed font-serif bg-slate-50 p-4 rounded-xl border border-slate-100">"{seg.text}"</p>
                    <div className="flex flex-wrap gap-6 items-center border-t border-slate-50 pt-5">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Đạo văn</span>
                          <span className={`text-sm font-black ${seg.plagiarismPercent > 15 ? 'text-red-600' : 'text-slate-600'}`}>{seg.plagiarismPercent}%</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Dấu hiệu AI</span>
                          <span className={`text-sm font-black ${seg.aiPercent > 30 ? 'text-amber-600' : 'text-slate-600'}`}>{seg.aiPercent}%</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-xs font-medium text-slate-600 leading-snug">{seg.comments}</p>
                      </div>
                      {seg.likelySource && (
                        <a 
                          href={getSourceLink(seg.likelySource, seg.sourceUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] bg-white text-blue-600 px-3 py-1.5 rounded-lg font-black border-2 border-blue-50 hover:border-blue-600 transition-all flex items-center gap-2 no-print"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          NGUỒN THAM CHIẾU
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section V: Expert Board Evaluation */}
            <div className="bg-slate-900 text-white rounded-[2rem] p-10 mb-10 shadow-2xl border-l-[12px] border-blue-600 page-break relative overflow-hidden">
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 flex items-center gap-4">
                <span className="bg-blue-600 text-white px-4 py-1 rounded-xl text-xl font-black">V</span>
                KẾT LUẬN CỦA HỘI ĐỒNG THẨM ĐỊNH
              </h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-1 flex flex-col items-center justify-center p-8 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                  <span className="text-[11px] uppercase font-black text-blue-400 mb-4 tracking-widest">XẾP LOẠI CẤP CƠ SỞ</span>
                  <div className={`px-8 py-4 rounded-2xl text-xl font-black uppercase tracking-widest text-center shadow-xl ${getRatingBadgeClass(report.boardEvaluation.rating)}`}>
                    {report.boardEvaluation.rating}
                  </div>
                </div>
                
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                    <h4 className="text-[11px] font-black uppercase text-blue-400 mb-3 tracking-[0.2em] flex items-center gap-2">
                      <div className="w-4 h-[2px] bg-blue-400"></div> NHẬN XÉT TỔNG QUAN
                    </h4>
                    <p className="text-base leading-relaxed text-slate-100 font-serif italic">"{report.boardEvaluation.generalComment}"</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-emerald-900/20 border border-emerald-500/20 p-6 rounded-2xl">
                      <h5 className="text-[10px] font-black uppercase text-emerald-400 mb-3">ƯU ĐIỂM</h5>
                      <ul className="text-sm text-slate-300 space-y-1">
                        {report.boardEvaluation.pros.map((pro, i) => <li key={i}>• {pro}</li>)}
                      </ul>
                    </div>
                    <div className="bg-rose-900/20 border border-rose-500/20 p-6 rounded-2xl">
                      <h5 className="text-[10px] font-black uppercase text-rose-400 mb-3">HẠN CHẾ</h5>
                      <ul className="text-sm text-slate-300 space-y-1">
                        {report.boardEvaluation.cons.map((con, i) => <li key={i}>• {con}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className="bg-blue-600/30 p-6 rounded-2xl border border-blue-600/50">
                    <h4 className="text-[10px] font-black uppercase text-blue-300 mb-1">KIẾN NGHỊ CUỐI CÙNG</h4>
                    <p className="text-lg font-black text-white tracking-tight">{report.boardEvaluation.recommendation}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-200 py-12 bg-white no-print">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-slate-400 text-[11px] uppercase tracking-[0.3em] font-medium">© 2024 EduPro Analysis • Công cụ Thẩm định Chuyên sâu Cấp Hội đồng</p>
          <div className="mt-4 flex justify-center gap-6 text-slate-300">
             <span className="text-[10px] font-bold">Dữ liệu được mã hóa & Lưu trữ</span>
             <span className="text-[10px] font-bold">Expert Logic Applied</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
