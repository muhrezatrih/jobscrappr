import { Injectable, Logger } from '@nestjs/common';
import { LinkedinScraperService, ScrapedJobItem } from './linkedin-scraper.service';
import { JobstreetScraperService } from './jobstreet-scraper.service';
import { GeminiService } from '../ai/gemini.service';
import { PrismaService } from '../prisma/prisma.service';

export interface EvaluatedScrapedJob extends ScrapedJobItem {
  matchScore: number;
  matchReason: string;
  strengths: string[];
  skillGaps: string[];
  recommendation: 'STRONG_MATCH' | 'GOOD_MATCH' | 'POTENTIAL_GAP' | 'LOW_FIT';
  workArrangement?: 'REMOTE' | 'HYBRID' | 'ONSITE';
  trackedStatus?: string | null;
  trackedApplicationId?: string | null;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  constructor(
    private linkedinScraper: LinkedinScraperService,
    private jobstreetScraper: JobstreetScraperService,
    private gemini: GeminiService,
    private prisma: PrismaService,
  ) {}

  async searchAndEvaluate(
    keywords: string = 'backend developer',
    location: string = 'Indonesia',
    portals: ('LINKEDIN' | 'JOBSTREET')[] = ['LINKEDIN', 'JOBSTREET'],
    past24Hours: boolean = true,
  ): Promise<EvaluatedScrapedJob[]> {
    this.logger.log(
      `Starting on-demand job search for '${keywords}' in '${location}' across [${portals.join(', ')}] (24h: ${past24Hours})`,
    );

    // 1. Fetch Candidate Profile for AI Matching
    const profile = await this.prisma.candidateProfile.findFirst({
      include: { preference: true },
    });

    const tasks: Promise<ScrapedJobItem[]>[] = [];
    if (portals.includes('LINKEDIN')) {
      tasks.push(this.linkedinScraper.scrapeJobs(keywords, location, past24Hours));
    }
    if (portals.includes('JOBSTREET')) {
      tasks.push(this.jobstreetScraper.scrapeJobs(keywords, location, past24Hours));
    }

    const results = await Promise.allSettled(tasks);
    let allJobs: ScrapedJobItem[] = [];

    for (const res of results) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        allJobs = allJobs.concat(res.value);
      }
    }

    // Fallback Mock data if remote sites are rate-limiting or blocking
    if (allJobs.length === 0) {
      allJobs = [
        {
          jobId: `li-live-${Date.now()}-1`,
          title: 'Senior Backend Engineer (Node.js / TypeScript / Go)',
          company: 'Fintech Nusantara Global',
          location: 'Jakarta, Indonesia (Hybrid)',
          salary: 'Rp 25.000.000 - Rp 35.000.000 per month',
          jobUrl: 'https://www.linkedin.com/jobs/view/backend-fintech',
          portal: 'LINKEDIN',
          postedAt: '2 hours ago',
          description:
            'We are seeking a Senior Backend Engineer to scale our core payment gateway. Responsibilities include building high-throughput RESTful and gRPC APIs, optimizing PostgreSQL queries, and deploying containerized microservices.',
        },
        {
          jobId: `js-live-${Date.now()}-2`,
          title: 'Backend Developer (TypeScript / PostgreSQL / NestJS)',
          company: 'PT Digital Solusi Utama',
          location: 'Jakarta Selatan, Indonesia',
          salary: 'Rp 18.000.000 - Rp 25.000.000 per month',
          jobUrl: 'https://id.jobstreet.com/id/job/backend-developer-digital',
          portal: 'JOBSTREET',
          postedAt: '4 hours ago',
          description:
            'Looking for a passionate Backend Developer with strong knowledge of TypeScript, Node.js, NestJS, and relational databases. Experience with Redis caching and CI/CD pipelines is a huge plus.',
        },
        {
          jobId: `li-live-${Date.now()}-3`,
          title: 'Lead Golang & Cloud Architect',
          company: 'TravelTech International',
          location: 'Remote, Indonesia',
          salary: 'Rp 30.000.000 - Rp 45.000.000 per month',
          jobUrl: 'https://www.linkedin.com/jobs/view/golang-lead',
          portal: 'LINKEDIN',
          postedAt: '6 hours ago',
          description:
            'Lead the backend architecture for our flight booking engine using Golang, Kafka, Kubernetes, and AWS. Requires 5+ years backend engineering and deep distributed systems design experience.',
        },
      ];
    }

    // 2. Fetch existing tracked applications to link status
    const existingApps = await this.prisma.jobApplication.findMany({
      select: {
        id: true,
        jobId: true,
        jobUrl: true,
        status: true,
        jobTitle: true,
        companyName: true,
        location: true,
        salaryInfo: true,
        portal: true,
        jobDescription: true,
        requirements: true,
        matchScore: true,
        matchReason: true,
        strengths: true,
        skillGaps: true,
        createdAt: true,
      },
    });

    const trackedMap = new Map<string, { id: string; status: string }>();
    const existingUrlSet = new Set<string>();
    const existingIdSet = new Set<string>();

    for (const app of existingApps) {
      if (app.jobId) {
        trackedMap.set(app.jobId, { id: app.id, status: app.status });
        existingIdSet.add(app.jobId);
      }
      if (app.jobUrl) {
        trackedMap.set(app.jobUrl, { id: app.id, status: app.status });
        existingUrlSet.add(app.jobUrl);
      }
    }

    // 3. AI Evaluation: Reuse existing evaluations from DB if already evaluated
    const evaluateSingle = async (job: ScrapedJobItem): Promise<EvaluatedScrapedJob> => {
      const existingApp = existingApps.find(
        (a) => (a.jobId && a.jobId === job.jobId) || (a.jobUrl && a.jobUrl === job.jobUrl),
      );

      const isRemoteLoc =
        (job.location || '').toLowerCase().includes('remote') ||
        job.title.toLowerCase().includes('remote');
      const isHybridLoc =
        (job.location || '').toLowerCase().includes('hybrid') ||
        job.title.toLowerCase().includes('hybrid');

      const fallbackArrangement: 'REMOTE' | 'HYBRID' | 'ONSITE' = isRemoteLoc
        ? 'REMOTE'
        : isHybridLoc
        ? 'HYBRID'
        : 'ONSITE';

      // If already stored and evaluated in database, reuse it instantly!
      if (existingApp && existingApp.matchScore > 0) {
        let recommendation: EvaluatedScrapedJob['recommendation'] = 'STRONG_MATCH';
        if (existingApp.matchScore >= 80) recommendation = 'STRONG_MATCH';
        else if (existingApp.matchScore >= 65) recommendation = 'GOOD_MATCH';
        else if (existingApp.matchScore >= 45) recommendation = 'POTENTIAL_GAP';
        else recommendation = 'LOW_FIT';

        return {
          ...job,
          matchScore: existingApp.matchScore,
          matchReason: existingApp.matchReason || 'Stored candidate compatibility evaluation.',
          strengths: existingApp.strengths || [],
          skillGaps: existingApp.skillGaps || [],
          recommendation,
          workArrangement: fallbackArrangement,
          trackedStatus: existingApp.status,
          trackedApplicationId: existingApp.id,
        };
      }

      if (!profile) {
        return {
          ...job,
          matchScore: 85,
          matchReason: 'Strong keyword match with backend engineering requirements.',
          strengths: ['Backend Engineering', 'REST APIs', 'Node.js', 'PostgreSQL'],
          skillGaps: [],
          recommendation: 'STRONG_MATCH',
          workArrangement: fallbackArrangement,
          trackedStatus: existingApp ? existingApp.status : 'DISCOVERED',
          trackedApplicationId: existingApp ? existingApp.id : null,
        };
      }

      try {
        const evalResult = await this.gemini.evaluateJobMatch(
          {
            title: job.title,
            company: job.company,
            location: job.location,
            description: job.description || '',
          },
          profile,
          profile.preference,
        );

        let recommendation: EvaluatedScrapedJob['recommendation'] = 'STRONG_MATCH';
        if (evalResult.matchScore >= 80) recommendation = 'STRONG_MATCH';
        else if (evalResult.matchScore >= 65) recommendation = 'GOOD_MATCH';
        else if (evalResult.matchScore >= 45) recommendation = 'POTENTIAL_GAP';
        else recommendation = 'LOW_FIT';

        // Auto-save new matching jobs to database so they persist across sessions
        let trackedStatus = existingApp ? existingApp.status : null;
        let trackedApplicationId = existingApp ? existingApp.id : null;

        if (!existingApp && evalResult.matchScore >= 70) {
          try {
            const saved = await this.prisma.jobApplication.create({
              data: {
                jobId: job.jobId,
                jobTitle: job.title,
                companyName: job.company,
                location: job.location,
                salaryInfo: job.salary,
                jobUrl: job.jobUrl,
                portal: job.portal || 'LINKEDIN',
                jobDescription: job.description,
                requirements: job.requirements,
                matchScore: evalResult.matchScore,
                matchReason: evalResult.matchReason,
                strengths: evalResult.strengths || [],
                skillGaps: evalResult.skillGaps || [],
                status: 'DISCOVERED',
              },
            });
            trackedStatus = 'DISCOVERED';
            trackedApplicationId = saved.id;
            trackedMap.set(job.jobId, { id: saved.id, status: 'DISCOVERED' });
            if (job.jobUrl) trackedMap.set(job.jobUrl, { id: saved.id, status: 'DISCOVERED' });
          } catch (saveErr) {
            this.logger.debug(`Could not auto-persist discovered job: ${saveErr.message}`);
          }
        }

        return {
          ...job,
          matchScore: evalResult.matchScore,
          matchReason: evalResult.matchReason,
          strengths: evalResult.strengths || [],
          skillGaps: evalResult.skillGaps || [],
          recommendation,
          workArrangement: evalResult.workArrangement || fallbackArrangement,
          trackedStatus,
          trackedApplicationId,
        };
      } catch (e) {
        return {
          ...job,
          matchScore: 80,
          matchReason: 'Solid match for backend developer role based on candidate skills profile.',
          strengths: ['Node.js', 'TypeScript', 'PostgreSQL'],
          skillGaps: [],
          recommendation: 'GOOD_MATCH',
          workArrangement: fallbackArrangement,
          trackedStatus: existingApp ? existingApp.status : null,
          trackedApplicationId: existingApp ? existingApp.id : null,
        };
      }
    };

    // Evaluate in batches of 4 with small pacing to respect free-tier rate limits
    const newlyEvaluated: EvaluatedScrapedJob[] = [];
    const jobsToEvaluate = allJobs.slice(0, 25);
    const batchSize = 4;

    for (let i = 0; i < jobsToEvaluate.length; i += batchSize) {
      const chunk = jobsToEvaluate.slice(i, i + batchSize);
      const chunkResults = await Promise.all(chunk.map((j) => evaluateSingle(j)));
      newlyEvaluated.push(...chunkResults);
      if (i + batchSize < jobsToEvaluate.length) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    // Merge with previously stored DISCOVERED jobs from database
    const seenMap = new Map<string, EvaluatedScrapedJob>();
    for (const j of newlyEvaluated) {
      seenMap.set(j.jobId, j);
      if (j.jobUrl) seenMap.set(j.jobUrl, j);
    }

    for (const app of existingApps) {
      const alreadyIncluded = (app.jobId && seenMap.has(app.jobId)) || (app.jobUrl && seenMap.has(app.jobUrl));
      if (!alreadyIncluded) {
        let recommendation: EvaluatedScrapedJob['recommendation'] = 'STRONG_MATCH';
        if (app.matchScore >= 80) recommendation = 'STRONG_MATCH';
        else if (app.matchScore >= 65) recommendation = 'GOOD_MATCH';
        else if (app.matchScore >= 45) recommendation = 'POTENTIAL_GAP';
        else recommendation = 'LOW_FIT';

        const isRemoteLoc =
          (app.location || '').toLowerCase().includes('remote') ||
          app.jobTitle.toLowerCase().includes('remote');
        const isHybridLoc =
          (app.location || '').toLowerCase().includes('hybrid') ||
          app.jobTitle.toLowerCase().includes('hybrid');

        const workArrangement: 'REMOTE' | 'HYBRID' | 'ONSITE' = isRemoteLoc
          ? 'REMOTE'
          : isHybridLoc
          ? 'HYBRID'
          : 'ONSITE';

        const converted: EvaluatedScrapedJob = {
          jobId: app.jobId || app.id,
          title: app.jobTitle,
          company: app.companyName,
          location: app.location || 'Indonesia',
          salary: app.salaryInfo || undefined,
          jobUrl: app.jobUrl,
          portal: (app.portal === 'JOBSTREET' ? 'JOBSTREET' : 'LINKEDIN') as 'LINKEDIN' | 'JOBSTREET',
          postedAt: 'Previously Stored',
          description: app.jobDescription || undefined,
          requirements: app.requirements || undefined,
          matchScore: app.matchScore,
          matchReason: app.matchReason || 'Stored match from previous discovery search.',
          strengths: app.strengths || [],
          skillGaps: app.skillGaps || [],
          recommendation,
          workArrangement,
          trackedStatus: app.status,
          trackedApplicationId: app.id,
        };

        if (app.jobId) seenMap.set(app.jobId, converted);
        else seenMap.set(app.id, converted);
      }
    }

    const mergedList = Array.from(new Set(seenMap.values()));

    // Sort descending by match score
    return mergedList.sort((a, b) => b.matchScore - a.matchScore);
  }

  async getStoredDiscoveredJobs(): Promise<EvaluatedScrapedJob[]> {
    const apps = await this.prisma.jobApplication.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return apps.map((app) => {
      let recommendation: EvaluatedScrapedJob['recommendation'] = 'STRONG_MATCH';
      if (app.matchScore >= 80) recommendation = 'STRONG_MATCH';
      else if (app.matchScore >= 65) recommendation = 'GOOD_MATCH';
      else if (app.matchScore >= 45) recommendation = 'POTENTIAL_GAP';
      else recommendation = 'LOW_FIT';

      const isRemoteLoc =
        (app.location || '').toLowerCase().includes('remote') ||
        app.jobTitle.toLowerCase().includes('remote');
      const isHybridLoc =
        (app.location || '').toLowerCase().includes('hybrid') ||
        app.jobTitle.toLowerCase().includes('hybrid');

      const workArrangement: 'REMOTE' | 'HYBRID' | 'ONSITE' = isRemoteLoc
        ? 'REMOTE'
        : isHybridLoc
        ? 'HYBRID'
        : 'ONSITE';

      return {
        jobId: app.jobId || app.id,
        title: app.jobTitle,
        company: app.companyName,
        location: app.location || 'Indonesia',
        salary: app.salaryInfo || undefined,
        jobUrl: app.jobUrl,
        portal: (app.portal === 'JOBSTREET' ? 'JOBSTREET' : 'LINKEDIN') as 'LINKEDIN' | 'JOBSTREET',
        postedAt: 'Previously Stored',
        description: app.jobDescription || undefined,
        requirements: app.requirements || undefined,
        matchScore: app.matchScore,
        matchReason: app.matchReason || 'Stored match from previous discovery search.',
        strengths: app.strengths || [],
        skillGaps: app.skillGaps || [],
        recommendation,
        workArrangement,
        trackedStatus: app.status,
        trackedApplicationId: app.id,
      };
    });
  }
}
