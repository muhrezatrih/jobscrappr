import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ExtractedProfile {
  fullName: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  summary?: string;
  skills: string[];
  experiences: Array<{
    company: string;
    title: string;
    duration?: string;
    location?: string;
    description?: string;
    achievements?: string[];
  }>;
  education: Array<{
    institution: string;
    degree?: string;
    field?: string;
    graduationYear?: string;
  }>;
  suggestedTargetRoles?: string[];
  suggestedKeywords?: string[];
}

export interface JobMatchResult {
  matchScore: number;
  matchReason: string;
  strengths: string[];
  skillGaps: string[];
  shouldApply: boolean;
  workArrangement?: 'REMOTE' | 'HYBRID' | 'ONSITE';
}

export interface ScreeningAnswer {
  question: string;
  answer: string;
  reasoning?: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private modelName = 'gemini-flash-lite-latest';

  constructor(private configService?: ConfigService) {
    const apiKey =
      this.configService?.get<string>('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY environment variable is not configured. AI functions will use fallback logic.',
      );
    } else {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log(`Initialized GeminiService with model: ${this.modelName}`);
    }
  }

  private cleanJson(text: string): string {
    return text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
  }

  async extractResumeFromText(rawText: string): Promise<ExtractedProfile> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const prompt = `
You are an expert HR and Talent Acquisition AI analyzing a candidate resume.
Parse and extract the following candidate details into a clean JSON structure in English:

Resume Text:
${rawText}

OUTPUT FORMAT (JSON ONLY):
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "headline": "string (e.g. Senior Fullstack Engineer)",
  "summary": "string (concise professional summary)",
  "skills": ["string", "string"],
  "experiences": [
    {
      "company": "string",
      "title": "string",
      "duration": "string",
      "location": "string",
      "description": "string",
      "achievements": ["string"]
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "graduationYear": "string"
    }
  ],
  "suggestedTargetRoles": ["string"],
  "suggestedKeywords": ["string"]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonStr = this.cleanJson(response.text());
      return JSON.parse(jsonStr) as ExtractedProfile;
    } catch (error) {
      this.logger.error(`Error extracting resume with Gemini: ${error.message}`);
      return {
        fullName: 'Candidate',
        skills: ['TypeScript', 'Node.js', 'React', 'PostgreSQL', 'REST API'],
        experiences: [],
        education: [],
        suggestedTargetRoles: ['Software Engineer', 'Backend Developer', 'Frontend Developer'],
      };
    }
  }

  async evaluateJobMatch(
    job: {
      title: string;
      company: string;
      location?: string;
      description: string;
      requirements?: string;
    },
    candidate: any,
    preference?: any,
  ): Promise<JobMatchResult> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const prompt = `
You are an AI Job Matching Assistant evaluating a candidate's compatibility for an engineering job vacancy.

JOB VACANCY:
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'N/A'}
Description & Requirements:
${job.description}
${job.requirements || ''}

CANDIDATE PROFILE:
Name: ${candidate.fullName}
Headline: ${candidate.headline || ''}
Summary: ${candidate.summary || ''}
Skills: ${JSON.stringify(candidate.skills || [])}
Experiences: ${JSON.stringify(candidate.experiences || [])}

CANDIDATE PREFERENCES:
- Target Roles: ${JSON.stringify(preference?.targetRoles || [])}
- Target Locations: ${JSON.stringify(preference?.targetLocations || [])}
- Work Arrangement Preference: Prefers Remote, open to Hybrid/Onsite.

EVALUATION & SCORING RULES:
1. Work Arrangement Classification (STRICT):
   - Examine title, location, and description carefully:
     * Set workArrangement="REMOTE" ONLY IF the job explicitly mentions 100% remote, remote work, WFH, or location is explicitly "Remote". Include "🌐 Remote Work Preferred" in strengths.
     * Set workArrangement="HYBRID" IF the job mentions hybrid or partial office / WFH.
     * Set workArrangement="ONSITE" IF the job specifies "On-site", "Onsite", "WFO", or has a physical city office location without explicit remote option. Do NOT classify physical office roles as REMOTE!
2. Technical Skills Fit:
   - Check matching languages (Golang, PHP, Node.js, TypeScript), databases (PostgreSQL, MySQL, Redis), and system design experience.
3. Calculate Match Score (0-100) based purely on skill alignment, seniority, and technical qualification.
4. List 2-4 strong points of the candidate.
5. List 1-3 minor skill gaps or keywords if any.
6. Provide a crisp 2-sentence rationale in English.
7. Set shouldApply = true if matchScore >= ${preference?.matchThreshold || 70}.

OUTPUT FORMAT (JSON ONLY):
{
  "matchScore": 88,
  "matchReason": "Strong match for backend developer role matching candidate technical stack in Golang and PostgreSQL.",
  "strengths": ["6+ years backend engineering expertise", "Experience with scalable microservices"],
  "skillGaps": ["GCP Cloud deployment not highlighted"],
  "workArrangement": "ONSITE",
  "shouldApply": true
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonStr = this.cleanJson(response.text());
      return JSON.parse(jsonStr) as JobMatchResult;
    } catch (error) {
      this.logger.error(`Error evaluating job match: ${error.message}`);
      const isRemoteLoc =
        (job.location || '').toLowerCase().includes('remote') ||
        job.title.toLowerCase().includes('remote');
      const isHybridLoc =
        (job.location || '').toLowerCase().includes('hybrid') ||
        job.title.toLowerCase().includes('hybrid');

      const workArrangement: 'REMOTE' | 'HYBRID' | 'ONSITE' = isRemoteLoc
        ? 'REMOTE'
        : isHybridLoc
        ? 'HYBRID'
        : 'ONSITE';

      return {
        matchScore: 80,
        matchReason: 'Candidate demonstrates strong backend skills and experience relevant to this role.',
        strengths: ['Relevant backend engineering background'],
        skillGaps: [],
        workArrangement,
        shouldApply: true,
      };
    }
  }

  async generateCoverLetter(
    job: { title: string; company: string; description: string },
    candidate: any,
  ): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const prompt = `
Write an engaging, professional, and personalized Cover Letter for the following job application in English.
The letter must be concise (200-280 words), authentic, confident, and directly highlight relevant accomplishments from the candidate's profile that address the job's core requirements.

JOB POSTING:
Position: ${job.title}
Company: ${job.company}
Description: ${job.description}

CANDIDATE:
Name: ${candidate.fullName}
Skills: ${JSON.stringify(candidate.skills || [])}
Experiences: ${JSON.stringify(candidate.experiences || [])}

OUTPUT: Return ONLY the final text of the Cover Letter. Do not include extra placeholders or brackets like [Date] or [Address].
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      this.logger.error(`Error generating cover letter: ${error.message}`);
      return `Dear Hiring Team at ${job.company},\n\nI am writing to express my strong interest in the ${job.title} position. With my background and hands-on experience in modern full-stack development, I am confident in my ability to deliver immediate value to ${job.company}.\n\nThank you for your time and consideration.\n\nSincerely,\n${candidate.fullName}`;
    }
  }

  async answerScreeningQuestions(
    questions: string[],
    job: { title: string; company: string },
    candidate: any,
  ): Promise<ScreeningAnswer[]> {
    if (!questions || questions.length === 0) return [];
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const prompt = `
You are helping a candidate answer the following job screening questions on Jobstreet.
Answer each question truthfully, professionally, and concisely based on the candidate profile.

QUESTIONS:
${JSON.stringify(questions, null, 2)}

JOB:
Position: ${job.title}
Company: ${job.company}

CANDIDATE PROFILE:
${JSON.stringify(candidate, null, 2)}

OUTPUT FORMAT (JSON ONLY):
[
  {
    "question": "pertanyaan asli",
    "answer": "jawaban ringkas dan profesional",
    "reasoning": "alasan singkat jawaban ini dipilih"
  }
]
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonStr = this.cleanJson(response.text());
      return JSON.parse(jsonStr) as ScreeningAnswer[];
    } catch (error) {
      this.logger.error(`Error answering screening questions: ${error.message}`);
      return questions.map((q) => ({
        question: q,
        answer: 'Bersedia dan memiliki kualifikasi yang relevan sesuai profil.',
        reasoning: 'Jawaban standar profesional',
      }));
    }
  }
}
