import { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, TrendingUp, TrendingDown, ClipboardCheck } from 'lucide-react';
import { VotestReport } from '../data/mockReports';

interface ReportPanelProps {
  report: VotestReport;
  view: 'CANDIDATE' | 'MANAGER';
  onClose: () => void;
  darkMode?: boolean;
}

export default function ReportPanel({ report, view, onClose, darkMode = true }: ReportPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Trigger transition when component is mounted
    const timer = setTimeout(() => setIsOpen(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleCloseClick = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Wait for transition to complete
  };

  const getColorClass = (score: number) => {
    if (score >= 80) {
      return {
        text: darkMode ? 'text-emerald-400' : 'text-emerald-600',
        bg: 'bg-emerald-500',
        stroke: 'stroke-emerald-500',
        border: darkMode ? 'border-emerald-500/20' : 'border-emerald-500/30',
        lightBg: darkMode ? 'bg-emerald-500/10' : 'bg-emerald-50'
      };
    }
    if (score >= 60) {
      return {
        text: darkMode ? 'text-amber-400' : 'text-amber-600',
        bg: 'bg-amber-500',
        stroke: 'stroke-amber-500',
        border: darkMode ? 'border-amber-500/20' : 'border-amber-500/30',
        lightBg: darkMode ? 'bg-amber-500/10' : 'bg-amber-50'
      };
    }
    return {
      text: darkMode ? 'text-rose-400' : 'text-rose-600',
      bg: 'bg-rose-500',
      stroke: 'stroke-rose-500',
      border: darkMode ? 'border-rose-500/20' : 'border-rose-500/30',
      lightBg: darkMode ? 'bg-rose-500/10' : 'bg-rose-50'
    };
  };

  const overallColor = getColorClass(report.overallScore);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (report.overallScore / 100) * circumference;

  const categories = [
    { key: 'opening', label: '오프닝', value: report.scores.opening },
    { key: 'needsDiscovery', label: '니즈 발굴', value: report.scores.needsDiscovery },
    { key: 'solutionMatching', label: '솔루션 매칭', value: report.scores.solutionMatching },
    { key: 'objectionHandling', label: '이의 처리', value: report.scores.objectionHandling },
    { key: 'closing', label: '클로징', value: report.scores.closing },
  ];

  const compliances = report.compliances || [];
  const passedComplianceCount = compliances.filter(c => c.passed).length;

  return (
    <div className="absolute inset-0 z-50 flex justify-end overflow-hidden select-none">
      {/* Dark Backdrop Overlay */}
      <div 
        onClick={handleCloseClick}
        className={`absolute inset-0 bg-zinc-950/70 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Main Score Report Slide-In Panel */}
      <div 
        className={`relative w-full max-w-md md:max-w-lg h-full ${
          darkMode ? 'bg-zinc-950 border-zinc-800/80 text-white' : 'bg-white border-zinc-200 text-zinc-800'
        } border-l flex flex-col shadow-[-12px_0_32px_rgba(0,0,0,0.35)] z-10 transform transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        {/* Panel Header */}
        <header className={`px-6 py-5 border-b flex items-center justify-between shrink-0 ${
          darkMode ? 'border-zinc-900 bg-zinc-950' : 'border-zinc-150 bg-zinc-50/80'
        }`}>
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4.5 w-4.5 text-blue-500" />
            <h2 className={`font-extrabold text-sm ${darkMode ? 'text-white' : 'text-zinc-900'} tracking-tight`}>
              VOTEST 역량 평가 상세 리포트
            </h2>
          </div>
          <button 
            onClick={handleCloseClick}
            className={`p-1.5 rounded-lg text-zinc-500 transition-all active:scale-[0.97] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 ${
              darkMode ? 'hover:text-white hover:bg-zinc-900' : 'hover:text-zinc-900 hover:bg-zinc-100'
            }`}
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </header>

        {/* Panel Scrollable Body */}
        <div className={`flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin ${
          darkMode ? 'scrollbar-thumb-zinc-800' : 'scrollbar-thumb-zinc-200'
        } scrollbar-track-transparent`}>
          
          {/* Section 1: Overall Score Circle Gauge */}
          <section className={`p-5 rounded-2xl ${
            darkMode ? 'bg-zinc-900/30 border-zinc-900/60' : 'bg-zinc-50/60 border-zinc-150'
          } border flex flex-col md:flex-row items-center gap-5`}>
            <div className="relative shrink-0 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className={darkMode ? "stroke-zinc-800" : "stroke-zinc-150"}
                  strokeWidth="7"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className={`${overallColor.stroke} transition-all duration-1000 ease-out`}
                  strokeWidth="7"
                  fill="transparent"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-zinc-900'} leading-none`}>{report.overallScore}</span>
                <span className={`text-[8.5px] font-bold ${darkMode ? 'text-zinc-400' : 'text-zinc-500'} uppercase mt-0.5`}>점</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${overallColor.lightBg} ${overallColor.text} border ${overallColor.border}`}>
                {report.overallScore >= 80 ? '우수 프로필' : report.overallScore >= 60 ? '보통 프로필' : '집중 지도 프로필'}
              </span>
              <h3 className={`font-bold text-[13px] ${darkMode ? 'text-zinc-200' : 'text-zinc-800'} mt-2`}>상세 종합 평가</h3>
              <p className={`text-[11px] ${darkMode ? 'text-zinc-400' : 'text-zinc-600'} font-medium leading-relaxed mt-1`}>
                {report.summary}
              </p>
            </div>
          </section>

          {/* Section 2: 5 Category Horizontal Progress Bars */}
          <section className="space-y-3.5">
            <h3 className={`text-xs font-black ${darkMode ? 'text-zinc-400' : 'text-zinc-500'} uppercase tracking-widest`}>
              5대 세일즈 프로세스별 점수
            </h3>
            <div className={`space-y-3 p-4 rounded-2xl ${
              darkMode ? 'bg-zinc-900/20 border-zinc-900/40' : 'bg-zinc-50/40 border-zinc-150'
            } border`}>
              {categories.map((cat) => {
                const catColor = getColorClass(cat.value);
                return (
                  <div key={cat.key} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className={`font-bold ${darkMode ? 'text-zinc-300' : 'text-zinc-700'}`}>{cat.label}</span>
                      <span className={`font-mono font-bold ${catColor.text}`}>{cat.value}점</span>
                    </div>
                    {/* Performance scaleX indicator */}
                    <div className={`h-1.5 w-full ${darkMode ? 'bg-zinc-900' : 'bg-zinc-200'} rounded-full overflow-hidden`}>
                      <div 
                        className={`h-full ${catColor.bg} rounded-full origin-left transition-transform duration-1000 ease-out`}
                        style={{ transform: `scaleX(${cat.value / 100})`, width: '100%' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 3: Compliance Checklist */}
          <section className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className={`text-xs font-black ${darkMode ? 'text-zinc-400' : 'text-zinc-500'} uppercase tracking-widest`}>
                필수 컴플라이언스 체크리스트
              </h3>
              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
              }`}>
                {passedComplianceCount} / {compliances.length} 통과
              </span>
            </div>
            
            <div className="space-y-2.5">
              {compliances.map((comp) => {
                return (
                  <div 
                    key={comp.id} 
                    className={`p-3.5 rounded-xl border flex gap-3.5 ${
                      comp.passed 
                        ? (darkMode ? 'bg-emerald-950/5 border-emerald-900/20' : 'bg-emerald-50/20 border-emerald-200/50') 
                        : (darkMode ? 'bg-rose-950/5 border-rose-950/20' : 'bg-rose-50/20 border-rose-200/50')
                    }`}
                  >
                    <div className={`mt-0.5 h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${
                      comp.passed 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' 
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                    }`}>
                      {comp.passed ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${comp.passed ? (darkMode ? 'text-emerald-300' : 'text-emerald-700') : (darkMode ? 'text-rose-300' : 'text-rose-700')}`}>
                        {comp.label}
                      </h4>
                      <p className={`text-[10.5px] ${darkMode ? 'text-zinc-400' : 'text-zinc-600'} font-medium leading-relaxed mt-1`}>
                        {comp.description}
                      </p>
                      {comp.impact && (
                        <p className={`text-[10px] ${darkMode ? 'text-zinc-500' : 'text-zinc-500'} italic mt-1 leading-relaxed`}>
                          * 비즈니스 임팩트: {comp.impact}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 4: Strengths & Weaknesses Lists */}
          <section className="grid grid-cols-1 gap-4">
            {/* Strengths */}
            <div className={`p-4.5 rounded-2xl ${
              darkMode ? 'bg-emerald-950/5 border-emerald-900/15' : 'bg-emerald-50/25 border-emerald-150'
            } border space-y-2.5`}>
              <h3 className={`text-xs font-black ${darkMode ? 'text-emerald-400' : 'text-emerald-700'} flex items-center gap-1.5`}>
                <TrendingUp className="h-4 w-4" />
                강점 영역 (Strengths)
              </h3>
              <ul className="space-y-1.5 list-none pl-0">
                {report.strengths.map((strength, i) => (
                  <li key={i} className={`text-[11px] ${darkMode ? 'text-zinc-300' : 'text-zinc-700'} leading-relaxed font-medium flex gap-1.5`}>
                    <span className="text-emerald-500 shrink-0 font-bold">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className={`p-4.5 rounded-2xl ${
              darkMode ? 'bg-rose-950/5 border-rose-900/15' : 'bg-rose-50/25 border-rose-150'
            } border space-y-2.5`}>
              <h3 className={`text-xs font-black ${darkMode ? 'text-rose-400' : 'text-rose-700'} flex items-center gap-1.5`}>
                <TrendingDown className="h-4 w-4" />
                보완 및 개선 필요 영역 (Weaknesses)
              </h3>
              <ul className="space-y-1.5 list-none pl-0">
                {report.weaknesses.map((weakness, i) => (
                  <li key={i} className={`text-[11px] ${darkMode ? 'text-zinc-300' : 'text-zinc-700'} leading-relaxed font-medium flex gap-1.5`}>
                    <span className="text-rose-500 shrink-0 font-bold">•</span>
                    <span>{weakness}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
