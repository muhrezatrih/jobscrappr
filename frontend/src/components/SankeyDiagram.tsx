'use client';

import React, { useState } from 'react';
import { SankeyAnalyticsResponse } from '@/lib/api';
import { ArrowRight, CheckCircle2, XCircle, HelpCircle, Sparkles, TrendingUp } from 'lucide-react';

interface SankeyDiagramProps {
  data: SankeyAnalyticsResponse;
  height?: number;
  showMetrics?: boolean;
}

export default function SankeyDiagram({ data, height = 520, showMetrics = true }: SankeyDiagramProps) {
  const [hoveredLink, setHoveredLink] = useState<{ source: string; target: string; value: number } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  const { nodes, links, conversionRates, totals } = data;

  // Layout calculation
  const width = 1000;
  const paddingX = 40;
  const paddingY = 60;
  const nodeWidth = 16;
  const totalColumns = 7;
  const colSpacing = (width - paddingX * 2 - nodeWidth) / (totalColumns - 1);

  // Group nodes by column
  const columnNodes: Record<number, typeof nodes> = {};
  nodes.forEach((n) => {
    columnNodes[n.column] = columnNodes[n.column] || [];
    columnNodes[n.column].push(n);
  });

  // Calculate Node Totals
  const nodeValues: Record<string, number> = {};
  links.forEach((l) => {
    nodeValues[l.source] = (nodeValues[l.source] || 0) + l.value;
    nodeValues[l.target] = (nodeValues[l.target] || 0) + l.value;
  });

  // Node Positions
  const nodePositions: Record<string, { x: number; y: number; height: number; value: number; color: string; label: string }> = {};

  const chartHeight = height - paddingY * 2;

  Object.entries(columnNodes).forEach(([colStr, colNodes]) => {
    const col = parseInt(colStr, 10);
    const x = paddingX + col * colSpacing;

    const totalValInCol = colNodes.reduce((sum, n) => sum + Math.max(nodeValues[n.id] || 1, 1), 0);
    let currentY = paddingY;

    colNodes.forEach((node) => {
      const val = Math.max(nodeValues[node.id] || 1, 1);
      const nodeH = Math.max((val / totalValInCol) * (chartHeight - (colNodes.length - 1) * 20), 24);
      nodePositions[node.id] = {
        x,
        y: currentY,
        height: nodeH,
        value: nodeValues[node.id] || 0,
        color: node.color,
        label: node.label,
      };
      currentY += nodeH + 20;
    });
  });

  // Flow Offsets for Link Layout
  const sourceOffsets: Record<string, number> = {};
  const targetOffsets: Record<string, number> = {};

  return (
    <div className="w-full flex flex-col space-y-6">
      {/* Key Funnel Conversion Metrics */}
      {showMetrics && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Apply Rate</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{conversionRates.discoveredToApplied}%</span>
              <span className="text-xs text-blue-500 font-medium">({totals.applied}/{totals.discovered})</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full transition-all" style={{ width: `${conversionRates.discoveredToApplied}%` }} />
            </div>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Screening Rate</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{conversionRates.appliedToScreening}%</span>
              <span className="text-xs text-purple-500 font-medium">({totals.screening}/{totals.applied || 1})</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-purple-500 h-full rounded-full transition-all" style={{ width: `${conversionRates.appliedToScreening}%` }} />
            </div>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Tech Test Rate</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{conversionRates.screeningToTech}%</span>
              <span className="text-xs text-fuchsia-500 font-medium">({totals.technical}/{totals.screening || 1})</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-fuchsia-500 h-full rounded-full transition-all" style={{ width: `${conversionRates.screeningToTech}%` }} />
            </div>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Final Interview</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{conversionRates.techToFinal}%</span>
              <span className="text-xs text-pink-500 font-medium">({totals.finalInterview}/{totals.technical || 1})</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-pink-500 h-full rounded-full transition-all" style={{ width: `${conversionRates.techToFinal}%` }} />
            </div>
          </div>

          <div className="bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm flex flex-col">
            <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Offer Rate</span>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{conversionRates.finalToOffer}%</span>
              <span className="text-xs text-emerald-500 font-medium">({totals.offer}/{totals.finalInterview || 1})</span>
            </div>
            <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 mt-2 overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full transition-all" style={{ width: `${conversionRates.finalToOffer}%` }} />
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-950/30 dark:to-teal-950/30 p-3.5 rounded-2xl border border-emerald-300 dark:border-emerald-800/60 shadow-sm flex flex-col">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Total Offers</span>
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-1.5 mt-1">
              <span className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">{totals.offer}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{totals.accepted} Accepted 🎉</span>
            </div>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium">
              Overall: {conversionRates.overallConversionRate}% of applied
            </span>
          </div>
        </div>
      )}

      {/* Interactive SVG Sankey Container */}
      <div className="relative bg-white dark:bg-zinc-900/80 rounded-3xl p-6 border border-zinc-200/80 dark:border-zinc-800 shadow-sm overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[760px] select-none"
          style={{ maxHeight: `${height}px` }}
        >
          <defs>
            {links.map((link, idx) => {
              const srcNode = nodePositions[link.source];
              const tgtNode = nodePositions[link.target];
              if (!srcNode || !tgtNode) return null;
              return (
                <linearGradient key={`grad-${idx}`} id={`grad-${link.source}-${link.target}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={srcNode.color} stopOpacity="0.45" />
                  <stop offset="100%" stopColor={tgtNode.color} stopOpacity="0.45" />
                </linearGradient>
              );
            })}
          </defs>

          {/* Column Header Titles */}
          {[
            '1. Discovery',
            '2. Decision',
            '3. Screening',
            '4. Technical',
            '5. Final Round',
            '6. Decision',
            '7. Outcome',
          ].map((colTitle, idx) => {
            const x = paddingX + idx * colSpacing;
            return (
              <text
                key={idx}
                x={x + nodeWidth / 2}
                y={24}
                textAnchor="middle"
                className="fill-zinc-400 dark:fill-zinc-500 text-[11px] font-semibold tracking-wider uppercase"
              >
                {colTitle}
              </text>
            );
          })}

          {/* Links / Stream Flows */}
          {links.map((link, idx) => {
            const src = nodePositions[link.source];
            const tgt = nodePositions[link.target];
            if (!src || !tgt) return null;

            const srcTotal = src.value || 1;
            const tgtTotal = tgt.value || 1;

            const linkSrcHeight = Math.max((link.value / srcTotal) * src.height, 4);
            const linkTgtHeight = Math.max((link.value / tgtTotal) * tgt.height, 4);

            const srcYOffset = sourceOffsets[link.source] || 0;
            const tgtYOffset = targetOffsets[link.target] || 0;

            sourceOffsets[link.source] = srcYOffset + linkSrcHeight;
            targetOffsets[link.target] = tgtYOffset + linkTgtHeight;

            const y0 = src.y + srcYOffset;
            const y1 = tgt.y + tgtYOffset;
            const x0 = src.x + nodeWidth;
            const x1 = tgt.x;
            const xi = (x0 + x1) / 2;

            const path = `
              M ${x0},${y0}
              C ${xi},${y0} ${xi},${y1} ${x1},${y1}
              L ${x1},${y1 + linkTgtHeight}
              C ${xi},${y1 + linkTgtHeight} ${xi},${y0 + linkSrcHeight} ${x0},${y0 + linkSrcHeight}
              Z
            `;

            const isHovered =
              hoveredLink?.source === link.source && hoveredLink?.target === link.target;
            const isRelated =
              hoveredNode === link.source || hoveredNode === link.target;

            return (
              <path
                key={`link-${idx}`}
                d={path}
                fill={`url(#grad-${link.source}-${link.target})`}
                opacity={isHovered ? 0.9 : isRelated ? 0.75 : 0.35}
                className="transition-all duration-200 cursor-pointer hover:opacity-90"
                onMouseEnter={() => setHoveredLink(link)}
                onMouseLeave={() => setHoveredLink(null)}
              />
            );
          })}

          {/* Nodes */}
          {Object.entries(nodePositions).map(([nodeId, pos]) => {
            const isHovered = hoveredNode === nodeId;
            const isTargetOfHover = hoveredLink?.target === nodeId || hoveredLink?.source === nodeId;

            return (
              <g
                key={`node-${nodeId}`}
                className="cursor-pointer transition-all duration-200"
                onMouseEnter={() => setHoveredNode(nodeId)}
                onMouseLeave={() => setHoveredNode(null)}
              >
                {/* Node Vertical Bar */}
                <rect
                  x={pos.x}
                  y={pos.y}
                  width={nodeWidth}
                  height={pos.height}
                  rx={6}
                  fill={pos.color}
                  className={`transition-all duration-200 ${
                    isHovered || isTargetOfHover ? 'filter drop-shadow(0 0 8px ' + pos.color + ')' : ''
                  }`}
                />

                {/* Node Label & Count */}
                <text
                  x={pos.x + nodeWidth / 2}
                  y={pos.y - 6}
                  textAnchor="middle"
                  className="fill-zinc-800 dark:fill-zinc-200 text-[11px] font-bold"
                >
                  {pos.value}
                </text>

                <text
                  x={pos.x + nodeWidth / 2}
                  y={pos.y + pos.height + 14}
                  textAnchor="middle"
                  className="fill-zinc-600 dark:fill-zinc-400 text-[10px] font-medium"
                >
                  {pos.label.replace(/\(.*\)/, '').trim()}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip */}
        {hoveredLink && (
          <div className="absolute bottom-4 left-6 bg-zinc-950/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs flex items-center space-x-2 shadow-xl border border-zinc-800">
            <span className="font-semibold">{hoveredLink.source}</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold">{hoveredLink.target}</span>
            <span className="bg-blue-500/20 text-blue-300 font-bold px-2 py-0.5 rounded-md ml-2">
              {hoveredLink.value} applications
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
