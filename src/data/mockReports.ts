export interface VotestReport {
  id: string;
  candidateName: string;
  targetRole: string;
  date: string;
  overallScore: number;
  scores: {
    opening: number;
    needsDiscovery: number;
    solutionMatching: number;
    objectionHandling: number;
    closing: number;
  };
  compliances: {
    id: string;
    label: string;
    passed: boolean;
    description: string;
    impact: string;
  }[];
  strengths: string[];
  weaknesses: string[];
  transcriptExcerpt: string;
  summary: string;
}

export const samReport: VotestReport = {
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

export const sarahReport: VotestReport = {
  id: "votest-sarah-02",
  candidateName: "Sarah Kang (ID: TM-2026-0922)",
  targetRole: "APAC 엔터프라이즈 대표 영업",
  date: new Date().toISOString().split('T')[0],
  overallScore: 94,
  scores: {
    opening: 95,
    needsDiscovery: 90,
    solutionMatching: 95,
    objectionHandling: 90,
    closing: 100
  },
  compliances: [
    {
      id: "E0001",
      label: "E0001 인사말, 성명, 소속 모두 구사",
      passed: true,
      description: "오프닝에서 정확한 소속 사명과 직책, 성명을 품위 있게 전달함",
      impact: "브랜드 신뢰도를 최고 수준으로 어필하는 긍정적인 첫인상 구축"
    },
    {
      id: "E0002",
      label: "E0002 본인확인 이행",
      passed: true,
      description: "상대방의 직함과 권한을 정중하게 물어보는 등 본인 확인 절차를 정확히 수행함",
      impact: "법적 정보보호 준수 및 영업 협상의 실무 타당성 사전 검증 완료"
    },
    {
      id: "E0003",
      label: "E0003 용건안내",
      passed: true,
      description: "비즈니스 통화의 목적과 오늘 얻고자 하는 합의 사항을 서두에 명확히 명시함",
      impact: "미팅 아젠다 선점을 통한 주도권 확보 및 미팅 효율 극대화"
    },
    {
      id: "E0004",
      label: "E0004 감사인사, 상담사(지원자)명 모두 구사",
      passed: true,
      description: "시간 할애에 대한 심도 깊은 감사와 재확인을 매끄럽게 수행함",
      impact: "엔터프라이즈급 딜 마감 능력을 증명하는 탄탄하고 고급스러운 마무리"
    }
  ],
  strengths: [
    "고객사 경영진의 전략적 목표를 자사의 장기 로드맵과 완벽히 융합하여 솔루션 매칭 수행",
    "고객의 예산 질문에 즉각 단가 깎기 대신 ROI 프레임워크를 적용하여 가치 중심 협상 전개",
    "경쟁 구도를 파악하는 질문을 부드러우면서도 아주 명확하게 던져 대안 분석 성공"
  ],
  weaknesses: [
    "자사 엔지니어링 리소스를 일부 초과 약속(Over-promise)할 소지가 있어 계약 시 범위 정밀화 필요"
  ],
  transcriptExcerpt: `[지원자 Sarah]: "대표님 안녕하십니까. VODA Bi 아시아태평양 엔터프라이즈 부문의 강서윤입니다. 바쁘신 일정 중에도 글로벌 오퍼레이션 통합 아젠다 협의를 위해 귀한 시간 내어주셔서 대단히 감사드립니다."
[고객 대표]: "네, 어서오세요. 안 그래도 사내 리포팅 인프라가 파편화되어 있어 매주 경영회의 자료 만드는 데 리소스 소모가 너무 큽니다."
[지원자 Sarah]: "네, 저희가 수십 개의 글로벌 테크 기업들의 파편화 문제를 해결하며 도출한 3대 핵심 ROI 성과를 기반으로, 오늘 대표님의 의사결정에 필요한 정량적인 청사진을 제안해 드리고자 합니다."`,
  summary: "모든 프로세스와 컴플라이언스를 완벽하게 통과한 탑티어 에이스 프로필입니다. 당사 최고 우대 조건으로 즉시 채용 및 배치를 추천합니다."
};

export const alexReport: VotestReport = {
  id: "votest-alex-03",
  candidateName: "Alex Cho (ID: TM-2026-1044)",
  targetRole: "SDR 아웃바운드 세일즈",
  date: new Date().toISOString().split('T')[0],
  overallScore: 56,
  scores: {
    opening: 40,
    needsDiscovery: 60,
    solutionMatching: 45,
    objectionHandling: 35,
    closing: 70
  },
  compliances: [
    {
      id: "E0001",
      label: "E0001 인사말, 성명, 소속 모두 구사",
      passed: false,
      description: "소속 브랜드 안내 누락 및 성명 발음 불명확",
      impact: "스팸성 아웃바운드 콜로 오인받아 통화 거부율을 심각하게 높일 위험이 있음"
    },
    {
      id: "E0002",
      label: "E0002 본인확인 이행",
      passed: false,
      description: "상대방의 신원 확인을 생략하고 성급하게 자사 피칭 시작",
      impact: "개인 정보 오남용 리스크 발생 및 비권한자와의 쓸모없는 대화로 시간 낭비"
    },
    {
      id: "E0003",
      label: "E0003 용건안내",
      passed: true,
      description: "데이터 시각화 툴 도입 목적과 혜택을 짧게 구사함",
      impact: "콜의 중반부 진입 성공율을 확보하는 최소한의 장치 역할 수행"
    },
    {
      id: "E0004",
      label: "E0004 감사인사, 상담사(지원자)명 모두 구사",
      passed: false,
      description: "전화를 일방적으로 끊는 듯한 급박한 인사를 건네어 이름 고지 실패",
      impact: "기업에 대한 부정적 인지도를 남기고 추후 재접촉(Nurturing) 기회를 완전히 상실함"
    }
  ],
  strengths: [
    "고객의 초기 냉소적인 반응에도 쉽게 위축되지 않고 밝고 활기찬 에너지를 끝까지 발산함",
    "도입 희망 일정을 짧은 시간 안에 재확인하는 등의 기본적인 클로징 질문 구사가 가능함"
  ],
  weaknesses: [
    "브랜드 규정에 맞는 정석 스크립트 준수율이 25% 미만으로, 기본 컴플라이언스 교육이 매우 시급함",
    "고객의 '지금 바쁩니다'라는 1차 거절에 반박하려다가 다소 공격적인 어조(Defensive Tone)를 보임"
  ],
  transcriptExcerpt: `[지원자 Alex]: "아 예, 여보세요? 바쁘신데 죄송한데요, 저희 데이터 툴 한번 안 써보실래요? 진짜 혁신적이고 싸게 나왔거든요."
[고객 실무자]: "저희 바빠서 그런데 나중에 전화 주세요."
[지원자 Alex]: "아니 잠시만요, 1분만 들어보시면 진짜 이득 보신다니까요? 왜 들으실 필요가 없다고 단정하시는지요?"`,
  summary: "기본적인 스크립트 숙지가 안 되어 있고, 초기 거절 처리에 대한 감정 통제 및 컴플라이언스 준수율이 매우 낮아 즉각적인 현장 배치 유보 및 입문 훈련이 필요합니다."
};

export const jordanReport: VotestReport = {
  id: "votest-jordan-04",
  candidateName: "Jordan Lee (ID: TM-2026-1102)",
  targetRole: "금융 솔루션 기술 영업 담당자",
  date: new Date().toISOString().split('T')[0],
  overallScore: 74,
  scores: {
    opening: 70,
    needsDiscovery: 85,
    solutionMatching: 65,
    objectionHandling: 70,
    closing: 60
  },
  compliances: [
    {
      id: "E0001",
      label: "E0001 인사말, 성명, 소속 모두 구사",
      passed: true,
      description: "자신의 직명과 소속팀을 적합하게 안내하였음",
      impact: "전문적 기술 자문 세일즈맨으로서의 격조와 브랜드 톤앤매너 구축 성공"
    },
    {
      id: "E0002",
      label: "E0002 본인확인 이행",
      passed: false,
      description: "연락처 및 수신 실무자의 업무 분장 영역을 확인하지 않고 피상적으로 통화",
      impact: "향후 복잡한 의사결정 구조 내에서 기술 의사결정 라인을 오인할 리스크 상존"
    },
    {
      id: "E0003",
      label: "E0003 용건안내",
      passed: true,
      description: "금융 보안 지침 컴플라이언스 진단을 돕기 위해 전화했음을 논리적으로 인지시킴",
      impact: "고객사 보안 부서의 미팅 참여 유도 가능성을 극대화함"
    },
    {
      id: "E0004",
      label: "E0004 감사인사, 상담사(지원자)명 모두 구사",
      passed: true,
      description: "다음 메일 안내 일정과 후속 조치를 상세 명시하며 감사 인사 종결",
      impact: "기술 자문 영역의 신용도를 공고히 하고 리마인드 터치포인트 연계 완성"
    }
  ],
  strengths: [
    "금융 도메인의 까다로운 데이터 보안 요건을 충분히 인지하고 구조화된 심층 질문으로 요구사항 발굴",
    "기술 장벽에 대한 질문을 기술 전문가 관점에서 차분하게 경청하고 안심시키는 대화법 보유"
  ],
  weaknesses: [
    "구체적인 제품 솔루션을 매칭할 때 지나치게 엔지니어링 용어를 사용하여 실무 비즈니스 가치 어필 약화",
    "최종 의사결정 유도 및 계약 체결 관련 구체적인 마일스톤 동의를 받아내는 드라이브 부족"
  ],
  transcriptExcerpt: `[지원자 Jordan]: "안녕하십니까, 금융 인프라 아키텍처 부문의 조던 리입니다. 금융감독원 고시 신규 보안 지침과 관련해 귀사 대용량 거래 트래픽 분산 시스템에 미치는 영향도를 함께 점검해 드리고자 연락드렸습니다."
[고객 보안팀장]: "아, 저희 마침 3중 보안 클러스터링 가이드를 검토 중이었는데, 어떤 식으로 컨설팅을 제공하시나요?"
[지원자 Jordan]: "네, 저희 솔루션은 가상 프라이빗 가용영역을 분할하고 HSM 장비를 피어링하여 분산 트랜잭션을..."`,
  summary: "금융 및 기술 도메인 역량은 탄탄하여 실무 이해도는 높으나, 세일즈 마인드셋과 클로징 결단력 강화가 동반되어야 가시적 성과를 낼 수 있는 전문가형 인재입니다."
};

export const mockReports: VotestReport[] = [
  samReport,
  sarahReport,
  alexReport,
  jordanReport
];
