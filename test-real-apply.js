const { chromium } = require('playwright');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runRealApply() {
  console.log('🔄 Syncing latest session from user Chrome profile...');
  const sourceDir = '/Users/it-trv/Library/Application Support/Google/Chrome';
  const targetDir = '/tmp/jobstreet-real-session';

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

  console.log('🚀 Launching Chromium with persistent session...');
  const context = await chromium.launchPersistentContext(targetDir, {
    headless: false,
    viewport: { width: 1280, height: 900 },
    args: ['--disable-blink-features=AutomationControlled'],
  });

  const page = context.pages()[0] || await context.newPage();

  // 1. Verify Applied Jobs before applying
  console.log('📊 Step 1: Checking current applied jobs at https://id.jobstreet.com/id/my-activity/applied-jobs...');
  await page.goto('https://id.jobstreet.com/id/my-activity/applied-jobs', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(4000);

  const initialText = await page.textContent('body');
  console.log('Initial applied jobs page content check:', initialText.includes('Aktivitas') ? 'AUTHENTICATED' : 'NOT AUTHENTICATED');

  // Count current applied jobs
  const initialCards = await page.locator('article, div[data-automation="applied-job-card"], h3').allInnerTexts();
  console.log('Initial applied cards count / text snippet:', initialCards.slice(0, 5));

  // 2. Search for a fresh backend job or navigate to our target job
  const targetJobUrl = 'https://id.jobstreet.com/id/job/94025255';
  console.log(`\n💼 Step 2: Navigating to Backend Developer Job Posting: ${targetJobUrl}...`);
  await page.goto(targetJobUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);

  const jobTitle = await page.textContent('h1[data-automation="job-detail-title"], h1');
  console.log('Job Title:', jobTitle?.trim());

  // Click Apply / Daftar
  console.log('\n📝 Step 3: Clicking Apply ("Daftar") button...');
  const applyButton = page.locator('a[data-automation="job-detail-apply"], a:has-text("Daftar"), button:has-text("Lamar")').first();
  await applyButton.click();
  await page.waitForTimeout(5000);

  console.log('Current URL after clicking apply:', page.url());

  // Inspect the multi-step application form / modal
  await page.screenshot({ path: '/tmp/jobstreet_apply_step1.png' });
  console.log('Screenshot of Step 1 saved to /tmp/jobstreet_apply_step1.png');

  // Let us check for common Jobstreet apply flow elements:
  // Step A: Resume selection
  // Step B: Cover letter input
  // Step C: Screening questions / answers
  // Step D: Continue / Submit button ("Lanjutkan", "Kirim lamaran", "Berikutnya")

  // Let's loop through the steps if it's a multi-step wizard:
  for (let step = 1; step <= 5; step++) {
    console.log(`\n🔍 Checking application form step ${step}...`);
    const currentStepUrl = page.url();
    console.log('Step URL:', currentStepUrl);

    // Check if there are radio buttons or checkboxes (e.g. for resume selection or screening questions)
    const radioInputs = page.locator('input[type="radio"]');
    const radioCount = await radioInputs.count();
    console.log(`Found ${radioCount} radio buttons on this step.`);
    if (radioCount > 0) {
      // If first radio is not checked, check it (usually standard resume)
      const isFirstChecked = await radioInputs.first().isChecked();
      if (!isFirstChecked) {
        console.log('Selecting first available radio option (e.g., Default Resume / Option)...');
        await radioInputs.first().click({ force: true });
        await page.waitForTimeout(1000);
      }
    }

    // Check for cover letter textarea or screening question inputs
    const textareas = page.locator('textarea');
    const textareaCount = await textareas.count();
    console.log(`Found ${textareaCount} textarea inputs.`);
    if (textareaCount > 0) {
      for (let i = 0; i < textareaCount; i++) {
        const val = await textareas.nth(i).inputValue();
        if (!val || val.trim().length === 0) {
          console.log(`Filling textarea ${i + 1} with candidate profile summary / cover letter...`);
          await textareas.nth(i).fill(
            `Kepada Tim Rekrutmen,\n\nSaya tertarik untuk melamar posisi Backend Developer. Saya memiliki pengalaman 5+ tahun dalam pengembangan backend menggunakan Node.js, TypeScript, REST APIs, dan PostgreSQL.\n\nBesar harapan saya untuk dapat berkontribusi di perusahaan ini.\n\nHormat saya,\nMuhammad Reza Tri Hariyanto`
          );
          await page.waitForTimeout(500);
        }
      }
    }

    // Check for standard text inputs (like years of experience, expected salary, notice period)
    const textInputs = page.locator('input[type="text"], input[type="number"]');
    const textInputCount = await textInputs.count();
    console.log(`Found ${textInputCount} text/number inputs.`);
    for (let i = 0; i < textInputCount; i++) {
      const val = await textInputs.nth(i).inputValue();
      const placeholder = (await textInputs.nth(i).getAttribute('placeholder')) || '';
      const name = (await textInputs.nth(i).getAttribute('name')) || '';
      console.log(`Input ${i + 1}: name="${name}", placeholder="${placeholder}", currentVal="${val}"`);
      if (!val || val.trim().length === 0) {
        // If it asks for years of experience or salary or notice period
        if (name.includes('salary') || placeholder.includes('gaji')) {
          await textInputs.nth(i).fill('15000000');
        } else if (name.includes('notice') || placeholder.includes('pemberitahuan')) {
          await textInputs.nth(i).fill('1 month');
        } else {
          await textInputs.nth(i).fill('5');
        }
        await page.waitForTimeout(400);
      }
    }

    // Check for select dropdowns
    const selects = page.locator('select');
    const selectCount = await selects.count();
    console.log(`Found ${selectCount} select dropdowns.`);
    for (let i = 0; i < selectCount; i++) {
      const selectedOption = await selects.nth(i).inputValue();
      if (!selectedOption) {
        // select option with index 1 (usually 'Yes' or first valid option)
        await selects.nth(i).selectOption({ index: 1 });
        await page.waitForTimeout(400);
      }
    }

    await page.screenshot({ path: `/tmp/jobstreet_apply_step_${step}_filled.png` });

    // Look for Action / Submit / Continue buttons
    const continueButtons = page.locator(
      'button:has-text("Lanjutkan"), button:has-text("Kirim lamaran"), button:has-text("Berikutnya"), button:has-text("Review"), button:has-text("Kirim"), button[data-automation="continue-button"], button[data-automation="submit-application"], button[type="submit"]'
    );
    const btnCount = await continueButtons.count();
    console.log(`Found ${btnCount} action / continue / submit buttons on step ${step}.`);

    if (btnCount > 0) {
      const btnText = await continueButtons.first().innerText();
      console.log(`Clicking button: "${btnText}"...`);
      await continueButtons.first().click();
      await page.waitForTimeout(5000);

      // Check if we reached success page or confirmation
      const body = await page.textContent('body');
      if (
        body.includes('Lamaran kamu telah terkirim') ||
        body.includes('Application submitted') ||
        body.includes('Berhasil melamar') ||
        body.includes('Terima kasih') ||
        page.url().includes('/application-submitted') ||
        page.url().includes('/success')
      ) {
        console.log('🎉 SUCCESS: Application successfully submitted on Jobstreet!');
        await page.screenshot({ path: '/tmp/jobstreet_application_success.png' });
        break;
      }
    } else {
      console.log('No more continue buttons found on this step.');
      break;
    }
  }

  // 4. Navigate to Applied Jobs to verify the job appeared!
  console.log('\n📊 Step 4: Verifying on https://id.jobstreet.com/id/my-activity/applied-jobs...');
  await page.goto('https://id.jobstreet.com/id/my-activity/applied-jobs', {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  await page.waitForTimeout(5000);

  const appliedPageText = await page.textContent('body');
  console.log('Final Applied Jobs Page URL:', page.url());

  const finalCards = await page.locator('article, div[data-automation="applied-job-card"], h3').allInnerTexts();
  console.log('Final Applied Jobs list preview:', JSON.stringify(finalCards.slice(0, 6), null, 2));

  await page.screenshot({ path: '/tmp/jobstreet_final_applied_jobs.png' });
  console.log('Final screenshot saved to /tmp/jobstreet_final_applied_jobs.png');

  await context.close();
}

runRealApply().catch(console.error);
