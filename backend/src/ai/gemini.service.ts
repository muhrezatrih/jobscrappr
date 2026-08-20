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
  salaryFit?: 'MEETS_TARGET' | 'REMOTE_MATCH' | 'UNDISCLOSED_ESTIMATED' | 'BELOW_TARGET';
  estimatedSalaryRange?: string;
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

  constructor(private config?: ConfigService) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.modelName = this.config?.get<string>('GEMINI_MODEL') || process.env.GEMINI_MODEL || 'gemini-flash-lite-latest';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.logger.log(`Initialized GeminiService with model: ${this.modelName}`);
  }

  private cleanJson(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
  }

  async extractResumeFromText(rawText: string): Promise<ExtractedProfile> {
    try {
      const model = this.genAI.getGenerativeModel({ model: this.modelName });
      const prompt = `
You are an expert HR and Executive Tech Recruiter.
Analyze the following raw resume text and extract all relevant candidate information into a strictly valid JSON object.

RAW RESUME TEXT:
${rawText}

OUTPUT FORMAT (JSON ONLY, NO MARKDOWN, NO EXPLANATION):
{
  "fullName": "Full Name",
  "email": "candidate@email.com",
  "phone": "08123456789",
  "location": "City, Country",
  "headline": "Professional Title / Headline",
  "summary": "Professional Summary (2-3 sentences)",
  "skills": ["Skill 1", "Skill 2", "Skill 3"],
  "experiences": [
    {
      "company": "Company Name",
      "title": "Role / Position",
      "duration": "Start - End Date (e.g. Jan 2022 - Present)",
      "location": "City / Remote",
      "description": "Overview of responsibilities",
      "achievements": ["Key achievement 1", "Key achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "University / College",
      "degree": "Bachelor of Science",
      "field": "Computer Science",
      "graduationYear": "2023"
    }
  ],
  "suggestedTargetRoles": ["Frontend Developer", "Fullstack Engineer", "Software Engineer"],
  "suggestedKeywords": ["React", "TypeScript", "Next.js", "Node.js"]
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonStr = this.cleanJson(response.text());
      return JSON.parse(jsonStr) as ExtractedProfile;
    } catch (error) {
      this.logger.error(`Error extracting resume with Gemini: ${error.message}`);
      // Fallback parser if API fails
      return {
        fullName: 'Candidate Profile',
        summary: rawText.slice(0, 300),
        skills: ['Software Engineering', 'Problem Solving'],
        experiences: [],
        education: [],
        suggestedTargetRoles: ['Software Developer'],
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
    preference: any,
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

CANDIDATE PREFERENCES & COMPENSATION RULES:
- Target Roles: ${JSON.stringify(preference?.targetRoles || [])}
- Target Locations: ${JSON.stringify(preference?.targetLocations || [])}
- Work Arrangement Preference: PREFERS REMOTE. Open to Hybrid/Onsite ONLY IF Salary >= 20,000,000 IDR (Rp 20M/month).

EVALUATION & SCORING RULES:
1. Work Arrangement & Salary Rules:
   - If role is REMOTE (100% remote or remote option): Reward high compatibility score (85-100%) and include "🌐 Remote Work Preferred" in strengths. Set workArrangement="REMOTE", salaryFit="REMOTE_MATCH".
   - If role is HYBRID or ONSITE:
     * If published salary is >= 20,000,000 IDR: Reward high score and include "💰 Meets Salary Target (>= 20M IDR)" in strengths. Set salaryFit="MEETS_TARGET".
     * If salary is UNDISCLOSED: Estimate based on company seniority/tier. If estimated >= 20M, score normally (75-90%) and add "✨ Estimated >= 20M (Verify in HR call)". Set salaryFit="UNDISCLOSED_ESTIMATED".
     * If published salary is < 20,000,000 IDR: Apply a 15-25 point score penalty and add "⚠️ Below 20M Target for Onsite/Hybrid" in skillGaps. Set salaryFit="BELOW_TARGET".
2. Technical Skills Fit:
   - Check matching languages, databases, and system design experience.
3. List 2-4 strong points of the candidate.
4. List 1-3 minor skill gaps or keywords if any.
5. Provide a crisp 2-sentence rationale in English.
6. Set shouldApply = true if matchScore >= ${preference?.matchThreshold || 70} AND (workArrangement == "REMOTE" OR salaryFit != "BELOW_TARGET").

OUTPUT FORMAT (JSON ONLY):
{
  "matchScore": 88,
  "matchReason": "Strong match for backend developer role with remote flexibility matching candidate technical stack.",
  "strengths": ["6+ years backend engineering expertise", "🌐 Remote Work Preferred"],
  "skillGaps": ["GCP Cloud deployment not highlighted"],
  "workArrangement": "REMOTE",
  "salaryFit": "REMOTE_MATCH",
  "estimatedSalaryRange": "Rp 25.000.000 - Rp 35.000.000",
  "shouldApply": true
}
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const jsonStr = this.cleanJson(response.text());
      return JSON.parse(jsonStr) as JobMatchResult;
    } catch (error) {
      this.logger.error(`Error evaluating job match: ${error.message}`);
      return {
        matchScore: 75,
        matchReason: 'Candidate demonstrates strong foundational skills matching the core requirements of this position.',
        strengths: ['Relevant core technical skills and engineering background'],
        skillGaps: [],
        shouldApply: true,
        workArrangement: 'REMOTE',
        salaryFit: 'REMOTE_MATCH'
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
