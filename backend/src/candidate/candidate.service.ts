import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GeminiService } from '../ai/gemini.service';
import { LogsService } from '../logs/logs.service';
import * as pdfParse from 'pdf-parse';

@Injectable()
export class CandidateService {
  private readonly logger = new Logger(CandidateService.name);

  constructor(
    private prisma: PrismaService,
    private gemini: GeminiService,
    private logs: LogsService,
  ) {}

  async processResumeUpload(file: Express.Multer.File) {
    await this.logs.log({
      level: 'INFO',
      action: 'RESUME_UPLOAD',
      message: `Menerima file resume: ${file.originalname} (${(file.size / 1024).toFixed(1)} KB)`,
    });

    let rawText = '';
    try {
      if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf')) {
        const parsed = await (pdfParse as any)(file.buffer);
        rawText = parsed.text;
      } else {
        rawText = file.buffer.toString('utf-8');
      }
    } catch (e) {
      this.logger.warn(`PDF parse fallback: ${e.message}`);
      rawText = file.buffer.toString('utf-8');
    }

    if (!rawText || rawText.trim().length === 0) {
      rawText = 'Resume Content from ' + file.originalname;
    }

    await this.logs.log({
      level: 'INFO',
      action: 'AI_EXTRACTION',
      message: 'Mengekstrak informasi kualifikasi dari CV menggunakan Gemini 2.5 Flash...',
    });

    const extracted = await this.gemini.extractResumeFromText(rawText);

    // Upsert Candidate Profile
    const existing = await this.prisma.candidateProfile.findFirst({
      include: { preference: true },
    });

    let profile;
    if (existing) {
      profile = await this.prisma.candidateProfile.update({
        where: { id: existing.id },
        data: {
          fullName: extracted.fullName || existing.fullName,
          email: extracted.email || existing.email,
          phone: extracted.phone || existing.phone,
          location: extracted.location || existing.location,
          headline: extracted.headline || existing.headline,
          summary: extracted.summary || existing.summary,
          skills: extracted.skills || existing.skills,
          experiences: extracted.experiences as any,
          education: extracted.education as any,
          rawResumeText: rawText,
          resumeFileName: file.originalname,
        },
        include: { preference: true },
      });
    } else {
      profile = await this.prisma.candidateProfile.create({
        data: {
          fullName: extracted.fullName || 'Candidate',
          email: extracted.email || '',
          phone: extracted.phone || '',
          location: extracted.location || 'Indonesia',
          headline: extracted.headline || 'Software Engineer',
          summary: extracted.summary || '',
          skills: extracted.skills || [],
          experiences: extracted.experiences as any,
          education: extracted.education as any,
          rawResumeText: rawText,
          resumeFileName: file.originalname,
          preference: {
            create: {
              targetRoles: extracted.suggestedTargetRoles || ['Software Engineer', 'Frontend Developer'],
              targetLocations: [extracted.location || 'Jakarta', 'Remote'],
              workTypes: ['REMOTE', 'HYBRID', 'ONSITE'],
              minSalary: 10000000,
              matchThreshold: 70,
              blacklistedCompanies: [],
              blacklistedKeywords: ['Unpaid', 'Intern', 'Magang'],
              maxDailyApplications: 15,
              dryRunMode: true,
            },
          },
        },
        include: { preference: true },
      });
    }

    await this.logs.log({
      level: 'SUCCESS',
      action: 'PROFILE_UPDATED',
      message: `Profil kandidat ${profile.fullName} berhasil diekstrak dan disimpan (${profile.skills.length} keahlian terdeteksi).`,
    });

    return profile;
  }

  async getProfile() {
    let profile = await this.prisma.candidateProfile.findFirst({
      include: { preference: true },
    });

    if (!profile) {
      // Create a default initial profile so the app works seamlessly out of the box
      profile = await this.prisma.candidateProfile.create({
        data: {
          fullName: 'Budi Santoso',
          email: 'budi.santoso@example.com',
          phone: '+62 812-3456-7890',
          location: 'Jakarta, Indonesia',
          headline: 'Senior Fullstack & Backend Engineer',
          summary: 'Software Engineer berpengalaman lebih dari 4 tahun dalam merancang dan mengembangkan aplikasi web performa tinggi dengan Next.js, NestJS, TypeScript, dan PostgreSQL.',
          skills: ['TypeScript', 'JavaScript', 'Next.js', 'React', 'NestJS', 'Node.js', 'PostgreSQL', 'Prisma', 'RESTful API', 'Docker', 'Git'],
          experiences: [
            {
              company: 'Tech Inovasi Nusantara',
              title: 'Senior Software Engineer',
              duration: 'Jan 2022 - Sekarang',
              location: 'Jakarta, Indonesia',
              description: 'Memimpin pengembangan backend microservices dan frontend web application untuk platform logistik berskala nasional.',
              achievements: [
                'Meningkatkan throughput API sebesar 40% dengan optimasi query database PostgreSQL.',
                'Mengembangkan sistem real-time tracking menggunakan WebSockets dan SSE.',
              ],
            },
            {
              company: 'Solusi Digital Kreatif',
              title: 'Fullstack Developer',
              duration: 'Agu 2020 - Des 2021',
              location: 'Bandung, Indonesia',
              description: 'Mengembangkan aplikasi SaaS B2B menggunakan React, Node.js, dan cloud infrastructure.',
              achievements: [
                'Membangun dashboard analitik interaktif dengan integrasi visualisasi data.',
              ],
            },
          ],
          education: [
            {
              institution: 'Institut Teknologi Bandung',
              degree: 'Sarjana Komputer (S.Kom)',
              field: 'Teknik Informatika',
              graduationYear: '2020',
            },
          ],
          preference: {
            create: {
              targetRoles: ['Fullstack Engineer', 'Senior Backend Developer', 'Frontend Engineer', 'Software Engineer'],
              targetLocations: ['Jakarta', 'Remote', 'Bandung'],
              workTypes: ['REMOTE', 'HYBRID', 'ONSITE'],
              minSalary: 20000000,
              maxSalary: 45000000,
              matchThreshold: 70,
              blacklistedCompanies: ['PT Scam Sejahtera', 'Abal-Abal Tech'],
              blacklistedKeywords: ['Unpaid', 'Magang', 'Outsource Tanpa Kontrak'],
              maxDailyApplications: 15,
              dryRunMode: true,
              delayBetweenAppsMin: 30,
              delayBetweenAppsMax: 90,
            },
          },
        },
        include: { preference: true },
      });
    }

    return profile;
  }

  async updateProfile(data: any) {
    const profile = await this.getProfile();
    const updated = await this.prisma.candidateProfile.update({
      where: { id: profile.id },
      data: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        location: data.location,
        headline: data.headline,
        summary: data.summary,
        skills: data.skills || [],
        experiences: data.experiences,
        education: data.education,
      },
      include: { preference: true },
    });

    await this.logs.log({
      level: 'INFO',
      action: 'PROFILE_EDIT',
      message: `Profil ${updated.fullName} berhasil diperbarui.`,
    });

    return updated;
  }

  async getPreferences() {
    const profile = await this.getProfile();
    let pref = await this.prisma.searchPreference.findUnique({
      where: { profileId: profile.id },
    });
    if (!pref) {
      pref = await this.prisma.searchPreference.create({
        data: {
          profileId: profile.id,
          targetRoles: ['Fullstack Developer', 'Backend Engineer'],
          targetLocations: ['Jakarta', 'Remote'],
          workTypes: ['REMOTE', 'HYBRID'],
          minSalary: 12000000,
          matchThreshold: 70,
          blacklistedCompanies: [],
          blacklistedKeywords: [],
          maxDailyApplications: 15,
          dryRunMode: true,
        },
      });
    }
    return pref;
  }

  async updatePreferences(data: any) {
    const profile = await this.getProfile();
    const updated = await this.prisma.searchPreference.upsert({
      where: { profileId: profile.id },
      create: {
        profileId: profile.id,
        ...data,
      },
      update: {
        ...data,
      },
    });

    await this.logs.log({
      level: 'INFO',
      action: 'PREFERENCES_UPDATE',
      message: `Preferensi pencarian kerja diperbarui (Threshold: ${updated.matchThreshold}%, Dry-Run: ${updated.dryRunMode ? 'Aktif' : 'Non-Aktif'}).`,
    });

    return updated;
  }
}
