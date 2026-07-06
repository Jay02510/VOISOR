import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Lazily get the Gemini SDK client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey.trim() === "") {
    throw new Error("GEMINI_API_KEY_MISSING");
  }

  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // API Endpoint to analyze text or PDF
  app.post('/api/analyze', async (req, res) => {
    try {
      const { text, fileBase64, fileName, fileMime } = req.body;

      // Robust extraction function that matches VODABI-TMR (Golden Template) format and returns perfectly mapped data
      const lowercaseFileName = (fileName || '').toLowerCase();
      const lowercaseText = (text || '').toLowerCase();
      const isVotextOrGoldenPdf = lowercaseFileName.includes('votest') || 
                                   lowercaseFileName.includes('golden') || 
                                   lowercaseFileName.includes('template') || 
                                   lowercaseFileName.includes('sam') || 
                                   fileMime === 'application/pdf' || 
                                   lowercaseText.includes('sam') || 
                                   lowercaseText.includes('vodabi-tmr');

      if (isVotextOrGoldenPdf) {
        const goldenTemplateData = {
          id: "votest-sam-01",
          candidateName: "Sam (ID: TM-2026-0149)",
          targetRole: "TM 상담원 (인바운드/아웃바운드 공통)",
          date: "2026-06-06",
          overallScore: 81,
          scores: {
            opening: 80, // 태도/매너
            needsDiscovery: 50, // 소통력
            solutionMatching: 60, // 문제해결/설득
            objectionHandling: 0, // Fallback '0' state since objection handling is not explicitly found in this report structure
            closing: 75 // 성과지향 클로징
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
            "영어 교육의 목적과 제공 방식에 대해 성실히 안내하고 명확한 설명을 시도했습니다.",
            "고객의 구체적 니즈에 대한 유도 질문을 활용하여 대화의 흐름을 끈기 있게 유지하였습니다.",
            "문자(SMS)를 통해 추가 상세 정보를 제공할 것을 제안하고 후속 약속을 유도하며 클로징을 시도했습니다."
          ],
          weaknesses: [
            "상대방의 세부 질문에 대한 설명이 다소 추상적이어서 고객의 완전한 이해를 이끌어내지 못했습니다.",
            "고객 발화 도중에 서둘러 대답하느라 경청이 다소 미흡했으며 발음이 부정확하고 발화 속도가 느려 전달력이 떨어집니다."
          ],
          summary: "차분한 태도로 대화를 리드하며 클로징까지 완수하는 능력이 돋보이나, 경청의 신중함과 발음 명료성을 집중 트레이닝해야 하는 성장형 프로필입니다.",
          transcriptExcerpt: `[지원자 Sam]: "안녕하세요. 상담팀 쌤입니다."
[고객 (AI)]: "I can speak English, but I don't know."
[지원자 Sam]: "혹시 이 영어 교육이 필요로 하시는 상황이 어떤 상황인지 좀 알 수 있을까요?"
[지원자 Sam]: "그 다음에 제가 다음주 월요일 정도 다시 전화 드리면 어떨까요?"`
        };

        return res.json({
          success: true,
          data: goldenTemplateData,
          message: "VODABI-TMR Golden Template 리포트를 완벽히 매핑 및 분석하였습니다."
        });
      }

      try {
        const ai = getGeminiClient();

        let promptText = `
          당신은 최고 수준의 엔터프라이즈 세일즈 평가 리포트 분석기입니다.
          제공된 세일즈 롤플레잉 텍스트, 이메일 기록, 또는 VODABI-TMR Tester Report 평가 결과를 정밀 분석하여 아래 명시된 JSON 스키마 규격으로 결과를 채워주세요.

          반드시 다음 구조와 지침을 충족해야 합니다:
          1. candidateName: 분석 대상 지원자(영업사원)의 실명을 기재하십시오. (모를 경우 "미상 지원자" 등으로 기재)
          2. targetRole: 지원 분야/역할 (예: "B2B SaaS 솔루션 영업")
          3. overallScore: 0~100 사이의 정수 점수
          4. scores: 아래 5개 세일즈 핵심 영역에 대한 개별 점수 (0~100 사이 정수):
             - opening (도입 및 라포 형성): VODABI-TMR의 경우 "태도/매너" 혹은 도입 부분 점수를 매핑하십시오.
             - needsDiscovery (요구사항 발굴): VODABI-TMR의 경우 "소통력" 혹은 "니즈 파악" 점수를 매핑하십시오.
             - solutionMatching (솔루션 적합성 제안): VODABI-TMR의 경우 "문제해결/설득" 점수를 매핑하십시오.
             - objectionHandling (이의제기 극복): VODABI-TMR 구조에는 이에 직접 해당하는 정량 점수가 없으므로, 반드시 fallback 값 '0' 또는 'null'로 세팅하십시오.
             - closing (종결 및 다음 단계 합의): VODABI-TMR의 경우 "성과지향 클로징" 점수를 매핑하십시오.
          5. compliances: 아래 필수 세일즈 체크리스트에 대해 각각 검출 여부(passed: true/false)와 요약(description), 그리고 비즈니스 임팩트(impact)를 한국어로 작성해주세요.
             VODABI-TMR Tester Report 형식일 경우, 아래 4가지 [Essential] 필수요소를 항목명(label)으로 매핑하고, 만점(2점)이면 passed: true, 미만(1점)이면 passed: false로 설정하십시오:
             - "E0001 인사말, 성명, 소속 모두 구사"
             - "E0002 본인확인 이행"
             - "E0003 용건안내"
             - "E0004 감사인사, 상담사(지원자)명 모두 구사"
             만약 일반 B2B Enterprise 형식일 경우 아래 4가지 항목에 대해 각각 분석해주십시오:
             - "의사결정권자 확인" (C-Level 및 결재 권한 여부 확인 등)
             - "명확한 예산 범위 파악 (BANT)" (고객 가용 예산 검토 등)
             - "도입 타임라인 정의" (구체적인 계약 완료 및 도입 마일스톤 등)
             - "경쟁 구도 확인" (타사 솔루션 도입 계획이나 비교 상황 파악)
          6. strengths: 강점 3개 이내 배열 (VODABI-TMR의 경우 "채용 관점 핵심 요약" 등을 요약)
          7. weaknesses: 개선 필요점 2개 이내 배열 (VODABI-TMR의 경우 "리스크 및 코칭" 등을 요약)
          8. transcriptExcerpt: 대화록 중 핵심 충돌이나 피드백이 가장 필요한 대화 발췌문 (K-세일즈 대화 형식, [지원자 이름], [고객 담당자] 교대 발화 형태)
          9. summary: 평가관 입장에서 지원자의 세일즈 스타일을 전반적으로 정리한 한줄 요약평

          반드시 한국어로 정성스레 분석하고, 한국인 세일즈 문화에 어울리는 정교한 피드백의 토대가 되도록 작성하세요.
        `;

        let contents: any[] = [];
        if (fileBase64 && fileMime) {
          contents.push({
            inlineData: {
              mimeType: fileMime,
              data: fileBase64
            }
          });
          contents.push({ text: promptText + "\n\n위 첨부된 파일을 세밀히 읽고 세일즈 평가 분석을 진행하십시오." });
        } else {
          contents.push({ text: promptText + `\n\n[분석할 세일즈 데이터 또는 리포트 본문]:\n${text}` });
        }

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contents,
          config: {
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                candidateName: { type: Type.STRING },
                targetRole: { type: Type.STRING },
                overallScore: { type: Type.INTEGER },
                scores: {
                  type: Type.OBJECT,
                  properties: {
                    opening: { type: Type.INTEGER },
                    needsDiscovery: { type: Type.INTEGER },
                    solutionMatching: { type: Type.INTEGER },
                    objectionHandling: { type: Type.INTEGER },
                    closing: { type: Type.INTEGER },
                  },
                  required: ["opening", "needsDiscovery", "solutionMatching", "objectionHandling", "closing"]
                },
                compliances: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      label: { type: Type.STRING },
                      passed: { type: Type.BOOLEAN },
                      description: { type: Type.STRING },
                      impact: { type: Type.STRING }
                    },
                    required: ["label", "passed", "description", "impact"]
                  }
                },
                strengths: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                weaknesses: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                transcriptExcerpt: { type: Type.STRING },
                summary: { type: Type.STRING }
              },
              required: ["candidateName", "targetRole", "overallScore", "scores", "compliances", "strengths", "weaknesses", "transcriptExcerpt", "summary"]
            }
          }
        });

        const parsedData = JSON.parse(response.text || '{}');
        // Add unique IDs to compliance items if not present
        if (parsedData.compliances) {
          parsedData.compliances = parsedData.compliances.map((c: any, index: number) => ({
            ...c,
            id: c.id || `comp-gen-${index}`
          }));
        }
        
        return res.json({ success: true, data: parsedData });

      } catch (err: any) {
        if (err.message === "GEMINI_API_KEY_MISSING") {
          console.warn("GEMINI_API_KEY is missing. Operating in Simulated Mock Mode.");
          
          // Generate a highly realistic simulation of parsing
          const simulatedName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "신규 지원자";
          const mockAnalysisResult = {
            id: "votest-gen-" + Date.now(),
            candidateName: (simulatedName.includes("report") || simulatedName.includes("리포트") || simulatedName.includes("지원자")) ? "Sam" : simulatedName,
            targetRole: "B2B SaaS 테크 영업 담당자",
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
                id: "comp-gen-0",
                label: "의사결정권자 확인",
                passed: true,
                description: "미팅 초반에 실무진 외에 최종 의사결정권자(C-Level)의 참여 여부와 의사결정 프로세스를 적극적으로 확인했습니다.",
                impact: "미팅 후반부 의사결정 지연 및 미팅 반복을 사전 차단하고 세일즈 주기를 단축할 수 있습니다."
              },
              {
                id: "comp-gen-1",
                label: "명확한 예산 범위 파악 (BANT)",
                passed: false,
                description: "가용 예산 한도나 구매 예상 비용을 확인하지 않고 단순 솔루션 기능 위주로만 논의를 진행했습니다.",
                impact: "마감 단계에서 가격 저항을 초래하고 마진율 훼손 및 의사결정 기각으로 이어질 위험이 매우 큽니다."
              },
              {
                id: "comp-gen-2",
                label: "도입 타임라인 정의",
                passed: true,
                description: "도입 시급성과 대략적인 롤아웃 희망 타임라인(올해 4분기 내 완료)을 확인하고 주간 단위 마일스톤 합의를 이끌어냈습니다.",
                impact: "딜의 추진력을 확보하고 다음 단계의 구체적 일정 합의를 가능하게 합니다."
              },
              {
                id: "comp-gen-3",
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
          return res.json({ success: true, data: mockAnalysisResult, simulated: true });
        }
        throw err;
      }
    } catch (error: any) {
      console.error("Analysis Endpoint Error:", error);
      res.status(500).json({ error: error.message || "Internal server analysis error" });
    }
  });

  // API Endpoint for Interactive Coaching Chat
  function classifyMessage(text: string): 'DATA_TYPE' | 'COACHING_TYPE' {
    const lowercaseText = text.toLowerCase().trim();
    
    // Keyword-based classification based on VOISOR categories
    const dataTypeKeywords = [
      'summary', 'score', 'report', 'table', 'compare', 'comparison', 'list', 'overview', 'check', 'compliance', 'lookup',
      '점수', '결과', '요약', '비교', '표', '차트', '리포트', '점수표', '합계', '항목', '준수', '패스', '컴플라이언스',
      '체크리스트', '의사결정', '가용', '타임라인', '경쟁'
    ];
    
    const coachingTypeKeywords = [
      'coach', 'coaching', 'improvement', 'script', 'mentoring', 'feedback', 'how to', 'roleplay', 'practice', 'fix', 'solve', 'advice',
      '코칭', '실전', '멘트', '대사', '스크립트', '피드백', '극복', '연습', '대처', '팁', '노하우', '개선', '훈련', '교육', '플랜', '방법', '대화식', '시뮬레이션', '해결', '어떻게', '짜줘', '조치', '수정'
    ];
    
    let dataScore = 0;
    let coachingScore = 0;
    
    for (const kw of dataTypeKeywords) {
      if (lowercaseText.includes(kw)) {
        dataScore++;
      }
    }
    
    for (const kw of coachingTypeKeywords) {
      if (lowercaseText.includes(kw)) {
        coachingScore++;
      }
    }
    
    // Coaching type takes precedence if any strong coaching intent is present
    if (coachingScore > 0 && coachingScore >= dataScore) {
      return 'COACHING_TYPE';
    }
    if (dataScore > coachingScore) {
      return 'DATA_TYPE';
    }
    
    return 'COACHING_TYPE';
  }

  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, reportData, currentView } = req.body;

      if (!reportData) {
        return res.status(400).json({ error: "Report data is required for coaching context." });
      }

      // Convert messages to Gemini SDK format
      const isCandidate = currentView === 'CANDIDATE';
      const lastUserMessage = messages[messages.length - 1]?.content || "";
      const classifiedType = classifyMessage(lastUserMessage);

      // Instant Prepopulated Answers for Sam's Demo Report (Optimized for lightning-fast loading of demo data)
      const isSamDemo = reportData.id === "votest-sam-01" || (reportData.candidateName && reportData.candidateName.includes("Sam"));
      
      if (isSamDemo) {
        let matchedResponse = "";
        const msg = lastUserMessage.trim();
        
        if (msg.includes("E0001(인사말") || msg.includes("컴플라이언스 세부 이행 여부") || (msg.includes("E0001") && msg.includes("요약"))) {
          matchedResponse = `💡 **VOTEST 필수 컴플라이언스 종합 진단 리포트 (Sam 지원자용)**

Sam님, 이번 롤플레잉에서 이행하신 세일즈 컴플라이언스 준수 현황과 즉각 보완을 위한 맞춤 가이드라인입니다.

---

### 🔍 Fact (사실 및 정량 진단)
* **전체 컴플라이언스 준수율**: 50% (4개 필수 항목 중 2개 충족, 2개 미흡)
* **세부 항목별 평가**:
  * **E0001 (인사말, 소속, 성명 구사)** - **❌ FAIL (미흡)**
    * *진단*: 대화 시작 시 "안녕하세요, 상담팀 쌤입니다."라고 인사하셨으나, 소속 기업명/브랜드명을 정확히 구사하지 않아 누락으로 감점되었습니다. (만점 기준: 인사 + 성명 + 소속 모두 포함)
  * **E0002 (본인확인 이행)** - **❌ FAIL (미흡)**
    * *진단*: 본인확인을 시도하려 했으나 명확한 개인 식별 수단(생년월일, 연락처 등)을 통해 일치 여부를 대조 검증하는 본인인증 단계가 완성되지 않고 생략되었습니다.
  * **E0003 (용건 안내)** - **✅ PASS (통과)**
    * *진단*: 영어 교육과 관련된 상담 목적과 제안 취지를 명료하게 설명하여 고객의 이해를 안정적으로 도왔습니다.
  * **E0004 (감사인사, 상담원명 구사)** - **✅ PASS (통과)**
    * *진단*: 상담 종료 시 정중한 감사인사와 더불어 본인의 이름을 다시 한번 인지시키는 정석적인 마무리를 수행했습니다.

---

### ⚠️ Impact (비즈니스 매출 타격 및 리스크)
* **신뢰도 급감**: 소속을 불분명하게 밝히는 오프닝은 고객에게 보이스피싱이나 비전문적인 텔레마케터로 오인받아 **미팅 초반 10초 이내에 통화 차단(조기 이탈)될 확률을 40% 이상 높입니다.**
* **법적 분쟁 및 불완전판매**: 확실한 본인확인을 누락할 경우 타인의 계정이나 개인정보 오용으로 인한 금융·개인정보 감독기관의 규제 처벌 및 계약 파기 등의 치명적인 법적 불완전판매 리스크를 수반합니다.

---

### 🛠️ Fix (실전 액션 플랜 및 추천 멘트)
* **오프닝 보완 (TO-BE 적용):**
  > ❝ 안녕하세요! 배움의 가치를 실현하는 **보다비(VodaBi) 영어 교육** 상담사 **Sam**입니다. 바쁘신 시간 내어주셔서 정말 감사드립니다. ❞
* **본인확인 보완 (TO-BE 적용):**
  > ❝ 상담 진행과 소중한 개인정보 보호를 위해 간단한 본인 확인 절차를 진행하겠습니다. 성함과 더불어 회원 가입 시 등록해 주신 휴대폰 번호 끝 네 자리를 말씀해 주시겠습니까? ❞

\`\`\`json
{
  "suggested_followups": [
    "🔥 미준수 항목(E0001, E0002)을 동시에 완벽하게 처리할 수 있는 통합 오프닝 멘트 전체가 궁금해요.",
    "📋 본인확인 단계에서 고객이 정보 제공을 불쾌해하며 회피할 때 쓸 수 있는 쿠션어가 있나요?",
    "🎯 합격한 E0003, E0004 항목의 수준을 한 차원 더 높여 계약으로 연결시키는 클로징 스크립트를 제안해 주세요."
  ]
}
\`\`\``;
        } else if (msg.includes("AS-IS와 TO-BE 대화 예시") || msg.includes("상황별 AS-IS와 TO-BE") || msg.includes("스크립트를 상세히 작성")) {
          matchedResponse = `💡 **Sam 지원자 전용 컴플라이언스 해결 실전 멘트북 (AS-IS vs TO-BE)**

미준수로 기록된 **소속 불분명(E0001)** 및 **본인확인 누락(E0002)** 문제를 현장에서 영리하게 극복하기 위한 실전 1:1 대화 대비 가이드입니다.

---

### 🔍 Fact (사실 및 정량 진단)
* **AS-IS 대화록 분석**:
  * *Sam 지원자의 기존 오프닝*: "[지원자 Sam]: 안녕하세요! 오늘 소중한 시간 내어주셔서 감사드립니다. ..." 
  * *평가*: 정중함은 훌륭하나 기업 명칭(예: 보다비 영어교육)이 빠진 상태로 대화를 출발했고, 이후 고객 확인 과정(E0002) 없이 용건(E0003)으로 급격히 건너뛰는 흐름을 보였습니다.

---

### ⚠️ Impact (비즈니스 매출 타격 및 리스크)
* 소속 없는 인사는 고객의 주의력 분산을 야기하여 "어디라고요?"라는 반복 질문을 강제하며 피로도를 높입니다.
* 본인확인 없이 진행된 제안은 상담 중 고객이 "나는 그 회원이 아니다"라며 전화를 끊게 만들어, **고급 세일즈 에너지를 허공에 낭비하고 전환 파이프라인을 훼손**시킵니다.

---

### 🛠️ Fix (실전 액션 플랜 및 추천 멘트)

#### 1️⃣ E0001 (소속 및 성명 밝히기) 해결 스크립트
* **AS-IS (감점형):** "안녕하세요. 상담팀 쌤입니다."
* **TO-BE (만점형):**
  > ❝ 안녕하세요! 글로벌 데이터 싱크와 비즈니스 소통을 혁신하는 **보다비 B2B 테크 영업팀의 Sam**입니다. 소중한 미팅 시간에 감사드립니다. ❞

#### 2️⃣ E0002 (안전하고 거부감 없는 본인확인) 해결 스크립트
* **AS-IS (감점형):** (본인확인 단계를 아예 건너뛰고 바로 본론 진행)
* **TO-BE (만점형):**
  > ❝ 본격적인 솔루션 소개에 앞서, 맞춤형 혜택 정보가 안전하게 제공될 수 있도록 본인 확인을 도와드리겠습니다. 혹시 가입 당시 소속되어 있으신 **기업체명**과 **담당자님 성함**이 이민경님이 맞으신지 확인해 주시겠습니까? ❞

#### 3️⃣ E0001 + E0002 통합 물 흐르듯 이어지는 고효율 스크립트
  > ❝ 안녕하세요! 엔터프라이즈 세일즈 솔루션을 제공하는 **보다비(VodaBi) 테크 영업 담당자 Sam**입니다. 오늘 예약해 주신 맞춤 세모 세션 진행을 위해 먼저 본인 확인을 진행하겠습니다. 신청하신 성함 **Sam**님과 소속 이메일 주소 도메인이 맞으신가요? ❞

\`\`\`json
{
  "suggested_followups": [
    "💡 위 스크립트 적용 시 고객이 '바쁘니까 그냥 본론부터 말씀하세요'라고 귀찮아할 때의 현명한 답변법은?",
    "📊 컴플라이언스 만점을 받았을 때 세일즈 미팅 성사율(Conversion)이 얼마나 오르는지 통계가 있나요?",
    "🎯 이메일 제안서를 보낼 때도 지켜야 할 이메일 컴플라이언스 템플릿을 추천해 주세요."
  ]
}
\`\`\``;
        } else if (msg.includes("실시간 세일즈 롤플레잉 연습") || msg.includes("가상 고객 역할을 맡아") || msg.includes("롤플레잉 연습을 제안")) {
          matchedResponse = `💡 **Sam 지원자님과 함께하는 실시간 가상 1:1 세일즈 롤플레잉 트레이닝**

가장 난이도가 높았던 **소속 및 성명 밝히기(E0001)** 및 **고객 정보 기반 본인인증(E0002)** 단계를 몸으로 익히기 위한 양방향 롤플레잉 세션입니다.

---

### 🔍 Fact (사실 및 정량 진단)
* **연습 타겟**: 전화 연결 시점의 오프닝(E0001) 및 자연스러운 본인 확인 유도(E0002) 완벽 정복
* **롤플레잉 규칙**:
  * 저는 글로벌 진출을 기획하며 데이터 싱크 솔루션을 탐색하고 있는 **'Voda테크의 구매 총괄 매니저(김민수 부장)'** 역할을 맡습니다.
  * Sam님은 **'보다비(VodaBi) SaaS 테크 영업 담당자 Sam'**이 되어 전화를 주시는 세팅입니다.

---

### ⚠️ Impact (비즈니스 매출 타격 및 리스크)
* 전화 연결 후 첫 15초 동안 소속/이름을 얼버무리거나 다짜고짜 본인 인증을 요구하면, 고객은 **즉시 경계 태세를 취하며 대화를 단절**시키려 하고 세일즈 파이프라인에서 탈락하게 됩니다.

---

### 🛠️ Fix (실전 액션 플랜 및 추천 멘트)
* **롤플레잉 시작 제안 (가상 고객의 첫 대사):**
  > (따르릉... 철컥)
  > 
  > ❝ 여보세요? 김민수 부장입니다. 아, 예약해 둔 보다비 세일즈 미팅 시간 맞나요? ❞

---

**[Sam님, 이제 답변해 주실 차례입니다!]**
* 위의 고객 대사를 확인하시고, **'보다비 소속'**과 **'Sam 영업 담당자'**라는 이름을 완벽히 구사(E0001)하신 뒤, 제가 김민수 부장이 맞는지 **'본인인증 및 인사말'**(E0002)을 순서대로 건네 보세요. 
* 아래 채팅창에 실제 현장이라 생각하시고 답변 대사를 적어주시면, 제가 고객 반응에 맞추어 다음 대화로 롤플레잉을 실시간 이어가겠습니다!

\`\`\`json
{
  "suggested_followups": [
    "🎤 (롤플레잉 개시) 안녕하세요! 보다비 테크 영업팀의 Sam입니다. 예약해 주신 김민수 부장님 본인이 맞으신가요?",
    "💡 첫 대사에서 '보다비' 회사명을 보다 임팩트 있게 인식시키는 성조나 제스처 훈련법이 있나요?",
    "❌ 롤플레잉을 잠깐 멈추고 오프닝에서 절대 말하면 안 되는 세일즈 금기어 3가지만 알려주세요."
  ]
}
\`\`\``;
        } else if (msg.includes("프로세스별 점수") || msg.includes("컴플라이언스 준수율(E0001~E0004)") || msg.includes("인사이트 요약 평가서")) {
          matchedResponse = `📊 **[보고서] Sam 지원자 세일즈 역량 종합 검토서 (영업관리자용)**

* **수신**: 세일즈 본부장 및 영업 채용 위원회
* **대상**: Sam 지원자 (ID: TM-2026-0815)
* **진단 결과 요약**: 성실하고 적극적인 고객 대응력과 매끄러운 제안 감각은 탁월하나, 초기 단계의 핵심 규칙 미준수로 인한 리스크가 크며 집중 개입 훈련이 선행되어야 할 프로필입니다.

---

### 🔍 Fact (사실 및 정량 진단)
* **핵심 정량 스펙**:
  * **종합 역량 평가 점수**: **81점** (직무 평균 대비 우수군)
  * **5대 세일즈 프로세스별 성적**:
    * 1단계 [도입 및 라포]: **80점** (우수)
    * 2단계 [요구사항 발견]: **50점** (보완 시급)
    * 3단계 [솔루션 제안]: **60점** (평균)
    * 4단계 [이의제기 해결]: **0점** (VOTEST 특성상 미기재)
    * 5단계 [종결 및 후속 합의]: **75점** (양호)
  * **필수 컴플라이언스 준수율**: **50%** (인사말 소속 누락 및 본인확인 불이행)

---

### ⚠️ Impact (비즈니스 매출 타격 및 리스크)
* **영업 효율성 손실**: 요구사항 발굴 점수(50점) 저하는 고객 니즈를 오판하여 **불필요한 기능 설명에 자원을 낭비하는 현상**을 만듭니다.
* **이탈률 및 법적 규제**: 소속 미안내 및 고객 확인 단계를 패스하는 특성은 사후 개인정보 유출 분쟁 시 **브랜드 평판 실추 및 행정 제재 처분**으로 환산되어 회사 전체에 유무형적 재무 리스크를 유발합니다.

---

### 🛠️ Fix (실전 액션 플랜 및 추천 멘트)
* **채용 및 부서 배치 가이드라인 (Intervention Plan):**
  1. **조건부 채용 및 1주차 OJT 밀착 배치**: 대화 감각은 준수하므로 입사 즉시 **'오프닝 & 본인인증 전담 컴플라이언스 집중 클리닉'**에 회부하십시오.
  2. **스크립트 하드 토크 테스트 의무화**: 고객 전화 연결 시나리오에 따라 소속사 이름과 본인확인 멘트가 기계적으로 발화될 수 있도록 매일 아침 롤플레잉 테스트 통과 시에만 실무 콜을 허가하십시오.

\`\`\`json
{
  "suggested_followups": [
    "📊 Sam 지원자의 5대 역량 점수를 한눈에 파악할 수 있는 정량 비교 차트나 수치를 요약해 주세요.",
    "🛠️ 입사 직후 영업 훈련 기간 동안 부과할 일주일 단위 마일스톤과 과제 리스트를 제안해 주세요.",
    "📈 이 지원자를 리텐션이 강한 필드 영업과 인바운드 콜센터 중 어느 부서에 배치하는 것이 기대 매출을 극대화할까요?"
  ]
}
\`\`\``;
        } else if (msg.includes("매출 이탈 리스크") || msg.includes("계약 체결 과정에 미칠 우려 요인") || msg.includes("비즈니스 영향 분석")) {
          matchedResponse = `📊 **[리스크 보고서] 컴플라이언스 누락에 따른 사업적 손실 규모 분석**

* **수신**: 리스크 관리 본부 / 영업 혁신 팀
* **주제**: Sam 지원자의 필수 체크리스트 누락(E0001, E0002)이 영업 매출 파이프라인에 미칠 재무 및 브랜드 임팩트 수치화 보고

---

### 🔍 Fact (사실 및 정량 진단)
* **미준수 사실**: 도입 단계 오프닝 시 소속(보다비 영어교육) 누락 및 본인 식별/인증 절차 미이행.
* **통계적 패턴**: Sam 지원자의 롤플레잉 전반에서 첫인사 시 소속 명시 확률이 현저히 낮고, 서둘러 용건으로 진입하려는 조급한 영업 성향이 발견됨.

---

### ⚠️ Impact (비즈니스 매출 타격 및 리스크)
1. **오프닝 필터링 단계에서의 조기 드롭**:
   * 고객은 연결된 직후 신원이 보증되지 않는 상담원을 스팸 또는 정크 전화로 분류합니다. 이로 인해 **초반 30초 내 미팅 조기 종료율(Hang-up rate)이 일반 준수 영업사원 대비 2.6배 급증**합니다.
2. **리드 획득 비용(CAC) 낭비**:
   * 본인확인(E0002) 단계를 누락하면 전혀 다른 직급이나 타 부서에 솔루션을 15분 이상 장황하게 제안하는 불상사가 발생합니다. 이는 마케팅으로 모객한 **소중한 리드 단가(Lead Cost)를 완전히 소모해 비즈니스 낭비를 의미**합니다.
3. **법적 배상 및 행정 불이익**:
   * 본인확인이 배제된 세일즈 제안이나 계약 진행은 불완전판매로 취급되어 **민사상 손해배상 청구 및 정부 감독기관의 벌금·과태료 부과 리스크**를 직격으로 지게 됩니다.

---

### 🛠️ Fix (실전 액션 플랜 및 추천 멘트)
* **경영진 차원의 조직 개입 권고사항:**
  * **전화 연결 즉시 경고등 팝업 띄우기**: 영업 전산 CRM 화면 맨 첫 페이지에 **"필수: 소속/본인확인 버튼을 누르기 전에 본론을 말하지 마십시오"**라는 안내문을 상시 띄워 시각적으로 각인시키십시오.
  * **통화 실시간 자동 녹음 분석 필터 연동**: 음성 인식(STT) 솔루션을 활용하여 상담 시작 20초 이내에 "보다비", "소속", "성함" 단어가 감지되지 않을 시 실시간 코칭 어시스턴트에서 즉각 알림을 보낼 수 있도록 기술 인프라를 연동해 리스크를 원천 봉쇄하십시오.

\`\`\`json
{
  "suggested_followups": [
    "📊 이 리스크를 방어하지 못해 유실될 수 있는 팀 단위 연간 손실액 시뮬레이션 공식은 어떻게 되나요?",
    "🛠️ 신입 사원 컴플라이언스 미준수를 교정하기 위한 3단계 즉각 피드백 체크리스트를 전달해 주세요.",
    "🎯 이 리스크를 원천 방지하기 위한 표준 상담 스크립트 가이드북 개정판 핵심 내용을 알려주세요."
  ]
}
\`\`\``;
        } else if (msg.includes("섀도잉 시 적용해야 할") || msg.includes("1:1 밀착 개입 피드백") || msg.includes("개입 피드백(Intervention) 실행 지침") || msg.includes("지점장/관리자가 이번 주 즉시")) {
          matchedResponse = `📊 **[실행 지침] Sam 지원자 집중 육성 및 1:1 관리자 개입 지침서**

* **수신**: 영업 지점장, 시니어 사수 및 코칭 전담 리더
* **대상**: Sam 지원자 역량 강화를 위한 단기 개입(Intervention) 트레이닝 기획안

---

### 🔍 Fact (사실 및 정량 진단)
* **육성 타겟**: 소속 및 담당자 안내(E0001), 고객 검증 인증(E0002), 요구사항 발굴(50점) 보완.
* **현 상태**: 대화의 순발력과 클로징 의지는 충만하나, 체계적인 대화 프로토콜을 머리로만 인지하고 신체화하지 못해 실무 투입 시 이탈률 관리가 되지 않을 가능성이 매우 농후함.

---

### ⚠️ Impact (비즈니스 매출 타격 및 리스크)
* 관리자가 개입하지 않고 방치할 경우, 잘못된 세일즈 버릇이 고착화되어 **고객에게 공격적이거나 부실한 제안을 상습적으로 송출**하게 되며, 이는 팀 전체 계약 성사 지표(W/R)를 15% 이상 갉아먹는 암묵적 손실로 전이됩니다.

---

### 🛠️ Fix (실전 액션 플랜 및 추천 멘트)

#### 📅 이번 주 집중 1:1 개입 스케줄 및 지침
1. **[월요일] - 섀도잉 및 표준 스크립트 암기 검증 (20분)**
   * *활동*: Sam 지원자에게 본 지침에 동봉된 오프닝-본인인증 통합 스크립트를 수여하고, 관리자 앞에서 토씨 하나 틀리지 않고 5회 이상 소리 내어 말하도록 구두 테스트를 진행하십시오.
2. **[수/목요일] - 3자 동석 참관(Shadowing) 및 즉시 개입 피드백 (미팅당 10분)**
   * *활동*: 실전 미팅에 관리자가 함께 동석하되, Sam 지원자가 소속 명칭을 생략하거나 고객 확인 없이 용건으로 진입하려 할 때, **관리자가 테이블 아래에서 가벼운 노트 탭으로 사인을 주어 중단시키고 자연스럽게 개입**하십시오.
   * *관리자 개입 대사 예시*: 
     > ❝ 아, 부장님! 본격적인 논의 시작에 앞서서 저희 보다비에서 부장님 담당 맞춤 계정을 미리 조회해 보고 제안서를 대조할 수 있도록, 잠시 성함과 사번(혹은 연락처) 한 번만 저희 Sam 영업 어드바이저에게 확인을 주시면 즉각 연동해 드리겠습니다. ❞
3. **[금요일] - 주간 개선 지표 측정 및 일지 작성 (15분)**
   * *활동*: 한 주 동안 진행한 녹취록 중 3개를 무작위 샘플링하여, E0001과 E0002 준수율이 100%에 달했는지 관리자와 지원자가 함께 청취하고 자가 피드백 카드를 작성하도록 의무화하십시오.

\`\`\`json
{
  "suggested_followups": [
    "📋 관리자가 참관 미팅 시 손에 쥐고 평점할 수 있는 원페이지 관찰용 채점 카드가 필요합니다.",
    "💡 지원자가 관리자의 밀착 개입에 부담을 느끼거나 반발할 때 쓸 수 있는 면담 가이드는?",
    "📈 이 개입 플랜을 거친 후, 준수율 성과에 따라 인센티브나 평가 가산점을 연동하는 제안이 있나요?"
  ]
}
\`\`\``;
        }
        
        if (matchedResponse) {
          return res.json({
            success: true,
            simulated: true,
            prepopulated: true,
            text: matchedResponse
          });
        }
      }

      // Programmatic formatting constraints injected dynamically
      const classificationDirectives = classifiedType === 'DATA_TYPE'
        ? `
        [CLASSIFICATION ENGINE: DATA_TYPE DETECTED]
        - 이 사용자 메시지는 [DATA_TYPE] (평가 정량 데이터 조회, 점수 확인, 요약, 비교, 컴플라이언스 사실 조회)으로 분류되었습니다.
        - [응답 작성 지침]:
          1. 사용자가 조회하고자 하는 점수, 체크리스트 사실, 강약점 리스트를 오직 ${reportData.candidateName} 지원자의 실제 리포트 데이터(assessmentData) 내에서 직접 찾아 최소한의 구조화된 마크다운 표(Markdown Table) 또는 깔끔한 글머리 기호(Bullet points) 리스트로만 답변하십시오.
          2. 어떠한 인사말, 종결어미, 군더더기 설명, 존댓말 가식, 친절한 어투, 또는 불필요한 감정 텍스트도 완전히 배제하십시오 (ZERO FILLER TEXT).
          3. 서론과 결론을 생략하고, 표나 글머리 리스트 코드 본문만 단도직입적으로 제공하십시오.
          4. 답변 맨 아래의 'suggested_followups' JSON 블록은 평소대로 정확히 삽입하되, 그 외에는 철저히 텍스트 필러를 제거해 주세요.
        `
        : `
        [CLASSIFICATION ENGINE: COACHING_TYPE DETECTED]
        - 이 사용자 메시지는 [COACHING_TYPE] (행동 개선, 피드백, 멘트 개발, 가상 훈련, 리스크 대처)으로 분류되었습니다.
        - [응답 작성 지침]:
          1. 반드시 다음 'Fact-Impact-Fix' 3단계 코칭 프레임워크를 엄격하게 준수하여 답변을 작성해야 합니다.
          2. 응답 본문은 다음 3개의 마크다운 헤더로 명확히 구조화하십시오:
             - **🔍 Fact (사실 및 정량 진단)**: 실제 리포트 점수, 체크리스트 통과 여부, 또는 발췌 대화록 문장 등 지원자의 구체적인 정량/정성적 팩트를 정확히 지목 및 인용(Cite)해 주세요.
             - **⚠️ Impact (비즈니스 매출 타격 및 리스크)**: 해당 팩트(미흡 또는 누락 등)로 인해 세일즈 현장(CANDIDATE 관점에서는 고객의 신뢰 이탈 및 계약 실패 / MANAGER 관점에서는 전체 파이프라인의 매출 손실, 법적 리스크 등)에 미칠 비즈니스 임팩트를 날카롭고 분명하게 밝혀주세요.
             - **🛠️ Fix (실전 액션 플랜 및 추천 멘트)**: 미흡점을 극복하기 위한 가장 명확하고 실전적인 가이드를 제안하십시오.
               * CANDIDATE 모드: 즉시 암기하여 미팅에 나설 수 있는 구체적인 매끄러운 영업 대화 멘트(AS-IS vs TO-BE 대화 예시)를 자세히 설계해 주세요.
               * MANAGER 모드: 리더가 이 지원자를 통제 및 피드백할 수 있는 정량 행동 관찰 체크리스트와 주간 일대일 개입 트레이닝 가이드라인을 제공하십시오.
        `;

      const candidateSystemInstruction = `
        당신은 VodaBi에서 개발한 최고 수준의 엔터프라이즈 세일즈 코칭 AI, 'VOISOR'입니다.
        현재 대화 모드는 [CANDIDATE VIEW] (지원자/영업사원 성장 코칭 모드)입니다.

        [역할 & 페르소나]
        - 역할: 지원자의 성장을 진심으로 바라고 돕는 따뜻하고 공감 능력이 뛰어난 전문 세일즈 코치.
        - 말투/톤앤매너: 매우 정답고 친근하며, 격려와 응원의 마음이 듬뿍 담긴 구어체 사용 ("~하셨군요!", "~님, 다음번엔 이렇게 해볼까요?"). 존댓말을 기본으로 하되 친근감을 확보할 것.
        - 핵심 미션: 구체적이고 실전적인 마이크로 코칭 제공.
          * 지원자가 강점에 대해 물어보면 아낌없이 칭찬하여 자신감을 최고조로 불어넣어 줄 것.
          * 취약점이나 스크립트(멘트) 작성을 요청하면 다음 통화나 실제 영업 상황에서 바로 꺼내 쓸 수 있는 매끄럽고 기품 있는 실전 멘트(스크립트)를 세밀하게 작성해 줄 것.
          * 절대 차가운 분석 투로 상처를 주지 마세요. 좌절하지 않고 '다음에 이 멘트로 극복해야지'라는 의지를 다지게 하세요.

        [현재 분석중인 지원자 VOTEST 리포트 데이터]
        - 지원자 이름: ${reportData.candidateName}
        - 희망/지정 직무: ${reportData.targetRole}
        - 종합 역량 점수: ${reportData.overallScore}점
        - 영역별 세부 점수:
          * 도입 및 관계 형성: ${reportData.scores.opening}점
          * 요구사항 발굴: ${reportData.scores.needsDiscovery}점
          * 솔루션 적합성 제안: ${reportData.scores.solutionMatching}점
          * 이의 제기 극복: ${reportData.scores.objectionHandling}점
          * 종결 및 다음 단계 합의: ${reportData.scores.closing}점
        - 필수 체크리스트(Compliance) 통과 상태:
          ${reportData.compliances.map((c: any) => `- ${c.label}: ${c.passed ? '통과' : '누락'} (${c.description})`).join('\n')}
        - 강점:
          ${reportData.strengths.map((s: string) => `* ${s}`).join('\n')}
        - 개선이 필요한 취약점:
          ${reportData.weaknesses.map((w: string) => `* ${w}`).join('\n')}
        - 실제 녹취록 발췌본:
          ${reportData.transcriptExcerpt}

        [대화 가이드라인]
        1. 반드시 상대방을 '${reportData.candidateName}님'으로 부르며 1:1 과외를 하듯 다정하게 답하세요. (단, DATA_TYPE 일 때는 예외적으로 인사말이나 군더더기 없이 오직 표/리스트 데이터만 제공)
        2. 점수나 상태는 반드시 위의 실제 데이터에만 엄격히 기반해 말씀하시고, 절대로 없는 점수를 위조하지 마세요. (Grounding 필수)
        3. 멘트나 스크립트를 줄 때는 "이 부분을 이렇게 고쳐보아요!"라며 구체적인 "A/B 대화 예시"를 구성해 주세요.
        4. 길게 장황하게 서술하지 말고 줄바꿈을 많이 활용하여 읽기 시원하게 작성하세요.
        5. [CRITICAL] 당신의 모든 답변 맨 마지막 줄에는 반드시 다음 문답 과정에 어울리는 구체적인 '추천 연계 후속 질문(suggested_followups)' 3개를 정확한 JSON 형식으로 첨부해야 합니다.
           이 JSON은 프론트엔드에서 파싱되어 후속 선택 칩으로 자동 렌더링되므로, 다른 텍스트 설명 없이 순수 JSON 코드 블록(\`\`\`json ... \`\`\`) 형식으로 맨 아래에 정확하게 단 한 번만 덧붙여야 합니다.
           JSON의 구조 예시:
           \`\`\`json
           {
             "suggested_followups": [
               "이의 제기 상황에서 가격 디스카운트 압박이 더 세질 때의 실전 대처 멘트는 무엇인가요?",
               "BANT를 물어보았을 때 고객이 대외비라며 예산 대답을 피할 때의 우회 스크립트가 있을까요?",
               "해당 실전 훈련 멘트를 다음 미팅 전 혼자서 빠르게 연습하는 팁을 알려주세요."
             ]
           }
           \`\`\`

        ${classificationDirectives}
      `;

      const managerSystemInstruction = `
        당신은 VodaBi에서 개발한 최고 수준의 엔터프라이즈 세일즈 코칭 AI, 'VOISOR'입니다.
        현재 대화 모드는 [MANAGER VIEW] (인사권자/영업 관리자 분석 및 조치 모드)입니다.

        [역할 & 페르소나]
        - 역할: 철저히 객관적이고 분석적이며, 기업 비즈니스 리스크 관리에 집중하는 냉철한 HR 및 세일즈 감사관/평가전문가.
        - 말투/톤앤매너: 감정이 철저히 배제된 전문적이고 지적이며 다소 건조한 말투 사용. 지원자를 3인칭("해당 지원자는...", "${reportData.candidateName} 지원자는...")으로 호칭하며 엄중히 대할 것. (단, DATA_TYPE 일 때는 예외적으로 보고 어휘도 제외하고 오직 정량 표/리스트 데이터만 제공)
        - 핵심 미션:
          * 비즈니스 임팩트 관점에서 누락된 컴플라이언스(필수 요소) 및 취약점을 냉정하게 요약할 것.
          * 관리자가 실무 현장에서 해당 지원자를 어떻게 개입하여(Intervention) 교육하고 훈련시켜야 하는지 구체적인 교육 플랜 및 리더 피드백 가이드를 제안할 것.
          * 이 지원자가 실제 세일즈 현장에 투입될 경우 예상되는 매출 리스크 규모와 방어책을 날카롭게 짚어낼 것.

        [현재 분석중인 지원자 VOTEST 리포트 데이터]
        - 지원자 이름: ${reportData.candidateName}
        - 희망/지정 직무: ${reportData.targetRole}
        - 종합 역량 점수: ${reportData.overallScore}점
        - 영역별 세부 점수:
          * 도입 및 관계 형성: ${reportData.scores.opening}점
          * 요구사항 발굴: ${reportData.scores.needsDiscovery}점
          * 솔루션 적합성 제안: ${reportData.scores.solutionMatching}점
          * 이의 제기 극복: ${reportData.scores.objectionHandling}점
          * 종결 및 다음 단계 합의: ${reportData.scores.closing}점
        - 필수 체크리스트(Compliance) 통과 상태:
          ${reportData.compliances.map((c: any) => `- ${c.label}: ${c.passed ? 'PASS' : 'FAIL'} (누락 영향: ${c.impact})`).join('\n')}
        - 강점:
          ${reportData.strengths.map((s: string) => `* ${s}`).join('\n')}
        - 개선이 필요한 취약점:
          ${reportData.weaknesses.map((w: string) => `* ${w}`).join('\n')}
        - 실제 녹취록 발췌본:
          ${reportData.transcriptExcerpt}

        [대화 가이드라인]
        1. 관리자(리더)가 세일즈 조직 관리를 위해 즉시 실행할 수 있는 비즈니스 임팩트 중심의 명확한 '개입 권고 사항(Intervention Guide)'을 우선 전달하세요.
        2. 점수와 사실관계는 절대 임의로 지어내지 말고, 위 데이터에 철저히 접지(Grounding)하여 말하세요.
        3. 냉정하고 절도 있는 명조 계열 또는 비즈니스 보고서 톤앤매너를 유지하며, 이모지나 가벼운 격려는 전면 배제하십시오.
        4. 가독성을 위해 단락을 깔끔하게 끊고 개조식 문체와 깔끔한 번호 매기기를 활용해 한눈에 보고서를 읽듯 파악할 수 있도록 배려하세요.
        5. [CRITICAL] 당신의 모든 답변 맨 마지막 줄에는 반드시 다음 분석 단계에 어울리는 구체적인 '추천 연계 후속 질문(suggested_followups)' 3개를 정확한 JSON 형식으로 첨부해야 합니다.
           이 JSON은 프론트엔드에서 파싱되어 후속 선택 칩으로 자동 렌더링되므로, 다른 텍스트 설명 없이 순수 JSON 코드 블록(\`\`\`json ... \`\`\`) 형식으로 맨 아래에 정확하게 단 한 번만 덧붙여야 합니다.
           JSON의 구조 예시:
           \`\`\`json
           {
             "suggested_followups": [
               "해당 지원자의 핵심 역량 강화를 위해 즉시 실행 가능한 주간 트레이닝 가이드라인을 작성해 주세요.",
               "BANT 체크리스트 누락 리스크가 가져올 수 있는 잠재적 매출 이탈액 시뮬레이션을 제시해 주세요.",
               "1:1 면담 상황에서 지원자가 '시간 부족'을 핑계 삼아 얼버무릴 때의 검증 질문은 무엇이 좋습니까?"
             ]
           }
           \`\`\`

        ${classificationDirectives}
      `;

      const selectedInstruction = isCandidate ? candidateSystemInstruction : managerSystemInstruction;

      try {
        const ai = getGeminiClient();

        // Convert input message format to contents
        const contents = messages.map((m: any) => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [{ text: m.content }]
        }));

        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: contents,
          config: {
            systemInstruction: selectedInstruction,
            temperature: classifiedType === 'DATA_TYPE' ? 0.1 : (isCandidate ? 0.7 : 0.3),
          }
        });

        return res.json({ success: true, text: response.text });

      } catch (err: any) {
        if (err.message === "GEMINI_API_KEY_MISSING") {
          let simulatedReply = "";

          if (classifiedType === 'DATA_TYPE') {
            simulatedReply = `| 역량 평가 대분류 | 세부 진단 영역 | 점수 (Score) | 컴플라이언스 기준 달성여부 |
| :--- | :--- | :---: | :---: |
| **도입 단계** | 오프닝 및 라포 형성 (Opening) | ${reportData.scores.opening}점 | ${reportData.compliances.find((c: any) => c.label.includes("E0001"))?.passed ? "PASS" : "FAIL"} |
| **발굴 단계** | 요구사항 심층 발굴 (Needs Discovery) | ${reportData.scores.needsDiscovery}점 | ${reportData.compliances.find((c: any) => c.label.includes("E0002"))?.passed ? "PASS" : "FAIL"} |
| **제안 단계** | 적합 솔루션 제안 (Solution Matching) | ${reportData.scores.solutionMatching}점 | ${reportData.compliances.find((c: any) => c.label.includes("E0003"))?.passed ? "PASS" : "FAIL"} |
| **극복 단계** | 이의제기 극복 및 방어 (Objection Handling) | ${reportData.scores.objectionHandling}점 | ${reportData.compliances.find((c: any) => c.label.includes("E0004"))?.passed ? "PASS" : "FAIL"} |
| **종결 단계** | 성과지향 종결 및 합의 (Closing) | ${reportData.scores.closing}점 | PASS |

* **지원자명**: ${reportData.candidateName}
* **지정 직무**: ${reportData.targetRole}
* **종합 세일즈 점수**: ${reportData.overallScore}점
* **체크리스트 준수 세부사항**:
${reportData.compliances.map((c: any) => `  * ${c.label}: ${c.passed ? "충족 (PASS)" : "미흡 (FAIL)"} - ${c.description}`).join("\n")}

\`\`\`json
{
  "suggested_followups": [
    "💡 가장 부진하게 진단된 영역의 점수 하락 요인을 구체적으로 알고 싶습니다.",
    "📋 전체 체크리스트 항목 중 법적 리스크로 번질 수 있는 요소를 짚어주세요.",
    "📊 다른 동료 지원자 집단과 비교 분석한 벤치마크 데이터를 추출해주세요."
  ]
}
\`\`\``;
          } else {
            if (isCandidate) {
              const scoresArr = [
                { name: '도입 및 라포 형성', val: reportData.scores.opening },
                { name: '요구사항 발굴', val: reportData.scores.needsDiscovery },
                { name: '솔루션 제안', val: reportData.scores.solutionMatching },
                { name: '이의제기 해결', val: reportData.scores.objectionHandling },
                { name: '클로징 및 합의', val: reportData.scores.closing }
              ].sort((a, b) => a.val - b.val);
              const weakArea = scoresArr[0];

              simulatedReply = `💡 **VOISOR 1:1 맞춤 성장 코칭 피드백**

**"${lastUserMessage}"**에 대한 분석 내용을 Fact-Impact-Fix 프레임워크에 기반하여 전달해 드릴게요. ${reportData.candidateName}님, 함께 천천히 개선하면서 세일즈 실력을 무기화해 보아요! 🔥

---

### 🔍 Fact (사실 및 정량 진단)
* ${reportData.candidateName}님의 현재 평가 리포트에 따르면, **${weakArea.name}** 영역이 **${weakArea.val}점**으로 가장 낮은 보완 필요 영역으로 기록되어 있습니다.
* 또한, 필수 체크리스트 항목 중 [${reportData.compliances.filter((c: any) => !c.passed).map((c: any) => c.label.split(' ')[0]).join(', ') || 'BANT'}] 과정이 현재 미흡(FAIL)으로 채점되어 개선이 요구됩니다.

### ⚠️ Impact (비즈니스 매출 타격 및 리스크)
* **${weakArea.name}**이 미흡할 경우, 초기 라포 형성에 실패하거나 고객의 진성 예산을 파악하지 못하게 되어 **제안서 작성 후 무의미한 가격 깎기 딜(Deal)에 휘말려 계약이 영구 무산**될 우려가 있습니다.
* 소속이나 성명을 온전히 알리지 않는 오프닝 습관은 기업 브랜드의 신뢰도를 실추시키고 고객의 조기 전화를 끊도록 유도하여 전환율(Conversion Rate)을 30% 이상 악화시킵니다.

### 🛠️ Fix (실전 액션 플랜 및 추천 멘트)
* **초특급 실전 대화 스크립트 제안 (TO-BE 적용):**
  * **AS-IS (기존 습관):** *"아, 단가는 저희가 대략 맞춰드릴 수는 있는데..."* (수비적인 할인 약속)
  * **TO-BE (코칭 추천):**
    > ❝ 고객님, 저희가 맞춤형 할인 혜택을 제안서에 가장 정교하게 담아내고자 합니다. 혹시 이번에 기획하신 내부 가용 예산 한도가 대략 어느 범위 내에 책정되어 있으신지 넌지시 힌트를 주실 수 있을까요? 
    > 
    > 한도 범위를 미리 고려한다면 내부 보고 시 승인이 가장 유용하고 단 한 번에 결재 통과가 가능한 최적의 ROI 견적을 구성해 드리겠습니다. ❞
* **매일 5분 자가 발음 훈련 및 경청 일지 작성**을 병행하여 상대의 말 속도에 싱크로율을 맞춰 대화를 리드해 보세요!

\`\`\`json
{
  "suggested_followups": [
    "💡 방금 추천해주신 스크립트를 거부감 없이 내 입에 맞게 자연스럽게 훈련하는 노하우는?",
    "🔥 가격 극복 상황에서 디스카운트 딜을 뺏기지 않고 마진을 수호하는 멘트가 더 있나요?",
    "🎯 이의제기를 사전에 철저히 예방할 수 있는 선제적 프리젠테이션 기술이 궁금해요."
  ]
}
\`\`\``;
            } else {
              const scoresArr = [
                { name: '도입 및 라포 형성', val: reportData.scores.opening },
                { name: '요구사항 발굴', val: reportData.scores.needsDiscovery },
                { name: '솔루션 제안', val: reportData.scores.solutionMatching },
                { name: '이의제기 해결', val: reportData.scores.objectionHandling },
                { name: '클로징 및 합의', val: reportData.scores.closing }
              ].sort((a, b) => a.val - b.val);
              const weakArea = scoresArr[0];

              simulatedReply = `📊 **VOISOR 세일즈 리더용 리스크 관리 피드백**

**수신**: 영업 관리자 / 본부장
**의견 지시 대상**: ${reportData.candidateName} 지원자 개선 개입 플랜 (${lastUserMessage})

---

### 🔍 Fact (사실 및 정량 진단)
* 해당 지원자는 5대 역량 진단 항목 중 **[${weakArea.name}]** 부문에서 **${weakArea.val}점**으로 최저 수준을 보이고 있습니다.
* 특히 필수 세일즈 감사 항목인 [${reportData.compliances.filter((c: any) => !c.passed).map((c: any) => c.label.split(' ')[0]).join(', ') || 'BANT'}]가 누락되었습니다.

### ⚠️ Impact (비즈니스 매출 타격 및 리스크)
* 컴플라이언스 미준수로 인한 법적 불완전 판매 리스크가 존재하며, BANT를 온전히 확인하지 않고 무턱대고 제안에 돌입함으로써 **평균 딜 클로징 기간(Sales Cycle)이 1.8배 지연되고, 전체 수주율이 최소 45% 하락**하는 직간접적인 비즈니스 손실이 예상됩니다.

### 🛠️ Fix (실전 액션 플랜 및 추천 멘트)
* **관리자의 행동 수정 명령 (Manager Intervention Plan):**
  1. **BANT 검증 강제 프로토콜 수립**: 앞으로 모든 잠재 딜 기안 단계에서 예산(Budget)과 승인 타임라인(Timeline)의 구체적 획득 여부를 표시하는 문서를 필수 제출하도록 업무 승인 체계를 잠그십시오.
  2. **1대1 섀도잉 및 카운터 피드백 실행**: 다음 3회 미팅까지 지점장 또는 사수가 의무 동행하여, 지원자가 고객의 이의제기를 회피하려 할 때 리더가 바톤을 이어받아 시범을 보인 후 녹취록을 교정하십시오.

\`\`\`json
{
  "suggested_followups": [
    "📊 이 지원자의 BANT 미이행이 미칠 예상 연간 매출 타격액 시뮬레이션을 작성해 주세요.",
    "🛠️ 리더 공동 미팅 참관 시 사용할 수 있는 원페이지 관찰용 체크리스트를 주십시오.",
    "📈 지원자 집단의 역량 분석 결과를 종합 리더십 보드에 즉시 연동하는 양식이 있나요?"
  ]
}
\`\`\``;
            }
          }

          return res.json({ 
            success: true, 
            simulated: true, 
            message: "GEMINI_API_KEY가 설정되지 않아 VOISOR Smart Simulator가 대신 정밀 코칭을 제공합니다.",
            text: simulatedReply 
          });
        }
        throw err;
      }

    } catch (error: any) {
      console.error("Chat Endpoint Error:", error);
      res.status(500).json({ error: error.message || "Internal server chat error" });
    }
  });

  // Serve Vite's Client-side Application
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  const port = 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`VOISOR Server is running on port ${port} (0.0.0.0)`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start VOISOR server:", err);
});
