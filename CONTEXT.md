# nJudge: Project Context

## Overview
nJudge is a modern, distributed alternative to VJudge, designed specifically for **Codeforces** and **AtCoder**. It solves the common "Server-Side Bot Detection" problem (Cloudflare blocks, IP rate limiting, and CAPTCHAs) by using a **Client-Side Bridge** architecture.

## The Architecture
Instead of a central server attempting to log in and submit on behalf of users, nJudge leverages a **Browser Extension**. 
- **Web App (Next.js):** Manages contests, problems, and the real-time leaderboard via Supabase.
- **Extension (Manifest V3):** Acts as the "Human Worker." It uses the user's active session cookies on Codeforces/AtCoder to perform submissions and scrape problem metadata.
- **Database (Supabase):** Provides a real-time PostgreSQL backend to sync submission verdicts across all contest participants instantly.

## Current Status (MVP Phase)
- **Scaffolded:** Next.js 16+ project with Tailwind CSS v4 and shadcn/ui.
- **Extension Bridge:** Initial Manifest V3 extension capable of `window.postMessage` communication with the web app.
- **Database Schema:** Defined `contests`, `problems`, and `submissions` tables in `SCHEMA.sql`.
- **Core Features Implemented:**
    - **Bridge Tester:** UI to verify extension connectivity.
    - **Contest Creation:** Form to add problems by ID with automatic title scraping via the extension.
    - **Problem View:** Integrated code editor and submission button.
    - **Submission Pipeline:** Extension handles the `csrf_token` handshake with Codeforces and polls for verdicts, updating Supabase directly.

## Tech Stack
- **Frontend:** Next.js (App Router), shadcn/ui, Tailwind v4.
- **Backend:** Supabase (Auth, Database, Realtime).
- **Extension:** JavaScript (Manifest V3).
- **Hosting:** Vercel (Frontend), Supabase (Backend).

## Development Roadmap

### Phase 1: Foundations (The Bridge)
- [x] Project Scaffolding (Next.js + Tailwind v4 + shadcn)
- [x] Extension Manifest & Content/Background Script Bridge
- [x] Supabase Database Schema (SCHEMA.sql)
- [x] Codeforces Problem Scraping via Extension
- [x] Codeforces Submission & CSRF Handshake logic
- [x] Submission Polling & Supabase Real-time updates

### Phase 2: User Experience & Auth
- [ ] Supabase Authentication (GitHub/Google login)
- [ ] User Profile (Codeforces/AtCoder handle verification)
- [ ] Monaco/CodeMirror Editor Integration (Syntax highlighting)
- [ ] Code Autosave (LocalStorage)

### Phase 3: Multi-OJ Support
- [ ] AtCoder Problem Scraping
- [ ] AtCoder Submission & Polling
- [ ] Language Mapping (Syncing internal IDs with OJ-specific IDs)

### Phase 4: Contest Features
- [ ] Real-time Live Leaderboard (Standings)
- [ ] Participant Management (Join contest logic)
- [ ] Contest Status Feed (Global/Participant attempts)
- [ ] Clarification System (Jury/Participant messaging)

### Phase 5: Reliability & Refinement
- [ ] "Custom Test" support via Extension
- [ ] Mobile-responsive UI polish
- [ ] Advanced Ranking Rules (ICPC vs AtCoder/IOI)
- [ ] Deployment to Vercel
