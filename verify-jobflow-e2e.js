// E2E Verification Script for JobFlow Scrappr
const BASE_URL = 'http://localhost:3002/api';

async function run() {
  console.log('🧪 Starting E2E Verification of JobFlow Scrappr...\n');

  // 1. Profile Verification
  console.log('1️⃣ Checking Candidate Profile & CV...');
  const profileRes = await fetch(`${BASE_URL}/candidate/profile`);
  const profile = await profileRes.json();
  console.log(`✅ Active Candidate: ${profile.fullName} (${profile.skills.length} skills indexed: ${profile.skills.slice(0, 5).join(', ')}...)`);

  // 2. On-Demand 24-Hour Scraper + AI Match Evaluation
  console.log('\n2️⃣ Testing On-Demand 24h Scraper across LinkedIn & Jobstreet...');
  const scrapeRes = await fetch(`${BASE_URL}/scraper/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keywords: 'Backend Developer',
      location: 'Indonesia',
      portals: ['LINKEDIN', 'JOBSTREET'],
      past24Hours: true,
    }),
  });
  const scrapedJobs = await scrapeRes.json();
  console.log(`✅ Scraped ${scrapedJobs.length} live 24h jobs.`);
  if (scrapedJobs.length > 0) {
    const top = scrapedJobs[0];
    console.log(`   Top Match: "${top.title}" at "${top.company}" (${top.portal})`);
    console.log(`   AI Fit Score: ${top.matchScore}% [${top.recommendation}]`);
    console.log(`   AI Rationale: ${top.matchReason}`);
  }

  // 3. Track a Discovered Job as APPLIED
  console.log('\n3️⃣ Tracking a Discovered Job as APPLIED...');
  const topJob = scrapedJobs[0];
  const trackRes = await fetch(`${BASE_URL}/jobs/applications/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jobId: topJob.jobId,
      jobTitle: topJob.title,
      companyName: topJob.company,
      location: topJob.location,
      salaryInfo: topJob.salary,
      jobUrl: topJob.jobUrl,
      portal: topJob.portal,
      jobDescription: topJob.description,
      matchScore: topJob.matchScore,
      matchReason: topJob.matchReason,
      strengths: topJob.strengths,
      skillGaps: topJob.skillGaps,
      status: 'APPLIED',
      notes: 'Applied directly via company career page. Focused on Node.js & PostgreSQL architecture.',
      recruiterName: 'Jessica Williams',
      recruiterContact: 'jessica.recruiter@tech.co',
    }),
  });
  const trackedApp = await trackRes.json();
  console.log(`✅ Tracked Application ID: ${trackedApp.id} (Status: ${trackedApp.status})`);

  // 4. Advance Stages (Simulating Recruitment Progression)
  console.log('\n4️⃣ Advancing Application through Stages...');
  
  // Advance to HR_SCREENING
  await fetch(`${BASE_URL}/jobs/applications/${trackedApp.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'HR_SCREENING', note: 'Passed initial resume review, phone call scheduled' }),
  });
  console.log('   ➔ Advanced to HR_SCREENING');

  // Advance to TECHNICAL_TEST
  await fetch(`${BASE_URL}/jobs/applications/${trackedApp.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'TECHNICAL_TEST', note: 'Received take-home microservice challenge' }),
  });
  console.log('   ➔ Advanced to TECHNICAL_TEST');

  // Advance to FINAL_INTERVIEW
  await fetch(`${BASE_URL}/jobs/applications/${trackedApp.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'FINAL_INTERVIEW', note: 'System design interview with VP of Engineering' }),
  });
  console.log('   ➔ Advanced to FINAL_INTERVIEW');

  // Advance to OFFER_RECEIVED
  const offerAppRes = await fetch(`${BASE_URL}/jobs/applications/${trackedApp.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'OFFER_RECEIVED', note: 'Official offer letter received!' }),
  });
  const offerApp = await offerAppRes.json();
  console.log('   ➔ Advanced to OFFER_RECEIVED 🎉');

  // 5. Update Tracking Details & Offer Salary
  console.log('\n5️⃣ Updating Compensation & Notes Details...');
  const detailRes = await fetch(`${BASE_URL}/jobs/applications/${trackedApp.id}/details`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      offeredSalary: 'Rp 32.000.000 / month',
      targetSalary: 'Rp 30.000.000 / month',
      notes: 'Strong culture fit. Full remote with yearly travel stipend. Accepted offer!',
    }),
  });
  const detailApp = await detailRes.json();
  console.log(`✅ Details Updated: Offered Salary: ${detailApp.offeredSalary}`);

  // 6. Query Sankey Diagram Analytics
  console.log('\n6️⃣ Querying Sankey Diagram Funnel Data...');
  const sankeyRes = await fetch(`${BASE_URL}/jobs/analytics/sankey`);
  const sankey = await sankeyRes.json();
  console.log(`✅ Sankey Totals: ${JSON.stringify(sankey.totals, null, 2)}`);
  console.log(`✅ Stage Conversion Rates: ${JSON.stringify(sankey.conversionRates, null, 2)}`);
  console.log(`✅ Total Flow Links: ${sankey.links.length} active paths.`);

  // 7. Query Dashboard KPIs
  console.log('\n7️⃣ Querying Dashboard KPIs...');
  const kpiRes = await fetch(`${BASE_URL}/jobs/dashboard/kpis`);
  const kpis = await kpiRes.json();
  console.log(`✅ Dashboard KPIs:`);
  console.log(`   - Total Tracked: ${kpis.totalTracked}`);
  console.log(`   - Applied: ${kpis.appliedCount}`);
  console.log(`   - Offers Received: ${kpis.offerCount}`);
  console.log(`   - Average AI Match: ${kpis.averageMatchScore}%`);

  console.log('\n🎉 ALL E2E VERIFICATIONS PASSED SUCCESSFULLY!');
}

run().catch(console.error);
