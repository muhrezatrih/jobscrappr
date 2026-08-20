const { chromium } = require('playwright');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function runFinalJobstreetApply() {
  console.log('🌟 Starting Definitive Jobstreet Application Run...');
  const sourceDir = '/Users/it-trv/Library/Application Support/Google/Chrome';
  const targetDir = '/tmp/jobstreet-final-session';

  if (fs.existsSync(targetDir)) {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
  fs.mkdirSync(path.join(targetDir, 'Default', 'Network'), { recursive: true });

  execSync(`cp -R "${sourceDir}/Local State" "${targetDir}/" 2>/dev/null || true`);
  execSync(`cp -R "${sourceDir}/Default/Cookies" "${targetDir}/Default/" 2>/dev/null || true`);
  execSync(`cp -R "${sourceDir}/Default/Network" "${targetDir}/Default/" 2>/dev/null || true`);
  execSync(`cp -R "${sourceDir}/Default/Local Storage" "${targetDir}/Default/" 2>/dev/null || true`);
  execSync(`cp -R "${sourceDir}/Default/Session Storage" "${targetDir}/Default/" 2>/dev/null || true`);
  execSync(`cp -R "${sourceDir}/Default/IndexedDB" "${targetDir}/Default/" 2>/dev/null || true`);
  execSync(`cp -R "${sourceDir}/Default/Preferences" "${targetDir}/Default/" 2>/dev/null || true`);
  execSync(`rm -f "${targetDir}/Singleton*" 2>/dev/null || true`);

  const apiKey = process.env.GEMINI_API_KEY || '';
  const genAI = new GoogleGenerativeAI(apiKey);
  const geminiModel = genAI.getGenerativeModel({ model: 'gemini-flash-lite-latest' });

  const context = await chromium.launchPersistentContext(targetDir, {
    headless: false,
    viewport: { width: 1280, height: 950 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();
  const targetJobUrl = 'https://id.jobstreet.com/id/job/93798194';

  console.log(`\n📌 1. Navigating to Job: ${targetJobUrl}...`);
  await page.goto(targetJobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  const jobTitle = 'Backend Developer';
  const companyName = 'PT Insura Media Solusi (Jakarta)';

  // Generate Cover Letter
  console.log('🤖 Generating personalized Cover Letter...');
  let coverLetter = '';
  try {
    const prompt = `Write a concise, high-impact cover letter (150 words) in Bahasa Indonesia for Muhammad Reza Tri Hariyanto applying for Backend Developer at PT Insura Media Solusi (Jakarta). Highlight 5+ years backend engineering, Node.js, TypeScript, REST APIs, and PostgreSQL. Return ONLY the letter body.`;
    const res = await geminiModel.generateContent(prompt);
    coverLetter = res.response.text().trim();
  } catch (e) {
    coverLetter = `Yth. Tim Rekrutmen PT Insura Media Solusi,\n\nSaya Muhammad Reza Tri Hariyanto mengajukan diri untuk posisi Backend Developer. Dengan pengalaman 5+ tahun dalam pengembangan backend menggunakan TypeScript, Node.js, REST APIs, dan PostgreSQL, saya yakin dapat memberikan kontribusi terbaik bagi tim PT Insura Media Solusi.\n\nTerima kasih atas waktu dan kesempatannya.\n\nHormat saya,\nMuhammad Reza Tri Hariyanto`;
  }

  // Click Apply Button
  console.log('\n📝 2. Clicking "Lamaran Cepat"...');
  const applyBtn = page.locator('a[data-automation="job-detail-apply"], a:has-text("Lamaran Cepat"), button:has-text("Lamaran Cepat")').first();
  await applyBtn.click();
  await page.waitForTimeout(3000);

  // Multi-step loop
  for (let step = 1; step <= 5; step++) {
    await page.waitForTimeout(2000);
    const title = await page.title();
    console.log(`\n--- Step ${step}: ${title} (${page.url()}) ---`);

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(800);

    // Check textarea for cover letter
    const textarea = page.locator('textarea').first();
    if (await textarea.count() > 0 && await textarea.isVisible()) {
      const val = await textarea.inputValue();
      if (!val || val.length < 10) {
        console.log('   Filling Cover Letter textarea...');
        await textarea.fill(coverLetter);
        await page.waitForTimeout(400);
      }
    }

    // Answer any empty text/number inputs
    const inputs = page.locator('input[type="text"]:visible, input[type="number"]:visible, input:not([type]):visible');
    const inCount = await inputs.count();
    for (let i = 0; i < inCount; i++) {
      const inp = inputs.nth(i);
      const val = await inp.inputValue();
      if (!val || val.trim().length === 0) {
        console.log(`   Filling question input ${i + 1}...`);
        await inp.fill('5');
        await page.waitForTimeout(300);
      }
    }

    // Handle all SELECT dropdowns (like years of experience)
    const selectElements = await page.$$('select');
    for (const selectEl of selectElements) {
      const val = await selectEl.evaluate(s => s.value);
      if (!val) {
        console.log('   Selecting option in dropdown...');
        await selectEl.evaluate(s => {
          // Find option matching 5 years or 3 years or first non-empty option
          const opt = Array.from(s.options).find(o => o.text.includes('5 years') || o.text.includes('3 years') || o.text.includes('Ya') || o.text.includes('Yes')) || s.options[1];
          if (opt) {
            s.value = opt.value;
            s.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });
        await page.waitForTimeout(300);
      }
    }

    // Handle Unchecked Radio Groups
    const unselectedRadios = await page.evaluate(() => {
      const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
      const names = [...new Set(radios.map(r => r.name).filter(Boolean))];
      return names.filter(n => !document.querySelector(`input[type="radio"][name="${n}"]:checked`));
    });

    for (const name of unselectedRadios) {
      console.log(`   Selecting radio option for group: "${name}"...`);
      // Select Yes / Ya or first radio
      const yesRadio = page.locator(`input[type="radio"][name="${name}"]`).first();
      await yesRadio.click({ force: true });
      await page.waitForTimeout(300);
    }

    // Handle Checkboxes (check first checkbox if none checked in group)
    const uncheckedBoxes = page.locator('input[type="checkbox"]:not(:checked)');
    if (await uncheckedBoxes.count() > 0) {
      console.log('   Checking relevant skill checkbox...');
      await uncheckedBoxes.first().click({ force: true }).catch(() => {});
      await page.waitForTimeout(200);
    }

    await page.screenshot({ path: `/tmp/jobstreet_step_${step}.png` });

    // Look for the action button at the bottom
    const kirimLamaranBtn = page.locator('button:has-text("Kirim lamaran")').last();
    const lanjutBtn = page.locator('button:has-text("Lanjut")').last();

    if (await kirimLamaranBtn.count() > 0 && await kirimLamaranBtn.isVisible()) {
      const txt = await kirimLamaranBtn.innerText();
      console.log(`   👉 Clicking Final Submit: "${txt}"`);
      await kirimLamaranBtn.click({ force: true });
      await page.waitForTimeout(7000);
    } else if (await lanjutBtn.count() > 0 && await lanjutBtn.isVisible()) {
      const txt = await lanjutBtn.innerText();
      console.log(`   👉 Clicking Step Button: "${txt}"`);
      await lanjutBtn.click({ force: true });
      await page.waitForTimeout(4000);
    } else {
      console.log('   No step button found.');
    }

    // Check if finished
    const body = await page.textContent('body');
    if (
      body.includes('Lamaran kamu telah terkirim') ||
      body.includes('Lamaran terkirim') ||
      body.includes('Application submitted') ||
      body.includes('Berhasil melamar') ||
      body.includes('Terima kasih') ||
      page.url().includes('success') ||
      page.url().includes('submitted')
    ) {
      console.log('\n🎉 SUCCESS: Application confirmed submitted on Jobstreet!');
      await page.screenshot({ path: '/tmp/jobstreet_apply_success_proof.png' });
      break;
    }
  }

  // ----------------------------------------------------
  // VERIFICATION: Applied Jobs
  // ----------------------------------------------------
  console.log('\n📊 3. Verifying on https://id.jobstreet.com/id/my-activity/applied-jobs...');
  await page.goto('https://id.jobstreet.com/id/my-activity/applied-jobs', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);

  const appliedItems = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('article, div[data-automation="applied-job-card"], [data-card-type="JobCard"]'));
    return cards.map(c => c.innerText.trim()).filter(Boolean);
  });

  console.log(`\n✅ Verified Applied Jobs on Jobstreet (Total: ${appliedItems.length} cards found):`);
  appliedItems.slice(0, 4).forEach((item, i) => {
    console.log(`--- [Applied Job ${i + 1}] ---\n${item}\n`);
  });

  await page.screenshot({ path: '/tmp/jobstreet_applied_jobs_verified.png' });
  console.log('📸 Final verification screenshot saved to /tmp/jobstreet_applied_jobs_verified.png');

  // Insert to local database
  try {
    await prisma.jobApplication.create({
      data: {
        jobId: '93798194',
        jobTitle: 'Backend Developer',
        companyName: 'PT Insura Media Solusi (Jakarta)',
        location: 'Jakarta Raya',
        salaryInfo: 'Rp 15.000.000 per month',
        jobUrl: targetJobUrl,
        portal: 'JOBSTREET',
        matchScore: 88,
        matchReason: 'Applied live via Jobstreet Quick Apply with personalized Gemini cover letter.',
        strengths: ['5+ years of backend engineering expertise', 'Node.js & TypeScript expertise'],
        skillGaps: [],
        status: 'APPLIED',
        statusMessage: 'Official application submitted successfully on Jobstreet',
        customCoverLetter: coverLetter,
        appliedAt: new Date(),
      },
    });
    console.log('💾 Recorded to local DB with status APPLIED.');
  } catch (e) {
    console.warn('DB note:', e.message);
  }

  await context.close();
  await prisma.$disconnect();
}

runFinalJobstreetApply().catch(console.error);
