const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function testAuth() {
  console.log('🔍 Setting up Chrome session clone...');
  const sourceDir = '/Users/it-trv/Library/Application Support/Google/Chrome';
  const targetDir = '/tmp/jobstreet-chrome-session';

  // Clean previous
  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(targetDir, 'Default', 'Network'), { recursive: true });

  console.log('Copying Local State and Default profile cookies/storage...');
  try {
    execSync(`cp -R "${sourceDir}/Local State" "${targetDir}/" 2>/dev/null || true`);
    execSync(`cp -R "${sourceDir}/Default/Cookies" "${targetDir}/Default/" 2>/dev/null || true`);
    execSync(`cp -R "${sourceDir}/Default/Network" "${targetDir}/Default/" 2>/dev/null || true`);
    execSync(`cp -R "${sourceDir}/Default/Local Storage" "${targetDir}/Default/" 2>/dev/null || true`);
    execSync(`cp -R "${sourceDir}/Default/Session Storage" "${targetDir}/Default/" 2>/dev/null || true`);
    execSync(`cp -R "${sourceDir}/Default/IndexedDB" "${targetDir}/Default/" 2>/dev/null || true`);
    execSync(`cp -R "${sourceDir}/Default/Preferences" "${targetDir}/Default/" 2>/dev/null || true`);
  } catch (e) {
    console.error('Error copying files:', e.message);
  }

  console.log('Launching Chrome with cloned profile...');
  const context = await chromium.launchPersistentContext(targetDir, {
    channel: 'chrome',
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();
  console.log('Navigating to https://id.jobstreet.com/id/my-activity/applied-jobs...');
  await page.goto('https://id.jobstreet.com/id/my-activity/applied-jobs', { waitUntil: 'networkidle', timeout: 30000 });

  await page.waitForTimeout(4000);
  const currentUrl = page.url();
  console.log('Current URL:', currentUrl);

  const bodyText = await page.textContent('body');
  const isLoggedIn = !currentUrl.includes('/login') && (bodyText.includes('Aktivitas') || bodyText.includes('Dilamar') || bodyText.includes('lowongan'));
  console.log('Is Logged In:', isLoggedIn);

  const cookies = await context.cookies();
  console.log(`Found ${cookies.length} cookies total.`);
  const jobstreetCookies = cookies.filter(c => c.domain.includes('jobstreet') || c.domain.includes('seek'));
  console.log(`Jobstreet/Seek cookies: ${jobstreetCookies.length}`);

  // Take screenshot
  await page.screenshot({ path: '/tmp/jobstreet_applied_jobs_screenshot.png' });
  console.log('Screenshot saved to /tmp/jobstreet_applied_jobs_screenshot.png');

  await context.close();
}

testAuth().catch(console.error);
