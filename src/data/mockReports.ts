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
  id: "sam-votest-recent",
  candidateName: "Sam",
  targetRole: "B2B SaaS 테크 영업 담당자",
  date: new Date().toISOString().split('T')[0],
  overallScore: 78,
  scores: {
    opening: 85,
    needsDiscovery: 60,
    solutionMatching: 90,
    objectionHandling: 70,
    closing: 85
  },
  compliances: [
    {
      id: "comp-sam-0",
      label: "의사결정권자 확인",
      passed: true,
      description: "미팅 초반에 실무진 외에 최종 의사결정권자(C-Level)의 참여 여부와 의사결정 프로세스를 적극적으로 확인했습니다.",
      impact: "미팅 후반부 의사결정 지연 및 미팅 반복을 사전 차단하고 세일즈 주기를 단축할 수 있습니다."
    },
    {
      id: "comp-sam-1",
      label: "명확한 예산 범위 파악 (BANT)",
      passed: false,
      description: "가용 예산 한도나 구매 예상 비용을 확인하지 않고 단순 솔루션 기능 위주로만 논의를 진행했습니다.",
      impact: "마감 단계에서 가격 저항을 초래하고 마진율 훼손 및 의사결정 기각으로 이어질 위험이 매우 큽니다."
    },
    {
      id: "comp-sam-2",
      label: "도입 타임라인 정의",
      passed: true,
      description: "도입 시급성과 대략적인 롤아웃 희망 타임라인(올해 4분기 내 완료)을 확인하고 주간 단위 마일스톤 합의를 이끌어냈습니다.",
      impact: "딜의 추진력을 확보하고 다음 단계의 구체적 일정 합의를 가능하게 합니다."
    },
    {
      id: "comp-sam-3",
      label: "경쟁 구도 확인",
      passed: false,
      description: "현재 검토 중인 경쟁사나 내부 자체 개발 여부 등 대안 분석을 진행하지 않았습니다.",
      impact: "후반부에 경쟁사의 기습 프로모션 등으로 인해 공들인 딜을 마지막에 탈취당할 위험이 큽니다."
    }
  ],
  strengths: [
    "고객의 비즈니스 페인포인트를 자사 SaaS 솔루션의 고유 가치와 정교하게 정렬하여 제안하는 역량이 탁월함",
    "미팅 도입부에서 고객사 최근 보도자료를 언급하며 아이스브레이킹을 주도하고 매끄럽게 신뢰(Rapport)를 형성함",
    "미팅 종료 직후 다음 상세 데모 세션을 잡고 후속 일정을 선점하는 액션 지향적 클로징 구사력 우수"
  ],
  weaknesses: [
    "가용 예산에 대한 직접적인 검증이나 가치 제안과 비용 밸런스를 확인하려는 질문을 주저하여 예산 확인(BANT) 실패",
    "경쟁 솔루션 도입 상황 및 타사 비교 검토 요건에 대해 사전에 경계하거나 방어 전략을 구상하지 않음"
  ],
  transcriptExcerpt: `[지원자 Sam]: "안녕하세요! 오늘 소중한 시간 내어주셔서 감사드립니다. 최근 보도자료에서 귀사가 아태지역 진출을 공식화하셨다는 소식을 보았는데, 저희 솔루션이 그 성장에 큰 도움을 드릴 수 있을 것 같아 매우 설레는 마음입니다."
[고객 담당자]: "네, 반갑습니다. 저희가 마침 글로벌 데이터 동기화 이슈 때문에 고민이 많았거든요. 관련 솔루션을 찾고 있습니다."
[지원자 Sam]: "네, 그 부분은 저희의 멀티 리전 클러스터링 기능으로 완벽하게 해결이 가능합니다. 우선 대략적인 일정이나 타임라인을 언제쯤 생각하시는지 여쭤봐도 될까요?"
[고객 담당자]: "올해 4분기, 늦어도 11월 전에는 실 서비스 적용까지 마쳐야 합니다."
[지원자 Sam]: "훌륭합니다. 그럼 일정을 역산해서 다음 주에 상세 데모와 실 제품 테스트 라이선스를 먼저 발급해 드리겠습니다."`,
  summary: "적극적인 라포 형성과 강한 종결 능력을 보였으나, 세일즈 성공의 딜 브레이커인 예산(BANT) 및 경쟁 상황 파악을 누락하여 후속 단계의 이탈 리스크가 높은 도전형 프로필입니다."
};

export const mockReports: VotestReport[] = [samReport];
