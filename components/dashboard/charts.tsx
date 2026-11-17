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

const axis = { stroke: '#9b9bb8', fontSize: 12, tickLine: false, axisLine: false }
const tooltipStyle = {
  contentStyle: { background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' },
  labelStyle: { color: '#9b9bb8' },
}

export function WeeklyStudyChart() {
  return (
    <section aria-labelledby="weekly-title" className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 id="weekly-title" className="font-semibold">
          Thời gian học theo tuần
        </h2>
        <span className="text-sm text-muted-foreground">15.9 giờ</span>
      </div>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={weekly} margin={{ left: -20, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="studyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="day" {...axis} />
            <YAxis {...axis} unit="h" />
            <Tooltip {...tooltipStyle} formatter={(v) => [`${v} giờ`, 'Thời gian']} />
            <Area type="monotone" dataKey="hours" stroke="#a78bfa" strokeWidth={3} fill="url(#studyFill)" dot={{ r: 4, fill: '#7c3aed', strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

export function TestScoresChart() {
  return (
    <section aria-labelledby="scores-title" className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <h2 id="scores-title" className="font-semibold">
          Điểm thi thử gần đây
        </h2>
        <span className="text-sm text-muted-foreground">TB: {avg}/100</span>
      </div>
      <div className="mt-6 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={scores} margin={{ left: -20, right: 8, top: 8 }}>
            <defs>
              <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="test" {...axis} />
            <YAxis {...axis} domain={[0, 100]} />
            <Tooltip {...tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} formatter={(v) => [`${v}/100`, 'Điểm']} />
            <ReferenceLine y={avg} stroke="#f59e0b" strokeDasharray="6 4" label={{ value: 'TB', fill: '#f59e0b', fontSize: 12, position: 'right' }} />
            <Bar dataKey="score" fill="url(#barFill)" radius={[8, 8, 0, 0]} maxBarSize={44} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
