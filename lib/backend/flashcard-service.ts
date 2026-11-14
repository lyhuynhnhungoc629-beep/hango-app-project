import fs from 'fs'
import path from 'path'
import { executeSqlJsonQuery, SQL_SERVER_CONFIG } from '@/lib/backend/sql-server'
import type { VocabularyItem } from '@/lib/backend/vocabulary-data'

export interface FlashcardSchemaStatus {
  connected: boolean
  serverInstance: string
  database: string
  hasVocabularyTable: boolean
  hasVocabularyTopicsTable: boolean
  hasVocabularyTopicMappingsTable: boolean
  hasCanonicalVocabIdColumn: boolean
  sqlVocabCount: number
  hangeulLessonVocabCount: number
  recommendedSqlScript: string
  missingComponents: string[]
}

export interface FlashcardTopicItem {
  topicId: number
  topicCode: string
  topicNameVi: string
  topicNameKo: string
  description: string
  iconName: string
  colorCode: string
  displayOrder: number
  isActive: boolean
  isAdminOnly: boolean
  isDeleted: boolean
  totalWordsCount: number
  activeWordsCount: number
  primaryWordsCount: number
  secondaryWordsCount: number
}

export type MappingReviewStatus = 'ACTIVE' | 'INACTIVE' | 'DUPLICATE_STANDBY' | 'GRAMMAR_AUXILIARY'

export interface FlashcardTopicMappingItem {
  mappingId: number
  vocabId: number
  topicId: number
  topicCode: string
  topicNameVi: string
  isPrimary: boolean
  reviewStatus: MappingReviewStatus
  classificationReason: string
  isDeleted: boolean
}

export interface FlashcardVocabRecord {
  vocabId: number
  vocabCode: string
  koreanWord: string
  hanja: string | null
  romanization: string
  vietnameseMeaning: string
  partOfSpeech: string
  explanationKo: string | null
  exampleSentenceKo: string
  exampleSentenceVi: string
  niklLevel: string | null
  topikLevel: string
  originalTopicName: string | null
  frequencyRank: number | null
  sourceId: number | null
  sourceName: string
  datasetOrApiName: string | null
  status: 'Published' | 'Hidden'
  canonicalVocabId: number | null
  canonicalWordKo: string | null
  isHangeulLessonLocked: boolean
  lessonLinksCount: number
  mappings: FlashcardTopicMappingItem[]
  primaryTopicId: number | null
  primaryTopicNameVi: string | null
}

export interface FlashcardAdminSummary {
  totalTopics: number
  activeStudentTopics: number
  adminOnlyTopics: number
  hiddenOrDeletedTopics: number
  totalVocabularies: number
  usedVocabCount: number
  unclassifiedVocabCount: number
  standbyVocabCount: number
  hiddenVocabCount: number
  hangeulLockedCount: number
  totalActiveMappings: number
}

interface StoredTopicRow {
  TopicId: number
  TopicCode: string
  TopicNameVi: string
  TopicNameKo: string
  Description: string
  IconName: string
  ColorCode: string
  DisplayOrder: number
  IsActive: number
  IsAdminOnly: number
  IsDeleted: number
}

interface StoredMappingRow {
  MappingId: number
  VocabId: number
  TopicId: number
  IsPrimary: number
  ReviewStatus: MappingReviewStatus
  ClassificationReason?: string
  IsDeleted: number
}

interface StoredVocabOverride {
  koreanWord?: string
  hanja?: string | null
  romanization?: string
  vietnameseMeaning?: string
  partOfSpeech?: string
  explanationKo?: string | null
  exampleSentenceKo?: string
  exampleSentenceVi?: string
  niklLevel?: string | null
  topikLevel?: string
  status?: 'Published' | 'Hidden'
  canonicalVocabId?: number | null
}

interface AddedVocabRow {
  vocabId: number
  vocabCode: string
  koreanWord: string
  hanja: string | null
  romanization: string
  vietnameseMeaning: string
  partOfSpeech: string
  explanationKo: string | null
  exampleSentenceKo: string
  exampleSentenceVi: string
  niklLevel: string | null
  topikLevel: string
  originalTopicName: string | null
  sourceId: number | null
  sourceName: string
  datasetOrApiName: string | null
  status: 'Published' | 'Hidden'
  canonicalVocabId: number | null
  createdAt: string
  updatedAt: string
}

interface FlashcardAdminPersistentState {
  version: string
  updatedAt: string
  topics: StoredTopicRow[]
  mappings: StoredMappingRow[]
  vocabOverrides: Record<string, StoredVocabOverride>
  addedVocabularies: AddedVocabRow[]
}

const DATA_DIR = path.join(process.cwd(), 'data')
const ADMIN_STATE_PATH = path.join(DATA_DIR, 'flashcard-admin-store.json')
const TOPICS_PROPOSAL_PATH = path.join(DATA_DIR, 'flashcard_topics_proposal_v4_3.json')
const MAPPINGS_PROPOSAL_PATH = path.join(DATA_DIR, 'flashcard_topic_mappings_proposal_v4_3.json')
const VOCAB_PROPOSAL_PATH = path.join(DATA_DIR, 'vocab_standardized_proposal_v4_3.json')

interface RawProposalVocab {
  VocabId: number
  VocabCode: string
  KoreanWord: string
  PartOfSpeech: string
  TopikLevel: string
  NiklLevel: string | null
  TopicName: string | null
  SourceId: number | null
  Status: string
  Original: {
    VietnameseMeaning: string
    Romanization: string
    ExampleSentenceKo: string
    ExampleSentenceVi: string
  }
  Proposed: {
    VietnameseMeaning: string
    Romanization: string
    ExampleSentenceKo: string
    ExampleSentenceVi: string
  }
  CanonicalVocabId: number | null
}

let cachedProposalMap: Map<number, RawProposalVocab> | null = null
let cachedSqlBaseVocab: {
  rows: BaseSqlVocabRow[]
  schemaStatus: FlashcardSchemaStatus
  fetchedAt: number
} | null = null

const SQL_CACHE_TTL_MS = 60 * 1000

interface BaseSqlVocabRow {
  VocabId: number
  VocabCode: string
  KoreanWord: string
  Hanja: string | null
  Romanization: string | null
  VietnameseMeaning: string
  PartOfSpeech: string
  ExplanationKo: string | null
  ExampleSentenceKo: string | null
  ExampleSentenceVi: string | null
  NiklLevel: string | null
  TopikLevel: string
  TopicName: string | null
  FrequencyRank: number | null
  SourceId: number | null
  SourceName: string | null
  DatasetOrApiName: string | null
  Status: string
  CanonicalVocabId?: number | null
  LessonLinksCount: number
}

function getProposalVocabMap(): Map<number, RawProposalVocab> {
  if (cachedProposalMap) return cachedProposalMap
  const map = new Map<number, RawProposalVocab>()
  try {
    if (fs.existsSync(VOCAB_PROPOSAL_PATH)) {
      const raw = JSON.parse(fs.readFileSync(VOCAB_PROPOSAL_PATH, 'utf8')) as RawProposalVocab[]
      for (const item of raw) {
        map.set(item.VocabId, item)
      }
    }
  } catch {
    // ignore
  }
  cachedProposalMap = map
  return map
}

function loadPersistentAdminState(): FlashcardAdminPersistentState {
  try {
    if (fs.existsSync(ADMIN_STATE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(ADMIN_STATE_PATH, 'utf8')) as FlashcardAdminPersistentState
      if (raw && Array.isArray(raw.topics) && Array.isArray(raw.mappings)) {
        return {
          version: raw.version || '4.6.1',
          updatedAt: raw.updatedAt || new Date().toISOString(),
          topics: raw.topics,
          mappings: raw.mappings,
          vocabOverrides: raw.vocabOverrides || {},
          addedVocabularies: raw.addedVocabularies || [],
        }
      }
    }
  } catch {
    // fall through to seed from proposal files
  }

  let initialTopics: StoredTopicRow[] = []
  let initialMappings: StoredMappingRow[] = []

  try {
    if (fs.existsSync(TOPICS_PROPOSAL_PATH)) {
      initialTopics = JSON.parse(fs.readFileSync(TOPICS_PROPOSAL_PATH, 'utf8')) as StoredTopicRow[]
    }
  } catch {
    initialTopics = []
  }

  try {
    if (fs.existsSync(MAPPINGS_PROPOSAL_PATH)) {
      const rawMappings = JSON.parse(fs.readFileSync(MAPPINGS_PROPOSAL_PATH, 'utf8')) as Array<{
        MappingId: number
        VocabId: number
        TopicId: number
        IsPrimary: number
        ReviewStatus: MappingReviewStatus
        ClassificationReason?: string
        IsDeleted: number
      }>
      initialMappings = rawMappings.map((m) => ({
        MappingId: m.MappingId,
        VocabId: m.VocabId,
        TopicId: m.TopicId,
        IsPrimary: m.IsPrimary ? 1 : 0,
        ReviewStatus: m.ReviewStatus || 'ACTIVE',
        ClassificationReason: m.ClassificationReason || '',
        IsDeleted: m.IsDeleted ? 1 : 0,
      }))
    }
  } catch {
    initialMappings = []
  }

  const seeded: FlashcardAdminPersistentState = {
    version: '4.6.1',
    updatedAt: new Date().toISOString(),
    topics: initialTopics,
    mappings: initialMappings,
    vocabOverrides: {},
    addedVocabularies: [],
  }

  savePersistentAdminState(seeded)
  return seeded
}

function savePersistentAdminState(state: FlashcardAdminPersistentState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    state.updatedAt = new Date().toISOString()
    fs.writeFileSync(ADMIN_STATE_PATH, JSON.stringify(state, null, 2), 'utf8')
  } catch {
    // ignore write error in read-only env
  }
}

/**
 * Kiểm tra schema thực tế trong HangoDatasetDB và đọc kho từ vựng gốc dbo.Vocabulary (chỉ SELECT, không chạy DDL/migration)
 */
async function loadSqlBaseVocabAndSchema(forceRefresh = false): Promise<{
  rows: BaseSqlVocabRow[]
  schemaStatus: FlashcardSchemaStatus
}> {
  if (!forceRefresh && cachedSqlBaseVocab && Date.now() - cachedSqlBaseVocab.fetchedAt < SQL_CACHE_TTL_MS) {
    return {
      rows: cachedSqlBaseVocab.rows,
      schemaStatus: cachedSqlBaseVocab.schemaStatus,
    }
  }

  const proposalMap = getProposalVocabMap()

  try {
    interface RawMetaRow {
      HasVocabularyTable: number
      HasTopicsTable: number
      HasMappingsTable: number
      HasCanonicalColumn: number
      TotalSqlVocabCount: number
      HangeulLessonVocabCount: number
    }

    const metaRows = await executeSqlJsonQuery<RawMetaRow[]>(`
      SELECT
        CASE WHEN OBJECT_ID('dbo.Vocabulary', 'U') IS NOT NULL THEN 1 ELSE 0 END AS HasVocabularyTable,
        CASE WHEN OBJECT_ID('dbo.VocabularyTopics', 'U') IS NOT NULL THEN 1 ELSE 0 END AS HasTopicsTable,
        CASE WHEN OBJECT_ID('dbo.VocabularyTopicMappings', 'U') IS NOT NULL THEN 1 ELSE 0 END AS HasMappingsTable,
        CASE WHEN COL_LENGTH('dbo.Vocabulary', 'CanonicalVocabId') IS NOT NULL THEN 1 ELSE 0 END AS HasCanonicalColumn,
        CASE WHEN OBJECT_ID('dbo.Vocabulary', 'U') IS NOT NULL THEN (SELECT COUNT(*) FROM dbo.Vocabulary) ELSE 0 END AS TotalSqlVocabCount,
        CASE WHEN OBJECT_ID('dbo.LessonVocabulary', 'U') IS NOT NULL THEN (SELECT COUNT(*) FROM dbo.LessonVocabulary WHERE VocabId BETWEEN 1 AND 36) ELSE 0 END AS HangeulLessonVocabCount
      FOR JSON PATH;
    `)

    const meta = metaRows[0] || {
      HasVocabularyTable: 1,
      HasTopicsTable: 0,
      HasMappingsTable: 0,
      HasCanonicalColumn: 0,
      TotalSqlVocabCount: 296,
      HangeulLessonVocabCount: 36,
    }

    const missingComponents: string[] = []
    if (!meta.HasTopicsTable) {
      missingComponents.push('Bảng dbo.VocabularyTopics (Danh mục 11 chủ đề Flashcard)')
    }
    if (!meta.HasMappingsTable) {
      missingComponents.push('Bảng dbo.VocabularyTopicMappings (474 liên kết nhiều-nhiều VocabId ↔ TopicId)')
    }
    if (!meta.HasCanonicalColumn) {
      missingComponents.push('Cột dbo.Vocabulary.CanonicalVocabId (Quy chiếu 6 cặp từ đồng nghĩa NIKL dự phòng)')
    }

    const schemaStatus: FlashcardSchemaStatus = {
      connected: true,
      serverInstance: SQL_SERVER_CONFIG.serverInstance,
      database: SQL_SERVER_CONFIG.database,
      hasVocabularyTable: Boolean(meta.HasVocabularyTable),
      hasVocabularyTopicsTable: Boolean(meta.HasTopicsTable),
      hasVocabularyTopicMappingsTable: Boolean(meta.HasMappingsTable),
      hasCanonicalVocabIdColumn: Boolean(meta.HasCanonicalColumn),
      sqlVocabCount: meta.TotalSqlVocabCount,
      hangeulLessonVocabCount: meta.HangeulLessonVocabCount,
      recommendedSqlScript: 'FINAL_DATABASE_DEPLOYMENT.sql',
      missingComponents,
    }

    const canonicalSelect = meta.HasCanonicalColumn ? 'v.CanonicalVocabId,' : ''
    const sqlRows = await executeSqlJsonQuery<BaseSqlVocabRow[]>(`
      SELECT
        v.VocabId,
        v.VocabCode,
        v.KoreanWord,
        v.Hanja,
        v.Romanization,
        v.VietnameseMeaning,
        v.PartOfSpeech,
        v.ExplanationKo,
        v.ExampleSentenceKo,
        v.ExampleSentenceVi,
        v.NiklLevel,
        v.TopikLevel,
        v.TopicName,
        v.FrequencyRank,
        v.SourceId,
        cs.SourceName,
        cs.DatasetOrApiName,
        v.Status,
        ${canonicalSelect}
        (SELECT COUNT(*) FROM dbo.LessonVocabulary lv WHERE lv.VocabId = v.VocabId) AS LessonLinksCount
      FROM dbo.Vocabulary v
      LEFT JOIN dbo.ContentSources cs ON cs.SourceId = v.SourceId
      ORDER BY v.VocabId ASC
      FOR JSON PATH;
    `)

    cachedSqlBaseVocab = {
      rows: sqlRows,
      schemaStatus,
      fetchedAt: Date.now(),
    }

    return { rows: sqlRows, schemaStatus }
  } catch {
    // Fallback từ dữ liệu đã đồng bộ từ dbo.Vocabulary nếu SQL Server bận
    const fallbackRows: BaseSqlVocabRow[] = Array.from(proposalMap.values()).map((item) => ({
      VocabId: item.VocabId,
      VocabCode: item.VocabCode,
      KoreanWord: item.KoreanWord,
      Hanja: null,
      Romanization: item.Proposed?.Romanization || item.Original?.Romanization || '',
      VietnameseMeaning: item.Proposed?.VietnameseMeaning || item.Original?.VietnameseMeaning || '',
      PartOfSpeech: item.PartOfSpeech,
      ExplanationKo: null,
      ExampleSentenceKo: item.Proposed?.ExampleSentenceKo || item.Original?.ExampleSentenceKo || '',
      ExampleSentenceVi: item.Proposed?.ExampleSentenceVi || item.Original?.ExampleSentenceVi || '',
      NiklLevel: item.NiklLevel,
      TopikLevel: item.TopikLevel,
      TopicName: item.TopicName,
      FrequencyRank: null,
      SourceId: item.SourceId,
      SourceName: item.SourceId === 15 ? 'Giáo trình Nhập môn Hangeul HANGO' : 'Viện Quốc ngữ Quốc gia Hàn Quốc (NIKL)',
      DatasetOrApiName: item.SourceId === 15 ? 'HANGO Core Hangeul 36' : 'NIKL Korean-Vietnamese Learner Dictionary',
      Status: 'Published',
      CanonicalVocabId: item.CanonicalVocabId,
      LessonLinksCount: item.VocabId <= 36 ? 1 : 0,
    }))

    const schemaStatus: FlashcardSchemaStatus = {
      connected: false,
      serverInstance: SQL_SERVER_CONFIG.serverInstance,
      database: SQL_SERVER_CONFIG.database,
      hasVocabularyTable: true,
      hasVocabularyTopicsTable: false,
      hasVocabularyTopicMappingsTable: false,
      hasCanonicalVocabIdColumn: false,
      sqlVocabCount: fallbackRows.length,
      hangeulLessonVocabCount: 36,
      recommendedSqlScript: 'FINAL_DATABASE_DEPLOYMENT.sql',
      missingComponents: [
        'Bảng dbo.VocabularyTopics (Danh mục 11 chủ đề Flashcard)',
        'Bảng dbo.VocabularyTopicMappings (474 liên kết nhiều-nhiều VocabId ↔ TopicId)',
        'Cột dbo.Vocabulary.CanonicalVocabId (Quy chiếu 6 cặp từ đồng nghĩa NIKL dự phòng)',
      ],
    }

    return { rows: fallbackRows, schemaStatus }
  }
}

/**
 * Xây dựng dữ liệu hợp nhất từ dbo.Vocabulary (SQL Server) + VocabularyTopics + VocabularyTopicMappings
 */
export async function buildUnifiedFlashcardDataset(forceRefresh = false): Promise<{
  schemaStatus: FlashcardSchemaStatus
  topics: FlashcardTopicItem[]
  vocabularies: FlashcardVocabRecord[]
  summary: FlashcardAdminSummary
}> {
  const { rows: sqlRows, schemaStatus } = await loadSqlBaseVocabAndSchema(forceRefresh)
  const proposalMap = getProposalVocabMap()
  const adminState = loadPersistentAdminState()

  // Map TopicId -> StoredTopicRow
  const topicRowMap = new Map<number, StoredTopicRow>()
  for (const t of adminState.topics) {
    topicRowMap.set(t.TopicId, t)
  }

  // Xây dựng danh sách từ vựng cơ sở từ SQL Server + Overrides + Added Vocabularies
  const rawVocabMap = new Map<number, FlashcardVocabRecord>()

  for (const r of sqlRows) {
    const proposal = proposalMap.get(r.VocabId)
    const override = adminState.vocabOverrides[String(r.VocabId)] || {}

    const defaultCanonical =
      r.CanonicalVocabId !== undefined
        ? r.CanonicalVocabId
        : proposal?.CanonicalVocabId !== undefined
          ? proposal.CanonicalVocabId
          : null

    const canonicalVocabId =
      override.canonicalVocabId !== undefined ? override.canonicalVocabId : defaultCanonical

    const standardizedRoman =
      override.romanization !== undefined
        ? override.romanization
        : proposal?.Proposed?.Romanization || r.Romanization || ''

    const standardizedMeaning =
      override.vietnameseMeaning !== undefined
        ? override.vietnameseMeaning
        : proposal?.Proposed?.VietnameseMeaning || r.VietnameseMeaning || ''

    const standardizedExKo =
      override.exampleSentenceKo !== undefined
        ? override.exampleSentenceKo
        : proposal?.Proposed?.ExampleSentenceKo || r.ExampleSentenceKo || ''

    const standardizedExVi =
      override.exampleSentenceVi !== undefined
        ? override.exampleSentenceVi
        : proposal?.Proposed?.ExampleSentenceVi || r.ExampleSentenceVi || ''

    const status: 'Published' | 'Hidden' =
      override.status || (r.Status === 'Hidden' ? 'Hidden' : 'Published')

    rawVocabMap.set(r.VocabId, {
      vocabId: r.VocabId,
      vocabCode: r.VocabCode,
      koreanWord: override.koreanWord || r.KoreanWord,
      hanja: override.hanja !== undefined ? override.hanja : r.Hanja || null,
      romanization: standardizedRoman,
      vietnameseMeaning: standardizedMeaning,
      partOfSpeech: override.partOfSpeech || r.PartOfSpeech || 'Danh từ',
      explanationKo: override.explanationKo !== undefined ? override.explanationKo : r.ExplanationKo || null,
      exampleSentenceKo: standardizedExKo,
      exampleSentenceVi: standardizedExVi,
      niklLevel: override.niklLevel !== undefined ? override.niklLevel : r.NiklLevel || null,
      topikLevel: override.topikLevel || r.TopikLevel || 'TOPIK I - Cấp 1',
      originalTopicName: r.TopicName || null,
      frequencyRank: r.FrequencyRank || null,
      sourceId: r.SourceId || null,
      sourceName:
        r.SourceName ||
        (r.SourceId === 15
          ? 'Giáo trình Nhập môn Hangeul HANGO'
          : 'Từ điển Học viên Hàn-Việt NIKL (National Institute of Korean Language)'),
      datasetOrApiName: r.DatasetOrApiName || null,
      status,
      canonicalVocabId,
      canonicalWordKo: null,
      isHangeulLessonLocked: r.VocabId >= 1 && r.VocabId <= 36 && r.LessonLinksCount > 0,
      lessonLinksCount: r.LessonLinksCount || (r.VocabId >= 1 && r.VocabId <= 36 ? 1 : 0),
      mappings: [],
      primaryTopicId: null,
      primaryTopicNameVi: null,
    })
  }

  // Nạp các từ vựng do Admin thêm mới
  for (const added of adminState.addedVocabularies) {
    const override = adminState.vocabOverrides[String(added.vocabId)] || {}
    rawVocabMap.set(added.vocabId, {
      vocabId: added.vocabId,
      vocabCode: added.vocabCode,
      koreanWord: override.koreanWord || added.koreanWord,
      hanja: override.hanja !== undefined ? override.hanja : added.hanja,
      romanization: override.romanization !== undefined ? override.romanization : added.romanization,
      vietnameseMeaning:
        override.vietnameseMeaning !== undefined ? override.vietnameseMeaning : added.vietnameseMeaning,
      partOfSpeech: override.partOfSpeech || added.partOfSpeech,
      explanationKo:
        override.explanationKo !== undefined ? override.explanationKo : added.explanationKo,
      exampleSentenceKo:
        override.exampleSentenceKo !== undefined ? override.exampleSentenceKo : added.exampleSentenceKo,
      exampleSentenceVi:
        override.exampleSentenceVi !== undefined ? override.exampleSentenceVi : added.exampleSentenceVi,
      niklLevel: override.niklLevel !== undefined ? override.niklLevel : added.niklLevel,
      topikLevel: override.topikLevel || added.topikLevel,
      originalTopicName: added.originalTopicName,
      frequencyRank: null,
      sourceId: added.sourceId,
      sourceName: added.sourceName || 'Quản trị viên HANGO (Admin)',
      datasetOrApiName: added.datasetOrApiName,
      status: override.status || added.status,
      canonicalVocabId:
        override.canonicalVocabId !== undefined ? override.canonicalVocabId : added.canonicalVocabId,
      canonicalWordKo: null,
      isHangeulLessonLocked: false,
      lessonLinksCount: 0,
      mappings: [],
      primaryTopicId: null,
      primaryTopicNameVi: null,
    })
  }

  // Giải quyết tên từ gốc cho các từ dự phòng có CanonicalVocabId
  for (const v of rawVocabMap.values()) {
    if (v.canonicalVocabId !== null) {
      const target = rawVocabMap.get(v.canonicalVocabId)
      if (target) {
        v.canonicalWordKo = `${target.koreanWord} (#${target.vocabId}: ${target.vietnameseMeaning})`
      }
    }
  }

  // Gắn Mappings vào từng từ vựng
  for (const m of adminState.mappings) {
    if (m.IsDeleted) continue
    const vocab = rawVocabMap.get(m.VocabId)
    const topic = topicRowMap.get(m.TopicId)
    if (!vocab || !topic) continue

    const mappingItem: FlashcardTopicMappingItem = {
      mappingId: m.MappingId,
      vocabId: m.VocabId,
      topicId: m.TopicId,
      topicCode: topic.TopicCode,
      topicNameVi: topic.TopicNameVi,
      isPrimary: Boolean(m.IsPrimary),
      reviewStatus: m.ReviewStatus,
      classificationReason: m.ClassificationReason || '',
      isDeleted: Boolean(m.IsDeleted),
    }

    vocab.mappings.push(mappingItem)
    if (mappingItem.isPrimary && !topic.IsDeleted) {
      vocab.primaryTopicId = topic.TopicId
      vocab.primaryTopicNameVi = topic.TopicNameVi
    }
  }

  // Nếu từ chưa có primaryTopicId nhưng có mapping khác, chọn mapping đầu tiên làm hiển thị
  for (const v of rawVocabMap.values()) {
    v.mappings.sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.topicId - b.topicId)
    if (v.primaryTopicId === null && v.mappings.length > 0) {
      v.primaryTopicId = v.mappings[0].topicId
      v.primaryTopicNameVi = v.mappings[0].topicNameVi
    }
  }

  // Tính toán thống kê cho từng Topic
  const topics: FlashcardTopicItem[] = adminState.topics
    .slice()
    .sort((a, b) => a.DisplayOrder - b.DisplayOrder || a.TopicId - b.TopicId)
    .map((t) => {
      let totalWordsCount = 0
      let activeWordsCount = 0
      let primaryWordsCount = 0
      let secondaryWordsCount = 0

      for (const v of rawVocabMap.values()) {
        const m = v.mappings.find((item) => item.topicId === t.TopicId && !item.isDeleted)
        if (!m) continue
        totalWordsCount++
        if (m.isPrimary) primaryWordsCount++
        else secondaryWordsCount++

        if (
          v.status === 'Published' &&
          v.canonicalVocabId === null &&
          m.reviewStatus === 'ACTIVE' &&
          !t.IsDeleted
        ) {
          activeWordsCount++
        }
      }

      return {
        topicId: t.TopicId,
        topicCode: t.TopicCode,
        topicNameVi: t.TopicNameVi,
        topicNameKo: t.TopicNameKo,
        description: t.Description || '',
        iconName: t.IconName || 'Sparkles',
        colorCode: t.ColorCode || '#7C3AED',
        displayOrder: t.DisplayOrder,
        isActive: Boolean(t.IsActive),
        isAdminOnly: Boolean(t.IsAdminOnly),
        isDeleted: Boolean(t.IsDeleted),
        totalWordsCount,
        activeWordsCount,
        primaryWordsCount,
        secondaryWordsCount,
      }
    })

  const activeTopicMap = new Map<number, FlashcardTopicItem>()
  for (const t of topics) {
    activeTopicMap.set(t.topicId, t)
  }

  const vocabularies = Array.from(rawVocabMap.values()).sort((a, b) => a.vocabId - b.vocabId)

  let usedVocabCount = 0
  let unclassifiedVocabCount = 0
  let standbyVocabCount = 0
  let hiddenVocabCount = 0
  let hangeulLockedCount = 0
  let totalActiveMappings = 0

  for (const v of vocabularies) {
    if (v.isHangeulLessonLocked) hangeulLockedCount++
    if (v.status === 'Hidden') hiddenVocabCount++
    if (v.canonicalVocabId !== null) {
      standbyVocabCount++
      continue
    }

    const activeMappingsInPublicTopics = v.mappings.filter((m) => {
      if (m.isDeleted || m.reviewStatus !== 'ACTIVE') return false
      const t = activeTopicMap.get(m.topicId)
      return Boolean(t && !t.isDeleted && !t.isAdminOnly && t.isActive)
    })

    const isMappedToUnclassified = v.mappings.some((m) => {
      if (m.isDeleted) return false
      const t = activeTopicMap.get(m.topicId)
      return Boolean(t && (t.isAdminOnly || t.topicCode === 'CHUA_PHAN_LOAI'))
    })

    if (v.status === 'Published' && activeMappingsInPublicTopics.length > 0) {
      usedVocabCount++
    }

    if (isMappedToUnclassified || activeMappingsInPublicTopics.length === 0) {
      unclassifiedVocabCount++
    }

    totalActiveMappings += v.mappings.filter((m) => !m.isDeleted).length
  }

  const summary: FlashcardAdminSummary = {
    totalTopics: topics.filter((t) => !t.isDeleted).length,
    activeStudentTopics: topics.filter((t) => !t.isDeleted && !t.isAdminOnly && t.isActive).length,
    adminOnlyTopics: topics.filter((t) => !t.isDeleted && t.isAdminOnly).length,
    hiddenOrDeletedTopics: topics.filter((t) => t.isDeleted || (!t.isActive && !t.isAdminOnly)).length,
    totalVocabularies: vocabularies.length,
    usedVocabCount,
    unclassifiedVocabCount,
    standbyVocabCount,
    hiddenVocabCount,
    hangeulLockedCount,
    totalActiveMappings,
  }

  return {
    schemaStatus,
    topics,
    vocabularies,
    summary,
  }
}

/**
 * Truy xuất danh sách thẻ Flashcard dành cho Student (Bảo vệ 100%: ẩn chủ đề Admin-only/Inactive/Deleted, ẩn từ dự phòng Standby & từ bị ẩn)
 */
export async function getStudentFlashcards(filters?: {
  level?: string | null
  topic?: string | null
  topicId?: number | null
  pos?: string | null
  q?: string | null
}): Promise<{
  topics: Array<{
    topicId: number
    topicCode: string
    topicNameVi: string
    topicNameKo: string
    description: string
    iconName: string
    colorCode: string
    activeWordsCount: number
    levels: string[]
    levelCounts: Record<string, number>
    vocabIds: number[]
  }>
  levels: string[]
  data: Array<
    VocabularyItem & {
      vocabId: number
      vocabCode: string
      hanja: string | null
      niklLevel: string | null
      sourceName: string
      topicId: number
      topicCode: string
      topics: Array<{ topicId: number; topicCode: string; topicNameVi: string; isPrimary: boolean }>
    }
  >
}> {
  const { topics, vocabularies } = await buildUnifiedFlashcardDataset()

  const LEVEL_ORDER = [
    'Nhập môn',
    'TOPIK I - Cấp 1',
    'TOPIK I - Cấp 2',
    'TOPIK II - Cấp 3',
  ]

  // Tính toán danh sách VocabId học được và phân bố cấp độ thực tế cho từng chủ đề của Student
  const topicMetaMap = new Map<
    number,
    { vocabIds: number[]; levelCounts: Record<string, number> }
  >()
  for (const t of topics) {
    if (t.isActive && !t.isAdminOnly && !t.isDeleted) {
      topicMetaMap.set(t.topicId, { vocabIds: [], levelCounts: {} })
    }
  }

  for (const v of vocabularies) {
    if (v.status !== 'Published' || v.canonicalVocabId !== null) continue
    const lv = v.topikLevel || 'TOPIK I - Cấp 1'
    for (const m of v.mappings) {
      if (m.isDeleted || m.reviewStatus !== 'ACTIVE') continue
      const meta = topicMetaMap.get(m.topicId)
      if (!meta) continue
      meta.vocabIds.push(v.vocabId)
      meta.levelCounts[lv] = (meta.levelCounts[lv] || 0) + 1
    }
  }

  // Student chỉ được xem các chủ đề: IsActive = 1, IsAdminOnly = 0, IsDeleted = 0
  const studentTopics = topics
    .filter((t) => t.isActive && !t.isAdminOnly && !t.isDeleted)
    .map((t) => {
      const meta = topicMetaMap.get(t.topicId) || { vocabIds: [], levelCounts: {} }
      const levels = Object.keys(meta.levelCounts).sort(
        (a, b) =>
          (LEVEL_ORDER.indexOf(a) === -1 ? 99 : LEVEL_ORDER.indexOf(a)) -
          (LEVEL_ORDER.indexOf(b) === -1 ? 99 : LEVEL_ORDER.indexOf(b)),
      )
      return {
        topicId: t.topicId,
        topicCode: t.topicCode,
        topicNameVi: t.topicNameVi,
        topicNameKo: t.topicNameKo,
        description: t.description,
        iconName: t.iconName,
        colorCode: t.colorCode,
        activeWordsCount: meta.vocabIds.length,
        levels,
        levelCounts: meta.levelCounts,
        vocabIds: meta.vocabIds,
      }
    })

  const allowedTopicMap = new Map<number, (typeof studentTopics)[number]>()
  for (const st of studentTopics) {
    allowedTopicMap.set(st.topicId, st)
  }

  let requestedTopicId: number | null = filters?.topicId ?? null
  if (!requestedTopicId && filters?.topic && filters.topic !== 'all' && filters.topic !== 'Tất cả') {
    const rawTopic = filters.topic.trim()
    const asNum = Number(rawTopic)
    if (Number.isFinite(asNum) && allowedTopicMap.has(asNum)) {
      requestedTopicId = asNum
    } else {
      const matched = studentTopics.find(
        (t) =>
          t.topicCode.toLowerCase() === rawTopic.toLowerCase() ||
          t.topicNameVi.toLowerCase() === rawTopic.toLowerCase(),
      )
      if (matched) {
        requestedTopicId = matched.topicId
      } else {
        // Nếu Student truyền tên/mã của chủ đề ẩn hoặc chủ đề Admin-only -> trả về danh sách rỗng
        return {
          topics: studentTopics,
          levels: ['Tất cả', 'Nhập môn', 'TOPIK I - Cấp 1', 'TOPIK I - Cấp 2', 'TOPIK II - Cấp 3'],
          data: [],
        }
      }
    }
  }

  // Nếu truyền topicId nhưng topicId đó không nằm trong danh sách chủ đề hợp lệ của Student -> chặn
  if (requestedTopicId !== null && !allowedTopicMap.has(requestedTopicId)) {
    return {
      topics: studentTopics,
      levels: ['Tất cả', 'Nhập môn', 'TOPIK I - Cấp 1', 'TOPIK I - Cấp 2', 'TOPIK II - Cấp 3'],
      data: [],
    }
  }

  const levelFilter =
    filters?.level && filters.level !== 'all' && filters.level !== 'Tất cả'
      ? filters.level.trim()
      : null
  const posFilter =
    filters?.pos && filters.pos !== 'all' && filters.pos !== 'Tất cả' ? filters.pos.trim() : null
  const qFilter = filters?.q ? filters.q.trim().toLowerCase() : null

  const result: Array<
    VocabularyItem & {
      vocabId: number
      vocabCode: string
      hanja: string | null
      niklLevel: string | null
      sourceName: string
      topicId: number
      topicCode: string
      topics: Array<{ topicId: number; topicCode: string; topicNameVi: string; isPrimary: boolean }>
    }
  > = []

  for (const v of vocabularies) {
    // 1. Chặn từ bị ẩn hoặc từ dự phòng trùng lặp (CanonicalVocabId !== null)
    if (v.status !== 'Published' || v.canonicalVocabId !== null) continue

    // 2. Lấy các mapping ACTIVE thuộc chủ đề được phép hiển thị cho Student
    const validStudentMappings = v.mappings.filter(
      (m) => !m.isDeleted && m.reviewStatus === 'ACTIVE' && allowedTopicMap.has(m.topicId),
    )
    if (validStudentMappings.length === 0) continue

    // 3. Nếu lọc theo chủ đề cụ thể, kiểm tra từ có thuộc chủ đề đó không (cả chính hoặc phụ)
    let displayMapping = validStudentMappings.find((m) => m.isPrimary) || validStudentMappings[0]
    if (requestedTopicId !== null) {
      const matchedTopicMapping = validStudentMappings.find((m) => m.topicId === requestedTopicId)
      if (!matchedTopicMapping) continue
      displayMapping = matchedTopicMapping
    }

    // 4. Lọc theo cấp độ TOPIK
    if (levelFilter && v.topikLevel !== levelFilter) continue

    // 5. Lọc theo từ loại
    if (posFilter && v.partOfSpeech !== posFilter) continue

    // 6. Tìm kiếm theo từ tiếng Hàn, nghĩa tiếng Việt, Romanization
    if (qFilter) {
      const matchKo = v.koreanWord.toLowerCase().includes(qFilter)
      const matchVi = v.vietnameseMeaning.toLowerCase().includes(qFilter)
      const matchRoman = v.romanization.toLowerCase().includes(qFilter)
      if (!matchKo && !matchVi && !matchRoman) continue
    }

    result.push({
      id: String(v.vocabId), // Dùng chung VocabId duy nhất cho SRS trên mọi chủ đề
      vocabId: v.vocabId,
      vocabCode: v.vocabCode,
      ko: v.koreanWord,
      roman: v.romanization,
      meaning: v.vietnameseMeaning,
      pos: (v.partOfSpeech as VocabularyItem['pos']) || 'Danh từ',
      hanja: v.hanja,
      level: (v.topikLevel as VocabularyItem['level']) || 'TOPIK I - Cấp 1',
      niklLevel: v.niklLevel,
      topic: displayMapping.topicNameVi,
      topicId: displayMapping.topicId,
      topicCode: displayMapping.topicCode,
      topics: validStudentMappings.map((m) => ({
        topicId: m.topicId,
        topicCode: m.topicCode,
        topicNameVi: m.topicNameVi,
        isPrimary: m.isPrimary,
      })),
      exKo: v.exampleSentenceKo,
      exVi: v.exampleSentenceVi,
      sourceName: v.sourceName,
      grammarNote: v.explanationKo || undefined,
    })
  }

  return {
    topics: studentTopics,
    levels: ['Tất cả', 'Nhập môn', 'TOPIK I - Cấp 1', 'TOPIK I - Cấp 2', 'TOPIK II - Cấp 3'],
    data: result,
  }
}

/**
 * Tìm chi tiết 1 từ vựng theo VocabId, VocabCode hoặc KoreanWord (hỗ trợ Canonical Resolution cho SRS)
 */
export async function findFlashcardVocabularyByIdOrWord(identifier: string | number): Promise<{
  vocab: FlashcardVocabRecord
  resolvedCanonicalVocabId: number
} | null> {
  const { vocabularies } = await buildUnifiedFlashcardDataset()
  const raw = String(identifier).trim()
  const asNum = Number(raw)

  let found = vocabularies.find(
    (v) =>
      (Number.isFinite(asNum) && v.vocabId === asNum) ||
      v.vocabCode.toLowerCase() === raw.toLowerCase() ||
      v.koreanWord === raw,
  )

  if (!found && raw.startsWith('v')) {
    const stripped = Number(raw.slice(1))
    if (Number.isFinite(stripped)) {
      found = vocabularies.find((v) => v.vocabId === stripped)
    }
  }

  if (!found) return null

  const resolvedCanonicalVocabId =
    found.canonicalVocabId !== null ? found.canonicalVocabId : found.vocabId

  return {
    vocab: found,
    resolvedCanonicalVocabId,
  }
}

/**
 * ADMIN: Thêm chủ đề Flashcard mới
 */
export async function createFlashcardTopic(input: {
  topicNameVi: string
  topicNameKo?: string
  topicCode?: string
  description?: string
  iconName?: string
  colorCode?: string
  displayOrder?: number
  isActive?: boolean
  isAdminOnly?: boolean
}): Promise<FlashcardTopicItem> {
  const topicNameVi = String(input.topicNameVi || '').trim()
  if (!topicNameVi) {
    throw new Error('Tên chủ đề tiếng Việt không được để trống.')
  }

  const state = loadPersistentAdminState()
  const maxId = state.topics.reduce((max, t) => Math.max(max, t.TopicId), 0)
  const newTopicId = maxId + 1

  const rawCode = String(input.topicCode || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '_')
  const generatedCode =
    rawCode ||
    topicNameVi
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_|_$/g, '')
      .slice(0, 40) ||
    `TOPIC_${newTopicId}`

  const duplicateCode = state.topics.some(
    (t) => t.TopicCode.toUpperCase() === generatedCode.toUpperCase(),
  )
  const finalCode = duplicateCode ? `${generatedCode}_${newTopicId}` : generatedCode

  const isAdminOnly = Boolean(input.isAdminOnly)
  const isActive = isAdminOnly ? false : input.isActive !== undefined ? Boolean(input.isActive) : true

  const newRow: StoredTopicRow = {
    TopicId: newTopicId,
    TopicCode: finalCode,
    TopicNameVi: topicNameVi,
    TopicNameKo: String(input.topicNameKo || '').trim() || '한국어 주제',
    Description: String(input.description || '').trim(),
    IconName: String(input.iconName || 'Sparkles').trim(),
    ColorCode: String(input.colorCode || '#7C3AED').trim(),
    DisplayOrder: Number(input.displayOrder) || newTopicId,
    IsActive: isActive ? 1 : 0,
    IsAdminOnly: isAdminOnly ? 1 : 0,
    IsDeleted: 0,
  }

  state.topics.push(newRow)
  savePersistentAdminState(state)

  const { topics } = await buildUnifiedFlashcardDataset(false)
  const created = topics.find((t) => t.topicId === newTopicId)
  if (!created) {
    throw new Error('Không thể tạo chủ đề mới.')
  }
  return created
}

/**
 * ADMIN: Chỉnh sửa chủ đề Flashcard (tên, mô tả, biểu tượng, bật/tắt hiển thị cho Student, ẩn/khôi phục)
 */
export async function updateFlashcardTopic(
  topicId: number,
  input: {
    topicNameVi?: string
    topicNameKo?: string
    description?: string
    iconName?: string
    colorCode?: string
    displayOrder?: number
    isActive?: boolean
    isAdminOnly?: boolean
    isDeleted?: boolean
  },
): Promise<FlashcardTopicItem> {
  const state = loadPersistentAdminState()
  const idx = state.topics.findIndex((t) => t.TopicId === topicId)
  if (idx === -1) {
    throw new Error(`Không tìm thấy chủ đề với TopicId = ${topicId}.`)
  }

  const current = state.topics[idx]

  if (input.topicNameVi !== undefined) {
    const trimmed = String(input.topicNameVi).trim()
    if (!trimmed) {
      throw new Error('Tên chủ đề tiếng Việt không được để trống.')
    }
    current.TopicNameVi = trimmed
  }
  if (input.topicNameKo !== undefined) {
    current.TopicNameKo = String(input.topicNameKo).trim()
  }
  if (input.description !== undefined) {
    current.Description = String(input.description).trim()
  }
  if (input.iconName !== undefined) {
    current.IconName = String(input.iconName).trim() || 'Sparkles'
  }
  if (input.colorCode !== undefined) {
    current.ColorCode = String(input.colorCode).trim() || '#7C3AED'
  }
  if (input.displayOrder !== undefined && Number.isFinite(Number(input.displayOrder))) {
    current.DisplayOrder = Number(input.displayOrder)
  }

  // Bảo vệ chủ đề 11 (Chưa phân loại - Ngữ pháp/Trừu tượng) luôn là chủ đề nội bộ Admin
  if (current.TopicCode === 'CHUA_PHAN_LOAI' || current.TopicId === 11) {
    current.IsAdminOnly = 1
    current.IsActive = 0
  } else {
    if (input.isAdminOnly !== undefined) {
      current.IsAdminOnly = input.isAdminOnly ? 1 : 0
      if (current.IsAdminOnly === 1) {
        current.IsActive = 0
      }
    }
    if (input.isActive !== undefined) {
      current.IsActive = current.IsAdminOnly === 1 ? 0 : input.isActive ? 1 : 0
    }
  }

  if (input.isDeleted !== undefined) {
    current.IsDeleted = input.isDeleted ? 1 : 0
    if (current.IsDeleted === 1) {
      current.IsActive = 0
    }
  }

  state.topics[idx] = current
  savePersistentAdminState(state)

  const { topics } = await buildUnifiedFlashcardDataset(false)
  const updated = topics.find((t) => t.topicId === topicId)
  if (!updated) {
    throw new Error('Không thể cập nhật chủ đề.')
  }
  return updated
}

/**
 * ADMIN: Gán một từ vựng (VocabId) vào một hoặc nhiều chủ đề (1 chủ đề chính + nhiều chủ đề phụ)
 */
export async function setVocabularyTopicAssignments(
  vocabId: number,
  input: {
    primaryTopicId?: number | null
    topicIds: number[]
    classificationReason?: string
  },
): Promise<FlashcardVocabRecord> {
  const state = loadPersistentAdminState()
  const { vocabularies } = await buildUnifiedFlashcardDataset(false)
  const targetVocab = vocabularies.find((v) => v.vocabId === vocabId)
  if (!targetVocab) {
    throw new Error(`Không tìm thấy từ vựng với VocabId = ${vocabId}.`)
  }

  const validTopicIds = Array.from(
    new Set(
      (input.topicIds || [])
        .map((id) => Number(id))
        .filter((id) => state.topics.some((t) => t.TopicId === id && !t.IsDeleted)),
    ),
  )

  // Nếu từ đã được gán vào ít nhất 1 chủ đề học tập (1..10), tự động loại bỏ chủ đề 11 (CHUA_PHAN_LOAI) nếu có chọn lẫn
  const publicSelected = validTopicIds.filter((id) => {
    const t = state.topics.find((row) => row.TopicId === id)
    return t && !t.IsAdminOnly && t.TopicCode !== 'CHUA_PHAN_LOAI'
  })

  const finalTopicIds =
    publicSelected.length > 0
      ? publicSelected
      : validTopicIds.length > 0
        ? validTopicIds
        : [11] // Nếu bỏ gán hết tất cả chủ đề, đưa về chủ đề 11 (Chưa phân loại - nội bộ Admin)

  let primaryId =
    input.primaryTopicId && finalTopicIds.includes(Number(input.primaryTopicId))
      ? Number(input.primaryTopicId)
      : finalTopicIds[0]

  // Nếu là từ dự phòng (CanonicalVocabId !== null), luôn giữ trạng thái DUPLICATE_STANDBY và IsPrimary = 0
  const isStandby = targetVocab.canonicalVocabId !== null

  // Đánh dấu IsDeleted = 1 cho các mapping cũ không nằm trong danh sách mới
  for (const m of state.mappings) {
    if (m.VocabId === vocabId) {
      if (!finalTopicIds.includes(m.TopicId)) {
        m.IsDeleted = 1
        m.IsPrimary = 0
      }
    }
  }

  let maxMappingId = state.mappings.reduce((max, m) => Math.max(max, m.MappingId), 0)

  for (const tid of finalTopicIds) {
    const topicRow = state.topics.find((t) => t.TopicId === tid)
    const isUnclassifiedTopic = Boolean(
      topicRow && (topicRow.IsAdminOnly || topicRow.TopicCode === 'CHUA_PHAN_LOAI'),
    )

    const reviewStatus: MappingReviewStatus = isStandby
      ? 'DUPLICATE_STANDBY'
      : isUnclassifiedTopic
        ? 'GRAMMAR_AUXILIARY'
        : 'ACTIVE'

    const isPrimary = !isStandby && !isUnclassifiedTopic && tid === primaryId ? 1 : 0

    const existing = state.mappings.find((m) => m.VocabId === vocabId && m.TopicId === tid)
    if (existing) {
      existing.IsDeleted = 0
      existing.IsPrimary = isPrimary
      existing.ReviewStatus = reviewStatus
      if (input.classificationReason) {
        existing.ClassificationReason = input.classificationReason
      }
    } else {
      maxMappingId++
      state.mappings.push({
        MappingId: maxMappingId,
        VocabId: vocabId,
        TopicId: tid,
        IsPrimary: isPrimary,
        ReviewStatus: reviewStatus,
        ClassificationReason:
          input.classificationReason ||
          (isPrimary ? 'Chủ đề chính do Admin phân loại' : 'Chủ đề phụ do Admin gán'),
        IsDeleted: 0,
      })
    }
  }

  savePersistentAdminState(state)

  const refreshed = await buildUnifiedFlashcardDataset(false)
  const updated = refreshed.vocabularies.find((v) => v.vocabId === vocabId)
  if (!updated) {
    throw new Error('Không thể cập nhật phân loại chủ đề cho từ vựng.')
  }
  return updated
}

/**
 * ADMIN: Thêm từ vựng mới vào kho từ vựng và gán vào một hoặc nhiều chủ đề
 */
export async function createFlashcardVocabulary(input: {
  koreanWord: string
  romanization?: string
  vietnameseMeaning: string
  partOfSpeech?: string
  hanja?: string | null
  explanationKo?: string | null
  exampleSentenceKo?: string
  exampleSentenceVi?: string
  topikLevel?: string
  niklLevel?: string | null
  primaryTopicId?: number | null
  topicIds?: number[]
}): Promise<FlashcardVocabRecord> {
  const koreanWord = String(input.koreanWord || '').trim()
  const vietnameseMeaning = String(input.vietnameseMeaning || '').trim()

  if (!koreanWord || !vietnameseMeaning) {
    throw new Error('Từ tiếng Hàn và Nghĩa tiếng Việt là bắt buộc.')
  }

  const { vocabularies } = await buildUnifiedFlashcardDataset(false)
  const state = loadPersistentAdminState()

  const maxVocabId = vocabularies.reduce((max, v) => Math.max(max, v.vocabId), 500)
  const newVocabId = maxVocabId + 1
  const nowIso = new Date().toISOString()

  const newAddedRow: AddedVocabRow = {
    vocabId: newVocabId,
    vocabCode: `VC_ADM_${newVocabId}`,
    koreanWord,
    hanja: input.hanja ? String(input.hanja).trim() : null,
    romanization: String(input.romanization || '').trim(),
    vietnameseMeaning,
    partOfSpeech: String(input.partOfSpeech || 'Danh từ').trim(),
    explanationKo: input.explanationKo ? String(input.explanationKo).trim() : null,
    exampleSentenceKo: String(input.exampleSentenceKo || '').trim(),
    exampleSentenceVi: String(input.exampleSentenceVi || '').trim(),
    niklLevel: input.niklLevel ? String(input.niklLevel).trim() : null,
    topikLevel: String(input.topikLevel || 'TOPIK I - Cấp 1').trim(),
    originalTopicName: null,
    sourceId: null,
    sourceName: 'Quản trị viên HANGO (Admin)',
    datasetOrApiName: 'HANGO Admin Vocabulary Pool',
    status: 'Published',
    canonicalVocabId: null,
    createdAt: nowIso,
    updatedAt: nowIso,
  }

  state.addedVocabularies.push(newAddedRow)
  savePersistentAdminState(state)

  const topicIds =
    Array.isArray(input.topicIds) && input.topicIds.length > 0
      ? input.topicIds
      : input.primaryTopicId
        ? [Number(input.primaryTopicId)]
        : [8] // Mặc định Giao tiếp hằng ngày nếu không truyền

  return setVocabularyTopicAssignments(newVocabId, {
    primaryTopicId: input.primaryTopicId ?? topicIds[0],
    topicIds,
    classificationReason: 'Thêm mới từ trình quản lý Flashcard Admin',
  })
}

/**
 * ADMIN: Chỉnh sửa thông tin từ vựng, ẩn/hiện từ vựng và cập nhật chủ đề
 */
export async function updateFlashcardVocabulary(
  vocabId: number,
  input: {
    koreanWord?: string
    romanization?: string
    vietnameseMeaning?: string
    partOfSpeech?: string
    hanja?: string | null
    explanationKo?: string | null
    exampleSentenceKo?: string
    exampleSentenceVi?: string
    topikLevel?: string
    niklLevel?: string | null
    status?: 'Published' | 'Hidden'
    primaryTopicId?: number | null
    topicIds?: number[]
  },
): Promise<FlashcardVocabRecord> {
  const { vocabularies } = await buildUnifiedFlashcardDataset(false)
  const existing = vocabularies.find((v) => v.vocabId === vocabId)
  if (!existing) {
    throw new Error(`Không tìm thấy từ vựng với VocabId = ${vocabId}.`)
  }

  const state = loadPersistentAdminState()
  const key = String(vocabId)
  const currentOverride: StoredVocabOverride = state.vocabOverrides[key] || {}

  if (input.koreanWord !== undefined) {
    const trimmed = String(input.koreanWord).trim()
    if (!trimmed) {
      throw new Error('Từ tiếng Hàn không được để trống.')
    }
    currentOverride.koreanWord = trimmed
  }
  if (input.vietnameseMeaning !== undefined) {
    const trimmed = String(input.vietnameseMeaning).trim()
    if (!trimmed) {
      throw new Error('Nghĩa tiếng Việt không được để trống.')
    }
    currentOverride.vietnameseMeaning = trimmed
  }
  if (input.romanization !== undefined) {
    currentOverride.romanization = String(input.romanization).trim()
  }
  if (input.partOfSpeech !== undefined) {
    currentOverride.partOfSpeech = String(input.partOfSpeech).trim() || 'Danh từ'
  }
  if (input.hanja !== undefined) {
    const h = input.hanja ? String(input.hanja).trim() : null
    currentOverride.hanja = h || null
  }
  if (input.explanationKo !== undefined) {
    const exp = input.explanationKo ? String(input.explanationKo).trim() : null
    currentOverride.explanationKo = exp || null
  }
  if (input.exampleSentenceKo !== undefined) {
    currentOverride.exampleSentenceKo = String(input.exampleSentenceKo).trim()
  }
  if (input.exampleSentenceVi !== undefined) {
    currentOverride.exampleSentenceVi = String(input.exampleSentenceVi).trim()
  }
  if (input.topikLevel !== undefined) {
    currentOverride.topikLevel = String(input.topikLevel).trim()
  }
  if (input.niklLevel !== undefined) {
    const nl = input.niklLevel ? String(input.niklLevel).trim() : null
    currentOverride.niklLevel = nl || null
  }
  if (input.status !== undefined) {
    currentOverride.status = input.status === 'Hidden' ? 'Hidden' : 'Published'
  }

  state.vocabOverrides[key] = currentOverride
  savePersistentAdminState(state)

  if (Array.isArray(input.topicIds)) {
    return setVocabularyTopicAssignments(vocabId, {
      primaryTopicId: input.primaryTopicId,
      topicIds: input.topicIds,
    })
  }

  const refreshed = await buildUnifiedFlashcardDataset(false)
  const updated = refreshed.vocabularies.find((v) => v.vocabId === vocabId)
  if (!updated) {
    throw new Error('Không thể cập nhật từ vựng.')
  }
  return updated
}
