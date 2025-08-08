require('dotenv').config();
const fs = require('fs');
const { chromium } = require('playwright');

const THREAD_IDS = (process.env.THREAD_ID || '').split(',').map(s=>s.trim()).filter(Boolean);
const SESSION_DATA = process.env.SESSION_DATA || '';
const NAMES = (process.env.NAMES || '🔥 Hacker Team 🔥,🚀 Coders 🚀,🎯 Squad 🎯').split(',').map(s=>s.trim()).filter(Boolean);
const DELAY = parseInt(process.env.DELAY || '10', 10) * 1000;
const HEADLESS = (process.env.HEADLESS || 'true') !== 'false';

if (THREAD_IDS.length === 0) {
  console.error('ERROR: THREAD_ID environment variable is required (comma separated allowed).');
  process.exit(1);
}

const storageFile = 'session.json';

if (SESSION_DATA) {
  let content = SESSION_DATA;
  // try base64 decode
  try {
    const buf = Buffer.from(SESSION_DATA, 'base64');
    const maybe = buf.toString('utf8');
    if (maybe.trim().startsWith('{')) content = maybe;
  } catch (e) { /* ignore */ }
  try {
    fs.writeFileSync(storageFile, content, 'utf8');
    console.log('✅ Wrote session.json from SESSION_DATA');
  } catch (e) {
    console.error('❌ Failed writing session.json:', e);
    process.exit(1);
  }
} else {
  if (!fs.existsSync(storageFile)) {
    console.error('ERROR: session.json not found and no SESSION_DATA provided.');
    process.exit(1);
  }
}

(async () => {
  console.log('🤖 Instagram Group Name Auto-Changer (Node) starting...');
  const browser = await chromium.launch({ headless: HEADLESS, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const context = await browser.newContext({ storageState: storageFile });
  const page = await context.newPage();

  async function changeNameForThread(threadId, newName) {
    try {
      const threadUrl = `https://www.instagram.com/direct/t/${threadId}/`;
      console.log('→ Opening', threadUrl);
      await page.goto(threadUrl, { waitUntil: 'networkidle', timeout: 60000 });
      await page.waitForTimeout(3000);

      // Try to open header/settings
      try { await page.locator('header').first().click({ timeout: 5000 }); await page.waitForTimeout(1000); } catch(e){}

      // Try to find input
      const inputSel = 'div[role="dialog"] input, input[placeholder*="Group"], input[aria-label*="Name"]';
      let inputVisible = false;
      try { inputVisible = await page.locator(inputSel).first().isVisible(); } catch(e){}

      if (inputVisible) {
        const input = page.locator(inputSel).first();
        await input.fill('');
        await page.waitForTimeout(300);
        await input.fill(newName);
        await page.waitForTimeout(300);
        await input.press('Enter').catch(()=>{});
        // try save button
        const saveBtn = page.locator('div[role="dialog"] button:has-text("Save"), div[role="dialog"] button:has-text("Done"), button:has-text("Save")').first();
        if ((await saveBtn.count()) > 0) {
          try { await saveBtn.click(); } catch(e) {}
        }
      } else {
        // fallback selectors to open change name UI
        const changeSelectors = ['text=Change chat name','text=Edit name','button:has-text("Edit")','svg[aria-label="Edit"]'];
        for (const sel of changeSelectors) {
          try {
            const el = page.locator(sel).first();
            if ((await el.count()) > 0) {
              await el.click();
              await page.waitForTimeout(1000);
              const in2 = page.locator(inputSel).first();
              if ((await in2.count()) > 0) {
                await in2.fill(newName);
                await in2.press('Enter').catch(()=>{});
              }
              break;
            }
          } catch(e){}
        }
      }

      console.log('✅ Attempted to set name:', newName, 'for', threadId);
      await page.waitForTimeout(2000);
    } catch (err) {
      console.warn('❌ changeName error for', threadId, err.message || err);
    }
  }

  let idx = 0;
  while (true) {
    const name = NAMES[idx % NAMES.length];
    for (const t of THREAD_IDS) {
      await changeNameForThread(t, name);
      await page.waitForTimeout(1000); // small gap between threads
    }
    idx++;
    console.log('⏱ Waiting', DELAY/1000, 'seconds before next round...');
    await page.waitForTimeout(DELAY);
  }

  // await browser.close();
})().catch(e => { console.error('Fatal:', e); process.exit(1); });
