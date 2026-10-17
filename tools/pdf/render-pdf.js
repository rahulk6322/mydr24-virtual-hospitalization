// Renders an HTML file to an A4 PDF using the sandbox's bundled Chromium.
// Usage: node render-pdf.js <input.html> <output.pdf> [header text]
const { chromium } = require('/inner_container/opt/toolchains/.nvm/versions/node/v22.23.3/lib/node_modules/@playwright/mcp/node_modules/playwright-core');

(async () => {
  const [input, output, header = 'MYDR24'] = process.argv.slice(2);
  const browser = await chromium.launch({
    executablePath: '/inner_container/opt/playwright/chromium-1232/chrome-linux64/chrome',
    args: ['--no-sandbox'],
  });
  const page = await browser.newPage();
  await page.goto('file://' + input, { waitUntil: 'load' });
  await page.pdf({
    path: output,
    format: 'A4',
    printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: `<div style="font-size:7px;width:100%;padding:0 14mm;color:#667085;font-family:'Noto Sans'">${header}</div>`,
    footerTemplate: `<div style="font-size:7px;width:100%;padding:0 14mm;color:#667085;font-family:'Noto Sans';display:flex;justify-content:space-between"><span>Confidential · Draft clinical content requires Clinical Governance Committee approval</span><span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    margin: { top: '16mm', bottom: '16mm', left: '14mm', right: '14mm' },
  });
  await browser.close();
  console.log('PDF written:', output);
})().catch((e) => { console.error(e); process.exit(1); });
