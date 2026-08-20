import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial candidate profile and preferences...');

  const existing = await prisma.candidateProfile.findFirst({
    include: { preference: true },
  });

  if (!existing) {
    await prisma.candidateProfile.create({
      data: {
        fullName: 'Budi Santoso',
        email: 'budi.santoso@example.com',
        phone: '+62 812-3456-7890',
        location: 'Jakarta, Indonesia',
        headline: 'Senior Fullstack & Backend Engineer',
        summary:
          'Software Engineer berpengalaman lebih dari 4 tahun dalam merancang dan mengembangkan aplikasi web performa tinggi dengan Next.js, NestJS, TypeScript, dan PostgreSQL.',
        skills: [
          'TypeScript',
          'JavaScript',
          'Next.js',
          'React',
          'NestJS',
          'Node.js',
          'PostgreSQL',
          'Prisma',
          'RESTful API',
          'Docker',
          'Git',
        ],
        experiences: [
          {
            company: 'Tech Inovasi Nusantara',
            title: 'Senior Software Engineer',
            duration: 'Jan 2022 - Sekarang',
            location: 'Jakarta, Indonesia',
            description:
              'Memimpin pengembangan backend microservices dan frontend web application untuk platform logistik berskala nasional.',
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
            description:
              'Mengembangkan aplikasi SaaS B2B menggunakan React, Node.js, dan cloud infrastructure.',
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
            targetRoles: [
              'Fullstack Engineer',
              'Senior Backend Developer',
              'Frontend Engineer',
              'Software Engineer',
            ],
            targetLocations: ['Jakarta', 'Remote', 'Bandung'],
            workTypes: ['REMOTE', 'HYBRID', 'ONSITE'],
            minSalary: 15000000,
            maxSalary: 35000000,
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
    });
    console.log('Seed completed successfully!');
  } else {
    console.log('Candidate profile already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
