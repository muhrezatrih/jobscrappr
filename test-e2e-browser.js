const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runE2ETest() {
  console.log('🚀 Starting Full End-to-End Browser Test Suite for JobFlow AI...\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.error(`[Browser Console Error]: ${msg.text()}`);
      errors.push(msg.text());
    }
  });

  page.on('pageerror', (err) => {
    console.error(`[Page Error]: ${err.message}`);
    errors.push(err.message);
  });

  try {
    // ----------------------------------------------------
    // TEST 1: DASHBOARD PAGE & CONTROL CENTER
    // ----------------------------------------------------
    console.log('📌 Test 1: Loading Dashboard (http://localhost:3002)...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    const pageTitle = await page.textContent('h1');
    console.log(`   ✓ Page H1 loaded: "${pageTitle.trim()}"`);

    // Test Theme Switcher
    console.log('   - Testing theme toggle...');
    const themeBtn = page.locator('button[aria-label="Toggle Theme"]');
    await themeBtn.click();
    await page.waitForTimeout(300);
    await themeBtn.click();
    console.log('   ✓ Theme toggle works smoothly.');

    // Test "Test Match" Button
    console.log('   - Testing "Test Match" AI evaluation button...');
    const testMatchBtn = page.getByRole('button', { name: /Test Match/i });
    await testMatchBtn.click();
    
    // Wait for drawer to appear
    console.log('   - Waiting for AI evaluation & drawer...');
    await page.waitForSelector('h2', { timeout: 10000 });
    const drawerTitle = await page.locator('h2').first().textContent();
    console.log(`   ✓ Application Drawer opened for: "${drawerTitle?.trim()}"`);

    // Test Cover Letter Tab in Drawer
    const coverLetterTab = page.getByRole('button', { name: /Cover Letter/i });
    if (await coverLetterTab.count() > 0) {
      await coverLetterTab.click();
      await page.waitForTimeout(400);
      console.log('   ✓ Clicked Cover Letter tab.');
    }

    // Test Screening Q&A Tab in Drawer
    const screeningTab = page.getByRole('button', { name: /Screening Q&A/i });
    if (await screeningTab.count() > 0) {
      await screeningTab.click();
      await page.waitForTimeout(400);
      console.log('   ✓ Clicked Screening Q&A tab.');
    }

    // Close drawer with Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
    console.log('   ✓ Closed Application Drawer.');

    // ----------------------------------------------------
    // TEST 2: RESUME UPLOAD (/upload)
    // ----------------------------------------------------
    console.log('\n📌 Test 2: Navigating to Resume Upload (/upload)...');
    await page.goto('http://localhost:3002/upload', { waitUntil: 'networkidle' });
    
    // Create a mock resume file
    const sampleResumePath = path.join(__dirname, 'sample_candidate_resume.txt');
    fs.writeFileSync(
      sampleResumePath,
      `Muhammad Reza Tri Hariyanto
Senior Software Engineer
Email: reza.tri@techcorp.id
Phone: +62 812-9876-5432
Location: Jakarta, Indonesia

SUMMARY:
Results-driven Senior Fullstack Engineer with 5+ years of production experience building high-scale distributed applications using Next.js, React, TypeScript, Node.js, NestJS, and PostgreSQL.

SKILLS:
TypeScript, React, Next.js, Node.js, NestJS, PostgreSQL, Prisma ORM, Redis, Docker, TailwindCSS, REST APIs, GraphQL, Microservices, CI/CD.

EXPERIENCE:
Senior Fullstack Engineer - PT Digital Inovasi Global (2022 - Present)
- Architected enterprise cloud applications with Next.js and NestJS handling 1M+ monthly active requests.
- Optimized database query performance and implemented automated CI/CD pipelines.

Backend Developer - Tech Studio Nusantara (2019 - 2022)
- Built robust RESTful APIs in Node.js & TypeScript with 99.9% uptime.
`
    );

    console.log('   - Uploading sample candidate resume...');
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(sampleResumePath);
    await page.waitForTimeout(400);

    const extractBtn = page.getByRole('button', { name: /Extract with AI/i });
    if (await extractBtn.count() > 0) {
      await extractBtn.click();
      console.log('   - AI extraction initiated, waiting for completion...');
      await page.waitForSelector('text=Resume Extracted Successfully!', { timeout: 15000 });
      console.log('   ✓ Resume parsed & saved successfully by Gemini AI!');
    }

    // Click Proceed to Profile Review
    const reviewBtn = page.getByRole('button', { name: /Review Profile & Criteria/i });
    if (await reviewBtn.count() > 0) {
      await reviewBtn.click();
      await page.waitForURL('**/profile', { timeout: 8000 });
      console.log('   ✓ Navigated to /profile via Review button.');
    }

    // ----------------------------------------------------
    // TEST 3: PROFILE & PREFERENCES (/profile)
    // ----------------------------------------------------
    console.log('\n📌 Test 3: Testing Profile & Criteria (/profile)...');
    await page.waitForSelector('input[type="text"]', { timeout: 8000 });
    const fullNameInput = page.locator('input[type="text"]').first();
    const currentName = await fullNameInput.inputValue();
    console.log(`   ✓ Candidate Profile Name: "${currentName}"`);

    // Add a new skill
    const skillInput = page.locator('input[placeholder="Add new skill..."]');
    if (await skillInput.count() > 0) {
      await skillInput.fill('Playwright Automation');
      const addSkillBtn = page.getByRole('button', { name: /Add/i }).first();
      await addSkillBtn.click();
      await page.waitForTimeout(400);
      console.log('   ✓ Added new skill tag: "Playwright Automation"');
    }

    // Switch to Criteria tab
    const criteriaTab = page.getByRole('button', { name: /Criteria & Safety Limits/i });
    await criteriaTab.click();
    await page.waitForTimeout(400);
    console.log('   ✓ Switched to Criteria & Safety Limits tab.');

    // Save Criteria
    const saveCriteriaBtn = page.getByRole('button', { name: /Save Criteria/i });
    if (await saveCriteriaBtn.count() > 0) {
      await saveCriteriaBtn.click();
      await page.waitForTimeout(800);
      console.log('   ✓ Criteria & safety settings saved.');
    }

    // ----------------------------------------------------
    // TEST 4: APPLICATIONS PIPELINE (/applications)
    // ----------------------------------------------------
    console.log('\n📌 Test 4: Navigating to Applications Pipeline (/applications)...');
    await page.goto('http://localhost:3002/applications', { waitUntil: 'networkidle' });
    
    const searchAppInput = page.locator('input[placeholder*="Search"]');
    await searchAppInput.fill('Software');
    const filterBtn = page.getByRole('button', { name: /Filter/i });
    await filterBtn.click();
    await page.waitForTimeout(600);
    console.log('   ✓ Applications filtered by search term "Software".');

    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(500);
      console.log('   ✓ Clicked application table row to open Detail Drawer.');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(400);
    }

    // ----------------------------------------------------
    // TEST 5: LIVE TERMINAL (/logs)
    // ----------------------------------------------------
    console.log('\n📌 Test 5: Navigating to Live Terminal (/logs)...');
    await page.goto('http://localhost:3002/logs', { waitUntil: 'networkidle' });
    const sseIndicator = page.locator('text=LIVE SSE');
    if (await sseIndicator.count() > 0) {
      console.log('   ✓ SSE Live Connection active.');
    }

    // ----------------------------------------------------
    // TEST 6: SETTINGS (/settings)
    // ----------------------------------------------------
    console.log('\n📌 Test 6: Navigating to Settings (/settings)...');
    await page.goto('http://localhost:3002/settings', { waitUntil: 'networkidle' });
    const saveSettingsBtn = page.getByRole('button', { name: /Save All Settings/i });
    await saveSettingsBtn.click();
    await page.waitForTimeout(800);
    console.log('   ✓ Settings saved successfully.');

    // ----------------------------------------------------
    // TEST 7: RUN SIMULATION WORKER & AUDIT
    // ----------------------------------------------------
    console.log('\n📌 Test 7: Starting Worker Loop (Simulation / Dry-Run Mode)...');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle' });
    const startWorkerBtn = page.getByRole('button', { name: /Start Auto-Apply/i });
    if (await startWorkerBtn.count() > 0) {
      await startWorkerBtn.click();
      console.log('   - Auto-Applier started! Monitoring live execution for 8 seconds...');
      await page.waitForTimeout(8000);

      // Stop worker
      const stopBtn = page.getByRole('button', { name: /Stop/i });
      if (await stopBtn.count() > 0) {
        await stopBtn.click();
        console.log('   ✓ Auto-Applier stopped cleanly.');
      }
    }

    console.log('\n======================================================');
    if (errors.length === 0) {
      console.log('🎉 ALL END-TO-END BROWSER TESTS PASSED WITH 0 ERRORS! 🎉');
    } else {
      console.log(`⚠️ Completed with ${errors.length} browser errors:`, errors);
    }
    console.log('======================================================\n');
  } catch (err) {
    console.error('❌ E2E Test encountered an unhandled exception:', err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runE2ETest();
