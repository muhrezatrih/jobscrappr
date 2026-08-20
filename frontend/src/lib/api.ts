const API_BASE = '/api';

export interface CandidateProfile {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  skills: string[];
  experiences: any[];
  education: any[];
  resumeFileName?: string;
  preference?: SearchPreference;
}

export interface SearchPreference {
  id?: string;
  targetRoles: string[];
  targetLocations: string[];
  workTypes: string[];
  minSalary?: number;
  maxSalary?: number;
  matchThreshold: number;
  blacklistedCompanies: string[];
  blacklistedKeywords: string[];
  maxDailyApplications: number;
  dryRunMode: boolean;
  delayBetweenAppsMin: number;
  delayBetweenAppsMax: number;
  jobstreetEmail?: string;
  jobstreetPassword?: string;
  jobstreetCookies?: string;
}

export type ApplicationStage =
  | 'DISCOVERED'
  | 'SKIPPED'
  | 'APPLIED'
  | 'HR_SCREENING'
  | 'TECHNICAL_TEST'
  | 'FINAL_INTERVIEW'
  | 'OFFER_RECEIVED'
  | 'OFFER_ACCEPTED'
  | 'OFFER_DECLINED'
  | 'REJECTED'
  | 'GHOSTED';

export interface StageHistoryItem {
  id: string;
  applicationId: string;
  fromStatus?: string | null;
  toStatus: string;
  note?: string | null;
  changedAt: string;
}

export interface JobApplication {
  id: string;
  jobId?: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  location?: string;
  salaryInfo?: string;
  jobUrl: string;
  portal: string;
  jobDescription?: string;
  requirements?: string;
  matchScore: number;
  matchReason?: string;
  strengths: string[];
  skillGaps: string[];
  status: ApplicationStage;
  statusMessage?: string;
  recruiterName?: string;
  recruiterContact?: string;
  offeredSalary?: string;
  targetSalary?: string;
  notes?: string;
  interviewDate?: string;
  nextFollowUpDate?: string;
  postedAt?: string;
  customCoverLetter?: string;
  screeningAnswers?: Array<{ question: string; answer: string; reasoning?: string }>;
  stageHistory?: StageHistoryItem[];
  appliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluatedScrapedJob {
  jobId: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  jobUrl: string;
  portal: 'LINKEDIN' | 'JOBSTREET';
  postedAt?: string;
  description?: string;
  requirements?: string;
  matchScore: number;
  matchReason: string;
  strengths: string[];
  skillGaps: string[];
  recommendation: 'STRONG_MATCH' | 'GOOD_MATCH' | 'POTENTIAL_GAP' | 'LOW_FIT';
  trackedStatus?: string | null;
  trackedApplicationId?: string | null;
}

export interface SankeyNode {
  id: string;
  label: string;
  color: string;
  column: number;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface SankeyAnalyticsResponse {
  nodes: SankeyNode[];
  links: SankeyLink[];
  totals: {
    applied: number;
    firstInterviews: number;
    secondInterviews: number;
    offers: number;
    accepted: number;
    declined: number;
    rejected: number;
    noReply: number;
    dropped: number;
    noOffer: number;
  };
  conversionRates: {
    appliedToScreening: number;
    screeningTo2nd: number;
    secondToOffer: number;
    overallConversionRate: number;
  };
}

export interface DashboardKPIs {
  totalTracked: number;
  discoveredCount: number;
  appliedCount: number;
  screeningCount: number;
  technicalCount: number;
  finalCount: number;
  activeInterviews: number;
  offerCount: number;
  rejectedCount: number;
  ghostedCount: number;
  skippedCount: number;
  averageMatchScore: number;
  upcomingInterviews: JobApplication[];
  recentApplications: JobApplication[];
}

export const api = {
  // Scraper & Discovery
  async searchScraper(params: {
    keywords?: string;
    location?: string;
    portals?: ('LINKEDIN' | 'JOBSTREET')[];
    past24Hours?: boolean;
  }): Promise<EvaluatedScrapedJob[]> {
    const res = await fetch(`${API_BASE}/scraper/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) throw new Error('Failed to scrape jobs from portals');
    return res.json();
  },

  // Sankey Funnel Analytics
  async getSankeyAnalytics(): Promise<SankeyAnalyticsResponse> {
    const res = await fetch(`${API_BASE}/jobs/analytics/sankey`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load Sankey analytics');
    return res.json();
  },

  // Candidate Profile & CV
  async getProfile(): Promise<CandidateProfile> {
    const res = await fetch(`${API_BASE}/candidate/profile`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load candidate profile');
    return res.json();
  },

  async updateProfile(data: Partial<CandidateProfile>): Promise<CandidateProfile> {
    const res = await fetch(`${API_BASE}/candidate/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update profile');
    return res.json();
  },

  async uploadResume(file: File): Promise<CandidateProfile> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/candidate/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to upload and extract CV');
    return res.json();
  },

  async getPreferences(): Promise<SearchPreference> {
    const res = await fetch(`${API_BASE}/candidate/preferences`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load search preferences');
    return res.json();
  },

  async updatePreferences(data: Partial<SearchPreference>): Promise<SearchPreference> {
    const res = await fetch(`${API_BASE}/candidate/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to save search preferences');
    return res.json();
  },

  async getLogs(limit: number = 200): Promise<any[]> {
    const res = await fetch(`${API_BASE}/logs?limit=${limit}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load logs');
    return res.json();
  },

  async clearLogs(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/logs`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to clear logs');
    return res.json();
  },

  // Applications & Pipeline Management
  async getApplications(params?: {
    search?: string;
    status?: string;
    portal?: string;
    minScore?: string;
    page?: number;
    limit?: number;
  }): Promise<{ total: number; page: number; totalPages: number; items: JobApplication[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.status) query.set('status', params.status);
    if (params?.portal) query.set('portal', params.portal);
    if (params?.minScore) query.set('minScore', params.minScore);
    if (params?.page) query.set('page', params.page.toString());
    if (params?.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/jobs/applications?${query.toString()}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load applications');
    return res.json();
  },

  async getApplicationById(id: string): Promise<JobApplication> {
    const res = await fetch(`${API_BASE}/jobs/applications/${id}`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load application details');
    return res.json();
  },

  async trackJob(data: Partial<JobApplication>): Promise<JobApplication> {
    const res = await fetch(`${API_BASE}/jobs/applications/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to track job application');
    return res.json();
  },

  async updateStatus(id: string, status: string, note?: string): Promise<JobApplication> {
    const res = await fetch(`${API_BASE}/jobs/applications/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note }),
    });
    if (!res.ok) throw new Error('Failed to update application status');
    return res.json();
  },

  async updateDetails(
    id: string,
    details: {
      notes?: string;
      recruiterName?: string;
      recruiterContact?: string;
      offeredSalary?: string;
      targetSalary?: string;
      interviewDate?: string | null;
      nextFollowUpDate?: string | null;
    },
  ): Promise<JobApplication> {
    const res = await fetch(`${API_BASE}/jobs/applications/${id}/details`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(details),
    });
    if (!res.ok) throw new Error('Failed to update application details');
    return res.json();
  },

  async deleteApplication(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/jobs/applications/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete application');
    return res.json();
  },

  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const res = await fetch(`${API_BASE}/jobs/dashboard/kpis`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load dashboard KPIs');
    return res.json();
  },
};
