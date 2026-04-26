import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ── Layout constants ───────────────────────────────────────────────────────────
const CELL        = 12;         // px
const GAP         = 3;          // px between cells
const STEP        = CELL + GAP; // 15 px per grid unit
const MONTH_GAP   = 10;         // px gap between month blocks
const MONTH_LBL_H = 16;         // px for month-name row
const DOW_LBL_W   = 26;         // px for Mon/Wed/Fri labels on the left

const MONTH_NAMES = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];

// only Mon / Wed / Fri are labelled (row index 1, 3, 5 in Sun=0 scheme)
const ROW_LABEL: Record<number, string> = { 1: 'Mon', 3: 'Wed', 5: 'Fri' };

// ── Colour scale (GitHub/LeetCode palette) ─────────────────────────────────────
function cellColor(count: number): string {
  if (count === 0) return '#161b22';
  if (count === 1) return '#0e4429';
  if (count === 2) return '#006d32';
  if (count === 3) return '#26a641';
  return '#39d353';
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

// ── Month block builder ────────────────────────────────────────────────────────
// Each month is represented as an array of week-columns.
// Padding nulls are added at the start so day-of-week rows align correctly.
interface MonthBlock {
  month: number;
  weeks: (Date | null)[][];  // weeks[col][row 0-6]  (0=Sun … 6=Sat)
  x: number;                 // absolute x offset within the cell canvas
}

function buildMonthBlocks(year: number): MonthBlock[] {
  const blocks: MonthBlock[] = [];
  let cursor = 0;

  for (let m = 0; m < 12; m++) {
    const totalDays = daysInMonth(year, m);
    const firstDow  = new Date(year, m, 1).getDay(); // 0=Sun

    // Flat array: leading nulls + actual dates
    const slots: (Date | null)[] = [
      ...Array<null>(firstDow).fill(null),
      ...Array.from({ length: totalDays }, (_, i) => new Date(year, m, i + 1)),
    ];
    // Pad end to a multiple of 7
    while (slots.length % 7 !== 0) slots.push(null);

    // Reshape: weeks[col][dow]
    const weeks: (Date | null)[][] = [];
    for (let i = 0; i < slots.length; i += 7) {
      weeks.push(slots.slice(i, i + 7));
    }

    blocks.push({ month: m, weeks, x: cursor });
    cursor += weeks.length * STEP + MONTH_GAP;
  }

  return blocks;
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface ActivityHeatmapProps {
  dailyCount: Map<string, number>;
  totalSolved: number;
}

// ── Component ──────────────────────────────────────────────────────────────────
export function ActivityHeatmap({ dailyCount, totalSolved }: ActivityHeatmapProps) {
  const currentYear = new Date().getFullYear();
  const [year, setYear]  = useState(currentYear);

  const blocks   = buildMonthBlocks(year);
  const today    = toKey(new Date());

  const yearSolves = Array.from(dailyCount.entries())
    .filter(([k]) => k.startsWith(String(year)))
    .reduce((sum, [, v]) => sum + v, 0);

  // Canvas dimensions
  const lastBlock = blocks[blocks.length - 1]!;
  const gridW = lastBlock.x + lastBlock.weeks.length * STEP;
  const totalW = DOW_LBL_W + gridW;
  const gridH  = 7 * STEP - GAP;
  const totalH = MONTH_LBL_H + gridH;

  return (
    <TooltipProvider delayDuration={80}>
      <div className="w-full select-none">

        {/* ── Header ── */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm">
            <span className="font-semibold">{yearSolves}</span>
            <span className="text-muted-foreground">
              {' '}submission{yearSolves !== 1 ? 's' : ''} in {year}
            </span>
            <span className="text-muted-foreground">
              {' '}·{' '}
              <span className="font-semibold">{totalSolved}</span>
              {' '}problem{totalSolved !== 1 ? 's' : ''} solved
            </span>
          </div>

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setYear(y => y - 1)}
              disabled={year <= currentYear - 4}
              className="hover:bg-muted rounded p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Previous year"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
            <span className="w-12 text-center text-sm font-semibold tabular-nums">{year}</span>
            <button
              onClick={() => setYear(y => y + 1)}
              disabled={year >= currentYear}
              className="hover:bg-muted rounded p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-30"
              aria-label="Next year"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Heatmap ── */}
        <div className="overflow-x-auto pb-1">
          <div style={{ width: totalW, height: totalH, position: 'relative' }}>

            {/* Day-of-week labels (Mon / Wed / Fri) */}
            {[0, 1, 2, 3, 4, 5, 6].map(dow => {
              const label = ROW_LABEL[dow];
              return (
                <span
                  key={dow}
                  className={cn(
                    'absolute text-[10px] text-muted-foreground leading-none',
                    !label && 'pointer-events-none opacity-0',
                  )}
                  style={{
                    left: 0,
                    top: MONTH_LBL_H + dow * STEP + Math.round((CELL - 10) / 2),
                    width: DOW_LBL_W - 4,
                    textAlign: 'right',
                  }}
                >
                  {label ?? '_'}
                </span>
              );
            })}

            {/* Month blocks */}
            {blocks.map(block => (
              <div
                key={block.month}
                style={{
                  position: 'absolute',
                  left: DOW_LBL_W + block.x,
                  top: 0,
                  display: 'flex',
                  flexDirection: 'row',
                  gap: GAP,
                }}
              >
                {block.weeks.map((week, wIdx) => (
                  <div
                    key={wIdx}
                    style={{ display: 'flex', flexDirection: 'column', gap: GAP }}
                  >
                    {/* Month label above the first column only */}
                    <div style={{ height: MONTH_LBL_H, position: 'relative' }}>
                      {wIdx === 0 && (
                        <span
                          className="absolute left-0 top-0 whitespace-nowrap text-[11px] font-medium text-muted-foreground"
                          style={{ lineHeight: `${MONTH_LBL_H}px` }}
                        >
                          {MONTH_NAMES[block.month]}
                        </span>
                      )}
                    </div>

                    {/* 7 day cells (Sun–Sat) */}
                    {week.map((day, dow) => {
                      if (!day) {
                        // Padding slot — invisible spacer
                        return (
                          <div
                            key={dow}
                            style={{ width: CELL, height: CELL, flexShrink: 0 }}
                          />
                        );
                      }

                      const key      = toKey(day);
                      const count    = dailyCount.get(key) ?? 0;
                      const isToday  = key === today;
                      const isFuture = key > today;

                      return (
                        <Tooltip key={dow}>
                          <TooltipTrigger asChild>
                            <div
                              style={{
                                width:           CELL,
                                height:          CELL,
                                borderRadius:    2,
                                flexShrink:      0,
                                cursor:          'default',
                                backgroundColor: isFuture ? '#0d1117' : cellColor(count),
                                outline:         isToday ? '2px solid #26a641' : 'none',
                                outlineOffset:   '1px',
                                border: isFuture
                                  ? '1px solid rgba(255,255,255,0.04)'
                                  : 'none',
                              }}
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {count > 0 ? (
                              <span className="font-semibold text-emerald-400">
                                {count} submission{count > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">No submissions</span>
                            )}
                            <span className="text-muted-foreground ml-1.5">
                              {day.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month:   'short',
                                day:     'numeric',
                                year:    'numeric',
                              })}
                            </span>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ── Legend ── */}
        <div className="mt-3 flex items-center justify-end gap-1.5">
          <span className="text-[10px] text-muted-foreground">Less</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              style={{
                width:           11,
                height:          11,
                borderRadius:    2,
                backgroundColor: cellColor(level),
                border: level === 0 ? '1px solid rgba(255,255,255,0.08)' : 'none',
              }}
            />
          ))}
          <span className="text-[10px] text-muted-foreground">More</span>
        </div>

      </div>
    </TooltipProvider>
  );
}
