# VOISOR Designer & Developer Guide (디자이너 & 개발자 가이드)

Welcome to the VOISOR project! This guide is prepared to help both English-speaking and Korean-speaking UI/UX designers and front-end developers understand the architecture, design system, and data pipelines of the VOISOR application.

VOISOR 프로젝트에 오신 것을 환영합니다! 이 가이드는 UI/UX 디자이너와 프론트엔드 개발자가 VOISOR 애플리케이션의 아키텍처, 디자인 시스템 및 데이터 파이프라인을 쉽게 이해할 수 있도록 한국어와 영어로 작성되었습니다.

---

## 🗺️ 1. Project Overview (프로젝트 개요)

### **English**
VOISOR is a dual-perspective, interactive sales coaching application. It takes VOTEST sales interaction audits (call transcripts, scores, and compliance metrics) and provides two distinct coaching interfaces:
1.  **Candidate Coach (대상자 코치):** Focuses on personal growth, positive reinforcement, and actionable advice to help candidates improve call performance.
2.  **Manager Risk Advisor (관리자 리스크 어드바이저):** Focuses on corporate liability, compliance risks (e.g., privacy violations, script omissions), and corrective actions.

### **한국어**
VOISOR는 지원자(대상자)와 관리자 양쪽의 관점을 모두 제공하는 인터랙티브 세일즈 코칭 솔루션입니다. VOTEST 세일즈 통화 평가 결과(녹취록, 정량 점수, 규정 준수 여부)를 파싱하여 다음 두 가지 개별 코칭 인터페이스를 제공합니다:
1.  **대상자 코치 (Candidate Coach):** 개인의 성장, 긍정적인 피드백, 실질적인 행동 조언에 초점을 맞추어 지원자가 통화 역량을 향상할 수 있도록 지원합니다.
2.  **관리자 리스크 어드바이저 (Manager Risk Advisor):** 기업 책임, 법적 규정 준수 리스크(예: 개인정보 보호 위반, 스크립트 누락), 대외 리스크 예방 조치에 초점을 맞춥니다.

---

## 🎨 2. Design System & UX Principles (디자인 시스템 & UI 규칙)

### **English**
*   **Theme Options:** Supports a seamless light mode (white and clean gray) and a high-end, immersive dark mode (slate-zinc dark gradient).
*   **Accents:** Primary brand color is a premium professional blue (`#0052cc`, Tailwind `bg-[#0052cc]`).
*   **Anti-AI-Slop Principle:** We strictly avoid generic gradients, artificial telemetry logs (like "SYSTEM ONLINE" or "PORT: 3000"), and excessive widget badges. The layout is clean, humble, and production-ready.
*   **Accessibility Corrections:**
    *   **Floating Chat Trigger:** Located at the bottom-right. When open, the close button (X) utilizes a deep `bg-slate-900` with `text-white` and a robust drop shadow (`shadow-lg`) for premium contrast.
    *   **Sub-Question Category Chips:** Unselected chips on light mode have a faint gray border (`border-gray-300`) and a subtle hover state (`hover:bg-gray-50`) to emphasize clickability and prevent flat white-on-white visual blend.

### **한국어**
*   **테마 옵션:** 심플하고 깨끗한 라이트 모드(화이트 및 라이트 그레이)와 몰입감 높은 프리미엄 다크 모드(슬레이트-지크 다크 그라데이션)를 지원합니다.
*   **브랜드 포인트 컬러:** 프로페셔널한 느낌의 블루 컬러(`#0052cc`, 테일원 `bg-[#0052cc]`)를 사용합니다.
*   **반(反) AI-Slop 원칙:** 불필요한 시스템 로그(예: "SYSTEM ONLINE", "PORT: 3000" 등)나 화려하기만 하고 실속 없는 그래픽 요소를 철저히 배제하고, 사용자 경험에 집중한 미니멀하고 정갈한 레이아웃을 제공합니다.
*   **가독성 & 대비 조정 사항:**
    *   **우측 하단 플로팅 채팅 트리거:** 채팅창이 열렸을 때 닫기(X) 버튼은 시각적 가독성을 확보하기 위해 어두운 톤(`bg-slate-900`)에 흰색 아이콘(`text-white`), 깊이 있는 그림자 효과(`shadow-lg`)를 적용했습니다.
    *   **질문 추천 카테고리 칩:** 라이트 모드에서 선택되지 않은 흰색 칩들이 배경과 겹쳐 평평해 보이는 문제를 방지하기 위해 옅은 회색 테두리(`border-gray-300`)와 마우스 호버 효과(`hover:bg-gray-50`)를 추가하여 누를 수 있는 버튼임을 직관적으로 보여줍니다.

---

## 🔌 3. Integrations: Airtable & Make.com (연동 가이드: 에어테이블 & 메이크)

### **English**
#### **Does the UI/UX Designer need access to Airtable or Make.com?**
*   **No.** The designer does not need access to these backend systems.
*   The frontend uses a beautifully structured JSON format to render evaluation reports. Even if the backend API is disconnected, a high-fidelity simulation mode automatically takes over, allowing the designer to test and refine the interface completely offline.
*   **Role of Airtable & Make:**
    *   **Airtable:** Serves as a lightweight database where call records and candidate evaluation data are stored.
    *   **Make.com:** Coordinates the pipeline. When a call is processed, Make triggers a webhook, formats the transcript, requests analysis from Gemini, and updates Airtable.

### **한국어**
#### **UI/UX 디자이너가 Airtable이나 Make.com 계정 권한을 받아야 하나요?**
*   **아니요, 필요하지 않습니다.** 디자이너는 백엔드 시스템에 직접 접근하지 않고도 독립적으로 디자인 작업을 진행할 수 있습니다.
*   화면은 이미 구조화된 고품질 JSON 데이터를 기반으로 랜더링되며, 백엔드 연동이나 API 키가 없는 환경에서도 **오프라인 시뮬레이션 모드**가 자동으로 작동하므로, 디자이너는 오프라인 상태에서도 완전한 프로토타입 인터랙션을 확인하며 스타일을 다듬을 수 있습니다.
*   **Airtable과 Make의 역할:**
    *   **Airtable:** 통화 기록 및 지원자 평가 점수 데이터가 저장되는 가벼운 데이터베이스 역할을 합니다.
    *   **Make.com:** 전체 데이터 파이프라인의 허브입니다. 새로운 통화가 들어오면 메이크 시나리오가 웹훅을 감지하여 녹취록을 포맷팅하고, Gemini AI 분석을 요청하여 Airtable에 업데이트합니다.

---

## 🚀 4. How to Grant Access to the Designer (디자이너에게 프로젝트 공유하는 방법)

### **English**
1.  **AI Studio Interactive Preview (Easiest):**
    *   Click the **Share** button at the top-right of the AI Studio interface.
    *   Send the **Shared App URL** to your designer. They can interact with the app, toggle dark/light modes, upload voice audits, and chat with the AI Coach in real-time.
2.  **Direct Codebase Export:**
    *   If they need to edit CSS classes directly, they can download the project as a ZIP file or push it to a private GitHub repository via the settings menu in the developer workspace.
    *   They can run the project locally with:
        ```bash
        npm install
        npm run dev
        ```

### **한국어**
1.  **AI Studio 인터랙티브 프리뷰 (가장 추천하는 방법):**
    *   AI Studio 화면 우측 상단의 **공유(Share)** 버튼을 누릅니다.
    *   생성된 **Shared App URL**을 디자이너에게 전달해 주세요. 로그인 없이도 즉시 다크/라이트 모드 토글, 오디오 업로드 정밀 분석, 실시간 AI 코치 피드백 대화를 완전하게 실행해 볼 수 있습니다.
2.  **소스코드 직접 제공:**
    *   디자이너가 직접 Tailwind CSS 클래스나 마크업을 편집하고 싶다면, 개발 환경 메뉴에서 프로젝트를 ZIP 파일로 다운로드하거나 GitHub 프라이빗 저장소로 연동할 수 있습니다.
    *   로컬 환경 실행 방법:
        ```bash
        npm install
        npm run dev
        ```

---

## 📋 5. Custom Instructions Persistence (맞춤형 규칙 보존 안내)

### **English**
*   **Why did instructions disappear before?** 
    *   Temporary chat instructions can be reset when starting a new session or switching contexts.
*   **How we solved it:**
    *   We created an **`AGENTS.md`** file in the root directory.
    *   The Google AI Studio platform automatically reads and persists the instructions from `AGENTS.md` at the beginning of every session. All UI/UX color requirements and guidelines are now permanently stored inside the project workspace!

### **한국어**
*   **이전에 맞춤형 규칙(Custom Instructions)이 계속 사라졌던 이유:**
    *   채팅창에만 임시로 입력한 규칙은 새 세션이 시작되거나 대화 컨텍스트가 끊길 때 초기화될 수 있습니다.
*   **해결 방법:**
    *   프로젝트의 루트 디렉토리에 **`AGENTS.md`** 파일을 영구적으로 생성했습니다!
    *   Google AI Studio 플랫폼은 매 세션 시작 시 `AGENTS.md` 파일에 저장된 지침을 자동으로 불러와 반영합니다. 이제 디자이너와 설정한 UI/UX 테마 컬러, 반응형 컴포넌트 동작 규칙 등이 프로젝트 안에 완벽하게 보존됩니다.
