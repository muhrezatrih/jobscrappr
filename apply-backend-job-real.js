const { chromium } = require('playwright');
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function applyRealBackendJob() {
  console.log('🌟 Starting Real End-to-End Jobstreet Application for Backend Developer...');
  const targetDir = '/tmp/jobstreet-real-session';
  const apiKey = process.env.GEMINI_API_KEY || '';
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

  const context = await chromium.launchPersistentContext(targetDir, {
    headless: false,
    viewport: { width: 1280, height: 950 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();
  const jobUrl = 'https://id.jobstreet.com/id/job/93798194';

  console.log(`\n📍 Step 1: Navigating to ${jobUrl}...`);
  await page.goto(jobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Extract job details for Gemini AI tailoring
  const jobInfo = await page.evaluate(() => {
    const title = document.querySelector('h1')?.innerText.trim() || 'Backend Developer';
    const comp = document.querySelector('a[data-automation="jobCompany"]')?.innerText.trim() || 'PT Insura Media Solusi (Jakarta)';
    const desc = document.querySelector('div[data-automation="jobAdDetails"], div[data-automation="jobDescription"]')?.innerText.trim() || '';
    return { title, comp, desc };
  });

  console.log(`Target Job: ${jobInfo.title} at ${jobInfo.comp}`);

  // Generate personalized cover letter with Gemini
  console.log('🤖 Generating personalized Cover Letter with Gemini AI...');
  let coverLetterText = '';
  try {
    const prompt = `Write a concise, professional cover letter (150 words) in Bahasa Indonesia for Muhammad Reza Tri Hariyanto applying for ${jobInfo.title} at ${jobInfo.comp}. Highlights: 5+ years backend developer experience, Node.js, TypeScript, REST APIs, PostgreSQL, high performance system design. Return ONLY the letter body.`;
    const res = await geminiModel.generateContent(prompt);
    coverLetterText = res.response.text().trim();
    console.log('Cover Letter generated:\n', coverLetterText);
  } catch (e) {
    coverLetterText = `Kepada Tim Rekrutmen ${jobInfo.comp},\n\nSaya tertarik untuk melamar posisi ${jobInfo.title}. Dengan pengalaman lebih dari 5 tahun di bidang backend development menggunakan TypeScript, Node.js, dan PostgreSQL, saya siap memberikan kontribusi maksimal bagi perusahaan.\n\nTerima kasih atas perhatian dan kesempatannya.\n\nHormat saya,\nMuhammad Reza Tri Hariyanto`;
  }

  // Click Apply Button
  console.log('\n📝 Step 2: Clicking Apply ("Lamaran Cepat") button...');
  const applyBtn = page.locator('a[data-automation="job-detail-apply"], a:has-text("Lamaran Cepat"), button:has-text("Lamaran Cepat"), a:has-text("Daftar")').first();
  await applyBtn.click();
  await page.waitForTimeout(4000);

  // Process Multi-Step Application Form
  for (let currentStepNum = 1; currentStepNum <= 6; currentStepNum++) {
    console.log(`\n================ STEP ${currentStepNum} ================`);
    console.log('Current URL:', page.url());
    console.log('Page Title:', await page.title());
    await page.waitForTimeout(2000);

    // Scroll to see all contents
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    // Check if Cover Letter input exists on this step
    const coverLetterTextarea = page.locator('textarea, [contenteditable="true"]').first();
    if (await coverLetterTextarea.count() > 0) {
      const isVisible = await coverLetterTextarea.isVisible();
      if (isVisible) {
        const val = await coverLetterTextarea.inputValue().catch(() => '');
        if (!val || val.length === 0) {
          console.log('Filling Cover Letter textarea...');
          await coverLetterTextarea.fill(coverLetterText);
          await page.waitForTimeout(800);
        }
      }
    }

    // Check for Screening Questions on this step
    const questionsContainers = page.locator('[data-automation*="question"], fieldset, div[role="group"]');
    const qCount = await questionsContainers.count();
    console.log(`Detected ${qCount} potential question groups.`);

    // Handle Text Inputs (like salary or years of exp)
    const textInputs = page.locator('input[type="text"], input[type="number"], input:not([type])');
    const tCount = await textInputs.count();
    for (let i = 0; i < tCount; i++) {
      const inp = textInputs.nth(i);
      if (await inp.isVisible()) {
        const val = await inp.inputValue();
        const placeholder = (await inp.getAttribute('placeholder')) || '';
        const name = (await inp.getAttribute('name')) || '';
        const id = (await inp.getAttribute('id')) || '';
        console.log(`Text Input ${i + 1}: id="${id}", name="${name}", placeholder="${placeholder}", val="${val}"`);
        if (!val || val.trim().length === 0) {
          if (placeholder.includes('gaji') || name.includes('salary')) {
            await inp.fill('15000000');
          } else if (placeholder.includes('tahun') || name.includes('experience')) {
            await inp.fill('5');
          } else if (placeholder.includes('bulan') || name.includes('month')) {
            await inp.fill('1');
          } else {
            await inp.fill('5');
          }
          await page.waitForTimeout(400);
        }
      }
    }

    // Handle Radio Buttons (select first or 'Yes' if needed)
    const radioInputs = page.locator('input[type="radio"]');
    const rCount = await radioInputs.count();
    console.log(`Radio buttons count: ${rCount}`);
    if (rCount > 0) {
      // Find unselected groups and select appropriate options
      const groups = await page.evaluate(() => {
        const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
        const groupNames = [...new Set(radios.map(r => r.name).filter(Boolean))];
        return groupNames;
      });

      for (const gName of groups) {
        const checked = await page.locator(`input[type="radio"][name="${gName}"]:checked`).count();
        if (checked === 0) {
          console.log(`Selecting option for radio group "${gName}"...`);
          // Try to select 'Ya' / 'Yes' / first option
          const yesOption = page.locator(`label:has-text("Ya"), label:has-text("Yes"), input[type="radio"][name="${gName}"]`).first();
          await yesOption.click({ force: true });
          await page.waitForTimeout(400);
        }
      }
    }

    // Take screenshot of step
    await page.screenshot({ path: `/tmp/jobstreet_apply_step_${currentStepNum}.png` });

    // Look for Next / Submit button
    // Common Jobstreet button labels: "Lanjutkan", "Berikutnya", "Review", "Kirim lamaran", "Kirim"
    const actionButton = page.locator(
      'button:has-text("Kirim lamaran"), button:has-text("Kirim"), button:has-text("Lanjutkan"), button:has-text("Berikutnya"), button:has-text("Review"), button[data-automation="continue-button"], button[data-automation="submit-application"], button[type="submit"]'
    ).first();

    if (await actionButton.count() > 0 && await actionButton.isVisible()) {
      const btnText = await actionButton.innerText();
      console.log(`👉 Clicking Action Button: "${btnText}"...`);
      await actionButton.click();
      await page.waitForTimeout(6000);

      // Check if application is completed
      const body = await page.textContent('body');
      if (
        body.includes('Lamaran kamu telah terkirim') ||
        body.includes('Lamaran terkirim') ||
        body.includes('Application submitted') ||
        body.includes('Berhasil melamar') ||
        page.url().includes('success') ||
        page.url().includes('submitted')
      ) {
        console.log('🎉 SUCCESS: Application submitted successfully to Jobstreet!');
        await page.screenshot({ path: '/tmp/jobstreet_apply_confirmed_success.png' });
        break;
      }
    } else {
      console.log('No action button found, waiting 3s...');
      await page.waitForTimeout(3000);
    }
  }

  // ----------------------------------------------------
  // VERIFICATION: Check Applied Jobs Page
  // ----------------------------------------------------
  console.log('\n📊 Step 3: Navigating to https://id.jobstreet.com/id/my-activity/applied-jobs to verify...');
  await page.goto('https://id.jobstreet.com/id/my-activity/applied-jobs', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);

  const finalCards = await page.evaluate(() => {
    const articles = Array.from(document.querySelectorAll('article, div[data-automation="applied-job-card"], [class*="JobCard"], [data-card-type="JobCard"]'));
    return articles.map(a => a.innerText.trim()).filter(Boolean);
  });

  console.log(`Found ${finalCards.length} applied job cards on Jobstreet:`);
  console.log(JSON.stringify(finalCards.slice(0, 5), null, 2));

  await page.screenshot({ path: '/tmp/jobstreet_applied_jobs_verified.png' });
  console.log('📸 Verification screenshot saved to /tmp/jobstreet_applied_jobs_verified.png');

  await context.close();
}

applyRealBackendJob().catch(console.error);
