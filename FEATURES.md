# nJudge: Feature Roadmap

This document outlines the planned features for nJudge to become a comprehensive, high-reliability platform for competitive programming practice and contests.

## 1. Robust Problem Management
- **Source Integration:** A specialized search or "Import by ID" feature for Codeforces and AtCoder problems.
- **Metadata Syncing:** Automatically pull problem titles, time limits, and memory limits via the extension to display them natively.
- **Custom Problem Support:** Allow users to upload their own problem statements and test cases for private training sessions.

## 2. Flexible Contest Configuration
- **Contest Types:**
    - **Scheduled Contests:** Fixed start/end times for synchronous group competitions.
    - **Practice/Virtual Contests:** No fixed time limit or a "start whenever you're ready" mode for individual practice.
    - **Replays:** The ability to "replay" an old contest with the original ranklist data appearing in real-time as the user progresses.
- **Ranking Rules:** Support for standard **ICPC** (penalty-based) and **AtCoder/IOI** (partial points/subtasks) scoring styles.

## 3. Real-Time Competition Tools
- **Live Leaderboard:** A dynamic standings page that updates instantly using Supabase Realtime when a verdict is received.
- **Clarification System:** A built-in messaging tool where participants can ask "Jury" questions about problem ambiguities.
- **Status/Submission Feed:** A real-time log showing recent attempts by all participants to maintain a high-energy "competitive" atmosphere.

## 4. User Experience & Reliability
- **Autosave for Code:** LocalStorage or cloud-based autosave to prevent data loss during browser crashes or accidental refreshes.
- **Mobile Compatibility:** A fully responsive interface, allowing users to check rankings or read problem statements on the go.
- **Integrated IDE/Editor:** A rich code editor with syntax highlighting (Monaco/CodeMirror) and "Custom Test" support before final submission.

## 5. Administrative Controls
- **User Roles:** Distinct roles for "Admins" (can create/edit/delete contests) and "Participants."
- **Private/Public Contests:** Options to password-protect contests or make them "Unlisted" for private group invites.
- **Post-Contest Analysis:** An automated "Upsolving" mode that allows users to continue submitting to contest problems after the timer ends.
