# VOISOR Candidate Coach & Risk Advisor - Project Instructions

## 🎯 Project Overview
VOISOR is a dual-perspective, interactive sales coaching application. It parses and visualizes VOTEST sales interaction audits, providing structured coaching for Candidates (to improve performance) and Managers (to mitigate risk).

## 🎨 UI/UX Design Guidelines

### Color Palette & Themes
*   **Dark Mode (Default/Cosmic):** High-contrast deep slate and zinc dark themes (`bg-zinc-950`, `bg-zinc-900`) with blue accents (`#0052cc`).
*   **Light Mode:** Accessible, pristine light gray and white canvases. Text elements must use dynamic classes for robust contrast:
    *   **Chat bubble text:** Use `text-gray-800` in light mode and `text-gray-100` in dark mode.
    *   **Main header titles:** Use dark gray/black (`text-gray-900` or `text-zinc-900`) in light mode.
    *   **High Contrast Indicators:** Blue highlighted text (such as `#0052cc` or `text-blue-600`) must remain easily visible against both dark and light backgrounds.

### Interactive Components
*   **Floating Chat Trigger:** Located in the bottom-right corner. When closed, it is primary blue. When open, it displays a floating close button with a deep dark background (`bg-slate-900`), white icon (`text-white`), and robust drop shadow (`shadow-lg`).
*   **Coaching Category Chips:** 
    *   **Selected:** Filled primary blue (`bg-[#0052cc]`) with bold white text.
    *   **Unselected (Light Mode):** Clean white background with a faint gray border (`border-gray-300`), dark gray text (`text-zinc-600`), and a subtle hover background (`hover:bg-gray-50`) to provide high click affordance.
    *   **Unselected (Dark Mode):** Semi-transparent dark background (`bg-zinc-900/60`), subtle borders (`border-zinc-800`), and clean gray text.

## ⚙️ Backend & API Guidelines
*   **Server Entrypoint:** `/server.ts` handles Express routing and serves as the backend proxy.
*   **Gemini API Integration:** Uses the `@google/genai` SDK on the server side (`process.env.GEMINI_API_KEY`) to analyze uploads and generate structured Fact-Impact-Fix feedback.
*   **Offline Simulation:** Fallback simulations must remain robust, fully structured, and high-fidelity if the API key is not actively configured in development.
