'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SankeyAnalyticsResponse } from '@/lib/api';
import { Sparkles, ArrowRight, TrendingUp, Search } from 'lucide-react';

interface SankeyDiagramProps {
  data: SankeyAnalyticsResponse;
  height?: number;
  showMetrics?: boolean;
}

export default function SankeyDiagram({ data, height = 620, showMetrics = true }: SankeyDiagramProps) {
  const [hoveredLink, setHoveredLink] = useState<{ source: string; target: string; value: number } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { links, conversionRates, totals } = data;
  const hasData = totals.applied > 0;

  const width = 1000;
  const svgHeight = 640;

  // Node Configurations mapping directly to SlideModel reference
  const nodeDefs: Record<
    string,
    {
      label: string;
      color: string;
      ribbonColor: string;
      bgCardColor: string;
      borderCardColor: string;
      x: number;
      y: number;
      width: number;
      height: number;
      count: number;
      textPosition: 'left' | 'right' | 'inside';
    }
  > = {
    Applications: {
      label: 'Applications',
      color: '#e879a8',
      ribbonColor: '#f48fb1',
      bgCardColor: 'rgba(232, 121, 168, 0.08)',
      borderCardColor: 'rgba(232, 121, 168, 0.3)',
      x: 140,
      y: 180,
      width: 12,
      height: 250,
      count: totals.applied,
      textPosition: 'left',
    },
    '1st_Interviews': {
      label: '1st Interviews',
      color: '#71717a',
      ribbonColor: '#b0bec5',
      bgCardColor: 'rgba(113, 113, 122, 0.08)',
      borderCardColor: 'rgba(113, 113, 122, 0.25)',
      x: 320,
      y: 150,
      width: 12,
      height: 110,
      count: totals.firstInterviews,
      textPosition: 'right',
    },
    Rejected: {
      label: 'Rejected',
      color: '#c0ca33',
      ribbonColor: '#dce775',
      bgCardColor: 'rgba(192, 202, 51, 0.1)',
      borderCardColor: 'rgba(192, 202, 51, 0.3)',
      x: 320,
      y: 310,
      width: 12,
      height: 80,
      count: totals.rejected,
      textPosition: 'right',
    },
    No_Reply: {
      label: 'No Reply',
      color: '#26c6da',
      ribbonColor: '#80deea',
      bgCardColor: 'rgba(38, 198, 218, 0.1)',
      borderCardColor: 'rgba(38, 198, 218, 0.3)',
      x: 320,
      y: 450,
      width: 12,
      height: 55,
      count: totals.noReply,
      textPosition: 'right',
    },
    '2nd_Interviews': {
      label: '2nd Interviews',
      color: '#4caf50',
      ribbonColor: '#81c784',
      bgCardColor: 'rgba(76, 175, 80, 0.18)',
      borderCardColor: 'rgba(76, 175, 80, 0.4)',
      x: 490,
      y: 110,
      width: 180,
      height: 55,
      count: totals.secondInterviews,
      textPosition: 'inside',
    },
    Dropped_By_Myself: {
      label: 'Dropped by Myself',
      color: '#fb8c00',
      ribbonColor: '#ffcc80',
      bgCardColor: 'rgba(251, 140, 0, 0.1)',
      borderCardColor: 'rgba(251, 140, 0, 0.3)',
      x: 490,
      y: 220,
      width: 12,
      height: 30,
      count: totals.dropped,
      textPosition: 'right',
    },
    No_Offer_Received: {
      label: 'No Offer Received',
      color: '#00acc1',
      ribbonColor: '#80deea',
      bgCardColor: 'rgba(0, 172, 193, 0.1)',
      borderCardColor: 'rgba(0, 172, 193, 0.3)',
      x: 490,
      y: 310,
      width: 12,
      height: 30,
      count: totals.noOffer,
      textPosition: 'right',
    },
    Offers: {
      label: 'Offers',
      color: '#8e24aa',
      ribbonColor: '#ce93d8',
      bgCardColor: 'rgba(142, 36, 170, 0.15)',
      borderCardColor: 'rgba(142, 36, 170, 0.35)',
      x: 670,
      y: 110,
      width: 120,
      height: 55,
      count: totals.offers,
      textPosition: 'inside',
    },
    Accepted: {
      label: 'Accepted',
      color: '#e53935',
      ribbonColor: '#ef9a9a',
      bgCardColor: 'rgba(229, 57, 53, 0.1)',
      borderCardColor: 'rgba(229, 57, 53, 0.3)',
      x: 840,
      y: 85,
      width: 12,
      height: 30,
      count: totals.accepted,
      textPosition: 'right',
    },
    Declined: {
      label: 'Declined',
      color: '#5e35b1',
      ribbonColor: '#b39ddb',
      bgCardColor: 'rgba(94, 53, 177, 0.1)',
      borderCardColor: 'rgba(94, 53, 177, 0.3)',
      x: 840,
      y: 155,
      width: 12,
      height: 30,
      count: totals.declined,
      textPosition: 'right',
    },
  };

  // Pre-calculated link paths mapping to SlideModel curves
  const linkFlows = [
    {
      source: 'Applications',
      target: '1st_Interviews',
      value: totals.firstInterviews,
      color: '#b0bec5',
      y0: 180,
      h0: 110,
      y1: 150,
      h1: 110,
    },
    {
      source: 'Applications',
      target: 'Rejected',
      value: totals.rejected,
      color: '#dce775',
      y0: 290,
      h0: 80,
      y1: 310,
      h1: 80,
    },
    {
      source: 'Applications',
      target: 'No_Reply',
      value: totals.noReply,
      color: '#80deea',
      y0: 370,
      h0: 60,
      y1: 450,
      h1: 55,
    },
    {
      source: '1st_Interviews',
      target: '2nd_Interviews',
      value: totals.secondInterviews,
      color: '#90caf9',
      y0: 150,
      h0: 55,
      y1: 110,
      h1: 55,
    },
    {
      source: '1st_Interviews',
      target: 'Dropped_By_Myself',
      value: totals.dropped,
      color: '#ffcc80',
      y0: 205,
      h0: 28,
      y1: 220,
      h1: 28,
    },
    {
      source: '1st_Interviews',
      target: 'No_Offer_Received',
      value: totals.noOffer,
      color: '#80deea',
      y0: 233,
      h0: 27,
      y1: 310,
      h1: 30,
    },
    {
      source: '2nd_Interviews',
      target: 'Offers',
      value: totals.offers,
      color: '#a5d6a7',
      y0: 110,
      h0: 55,
      y1: 110,
      h1: 55,
      isStraight: true,
    },
    {
      source: 'Offers',
      target: 'Accepted',
      value: totals.accepted,
      color: '#ef9a9a',
      y0: 110,
      h0: 28,
      y1: 85,
      h1: 28,
    },
    {
      source: 'Offers',
      target: 'Declined',
      value: totals.declined,
      color: '#b39ddb',
      y0: 138,
      h0: 27,
      y1: 155,
      h1: 27,
    },
  ].filter((f) => f.value > 0);

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Metric conversion rates */}
      {showMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-900/90 p-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col">
            <span className="text-xs font-semibold text-zinc-500">1st Interview Rate</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {conversionRates.appliedToScreening}%
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                ({totals.firstInterviews}/{totals.applied})
              </span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all"
                style={{ width: `${conversionRates.appliedToScreening}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/90 p-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col">
            <span className="text-xs font-semibold text-zinc-500">2nd Round Rate</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
                {conversionRates.screeningTo2nd}%
              </span>
              <span className="text-xs text-emerald-500 font-medium">
                ({totals.secondInterviews}/{totals.firstInterviews || (hasData ? 0 : 0)})
              </span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${conversionRates.screeningTo2nd}%` }}
              />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900/90 p-4 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col">
            <span className="text-xs font-semibold text-zinc-500">Final Offer Rate</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                {conversionRates.secondToOffer}%
              </span>
              <span className="text-xs text-purple-400 font-medium">
                ({totals.offers}/{totals.secondInterviews || (hasData ? 0 : 0)})
              </span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-purple-500 h-full rounded-full transition-all"
                style={{ width: `${conversionRates.secondToOffer}%` }}
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/40 dark:to-teal-950/40 p-4 rounded-3xl border border-emerald-300/80 dark:border-emerald-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                Overall Conversion
              </span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                {conversionRates.overallConversionRate}%
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                {totals.accepted} Accepted 🎉
              </span>
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              {totals.offers} offers from {totals.applied} applications
            </span>
          </div>
        </div>
      )}

      {/* Main Canvas Area */}
      {!hasData ? (
        /* Clean Empty State when 0 applications tracked */
        <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl rounded-3xl p-12 border border-zinc-200/90 dark:border-zinc-800 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 rounded-3xl">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h4 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              No Application Flow Data Yet
            </h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md">
              Start by searching 24h backend jobs in the Discovery feed. Once you apply and track roles, your recruitment funnel and drop-off velocity will render live here.
            </p>
          </div>
          <Link
            href="/"
            className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Fresh Jobs</span>
          </Link>
        </div>
      ) : (
        /* SVG Canvas Styled Exact like SlideModel */
        <div className="relative bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200/90 dark:border-zinc-800 shadow-sm overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${svgHeight}`}
            className="w-full h-auto min-w-[760px] select-none font-sans"
            style={{ maxHeight: `${height}px` }}
          >
            {/* S-Curve Ribbons (Links) */}
            {linkFlows.map((flow, idx) => {
              const srcNode = nodeDefs[flow.source];
              const tgtNode = nodeDefs[flow.target];
              if (!srcNode || !tgtNode) return null;

              const x0 = srcNode.x + srcNode.width;
              const x1 = tgtNode.x;
              const xi = (x0 + x1) / 2;

              const y0 = flow.y0;
              const y1 = flow.y1;
              const h0 = flow.h0;
              const h1 = flow.h1;

              let path = '';
              if (flow.isStraight) {
                path = `M ${x0},${y0} L ${x1},${y1} L ${x1},${y1 + h1} L ${x0},${y0 + h0} Z`;
              } else {
                path = `
                  M ${x0},${y0}
                  C ${xi},${y0} ${xi},${y1} ${x1},${y1}
                  L ${x1},${y1 + h1}
                  C ${xi},${y1 + h1} ${xi},${y0 + h0} ${x0},${y0 + h0}
                  Z
                `;
              }

              const isHovered =
                hoveredLink?.source === flow.source && hoveredLink?.target === flow.target;
              const isRelated =
                hoveredNode === flow.source || hoveredNode === flow.target;

              return (
                <path
                  key={`flow-${idx}`}
                  d={path}
                  fill={flow.color}
                  opacity={isHovered ? 0.95 : isRelated ? 0.9 : 0.8}
                  className="transition-all duration-200 cursor-pointer hover:opacity-100"
                  onMouseEnter={() =>
                    setHoveredLink({ source: flow.source, target: flow.target, value: flow.value })
                  }
                  onMouseLeave={() => setHoveredLink(null)}
                />
              );
            })}

            {/* Nodes & Card Headers */}
            {Object.entries(nodeDefs).map(([nodeId, node]) => {
              const isHovered = hoveredNode === nodeId;
              const isTargetOfHover =
                hoveredLink?.target === nodeId || hoveredLink?.source === nodeId;

              return (
                <g
                  key={`node-${nodeId}`}
                  className="cursor-pointer transition-all duration-200"
                  onMouseEnter={() => setHoveredNode(nodeId)}
                  onMouseLeave={() => setHoveredNode(null)}
                >
                  {/* 1. Large Rounded Card Background (if inside text position like 2nd Interviews or Offers) */}
                  {node.textPosition === 'inside' && (
                    <rect
                      x={node.x}
                      y={node.y}
                      width={node.width}
                      height={node.height}
                      rx={10}
                      fill={node.bgCardColor}
                      stroke={node.borderCardColor}
                      strokeWidth={1.5}
                      className="transition-all duration-200"
                    />
                  )}

                  {/* 2. Left Edge Vertical Solid Bar */}
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.textPosition === 'inside' ? 8 : node.width}
                    height={node.height}
                    rx={node.textPosition === 'inside' ? 4 : 4}
                    fill={node.color}
                    className={`transition-all duration-200 ${
                      isHovered || isTargetOfHover ? 'filter drop-shadow(0 0 6px ' + node.color + ')' : ''
                    }`}
                  />

                  {/* 3. Right Edge Solid Bar (for 2nd Interviews & Offers container blocks) */}
                  {node.textPosition === 'inside' && (
                    <rect
                      x={node.x + node.width - 8}
                      y={node.y}
                      width={8}
                      height={node.height}
                      rx={4}
                      fill={node.color}
                    />
                  )}

                  {/* 4. Labels & Bold Counts */}
                  {node.textPosition === 'left' && (
                    <g>
                      <text
                        x={node.x - 12}
                        y={node.y + node.height / 2 - 4}
                        textAnchor="end"
                        className="fill-zinc-900 dark:fill-zinc-100 font-extrabold text-[20px]"
                      >
                        {node.count}
                      </text>
                      <text
                        x={node.x - 12}
                        y={node.y + node.height / 2 + 14}
                        textAnchor="end"
                        className="fill-zinc-600 dark:fill-zinc-400 font-semibold text-[12px]"
                      >
                        {node.label}
                      </text>
                    </g>
                  )}

                  {node.textPosition === 'right' && (
                    <g>
                      <text
                        x={node.x + node.width + 12}
                        y={node.y + node.height / 2 - 4}
                        textAnchor="start"
                        className="fill-zinc-900 dark:fill-zinc-100 font-extrabold text-[18px]"
                      >
                        {node.count}
                      </text>
                      <text
                        x={node.x + node.width + 12}
                        y={node.y + node.height / 2 + 14}
                        textAnchor="start"
                        className="fill-zinc-600 dark:fill-zinc-400 font-semibold text-[12px]"
                      >
                        {node.label}
                      </text>
                    </g>
                  )}

                  {node.textPosition === 'inside' && (
                    <g>
                      <text
                        x={node.x + 20}
                        y={node.y + 24}
                        textAnchor="start"
                        className="fill-zinc-900 dark:fill-zinc-100 font-extrabold text-[18px]"
                      >
                        {node.count}
                      </text>
                      <text
                        x={node.x + 20}
                        y={node.y + 42}
                        textAnchor="start"
                        className="fill-zinc-700 dark:fill-zinc-300 font-semibold text-[12px]"
                      >
                        {node.label}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip */}
          {hoveredLink && (
            <div className="absolute bottom-6 left-8 bg-zinc-950/90 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl text-xs flex items-center space-x-2.5 shadow-2xl border border-zinc-800 animate-fadeIn">
              <span className="font-semibold">{hoveredLink.source.replace(/_/g, ' ')}</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold">{hoveredLink.target.replace(/_/g, ' ')}</span>
              <span className="bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-md ml-2">
                {hoveredLink.value} {hoveredLink.value === 1 ? 'application' : 'applications'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
