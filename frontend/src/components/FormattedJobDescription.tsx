'use client';

import React from 'react';
import {
  CheckCircle2,
  Sparkles,
  Briefcase,
  Layers,
  Award,
  ChevronRight,
} from 'lucide-react';

interface FormattedJobDescriptionProps {
  description?: string;
  requirements?: string;
}

export default function FormattedJobDescription({
  description,
  requirements,
}: FormattedJobDescriptionProps) {
  if (!description && !requirements) {
    return (
      <div className="p-6 text-center text-zinc-400 text-xs italic">
        No detailed description provided.
      </div>
    );
  }

  const rawText = [description, requirements].filter(Boolean).join('\n\n');

  // Split text into lines/paragraphs
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // Group lines into sections or bullet blocks
  const sections: { title?: string; items: string[]; isList: boolean }[] = [];
  let currentSection: { title?: string; items: string[]; isList: boolean } = {
    items: [],
    isList: false,
  };

  const isHeading = (line: string): boolean => {
    const headingPatterns = [
      /^(about (the role|us|the team|the company)|overview|summary)/i,
      /^(qualifications|requirements|what you('ll| will) (do|be doing|bring)|responsibilities|job description)/i,
      /^(who you are|about you|skills & experience|key responsibilities|benefits|what we offer)/i,
      /^(🎯|🔍|🚀|💼|📌|✨|💡|🛠️)/,
      /^[A-Z\s]{4,30}:?$/,
      /:$/,
    ];
    return (
      line.length < 60 &&
      headingPatterns.some((pattern) => pattern.test(line))
    );
  };

  const isBulletItem = (line: string): boolean => {
    return /^([•\-\*▪️▫️–—]|\d+\.|\([a-z0-9]+\))\s+/i.test(line);
  };

  const cleanBullet = (line: string): string => {
    return line.replace(/^([•\-\*▪️▫️–—]|\d+\.|\([a-z0-9]+\))\s+/i, '').trim();
  };

  for (const line of lines) {
    if (isHeading(line)) {
      if (currentSection.items.length > 0 || currentSection.title) {
        sections.push(currentSection);
      }
      currentSection = {
        title: line.replace(/:$/, ''),
        items: [],
        isList: false,
      };
    } else if (isBulletItem(line)) {
      if (!currentSection.isList && currentSection.items.length > 0) {
        sections.push(currentSection);
        currentSection = { title: undefined, items: [], isList: true };
      }
      currentSection.isList = true;
      currentSection.items.push(cleanBullet(line));
    } else {
      if (currentSection.isList) {
        sections.push(currentSection);
        currentSection = { title: undefined, items: [], isList: false };
      }
      currentSection.items.push(line);
    }
  }

  if (currentSection.items.length > 0 || currentSection.title) {
    sections.push(currentSection);
  }

  return (
    <div className="space-y-5 text-zinc-800 dark:text-zinc-200">
      {sections.map((sec, idx) => (
        <div
          key={idx}
          className="bg-white dark:bg-zinc-800/50 p-4 sm:p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-700/80 shadow-2xs space-y-3"
        >
          {sec.title && (
            <div className="flex items-center space-x-2 pb-2 border-b border-zinc-100 dark:border-zinc-700/60">
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Briefcase className="w-3.5 h-3.5" />
              </span>
              <h5 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">
                {sec.title}
              </h5>
            </div>
          )}

          {sec.isList ? (
            <ul className="space-y-2 text-xs sm:text-sm leading-relaxed">
              {sec.items.map((it, i) => (
                <li key={i} className="flex items-start space-x-2.5">
                  <span className="mt-1 flex-shrink-0 text-blue-500">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                  <span className="font-medium text-zinc-700 dark:text-zinc-300">
                    {it}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="space-y-2 text-xs sm:text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 font-medium">
              {sec.items.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
