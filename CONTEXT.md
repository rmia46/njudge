# nJudge: Project Context

## Overview
nJudge is a modern, distributed alternative to VJudge, designed specifically for **Codeforces** and **AtCoder**. It solves the common "Server-Side Bot Detection" problem (Cloudflare blocks, IP rate limiting, and CAPTCHAs) by using a **Client-Side Bridge** architecture.

## The Architecture
Instead of a central server attempting to log in and submit on behalf of users, nJudge leverages a **Browser Extension**. 
- **Web App (Next.js):** Manages contests, problems, and the real-time leaderboard via Supabase.
- **Extension (Manifest V3):** Acts as the "Human Worker." It uses the user's active session cookies on Codeforces/AtCoder to perform submissions and scrape problem metadata.
- **Database (Supabase):** Provides a real-time PostgreSQL backend to sync submission verdicts across all contest participants instantly.

## Current Status (v0.5 - Inara Nature-Tech)
- **UI Reworked:** Transitioned to a full-width bottom "Command Dock" with hover-based sub-menus and Bit-Art styling.
- **Full CRUD:** Owners can create, update, and delete contests and problem sets.
- **Robust Permissions:** 
    - Private contests with access code protection.
    - Strict RLS policies enforcing owner-only management.
    - Visibility logic for "Spoilers" (original links/editorials) based on contest state.
- **Advanced Features:**
    - **Practice Mode:** Immediate start, infinite duration, auto-revealed links.
    - **Admin HUD:** Toggle for owners to view metadata without spoilers during active contests.
    - **Anti-Spam:** Duplicate code detection and pending-submission guards.
- **Submission Bridge:** Enhanced login detection with user guidance for missing OJ sessions.

## Tech Stack
- **Frontend:** Next.js 16 (App Router), Tailwind v4, shadcn/ui.
- **Design System:** Inara Bit-Art (Navy/Primary Green palette, VT323 pixel fonts).
- **Backend:** Supabase (Auth, Database, Realtime).
- **Extension:** JavaScript (Manifest V3).

## Development Roadmap

### Phase 1: Foundations (The Bridge) [DONE]
- [x] Extension Manifest & Script Bridge
- [x] Codeforces/AtCoder Scraping & Handshake logic
- [x] Submission Polling & Real-time updates

### Phase 2: User Experience & Auth [DONE]
- [x] Supabase Auth & Profile Integration
- [x] Monaco Editor with syntax highlighting and autosave
- [x] Inara Bit-Art Theme Implementation

### Phase 3: Contest Management [DONE]
- [x] Full CRUD for Contests & Problems
- [x] Private Contests with Access Codes
- [x] Practice Mode & Admin HUD scoping

### Phase 4: Reliability & Refinement [IN PROGRESS]
- [x] Anti-Spam & Duplicate Submission guards
- [x] Robust OJ Login detection
- [ ] Advanced Ranking Rules (ICPC vs AtCoder/IOI)
- [ ] "Custom Test" support for AtCoder (CF is DONE)
- [ ] Comprehensive Mobile-responsive UI polish
