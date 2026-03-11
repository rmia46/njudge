# nJudge

nJudge is a modern, distributed alternative to VJudge, designed for **Codeforces** and **AtCoder**. It bypasses server-side bot detection by using a client-side browser extension bridge.

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
This will launch a dedicated Firefox instance with the **nJudge Bridge** pre-loaded. Any changes made to the `extension/` folder will automatically trigger a reload.

## 🛠 Project Structure

- `app/`: Next.js frontend and API routes.
- `components/`: Modular UI components (shadcn based).
- `extension/`: Browser extension source code (Background and Content scripts).
- `supabase/`: Database migrations and configuration.
- `lib/`: Shared utilities, theme engine, and ranking logic.

## 🌈 Key Features

- **Distributed Bridge:** Submissions happen from the user's browser, ensuring zero IP blocks.
- **Real-time Standings:** Live leaderboards powered by Supabase Realtime.
- **Smart Scraper:** Automatic problem metadata and statement fetching.
- **Unified Themes:** Custom Emerald and Midnight themes with OKLCH color support.

## 📜 License
MIT
