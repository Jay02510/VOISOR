import React, { useState, useEffect, useRef } from 'react';
import { 
  mockReports, 
  samReport,
  sarahReport,
  alexReport,
  jordanReport,
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
  Check,
  Sun,
  Moon,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Users,
  Activity,
  BarChart2,
  Bell,
  AlertCircle,
  X,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Search,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import ReportPanel from './components/ReportPanel';

interface Message {
  role: 'user' | 'model';
  content: string;
  time: string;
  followups?: string[];
}

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  
  // Gateway selected state
  const [gatewaySelected, setGatewaySelected] = useState(true);
  
  // Chat Widget Expansion State
  const [isChatOpen, setIsChatOpen] = useState(false); // Closed by default
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(true);

  // Onboarding states for chatbot: 1 = Role Selection, 2 = PDF File Upload, 3 = Active Coaching
  const [step, setStep] = useState<1 | 2 | 3>(3);
  const [currentView, setCurrentView] = useState<'CANDIDATE' | 'MANAGER'>('CANDIDATE');
  const [selectedReport, setSelectedReport] = useState<VotestReport | null>(samReport);
  const [showReport, setShowReport] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('점수 확인 및 요약');

  // Search/Filter for Mock Dashboard
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');

  useEffect(() => {
    if (currentView === 'CANDIDATE') {
      setSelectedCategory('점수 확인 및 요약');
    } else {
      setSelectedCategory('결과 요약');
    }
  }, [currentView]);
  
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
        content: `**Sam (ID: TM-2026-0149)** 지원자의 VOTEST 리포트 분석이 완료되었습니다. **Candidate Mode (상담사/TM)** 관점에서 성장을 돕는 맞춤 피드백을 시작합니다.\n\n아래의 **'점수 확인 및 요약'** 이나 **'부족한 점 / 리스크'** 카테고리 칩을 선택하여 코칭을 받아보세요!`,
        time: timeString
      }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chipsScrollRef = useRef<HTMLDivElement>(null);

  const handleScrollChips = (direction: 'left' | 'right') => {
    if (chipsScrollRef.current) {
      const scrollAmount = direction === 'left' ? -250 : 250;
      chipsScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
    const hasInput = uploadText.trim() || selectedFileBase64;
    if (!hasInput) {
      setIsAnalyzing(true);
      setUploadError('');
      setTimeout(() => {
        setSelectedReport(samReport);
        initializeChat(samReport, currentView);
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
        initializeChat(newReport, currentView);
        setStep(3);
        
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
      setSelectedReport(samReport);
      initializeChat(samReport, currentView);
      setStep(3);
      setIsAnalyzing(false);
    }, 800);
  };

  // Handle view mode change globally from the simulated auth toggle
  const handleViewModeChange = (newView: 'CANDIDATE' | 'MANAGER') => {
    setCurrentView(newView);
    
    // Determine which report to use (default to samReport if none selected)
    const reportToUse = selectedReport || samReport;
    if (!selectedReport) {
      setSelectedReport(samReport);
    }
    
    setStep(3);
    setIsChatOpen(true);
    setShowWelcomeBubble(false);
    
    const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    
    if (newView === 'CANDIDATE') {
      setMessages([
        {
          role: 'model',
          content: `**${reportToUse.candidateName}** 지원자의 VOTEST 리포트 분석이 완료되었습니다. **Candidate Mode (상담사/TM)** 관점에서 성장을 돕는 맞춤 피드백을 시작합니다.\n\n아래의 **'점수 확인 및 요약'** 이나 **'부족한 점 / 리스크'** 카테고리 칩을 선택하여 코칭을 받아보세요!`,
          time: timeString
        }
      ]);
    } else {
      setMessages([
        {
          role: 'model',
          content: `**${reportToUse.candidateName}** 지원자의 VOTEST 리포트 분석이 완료되었습니다. **Manager Mode (관리자/QA)** 전용 실시간 매출 리스크 분석 및 현업 실무 온보딩 피드백을 준비했습니다.\n\n아래의 **'결과 요약'** 및 **'채용/배치 판단'** 카테고리를 클릭해 의견을 받아보세요!`,
          time: timeString
        }
      ]);
    }
  };

  // Launch a specific candidate report from dashboard
  const handleLaunchCandidateCoaching = (report: VotestReport, view: 'CANDIDATE' | 'MANAGER') => {
    setSelectedReport(report);
    setCurrentView(view);
    setStep(3);
    initializeChat(report, view);
    setIsChatOpen(true);
    setShowWelcomeBubble(false);
  };

  // Initialize chatbot messages
  const initializeChat = (report: VotestReport, view: 'CANDIDATE' | 'MANAGER') => {
    const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    
    if (view === 'CANDIDATE') {
      setMessages([
        {
          role: 'model',
          content: `**${report.candidateName}** 지원자의 VOTEST 리포트 분석이 완료되었습니다. **Candidate Mode (상담사/TM)** 관점에서 성장을 돕는 맞춤 피드백을 시작합니다.\n\n아래의 **'점수 확인 및 요약'** 이나 **'부족한 점 / 리스크'** 카테고리 칩을 선택하여 코칭을 받아보세요!`,
          time: timeString
        }
      ]);
    } else {
      setMessages([
        {
          role: 'model',
          content: `**${report.candidateName}** 지원자의 VOTEST 리포트 분석이 완료되었습니다. **Manager Mode (관리자/QA)** 전용 실시간 매출 리스크 분석 및 현업 실무 온보딩 피드백을 준비했습니다.\n\n아래의 **'결과 요약'** 및 **'채용/배치 판단'** 카테고리를 클릭해 의견을 받아보세요!`,
          time: timeString
        }
      ]);
    }
  };

  const handleRestart = () => {
    const reportToUse = selectedReport || samReport;
    if (!selectedReport) {
      setSelectedReport(samReport);
    }
    setGatewaySelected(true);
    setStep(3);
    setUploadText('');
    setSelectedFileName('');
    setSelectedFileBase64('');
    setSelectedFileMime('');
    setUploadError('');
    setShowReport(false);
    
    const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    
    if (currentView === 'CANDIDATE') {
      setMessages([
        {
          role: 'model',
          content: `**${reportToUse.candidateName}** 지원자의 VOTEST 리포트 분석이 완료되었습니다. **Candidate Mode (상담사/TM)** 관점에서 성장을 돕는 맞춤 피드백을 시작합니다.\n\n아래의 **'점수 확인 및 요약'** 이나 **'부족한 점 / 리스크'** 카테고리 칩을 선택하여 코칭을 받아보세요!`,
          time: timeString
        }
      ]);
    } else {
      setMessages([
        {
          role: 'model',
          content: `**${reportToUse.candidateName}** 지원자의 VOTEST 리포트 분석이 완료되었습니다. **Manager Mode (관리자/QA)** 전용 실시간 매출 리스크 분석 및 현업 실무 온보딩 피드백을 준비했습니다.\n\n아래의 **'결과 요약'** 및 **'채용/배치 판단'** 카테고리를 클릭해 의견을 받아보세요!`,
          time: timeString
        }
      ]);
    }
  };

  // Markdown renderer helper
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
              return <strong key={pIdx} className={`font-extrabold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{part}</strong>;
            }
            return part;
          });

          if (isBullet) {
            return (
              <div key={idx} className={`flex gap-2 ml-2 items-start ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                <span className="text-blue-500 font-bold mt-1">•</span>
                <span className="flex-1 text-[12.5px] font-sans">{renderedLine}</span>
              </div>
            );
          }

          if (cleanLine.startsWith('### ')) {
            return <h4 key={idx} className={`text-[13px] font-black ${darkMode ? 'text-blue-400' : 'text-blue-600'} mt-3 mb-1 tracking-tight font-sans`}>{cleanLine.substring(4)}</h4>;
          }
          if (cleanLine.startsWith('## ')) {
            return <h3 key={idx} className={`text-[14px] font-black ${darkMode ? 'text-white border-zinc-850' : 'text-gray-900 border-zinc-200'} mt-4 mb-2 tracking-tight font-sans border-b pb-1`}>{cleanLine.substring(3)}</h3>;
          }

          return <p key={idx} className={`${darkMode ? 'text-gray-100' : 'text-gray-800'} leading-relaxed text-[12.5px] font-sans`}>{renderedLine}</p>;
        })}
      </div>
    );
  };

  // Nested suggestion chips data based on user selected Role and Category
  const categoryChipsData: Record<'CANDIDATE' | 'MANAGER', Record<string, { label: string; prompt: string }[]>> = {
    CANDIDATE: {
      '점수 확인 및 요약': [
        {
          label: '전체 점수',
          prompt: '제 VOTEST 리포트의 전체 역량 점수와 이에 대한 간단한 총평을 알려주세요.'
        },
        {
          label: '항목별 만점 대비 %',
          prompt: '오프닝, 니즈 발굴, 솔루션 매칭, 이의 처리, 클로징 등 항목별 만점 대비 이행 수준(%)을 요약하여 시각적으로 쉽게 설명해 주세요.'
        },
        {
          label: '카테고리별로 점수',
          prompt: '평가 항목별 상세 점수 현황을 보여주시고 어떤 영역이 우수한지 알려주세요.'
        },
        {
          label: '평가결과 전체 요약',
          prompt: 'VOTEST 세일즈 역량 평가 결과 전체 내용을 일목요연하게 핵심 위주로 요약해 주세요.'
        },
        {
          label: '핵심 포인트 3가지',
          prompt: '제 평가 결과에서 반드시 기억해야 할 3가지 핵심 포인트를 도출해 주세요.'
        }
      ],
      '부족한 점 / 리스크': [
        {
          label: '부족한 부분',
          prompt: '내가 가상 상담 평가에서 가장 부족하거나 감점을 받았던 치명적인 항목은 무엇인지 설명해 주세요.'
        },
        {
          label: '부족한 점이 나타난 상담 내용',
          prompt: '내가 대화록에서 컴플라이언스(예: E0001, E0002 등)를 누락하거나 미흡하게 말한 실제 상담 내용 구간과 원인을 짚어주세요.'
        },
        {
          label: '개선 우선순위 항목',
          prompt: '점수를 높이고 비즈니스 성과를 내기 위해 가장 먼저 개선해야 할 개선 우선순위 항목들을 알려주세요.'
        },
        {
          label: '리스크 방지 방법',
          prompt: '실제 세일즈 현장에서 실수를 반복하지 않고 치명적인 컴플라이언스 리스크를 방지하기 위한 대책을 제안해 주세요.'
        }
      ]
    },
    MANAGER: {
      '결과 요약': [
        {
          label: '지원자 평가 결과 요약',
          prompt: '해당 지원자의 전반적인 세일즈 역량 평가 결과와 종합 진단 사항을 간략히 요약해서 보고해 주세요.'
        },
        {
          label: '평가 하이라이트 추출',
          prompt: '지원자의 상담 내용 및 평가 지표 중에서 가장 눈여겨볼 만한 핵심 평가 하이라이트를 추출해 주세요.'
        },
        {
          label: '장점/단점 요약',
          prompt: '지원자의 세일즈 강점(Strengths)과 약점(Weaknesses)을 한눈에 보기 좋게 대조하여 요약해 주세요.'
        },
        {
          label: '항목별 평가결과',
          prompt: '프로세스별(오프닝, 니즈 발굴, 솔루션 매칭, 이의 처리, 클로징) 평가 점수 및 이행 결과를 개별 분석해 주세요.'
        }
      ],
      '채용/배치 판단': [
        {
          label: '지원자 채용 시 고려해야 할 점',
          prompt: '이 지원자를 우리 팀에 채용하거나 현업에 투입할 때 정성/정량적으로 특별히 고려해야 할 핵심 요인들을 정리해 주세요.'
        },
        {
          label: '채용 추천/보류/비추천',
          prompt: '현재의 컴플라이언스 및 프로세스 지표에 근거했을 때, 이 지원자에 대한 채용 추천 의견(추천/보류/비추천)과 그 타당한 논거를 제시해 주세요.'
        },
        {
          label: '실무 투입/온보딩 플랜',
          prompt: '지원자가 현업 세일즈 환경에 빠르게 안착할 수 있도록 하기 위한 맞춤형 단기 실무 투입(온보딩) 트레이닝 플랜을 수립해 주세요.'
        },
        {
          label: '채용시 리스크',
          prompt: '이 지원자를 그대로 현업에 배정할 경우 우려되는 비즈니스 매출 이탈 리스크나 컴플라이언스 위험 요소를 진단해 주세요.'
        }
      ]
    }
  };

  // Filter candidates based on search
  const filteredCandidates = mockReports.filter(candidate => {
    const matchSearch = candidate.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        candidate.targetRole.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <div className={`relative min-h-screen transition-colors duration-300 ${darkMode ? 'dark bg-[#08090b]' : 'light bg-[#f6f8fa]'} text-zinc-850 dark:text-zinc-100 flex flex-col font-sans select-none overflow-x-hidden`}>
      
      {/* Dynamic ambient blur background glow */}
      <div className={`absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full filter blur-[150px] pointer-events-none transition-opacity duration-1000 ${
        darkMode ? 'bg-blue-500/[0.03] opacity-100' : 'bg-blue-500/[0.015] opacity-100'
      }`} />
      <div className={`absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full filter blur-[130px] pointer-events-none transition-opacity duration-1000 ${
        darkMode ? 'bg-zinc-700/[0.03] opacity-100' : 'bg-zinc-400/[0.02] opacity-100'
      }`} />

      {!gatewaySelected ? (
        <div className="flex-1 flex flex-col z-10">
          {/* Header on Gateway */}
          <header className={`w-full border-b transition-colors duration-300 ${
            darkMode ? 'bg-[#0b0c10]/90 border-zinc-900' : 'bg-white/95 border-zinc-200'
          } sticky top-0 z-40 backdrop-blur-md`}>
            <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center select-none">
                  <svg viewBox="0 0 100 80" className="h-6 w-auto text-[#0052cc] mr-1" fill="currentColor">
                    <circle cx="26" cy="18" r="7.5" />
                    <circle cx="74" cy="18" r="7.5" />
                    <path d="M26 34 L44 58 C47 62 53 62 56 58 L74 34" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  
                  <span className="text-[#0052cc] font-sans font-black tracking-tight text-xl leading-none mr-2">
                    ODA
                  </span>
                  
                  <div className="bg-[#0052cc] px-2 py-0.5 rounded flex items-center justify-center shadow-sm shadow-[#0052cc]/10">
                    <span className="text-white font-sans font-black text-xs leading-none">
                      Bi
                    </span>
                  </div>
                </div>

                <span className={`text-zinc-800 font-light text-base`}>|</span>
                
                <div className="flex flex-col">
                  <span className={`text-xs font-extrabold tracking-wider ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>VOTEST Enterprise Assessment Center</span>
                  <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Corporate Sales Analytics</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  id="theme-toggle-btn-gateway"
                  onClick={() => setDarkMode(!darkMode)}
                  className={`p-2 rounded-xl border transition-all active:scale-[0.95] flex items-center justify-center cursor-pointer ${
                    darkMode 
                      ? 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200' 
                      : 'border-zinc-200 bg-white text-zinc-600 hover:text-zinc-800 shadow-sm'
                  }`}
                  title={darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
                >
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </header>

          {/* Gateway Content */}
          <div className="flex-1 max-w-5xl w-full mx-auto px-6 py-12 md:py-20 flex flex-col justify-center items-center gap-10">
            <div className="text-center space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-500/10 bg-blue-500/5 text-blue-500 text-[11px] font-black uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5" />
                VOTEST AI SALES COACHING SERVICE
              </div>
              <h1 className={`text-3xl md:text-4xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-zinc-900'} leading-tight`}>
                세일즈 역량을 극대화하는 <span className="text-[#0052cc]">VOISOR AI 피드백</span>
              </h1>
              <p className={`text-sm ${darkMode ? 'text-zinc-400' : 'text-zinc-650'} font-semibold max-w-lg mx-auto leading-relaxed`}>
                VOTEST 가상 상담 평가 데이터를 기반으로 상담사 맞춤 롤플레잉 훈련을 제공하는 <span className="font-extrabold text-[#0052cc]">Candidate Mode</span>와 기업 매출 리스크 및 성과를 종합 분석하는 <span className="font-extrabold text-amber-500">Manager Mode</span>를 지원합니다.
              </p>
            </div>

            {/* Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
              {/* Candidate Mode (상담사/TM) Card */}
              <button
                id="gateway-candidate-mode"
                onClick={() => {
                  setCurrentView('CANDIDATE');
                  setSelectedCategory('점수 확인 및 요약');
                  setGatewaySelected(true);
                  setIsChatOpen(true);
                  setSelectedReport(samReport);
                  setStep(3);
                  
                  // Setup chatbot flow messages
                  const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                  setMessages([
                    {
                      role: 'model',
                      content: `안녕하세요! **Candidate Mode (상담사/TM)** 전용 AI 세일즈 코치 VOISOR입니다. 응시하신 가상 상담 평가 점수와 규정 준수 현황을 리포트에 반영했습니다.\n\n좌측의 **'점수 확인 및 요약'**에서 전체 점수와 요약을 간편히 확인해 보시거나, 궁금한 세부 평가 항목에 대해 저에게 질문해 주세요! 어떤 것부터 시작할까요?`,
                      time: timeString
                    }
                  ]);
                }}
                className={`text-left p-8 rounded-3xl transition-all duration-300 active:scale-[0.99] flex flex-col gap-5 group cursor-pointer border shadow-lg relative overflow-hidden ${
                  darkMode 
                    ? 'bg-zinc-950/60 hover:bg-zinc-950 border-zinc-900 hover:border-blue-500/50 hover:shadow-blue-500/5' 
                    : 'bg-white hover:bg-zinc-50/50 border-zinc-200 hover:border-blue-400 hover:shadow-blue-500/5'
                }`}
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                    darkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-[#0052cc] border-blue-100'
                  }`}>
                    <Award className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#0052cc]">상담사 / TM 성장 가이드</span>
                    <h2 className={`font-black text-xl mt-0.5 ${darkMode ? 'text-white' : 'text-zinc-900'} group-hover:text-blue-500 transition-colors`}>
                      Candidate Mode <span className="text-sm font-semibold opacity-85">(상담사/TM)</span>
                    </h2>
                  </div>
                </div>

                <p className={`text-[13px] ${darkMode ? 'text-zinc-400' : 'text-zinc-650'} leading-relaxed font-medium`}>
                  응시자(상담사/TM) 본인의 입장에서 점수 현황 및 컴플라이언스 미준수 항목을 확인하고, 실시간 AI 맞춤 훈련 시뮬레이션을 통해 상담 품질과 실전 능력을 극대화하는 성장을 돕습니다.
                </p>

                <div className={`w-full border-t my-1 ${darkMode ? 'border-zinc-900' : 'border-zinc-200'}`} />

                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>개인 평가 요약 및 성취도 그래프</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>규정 준수율 분석 및 실수 패턴 진단</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>건설적 보완을 위한 1:1 맞춤 피드백</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-extrabold text-[#0052cc] group-hover:translate-x-1.5 transition-transform duration-300">
                  <span>Candidate Mode로 시작하기</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>

              {/* Manager Mode (관리자/QA) Card */}
              <button
                id="gateway-manager-mode"
                onClick={() => {
                  setCurrentView('MANAGER');
                  setSelectedCategory('결과 요약');
                  setGatewaySelected(true);
                  setIsChatOpen(true);
                  setSelectedReport(samReport);
                  setStep(3);
                  
                  // Setup chatbot flow messages
                  const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                  setMessages([
                    {
                      role: 'model',
                      content: `안녕하세요! **Manager Mode (관리자/QA)** 전용 AI 비즈니스 분석기 VOISOR입니다. 지원자들의 가상 상담 평가 기록과 컴플라이언스 충족 통계 분석 결과가 준비되었습니다.\n\n좌측의 **'결과 요약'** 및 **'채용/배치 판단'** 카테고리를 활용해 인사 결정 요약보고를 받아보거나, 실시간 기업 매출 리스크 분석 피드백을 요청해 보세요!`,
                      time: timeString
                    }
                  ]);
                }}
                className={`text-left p-8 rounded-3xl transition-all duration-300 active:scale-[0.99] flex flex-col gap-5 group cursor-pointer border shadow-lg relative overflow-hidden ${
                  darkMode 
                    ? 'bg-zinc-950/60 hover:bg-zinc-950 border-zinc-900 hover:border-amber-500/50 hover:shadow-amber-500/5' 
                    : 'bg-white hover:bg-zinc-50/50 border-zinc-200 hover:border-amber-400 hover:shadow-amber-500/5'
                }`}
              >
                {/* Visual Accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-500/10 to-transparent rounded-bl-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex items-center gap-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center border shadow-sm transition-transform duration-300 group-hover:scale-105 ${
                    darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    <ShieldAlert className="h-7 w-7" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">인사 채용 및 QA 총괄자 전용</span>
                    <h2 className={`font-black text-xl mt-0.5 ${darkMode ? 'text-white' : 'text-zinc-900'} group-hover:text-amber-500 transition-colors`}>
                      Manager Mode <span className="text-sm font-semibold opacity-85">(관리자/QA)</span>
                    </h2>
                  </div>
                </div>

                <p className={`text-[13px] ${darkMode ? 'text-zinc-400' : 'text-zinc-650'} leading-relaxed font-medium`}>
                  관리자 및 평가자 입장에서 지원자들의 세일즈 성과 임팩트와 비즈니스 리스크를 측정하고, 정량/정성적 판단 데이터에 의거해 최적의 부서 배치 및 신입 단기 온보딩 액션 플랜을 제언합니다.
                </p>

                <div className={`w-full border-t my-1 ${darkMode ? 'border-zinc-900' : 'border-zinc-200'}`} />

                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <Check className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>지원자 채용 적합도 및 다면 평가 보고서</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <Check className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>치명적 매출 이탈 리스크 사전 진단</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <Check className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>맞춤형 현업 실무 온보딩 훈련 플랜 제언</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 text-xs font-extrabold text-amber-500 group-hover:translate-x-1.5 transition-transform duration-300">
                  <span>Manager Mode로 시작하기</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            </div>
          </div>

          {/* Aesthetic Dashboard Footer inside Gateway */}
          <footer className={`w-full max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between border-t text-[10px] font-bold uppercase tracking-widest shrink-0 mt-auto transition-colors duration-300 ${
            darkMode ? 'border-zinc-900 text-zinc-400 bg-[#08090b]' : 'border-zinc-200 text-zinc-500 bg-[#f6f8fa]'
          }`}>
            <span>&copy; 2026 VodaBi Inc. All rights reserved.</span>
            <span>VOTEST enterprise AI sales dashboard</span>
          </footer>
        </div>
      ) : (
        <>
          {/* Corporate Dashboard Header Bar */}
          <header className={`w-full border-b transition-colors duration-300 ${
            darkMode ? 'bg-[#0b0c10]/90 border-zinc-900' : 'bg-white/95 border-zinc-200'
          } sticky top-0 z-40 backdrop-blur-md`}>
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Custom SVG People-V Icon */}
            <div className="flex items-center select-none">
              <svg viewBox="0 0 100 80" className="h-6 w-auto text-[#0052cc] mr-1" fill="currentColor">
                <circle cx="26" cy="18" r="7.5" />
                <circle cx="74" cy="18" r="7.5" />
                <path d="M26 34 L44 58 C47 62 53 62 56 58 L74 34" fill="none" stroke="currentColor" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              
              <span className="text-[#0052cc] font-sans font-black tracking-tight text-xl leading-none mr-2">
                ODA
              </span>
              
              <div className="bg-[#0052cc] px-2 py-0.5 rounded flex items-center justify-center shadow-sm shadow-[#0052cc]/10">
                <span className="text-white font-sans font-black text-xs leading-none">
                  Bi
                </span>
              </div>
            </div>

            <span className={`text-zinc-300 dark:text-zinc-800 font-light text-base`}>|</span>
            
            <div className="flex flex-col">
              <span className={`text-xs font-extrabold tracking-wider ${darkMode ? 'text-zinc-200' : 'text-zinc-800'}`}>VOTEST Enterprise Assessment Center</span>
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mt-0.5">Corporate Sales Analytics</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Simulated Auth View Mode Toggle/Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">View Mode:</span>
              <select
                id="simulated-auth-view-mode"
                value={currentView}
                onChange={(e) => handleViewModeChange(e.target.value as 'CANDIDATE' | 'MANAGER')}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg border outline-none focus:ring-1 focus:ring-[#0052cc] cursor-pointer transition-all ${
                  darkMode 
                    ? 'bg-zinc-900 border-zinc-800 text-zinc-200 focus:border-zinc-700 hover:bg-zinc-850' 
                    : 'bg-white border-zinc-200 text-zinc-700 focus:border-zinc-300 hover:bg-zinc-50 shadow-xs'
                }`}
              >
                <option value="CANDIDATE">Simulate: Candidate Logged In</option>
                <option value="MANAGER">Simulate: Manager Logged In</option>
              </select>
            </div>

            {/* Cohort Indicator Select Mock Dropdown */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-400">Active Cohort:</span>
              <span className={`text-xs font-semibold px-3 py-1 rounded-lg border ${
                darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
              }`}>
                2026년 하반기 신입 세일즈 공채 1기
              </span>
            </div>

            {/* Dark/Light mode switcher */}
            <button
              id="theme-toggle-btn"
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-xl border transition-all active:scale-[0.95] flex items-center justify-center cursor-pointer ${
                darkMode 
                  ? 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200' 
                  : 'border-zinc-200 bg-white text-zinc-600 hover:text-zinc-800 shadow-sm'
              }`}
              title={darkMode ? "라이트 모드로 전환" : "다크 모드로 전환"}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard container: Blurred if chatbot popover is active */}
      <div className={`flex-1 max-w-[1400px] w-full mx-auto px-6 py-6 flex gap-6 transition-all duration-500 ${
        isChatOpen ? 'filter blur-[1px] opacity-70 pointer-events-none' : ''
      }`}>
        
        {/* Sidebar Nav */}
        <aside className="hidden">
          <div className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'
          } flex flex-col gap-4`}>
            <div className="text-[10px] uppercase tracking-widest font-black text-zinc-400 px-1">Navigation</div>
            
            <nav className="flex flex-col gap-1">
              <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all text-left ${
                darkMode ? 'bg-[#0052cc]/10 text-blue-400 border border-[#0052cc]/10' : 'bg-blue-50 text-[#0052cc] border border-blue-100'
              }`}>
                <Activity className="h-4 w-4" />
                대시보드 홈 (Overview)
              </button>
              
              <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                darkMode ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}>
                <Users className="h-4 w-4" />
                평가 분석 디렉토리 (Candidates)
              </button>
              
              <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                darkMode ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}>
                <Award className="h-4 w-4" />
                평가 컴플라이언스 준수로그
              </button>

              <button className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
                darkMode ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100'
              }`}>
                <Sparkles className="h-4 w-4 text-amber-500" />
                VOISOR AI 엔진 설정
              </button>
            </nav>
          </div>

          {/* Quick Stats sidebar card */}
          <div className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-zinc-950/20 border-zinc-900' : 'bg-white border-zinc-200'
          } flex flex-col gap-3`}>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">VOISOR Engine Online</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
              VOTEST 음성인식 및 세일즈 평가 AI 엔진이 실시간으로 작동하고 있습니다. 지원자 리포트를 분석하거나 우측 하단의 코치 봇을 호출해 피드백을 시작할 수 있습니다.
            </p>
          </div>
        </aside>

        {/* Dashboard Center View Area */}
        <main className="flex-1 flex flex-col items-center justify-center py-6">
          {/* Centered minimalist candidate results document as a quiet, static sheet background */}
          <div className="w-full max-w-2xl p-8 md:p-12 rounded-3xl border transition-all shadow-2xl bg-white dark:bg-zinc-950/60 border-zinc-200 dark:border-zinc-900 text-zinc-850 dark:text-zinc-100 shadow-zinc-200/40 dark:shadow-black/35">
            
            {/* Document Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-zinc-200/60 dark:border-zinc-900">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-[#0052cc]">
                  VOTEST SALES PERFORMANCE REPORT
                </span>
                <h2 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
                  {selectedReport?.candidateName || "Sam"}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-extrabold uppercase tracking-wider">
                  {selectedReport?.targetRole || "B2B SaaS 테크 영업 담당자"}
                </p>
              </div>
              
              {/* Large score badge */}
              <div className="flex items-center gap-3.5 bg-zinc-500/[0.04] p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-900">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest leading-none mb-1">Total Score</span>
                  <span className="text-3xl font-black text-[#0052cc] font-mono leading-none">
                    {selectedReport?.overallScore || 81} Points
                  </span>
                </div>
                <div className="h-10 w-10 rounded-xl bg-[#0052cc]/10 text-[#0052cc] border border-[#0052cc]/20 flex items-center justify-center shrink-0">
                  <Award className="h-5 w-5" />
                </div>
              </div>
            </div>

            {/* Document Specs */}
            <div className="grid grid-cols-2 gap-4 py-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-900/50">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-zinc-400 block mb-0.5">Evaluation ID</span>
                <span className="font-mono text-zinc-850 dark:text-zinc-300">
                  {selectedReport?.id || "votest-sam-01"}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[9px] uppercase tracking-wider text-[#0052cc] block mb-0.5">Assessment Date</span>
                <span className="font-mono text-zinc-850 dark:text-zinc-300">
                  {selectedReport?.date || "2026-07-07"}
                </span>
              </div>
            </div>

            {/* Compliance section */}
            <div className="mt-8 space-y-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-[#0052cc]" />
                <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  평가 필수 준수 항목 리스트 (Compliance Metrics)
                </h3>
              </div>

              <div className="divide-y divide-zinc-150 dark:divide-zinc-900">
                {(selectedReport?.compliances || [
                  {
                    id: "E0001",
                    label: "E0001 인사말, 성명, 소속 모두 구사",
                    passed: false,
                    description: "인사, 본인 이름, 회사 소속 중 한 가지 이상 누락 (만점 기준: 인사, 이름, 소속 모두 안내)",
                    impact: "첫인상 형성 실패 및 소속원 신뢰 저하 리스크"
                  },
                  {
                    id: "E0002",
                    label: "E0002 본인확인 절차 이행",
                    passed: false,
                    description: "본인 확인 시도만 수행 (만점 기준: 매뉴얼에 명시된 주요 본인확인 정보 수집)",
                    impact: "개인 정보 법적 의무 준수 및 오응대 리스크"
                  },
                  {
                    id: "E0003",
                    label: "E0003 용건 안내의 명확성",
                    passed: true,
                    description: "전화 연락의 주요 목적과 제품 혜택 요약을 구사하여 명확히 설명 완료",
                    impact: "상담 주도권을 선점하고 고객 대기 시간 단축 효과"
                  },
                  {
                    id: "E0004",
                    label: "E0004 감사 표현 및 실명 구사",
                    passed: true,
                    description: "통화 마무리에 대한 감사 인사와 자신의 소속 및 이름을 친절하게 명시함",
                    impact: "브랜드 호감도 증가 및 정중한 상담 종결 경험 제공"
                  }
                ]).map((c) => (
                  <div key={c.id} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1 max-w-lg text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-zinc-400 dark:text-zinc-500">
                          [{c.id}]
                        </span>
                        <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                          {c.label.replace(c.id + " ", "")}
                        </h4>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
                        {c.description}
                      </p>
                      {c.impact && (
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 italic font-semibold">
                          • 기대 효과/리스크: {c.impact}
                        </p>
                      )}
                    </div>

                    <div className="shrink-0">
                      {c.passed ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 text-[10px] font-black uppercase tracking-wider border border-emerald-500/20">
                          <Check className="h-3 w-3" />
                          준수 (Passed)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-500 text-[10px] font-black uppercase tracking-wider border border-rose-500/20">
                          <X className="h-3 w-3" />
                          미준수 (Failed)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="hidden">
            {/* Section: Dynamic Metrics Row */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Total Candidates */}
            <div className={`p-5 rounded-2xl border transition-colors ${
              darkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">총 평가 완료 인원</span>
                <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500"><Users className="h-3.5 w-3.5" /></span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">142명</span>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +12.4%
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-1 font-semibold uppercase tracking-wider">이번 주 신규 평가: 18명</div>
            </div>

            {/* Card 2: Avg Sales Competency Score */}
            <div className={`p-5 rounded-2xl border transition-colors ${
              darkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">평균 세일즈 스코어</span>
                <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500"><BarChart2 className="h-3.5 w-3.5" /></span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">76.2점</span>
                <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-0.5">
                  <TrendingUp className="h-3 w-3" /> +2.1점
                </span>
              </div>
              {/* Simple progress metric */}
              <div className={`h-1 w-full ${darkMode ? 'bg-zinc-900' : 'bg-zinc-100'} rounded-full mt-2 overflow-hidden`}>
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '76.2%' }} />
              </div>
            </div>

            {/* Card 3: Compliance Pass Rate */}
            <div className={`p-5 rounded-2xl border transition-colors ${
              darkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">필수 규정 준수율</span>
                <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500"><CheckCircle2 className="h-3.5 w-3.5" /></span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">91.8%</span>
                <span className="text-[10px] text-zinc-400 font-bold flex items-center">안정권</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-1 font-semibold uppercase tracking-wider">용건안내 준수율 96% 최우수</div>
            </div>

            {/* Card 4: Immediate Coaching Alert */}
            <div className={`p-5 rounded-2xl border transition-colors ${
              darkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'
            }`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-black tracking-widest text-zinc-400">집중 지도 필요 인원</span>
                <span className="p-1.5 rounded-lg bg-rose-500/10 text-rose-500"><AlertCircle className="h-3.5 w-3.5" /></span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight text-rose-500">18명</span>
                <span className="text-[10px] text-rose-500 font-bold flex items-center gap-0.5">
                  <TrendingDown className="h-3 w-3" /> +3명
                </span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-1 font-semibold uppercase tracking-wider">이의 제기 방어 취약 32명</div>
            </div>

          </section>

          {/* Section: Visual Analytics Graphics Row */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Widget 1: Process achievement bars */}
            <div className={`p-5 rounded-2xl border transition-colors ${
              darkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'
            } space-y-4`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  5대 세일즈 프로세스 부서 평균 성취 지표
                </h3>
                <span className="text-[10px] font-mono text-zinc-400">Total Avg: 73.4%</span>
              </div>

              <div className="space-y-3">
                {[
                  { label: '오프닝 (Opening)', val: 84, color: 'bg-emerald-500' },
                  { label: '니즈 발굴 (Needs Discovery)', val: 68, color: 'bg-blue-500' },
                  { label: '솔루션 매칭 (Solution Matching)', val: 72, color: 'bg-blue-500' },
                  { label: '이의 처리 (Objection Handling)', val: 54, color: 'bg-amber-500' },
                  { label: '클로징 (Closing)', val: 82, color: 'bg-emerald-500' },
                ].map((item, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center text-[10.5px]">
                      <span className="font-bold">{item.label}</span>
                      <span className="font-mono font-bold">{item.val}%</span>
                    </div>
                    <div className={`h-1.5 w-full ${darkMode ? 'bg-zinc-900' : 'bg-zinc-100'} rounded-full overflow-hidden`}>
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 2: High-fidelity SVG Wave Activity Line Chart */}
            <div className={`p-5 rounded-2xl border transition-colors ${
              darkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'
            } flex flex-col justify-between`}>
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  최근 4주간 평가 응시인원 및 동향
                </h3>
                <span className="text-[10px] font-mono text-zinc-400">Unit: Candidates</span>
              </div>

              {/* Sophisticated SVG Graph */}
              <div className="relative h-44 w-full mt-4 flex items-end">
                {/* Y Axis gridlines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-zinc-500 w-full" />
                  <div className="border-b border-zinc-500 w-full" />
                  <div className="border-b border-zinc-500 w-full" />
                  <div className="border-b border-zinc-500 w-full" />
                </div>

                {/* SVG Path */}
                <svg className="w-full h-32 overflow-visible" viewBox="0 0 400 128" preserveAspectRatio="none">
                  {/* Area beneath curve */}
                  <path 
                    d="M 0 128 L 50 100 Q 110 40 150 70 T 250 30 T 350 15 L 400 10 L 400 128 Z" 
                    fill="url(#waveGradient)" 
                    className="opacity-15 dark:opacity-20"
                  />
                  {/* Wave curve line */}
                  <path 
                    d="M 0 128 L 50 100 Q 110 40 150 70 T 250 30 T 350 15 L 400 10" 
                    fill="none" 
                    stroke="#0052cc" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                  />
                  {/* Data Points */}
                  <circle cx="50" cy="100" r="5" fill="#0052cc" className="stroke-white dark:stroke-zinc-950 stroke-2" />
                  <circle cx="150" cy="70" r="5" fill="#0052cc" className="stroke-white dark:stroke-zinc-950 stroke-2" />
                  <circle cx="250" cy="30" r="5" fill="#0052cc" className="stroke-white dark:stroke-zinc-950 stroke-2" />
                  <circle cx="350" cy="15" r="5" fill="#0052cc" className="stroke-white dark:stroke-zinc-950 stroke-2" />
                  
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0052cc" />
                      <stop offset="100%" stopColor="#0052cc" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* X Axis Labels */}
                <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2 text-[9px] font-bold text-zinc-400 font-mono">
                  <span>W22 (06/10)</span>
                  <span>W23 (06/17)</span>
                  <span>W24 (06/24)</span>
                  <span>W25 (07/01)</span>
                </div>
              </div>
            </div>

          </section>

          {/* Section: Candidate Evaluation Directory Table */}
          <section className={`rounded-2xl border transition-colors ${
            darkMode ? 'bg-zinc-950/40 border-zinc-900' : 'bg-white border-zinc-200 shadow-xs'
          } overflow-hidden`}>
            
            {/* Table Control Header */}
            <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              darkMode ? 'border-zinc-900' : 'border-zinc-150'
            }`}>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0052cc]" />
                <h3 className="text-xs font-black uppercase tracking-widest">
                  지원자 평가 진단 디렉토리 (Interactive Assessment Records)
                </h3>
              </div>

              {/* Mock search filter */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center px-3 py-1.5 rounded-lg border text-xs gap-1.5 ${
                  darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <Search className="h-3.5 w-3.5 text-zinc-400" />
                  <input 
                    type="text" 
                    placeholder="지원자 이름 또는 직무 검색..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-[11px] w-40 placeholder-zinc-400 font-medium"
                  />
                </div>
              </div>
            </div>

            {/* Assessment Records Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b text-[10px] font-black uppercase tracking-wider ${
                    darkMode ? 'border-zinc-900 text-zinc-400 bg-zinc-950/30' : 'border-zinc-150 text-zinc-500 bg-zinc-50/50'
                  }`}>
                    <th className="py-3 px-5">지원자 성명</th>
                    <th className="py-3 px-5">지원 분야 (Role)</th>
                    <th className="py-3 px-5 text-center">VOTEST 스코어</th>
                    <th className="py-3 px-5 text-center">규정 준수율 (Compliance)</th>
                    <th className="py-3 px-5">AI 판단 종합 요약</th>
                    <th className="py-3 px-5 text-right">인공지능 진단 / 액션</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-900">
                  {filteredCandidates.map((cand) => {
                    const complCount = cand.compliances?.filter(c => c.passed).length || 0;
                    const complTotal = cand.compliances?.length || 4;
                    const complPct = Math.round((complCount / complTotal) * 100);

                    return (
                      <tr key={cand.id} className="hover:bg-zinc-500/[0.02] transition-colors text-xs">
                        {/* Name Column */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-blue-500/10 text-[#0052cc] border border-[#0052cc]/10 flex items-center justify-center font-black text-xs">
                              {cand.candidateName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-extrabold text-zinc-900 dark:text-zinc-100">{cand.candidateName}</div>
                              <div className="text-[10px] text-zinc-400 font-mono mt-0.5">Assessed: {cand.date}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role Column */}
                        <td className="py-4 px-5">
                          <div className="font-semibold text-zinc-800 dark:text-zinc-200">{cand.targetRole}</div>
                        </td>

                        {/* Score Column */}
                        <td className="py-4 px-5 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black font-mono ${
                            cand.overallScore >= 85 
                              ? 'bg-emerald-500/10 text-emerald-500' 
                              : cand.overallScore >= 70 
                                ? 'bg-blue-500/10 text-blue-500' 
                                : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {cand.overallScore}점
                          </span>
                        </td>

                        {/* Compliance Rate */}
                        <td className="py-4 px-5 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`text-[10px] font-bold ${
                              complPct >= 100 ? 'text-emerald-500' : complPct >= 75 ? 'text-blue-500' : 'text-rose-500'
                            }`}>
                              {complCount} / {complTotal} 통과 ({complPct}%)
                            </span>
                            <div className={`h-1 w-16 ${darkMode ? 'bg-zinc-900' : 'bg-zinc-100'} rounded-full overflow-hidden`}>
                              <div className={`h-full ${complPct >= 100 ? 'bg-emerald-500' : complPct >= 75 ? 'bg-blue-500' : 'bg-rose-500'} rounded-full`} style={{ width: `${complPct}%` }} />
                            </div>
                          </div>
                        </td>

                        {/* Core evaluation summary snippet */}
                        <td className="py-4 px-5 max-w-[240px]">
                          <p className={`text-[11px] truncate font-medium ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`} title={cand.summary}>
                            {cand.summary}
                          </p>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedReport(cand);
                                setShowReport(true);
                              }}
                              className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold transition-all active:scale-[0.97] cursor-pointer ${
                                darkMode 
                                  ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white' 
                                  : 'bg-white border-zinc-200 text-zinc-850 hover:bg-zinc-100 hover:text-zinc-900 shadow-2xs'
                              }`}
                            >
                              상세평가서
                            </button>
                            <button
                              onClick={() => handleLaunchCandidateCoaching(cand, 'CANDIDATE')}
                              className="px-2.5 py-1.5 rounded-lg bg-[#0052cc] hover:bg-[#004bb3] text-white text-[10px] font-extrabold transition-all active:scale-[0.97] shadow-sm flex items-center gap-1 cursor-pointer"
                            >
                              <span>VOISOR 피드백</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredCandidates.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-zinc-400 font-bold">
                        검색 결과와 매칭되는 지원자 리포트가 없습니다.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer informational line */}
            <div className={`p-4 text-[10px] text-zinc-400 font-bold uppercase tracking-wider text-center ${
              darkMode ? 'bg-zinc-950/20' : 'bg-zinc-50/50'
            }`}>
              * 상단의 'VOISOR 피드백' 버튼을 누르면 해당 지원자의 실제 평가 리포트를 기반으로 하는 AI 코치봇 팝업창이 실시간으로 시작됩니다.
            </div>
          </section>
          </div>
        </main>
      </div>

      {/* Floating Action Button (FAB) for the collapsible support chatbot widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">
        
        {/* Help tooltip bubble above FAB (Conditionally visible when chat is closed) */}
        {!isChatOpen && showWelcomeBubble && (
          <div className={`animate-bounce px-4 py-2.5 rounded-2xl border shadow-xl flex items-center gap-2 text-xs font-bold max-w-xs ${
            darkMode 
              ? 'bg-zinc-900 border-zinc-800 text-white shadow-black/40' 
              : 'bg-white border-zinc-200 text-zinc-800 shadow-zinc-300/40'
          }`}>
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="leading-tight">VOTEST AI 세일즈 코치 VOISOR와 대화해 보세요!</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowWelcomeBubble(false);
              }}
              className="p-1 text-zinc-400 hover:text-zinc-200 rounded"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Circular Floating Action Button */}
        <button
          id="chat-fab-button"
          onClick={() => {
            setIsChatOpen(!isChatOpen);
            setShowWelcomeBubble(false);
          }}
          className={`h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer shadow-2xl hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 relative ${
            isChatOpen 
              ? 'bg-slate-900 text-white shadow-lg border-0' 
              : 'bg-[#0052cc] hover:bg-[#004bb3] text-white shadow-[#0052cc]/30'
          }`}
          title={isChatOpen ? "코칭 어시스턴트 닫기" : "VOISOR AI 세일즈 코칭 시작"}
        >
          {isChatOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <>
              {/* Dynamic pulse indicator when closed */}
              <span className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping" />
              <MessageSquare className="h-6 w-6" />
              
              {/* Glow badge alert count */}
              <span className="absolute -top-1.5 -right-1 h-5 w-5 rounded-full bg-rose-500 text-[10px] text-white font-black flex items-center justify-center border-2 border-[#08090b] shadow-md">
                1
              </span>
            </>
          )}
        </button>
      </div>

      {/* Collapsible Customer-Service Style Floating Popover Widget */}
      <div 
        className={`fixed bottom-24 right-6 w-[430px] h-[640px] max-w-[calc(100vw-32px)] max-h-[calc(100vh-120px)] z-40 rounded-2xl shadow-[0_24px_50px_rgba(0,0,0,0.35)] flex flex-col overflow-hidden border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isChatOpen 
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto' 
            : 'opacity-0 translate-y-12 scale-90 pointer-events-none'
        } ${
          darkMode 
            ? 'bg-zinc-900/95 border-zinc-800/80 text-[#f4f4f5] backdrop-blur-xl shadow-black/50' 
            : 'bg-white/95 border-zinc-200 text-zinc-800 backdrop-blur-xl shadow-zinc-300/50'
        }`}
      >
        {/* Elevated Chat Header */}
        <header className={`px-5 py-4 border-b flex items-center justify-between shrink-0 select-none ${
          darkMode ? 'border-zinc-800/60 bg-zinc-950/50' : 'border-zinc-200 bg-zinc-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`h-9 w-9 rounded-xl flex items-center justify-center border ${
              step === 3
                ? (currentView === 'CANDIDATE' 
                    ? (darkMode ? 'bg-zinc-850 text-white border-zinc-700' : 'bg-zinc-100 text-zinc-800 border-zinc-200') 
                    : (darkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-100'))
                : (darkMode ? 'bg-zinc-900 text-zinc-400 border-zinc-800' : 'bg-zinc-100 text-zinc-500 border-zinc-200')
            }`}>
              {step === 3 ? (
                currentView === 'CANDIDATE' ? <Award className="h-5 w-5 text-emerald-500" /> : <ShieldAlert className="h-5 w-5 text-amber-500" />
              ) : (
                <Sparkles className="h-4.5 w-4.5 text-blue-500 animate-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`font-black text-xs ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {step === 3 ? (
                    currentView === 'CANDIDATE' ? 'VOISOR Candidate Coach' : 'VOISOR Manager Risk Advisor'
                  ) : (
                    'VOISOR AI Onboarding'
                  )}
                </span>
                <span className={`text-[8px] px-1 py-0.2 rounded font-extrabold tracking-wider uppercase select-none ${
                  step === 3
                    ? (darkMode ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-emerald-50 text-emerald-600 border border-emerald-100')
                    : (darkMode ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-zinc-200 text-zinc-600 border border-zinc-300/40')
                }`}>
                  {step === 3 ? 'ACTIVE' : 'SETUP'}
                </span>
              </div>
              <p className={`text-[10px] ${darkMode ? 'text-zinc-400' : 'text-zinc-500'} font-medium`}>
                {step === 3 ? (
                  <>대상자: <strong className={darkMode ? 'text-zinc-200' : 'text-gray-900'}>{selectedReport?.candidateName.split(' ')[0]}</strong> &bull; {selectedReport?.targetRole.split(' ')[0]}</>
                ) : (
                  '실시간 세일즈 역량 평가 코치봇'
                )}
              </p>
            </div>
          </div>

          {/* Header Action controls */}
          <div className="flex items-center gap-1.5">
            {/* Header Mini close */}
            <button 
              onClick={() => setIsChatOpen(false)}
              className={`p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 transition-all cursor-pointer ${
                darkMode ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200'
              }`}
              title="최소화"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Chat Message Scroll Box */}
        <div className={`flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin ${
          darkMode ? 'scrollbar-thumb-zinc-800' : 'scrollbar-thumb-zinc-300'
        } scrollbar-track-transparent bg-transparent`}>
          
          {messages.map((msg, index) => {
            const isModel = msg.role === 'model';
            const roleLabel = isModel 
              ? (step === 3 ? (currentView === 'CANDIDATE' ? 'VOISOR 코칭 어드바이저' : 'VOISOR 리스크 분석 리더') : 'VOISOR AI') 
              : '나의 요청';
            
            return (
              <div 
                key={index} 
                className={`flex flex-col max-w-[88%] ${isModel ? 'self-start' : 'self-end ml-auto'}`}
              >
                <span className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${
                  isModel 
                    ? (darkMode ? 'text-zinc-400' : 'text-zinc-500') 
                    : 'text-blue-500 self-end'
                }`}>
                  {roleLabel}
                </span>

                <div className={`p-3.5 text-xs leading-relaxed rounded-2xl shadow-sm ${
                  isModel 
                    ? (darkMode ? 'bg-zinc-950/90 border border-zinc-850 text-gray-100' : 'bg-zinc-50 border border-zinc-200 text-gray-800') 
                    : (darkMode ? 'bg-[#0052cc] text-white' : 'bg-[#0052cc] text-white')
                } ${isModel ? 'rounded-tl-none' : 'rounded-tr-none'}`}>
                  {isModel ? (
                    <div className={`prose ${darkMode ? 'prose-invert text-gray-100' : 'text-gray-800'} max-w-none leading-relaxed font-sans text-xs`}>
                      {renderMarkdownText(msg.content)}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap font-sans text-white text-xs">
                      {msg.content}
                    </div>
                  )}
                </div>

                <span className={`text-[8px] mt-1 font-mono text-zinc-400 ${!isModel && 'self-end'}`}>
                  {msg.time}
                </span>
              </div>
            );
          })}

          {/* Interactive Role selection cards inside chatbot feed */}
          {step === 1 && (
            <div className="flex flex-col gap-3 w-full max-w-md mt-2">
              {/* Option 1: Candidate Coaching */}
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
                className={`text-left p-4 rounded-xl transition-all active:scale-[0.98] flex flex-col gap-2 group cursor-pointer shadow-sm ${
                  darkMode 
                    ? 'bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-850 hover:border-zinc-700/80' 
                    : 'bg-zinc-50 hover:bg-white border border-zinc-200 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
                    darkMode ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-[#0052cc] border-blue-100'
                  }`}>
                    <Award className="h-4.5 w-4.5" />
                  </div>
                  <h3 className={`font-black text-xs ${darkMode ? 'text-white' : 'text-zinc-900'} group-hover:text-blue-500 transition-colors`}>
                    Candidate (지원자 성장 모드)
                  </h3>
                </div>
                <p className={`text-[10.5px] ${darkMode ? 'text-zinc-400' : 'text-zinc-800'} leading-relaxed font-medium`}>
                  응시자 입장에서 점수 현황 및 컴플라이언스 위험 항목을 극복하고 개선하기 위한 건설적인 훈련 롤플레잉 가이드를 제공합니다.
                </p>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-black text-[#0052cc]">
                  <span>선택하기</span> &rarr;
                </div>
              </button>

              {/* Option 2: Manager Risk Advisor */}
              <button
                id="select-manager-mode"
                onClick={() => {
                  setCurrentView('MANAGER');
                  const timeString = new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                  setMessages(prev => [
                    ...prev,
                    {
                      role: 'user',
                      content: '관리자 리스크 분석 모드(Manager Mode) 선택됨',
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
                className={`text-left p-4 rounded-xl transition-all active:scale-[0.98] flex flex-col gap-2 group cursor-pointer shadow-sm ${
                  darkMode 
                    ? 'bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-850 hover:border-zinc-700/80' 
                    : 'bg-zinc-50 hover:bg-white border border-zinc-200 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${
                    darkMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-amber-50 text-amber-600 border-amber-100'
                  }`}>
                    <ShieldAlert className="h-4.5 w-4.5" />
                  </div>
                  <h3 className={`font-black text-xs ${darkMode ? 'text-white' : 'text-zinc-900'} group-hover:text-amber-500 transition-colors`}>
                    Manager (관리자 진단 모드)
                  </h3>
                </div>
                <p className={`text-[10.5px] ${darkMode ? 'text-zinc-400' : 'text-zinc-800'} leading-relaxed font-medium`}>
                  채용 담당자 입장에서 지원자의 성과 임팩트, 핵심 누락 리스크, 온보딩 조치 플랜 및 부서 추천 여부를 정밀 분석합니다.
                </p>
                <div className="mt-1 flex items-center gap-1 text-[10px] font-black text-amber-500">
                  <span>선택하기</span> &rarr;
                </div>
              </button>
            </div>
          )}

          {/* Interactive File upload inside chatbot feed */}
          {step === 2 && (
            <div className={`p-4 rounded-xl border flex flex-col gap-3 max-w-sm mt-1 self-start ${
              darkMode ? 'bg-zinc-950/70 border-zinc-850' : 'bg-zinc-50 border-zinc-200 shadow-xs'
            }`}>
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border border-dashed rounded-lg p-5 text-center transition-all ${
                  dragActive 
                    ? 'border-blue-500 bg-blue-500/5' 
                    : (darkMode ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/20' : 'border-zinc-300 hover:border-blue-400 bg-white')
                }`}
              >
                <Upload className="h-5 w-5 mx-auto mb-1.5 text-zinc-400" />
                <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-zinc-800'}`}>평가서 PDF 파일 드롭</p>
                
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
                  className={`mt-2.5 px-2.5 py-1 rounded text-[10px] font-black border transition-all active:scale-[0.97] cursor-pointer ${
                    darkMode 
                      ? 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:bg-zinc-800' 
                      : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  파일 검색하기
                </button>

                {selectedFileName && (
                  <div className="mt-2 text-[10px] text-emerald-500 font-bold flex items-center justify-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {selectedFileName.substring(0, 20)}...
                  </div>
                )}
              </div>

              {/* Paste Text Area */}
              <textarea
                id="analysis-text-input-inline"
                rows={2}
                value={uploadText}
                onChange={(e) => setUploadText(e.target.value)}
                placeholder="또는 리포트 텍스트 전문을 붙여넣으세요..."
                className={`w-full px-2.5 py-2 rounded-lg text-[10px] border outline-none focus:border-blue-500 focus-visible:ring-1 focus-visible:ring-blue-500 transition-all resize-none font-sans ${
                  darkMode 
                    ? 'border-zinc-850 bg-zinc-900 text-zinc-200 placeholder-zinc-500' 
                    : 'border-zinc-200 bg-white text-zinc-800 placeholder-zinc-400'
                }`}
              />

              {uploadError && (
                <div className="text-[10px] text-rose-500 font-bold bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded">
                  {uploadError}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  id="run-analysis-btn-inline"
                  onClick={handleRunAnalysis}
                  disabled={isAnalyzing}
                  className="flex-1 px-3 py-1.5 rounded-lg text-[10px] font-black bg-[#0052cc] hover:bg-[#004bb3] text-white disabled:opacity-40 disabled:pointer-events-none transition-all active:scale-[0.97] flex items-center justify-center gap-1 shadow-sm"
                >
                  {isAnalyzing ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <span>정밀 분석</span>
                      <ArrowRight className="h-3 w-3" />
                    </>
                  )}
                </button>

                <button
                  id="use-demo-report-btn"
                  onClick={handleUseDemoReport}
                  disabled={isAnalyzing}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all active:scale-[0.97] cursor-pointer border ${
                    darkMode 
                      ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700' 
                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border-zinc-200'
                  }`}
                >
                  데모로 시작
                </button>
              </div>

              {/* Wizard roll back */}
              <button
                onClick={() => setStep(1)}
                className="text-[10px] font-bold text-zinc-400 hover:text-white flex items-center gap-1 mt-1 justify-center"
              >
                &larr; 이전 단계로 가기
              </button>
            </div>
          )}

          {chatLoading && (
            <div className="self-start flex flex-col max-w-[85%] w-full animate-pulse">
              <span className={`text-[9px] font-bold uppercase tracking-wider mb-1 ${
                darkMode ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                {currentView === 'CANDIDATE' ? 'VOISOR 코칭 어드바이저' : 'VOISOR 리스크 분석 리더'}
              </span>
              <div className={`border p-3.5 rounded-2xl rounded-tl-none flex flex-col gap-2 ${
                darkMode ? 'bg-zinc-950/90 border-zinc-850' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                  </span>
                  <span className={`text-[9.5px] font-black ${darkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>AI 분석 답변 생성 중...</span>
                </div>
                <div className={`h-1 rounded-md w-3/4 ${darkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                <div className={`h-1 rounded-md w-1/2 ${darkMode ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Dynamic Category Tabs and Scrollable Suggestions Inside the Widget */}
        {step === 3 && !chatLoading && messages.length > 0 && (
          <div className={`px-5 py-3 border-t shrink-0 flex flex-col gap-2 ${
            darkMode ? 'border-zinc-800/40 bg-zinc-950/40' : 'border-zinc-200 bg-zinc-50'
          }`}>
            <div className="flex items-center justify-between w-full">
              <span className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                darkMode ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                <FileText className="h-3.5 w-3.5 text-blue-500" />
                추천 분석 항목
              </span>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleScrollChips('left')}
                  className={`p-1 rounded border transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
                    darkMode
                      ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => handleScrollChips('right')}
                  className={`p-1 rounded border transition-all active:scale-95 cursor-pointer flex items-center justify-center ${
                    darkMode
                      ? 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-850'
                      : 'border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Sub category tabs */}
            <div className="flex items-center gap-1.5 border-b border-zinc-800/10 dark:border-zinc-800/40 pb-1.5">
              {(currentView === 'CANDIDATE' 
                ? ['점수 확인 및 요약', '부족한 점 / 리스크'] 
                : ['결과 요약', '채용/배치 판단']
              ).map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`text-[9px] px-2 py-0.5 rounded font-bold border transition-all ${
                      isActive
                        ? 'bg-[#0052cc] border-[#0052cc] text-white font-extrabold shadow-xs'
                        : darkMode
                          ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
                          : 'bg-white border-gray-300 text-zinc-600 hover:text-zinc-800 hover:bg-gray-50'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Suggestion Chips list */}
            <div className="relative overflow-hidden w-full">
              {/* Fade overlays for fluid UX */}
              <div className={`absolute top-0 bottom-0 left-0 w-4 bg-gradient-to-r ${
                darkMode ? 'from-zinc-900/90' : 'from-white/90'
              } to-transparent pointer-events-none z-10`} />
              <div className={`absolute top-0 bottom-0 right-0 w-4 bg-gradient-to-l ${
                darkMode ? 'from-zinc-900/90' : 'from-white/90'
              } to-transparent pointer-events-none z-10`} />

              <div 
                ref={chipsScrollRef}
                className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none px-4"
              >
                {(categoryChipsData[currentView][selectedCategory] || []).map((qa, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(qa.label, qa.prompt)}
                    disabled={chatLoading}
                    className={`shrink-0 text-[10px] px-3 py-1 border transition-all active:scale-[0.97] flex items-center gap-1 cursor-pointer disabled:opacity-40 rounded-full font-bold ${
                      darkMode 
                        ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-[#0052cc]/10 hover:text-white hover:border-blue-500' 
                        : 'bg-white border-gray-300 text-zinc-700 hover:bg-gray-50 hover:text-zinc-900 hover:border-gray-400'
                    }`}
                  >
                    <span>{qa.label}</span>
                    <span className="text-[8px] opacity-60">&rarr;</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Floating Chatbottom action bar depending on setup stage */}
        <div className={`border-t flex flex-col shrink-0 ${
          darkMode ? 'border-zinc-800/60 bg-zinc-950' : 'border-zinc-200 bg-zinc-50'
        }`}>
          
          {step === 3 && (
            <div className="flex items-center">
              <input
                id="chat-message-input"
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  currentView === 'CANDIDATE' 
                    ? "세일즈 피드백이나 롤플레잉에 대해 질문해 보세요..." 
                    : "코칭 피드백 또는 개선 플랜에 대해 제언해 주세요..."
                }
                disabled={chatLoading}
                className={`flex-1 px-4 py-3 bg-transparent placeholder-zinc-400 text-xs border-none outline-none focus:ring-0 focus:outline-none disabled:cursor-not-allowed font-sans ${
                  darkMode ? 'text-zinc-100' : 'text-zinc-800'
                }`}
              />
              
              <button
                id="send-chat-button"
                onClick={() => handleSendMessage()}
                disabled={!chatInput.trim() || chatLoading}
                className={`h-11 w-11 border-l bg-transparent hover:bg-blue-500/10 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-[0.97] flex items-center justify-center font-bold ${
                  darkMode ? 'border-zinc-850' : 'border-zinc-200'
                }`}
              >
                <Send className="h-4 w-4 text-blue-500" />
              </button>
            </div>
          )}

          {/* Quick interactive utility links bottom rail */}
          <div className={`px-4 py-2 flex items-center justify-between text-[9px] font-bold uppercase tracking-wider ${
            darkMode ? 'bg-zinc-950/80 text-zinc-400 border-t border-zinc-850/40' : 'bg-zinc-100 text-zinc-500 border-t border-zinc-200'
          }`}>
            <div className="flex items-center gap-1.5">
              {step > 1 && (
                <button 
                  onClick={handleRestart}
                  className="hover:text-blue-500 flex items-center gap-0.5"
                >
                  <ArrowLeft className="h-3 w-3" /> 초기설정
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {step === 3 && selectedReport && (
                <>
                  <button 
                    onClick={() => {
                      setCurrentView(currentView === 'CANDIDATE' ? 'MANAGER' : 'CANDIDATE');
                    }}
                    className="hover:text-blue-500 flex items-center gap-0.5"
                  >
                    뷰 전환 ({currentView === 'CANDIDATE' ? '관리자용' : '지원자용'})
                  </button>
                  <span className="opacity-30">|</span>
                  <button 
                    onClick={() => setShowReport(true)}
                    className="hover:text-blue-500 text-[#0052cc]"
                  >
                    점수 {selectedReport.overallScore}점 리포트
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Floating Detailed Slide-In Report Panel Modal */}
      {showReport && selectedReport && (
        <ReportPanel 
          report={selectedReport} 
          view={currentView} 
          onClose={() => setShowReport(false)} 
          darkMode={darkMode}
        />
      )}

      {/* Aesthetic Dashboard Footer */}
      <footer className={`w-full max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between border-t text-[10px] font-bold uppercase tracking-widest shrink-0 mt-auto ${
        darkMode ? 'border-zinc-900/50 text-zinc-400 bg-[#08090b]' : 'border-zinc-200 text-zinc-500 bg-[#f6f8fa]'
      }`}>
        <span>&copy; 2026 VodaBi Inc. All rights reserved.</span>
        <span>VOTEST enterprise AI sales dashboard</span>
      </footer>
      </>
      )}

    </div>
  );
}
