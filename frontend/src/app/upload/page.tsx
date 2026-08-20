'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { api, CandidateProfile } from '@/lib/api';
import confetti from 'canvas-confetti';

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [extractedResult, setExtractedResult] = useState<CandidateProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    'Reading resume document text...',
    'Analyzing skills & work history with Gemini AI...',
    'Structuring target roles & search preferences...',
    'Saving candidate profile to database...',
  ];

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.pdf') && !file.name.endsWith('.docx') && !file.name.endsWith('.txt')) {
      setError('File must be in .PDF, .DOCX, or .TXT format');
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleUploadAndExtract = async () => {
    if (!selectedFile) return;
    setIsProcessing(true);
    setError(null);
    setCurrentStep(0);

    // Step progression animation
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 800);

    try {
      const profile = await api.uploadResume(selectedFile);
      clearInterval(stepInterval);
      setCurrentStep(steps.length - 1);
      setExtractedResult(profile);
      try {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } catch (e) {}
    } catch (err: any) {
      clearInterval(stepInterval);
      setError(err.message || 'Failed to extract resume.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: 'var(--apple-blue-soft)',
            color: 'var(--apple-blue)',
            fontSize: '0.8rem',
            fontWeight: 600,
            marginBottom: '0.75rem',
          }}
        >
          <Sparkles size={14} /> AI Resume Parser
        </div>
        <h1 style={{ fontSize: '2.25rem', fontWeight: 800, letterSpacing: '-0.04em' }}>
          Upload Your Resume
        </h1>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
          Google Gemini AI will extract all skills, work history, and target role preferences to personalize your applications automatically.
        </p>
      </div>

      {/* Upload Box */}
      {!extractedResult ? (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--apple-blue)' : 'var(--border-medium)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '3rem 2rem',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'var(--apple-blue-soft)' : 'var(--surface-glass-card)',
              transition: 'all var(--transition-fast)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--apple-blue-soft)',
                color: 'var(--apple-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UploadCloud size={32} />
            </div>

            <div>
              <p style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Drag & drop your resume here, or <span style={{ color: 'var(--apple-blue)' }}>Browse Files</span>
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                Supports PDF, DOCX, or TXT (Max 10MB)
              </p>
            </div>
          </div>

          {/* Selected File Card */}
          {selectedFile && (
            <div
              className="glass-card"
              style={{
                marginTop: '1.25rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '8px',
                    background: 'var(--apple-blue-soft)',
                    color: 'var(--apple-blue)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileText size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                    {selectedFile.name}
                  </strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </div>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUploadAndExtract();
                }}
                disabled={isProcessing}
                className="btn-primary"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={15} className="spin" />
                    <span>Extracting AI...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={15} />
                    <span>Extract with AI</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Processing Steps */}
          {isProcessing && (
            <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {steps.map((step, idx) => {
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.65rem',
                      fontSize: '0.825rem',
                      color: isCompleted
                        ? 'var(--apple-green)'
                        : isCurrent
                        ? 'var(--apple-blue)'
                        : 'var(--text-tertiary)',
                      fontWeight: isCurrent ? 600 : 500,
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={16} />
                    ) : isCurrent ? (
                      <Loader2 size={16} className="spin" />
                    ) : (
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1px solid var(--border-medium)', display: 'inline-block' }} />
                    )}
                    <span>{step}</span>
                  </div>
                );
              })}
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.85rem 1.25rem',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--apple-red-soft)',
                border: '1px solid rgba(255, 69, 58, 0.3)',
                color: 'var(--apple-red)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                fontSize: '0.85rem',
              }}
            >
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>
      ) : (
        /* Extraction Success Preview */
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: 'var(--apple-green-soft)',
                color: 'var(--apple-green)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <CheckCircle2 size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
                Resume Extracted Successfully!
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Profile for <strong>{extractedResult.fullName}</strong> is ready for automation.
              </p>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '1.25rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
              {extractedResult.headline || 'Software Engineer'}
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.85rem' }}>
              {extractedResult.summary}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {extractedResult.skills?.map((skill, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: 'var(--radius-full)',
                    background: 'var(--apple-blue-soft)',
                    color: 'var(--apple-blue)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              onClick={() => {
                setExtractedResult(null);
                setSelectedFile(null);
              }}
              className="btn-secondary"
            >
              Upload Another Resume
            </button>
            <button
              onClick={() => router.push('/profile')}
              className="btn-primary"
            >
              <span>Review Profile & Criteria</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Feature Highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
        <div className="glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ color: 'var(--apple-blue)', marginBottom: '0.45rem' }}>
            <Zap size={18} />
          </div>
          <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Semantic Parsing</strong>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Automatically detects work history, projects, and specialized skills.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ color: 'var(--apple-green)', marginBottom: '0.45rem' }}>
            <ShieldCheck size={18} />
          </div>
          <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Privacy Guaranteed</strong>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Your data is stored securely in your local PostgreSQL database.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '1.15rem' }}>
          <div style={{ color: 'var(--apple-purple)', marginBottom: '0.45rem' }}>
            <Sparkles size={18} />
          </div>
          <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>Automated Screening Q&A</strong>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            AI generates tailored answers for Jobstreet screening questions.
          </p>
        </div>
      </div>
    </div>
  );
}
