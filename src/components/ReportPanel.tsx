import { useState, useEffect } from 'react';
import { X, Check, AlertTriangle, TrendingUp, TrendingDown, ClipboardCheck } from 'lucide-react';
import { VotestReport } from '../data/mockReports';

interface ReportPanelProps {
  report: VotestReport;
  view: 'CANDIDATE' | 'MANAGER';
  onClose: () => void;
}

export default function ReportPanel({ report, view, onClose }: ReportPanelProps) {
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
        text: 'text-emerald-400',
        bg: 'bg-emerald-500',
        stroke: 'stroke-emerald-500',
        border: 'border-emerald-500/20',
        lightBg: 'bg-emerald-500/10'
      };
    }
    if (score >= 60) {
      return {
        text: 'text-amber-400',
        bg: 'bg-amber-500',
        stroke: 'stroke-amber-500',
        border: 'border-amber-500/20',
        lightBg: 'bg-amber-500/10'
      };
    }
    return {
      text: 'text-rose-400',
      bg: 'bg-rose-500',
      stroke: 'stroke-rose-500',
      border: 'border-rose-500/20',
      lightBg: 'bg-rose-500/10'
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
        className={`absolute inset-0 bg-zinc-950/70 backdrop-blur-xs transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Main Score Report Slide-In Panel */}
      <div 
        className={`relative w-full max-w-md md:max-w-lg h-full bg-zinc-950 border-l border-zinc-800/80 flex flex-col shadow-[-12px_0_32px_rgba(0,0,0,0.35)] z-10 transform transition-all duration-[320ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
          isOpen ? 'translate-x-0 opacity-100 motion-safe:animate-slide-in-right' : 'translate-x-full opacity-0'
        }`}
      >
        {/* Panel Header */}
        <header className="px-6 py-5 border-b border-zinc-900 flex items-center justify-between shrink-0 bg-zinc-950">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4.5 w-4.5 text-blue-500" />
            <h2 className="font-extrabold text-sm text-white tracking-tight">
              VOTEST 역량 평가 상세 리포트
            </h2>
          </div>
          <button 
            onClick={handleCloseClick}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all active:scale-[0.97] cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </header>

        {/* Panel Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-850 scrollbar-track-transparent">
          
          {/* Section 1: Overall Score Circle Gauge */}
          <section className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-900/60 flex flex-col md:flex-row items-center gap-5">
            <div className="relative shrink-0 flex items-center justify-center">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  className="stroke-zinc-850"
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
                <span className="text-2xl font-black text-white leading-none">{report.overallScore}</span>
                <span className="text-[8.5px] font-bold text-zinc-400 uppercase mt-0.5">점</span>
              </div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md ${overallColor.lightBg} ${overallColor.text} border ${overallColor.border}`}>
                {report.overallScore >= 80 ? '우수 프로필' : report.overallScore >= 60 ? '보통 프로필' : '집중 지도 프로필'}
              </span>
              <h3 className="font-bold text-[13px] text-zinc-200 mt-2">상세 종합 평가</h3>
              <p className="text-[11px] text-zinc-400 font-medium leading-relaxed mt-1">
                {report.summary}
              </p>
            </div>
          </section>

          {/* Section 2: 5 Category Horizontal Progress Bars */}
          <section className="space-y-3.5">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
              5대 세일즈 프로세스별 점수
            </h3>
            <div className="space-y-3 p-4 rounded-2xl bg-zinc-900/20 border border-zinc-900/40">
              {categories.map((cat) => {
                const catColor = getColorClass(cat.value);
                return (
                  <div key={cat.key} className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="font-bold text-zinc-300">{cat.label}</span>
                      <span className={`font-mono font-bold ${catColor.text}`}>{cat.value}점</span>
                    </div>
                    {/* Performance scaleX indicator */}
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
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
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest">
                필수 컴플라이언스 체크리스트
              </h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
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
                        ? 'bg-emerald-950/5 border-emerald-900/20' 
                        : 'bg-rose-950/5 border-rose-950/20'
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
                      <h4 className={`text-xs font-bold ${comp.passed ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {comp.label}
                      </h4>
                      <p className="text-[10.5px] text-zinc-400 font-medium leading-relaxed mt-1">
                        {comp.description}
                      </p>
                      {comp.impact && (
                        <p className="text-[10px] text-zinc-500 italic mt-1 leading-relaxed">
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
            <div className="p-4.5 rounded-2xl bg-emerald-950/5 border border-emerald-900/15 space-y-2.5">
              <h3 className="text-xs font-black text-emerald-400 flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4" />
                강점 영역 (Strengths)
              </h3>
              <ul className="space-y-1.5 list-none pl-0">
                {report.strengths.map((strength, i) => (
                  <li key={i} className="text-[11px] text-zinc-300 leading-relaxed font-medium flex gap-1.5">
                    <span className="text-emerald-500 shrink-0 font-bold">•</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Weaknesses */}
            <div className="p-4.5 rounded-2xl bg-rose-950/5 border border-rose-900/15 space-y-2.5">
              <h3 className="text-xs font-black text-rose-400 flex items-center gap-1.5">
                <TrendingDown className="h-4 w-4" />
                보완 및 개선 필요 영역 (Weaknesses)
              </h3>
              <ul className="space-y-1.5 list-none pl-0">
                {report.weaknesses.map((weakness, i) => (
                  <li key={i} className="text-[11px] text-zinc-300 leading-relaxed font-medium flex gap-1.5">
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
