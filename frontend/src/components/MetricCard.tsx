'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'blue' | 'green' | 'amber' | 'purple' | 'default';
  trend?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
  trend,
}: MetricCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'blue':
        return {
          iconBg: 'var(--apple-blue-soft)',
          iconColor: 'var(--apple-blue)',
          borderGlow: 'rgba(10, 132, 255, 0.2)',
        };
      case 'green':
        return {
          iconBg: 'var(--apple-green-soft)',
          iconColor: 'var(--apple-green)',
          borderGlow: 'rgba(48, 209, 88, 0.2)',
        };
      case 'amber':
        return {
          iconBg: 'var(--apple-amber-soft)',
          iconColor: 'var(--apple-amber)',
          borderGlow: 'rgba(255, 159, 10, 0.2)',
        };
      case 'purple':
        return {
          iconBg: 'var(--apple-purple-soft)',
          iconColor: 'var(--apple-purple)',
          borderGlow: 'rgba(191, 90, 242, 0.2)',
        };
      default:
        return {
          iconBg: 'rgba(255, 255, 255, 0.05)',
          iconColor: 'var(--text-primary)',
          borderGlow: 'var(--border-subtle)',
        };
    }
  };

  const style = getVariantStyles();

  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '140px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          {title}
        </span>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: style.iconBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: style.iconColor,
          }}
        >
          <Icon size={18} />
        </div>
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <div
          style={{
            fontSize: '1.85rem',
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'var(--text-primary)',
            lineHeight: 1.1,
          }}
        >
          {value}
        </div>
        {(subtitle || trend) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '0.35rem',
              fontSize: '0.75rem',
              color: 'var(--text-tertiary)',
            }}
          >
            {trend && <span style={{ color: style.iconColor, fontWeight: 600 }}>{trend}</span>}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
