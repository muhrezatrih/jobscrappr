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
  status: 'QUEUED' | 'EVALUATING' | 'APPLIED' | 'SKIPPED' | 'FAILED' | 'SIMULATED';
  statusMessage?: string;
  customCoverLetter?: string;
  screeningAnswers?: Array<{ question: string; answer: string; reasoning?: string }>;
  appliedAt?: string;
  createdAt: string;
}

export interface DashboardKPIs {
  totalApplications: number;
  todayApplications: number;
  appliedCount: number;
  simulatedCount: number;
  skippedCount: number;
  failedCount: number;
  averageMatchScore: number;
  recentApplications: JobApplication[];
}

export interface WorkerStatusResponse {
  status: 'IDLE' | 'RUNNING' | 'PAUSED' | 'STOPPED';
  progress: {
    totalEvaluated: number;
    appliedToday: number;
    skipped: number;
    failed: number;
    currentJob: string;
  };
}

export const api = {
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
    if (!res.ok) throw new Error('Failed to upload and extract resume');
    return res.json();
  },

  // Preferences
  async getPreferences(): Promise<SearchPreference> {
    const res = await fetch(`${API_BASE}/candidate/preferences`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load preferences');
    return res.json();
  },

  async updatePreferences(data: Partial<SearchPreference>): Promise<SearchPreference> {
    const res = await fetch(`${API_BASE}/candidate/preferences`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to update preferences');
    return res.json();
  },

  // Automation Worker
  async getWorkerStatus(): Promise<WorkerStatusResponse> {
    const res = await fetch(`${API_BASE}/automation/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load worker status');
    return res.json();
  },

  async startWorker(dryRun?: boolean): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/automation/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dryRun }),
    });
    return res.json();
  },

  async pauseWorker(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/automation/pause`, { method: 'POST' });
    return res.json();
  },

  async resumeWorker(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/automation/resume`, { method: 'POST' });
    return res.json();
  },

  async stopWorker(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/automation/stop`, { method: 'POST' });
    return res.json();
  },

  async runSingleJobTest(jobTitle?: string, companyName?: string) {
    const res = await fetch(`${API_BASE}/automation/test-single`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobTitle, companyName }),
    });
    if (!res.ok) throw new Error('Failed to execute single test match');
    return res.json();
  },

  // Jobs & Applications
  async getDashboardKPIs(): Promise<DashboardKPIs> {
    const res = await fetch(`${API_BASE}/jobs/dashboard/kpis`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load dashboard KPIs');
    return res.json();
  },

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

  async deleteApplication(id: string) {
    const res = await fetch(`${API_BASE}/jobs/applications/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Logs
  async getLogs(limit = 100, level?: string) {
    const query = new URLSearchParams();
    query.set('limit', limit.toString());
    if (level) query.set('level', level);
    const res = await fetch(`${API_BASE}/logs?${query.toString()}`, { cache: 'no-store' });
    return res.json();
  },

  async clearLogs() {
    const res = await fetch(`${API_BASE}/logs`, { method: 'DELETE' });
    return res.json();
  },
};
