import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface TrackJobDto {
  jobId?: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  location?: string;
  salaryInfo?: string;
  jobUrl: string;
  portal?: string;
  jobDescription?: string;
  requirements?: string;
  matchScore?: number;
  matchReason?: string;
  strengths?: string[];
  skillGaps?: string[];
  status?: string;
  notes?: string;
  recruiterName?: string;
  recruiterContact?: string;
  offeredSalary?: string;
  targetSalary?: string;
  interviewDate?: string;
  nextFollowUpDate?: string;
}

export interface UpdateJobDetailsDto {
  notes?: string;
  recruiterName?: string;
  recruiterContact?: string;
  offeredSalary?: string;
  targetSalary?: string;
  interviewDate?: string | null;
  nextFollowUpDate?: string | null;
  statusMessage?: string;
}

@Injectable()
export class JobsService {
  constructor(private prisma: PrismaService) {}

  async getApplications(query: {
    search?: string;
    status?: string;
    portal?: string;
    minScore?: string;
    page?: string;
    limit?: string;
  }) {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '100', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { jobTitle: { contains: query.search, mode: 'insensitive' } },
        { companyName: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status && query.status !== 'ALL') {
      where.status = query.status;
    }

    if (query.portal && query.portal !== 'ALL') {
      where.portal = query.portal;
    }

    if (query.minScore) {
      where.matchScore = { gte: parseInt(query.minScore, 10) };
    }

    const [total, items] = await Promise.all([
      this.prisma.jobApplication.count({ where }),
      this.prisma.jobApplication.findMany({
        where,
        include: {
          stageHistory: {
            orderBy: { changedAt: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      items,
    };
  }

  async getApplicationById(id: string) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: {
        stageHistory: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });
    if (!app) {
      throw new NotFoundException('Application not found.');
    }
    return app;
  }

  async trackJob(dto: TrackJobDto) {
    // Check if already tracked by jobUrl or jobId
    const existing = await this.prisma.jobApplication.findFirst({
      where: {
        OR: [
          ...(dto.jobUrl ? [{ jobUrl: dto.jobUrl }] : []),
          ...(dto.jobId ? [{ jobId: dto.jobId }] : []),
        ],
      },
    });

    const status = dto.status || 'APPLIED';
    const appliedAt = status === 'APPLIED' ? new Date() : undefined;

    if (existing) {
      const updated = await this.prisma.jobApplication.update({
        where: { id: existing.id },
        data: {
          status,
          appliedAt: appliedAt || existing.appliedAt,
          notes: dto.notes !== undefined ? dto.notes : existing.notes,
        },
      });

      await this.prisma.stageHistory.create({
        data: {
          applicationId: existing.id,
          fromStatus: existing.status,
          toStatus: status,
          note: `Stage updated from discovery feed`,
        },
      });

      return updated;
    }

    const created = await this.prisma.jobApplication.create({
      data: {
        jobId: dto.jobId,
        jobTitle: dto.jobTitle,
        companyName: dto.companyName,
        companyLogo: dto.companyLogo,
        location: dto.location,
        salaryInfo: dto.salaryInfo,
        jobUrl: dto.jobUrl,
        portal: dto.portal || 'LINKEDIN',
        jobDescription: dto.jobDescription,
        requirements: dto.requirements,
        matchScore: dto.matchScore || 0,
        matchReason: dto.matchReason,
        strengths: dto.strengths || [],
        skillGaps: dto.skillGaps || [],
        status,
        notes: dto.notes,
        recruiterName: dto.recruiterName,
        recruiterContact: dto.recruiterContact,
        offeredSalary: dto.offeredSalary,
        targetSalary: dto.targetSalary,
        interviewDate: dto.interviewDate ? new Date(dto.interviewDate) : undefined,
        nextFollowUpDate: dto.nextFollowUpDate ? new Date(dto.nextFollowUpDate) : undefined,
        appliedAt,
      },
    });

    await this.prisma.stageHistory.create({
      data: {
        applicationId: created.id,
        fromStatus: 'DISCOVERED',
        toStatus: status,
        note: `Initial job tracked from ${dto.portal || 'Scraper'}`,
      },
    });

    return created;
  }

  async updateStatus(id: string, newStatus: string, note?: string) {
    const app = await this.getApplicationById(id);
    const fromStatus = app.status;

    const updateData: any = {
      status: newStatus,
    };

    if (newStatus === 'APPLIED' && !app.appliedAt) {
      updateData.appliedAt = new Date();
    }

    const updated = await this.prisma.jobApplication.update({
      where: { id },
      data: updateData,
    });

    await this.prisma.stageHistory.create({
      data: {
        applicationId: id,
        fromStatus,
        toStatus: newStatus,
        note: note || `Moved from ${fromStatus} to ${newStatus}`,
      },
    });

    return updated;
  }

  async updateDetails(id: string, dto: UpdateJobDetailsDto) {
    const data: any = {};
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.recruiterName !== undefined) data.recruiterName = dto.recruiterName;
    if (dto.recruiterContact !== undefined) data.recruiterContact = dto.recruiterContact;
    if (dto.offeredSalary !== undefined) data.offeredSalary = dto.offeredSalary;
    if (dto.targetSalary !== undefined) data.targetSalary = dto.targetSalary;
    if (dto.statusMessage !== undefined) data.statusMessage = dto.statusMessage;
    if (dto.interviewDate !== undefined) {
      data.interviewDate = dto.interviewDate ? new Date(dto.interviewDate) : null;
    }
    if (dto.nextFollowUpDate !== undefined) {
      data.nextFollowUpDate = dto.nextFollowUpDate ? new Date(dto.nextFollowUpDate) : null;
    }

    return this.prisma.jobApplication.update({
      where: { id },
      data,
    });
  }

  async deleteApplication(id: string) {
    return this.prisma.jobApplication.delete({
      where: { id },
    });
  }

  async getDashboardKPIs() {
    const [
      totalTracked,
      discoveredCount,
      appliedCount,
      screeningCount,
      technicalCount,
      finalCount,
      offerCount,
      rejectedCount,
      ghostedCount,
      skippedCount,
      avgScoreResult,
      upcomingInterviews,
      recentApplications,
    ] = await Promise.all([
      this.prisma.jobApplication.count({ where: { status: { not: 'SKIPPED' } } }),
      this.prisma.jobApplication.count({ where: { status: 'DISCOVERED' } }),
      this.prisma.jobApplication.count({ where: { status: 'APPLIED' } }),
      this.prisma.jobApplication.count({ where: { status: 'HR_SCREENING' } }),
      this.prisma.jobApplication.count({ where: { status: 'TECHNICAL_TEST' } }),
      this.prisma.jobApplication.count({ where: { status: 'FINAL_INTERVIEW' } }),
      this.prisma.jobApplication.count({ where: { status: { in: ['OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_DECLINED'] } } }),
      this.prisma.jobApplication.count({ where: { status: 'REJECTED' } }),
      this.prisma.jobApplication.count({ where: { status: 'GHOSTED' } }),
      this.prisma.jobApplication.count({ where: { status: 'SKIPPED' } }),
      this.prisma.jobApplication.aggregate({
        _avg: { matchScore: true },
      }),
      this.prisma.jobApplication.findMany({
        where: {
          interviewDate: { gte: new Date() },
        },
        orderBy: { interviewDate: 'asc' },
        take: 5,
      }),
      this.prisma.jobApplication.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 6,
      }),
    ]);

    const activeInterviews = screeningCount + technicalCount + finalCount;

    return {
      totalTracked,
      discoveredCount,
      appliedCount,
      screeningCount,
      technicalCount,
      finalCount,
      activeInterviews,
      offerCount,
      rejectedCount,
      ghostedCount,
      skippedCount,
      averageMatchScore: Math.round(avgScoreResult._avg.matchScore || 0),
      upcomingInterviews,
      recentApplications,
    };
  }

  async getSankeyAnalytics() {
    const allApps = await this.prisma.jobApplication.findMany({
      include: {
        stageHistory: {
          orderBy: { changedAt: 'asc' },
        },
      },
    });

    // Pipeline Stage Node Hierarchy:
    // Column 0: Discovered
    // Column 1: Applied / Skipped
    // Column 2: HR Screening / Rejected (Early) / Ghosted
    // Column 3: Technical Test / Rejected
    // Column 4: Final Interview / Rejected
    // Column 5: Offer Received / Rejected
    // Column 6: Offer Accepted / Offer Declined

    const nodes = [
      { id: 'Discovered', label: 'Discovered (24h Scraped)', color: '#6366f1', column: 0 },
      { id: 'Skipped', label: 'Skipped (Unfit)', color: '#64748b', column: 1 },
      { id: 'Applied', label: 'Applied', color: '#3b82f6', column: 1 },
      { id: 'Ghosted', label: 'Ghosted / No Reply', color: '#94a3b8', column: 2 },
      { id: 'Rejected_Early', label: 'Resume Rejected', color: '#ef4444', column: 2 },
      { id: 'HR_Screening', label: 'HR Screening', color: '#8b5cf6', column: 2 },
      { id: 'Technical_Test', label: 'Technical Test & Interview', color: '#a855f7', column: 3 },
      { id: 'Rejected_Tech', label: 'Tech Rejected', color: '#f43f5e', column: 3 },
      { id: 'Final_Interview', label: 'Final Interview', color: '#ec4899', column: 4 },
      { id: 'Rejected_Final', label: 'Final Rejected', color: '#e11d48', column: 4 },
      { id: 'Offer_Received', label: 'Offer Received', color: '#10b981', column: 5 },
      { id: 'Offer_Accepted', label: 'Offer Accepted 🎉', color: '#059669', column: 6 },
      { id: 'Offer_Declined', label: 'Offer Declined', color: '#d97706', column: 6 },
    ];

    const linkCounts: Record<string, number> = {};

    const addLink = (source: string, target: string) => {
      const key = `${source}->${target}`;
      linkCounts[key] = (linkCounts[key] || 0) + 1;
    };

    let totalDiscovered = allApps.length;
    let totalApplied = 0;
    let totalScreening = 0;
    let totalTech = 0;
    let totalFinal = 0;
    let totalOffers = 0;
    let totalAccepted = 0;
    let totalRejected = 0;
    let totalGhosted = 0;

    for (const app of allApps) {
      const history = app.stageHistory.map((h) => h.toStatus);
      const current = app.status;

      // Every tracked job originates from Discovered
      if (current === 'SKIPPED') {
        addLink('Discovered', 'Skipped');
        continue;
      }

      addLink('Discovered', 'Applied');
      totalApplied++;

      if (current === 'APPLIED') {
        continue;
      }

      if (current === 'GHOSTED') {
        addLink('Applied', 'Ghosted');
        totalGhosted++;
        continue;
      }

      if (current === 'REJECTED' && !history.includes('HR_SCREENING') && !history.includes('TECHNICAL_TEST') && !history.includes('FINAL_INTERVIEW')) {
        addLink('Applied', 'Rejected_Early');
        totalRejected++;
        continue;
      }

      // Reached HR Screening
      if (history.includes('HR_SCREENING') || ['HR_SCREENING', 'TECHNICAL_TEST', 'FINAL_INTERVIEW', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_DECLINED'].includes(current)) {
        addLink('Applied', 'HR_Screening');
        totalScreening++;

        if (current === 'HR_SCREENING') continue;

        if (current === 'REJECTED' && !history.includes('TECHNICAL_TEST') && !history.includes('FINAL_INTERVIEW')) {
          addLink('HR_Screening', 'Rejected_Early');
          totalRejected++;
          continue;
        }

        // Reached Technical Test
        if (history.includes('TECHNICAL_TEST') || ['TECHNICAL_TEST', 'FINAL_INTERVIEW', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_DECLINED'].includes(current)) {
          addLink('HR_Screening', 'Technical_Test');
          totalTech++;

          if (current === 'TECHNICAL_TEST') continue;

          if (current === 'REJECTED' && !history.includes('FINAL_INTERVIEW')) {
            addLink('Technical_Test', 'Rejected_Tech');
            totalRejected++;
            continue;
          }

          // Reached Final Interview
          if (history.includes('FINAL_INTERVIEW') || ['FINAL_INTERVIEW', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_DECLINED'].includes(current)) {
            addLink('Technical_Test', 'Final_Interview');
            totalFinal++;

            if (current === 'FINAL_INTERVIEW') continue;

            if (current === 'REJECTED') {
              addLink('Final_Interview', 'Rejected_Final');
              totalRejected++;
              continue;
            }

            // Reached Offer Received
            if (['OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_DECLINED'].includes(current)) {
              addLink('Final_Interview', 'Offer_Received');
              totalOffers++;

              if (current === 'OFFER_ACCEPTED') {
                addLink('Offer_Received', 'Offer_Accepted');
                totalAccepted++;
              } else if (current === 'OFFER_DECLINED') {
                addLink('Offer_Received', 'Offer_Declined');
              }
            }
          }
        }
      }
    }

    // Default sample flow demonstration if database has few applications yet
    if (Object.keys(linkCounts).length === 0) {
      addLink('Discovered', 'Applied');
      addLink('Discovered', 'Skipped');
      addLink('Applied', 'HR_Screening');
      addLink('Applied', 'Ghosted');
      addLink('HR_Screening', 'Technical_Test');
      addLink('HR_Screening', 'Rejected_Early');
      addLink('Technical_Test', 'Final_Interview');
      addLink('Final_Interview', 'Offer_Received');
      addLink('Offer_Received', 'Offer_Accepted');
      linkCounts['Discovered->Applied'] = 24;
      linkCounts['Discovered->Skipped'] = 12;
      linkCounts['Applied->HR_Screening'] = 14;
      linkCounts['Applied->Ghosted'] = 6;
      linkCounts['Applied->Rejected_Early'] = 4;
      linkCounts['HR_Screening->Technical_Test'] = 8;
      linkCounts['HR_Screening->Rejected_Early'] = 6;
      linkCounts['Technical_Test->Final_Interview'] = 5;
      linkCounts['Technical_Test->Rejected_Tech'] = 3;
      linkCounts['Final_Interview->Offer_Received'] = 3;
      linkCounts['Final_Interview->Rejected_Final'] = 2;
      linkCounts['Offer_Received->Offer_Accepted'] = 1;
      linkCounts['Offer_Received->Offer_Declined'] = 2;
      totalDiscovered = 36;
      totalApplied = 24;
      totalScreening = 14;
      totalTech = 8;
      totalFinal = 5;
      totalOffers = 3;
      totalAccepted = 1;
      totalRejected = 15;
      totalGhosted = 6;
    }

    const links = Object.entries(linkCounts).map(([key, value]) => {
      const [source, target] = key.split('->');
      return { source, target, value };
    });

    const conversionRates = {
      discoveredToApplied: totalDiscovered > 0 ? Math.round((totalApplied / totalDiscovered) * 100) : 0,
      appliedToScreening: totalApplied > 0 ? Math.round((totalScreening / totalApplied) * 100) : 0,
      screeningToTech: totalScreening > 0 ? Math.round((totalTech / totalScreening) * 100) : 0,
      techToFinal: totalTech > 0 ? Math.round((totalFinal / totalTech) * 100) : 0,
      finalToOffer: totalFinal > 0 ? Math.round((totalOffers / totalFinal) * 100) : 0,
      overallConversionRate: totalApplied > 0 ? Math.round((totalOffers / totalApplied) * 100) : 0,
    };

    return {
      nodes,
      links,
      totals: {
        discovered: totalDiscovered,
        applied: totalApplied,
        screening: totalScreening,
        technical: totalTech,
        finalInterview: totalFinal,
        offer: totalOffers,
        accepted: totalAccepted,
        rejected: totalRejected,
        ghosted: totalGhosted,
      },
      conversionRates,
    };
  }
}
