'use client'

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

const weekly = [
  { day: 'T2', hours: 1.2 },
  { day: 'T3', hours: 2.1 },
  { day: 'T4', hours: 1.6 },
  { day: 'T5', hours: 2.8 },
  { day: 'T6', hours: 2.2 },
  { day: 'T7', hours: 3.4 },
  { day: 'CN', hours: 2.6 },
]

const scores = [
  { test: 'Đề 14', score: 64 },
  { test: 'Đề 15', score: 70 },
  { test: 'Đề 16', score: 68 },
  { test: 'Đề 17', score: 76 },
  { test: 'Đề 18', score: 82 },
]
const avg = Math.round(scores.reduce((a, s) => a + s.score, 0) / scores.length)

const axis = { stroke: '#475569', fontSize: 12, tickLine: false, axisLine: false }
const tooltipStyle = {
  contentStyle: {
    background: '#ffffff',
    border: '1.5px solid #1E293B',
    borderRadius: 12,
    color: '#0F172A',
    boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
  },
  labelStyle: { color: '#475569', fontWeight: 700 },
}

export function WeeklyStudyChart() {
  return (
    <section
      aria-labelledby="weekly-title"
      className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-6 shadow-[0_2px_0_rgba(15,23,42,0.06)]"
    >
      <div className="flex items-center justify-between">
        <h2 id="weekly-title" className="text-base font-extrabold text-slate-900">
          Thời gian học theo tuần
        </h2>
        <span className="rounded-md border border-emerald-400 bg-[#DCFCE7] px-2.5 py-0.5 text-xs font-bold text-emerald-900">
          15.9 giờ
        </span>
      </div>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weekly} margin={{ left: -20, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="studyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563EB" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="day" {...axis} />
            <YAxis {...axis} unit="h" />
            <Tooltip {...tooltipStyle} formatter={(v) => [`${v} giờ`, 'Thời gian']} />
            <Area
              type="monotone"
              dataKey="hours"
              stroke="#2563EB"
              strokeWidth={3}
              fill="url(#studyFill)"
              dot={{ r: 4, fill: '#2563EB', strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export function TestScoresChart() {
  return (
    <section
      aria-labelledby="scores-title"
      className="rounded-2xl border-[1.5px] border-slate-800 bg-white p-6 shadow-[0_2px_0_rgba(15,23,42,0.06)]"
    >
      <div className="flex items-center justify-between">
        <h2 id="scores-title" className="text-base font-extrabold text-slate-900">
          Điểm thi thử gần đây
        </h2>
        <span className="rounded-md border border-amber-400 bg-[#FEF08A] px-2.5 py-0.5 text-xs font-bold text-amber-950">
          TB: {avg}/100
        </span>
      </div>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={scores} margin={{ left: -20, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="test" {...axis} />
            <YAxis {...axis} domain={[0, 100]} />
            <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(37,99,235,0.06)' }} formatter={(v) => [`${v}/100`, 'Điểm']} />
            <ReferenceLine
              y={avg}
              stroke="#F59E0B"
              strokeDasharray="6 4"
              label={{ value: 'TB', fill: '#B45309', fontSize: 12, position: 'right' }}
            />
            <Bar dataKey="score" fill="url(#barFill)" radius={[8, 8, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
