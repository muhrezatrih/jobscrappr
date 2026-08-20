import { GeminiService } from '../src/ai/gemini.service';

describe('GeminiService (Unit Tests)', () => {
  let service: GeminiService;

  beforeEach(() => {
    service = new GeminiService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should evaluate job match fallback properly when API is unavailable', async () => {
    const mockJob = {
      title: 'Fullstack Engineer',
      company: 'Tokopedia',
      description: 'Looking for a fullstack engineer with React and Node.js',
    };
    const mockCandidate = {
      fullName: 'Budi Santoso',
      skills: ['React', 'Node.js', 'TypeScript'],
      experiences: [],
    };
    const mockPref = {
      matchThreshold: 70,
      targetRoles: ['Fullstack Engineer'],
    };

    const result = await service.evaluateJobMatch(mockJob, mockCandidate, mockPref);
    expect(result).toBeDefined();
    expect(result.matchScore).toBeGreaterThanOrEqual(0);
    expect(result.matchScore).toBeLessThanOrEqual(100);
    expect(typeof result.matchReason).toBe('string');
  });

  it('should generate fallback cover letter if needed', async () => {
    const mockJob = {
      title: 'Senior Backend Engineer',
      company: 'Gojek',
      description: 'Scalable systems with Go / Node.js',
    };
    const mockCandidate = {
      fullName: 'Budi Santoso',
      skills: ['Node.js', 'NestJS', 'PostgreSQL'],
      experiences: [],
    };

    const coverLetter = await service.generateCoverLetter(mockJob, mockCandidate);
    expect(coverLetter).toBeDefined();
    expect(coverLetter.length).toBeGreaterThan(20);
    expect(coverLetter).toContain('Gojek');
  });
});
