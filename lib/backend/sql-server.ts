import { execFile } from 'child_process'
import { promisify } from 'util'
import { KOREAN_HANDWRITING_DATASET, type DatasetCategory, type HangulCharDatasetItem } from '@/lib/handwriting-dataset'

const execFileAsync = promisify(execFile)

export const SQL_SERVER_CONFIG = {
  serverInstance: process.env.SQL_SERVER_INSTANCE || '.\\SQLEXPRESS',
  database: process.env.SQL_SERVER_DATABASE || 'HangoDatasetDB',
}

export interface SqlDatasetStats {
  serverInstance: string
  database: string
  totalClasses: number
  originalSamplesCount: number
  augmentedSamplesCount: number
  totalSamplesCount: number
  originalBinarySizeMB: number
  totalUncompressedSizeMB: number
  storageStrategy: string
  connected: boolean
}

let cachedClasses: HangulCharDatasetItem[] | null = null
let cachedStats: SqlDatasetStats | null = null
const imageCache = new Map<string, Buffer>()
const MAX_IMAGE_CACHE = 300

/**
 * Thực thi truy vấn SQL Server trả về JSON (hỗ trợ đầy đủ Unicode UTF-8 -f 65001)
 */
export async function executeSqlJsonQuery<T>(sqlQuery: string): Promise<T> {
  const { stdout } = await execFileAsync(
    'sqlcmd',
    [
      '-S',
      SQL_SERVER_CONFIG.serverInstance,
      '-d',
      SQL_SERVER_CONFIG.database,
      '-E',
      '-C',
      '-f',
      '65001',
      '-y',
      '0',
      '-Q',
      `SET NOCOUNT ON; ${sqlQuery}`,
    ],
    {
      encoding: 'utf8',
      maxBuffer: 15 * 1024 * 1024,
      timeout: 15000,
    },
  )

  const cleaned = stdout.replace(/\r?\n/g, '').trim()
  if (!cleaned) {
    throw new Error('Empty JSON result from SQL Server')
  }
  return JSON.parse(cleaned) as T
}

/**
 * Truy vấn danh sách 64 lớp ký tự tiếng Hàn và thống kê Dataset từ SQL Server (HangoDatasetDB)
 */
export async function queryHandwritingClassesFromSqlServer(): Promise<{
  classes: HangulCharDatasetItem[]
  stats: SqlDatasetStats
}> {
  if (cachedClasses && cachedStats) {
    return { classes: cachedClasses, stats: cachedStats }
  }

  try {
    interface RawSqlClassRow {
      DatasetClassCode: string
      FolderName: string
      HangulChar: string
      UnicodeHex: string
      Romanization: string
      MeaningVi: string
      Category: DatasetCategory
      StrokeCount: number
      Choseong: string
      Jungseong: string
      Jongseong?: string | null
      WritingTip: string
      OriginalSampleCount: number
      AugmentedSampleCount: number
    }

    const rows = await executeSqlJsonQuery<RawSqlClassRow[]>(`
      SELECT
        DatasetClassCode,
        FolderName,
        HangulChar,
        UnicodeHex,
        Romanization,
        MeaningVi,
        Category,
        StrokeCount,
        Choseong,
        Jungseong,
        Jongseong,
        WritingTip,
        OriginalSampleCount,
        AugmentedSampleCount
      FROM dbo.HangulCharacterClasses
      ORDER BY ClassId ASC
      FOR JSON PATH;
    `)

    interface RawSqlLogRow {
      ImportedClassesCount: number
      ImportedOrigCount: number
      ImportedAugCount: number
      TotalImportedSamples: number
      OrigBinarySizeBytes: number
      TotalUncompressedBytes: number
    }

    const logRows = await executeSqlJsonQuery<RawSqlLogRow[]>(`
      SELECT TOP 1
        ImportedClassesCount,
        ImportedOrigCount,
        ImportedAugCount,
        TotalImportedSamples,
        OrigBinarySizeBytes,
        TotalUncompressedBytes
      FROM dbo.DatasetImportLogs
      ORDER BY LogId DESC
      FOR JSON PATH;
    `)

    const classes: HangulCharDatasetItem[] = rows.map((r) => ({
      datasetClassId: r.DatasetClassCode,
      folder: r.FolderName,
      char: r.HangulChar,
      unicode: r.UnicodeHex,
      roman: r.Romanization,
      meaning: r.MeaningVi,
      category: r.Category,
      strokes: r.StrokeCount,
      sampleCount: r.OriginalSampleCount,
      augmentedCount: r.AugmentedSampleCount,
      jamo: {
        choseong: r.Choseong,
        jungseong: r.Jungseong,
        jongseong: r.Jongseong || undefined,
      },
      tip: r.WritingTip,
    }))

    const log = logRows[0]
    const stats: SqlDatasetStats = {
      serverInstance: SQL_SERVER_CONFIG.serverInstance,
      database: SQL_SERVER_CONFIG.database,
      totalClasses: log?.ImportedClassesCount ?? classes.length,
      originalSamplesCount: log?.ImportedOrigCount ?? 6400,
      augmentedSamplesCount: log?.ImportedAugCount ?? 128000,
      totalSamplesCount: log?.TotalImportedSamples ?? 134400,
      originalBinarySizeMB: Number(((log?.OrigBinarySizeBytes ?? 15652317) / (1024 * 1024)).toFixed(2)),
      totalUncompressedSizeMB: Number(((log?.TotalUncompressedBytes ?? 191784399) / (1024 * 1024)).toFixed(2)),
      storageStrategy: 'Hybrid VARBINARY(MAX) (6,400 ảnh gốc) + Metadata Catalog (128,000 ảnh mở rộng)',
      connected: true,
    }

    cachedClasses = classes
    cachedStats = stats
    return { classes, stats }
  } catch {
    return {
      classes: KOREAN_HANDWRITING_DATASET,
      stats: {
        serverInstance: SQL_SERVER_CONFIG.serverInstance,
        database: SQL_SERVER_CONFIG.database,
        totalClasses: 64,
        originalSamplesCount: 6400,
        augmentedSamplesCount: 128000,
        totalSamplesCount: 134400,
        originalBinarySizeMB: 14.93,
        totalUncompressedSizeMB: 182.9,
        storageStrategy: 'Hybrid VARBINARY(MAX) (6,400 ảnh gốc) + Metadata Catalog (128,000 ảnh mở rộng)',
        connected: false,
      },
    }
  }
}

/**
 * Truy vấn dữ liệu nhị phân ảnh viết tay (VARBINARY(MAX)) trực tiếp từ SQL Server
 */
export async function queryHandwritingImageFromSqlServer(
  folder: string,
  sampleIndex: number,
): Promise<{ buffer: Buffer; mimeType: string; fileName: string } | null> {
  const safeFolder = folder.replace(/[^a-zA-Z0-9_-]/g, '')
  const safeIndex = Math.max(0, Math.min(99, Math.floor(sampleIndex)))
  const cacheKey = `${safeFolder}_${safeIndex}`

  const cached = imageCache.get(cacheKey)
  if (cached) {
    return {
      buffer: cached,
      mimeType: 'image/jpeg',
      fileName: `${safeFolder}_${safeIndex}.jpg`,
    }
  }

  interface RawImageRow {
    FileName: string
    MimeType: string
    Base64Data: string
  }

  const rows = await executeSqlJsonQuery<RawImageRow[]>(`
    SELECT TOP 1
      FileName,
      MimeType,
      ImageBinary AS Base64Data
    FROM dbo.HangulHandwritingSamples
    WHERE FolderName = '${safeFolder}'
      AND SubsetType = 'orig'
      AND SampleIndex = ${safeIndex}
      AND ImageBinary IS NOT NULL
    FOR JSON PATH;
  `)

  if (!rows || rows.length === 0 || !rows[0].Base64Data) {
    return null
  }

  const buffer = Buffer.from(rows[0].Base64Data, 'base64')
  if (imageCache.size >= MAX_IMAGE_CACHE) {
    const firstKey = imageCache.keys().next().value
    if (firstKey) imageCache.delete(firstKey)
  }
  imageCache.set(cacheKey, buffer)

  return {
    buffer,
    mimeType: rows[0].MimeType || 'image/jpeg',
    fileName: rows[0].FileName || `${safeFolder}_${safeIndex}.jpg`,
  }
}
