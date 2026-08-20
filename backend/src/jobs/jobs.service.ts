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

    // Pipeline Stage Node Hierarchy matching SlideModel style:
    // Column 0: Applications
    // Column 1: 1st Interviews, Rejected, No Reply
    // Column 2: 2nd Interviews, Dropped by Myself, No Offer Received
    // Column 3: Offers
    // Column 4: Accepted, Declined

    const nodes = [
      { id: 'Applications', label: 'Applications', color: '#e879a8', ribbonColor: '#f48fb1', column: 0 },
      { id: '1st_Interviews', label: '1st Interviews', color: '#71717a', ribbonColor: '#b0bec5', column: 1 },
      { id: 'Rejected', label: 'Rejected', color: '#c0ca33', ribbonColor: '#dce775', column: 1 },
      { id: 'No_Reply', label: 'No Reply', color: '#26c6da', ribbonColor: '#80deea', column: 1 },
      { id: '2nd_Interviews', label: '2nd Interviews', color: '#4caf50', ribbonColor: '#81c784', column: 2 },
      { id: 'Dropped_By_Myself', label: 'Dropped by Myself', color: '#fb8c00', ribbonColor: '#ffcc80', column: 2 },
      { id: 'No_Offer_Received', label: 'No Offer Received', color: '#00acc1', ribbonColor: '#80deea', column: 2 },
      { id: 'Offers', label: 'Offers', color: '#8e24aa', ribbonColor: '#ce93d8', column: 3 },
      { id: 'Accepted', label: 'Accepted', color: '#e53935', ribbonColor: '#ef9a9a', column: 4 },
      { id: 'Declined', label: 'Declined', color: '#5e35b1', ribbonColor: '#b39ddb', column: 4 },
    ];

    const linkCounts: Record<string, number> = {};

    const addLink = (source: string, target: string, count: number = 1) => {
      const key = `${source}->${target}`;
      linkCounts[key] = (linkCounts[key] || 0) + count;
    };

    let totalApplied = 0;
    let total1st = 0;
    let total2nd = 0;
    let totalOffers = 0;
    let totalAccepted = 0;
    let totalDeclined = 0;
    let totalRejected = 0;
    let totalNoReply = 0;
    let totalDropped = 0;
    let totalNoOffer = 0;

    for (const app of allApps) {
      if (app.status === 'SKIPPED') {
        continue;
      }

      totalApplied++;
      const current = app.status;
      const history = app.stageHistory.map((h) => h.toStatus);

      if (current === 'APPLIED') {
        continue;
      }

      if (current === 'GHOSTED') {
        addLink('Applications', 'No_Reply');
        totalNoReply++;
        continue;
      }

      if (current === 'REJECTED' && !history.includes('HR_SCREENING') && !history.includes('TECHNICAL_TEST') && !history.includes('FINAL_INTERVIEW')) {
        addLink('Applications', 'Rejected');
        totalRejected++;
        continue;
      }

      // Advanced to 1st Interviews
      if (history.includes('HR_SCREENING') || ['HR_SCREENING', 'TECHNICAL_TEST', 'FINAL_INTERVIEW', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_DECLINED'].includes(current)) {
        addLink('Applications', '1st_Interviews');
        total1st++;

        if (current === 'HR_SCREENING') continue;

        if (current === 'REJECTED' && !history.includes('TECHNICAL_TEST') && !history.includes('FINAL_INTERVIEW')) {
          addLink('1st_Interviews', 'No_Offer_Received');
          totalNoOffer++;
          continue;
        }

        // Advanced to 2nd Interviews
        if (history.includes('TECHNICAL_TEST') || ['TECHNICAL_TEST', 'FINAL_INTERVIEW', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_DECLINED'].includes(current)) {
          addLink('1st_Interviews', '2nd_Interviews');
          total2nd++;

          if (current === 'TECHNICAL_TEST' || current === 'FINAL_INTERVIEW') continue;

          if (current === 'REJECTED') {
            addLink('2nd_Interviews', 'No_Offer_Received');
            totalNoOffer++;
            continue;
          }

          // Reached Offers
          if (['OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_DECLINED'].includes(current)) {
            addLink('2nd_Interviews', 'Offers');
            totalOffers++;

            if (current === 'OFFER_ACCEPTED') {
              addLink('Offers', 'Accepted');
              totalAccepted++;
            } else if (current === 'OFFER_DECLINED') {
              addLink('Offers', 'Declined');
              totalDeclined++;
            }
          }
        }
      }
    }

    const links = Object.entries(linkCounts).map(([key, value]) => {
      const [source, target] = key.split('->');
      return { source, target, value };
    });

    const conversionRates = {
      appliedToScreening: totalApplied > 0 ? Math.round((total1st / totalApplied) * 100) : 0,
      screeningTo2nd: total1st > 0 ? Math.round((total2nd / total1st) * 100) : 0,
      secondToOffer: total2nd > 0 ? Math.round((totalOffers / total2nd) * 100) : 0,
      overallConversionRate: totalApplied > 0 ? Math.round((totalOffers / totalApplied) * 100) : 0,
    };

    return {
      nodes,
      links,
      totals: {
        applied: totalApplied,
        firstInterviews: total1st,
        secondInterviews: total2nd,
        offers: totalOffers,
        accepted: totalAccepted,
        declined: totalDeclined,
        rejected: totalRejected,
        noReply: totalNoReply,
        dropped: totalDropped,
        noOffer: totalNoOffer,
      },
      conversionRates,
    };
  }
}
