Node.js Instagram Group Name Auto-Changer (Render-ready)

Files included:
- index.js
- package.json
- .env.example
- .gitignore
- Procfile
How to deploy:
1) Create GitHub repo and upload these files. If you prefer, keep repo private and add session.json after.
2) Add your session.json (Playwright storageState) to repo root OR set SESSION_DATA env var (base64/raw JSON).
3) On Render create a new Web Service (Node):
   - Build Command: npm ci && npx playwright install --with-deps chromium
   - Start Command: npm start
4) Set env vars on Render (THREAD_ID, NAMES, DELAY, SESSION_DATA if not uploading session.json)
Notes:
- session.json must be Playwright storageState (not instagrapi). If you have instagrapi session, tell me to help convert.
- Use reasonable DELAY to avoid rate limits.
