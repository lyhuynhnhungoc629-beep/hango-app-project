import { NextResponse } from 'next/server'
import { queryHandwritingImageFromSqlServer } from '@/lib/backend/sql-server'
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
  const folder = searchParams.get('folder') || 'ga'
  const indexParam = Number(searchParams.get('index') || '0')

  try {
    const img = await queryHandwritingImageFromSqlServer(folder, indexParam)
    if (!img) {
      return NextResponse.json(
        { success: false, message: 'Không tìm thấy mẫu ảnh viết tay trong SQL Server' },
        { status: 404 },
      )
    }

    return new NextResponse(new Uint8Array(img.buffer), {
      status: 200,
      headers: {
        'Content-Type': img.mimeType,
        'Cache-Control': 'public, max-age=86400, immutable',
        'X-Data-Source': 'SQL-Server-HangoDatasetDB',
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Lỗi truy xuất hình ảnh từ SQL Server',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
