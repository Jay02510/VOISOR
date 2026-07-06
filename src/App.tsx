import React, { useState, useEffect, useRef } from 'react';
import { 
  mockReports, 
  VotestReport 
} from './data/mockReports';
import { 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw, 
  Send, 
  ArrowRight, 
  Award, 
  ShieldAlert, 
  FileText, 
  ArrowLeft, 
  Check
} from 'lucide-react';

// Specialized default report for Sam, compliant with VOTEST / Sam's schema
const samReportLocal: VotestReport = {
  id: "votest-sam-01",
  candidateName: "Sam (ID: TM-2026-0815)",
  targetRole: "B2B SaaS 테크 영업 담당자",
  date: new Date().toISOString().split('T')[0],
  overallScore: 81,
  scores: {
    opening: 80,
    needsDiscovery: 50,
    solutionMatching: 60,
    objectionHandling: 0,
    closing: 75
  },
  compliances: [
    {
      id: "E0001",
      label: "E0001 인사말, 성명, 소속 모두 구사",
      passed: false,
      description: "현재 인사, 이름, 소속 중 한 가지 이상 누락 (만점 기준: 인사, 이름, 소속 모두 안내)",
      impact: "첫인상 형성 및 브랜드 소속원으로서의 신뢰 구축 실패 리스크"
    },
    {
      id: "E0002",
      label: "E0002 본인확인 이행",
      passed: false,
      description: "현재 본인확인 시도만 있음 (만점 기준: 본인확인에 맞는 정보를 명확히 확인)",
      impact: "고객 오인식 및 개인정보 관련 동의 절차 상의 법적 준수 결여 리스크"
    },
    {
      id: "E0003",
      label: "E0003 용건안내",
      passed: true,
      description: "전화 이유와 핵심 목적을 명확히 설명",
      impact: "상담 목적을 명확히 전달하여 고객의 불필요한 대기 및 피로도 감소"
    },
    {
      id: "E0004",
      label: "E0004 감사인사, 상담사(지원자)명 모두 구사",
      passed: true,
      description: "감사표현, 상담사(지원자) 이름 모두 안내",
      impact: "상담 마무리의 정중함을 통해 기업 인지도 및 신뢰도를 최종적으로 제고"
    }
  ],
  strengths: [
    "교육의 목적과 가치에 대해 성실히 설명하려는 의도가 돋보임",
    "고객의 상황적 배경에 맞춤 유도 질문을 활용해 대화 흐름을 유기적으로 유지함",
    "상담 마무리에 있어 추가 정보 제공 제안을 통해 긍정적인 액션 클로징 완성"
  ],
  weaknesses: [
    "필수 본인확인 및 소속/성명 안내 부분에서 핵심 컴플라이언스를 누락하는 치명적 감점 요소 발견",
    "설명이 다소 추상적이어서 고객의 확실한 이해를 돕지 못함"
  ],
  transcriptExcerpt: `[지원자 Sam]: "안녕하세요! 오늘 소중한 시간 내어주셔서 감사드립니다. 최근 보도자료에서 귀사가 아태지역 진출을 공식화하셨다는 소식을 보았는데, 저희 솔루션이 그 성장에 큰 도움을 드릴 수 있을 것 같아 매우 설레는 마음입니다."
[고객 담당자]: "네, 반갑습니다. 저희가 마침 글로벌 데이터 동기화 이슈 때문에 고민이 많았거든요. 관련 솔루션을 찾고 있습니다."
[지원자 Sam]: "네, 그 부분은 저희의 멀티 리전 클러스터링 기능으로 완벽하게 해결이 가능합니다. 우선 대략적인 일정이나 타임라인을 언제쯤 생각하시는지 여쭤봐도 될까요?"
[고객 담당자]: "올해 4분기, 늦어도 11월 전에는 실 서비스 적용까지 마쳐야 합니다."
[지원자 Sam]: "훌륭합니다. 그럼 일정을 역산해서 다음 주에 상세 데모와 실 제품 테스트 라이선스를 먼저 발급해 드리겠습니다."`,
  summary: "인사말 및 본인 확인 단계의 필수 컴플라이언스 보완이 매우 시급하나, 성실한 소통 감각을 지닌 성장형 인재입니다."
};

interface Message {
  role: 'user' | 'model';
  content: string;
  time: string;
  followups?: string[];
}

export default function App() {
  // Onboarding states: 1 = Role Selection, 2 = PDF File Upload, 3 = Active Coaching
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [currentView, setCurrentView] = useState<'CANDIDATE' | 'MANAGER'>('CANDIDATE');
  const [selectedReport, setSelectedReport] = useState<VotestReport | null>(null);
  
  // Custom upload states
  const [uploadText, setUploadText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileBase64, setSelectedFileBase64] = useState('');
  const [selectedFileMime, setSelectedFileMime] = useState('');

  // Chat states
  const [messages, setMessages] = useState<Message[]>(() => {
    const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    return [
      {
        role: 'model',
        content: 'VOISOR AI에 오신 것을 환영합니다. 시작하려면 역할을 선택해 주세요.',
        time: timeString
      }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  // Action chips handler
  const handleSendMessage = async (textToSend?: string, hiddenPrompt?: string) => {
    const text = textToSend || chatInput;
    if (!text.trim() || chatLoading) return;

    setChatInput('');
    const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const newMessages = [...messages, { role: 'user' as const, content: text, time: timeString }];
    setMessages(newMessages);
    setChatLoading(true);

    try {
      const bias = currentView === 'CANDIDATE'
        ? '\n\n답변은 항상 건설적이고 개인 성장을 위한 코칭 관점에서 친근하면서도 전문적인 한국어로 작성해 주세요.'
        : '\n\n답변은 항상 명확한 개선 개입 조치(Intervention)를 포함한 기업 리스크 분석 보고서 형식으로 전문적인 한국어로 작성해 주세요.';

      const payloadMessages = newMessages.map((m, idx) => {
        if (idx === newMessages.length - 1) {
          const actualContent = hiddenPrompt || m.content;
          return { role: m.role, content: actualContent + bias };
        }
        return { role: m.role, content: m.content };
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          reportData: selectedReport,
          currentView: currentView
        })
      });

      const data = await response.json();
      if (data.success) {
        const parsed = extractFollowups(data.text);
        setMessages(prev => [...prev, {
          role: 'model',
          content: parsed.cleanText,
          time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          followups: parsed.followups
        }]);
      } else {
        throw new Error(data.error || '채팅 응답을 받아오지 못했습니다.');
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [...prev, {
        role: 'model',
        content: `오류 발생: ${err.message || '네트워크 이상으로 답변을 출력할 수 없습니다.'}`,
        time: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  const extractFollowups = (text: string) => {
    let cleanText = text;
    let followups: string[] = [];

    const jsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
    let match;
    
    while ((match = jsonRegex.exec(text)) !== null) {
      try {
        const potentialJson = JSON.parse(match[1].trim());
        if (potentialJson && Array.isArray(potentialJson.suggested_followups)) {
          followups = potentialJson.suggested_followups;
          cleanText = cleanText.replace(match[0], '').trim();
          break;
        }
      } catch (e) {
        // Not valid JSON
      }
    }

    if (followups.length === 0) {
      const bareJsonRegex = /\{\s*"suggested_followups"[\s\S]*?\}/gi;
      const bareMatch = bareJsonRegex.exec(text);
      if (bareMatch) {
        try {
          const potentialJson = JSON.parse(bareMatch[0].trim());
          if (potentialJson && Array.isArray(potentialJson.suggested_followups)) {
            followups = potentialJson.suggested_followups;
            cleanText = cleanText.replace(bareMatch[0], '').trim();
          }
        } catch (e) {
          // Ignore
        }
      }
    }

    return { cleanText, followups };
  };

  // Custom analysis file drag-and-drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file) return;
    setSelectedFileName(file.name);
    setSelectedFileMime(file.type);
    
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = (reader.result as string).split(',')[1];
      setSelectedFileBase64(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleRunAnalysis = async () => {
    // If empty inputs, fall back to the demo report automatically for standard trial
    const hasInput = uploadText.trim() || selectedFileBase64;
    if (!hasInput) {
      setIsAnalyzing(true);
      setUploadError('');
      setTimeout(() => {
        setSelectedReport(samReportLocal);
        initializeChat(samReportLocal);
        setStep(3);
        setIsAnalyzing(false);
      }, 800);
      return;
    }

    setIsAnalyzing(true);
    setUploadError('');

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: uploadText,
          fileBase64: selectedFileBase64,
          fileName: selectedFileName,
          fileMime: selectedFileMime
        })
      });

      const resData = await response.json();
      if (resData.success) {
        const newReport: VotestReport = {
          ...resData.data,
          id: resData.data.id || "votest-gen-" + Date.now(),
          date: resData.data.date || new Date().toISOString().split('T')[0]
        };

        setSelectedReport(newReport);
        initializeChat(newReport);
        setStep(3);
        
        // Clear form states
        setUploadText('');
        setSelectedFileName('');
        setSelectedFileBase64('');
        setSelectedFileMime('');
      } else {
        throw new Error(resData.error || 'VOTEST 리포트를 정밀 분석하는 도중 에러가 발생했습니다.');
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || '리포트 분석 중 에러가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseDemoReport = () => {
    setIsAnalyzing(true);
    setUploadError('');
    setTimeout(() => {
      setSelectedReport(samReportLocal);
      initializeChat(samReportLocal);
      setStep(3);
      setIsAnalyzing(false);
    }, 800);
  };

  // Initialize chatbot messages with exact requested phrase
  const initializeChat = (report: VotestReport) => {
    const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        role: 'model',
        content: 'VOTEST 리포트 분석이 완료되었습니다. 이 결과를 바탕으로 어떤 부분의 세일즈 분석 및 코칭을 시작해 볼까요?',
        time: timeString
      }
    ]);
  };

  const handleRestart = () => {
    setStep(1);
    setSelectedReport(null);
    setUploadText('');
    setSelectedFileName('');
    setSelectedFileBase64('');
    setSelectedFileMime('');
    setUploadError('');
    
    const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        role: 'model',
        content: 'VOISOR AI에 오신 것을 환영합니다. 시작하려면 역할을 선택해 주세요.',
        time: timeString
      }
    ]);
  };

  // Markdown renderer helper with VodaBi corporate blue Highlights
  const renderMarkdownText = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-2">
        {lines.map((line, idx) => {
          let cleanLine = line.trim();
          if (!cleanLine) return <div key={idx} className="h-2" />;

          const isBullet = cleanLine.startsWith('- ') || cleanLine.startsWith('* ') || cleanLine.startsWith('• ');
          if (isBullet) {
            cleanLine = cleanLine.substring(2);
          }

          const boldParts = cleanLine.split('**');
          const renderedLine = boldParts.map((part, pIdx) => {
            if (pIdx % 2 === 1) {
              return <strong key={pIdx} className="font-extrabold text-blue-400">{part}</strong>;
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className="flex gap-2 ml-2 items-start text-zinc-300">
                <span className="text-blue-500 font-bold mt-1">•</span>
                <span className="flex-1 text-[12.5px] font-sans">{renderedLine}</span>
              </div>
            );
          }

          if (cleanLine.startsWith('### ')) {
            return <h4 key={idx} className="text-[13px] font-black text-blue-400 mt-3 mb-1 tracking-tight font-sans">{cleanLine.substring(4)}</h4>;
          }
          if (cleanLine.startsWith('## ')) {
            return <h3 key={idx} className="text-[14px] font-black text-white mt-4 mb-2 tracking-tight font-sans border-b border-zinc-800 pb-1">{cleanLine.substring(3)}</h3>;
          }

          return <p key={idx} className="text-zinc-300 leading-relaxed text-[12.5px] font-sans">{renderedLine}</p>;
        })}
      </div>
    );
  };

  // Suggestion chips based on role and custom schema (compliance) - Emojis completely stripped out
  const customChips = {
    CANDIDATE: [
      {
        label: "나의 세일즈 컴플라이언스(E0001~E0004) 항목별 합격 여부 요약",
        prompt: "제 VOTEST 리포트의 E0001(인사말/성명/소속), E0002(본인확인), E0003(용건안내), E0004(감사인사) 컴플라이언스 세부 이행 여부와 각각의 핵심 보완 가이드를 요약해 주세요."
      },
      {
        label: "미준수 항목 극복을 위한 실전 대응 스크립트(AS-IS / TO-BE) 설계",
        prompt: "제가 누락하거나 미흡했던 필수 항목들(예: E0001, E0002 등)에 대해, 다음 실전 상담에서 바로 적용할 수 있는 상황별 AS-IS와 TO-BE 대화 예시 스크립트를 상세히 작성해 주세요."
      },
      {
        label: "최취약 영역 보완을 위한 가상 고객 1:1 대화형 롤플레잉 훈련",
        prompt: "제가 가장 보완해야 할 항목을 연습하기 위해, 당신이 가상 고객 역할을 맡아 1:1 대화형 실시간 세일즈 롤플레잉 연습을 제안해 주세요. 고객의 첫마디 대사부터 먼저 건네주시기 바랍니다."
      }
    ],
    MANAGER: [
      {
        label: "지원자 핵심 역량 및 준수율 종합 진단 결과 분석 보고서",
        prompt: "이 지원자의 전체 점수와 5대 프로세스별 점수, 그리고 컴플라이언스 준수율(E0001~E0004)을 종합 진단하여 채용 시 참고할 만한 간결한 인사이트 요약 평가서를 보고서 톤으로 작성해 주세요."
      },
      {
        label: "이행 누락 항목으로 인한 실무 투입 시 비즈니스 매출 이탈 리스크",
        prompt: "지원자가 누락한 필수 점검 사항(E0001, E0002 등)이 실제 세일즈 성과나 계약 체결 과정에 미칠 우려 요인을 비즈니스 영향 분석 보고서 형식으로 도출해 주십시오."
      },
      {
        label: "약점 보완 및 리스크 관리를 위한 관리자 밀착 1:1 코칭 가이드",
        prompt: "지원자의 부실 항목 및 상담 이탈률을 집중 보완하고 실무 투입 전 역량을 단기 육성하기 위해, 지점장/관리자가 이번 주 즉시 참관하고 실무 섀도잉 시 적용해야 할 1대일 밀착 개입 피드백(Intervention) 실행 지침을 마련해 주세요."
      }
    ]
  };

  return (
    <div className="relative min-h-screen bg-[#07080a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black text-[#f4f4f5] overflow-hidden selection:bg-blue-500/30 selection:text-white flex flex-col font-sans">
      
      {/* Decorative clean background subtle elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-800/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="w-full max-w-7xl mx-auto px-6 h-16 flex items-center justify-between border-b border-zinc-900/60 shrink-0 z-10">
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={handleRestart}>
          {/* VODA Bi Logo Container */}
          <div className="flex items-center">
            {/* Custom SVG People-V Icon */}
            <svg viewBox="0 0 100 80" className="h-6 w-auto text-[#2b52b4] mr-0.5" fill="currentColor">
              <circle cx="26" cy="18" r="7.5" />
              <circle cx="74" cy="18" r="7.5" />
              <path d="M26 34 L44 58 C47 62 53 62 56 58 L74 34" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            {/* ODA Text */}
            <span className="text-[#2b52b4] font-sans font-black tracking-tight text-xl leading-none mr-2">
              ODA
            </span>
            
            {/* Bi Blue Box */}
            <div className="bg-[#2b52b4] px-2 py-1 rounded flex items-center justify-center shadow-sm shadow-[#2b52b4]/10">
              <span className="text-white font-sans font-black text-sm leading-none">
                Bi
              </span>
            </div>
          </div>
          
          {/* Separator | VOISOR */}
          <div className="flex items-center gap-2 ml-1">
            <span className="text-zinc-700 font-light text-base">|</span>
            <span className="text-zinc-300 font-black text-sm tracking-widest uppercase font-mono">
              VOISOR
            </span>
          </div>
        </div>

        {step > 1 && (
          <button
            id="header-restart-btn"
            onClick={handleRestart}
            className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3" />
            초기화면으로
          </button>
        )}
      </header>

      {/* Main Content View Container (Centered, elevated chatbot container) */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 flex flex-col items-center justify-center relative z-10 overflow-hidden">
        
        {/* Sleek, premium unified chatbot container */}
        <div className="w-full h-[78vh] rounded-2xl bg-zinc-900/45 border border-zinc-800/80 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden relative">
          
          {/* Elevated Chat Header (Adapts dynamically) */}
          <div className="px-6 py-4 border-b border-zinc-800/60 bg-zinc-950/40 flex items-center justify-between shrink-0 select-none">
            <div className="flex items-center gap-3">
              <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${
                step === 3
                  ? (currentView === 'CANDIDATE' ? 'bg-zinc-800 text-white border border-zinc-700' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20')
                  : 'bg-zinc-900 text-zinc-400 border border-zinc-800'
              }`}>
                {step === 3 ? (
                  currentView === 'CANDIDATE' ? <Award className="h-5 w-5" /> : <ShieldAlert className="h-5 w-5" />
                ) : (
                  <Sparkles className="h-4.5 w-4.5 text-blue-400 animate-pulse" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-white">
                    {step === 3 ? (
                      currentView === 'CANDIDATE' ? 'Candidate AI Coach' : 'Manager Risk Advisor'
                    ) : (
                      'VOISOR Onboarding'
                    )}
                  </span>
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[10.5px] text-zinc-400 font-medium">
                  {step === 3 ? (
                    <>대상 지원자: <strong className="text-zinc-200">{selectedReport?.candidateName || 'Sam 지원자'}</strong> &bull; {selectedReport?.targetRole || 'B2B SaaS 테크 영업'}</>
                  ) : (
                    '대화형 설정을 진행하는 중입니다.'
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {step === 3 && (
                <>
                  <span className="text-[10.5px] font-extrabold px-2.5 py-1 rounded-lg bg-zinc-850/80 border border-zinc-800 text-white select-none">
                    종합 점수: {selectedReport?.overallScore || 81}점
                  </span>
                  
                  <button
                    id="back-to-upload-btn"
                    onClick={() => {
                      setStep(2);
                      const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                      setMessages(prev => [
                        ...prev,
                        {
                          role: 'model',
                          content: 'VOTEST PDF 평가 리포트를 업로드해 주세요.',
                          time: timeString
                        }
                      ]);
                    }}
                    className="px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                  >
                    리포트 교체
                  </button>
                </>
              )}
              {step === 2 && (
                <button
                  id="onboarding-back-to-role-btn"
                  onClick={() => {
                    setStep(1);
                    const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                    setMessages([
                      {
                        role: 'model',
                        content: 'VOISOR AI에 오신 것을 환영합니다. 시작하려면 역할을 선택해 주세요.',
                        time: timeString
                      }
                    ]);
                  }}
                  className="px-3 py-1.5 rounded-lg border border-zinc-800 text-xs text-zinc-400 hover:text-white hover:bg-zinc-900/80 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft className="h-3 w-3" />
                  역할 다시 선택
                </button>
              )}
            </div>
          </div>

          {/* Chat Message Box Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
            
            {messages.map((msg, index) => {
              const isModel = msg.role === 'model';
              const roleLabel = isModel 
                ? (step === 3 ? (currentView === 'CANDIDATE' ? 'VOISOR 코칭 어드바이저' : 'VOISOR 리스크 분석 리더') : 'VOISOR AI') 
                : '나의 선택';
              
              return (
                <div 
                  key={index} 
                  className={`flex flex-col max-w-[85%] ${isModel ? 'self-start' : 'self-end ml-auto'} animate-fade-in`}
                >
                  <span className={`text-[9.5px] font-bold uppercase tracking-wider mb-1 ${
                    isModel ? 'text-zinc-500' : 'text-blue-400 self-end'
                  }`}>
                    {roleLabel}
                  </span>

                  <div className={`p-4 text-xs leading-relaxed rounded-2xl shadow-md ${
                    isModel 
                      ? 'bg-zinc-950/80 border border-zinc-850 text-zinc-200' 
                      : 'bg-[#0052cc] text-white'
                  } ${isModel ? 'rounded-tl-none' : 'rounded-tr-none'}`}>
                    {isModel ? (
                      <div className="prose prose-invert max-w-none text-zinc-200 leading-relaxed font-sans">
                        {renderMarkdownText(msg.content)}
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap font-sans text-white text-[12.5px]">
                        {msg.content}
                      </div>
                    )}
                  </div>

                  <span className={`text-[8.5px] mt-1 font-mono text-zinc-500 ${!isModel && 'self-end'}`}>
                    {msg.time}
                  </span>
                </div>
              );
            })}

            {/* Render Role Selection interactive buttons directly in the feed */}
            {step === 1 && (
              <div className="flex flex-col sm:flex-row gap-4 w-full max-w-2xl mt-4 animate-fade-in self-start">
                {/* Candidate Mode */}
                <button
                  id="select-candidate-mode"
                  onClick={() => {
                    setCurrentView('CANDIDATE');
                    const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                    setMessages(prev => [
                      ...prev,
                      {
                        role: 'user',
                        content: '지원자 모드(Candidate Mode) 선택됨',
                        time: timeString
                      },
                      {
                        role: 'model',
                        content: 'VOTEST PDF 평가 리포트를 업로드해 주세요.',
                        time: timeString
                      }
                    ]);
                    setStep(2);
                  }}
                  className="flex-1 text-left p-5 rounded-2xl bg-zinc-950/60 hover:bg-zinc-950/90 border border-zinc-850 hover:border-zinc-700/80 transition-all flex flex-col justify-between group cursor-pointer shadow-lg"
                >
                  <div className="flex flex-col gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-all">
                      <Award className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white group-hover:text-blue-300 transition-colors">Candidate Mode</h3>
                      <p className="text-[11px] text-zinc-400 font-medium mt-1 leading-relaxed">
                        Interactive post-test coaching. Review individual sales metrics, compliance elements, and practice targeted roleplay scenarios.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 py-2 w-full rounded-lg text-xs font-bold text-center bg-zinc-900 border border-zinc-800 text-zinc-300 group-hover:bg-[#0052cc] group-hover:text-white group-hover:border-[#0052cc] transition-all flex items-center justify-center gap-1.5 shadow-sm">
                    <span>Select and Continue</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </button>

                {/* Manager Mode */}
                <button
                  id="select-manager-mode"
                  onClick={() => {
                    setCurrentView('MANAGER');
                    const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                    setMessages(prev => [
                      ...prev,
                      {
                        role: 'user',
                        content: '관리자 모드(Manager Mode) 선택됨',
                        time: timeString
                      },
                      {
                        role: 'model',
                        content: 'VOTEST PDF 평가 리포트를 업로드해 주세요.',
                        time: timeString
                      }
                    ]);
                    setStep(2);
                  }}
                  className="flex-1 text-left p-5 rounded-2xl bg-zinc-950/60 hover:bg-zinc-950/90 border border-zinc-850 hover:border-zinc-700/80 transition-all flex flex-col justify-between group cursor-pointer shadow-lg"
                >
                  <div className="flex flex-col gap-3">
                    <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:scale-105 transition-all">
                      <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-white group-hover:text-blue-300 transition-colors">Manager Mode</h3>
                      <p className="text-[11px] text-zinc-400 font-medium mt-1 leading-relaxed">
                        Enterprise risk and audit dashboard. Evaluate candidate competency benchmarks, compliance gaps, and team intervention guides.
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 py-2 w-full rounded-lg text-xs font-bold text-center bg-zinc-900 border border-zinc-800 text-zinc-300 group-hover:bg-[#0052cc] group-hover:text-white group-hover:border-[#0052cc] transition-all flex items-center justify-center gap-1.5 shadow-sm">
                    <span>Select and Continue</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </button>
              </div>
            )}

            {/* Render Direct File Upload inside the feed */}
            {step === 2 && (
              <div className="p-5 rounded-2xl bg-zinc-950/80 border border-zinc-850 flex flex-col gap-4 max-w-md mt-2 self-start animate-fade-in shadow-xl">
                <div 
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-xl p-6 text-center transition-all ${
                    dragActive 
                      ? 'border-blue-500/80 bg-blue-500/5' 
                      : 'border-zinc-800 hover:border-zinc-750 bg-zinc-900/10'
                  }`}
                >
                  <Upload className="h-5 w-5 text-zinc-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-white">VOTEST 평가서 PDF 드래그 앤 드롭</p>
                  <p className="text-[10px] text-zinc-500 mt-1">또는 컴퓨터에서 파일 선택</p>
                  
                  <input 
                    id="file-upload-input-inline"
                    type="file" 
                    accept="application/pdf,text/plain"
                    onChange={handleFileChange}
                    className="hidden" 
                  />
                  
                  <button
                    id="file-browse-btn-inline"
                    onClick={() => document.getElementById('file-upload-input-inline')?.click()}
                    className="mt-3 px-3 py-1.5 rounded-lg text-[11px] font-bold border border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-850 hover:text-white transition-all cursor-pointer"
                  >
                    파일 선택하기
                  </button>

                  {selectedFileName && (
                    <div className="mt-3 text-[11px] text-emerald-400 font-bold flex items-center justify-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {selectedFileName} 준비완료
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <textarea
                    id="analysis-text-input-inline"
                    rows={2}
                    value={uploadText}
                    onChange={(e) => setUploadText(e.target.value)}
                    placeholder="또는 상담 전문 대화록을 여기에 직접 붙여넣으세요..."
                    className="w-full px-3 py-2 rounded-lg text-[11px] border border-zinc-850 bg-zinc-900 text-zinc-200 outline-none focus:border-blue-500/40 transition-all resize-none font-sans"
                  />
                </div>

                {uploadError && (
                  <div className="text-[11px] text-rose-500 font-bold bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 rounded-lg">
                    {uploadError}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    id="run-analysis-btn-inline"
                    onClick={handleRunAnalysis}
                    disabled={isAnalyzing}
                    className="flex-1 px-3 py-2 rounded-lg text-xs font-bold bg-[#0052cc] hover:bg-[#004bb3] text-white disabled:opacity-40 disabled:pointer-events-none transition-all flex items-center justify-center gap-1 shadow-lg shadow-blue-500/10 cursor-pointer"
                  >
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        분석 중...
                      </>
                    ) : (
                      <>
                        <span>분석 시작</span>
                        <ArrowRight className="h-3 w-3" />
                      </>
                    )}
                  </button>

                  <button
                    id="use-demo-report-btn"
                    onClick={handleUseDemoReport}
                    disabled={isAnalyzing}
                    className="px-3 py-2 rounded-lg text-xs font-bold bg-zinc-800 hover:bg-zinc-750 text-zinc-300 transition-all cursor-pointer flex items-center justify-center gap-1 border border-zinc-750"
                  >
                    <span>데모 리포트로 시작</span>
                  </button>
                </div>
              </div>
            )}

            {chatLoading && (
              <div className="self-start flex flex-col max-w-[80%] w-full animate-pulse">
                <span className="text-[9.5px] font-bold uppercase tracking-wider text-zinc-500 mb-1">
                  {step === 3 ? (currentView === 'CANDIDATE' ? 'VOISOR 코칭 어드바이저' : 'VOISOR 리스크 분석 리더') : 'VOISOR AI'}
                </span>
                <div className="bg-zinc-950/85 border border-zinc-850 p-4 rounded-2xl rounded-tl-none flex flex-col gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400">피드백 구상 중...</span>
                  </div>
                  <div className="h-1 bg-zinc-800 rounded-md w-3/4" />
                  <div className="h-1 bg-zinc-800 rounded-md w-1/2" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions chips at the bottom of the chat interface */}
          {step === 3 && !chatLoading && messages.length > 0 && (
            <div className="px-6 py-3.5 border-t border-zinc-800/40 shrink-0 flex flex-col gap-2 bg-zinc-950/20 backdrop-blur-sm z-10">
              <div className="flex items-center">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-blue-500" />
                  추천 분석 질문 (VOISOR Recommended Analytics)
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                {customChips[currentView].map((qa, index) => (
                  <button
                    id={`quick-action-${index}`}
                    key={index}
                    onClick={() => handleSendMessage(qa.label, qa.prompt)}
                    disabled={chatLoading}
                    className="shrink-0 text-[11px] px-3.5 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-blue-500 hover:bg-[#0052cc]/10 hover:text-white text-zinc-300 font-semibold rounded-full transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:pointer-events-none hover:bg-zinc-850"
                  >
                    <span>{qa.label}</span>
                    <span className="text-[9px] text-zinc-500 font-bold">&rarr;</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Chat Input Field / Temporary Drop-zone bottom bar depending on step */}
          {step === 3 ? (
            <div className="border-t border-zinc-800/60 flex items-center shrink-0 bg-zinc-950">
              <input
                id="chat-message-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  currentView === 'CANDIDATE' 
                    ? "AI 코치에게 세일즈 피드백이나 롤플레잉에 대해 질문해 보세요..." 
                    : "관리자 보고서 작성 방향이나 피드백 조치에 대해 기재해 주세요..."
                }
                disabled={chatLoading}
                className="flex-1 px-6 py-4 bg-transparent text-zinc-100 placeholder-zinc-500 text-xs border-none outline-none focus:ring-0 focus:outline-none disabled:cursor-not-allowed font-sans"
              />
              
              <button
                id="send-chat-button"
                onClick={() => handleSendMessage()}
                disabled={!chatInput.trim() || chatLoading}
                className="h-[52px] w-[52px] border-l border-zinc-850/60 bg-transparent hover:bg-blue-500/5 text-zinc-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center justify-center font-bold"
              >
                <Send className="h-4 w-4 text-blue-500" />
              </button>
            </div>
          ) : step === 2 ? (
            <div 
              className="border-t border-zinc-800/60 p-4 bg-zinc-950 flex items-center justify-center select-none cursor-pointer hover:bg-zinc-900/20 transition-all gap-2 text-xs font-semibold text-zinc-400"
              onClick={() => document.getElementById('file-upload-input-inline')?.click()}
            >
              <Upload className="h-4 w-4 text-blue-500 animate-bounce" />
              <span>드래그앤드롭하여 PDF 업로드 또는 여기를 클릭하여 파일 선택</span>
            </div>
          ) : (
            <div className="border-t border-zinc-800/60 p-4 bg-zinc-950 flex items-center justify-center text-xs font-semibold text-zinc-500">
              상단의 역할(Mode) 카드를 선택하시면 대화가 실시간으로 시작됩니다.
            </div>
          )}

        </div>

      </main>

      {/* Aesthetic Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 h-12 flex items-center justify-center border-t border-zinc-900/40 text-[10px] text-zinc-600 font-semibold uppercase tracking-widest shrink-0">
        &copy; 2026 VodaBi. All rights reserved.
      </footer>

    </div>
  );
}
