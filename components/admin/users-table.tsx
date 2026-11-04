'use client'

import { useState } from 'react'
import { Lock, LockOpen, Pencil } from 'lucide-react'
import { cn } from '@/lib/utils'

const initialUsers = [
  { id: 1, name: 'Trần Minh Anh', email: 'minhanh@gmail.com', date: '24/10/2026', xp: 1280, locked: false, color: 'from-pink-400 to-rose-600' },
  { id: 2, name: 'Lê Hoàng Nam', email: 'hoangnam@gmail.com', date: '24/10/2026', xp: 940, locked: false, color: 'from-sky-400 to-blue-600' },
  { id: 3, name: 'Phạm Thu Hà', email: 'thuha.pham@email.com', date: '23/10/2026', xp: 2310, locked: false, color: 'from-amber-400 to-orange-600' },
  { id: 4, name: 'Đỗ Quang Huy', email: 'quanghuy@email.com', date: '22/10/2026', xp: 120, locked: true, color: 'from-emerald-400 to-teal-600' },
  { id: 5, name: 'Vũ Ngọc Lan', email: 'ngoclan.vu@gmail.com', date: '21/10/2026', xp: 3450, locked: false, color: 'from-violet-400 to-purple-600' },
  { id: 6, name: 'Bùi Đức Thắng', email: 'ducthang@email.com', date: '20/10/2026', xp: 560, locked: true, color: 'from-red-400 to-red-600' },
]

const initials = (name: string) =>
  name
    .split(' ')
    .slice(-2)
    .map((p) => p[0])
    .join('')

export function UsersTable() {
  const [users, setUsers] = useState(initialUsers)

  return (
    <section aria-labelledby="users-title" className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between p-5">
        <h2 id="users-title" className="font-semibold">
          Học viên mới đăng ký
        </h2>
        <a href="#" className="text-sm font-medium text-violet-400 hover:text-violet-300">
          Xem tất cả
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] whitespace-nowrap text-sm">
          <thead>
            <tr className="border-y border-border bg-white/[0.02] text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th scope="col" className="px-5 py-3 font-medium">Tên</th>
              <th scope="col" className="px-5 py-3 font-medium">Email</th>
              <th scope="col" className="px-5 py-3 font-medium">Ngày đăng ký</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">XP</th>
              <th scope="col" className="px-5 py-3 font-medium">Trạng thái</th>
              <th scope="col" className="px-5 py-3 text-right font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0 hover:bg-white/[0.02]">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className={`flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${u.color} text-xs font-bold`}>{initials(u.name)}</span>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{u.email}</td>
                <td className="px-5 py-3 text-muted-foreground">{u.date}</td>
                <td className="px-5 py-3 text-right font-semibold tabular-nums">{u.xp.toLocaleString('en-US')}</td>
                <td className="px-5 py-3">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                      u.locked ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400',
                    )}
                  >
                    <span className={cn('size-1.5 rounded-full', u.locked ? 'bg-red-400' : 'bg-green-400')} />
                    {u.locked ? 'Bị khóa' : 'Hoạt động'}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-1">
                    <button type="button" aria-label={`Sửa ${u.name}`} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground">
                      <Pencil className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={u.locked ? `Mở khóa ${u.name}` : `Khóa ${u.name}`}
                      onClick={() => setUsers((list) => list.map((x) => (x.id === u.id ? { ...x, locked: !x.locked } : x)))}
                      className={cn(
                        'flex size-8 items-center justify-center rounded-lg hover:bg-white/5',
                        u.locked ? 'text-green-400' : 'text-muted-foreground hover:text-red-400',
                      )}
                    >
                      {u.locked ? <LockOpen className="size-4" aria-hidden="true" /> : <Lock className="size-4" aria-hidden="true" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
