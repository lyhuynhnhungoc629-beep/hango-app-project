import { NextResponse } from 'next/server'
import { queryHandwritingClassesFromSqlServer } from '@/lib/backend/sql-server'
import { authenticateRequest } from '@/lib/backend/user-store'

export async function GET(request: Request) {
  const authResult = await authenticateRequest(request)
  if (!authResult.ok) {
    return NextResponse.json(
      {
        success: false,
        code: authResult.code,
        error: 'Vui lòng đăng nhập hoặc đăng ký tài khoản học viên để sử dụng chức năng này',
        detail: authResult.error,
      },
      { status: authResult.status },
    )
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')

  const { classes, stats } = await queryHandwritingClassesFromSqlServer()

  const filtered =
    category && category !== 'all'
      ? classes.filter((item) => item.category === category)
      : classes

  return NextResponse.json({
    success: true,
    stats,
    count: filtered.length,
    data: filtered,
  })
}
