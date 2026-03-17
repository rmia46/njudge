# nJudge 🌿

nJudge is a modern, distributed alternative to VJudge, designed for **Codeforces** and **AtCoder**. It features a unique **Inara Bit-Art** design system and bypasses server-side bot detection by using a client-side browser extension bridge.

## ✨ The Inara Experience

nJudge isn't just a judge; it's a "Nature-Tech" environment. 
- **Command Dock:** A responsive, full-width bottom navigation bar with hover-based sub-menus.
- **Bit-Art Aesthetic:** High-contrast Navy on Primary Green, with sharp 3px borders and solid shadows.
- **Pixel Typography:** Utilizing VT323 for a nerdy, game-like interface.

## 🚀 Getting Started (Local Development)

nJudge uses a dual-development workflow: a Next.js web app and a browser extension.

### 1. Prerequisite: Supabase CLI
nJudge relies on a local Supabase stack for development.

1.  **Install Docker:** Ensure Docker is installed and running on your system.
2.  **Initialize & Start:**
    ```bash
    npx supabase init
    npx supabase start
    ```
3.  **Apply Migrations:**
    ```bash
    npx supabase db reset
    ```
4.  **Configure Environment:**
    Copy the `API URL` and `anon key` from the console output and create a `.env.local` file:
    ```bash
    NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_local_anon_key
    ```

### 2. Run the Next.js Web App
```bash
npm install
npm run dev
```
The app will be available at [http://localhost:3000](http://localhost:3000).

### 3. Run the Browser Extension (Firefox)
To develop the extension with auto-reloading:
```bash
npm run dev:extension:firefox
```
This will launch a dedicated Firefox instance with the **nJudge Bridge** pre-loaded.

## 🛠 Project Structure

- `app/`: Next.js frontend, including the dynamic `Contest` and `Problem` systems.
- `components/`: Modular Inara-styled UI components.
- `extension/`: Browser extension bridge (Manifest V3).
- `supabase/`: Database schema, RLS policies, and migrations.
- `lib/`: Shared utilities, `inara-colors` system, and ranking logic.

## 🌈 Key Features

- **Distributed Bridge:** Submissions happen directly from your browser—no IP blocks, no limits.
- **Practice Mode:** Create immediate, infinite challenges with auto-revealed editorials.
- **Admin HUD:** Contest owners can toggle a special "HUD" to see original links without spoilers.
- **Anti-Spam Guards:** Built-in checks for duplicate code and pending submission blocks.
- **Private Contests:** Secure challenges locked behind password access codes.
- **Real-time Standings:** Live leaderboards powered by Supabase Realtime.

## 📜 License
MIT
