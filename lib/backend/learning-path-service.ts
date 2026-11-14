import { execFile } from 'child_process'
import { promisify } from 'util'
import { SQL_SERVER_CONFIG } from '@/lib/backend/sql-server'
import { getAllStudentAccounts } from '@/lib/backend/user-store'

const execFileAsync = promisify(execFile)

async function executeSqlJsonQuery<T>(sqlQuery: string): Promise<T> {
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
    return [] as unknown as T
  }
  return JSON.parse(cleaned) as T
}

function sqlStr(val: string | null | undefined): string {
  if (val === null || val === undefined) return 'NULL'
  return `N'${String(val).replace(/'/g, "''")}'`
}

function sqlInt(val: number | string | null | undefined, fallback = 0): number {
  const n = Number(val)
  return Number.isFinite(n) ? Math.floor(n) : fallback
}

export type UnlockStatusType = 'Locked' | 'Available' | 'InProgress' | 'Completed'

export function mapUnlockStatusLabelVi(status: string): string {
  switch (status) {
    case 'Completed':
      return 'Đã hoàn thành'
    case 'InProgress':
      return 'Đang học'
    case 'Available':
      return 'Có thể học'
    default:
      return 'Chưa mở khóa'
  }
}

/**
 * Khởi tạo tiến độ ban đầu trong SQL Server (dbo.UserLearningProgress, dbo.UserLevelProgress, dbo.UserLessonProgress)
 * cho học viên mới hoặc học viên lần đầu truy cập lộ trình (Idempotent, không ghi đè tiến độ đã có).
 */
export async function ensureUserLearningProgressInitialized(userUid: string): Promise<void> {
  const safeUid = sqlStr(userUid)
  await executeSqlJsonQuery<Array<{ Initialized: number }>>(`
    DECLARE @Uid NVARCHAR(128) = ${safeUid};
    DECLARE @PathId INT = (SELECT TOP 1 PathId FROM dbo.LearningPaths WHERE Status = 'Published' ORDER BY PathId ASC);
    DECLARE @FirstLevelId INT = (SELECT TOP 1 LevelId FROM dbo.LearningLevels WHERE PathId = @PathId AND Status = 'Published' ORDER BY DisplayOrder ASC);
    DECLARE @FirstLessonId INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LevelId = @FirstLevelId AND Status = 'Published' ORDER BY DisplayOrder ASC);
    DECLARE @FirstActivityId INT = (SELECT TOP 1 ActivityId FROM dbo.LessonActivities WHERE LessonId = @FirstLessonId AND Status = 'Published' ORDER BY DisplayOrder ASC);

    -- 1. Khởi tạo UserLevelProgress cho cả 7 chặng nếu chưa có
    INSERT INTO dbo.UserLevelProgress (UserUid, LevelId, UnlockStatus, CompletedLessonsCount, TotalLessonsCount, ProgressPercent, UnlockedAt)
    SELECT
      @Uid,
      lv.LevelId,
      CASE WHEN lv.LevelId = @FirstLevelId THEN 'InProgress' ELSE 'Locked' END,
      0,
      (SELECT COUNT(*) FROM dbo.Lessons ls WHERE ls.LevelId = lv.LevelId AND ls.Status = 'Published'),
      0,
      CASE WHEN lv.LevelId = @FirstLevelId THEN SYSUTCDATETIME() ELSE NULL END
    FROM dbo.LearningLevels lv
    WHERE lv.PathId = @PathId
      AND lv.Status = 'Published'
      AND NOT EXISTS (
        SELECT 1 FROM dbo.UserLevelProgress ulp WHERE ulp.UserUid = @Uid AND ulp.LevelId = lv.LevelId
      );

    -- 2. Khởi tạo UserLessonProgress cho tất cả các buổi học đã xuất bản nếu chưa có
    INSERT INTO dbo.UserLessonProgress (
      UserUid, LessonId, LevelId, UnlockStatus,
      CompletedRequiredActivities, TotalRequiredActivities,
      BestQuizScorePercent, QuizAttemptsCount, ProgressPercent, UnlockedAt
    )
    SELECT
      @Uid,
      ls.LessonId,
      ls.LevelId,
      CASE WHEN ls.LessonId = @FirstLessonId THEN 'InProgress' ELSE 'Locked' END,
      0,
      (SELECT COUNT(*) FROM dbo.LessonActivities act WHERE act.LessonId = ls.LessonId AND act.IsRequired = 1 AND act.Status = 'Published'),
      0,
      0,
      0,
      CASE WHEN ls.LessonId = @FirstLessonId THEN SYSUTCDATETIME() ELSE NULL END
    FROM dbo.Lessons ls
    WHERE ls.Status = 'Published'
      AND NOT EXISTS (
        SELECT 1 FROM dbo.UserLessonProgress ulsp WHERE ulsp.UserUid = @Uid AND ulsp.LessonId = ls.LessonId
      );

    -- 3. Khởi tạo UserLearningProgress tổng thể nếu chưa có
    IF NOT EXISTS (SELECT 1 FROM dbo.UserLearningProgress WHERE UserUid = @Uid)
    BEGIN
      INSERT INTO dbo.UserLearningProgress (
        UserUid, PathId, CurrentLevelId, CurrentLessonId, CurrentActivityId,
        CompletedLessonsCount, OverallProgressPercent, TotalXpEarned
      ) VALUES (
        @Uid, @PathId, @FirstLevelId, @FirstLessonId, @FirstActivityId,
        0, 0, 0
      );
    END

    -- 4. Đồng bộ lại tổng số buổi mỗi chặng phòng khi Admin thêm buổi học mới
    UPDATE ulp
    SET TotalLessonsCount = (SELECT COUNT(*) FROM dbo.Lessons ls WHERE ls.LevelId = ulp.LevelId AND ls.Status = 'Published')
    FROM dbo.UserLevelProgress ulp
    WHERE ulp.UserUid = @Uid;

    SELECT 1 AS Initialized FOR JSON PATH;
  `)
}

/**
 * 1. GET /api/learning-path
 * Lấy toàn bộ lộ trình 7 chặng, số lượng chủ đề & buổi học thực tế từ SQL Server, trạng thái mở khóa và tiến độ cá nhân
 */
export async function getLearningPathForUser(userUid: string, isSelfAdmin = false) {
  await ensureUserLearningProgressInitialized(userUid)
  const safeUid = sqlStr(userUid)

  interface RawPathOverview {
    PathId: number
    PathCode: string
    Title: string
    Subtitle: string
    Description: string
    CurrentLevelId: number
    CurrentLevelBadge: string
    CurrentLevelTitle: string
    CurrentLessonId: number
    CurrentLessonCode: string
    CurrentLessonTitle: string
    CurrentActivityId: number | null
    CompletedLessonsCount: number
    TotalPublishedLessons: number
    OverallProgressPercent: number
    TotalXpEarned: number
  }

  const overviewRows = await executeSqlJsonQuery<RawPathOverview[]>(`
    DECLARE @Uid NVARCHAR(128) = ${safeUid};
    SELECT TOP 1
      lp.PathId,
      lp.PathCode,
      lp.Title,
      lp.Subtitle,
      lp.Description,
      ulp.CurrentLevelId,
      lv.BadgeText AS CurrentLevelBadge,
      lv.Title AS CurrentLevelTitle,
      ulp.CurrentLessonId,
      ls.LessonCode AS CurrentLessonCode,
      ls.Title AS CurrentLessonTitle,
      ulp.CurrentActivityId,
      ulp.CompletedLessonsCount,
      (SELECT COUNT(*) FROM dbo.Lessons WHERE Status = 'Published') AS TotalPublishedLessons,
      ulp.OverallProgressPercent,
      ulp.TotalXpEarned
    FROM dbo.UserLearningProgress ulp
    INNER JOIN dbo.LearningPaths lp ON lp.PathId = ulp.PathId
    INNER JOIN dbo.LearningLevels lv ON lv.LevelId = ulp.CurrentLevelId
    INNER JOIN dbo.Lessons ls ON ls.LessonId = ulp.CurrentLessonId
    WHERE ulp.UserUid = @Uid
    FOR JSON PATH;
  `)

  interface RawLevelRow {
    LevelId: number
    LevelCode: string
    BadgeText: string
    BadgeColor: string
    Title: string
    TopikLevel: string
    TextbookName: string
    Description: string
    SkillTagsJson: string
    DisplayOrder: number
    Status: string
    TopicsCount: number
    LessonsCount: number
    UnlockStatus: UnlockStatusType
    CompletedLessonsCount: number
    ProgressPercent: number
    RequiredCompletedLessonsPercent: number
    MinAverageQuizScorePercent: number
  }

  const levelRows = await executeSqlJsonQuery<RawLevelRow[]>(`
    DECLARE @Uid NVARCHAR(128) = ${safeUid};
    SELECT
      lv.LevelId,
      lv.LevelCode,
      lv.BadgeText,
      lv.BadgeColor,
      lv.Title,
      lv.TopikLevel,
      lv.TextbookName,
      lv.Description,
      lv.SkillTagsJson,
      lv.DisplayOrder,
      lv.Status,
      (SELECT COUNT(*) FROM dbo.LearningTopics tp WHERE tp.LevelId = lv.LevelId AND tp.Status = 'Published') AS TopicsCount,
      (SELECT COUNT(*) FROM dbo.Lessons ls WHERE ls.LevelId = lv.LevelId AND ls.Status = 'Published') AS LessonsCount,
      ISNULL(ulp.UnlockStatus, 'Locked') AS UnlockStatus,
      ISNULL(ulp.CompletedLessonsCount, 0) AS CompletedLessonsCount,
      ISNULL(ulp.ProgressPercent, 0) AS ProgressPercent,
      ISNULL(lur.RequiredCompletedLessonsPercent, 100) AS RequiredCompletedLessonsPercent,
      ISNULL(lur.MinAverageQuizScorePercent, 80) AS MinAverageQuizScorePercent
    FROM dbo.LearningLevels lv
    LEFT JOIN dbo.UserLevelProgress ulp ON ulp.LevelId = lv.LevelId AND ulp.UserUid = @Uid
    LEFT JOIN dbo.LevelUnlockRules lur ON lur.LevelId = lv.LevelId
    WHERE lv.Status = 'Published'
    ORDER BY lv.DisplayOrder ASC
    FOR JSON PATH;
  `)

  interface RawSourceRow {
    SourceId: number
    SourceCode: string
    SourceName: string
    DatasetOrApiName: string
    SourceUrl: string
    DataType: string
    VerifiedRecordCount: number
    DataFormat: string
    TargetLevels: string
    LicenseName: string
    AuthorOrOrganization: string
    TargetTable: string
    AvailabilityStatus: string
    Notes: string | null
  }

  const sourceRows = await executeSqlJsonQuery<RawSourceRow[]>(`
    SELECT
      SourceId, SourceCode, SourceName, DatasetOrApiName, SourceUrl,
      DataType, VerifiedRecordCount, DataFormat, TargetLevels,
      LicenseName, AuthorOrOrganization, TargetTable, AvailabilityStatus, Notes
    FROM dbo.ContentSources
    ORDER BY SourceId ASC
    FOR JSON PATH;
  `)

  const overview = overviewRows[0]
  const levels = levelRows.map((lv) => {
    let skills: string[] = []
    try {
      skills = JSON.parse(lv.SkillTagsJson)
    } catch {
      skills = ['Từ vựng', 'Ngữ pháp', 'Ôn tập & kiểm tra']
    }
    return {
      levelId: lv.LevelId,
      levelCode: lv.LevelCode,
      badgeText: lv.BadgeText,
      badgeColor: lv.BadgeColor,
      title: lv.Title,
      topikLevel: lv.TopikLevel,
      textbookName: lv.TextbookName,
      description: lv.Description,
      skills,
      displayOrder: lv.DisplayOrder,
      topicsCount: lv.TopicsCount,
      lessonsCount: lv.LessonsCount,
      unlockStatus: (isSelfAdmin && lv.UnlockStatus === 'Locked' ? 'Available' : lv.UnlockStatus) as UnlockStatusType,
      unlockStatusLabelVi: mapUnlockStatusLabelVi(
        isSelfAdmin && lv.UnlockStatus === 'Locked' ? 'Available' : lv.UnlockStatus,
      ),
      completedLessonsCount: lv.CompletedLessonsCount,
      progressPercent: Number(lv.ProgressPercent || 0),
      unlockRule: {
        requiredCompletedLessonsPercent: lv.RequiredCompletedLessonsPercent,
        minAverageQuizScorePercent: lv.MinAverageQuizScorePercent,
      },
    }
  })

  return {
    path: {
      pathId: overview?.PathId ?? 1,
      pathCode: overview?.PathCode ?? 'HANGO_MAIN_PATH',
      title: overview?.Title ?? 'Lộ trình học tiếng Hàn',
      subtitle: overview?.Subtitle ?? '',
      description: overview?.Description ?? '',
    },
    journey: {
      userUid,
      currentLevelId: overview?.CurrentLevelId ?? 1,
      currentLevelBadge: overview?.CurrentLevelBadge ?? '한글',
      currentLevelTitle: overview?.CurrentLevelTitle ?? 'Bảng chữ cái Hangeul',
      currentLessonId: overview?.CurrentLessonId ?? 1,
      currentLessonCode: overview?.CurrentLessonCode ?? 'HG_LESSON_01',
      currentLessonTitle: overview?.CurrentLessonTitle ?? 'Buổi 1: Nguyên âm cơ bản 1',
      currentActivityId: overview?.CurrentActivityId ?? null,
      completedLessonsCount: overview?.CompletedLessonsCount ?? 0,
      totalPublishedLessons: overview?.TotalPublishedLessons ?? 18,
      overallProgressPercent: Number(overview?.OverallProgressPercent ?? 0),
      totalXpEarned: overview?.TotalXpEarned ?? 0,
    },
    levels,
    contentSources: sourceRows,
  }
}

/**
 * 2. GET /api/learning-levels/{levelId}
 * Lấy chi tiết 1 chặng kèm danh sách chủ đề và danh sách buổi học (thứ tự, trạng thái mở khóa, tiến độ)
 */
export async function getLearningLevelDetailForUser(
  userUid: string,
  levelIdOrCode: string,
  isAdmin = false,
  isSelfAdmin = false,
) {
  await ensureUserLearningProgressInitialized(userUid)
  const safeUid = sqlStr(userUid)
  const isNumeric = /^\d+$/.test(levelIdOrCode.trim())
  const whereClause = isNumeric
    ? `lv.LevelId = ${sqlInt(levelIdOrCode)}`
    : `lv.LevelCode = ${sqlStr(levelIdOrCode.trim())}`

  interface RawLevelDetail {
    LevelId: number
    LevelCode: string
    BadgeText: string
    BadgeColor: string
    Title: string
    TopikLevel: string
    TextbookName: string
    Description: string
    SkillTagsJson: string
    DisplayOrder: number
    UnlockStatus: UnlockStatusType
    CompletedLessonsCount: number
    TotalLessonsCount: number
    ProgressPercent: number
  }

  const levelRows = await executeSqlJsonQuery<RawLevelDetail[]>(`
    DECLARE @Uid NVARCHAR(128) = ${safeUid};
    SELECT TOP 1
      lv.LevelId,
      lv.LevelCode,
      lv.BadgeText,
      lv.BadgeColor,
      lv.Title,
      lv.TopikLevel,
      lv.TextbookName,
      lv.Description,
      lv.SkillTagsJson,
      lv.DisplayOrder,
      ISNULL(ulp.UnlockStatus, 'Locked') AS UnlockStatus,
      ISNULL(ulp.CompletedLessonsCount, 0) AS CompletedLessonsCount,
      (SELECT COUNT(*) FROM dbo.Lessons ls WHERE ls.LevelId = lv.LevelId AND ls.Status = 'Published') AS TotalLessonsCount,
      ISNULL(ulp.ProgressPercent, 0) AS ProgressPercent
    FROM dbo.LearningLevels lv
    LEFT JOIN dbo.UserLevelProgress ulp ON ulp.LevelId = lv.LevelId AND ulp.UserUid = @Uid
    WHERE ${whereClause}
    FOR JSON PATH;
  `)

  if (!levelRows || levelRows.length === 0) {
    return null
  }

  const lv = levelRows[0]

  interface RawTopicRow {
    TopicId: number
    TopicCode: string
    Title: string
    Description: string | null
    DisplayOrder: number
  }

  const topicRows = await executeSqlJsonQuery<RawTopicRow[]>(`
    SELECT TopicId, TopicCode, Title, Description, DisplayOrder
    FROM dbo.LearningTopics
    WHERE LevelId = ${lv.LevelId} AND (Status = 'Published' OR (${isSelfAdmin ? 1 : 0} = 1 AND Status IN ('Published', 'Draft')))
    ORDER BY DisplayOrder ASC
    FOR JSON PATH;
  `)

  interface RawLessonRow {
    LessonId: number
    TopicId: number
    LessonCode: string
    LessonNumber: number
    Title: string
    Subtitle: string | null
    LearningObjective: string
    EstimatedMinutes: number
    DisplayOrder: number
    Status: string
    IsAiCompiled: boolean
    NeedsExpertReview: boolean
    UnlockStatus: UnlockStatusType
    CompletedRequiredActivities: number
    TotalRequiredActivities: number
    BestQuizScorePercent: number
    QuizAttemptsCount: number
    ProgressPercent: number
    Activities?: Array<{
      title: string
      activityType: string
      displayOrder: number
    }>
  }

  const lessonRows = await executeSqlJsonQuery<RawLessonRow[]>(`
    DECLARE @Uid NVARCHAR(128) = ${safeUid};
    SELECT
      ls.LessonId,
      ls.TopicId,
      ls.LessonCode,
      ls.LessonNumber,
      ls.Title,
      ls.Subtitle,
      ls.LearningObjective,
      ls.EstimatedMinutes,
      ls.DisplayOrder,
      ls.Status,
      ls.IsAiCompiled,
      ls.NeedsExpertReview,
      ISNULL(ulsp.UnlockStatus, 'Locked') AS UnlockStatus,
      ISNULL(ulsp.CompletedRequiredActivities, 0) AS CompletedRequiredActivities,
      ISNULL(ulsp.TotalRequiredActivities, (SELECT COUNT(*) FROM dbo.LessonActivities act WHERE act.LessonId = ls.LessonId AND act.IsRequired = 1 AND act.Status = 'Published')) AS TotalRequiredActivities,
      ISNULL(ulsp.BestQuizScorePercent, 0) AS BestQuizScorePercent,
      ISNULL(ulsp.QuizAttemptsCount, 0) AS QuizAttemptsCount,
      ISNULL(ulsp.ProgressPercent, 0) AS ProgressPercent,
      (
        SELECT act.Title AS title, act.ActivityType AS activityType, act.DisplayOrder AS displayOrder
        FROM dbo.LessonActivities act
        WHERE act.LessonId = ls.LessonId AND (act.Status = 'Published' OR (${isSelfAdmin ? 1 : 0} = 1 AND act.Status = 'Draft'))
        ORDER BY act.DisplayOrder ASC
        FOR JSON PATH
      ) AS Activities
    FROM dbo.Lessons ls
    LEFT JOIN dbo.UserLessonProgress ulsp ON ulsp.LessonId = ls.LessonId AND ulsp.UserUid = @Uid
    WHERE ls.LevelId = ${lv.LevelId} AND (ls.Status = 'Published' OR (${isSelfAdmin ? 1 : 0} = 1 AND ls.Status IN ('Published', 'Draft')))
    ORDER BY ls.DisplayOrder ASC
    FOR JSON PATH;
  `)

  const topics = (topicRows || []).map((tp) => {
    const topicLessons = (lessonRows || [])
      .filter((ls) => ls.TopicId === tp.TopicId)
      .map((ls) => {
        const unlockStatus: UnlockStatusType =
          isSelfAdmin && ls.UnlockStatus === 'Locked' ? 'Available' : ls.UnlockStatus
        return {
          lessonId: ls.LessonId,
          lessonCode: ls.LessonCode,
          lessonNumber: ls.LessonNumber,
          title: ls.Title,
          subtitle: ls.Subtitle || '',
          learningObjective: ls.LearningObjective,
          estimatedMinutes: ls.EstimatedMinutes,
          displayOrder: ls.DisplayOrder,
          status: ls.Status || 'Published',
          isAiCompiled: Boolean(ls.IsAiCompiled),
          needsExpertReview: Boolean(ls.NeedsExpertReview),
          unlockStatus,
          unlockStatusLabelVi: mapUnlockStatusLabelVi(unlockStatus),
          completedRequiredActivities: ls.CompletedRequiredActivities,
          totalRequiredActivities: ls.TotalRequiredActivities,
          bestQuizScorePercent: ls.BestQuizScorePercent,
          quizAttemptsCount: ls.QuizAttemptsCount,
          progressPercent: Number(ls.ProgressPercent || 0),
          activities: ls.Activities || [],
        }
      })
    return {
      topicId: tp.TopicId,
      topicCode: tp.TopicCode,
      title: tp.Title,
      description: tp.Description || '',
      displayOrder: tp.DisplayOrder,
      lessonsCount: topicLessons.length,
      lessons: topicLessons,
    }
  })

  return {
    level: {
      levelId: lv.LevelId,
      levelCode: lv.LevelCode,
      badgeText: lv.BadgeText,
      badgeColor: lv.BadgeColor,
      title: lv.Title,
      topikLevel: lv.TopikLevel,
      textbookName: lv.TextbookName,
      description: lv.Description,
      displayOrder: lv.DisplayOrder,
      unlockStatus: lv.UnlockStatus,
      unlockStatusLabelVi: mapUnlockStatusLabelVi(lv.UnlockStatus),
      completedLessonsCount: lv.CompletedLessonsCount,
      totalLessonsCount: lv.TotalLessonsCount,
      progressPercent: Number(lv.ProgressPercent || 0),
      topicsCount: topics.length,
    },
    topics,
  }
}

/**
 * 3. GET /api/lessons/{lessonId}
 * Lấy toàn bộ nội dung buổi học (lý thuyết, từ vựng, ngữ pháp, ví dụ, tài liệu luyện viết, hoạt động, bài kiểm tra)
 * - Bắt buộc kiểm tra trạng thái mở khóa tại Backend: nếu buổi học đang ở trạng thái 'Locked' (và không phải Admin), chặn 403.
 */
export async function getLessonDetailForUser(
  userUid: string,
  lessonIdOrCode: string,
  isAdmin = false,
): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; code: string; error: string }
> {
  await ensureUserLearningProgressInitialized(userUid)
  const safeUid = sqlStr(userUid)
  const isNumeric = /^\d+$/.test(lessonIdOrCode.trim())
  const whereClause = isNumeric
    ? `ls.LessonId = ${sqlInt(lessonIdOrCode)}`
    : `ls.LessonCode = ${sqlStr(lessonIdOrCode.trim())}`

  interface RawLessonHeader {
    LessonId: number
    LessonCode: string
    LessonNumber: number
    LevelId: number
    LevelTitle: string
    LevelBadge: string
    TotalLessonsInLevel: number
    TopicId: number
    TopicTitle: string
    Title: string
    Subtitle: string | null
    LearningObjective: string
    EstimatedMinutes: number
    DisplayOrder: number
    IsAiCompiled: boolean
    NeedsExpertReview: boolean
    UnlockStatus: UnlockStatusType
    CompletedRequiredActivities: number
    TotalRequiredActivities: number
    BestQuizScorePercent: number
    QuizAttemptsCount: number
    ProgressPercent: number
    RequireAllMandatoryActivities: boolean
    RequireFinalQuizPass: boolean
    MinQuizPassPercent: number
    AllowUnlimitedRetakes: boolean
  }

  let headerRows: RawLessonHeader[] = []
  try {
    headerRows = await executeSqlJsonQuery<RawLessonHeader[]>(`
      DECLARE @Uid NVARCHAR(128) = ${safeUid};
      SELECT TOP 1
        ls.LessonId,
        ls.LessonCode,
        ls.LessonNumber,
        ls.LevelId,
        lv.Title AS LevelTitle,
        lv.BadgeText AS LevelBadge,
        (SELECT COUNT(*) FROM dbo.Lessons ls2 WHERE ls2.LevelId = ls.LevelId AND ls2.Status = 'Published') AS TotalLessonsInLevel,
        ls.TopicId,
        tp.Title AS TopicTitle,
        ls.Title,
        ls.Subtitle,
        ls.LearningObjective,
        ls.EstimatedMinutes,
        ls.DisplayOrder,
        ls.IsAiCompiled,
        ls.NeedsExpertReview,
        ISNULL(ulsp.UnlockStatus, 'Locked') AS UnlockStatus,
        ISNULL(ulsp.CompletedRequiredActivities, 0) AS CompletedRequiredActivities,
        ISNULL(ulsp.TotalRequiredActivities, 0) AS TotalRequiredActivities,
        ISNULL(ulsp.BestQuizScorePercent, 0) AS BestQuizScorePercent,
        ISNULL(ulsp.QuizAttemptsCount, 0) AS QuizAttemptsCount,
        ISNULL(ulsp.ProgressPercent, 0) AS ProgressPercent,
        ISNULL(lcr.RequireAllMandatoryActivities, 1) AS RequireAllMandatoryActivities,
        ISNULL(lcr.RequireFinalQuizPass, 1) AS RequireFinalQuizPass,
        ISNULL(lcr.MinQuizPassPercent, 80) AS MinQuizPassPercent,
        ISNULL(lcr.AllowUnlimitedRetakes, 1) AS AllowUnlimitedRetakes
      FROM dbo.Lessons ls
      INNER JOIN dbo.LearningLevels lv ON lv.LevelId = ls.LevelId
      INNER JOIN dbo.LearningTopics tp ON tp.TopicId = ls.TopicId
      LEFT JOIN dbo.UserLessonProgress ulsp ON ulsp.LessonId = ls.LessonId AND ulsp.UserUid = @Uid
      LEFT JOIN dbo.LessonCompletionRules lcr ON lcr.LessonId = ls.LessonId
      WHERE ${whereClause}
      FOR JSON PATH;
    `)
  } catch {
    headerRows = []
  }

  if (!headerRows || headerRows.length === 0) {
    return {
      ok: false,
      status: 404,
      code: 'LESSON_NOT_FOUND',
      error: 'Không tìm thấy buổi học trong cơ sở dữ liệu.',
    }
  }

  const header = headerRows[0]
  if (header.UnlockStatus === 'Locked' && !isAdmin) {
    return {
      ok: false,
      status: 403,
      code: 'LESSON_LOCKED',
      error: 'Buổi học này chưa được mở khóa. Vui lòng hoàn thành buổi học trước đó (đạt tối thiểu 80% bài kiểm tra cuối buổi) để mở khóa.',
    }
  }

  // Lấy Sections, Vocabulary, Grammar, Resources, Activities, Exercises
  interface RawSection {
    SectionId: number
    SectionCode: string
    SectionType: string
    Title: string
    ContentHtmlOrMd: string
    ExamplesJson: string | null
    DisplayOrder: number
  }
  const sections = await executeSqlJsonQuery<RawSection[]>(`
    SELECT SectionId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder
    FROM dbo.LessonSections
    WHERE LessonId = ${header.LessonId} AND Status = 'Published'
    ORDER BY DisplayOrder ASC
    FOR JSON PATH;
  `).catch(() => [] as RawSection[])

  interface RawVocab {
    VocabId: number
    VocabCode: string
    KoreanWord: string
    Hanja: string | null
    Romanization: string | null
    VietnameseMeaning: string
    PartOfSpeech: string
    ExampleSentenceKo: string | null
    ExampleSentenceVi: string | null
    TopikLevel: string
    DisplayOrder: number
  }
  const vocabularies = await executeSqlJsonQuery<RawVocab[]>(`
    SELECT
      v.VocabId, v.VocabCode, v.KoreanWord, v.Hanja, v.Romanization,
      v.VietnameseMeaning, v.PartOfSpeech, v.ExampleSentenceKo, v.ExampleSentenceVi,
      v.TopikLevel, lv.DisplayOrder
    FROM dbo.LessonVocabulary lv
    INNER JOIN dbo.Vocabulary v ON v.VocabId = lv.VocabId
    WHERE lv.LessonId = ${header.LessonId} AND v.Status = 'Published'
    ORDER BY lv.DisplayOrder ASC
    FOR JSON PATH;
  `).catch(() => [] as RawVocab[])

  interface RawGrammar {
    GrammarId: number
    GrammarCode: string
    GrammarPattern: string
    MeaningVi: string
    UsageExplanation: string
    ConjugationRule: string | null
    ExampleKo: string
    ExampleVi: string
    DisplayOrder: number
  }
  const grammars = await executeSqlJsonQuery<RawGrammar[]>(`
    SELECT
      g.GrammarId, g.GrammarCode, g.GrammarPattern, g.MeaningVi,
      g.UsageExplanation, g.ConjugationRule, g.ExampleKo, g.ExampleVi, lg.DisplayOrder
    FROM dbo.LessonGrammar lg
    INNER JOIN dbo.Grammar g ON g.GrammarId = lg.GrammarId
    WHERE lg.LessonId = ${header.LessonId} AND g.Status = 'Published'
    ORDER BY lg.DisplayOrder ASC
    FOR JSON PATH;
  `).catch(() => [] as RawGrammar[])

  interface RawResource {
    ResourceId: number
    ResourceCode: string
    ResourceType: string
    Title: string
    Description: string | null
    ResourceUrl: string
    TargetCharsJson: string | null
    DisplayOrder: number
  }
  const resources = await executeSqlJsonQuery<RawResource[]>(`
    SELECT ResourceId, ResourceCode, ResourceType, Title, Description, ResourceUrl, TargetCharsJson, DisplayOrder
    FROM dbo.LessonResources
    WHERE LessonId = ${header.LessonId} AND Status = 'Published'
    ORDER BY DisplayOrder ASC
    FOR JSON PATH;
  `).catch(() => [] as RawResource[])

  interface RawActivity {
    ActivityId: number
    ActivityCode: string
    ActivityType: string
    Title: string
    Description: string | null
    IsRequired: boolean
    ExerciseId: number | null
    ResourceId: number | null
    DisplayOrder: number
    XpReward: number
    IsCompleted: boolean
    ScorePercent: number | null
    CompletedAt: string | null
  }
  const activities = await executeSqlJsonQuery<RawActivity[]>(`
    DECLARE @Uid NVARCHAR(128) = ${safeUid};
    SELECT
      act.ActivityId,
      act.ActivityCode,
      act.ActivityType,
      act.Title,
      act.Description,
      act.IsRequired,
      act.ExerciseId,
      act.ResourceId,
      act.DisplayOrder,
      act.XpReward,
      ISNULL(uap.IsCompleted, 0) AS IsCompleted,
      uap.ScorePercent,
      uap.CompletedAt
    FROM dbo.LessonActivities act
    LEFT JOIN dbo.UserActivityProgress uap ON uap.ActivityId = act.ActivityId AND uap.UserUid = @Uid
    WHERE act.LessonId = ${header.LessonId} AND act.Status = 'Published'
    ORDER BY act.DisplayOrder ASC
    FOR JSON PATH;
  `).catch(() => [] as RawActivity[])

  interface RawExercise {
    ExerciseId: number
    ExerciseCode: string
    ExerciseType: string
    Title: string
    Description: string | null
    PassingScorePercent: number
    TimeLimitSeconds: number
  }
  const exercises = await executeSqlJsonQuery<RawExercise[]>(`
    SELECT ExerciseId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds
    FROM dbo.Exercises
    WHERE LessonId = ${header.LessonId} AND Status = 'Published'
    ORDER BY DisplayOrder ASC
    FOR JSON PATH;
  `).catch(() => [] as RawExercise[])

  const exercisesWithQuestions = []
  for (const ex of exercises) {
    interface RawQuestion {
      QuestionId: number
      QuestionCode: string
      QuestionType: string
      PromptText: string
      KoreanHighlight: string | null
      ExplanationVi: string
      Points: number
      DisplayOrder: number
    }
    const qRows = await executeSqlJsonQuery<RawQuestion[]>(`
      SELECT QuestionId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder
      FROM dbo.Questions
      WHERE ExerciseId = ${ex.ExerciseId} AND Status = 'Published'
      ORDER BY DisplayOrder ASC
      FOR JSON PATH;
    `).catch(() => [] as RawQuestion[])

    interface RawOption {
      OptionId: number
      QuestionId: number
      OptionLabel: string
      OptionText: string
      DisplayOrder: number
    }
    const optRows = await executeSqlJsonQuery<RawOption[]>(`
      SELECT o.OptionId, o.QuestionId, o.OptionLabel, o.OptionText, o.DisplayOrder
      FROM dbo.QuestionOptions o
      INNER JOIN dbo.Questions q ON q.QuestionId = o.QuestionId
      WHERE q.ExerciseId = ${ex.ExerciseId}
      ORDER BY o.QuestionId ASC, o.DisplayOrder ASC
      FOR JSON PATH;
    `).catch(() => [] as RawOption[])

    exercisesWithQuestions.push({
      exerciseId: ex.ExerciseId,
      exerciseCode: ex.ExerciseCode,
      exerciseType: ex.ExerciseType,
      title: ex.Title,
      description: ex.Description || '',
      passingScorePercent: ex.PassingScorePercent,
      timeLimitSeconds: ex.TimeLimitSeconds,
      questions: qRows.map((q) => ({
        questionId: q.QuestionId,
        questionCode: q.QuestionCode,
        questionType: q.QuestionType,
        promptText: q.PromptText,
        koreanHighlight: q.KoreanHighlight,
        points: q.Points,
        displayOrder: q.DisplayOrder,
        options: optRows
          .filter((o) => o.QuestionId === q.QuestionId)
          .map((o) => ({
            optionId: o.OptionId,
            optionLabel: o.OptionLabel,
            optionText: o.OptionText,
          })),
      })),
    })
  }

  // Kiểm tra các hoạt động bắt buộc trước bài kiểm tra cuối buổi đã hoàn thành chưa
  const mandatoryPreQuizActivities = activities.filter(
    (a) => a.IsRequired && a.ActivityType !== 'final_test',
  )
  const completedMandatoryPreQuizCount = mandatoryPreQuizActivities.filter(
    (a) => a.IsCompleted,
  ).length
  const canTakeFinalQuiz =
    !header.RequireAllMandatoryActivities ||
    completedMandatoryPreQuizCount >= mandatoryPreQuizActivities.length

  return {
    ok: true,
    data: {
      lesson: {
        lessonId: header.LessonId,
        lessonCode: header.LessonCode,
        lessonNumber: header.LessonNumber,
        levelId: header.LevelId,
        levelTitle: header.LevelTitle,
        levelBadge: header.LevelBadge,
        totalLessonsInLevel: header.TotalLessonsInLevel || 9,
        topicId: header.TopicId,
        topicTitle: header.TopicTitle,
        title: header.Title,
        subtitle: header.Subtitle || '',
        learningObjective: header.LearningObjective,
        estimatedMinutes: header.EstimatedMinutes,
        isAiCompiled: Boolean(header.IsAiCompiled),
        needsExpertReview: Boolean(header.NeedsExpertReview),
        unlockStatus: header.UnlockStatus,
        unlockStatusLabelVi: mapUnlockStatusLabelVi(header.UnlockStatus),
        completedRequiredActivities: header.CompletedRequiredActivities,
        totalRequiredActivities: header.TotalRequiredActivities,
        bestQuizScorePercent: header.BestQuizScorePercent,
        quizAttemptsCount: header.QuizAttemptsCount,
        progressPercent: Number(header.ProgressPercent || 0),
        canTakeFinalQuiz,
        completionRule: {
          requireAllMandatoryActivities: Boolean(header.RequireAllMandatoryActivities),
          requireFinalQuizPass: Boolean(header.RequireFinalQuizPass),
          minQuizPassPercent: header.MinQuizPassPercent,
          allowUnlimitedRetakes: Boolean(header.AllowUnlimitedRetakes),
        },
      },
      sections: sections.map((s) => {
        let examples = []
        try {
          examples = s.ExamplesJson ? JSON.parse(s.ExamplesJson) : []
        } catch {
          examples = []
        }
        return {
          sectionId: s.SectionId,
          sectionCode: s.SectionCode,
          sectionType: s.SectionType,
          title: s.Title,
          contentMd: s.ContentHtmlOrMd,
          examples,
          displayOrder: s.DisplayOrder,
        }
      }),
      vocabularies: vocabularies.map((v) => ({
        vocabId: v.VocabId,
        vocabCode: v.VocabCode,
        ko: v.KoreanWord,
        hanja: v.Hanja,
        roman: v.Romanization || '',
        vi: v.VietnameseMeaning,
        pos: v.PartOfSpeech,
        exKo: v.ExampleSentenceKo || '',
        exVi: v.ExampleSentenceVi || '',
        topikLevel: v.TopikLevel,
      })),
      grammars: grammars.map((g) => ({
        grammarId: g.GrammarId,
        grammarCode: g.GrammarCode,
        pattern: g.GrammarPattern,
        meaningVi: g.MeaningVi,
        usage: g.UsageExplanation,
        conjugation: g.ConjugationRule || '',
        exKo: g.ExampleKo,
        exVi: g.ExampleVi,
      })),
      resources: resources.map((r) => {
        let targetChars: string[] = []
        try {
          targetChars = r.TargetCharsJson ? JSON.parse(r.TargetCharsJson) : []
        } catch {
          targetChars = []
        }
        return {
          resourceId: r.ResourceId,
          resourceCode: r.ResourceCode,
          resourceType: r.ResourceType,
          title: r.Title,
          description: r.Description || '',
          resourceUrl: r.ResourceUrl,
          targetChars,
        }
      }),
      activities: activities.map((a) => ({
        activityId: a.ActivityId,
        activityCode: a.ActivityCode,
        activityType: a.ActivityType,
        title: a.Title,
        description: a.Description || '',
        isRequired: Boolean(a.IsRequired),
        exerciseId: a.ExerciseId,
        resourceId: a.ResourceId,
        displayOrder: a.DisplayOrder,
        xpReward: a.XpReward,
        isCompleted: Boolean(a.IsCompleted),
        scorePercent: a.ScorePercent,
        completedAt: a.CompletedAt,
      })),
      exercises: exercisesWithQuestions,
    },
  }
}

/**
 * 4. GET /api/learning-progress
 * Lấy tiến độ cá nhân chi tiết từ SQL Server (chặng hiện tại, buổi hiện tại, hoạt động đang học, lịch sử làm bài & phiên học)
 */
export async function getUserLearningProgressDetail(userUid: string) {
  const pathData = await getLearningPathForUser(userUid)
  const safeUid = sqlStr(userUid)

  const recentAttempts = await executeSqlJsonQuery<Array<Record<string, unknown>>>(`
    SELECT TOP 10
      ea.AttemptId,
      ea.ExerciseId,
      ex.Title AS ExerciseTitle,
      ea.LessonId,
      ls.Title AS LessonTitle,
      ea.TotalQuestions,
      ea.CorrectCount,
      ea.ScorePercent,
      ea.Passed,
      ea.DurationSeconds,
      ea.SubmittedAt
    FROM dbo.ExerciseAttempts ea
    INNER JOIN dbo.Exercises ex ON ex.ExerciseId = ea.ExerciseId
    INNER JOIN dbo.Lessons ls ON ls.LessonId = ea.LessonId
    WHERE ea.UserUid = ${safeUid}
    ORDER BY ea.SubmittedAt DESC
    FOR JSON PATH;
  `).catch(() => [])

  const recentSessions = await executeSqlJsonQuery<Array<Record<string, unknown>>>(`
    SELECT TOP 15
      SessionId,
      LessonId,
      ActivityId,
      SessionType,
      DurationSeconds,
      XpEarned,
      SummaryText,
      CreatedAt
    FROM dbo.UserStudySessions
    WHERE UserUid = ${safeUid}
    ORDER BY CreatedAt DESC
    FOR JSON PATH;
  `).catch(() => [])

  return {
    journey: pathData.journey,
    levels: pathData.levels,
    recentAttempts,
    recentSessions,
  }
}

/**
 * 5. POST /api/learning-progress/activities
 * Đánh dấu hoàn thành 1 hoạt động trong buổi học, kiểm tra điều kiện mở khóa và cập nhật tiến độ SQL Server
 */
export async function completeLessonActivityForUser(
  userUid: string,
  params: { lessonId: number; activityId: number; timeSpentSeconds?: number; preview?: boolean },
  isAdmin = false,
): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; code: string; error: string }
> {
  if (params.preview) {
    return {
      ok: true,
      data: {
        previewMode: true,
        completedRequiredActivities: 1,
        totalRequiredActivities: 1,
        unlockStatus: 'InProgress',
        progressPercent: 100,
        nextActivityId: null,
        message: 'Chế độ Xem trước Admin: Hoàn thành hoạt động (không ghi nhận tiến độ thực tế).',
      },
    }
  }

  await ensureUserLearningProgressInitialized(userUid)
  const safeUid = sqlStr(userUid)
  const lessonId = sqlInt(params.lessonId)
  const activityId = sqlInt(params.activityId)
  const timeSpent = Math.max(5, sqlInt(params.timeSpentSeconds, 60))

  // Kiểm tra buổi học có tồn tại và đã mở khóa chưa
  interface RawCheck {
    UnlockStatus: UnlockStatusType
    ActivityType: string
    ActivityTitle: string
    XpReward: number
  }
  const checkRows = await executeSqlJsonQuery<RawCheck[]>(`
    SELECT TOP 1
      ISNULL(ulsp.UnlockStatus, 'Locked') AS UnlockStatus,
      act.ActivityType,
      act.Title AS ActivityTitle,
      act.XpReward
    FROM dbo.LessonActivities act
    INNER JOIN dbo.Lessons ls ON ls.LessonId = act.LessonId
    LEFT JOIN dbo.UserLessonProgress ulsp ON ulsp.LessonId = ls.LessonId AND ulsp.UserUid = ${safeUid}
    WHERE act.ActivityId = ${activityId} AND act.LessonId = ${lessonId}
    FOR JSON PATH;
  `).catch(() => [] as RawCheck[])

  if (!checkRows || checkRows.length === 0) {
    return {
      ok: false,
      status: 404,
      code: 'ACTIVITY_NOT_FOUND',
      error: 'Không tìm thấy hoạt động học tập trong buổi học này.',
    }
  }

  const check = checkRows[0]
  if (check.UnlockStatus === 'Locked' && !isAdmin) {
    return {
      ok: false,
      status: 403,
      code: 'LESSON_LOCKED',
      error: 'Buổi học này đang bị khóa. Bạn không thể cập nhật hoạt động của buổi học chưa mở khóa.',
    }
  }

  if (check.ActivityType === 'final_test') {
    return {
      ok: false,
      status: 400,
      code: 'USE_EXERCISE_SUBMIT_API',
      error: 'Hoạt động Bài kiểm tra cuối buổi phải được nộp và chấm điểm qua API POST /api/exercises/{exerciseId}/submit.',
    }
  }

  // Ghi nhận hoàn thành hoạt động và tính lại tiến độ buổi học trong SQL Server
  const updatedRows = await executeSqlJsonQuery<Array<Record<string, unknown>>>(`
    DECLARE @Uid NVARCHAR(128) = ${safeUid};
    DECLARE @LessonId INT = ${lessonId};
    DECLARE @ActivityId INT = ${activityId};
    DECLARE @TimeSpent INT = ${timeSpent};
    DECLARE @Xp INT = ${check.XpReward};

    IF NOT EXISTS (SELECT 1 FROM dbo.UserActivityProgress WHERE UserUid = @Uid AND ActivityId = @ActivityId)
    BEGIN
      INSERT INTO dbo.UserActivityProgress (UserUid, LessonId, ActivityId, IsCompleted, TimeSpentSeconds, CompletedAt, UpdatedAt)
      VALUES (@Uid, @LessonId, @ActivityId, 1, @TimeSpent, SYSUTCDATETIME(), SYSUTCDATETIME());

      INSERT INTO dbo.UserStudySessions (UserUid, LessonId, ActivityId, SessionType, DurationSeconds, XpEarned, SummaryText)
      VALUES (@Uid, @LessonId, @ActivityId, 'lesson_activity', @TimeSpent, @Xp, ${sqlStr('Hoàn thành hoạt động: ' + check.ActivityTitle)});

      UPDATE dbo.UserLearningProgress
      SET TotalXpEarned = TotalXpEarned + @Xp,
          LastAccessedAt = SYSUTCDATETIME(),
          UpdatedAt = SYSUTCDATETIME()
      WHERE UserUid = @Uid;
    END
    ELSE
    BEGIN
      UPDATE dbo.UserActivityProgress
      SET IsCompleted = 1,
          TimeSpentSeconds = TimeSpentSeconds + @TimeSpent,
          CompletedAt = ISNULL(CompletedAt, SYSUTCDATETIME()),
          UpdatedAt = SYSUTCDATETIME()
      WHERE UserUid = @Uid AND ActivityId = @ActivityId;
    END

    -- Tính lại số hoạt động bắt buộc đã hoàn thành của buổi học
    DECLARE @CompReq INT = (
      SELECT COUNT(*)
      FROM dbo.LessonActivities a
      INNER JOIN dbo.UserActivityProgress uap ON uap.ActivityId = a.ActivityId AND uap.UserUid = @Uid AND uap.IsCompleted = 1
      WHERE a.LessonId = @LessonId AND a.IsRequired = 1 AND a.Status = 'Published'
    );
    DECLARE @TotReq INT = (
      SELECT COUNT(*)
      FROM dbo.LessonActivities a
      WHERE a.LessonId = @LessonId AND a.IsRequired = 1 AND a.Status = 'Published'
    );
    DECLARE @Pct DECIMAL(5,2) = CASE WHEN @TotReq > 0 THEN ROUND((CAST(@CompReq AS DECIMAL(5,2)) * 100.0) / @TotReq, 2) ELSE 0 END;

    UPDATE dbo.UserLessonProgress
    SET CompletedRequiredActivities = @CompReq,
        TotalRequiredActivities = @TotReq,
        UnlockStatus = CASE WHEN UnlockStatus = 'Completed' THEN 'Completed' ELSE 'InProgress' END,
        ProgressPercent = CASE WHEN UnlockStatus = 'Completed' THEN 100 ELSE (CASE WHEN @Pct > 90 THEN 90 ELSE @Pct END) END,
        UpdatedAt = SYSUTCDATETIME()
    WHERE UserUid = @Uid AND LessonId = @LessonId;

    -- Cập nhật hoạt động tiếp theo chưa hoàn thành vào UserLearningProgress
    DECLARE @NextActId INT = (
      SELECT TOP 1 a.ActivityId
      FROM dbo.LessonActivities a
      LEFT JOIN dbo.UserActivityProgress uap ON uap.ActivityId = a.ActivityId AND uap.UserUid = @Uid
      WHERE a.LessonId = @LessonId AND a.Status = 'Published' AND ISNULL(uap.IsCompleted, 0) = 0
      ORDER BY a.DisplayOrder ASC
    );

    UPDATE dbo.UserLearningProgress
    SET CurrentLessonId = @LessonId,
        CurrentActivityId = @NextActId,
        LastAccessedAt = SYSUTCDATETIME(),
        UpdatedAt = SYSUTCDATETIME()
    WHERE UserUid = @Uid;

    SELECT
      CompletedRequiredActivities,
      TotalRequiredActivities,
      UnlockStatus,
      ProgressPercent,
      @NextActId AS NextActivityId
    FROM dbo.UserLessonProgress
    WHERE UserUid = @Uid AND LessonId = @LessonId
    FOR JSON PATH;
  `)

  return {
    ok: true,
    data: {
      lessonId,
      activityId,
      activityTitle: check.ActivityTitle,
      xpEarned: check.XpReward,
      lessonProgress: updatedRows[0] || null,
    },
  }
}

/**
 * 6. POST /api/exercises/{exerciseId}/submit
 * Chấm điểm bài kiểm tra cuối buổi tại Backend:
 * - Kiểm tra tất cả các hoạt động bắt buộc trước bài kiểm tra đã hoàn thành chưa
 * - Lưu lịch sử làm bài (dbo.ExerciseAttempts) và từng câu trả lời (dbo.QuestionAnswers)
 * - Nếu đạt >= 80% (theo dbo.LessonCompletionRules): hoàn thành buổi học, mở khóa buổi tiếp theo (và mở khóa chặng tiếp theo nếu hoàn thành buổi cuối chặng)
 * - Nếu < 80%: giữ trạng thái 'InProgress' và cho phép làm lại
 */
export async function submitExerciseForUser(
  userUid: string,
  exerciseIdOrCode: string,
  payload: {
    answers: Record<string, number> | Array<{ questionId: number; selectedOptionId: number }>
    durationSeconds?: number
    preview?: boolean
  },
  isAdmin = false,
): Promise<
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; status: number; code: string; error: string }
> {
  await ensureUserLearningProgressInitialized(userUid)
  const safeUid = sqlStr(userUid)
  const isNumeric = /^\d+$/.test(exerciseIdOrCode.trim())
  const whereEx = isNumeric
    ? `ex.ExerciseId = ${sqlInt(exerciseIdOrCode)}`
    : `ex.ExerciseCode = ${sqlStr(exerciseIdOrCode.trim())}`

  interface RawExMeta {
    ExerciseId: number
    ExerciseCode: string
    LessonId: number
    LevelId: number
    LessonTitle: string
    PassingScorePercent: number
    MinQuizPassPercent: number
    RequireAllMandatoryActivities: boolean
    UnlockStatus: UnlockStatusType
  }

  const metaRows = await executeSqlJsonQuery<RawExMeta[]>(`
    SELECT TOP 1
      ex.ExerciseId,
      ex.ExerciseCode,
      ex.LessonId,
      ls.LevelId,
      ls.Title AS LessonTitle,
      ex.PassingScorePercent,
      ISNULL(lcr.MinQuizPassPercent, ex.PassingScorePercent) AS MinQuizPassPercent,
      ISNULL(lcr.RequireAllMandatoryActivities, 1) AS RequireAllMandatoryActivities,
      ISNULL(ulsp.UnlockStatus, 'Locked') AS UnlockStatus
    FROM dbo.Exercises ex
    INNER JOIN dbo.Lessons ls ON ls.LessonId = ex.LessonId
    LEFT JOIN dbo.LessonCompletionRules lcr ON lcr.LessonId = ls.LessonId
    LEFT JOIN dbo.UserLessonProgress ulsp ON ulsp.LessonId = ls.LessonId AND ulsp.UserUid = ${safeUid}
    WHERE ${whereEx}
    FOR JSON PATH;
  `).catch(() => [] as RawExMeta[])

  if (!metaRows || metaRows.length === 0) {
    return {
      ok: false,
      status: 404,
      code: 'EXERCISE_NOT_FOUND',
      error: 'Không tìm thấy bài kiểm tra trong cơ sở dữ liệu.',
    }
  }

  const meta = metaRows[0]
  if (meta.UnlockStatus === 'Locked' && !isAdmin) {
    return {
      ok: false,
      status: 403,
      code: 'LESSON_LOCKED',
      error: 'Buổi học của bài kiểm tra này chưa được mở khóa.',
    }
  }

  // Kiểm tra điều kiện bắt buộc: phải hoàn thành tất cả hoạt động bắt buộc (ngoại trừ final_test) trước khi nộp bài kiểm tra
  if (meta.RequireAllMandatoryActivities && !payload.preview && !isAdmin) {
    interface RawMandatoryCheck {
      TotalPreQuizMandatory: number
      CompletedPreQuizMandatory: number
    }
    const mandRows = await executeSqlJsonQuery<RawMandatoryCheck[]>(`
      DECLARE @Uid NVARCHAR(128) = ${safeUid};
      SELECT
        (SELECT COUNT(*) FROM dbo.LessonActivities a WHERE a.LessonId = ${meta.LessonId} AND a.IsRequired = 1 AND a.ActivityType <> 'final_test' AND a.Status = 'Published') AS TotalPreQuizMandatory,
        (SELECT COUNT(*) FROM dbo.LessonActivities a INNER JOIN dbo.UserActivityProgress uap ON uap.ActivityId = a.ActivityId AND uap.UserUid = @Uid AND uap.IsCompleted = 1 WHERE a.LessonId = ${meta.LessonId} AND a.IsRequired = 1 AND a.ActivityType <> 'final_test' AND a.Status = 'Published') AS CompletedPreQuizMandatory
      FOR JSON PATH;
    `)
    const mand = mandRows[0]
    if (mand && mand.CompletedPreQuizMandatory < mand.TotalPreQuizMandatory) {
      return {
        ok: false,
        status: 400,
        code: 'MANDATORY_ACTIVITIES_INCOMPLETE',
        error: `Bạn cần hoàn thành đầy đủ các hoạt động bắt buộc trước khi làm bài kiểm tra cuối buổi (Đã hoàn thành ${mand.CompletedPreQuizMandatory}/${mand.TotalPreQuizMandatory} hoạt động bắt buộc).`,
      }
    }
  }

  // Lấy danh sách câu hỏi và phương án đúng từ SQL Server để chấm điểm
  interface RawGradingQuestion {
    QuestionId: number
    QuestionCode: string
    PromptText: string
    ExplanationVi: string
    OptionId: number
    OptionLabel: string
    OptionText: string
    IsCorrect: boolean
  }
  const qOptRows = await executeSqlJsonQuery<RawGradingQuestion[]>(`
    SELECT
      q.QuestionId,
      q.QuestionCode,
      q.PromptText,
      q.ExplanationVi,
      o.OptionId,
      o.OptionLabel,
      o.OptionText,
      o.IsCorrect
    FROM dbo.Questions q
    INNER JOIN dbo.QuestionOptions o ON o.QuestionId = q.QuestionId
    WHERE q.ExerciseId = ${meta.ExerciseId} AND q.Status = 'Published'
    ORDER BY q.DisplayOrder ASC, o.DisplayOrder ASC
    FOR JSON PATH;
  `)

  // Chuẩn hóa map câu trả lời của học viên: questionId -> selectedOptionId
  const answerMap = new Map<number, number>()
  if (Array.isArray(payload.answers)) {
    for (const item of payload.answers) {
      if (item && item.questionId) {
        answerMap.set(Number(item.questionId), Number(item.selectedOptionId))
      }
    }
  } else if (payload.answers && typeof payload.answers === 'object') {
    for (const [k, v] of Object.entries(payload.answers)) {
      answerMap.set(Number(k), Number(v))
    }
  }

  const questionMap = new Map<
    number,
    {
      questionId: number
      questionCode: string
      promptText: string
      explanationVi: string
      options: Array<{ optionId: number; optionLabel: string; optionText: string; isCorrect: boolean }>
    }
  >()

  for (const row of qOptRows) {
    if (!questionMap.has(row.QuestionId)) {
      questionMap.set(row.QuestionId, {
        questionId: row.QuestionId,
        questionCode: row.QuestionCode,
        promptText: row.PromptText,
        explanationVi: row.ExplanationVi,
        options: [],
      })
    }
    questionMap.get(row.QuestionId)!.options.push({
      optionId: row.OptionId,
      optionLabel: row.OptionLabel,
      optionText: row.OptionText,
      isCorrect: Boolean(row.IsCorrect),
    })
  }

  const questionsList = Array.from(questionMap.values())
  const totalQuestions = questionsList.length
  let correctCount = 0

  const gradedDetails = questionsList.map((q) => {
    const selectedOptionId = answerMap.get(q.questionId) ?? null
    const correctOption = q.options.find((o) => o.isCorrect) || q.options[0]
    const isCorrect = Boolean(selectedOptionId && correctOption && selectedOptionId === correctOption.optionId)
    if (isCorrect) correctCount++
    return {
      questionId: q.questionId,
      questionCode: q.questionCode,
      promptText: q.promptText,
      selectedOptionId,
      correctOptionId: correctOption?.optionId ?? null,
      correctOptionLabel: correctOption?.optionLabel ?? '',
      correctOptionText: correctOption?.optionText ?? '',
      isCorrect,
      explanationVi: q.explanationVi,
    }
  })

  const scorePercent = totalQuestions > 0 ? Math.round((correctCount * 100) / totalQuestions) : 0
  const passThreshold = meta.MinQuizPassPercent || 80
  const passed = scorePercent >= passThreshold
  const durationSeconds = Math.max(5, sqlInt(payload.durationSeconds, 120))

  if (payload.preview) {
    return {
      ok: true,
      data: {
        previewMode: true,
        attemptId: 0,
        passed,
        scorePercent,
        correctCount,
        totalQuestions,
        passThreshold,
        durationSeconds,
        details: gradedDetails,
        unlockedNextLesson: null,
        unlockedNextLevel: null,
        lessonProgress: {
          unlockStatus: 'InProgress',
          progressPercent: scorePercent,
          bestQuizScorePercent: scorePercent,
        },
        message: 'Chế độ Xem trước Admin: Đã chấm điểm kiểm tra (không lưu kết quả vào tiến độ học tập).',
      },
    }
  }

  // Xây dựng câu lệnh SQL lưu Attempt, QuestionAnswers và mở khóa tuần tự nếu Passed (>= 80%)
  const answerInserts = gradedDetails
    .map(
      (g) =>
        `INSERT INTO dbo.QuestionAnswers (AttemptId, QuestionId, SelectedOptionId, IsCorrect) VALUES (@AttemptId, ${g.questionId}, ${g.selectedOptionId ?? 'NULL'}, ${g.isCorrect ? 1 : 0});`,
    )
    .join('\n')

  interface RawPostSubmitState {
    AttemptId: number
    LessonUnlockStatus: UnlockStatusType
    LessonProgressPercent: number
    BestQuizScorePercent: number
    UnlockedNextLessonId: number | null
    UnlockedNextLessonTitle: string | null
    UnlockedNextLevelId: number | null
    UnlockedNextLevelTitle: string | null
    OverallProgressPercent: number
    CompletedLessonsCount: number
  }

  const postSubmitRows = await executeSqlJsonQuery<RawPostSubmitState[]>(`
    DECLARE @Uid NVARCHAR(128) = ${safeUid};
    DECLARE @ExerciseId INT = ${meta.ExerciseId};
    DECLARE @LessonId INT = ${meta.LessonId};
    DECLARE @LevelId INT = ${meta.LevelId};
    DECLARE @TotalQ INT = ${totalQuestions};
    DECLARE @CorrectC INT = ${correctCount};
    DECLARE @ScorePct INT = ${scorePercent};
    DECLARE @Passed BIT = ${passed ? 1 : 0};
    DECLARE @Dur INT = ${durationSeconds};

    INSERT INTO dbo.ExerciseAttempts (UserUid, ExerciseId, LessonId, TotalQuestions, CorrectCount, ScorePercent, Passed, DurationSeconds)
    VALUES (@Uid, @ExerciseId, @LessonId, @TotalQ, @CorrectC, @ScorePct, @Passed, @Dur);

    DECLARE @AttemptId INT = SCOPE_IDENTITY();
    ${answerInserts}

    DECLARE @UnlockedNextLessonId INT = NULL;
    DECLARE @UnlockedNextLessonTitle NVARCHAR(255) = NULL;
    DECLARE @UnlockedNextLevelId INT = NULL;
    DECLARE @UnlockedNextLevelTitle NVARCHAR(255) = NULL;

    IF @Passed = 1
    BEGIN
      -- Đánh dấu hoàn thành hoạt động final_test của buổi học
      UPDATE uap
      SET IsCompleted = 1,
          ScorePercent = CASE WHEN ISNULL(uap.ScorePercent, 0) < @ScorePct THEN @ScorePct ELSE uap.ScorePercent END,
          CompletedAt = ISNULL(uap.CompletedAt, SYSUTCDATETIME()),
          UpdatedAt = SYSUTCDATETIME()
      FROM dbo.UserActivityProgress uap
      INNER JOIN dbo.LessonActivities a ON a.ActivityId = uap.ActivityId
      WHERE uap.UserUid = @Uid AND a.LessonId = @LessonId AND a.ActivityType = 'final_test';

      INSERT INTO dbo.UserActivityProgress (UserUid, LessonId, ActivityId, IsCompleted, ScorePercent, TimeSpentSeconds, CompletedAt)
      SELECT @Uid, @LessonId, a.ActivityId, 1, @ScorePct, @Dur, SYSUTCDATETIME()
      FROM dbo.LessonActivities a
      WHERE a.LessonId = @LessonId AND a.ActivityType = 'final_test'
        AND NOT EXISTS (SELECT 1 FROM dbo.UserActivityProgress uap WHERE uap.UserUid = @Uid AND uap.ActivityId = a.ActivityId);

      -- Hoàn thành buổi học hiện tại (100%)
      DECLARE @TotReq INT = (SELECT COUNT(*) FROM dbo.LessonActivities WHERE LessonId = @LessonId AND IsRequired = 1 AND Status = 'Published');
      UPDATE dbo.UserLessonProgress
      SET UnlockStatus = 'Completed',
          CompletedRequiredActivities = @TotReq,
          TotalRequiredActivities = @TotReq,
          BestQuizScorePercent = CASE WHEN BestQuizScorePercent < @ScorePct THEN @ScorePct ELSE BestQuizScorePercent END,
          QuizAttemptsCount = QuizAttemptsCount + 1,
          ProgressPercent = 100,
          CompletedAt = ISNULL(CompletedAt, SYSUTCDATETIME()),
          UpdatedAt = SYSUTCDATETIME()
      WHERE UserUid = @Uid AND LessonId = @LessonId;

      -- Tìm buổi học tiếp theo trong cùng chặng
      DECLARE @CurOrder INT = (SELECT DisplayOrder FROM dbo.Lessons WHERE LessonId = @LessonId);
      SELECT TOP 1
        @UnlockedNextLessonId = ls.LessonId,
        @UnlockedNextLessonTitle = ls.Title
      FROM dbo.Lessons ls
      WHERE ls.LevelId = @LevelId AND ls.Status = 'Published' AND ls.DisplayOrder > @CurOrder
      ORDER BY ls.DisplayOrder ASC;

      IF @UnlockedNextLessonId IS NOT NULL
      BEGIN
        UPDATE dbo.UserLessonProgress
        SET UnlockStatus = CASE WHEN UnlockStatus = 'Locked' THEN 'InProgress' ELSE UnlockStatus END,
            UnlockedAt = ISNULL(UnlockedAt, SYSUTCDATETIME()),
            UpdatedAt = SYSUTCDATETIME()
        WHERE UserUid = @Uid AND LessonId = @UnlockedNextLessonId;
      END

      -- Cập nhật tiến độ của Chặng hiện tại (UserLevelProgress)
      DECLARE @LevelCompLessons INT = (
        SELECT COUNT(*) FROM dbo.UserLessonProgress WHERE UserUid = @Uid AND LevelId = @LevelId AND UnlockStatus = 'Completed'
      );
      DECLARE @LevelTotalLessons INT = (
        SELECT COUNT(*) FROM dbo.Lessons WHERE LevelId = @LevelId AND Status = 'Published'
      );
      DECLARE @LevelPct DECIMAL(5,2) = CASE WHEN @LevelTotalLessons > 0 THEN ROUND((CAST(@LevelCompLessons AS DECIMAL(5,2)) * 100.0) / @LevelTotalLessons, 2) ELSE 0 END;

      UPDATE dbo.UserLevelProgress
      SET CompletedLessonsCount = @LevelCompLessons,
          TotalLessonsCount = @LevelTotalLessons,
          ProgressPercent = @LevelPct,
          UnlockStatus = CASE WHEN @LevelCompLessons >= @LevelTotalLessons THEN 'Completed' ELSE 'InProgress' END,
          CompletedAt = CASE WHEN @LevelCompLessons >= @LevelTotalLessons THEN ISNULL(CompletedAt, SYSUTCDATETIME()) ELSE CompletedAt END,
          UpdatedAt = SYSUTCDATETIME()
      WHERE UserUid = @Uid AND LevelId = @LevelId;

      -- Nếu đã hoàn thành toàn bộ buổi học của Chặng hiện tại -> Mở khóa Chặng kế tiếp và Buổi đầu tiên của Chặng kế tiếp!
      IF @LevelCompLessons >= @LevelTotalLessons
      BEGIN
        DECLARE @CurLevelOrder INT = (SELECT DisplayOrder FROM dbo.LearningLevels WHERE LevelId = @LevelId);
        SELECT TOP 1
          @UnlockedNextLevelId = lv.LevelId,
          @UnlockedNextLevelTitle = lv.Title
        FROM dbo.LearningLevels lv
        WHERE lv.Status = 'Published' AND lv.DisplayOrder > @CurLevelOrder
        ORDER BY lv.DisplayOrder ASC;

        IF @UnlockedNextLevelId IS NOT NULL
        BEGIN
          UPDATE dbo.UserLevelProgress
          SET UnlockStatus = CASE WHEN UnlockStatus = 'Locked' THEN 'Available' ELSE UnlockStatus END,
              UnlockedAt = ISNULL(UnlockedAt, SYSUTCDATETIME()),
              UpdatedAt = SYSUTCDATETIME()
          WHERE UserUid = @Uid AND LevelId = @UnlockedNextLevelId;

          SELECT TOP 1
            @UnlockedNextLessonId = ls.LessonId,
            @UnlockedNextLessonTitle = ls.Title
          FROM dbo.Lessons ls
          WHERE ls.LevelId = @UnlockedNextLevelId AND ls.Status = 'Published'
          ORDER BY ls.DisplayOrder ASC;

          IF @UnlockedNextLessonId IS NOT NULL
          BEGIN
            UPDATE dbo.UserLessonProgress
            SET UnlockStatus = CASE WHEN UnlockStatus = 'Locked' THEN 'Available' ELSE UnlockStatus END,
                UnlockedAt = ISNULL(UnlockedAt, SYSUTCDATETIME()),
                UpdatedAt = SYSUTCDATETIME()
            WHERE UserUid = @Uid AND LessonId = @UnlockedNextLessonId;
          END
        END
      END

      -- Cập nhật tiến độ tổng thể toàn lộ trình (UserLearningProgress)
      DECLARE @AllComp INT = (SELECT COUNT(*) FROM dbo.UserLessonProgress WHERE UserUid = @Uid AND UnlockStatus = 'Completed');
      DECLARE @AllTot INT = (SELECT COUNT(*) FROM dbo.Lessons WHERE Status = 'Published');
      DECLARE @AllPct DECIMAL(5,2) = CASE WHEN @AllTot > 0 THEN ROUND((CAST(@AllComp AS DECIMAL(5,2)) * 100.0) / @AllTot, 2) ELSE 0 END;
      DECLARE @NextActiveLessonId INT = ISNULL(@UnlockedNextLessonId, @LessonId);
      DECLARE @NextActiveLevelId INT = (SELECT LevelId FROM dbo.Lessons WHERE LessonId = @NextActiveLessonId);
      DECLARE @NextActiveActId INT = (SELECT TOP 1 ActivityId FROM dbo.LessonActivities WHERE LessonId = @NextActiveLessonId AND Status = 'Published' ORDER BY DisplayOrder ASC);

      UPDATE dbo.UserLearningProgress
      SET CurrentLevelId = @NextActiveLevelId,
          CurrentLessonId = @NextActiveLessonId,
          CurrentActivityId = @NextActiveActId,
          CompletedLessonsCount = @AllComp,
          OverallProgressPercent = @AllPct,
          TotalXpEarned = TotalXpEarned + 50,
          LastAccessedAt = SYSUTCDATETIME(),
          UpdatedAt = SYSUTCDATETIME()
      WHERE UserUid = @Uid;

      INSERT INTO dbo.UserStudySessions (UserUid, LessonId, SessionType, DurationSeconds, XpEarned, SummaryText)
      VALUES (@Uid, @LessonId, 'lesson_complete', @Dur, 50, ${sqlStr('Vượt qua bài kiểm tra (' + scorePercent + '%) và hoàn thành: ' + meta.LessonTitle)});
    END
    ELSE
    BEGIN
      -- Chưa đạt 80%: cập nhật số lần thử & điểm cao nhất, giữ trạng thái InProgress để học viên làm lại
      UPDATE dbo.UserLessonProgress
      SET BestQuizScorePercent = CASE WHEN BestQuizScorePercent < @ScorePct THEN @ScorePct ELSE BestQuizScorePercent END,
          QuizAttemptsCount = QuizAttemptsCount + 1,
          UnlockStatus = CASE WHEN UnlockStatus = 'Completed' THEN 'Completed' ELSE 'InProgress' END,
          UpdatedAt = SYSUTCDATETIME()
      WHERE UserUid = @Uid AND LessonId = @LessonId;

      INSERT INTO dbo.UserStudySessions (UserUid, LessonId, SessionType, DurationSeconds, XpEarned, SummaryText)
      VALUES (@Uid, @LessonId, 'quiz_submit', @Dur, 5, ${sqlStr('Làm bài kiểm tra (' + scorePercent + '% - Chưa đạt 80%): ' + meta.LessonTitle)});
    END

    SELECT
      @AttemptId AS AttemptId,
      ulsp.UnlockStatus AS LessonUnlockStatus,
      ulsp.ProgressPercent AS LessonProgressPercent,
      ulsp.BestQuizScorePercent,
      @UnlockedNextLessonId AS UnlockedNextLessonId,
      @UnlockedNextLessonTitle AS UnlockedNextLessonTitle,
      @UnlockedNextLevelId AS UnlockedNextLevelId,
      @UnlockedNextLevelTitle AS UnlockedNextLevelTitle,
      ulp.OverallProgressPercent,
      ulp.CompletedLessonsCount
    FROM dbo.UserLessonProgress ulsp
    INNER JOIN dbo.UserLearningProgress ulp ON ulp.UserUid = ulsp.UserUid
    WHERE ulsp.UserUid = @Uid AND ulsp.LessonId = @LessonId
    FOR JSON PATH;
  `)

  const postState = postSubmitRows[0]

  return {
    ok: true,
    data: {
      attemptId: postState?.AttemptId ?? 1,
      exerciseId: meta.ExerciseId,
      lessonId: meta.LessonId,
      lessonTitle: meta.LessonTitle,
      totalQuestions,
      correctCount,
      scorePercent,
      passingScorePercent: passThreshold,
      passed,
      canRetake: true,
      message: passed
        ? `Chúc mừng! Bạn đạt ${scorePercent}% (${correctCount}/${totalQuestions} câu đúng) — Đã hoàn thành buổi học${postState?.UnlockedNextLessonTitle ? ` và mở khóa "${postState.UnlockedNextLessonTitle}"` : ''}!`
        : `Bạn đạt ${scorePercent}% (${correctCount}/${totalQuestions} câu đúng), chưa đạt ngưỡng ${passThreshold}%. Hãy xem giải thích chi tiết bên dưới và làm lại nhé!`,
      progression: {
        lessonUnlockStatus: postState?.LessonUnlockStatus ?? 'InProgress',
        lessonProgressPercent: Number(postState?.LessonProgressPercent ?? 0),
        bestQuizScorePercent: postState?.BestQuizScorePercent ?? scorePercent,
        unlockedNextLessonId: postState?.UnlockedNextLessonId ?? null,
        unlockedNextLessonTitle: postState?.UnlockedNextLessonTitle ?? null,
        unlockedNextLevelId: postState?.UnlockedNextLevelId ?? null,
        unlockedNextLevelTitle: postState?.UnlockedNextLevelTitle ?? null,
        overallProgressPercent: Number(postState?.OverallProgressPercent ?? 0),
        completedLessonsCount: postState?.CompletedLessonsCount ?? 0,
      },
      questionsReview: gradedDetails,
    },
  }
}

/**
 * 7. GET /api/learning-progress/continue
 * Xác định chính xác chặng, buổi học và hoạt động chưa hoàn thành gần nhất của học viên
 */
export async function getContinueLearningTargetForUser(userUid: string) {
  await ensureUserLearningProgressInitialized(userUid)
  const safeUid = sqlStr(userUid)

  interface RawContinueTarget {
    LevelId: number
    LevelCode: string
    LevelBadge: string
    LevelTitle: string
    LessonId: number
    LessonCode: string
    LessonNumber: number
    LessonTitle: string
    LessonUnlockStatus: UnlockStatusType
    LessonProgressPercent: number
    ActivityId: number | null
    ActivityCode: string | null
    ActivityType: string | null
    ActivityTitle: string | null
  }

  const rows = await executeSqlJsonQuery<RawContinueTarget[]>(`
    DECLARE @Uid NVARCHAR(128) = ${safeUid};
    SELECT TOP 1
      lv.LevelId,
      lv.LevelCode,
      lv.BadgeText AS LevelBadge,
      lv.Title AS LevelTitle,
      ls.LessonId,
      ls.LessonCode,
      ls.LessonNumber,
      ls.Title AS LessonTitle,
      ulsp.UnlockStatus AS LessonUnlockStatus,
      ulsp.ProgressPercent AS LessonProgressPercent,
      nextAct.ActivityId,
      nextAct.ActivityCode,
      nextAct.ActivityType,
      nextAct.Title AS ActivityTitle
    FROM dbo.UserLessonProgress ulsp
    INNER JOIN dbo.Lessons ls ON ls.LessonId = ulsp.LessonId
    INNER JOIN dbo.LearningLevels lv ON lv.LevelId = ls.LevelId
    OUTER APPLY (
      SELECT TOP 1 a.ActivityId, a.ActivityCode, a.ActivityType, a.Title
      FROM dbo.LessonActivities a
      LEFT JOIN dbo.UserActivityProgress uap ON uap.ActivityId = a.ActivityId AND uap.UserUid = @Uid
      WHERE a.LessonId = ls.LessonId AND a.Status = 'Published' AND ISNULL(uap.IsCompleted, 0) = 0
      ORDER BY a.DisplayOrder ASC
    ) nextAct
    WHERE ulsp.UserUid = @Uid
      AND ulsp.UnlockStatus IN ('InProgress', 'Available')
      AND ls.Status = 'Published'
    ORDER BY lv.DisplayOrder ASC, ls.DisplayOrder ASC
    FOR JSON PATH;
  `).catch(() => [] as RawContinueTarget[])

  if (!rows || rows.length === 0) {
    const fallback = await getLearningPathForUser(userUid)
    return {
      levelId: fallback.journey.currentLevelId,
      levelBadge: fallback.journey.currentLevelBadge,
      levelTitle: fallback.journey.currentLevelTitle,
      lessonId: fallback.journey.currentLessonId,
      lessonCode: fallback.journey.currentLessonCode,
      lessonTitle: fallback.journey.currentLessonTitle,
      activityId: fallback.journey.currentActivityId,
      activityType: 'theory',
      activityTitle: 'Ôn tập lại lộ trình',
    }
  }

  const r = rows[0]
  return {
    levelId: r.LevelId,
    levelCode: r.LevelCode,
    levelBadge: r.LevelBadge,
    levelTitle: r.LevelTitle,
    lessonId: r.LessonId,
    lessonCode: r.LessonCode,
    lessonNumber: r.LessonNumber,
    lessonTitle: r.LessonTitle,
    lessonUnlockStatus: r.LessonUnlockStatus,
    lessonProgressPercent: Number(r.LessonProgressPercent || 0),
    activityId: r.ActivityId,
    activityCode: r.ActivityCode,
    activityType: r.ActivityType || 'theory',
    activityTitle: r.ActivityTitle || 'Bắt đầu bài học',
  }
}

/**
 * 8. Theo dõi tiến độ học tập của toàn bộ học viên dành cho Admin (Mục 2 yêu cầu):
 * - Xem danh sách tất cả học viên (từ Firestore / UserStore)
 * - Tra cứu trạng thái trong 7 chặng, chủ đề, buổi học hiện tại, tiến độ %, số buổi hoàn thành
 * - Thống kê số hoạt động hoàn thành / dang dở, điểm kiểm tra trung bình, số lần làm bài
 */
export async function getAllStudentsLearningTracking(searchQuery = '') {
  const students = getAllStudentAccounts()
  const q = searchQuery.toLowerCase().trim()
  const filtered = q
    ? students.filter(
        (s) =>
          (s.displayName && s.displayName.toLowerCase().includes(q)) ||
          (s.email && s.email.toLowerCase().includes(q)) ||
          s.uid.toLowerCase().includes(q),
      )
    : students

  if (filtered.length === 0) {
    return []
  }

  // Khởi tạo UserLearningProgress cho các học viên chưa khởi tạo
  for (const s of filtered) {
    try {
      await ensureUserLearningProgressInitialized(s.uid)
    } catch {
      // bỏ qua lỗi nếu kết nối bận
    }
  }

  interface RawTrackingRow {
    UserUid: string
    CurrentLevelId: number
    CurrentLevelNumber: number
    CurrentLevelBadge: string
    CurrentLevelTitle: string
    CurrentTopicTitle: string | null
    CurrentLessonId: number
    CurrentLessonNumber: number
    CurrentLessonCode: string
    CurrentLessonTitle: string
    CompletedLessonsCount: number
    TotalPublishedLessons: number
    OverallProgressPercent: number
    TotalXpEarned: number
    CompletedActivitiesCount: number
    InProgressActivitiesCount: number
    TotalQuizAttempts: number
    AverageQuizScorePercent: number
    LastAccessedAt: string | null
  }

  const uidsInClause = filtered.map((s) => sqlStr(s.uid)).join(', ')

  let trackingRows: RawTrackingRow[] = []
  try {
    trackingRows = await executeSqlJsonQuery<RawTrackingRow[]>(`
      SELECT
        ulp.UserUid,
        ulp.CurrentLevelId,
        lv.DisplayOrder AS CurrentLevelNumber,
        lv.BadgeText AS CurrentLevelBadge,
        lv.Title AS CurrentLevelTitle,
        tp.Title AS CurrentTopicTitle,
        ulp.CurrentLessonId,
        ls.LessonNumber AS CurrentLessonNumber,
        ls.LessonCode AS CurrentLessonCode,
        ls.Title AS CurrentLessonTitle,
        ulp.CompletedLessonsCount,
        (SELECT COUNT(*) FROM dbo.Lessons WHERE Status = 'Published') AS TotalPublishedLessons,
        ulp.OverallProgressPercent,
        ulp.TotalXpEarned,
        (SELECT COUNT(*) FROM dbo.UserActivityProgress uap WHERE uap.UserUid = ulp.UserUid AND uap.IsCompleted = 1) AS CompletedActivitiesCount,
        (SELECT COUNT(*) FROM dbo.UserActivityProgress uap WHERE uap.UserUid = ulp.UserUid AND uap.IsCompleted = 0) AS InProgressActivitiesCount,
        (SELECT COUNT(*) FROM dbo.ExerciseAttempts ea WHERE ea.UserUid = ulp.UserUid) AS TotalQuizAttempts,
        ISNULL((SELECT AVG(CAST(ScorePercent AS FLOAT)) FROM dbo.ExerciseAttempts ea WHERE ea.UserUid = ulp.UserUid), 0) AS AverageQuizScorePercent,
        ulp.LastAccessedAt
      FROM dbo.UserLearningProgress ulp
      INNER JOIN dbo.LearningLevels lv ON lv.LevelId = ulp.CurrentLevelId
      INNER JOIN dbo.Lessons ls ON ls.LessonId = ulp.CurrentLessonId
      LEFT JOIN dbo.LearningTopics tp ON tp.TopicId = ls.TopicId
      WHERE ulp.UserUid IN (${uidsInClause})
      FOR JSON PATH;
    `)
  } catch {
    trackingRows = []
  }

  const trackingMap = new Map<string, RawTrackingRow>()
  for (const row of trackingRows) {
    trackingMap.set(row.UserUid, row)
  }

  return filtered.map((s) => {
    const row = trackingMap.get(s.uid)
    return {
      uid: s.uid,
      displayName: s.displayName || 'Học viên HANGO',
      email: s.email,
      photoURL: s.photoURL || null,
      locked: Boolean(s.locked),
      createdAt: s.createdAt,
      lastLoginAt: s.lastLoginAt,
      currentLevelId: row?.CurrentLevelId ?? 1,
      currentLevelNumber: row?.CurrentLevelNumber ?? 1,
      currentLevelBadge: row?.CurrentLevelBadge ?? '한글',
      currentLevelTitle: row?.CurrentLevelTitle ?? 'Bảng chữ cái Hangeul',
      currentTopicTitle: row?.CurrentTopicTitle ?? 'Làm quen bảng chữ cái',
      currentLessonId: row?.CurrentLessonId ?? 1,
      currentLessonNumber: row?.CurrentLessonNumber ?? 1,
      currentLessonCode: row?.CurrentLessonCode ?? 'HG_LESSON_01',
      currentLessonTitle: row?.CurrentLessonTitle ?? 'Buổi 1: Nguyên âm cơ bản 1',
      completedLessonsCount: row?.CompletedLessonsCount ?? 0,
      totalLessonsCount: row?.TotalPublishedLessons ?? 18,
      overallProgressPercent: Number(row?.OverallProgressPercent ?? 0),
      totalXp: row?.TotalXpEarned ?? 0,
      completedActivitiesCount: row?.CompletedActivitiesCount ?? 0,
      inProgressActivitiesCount: row?.InProgressActivitiesCount ?? 0,
      totalQuizAttempts: row?.TotalQuizAttempts ?? 0,
      averageQuizScorePercent: Math.round(Number(row?.AverageQuizScorePercent ?? 0)),
      lastAccessedAt: row?.LastAccessedAt ?? null,
    }
  })
}

/**
 * 9. Chi tiết hành trình học tập 7 chặng & lịch sử hoạt động của 1 học viên cụ thể (dành cho Admin khi click vào học viên)
 */
export async function getStudentDetailedLearningHistory(studentUid: string) {
  await ensureUserLearningProgressInitialized(studentUid)
  const safeUid = sqlStr(studentUid)

  const pathData = await getLearningPathForUser(studentUid, false)

  interface RawAttemptRow {
    AttemptId: number
    LessonId: number
    LessonNumber: number
    LessonTitle: string
    LevelTitle: string
    LevelBadge: string
    TotalQuestions: number
    CorrectCount: number
    ScorePercent: number
    Passed: boolean
    DurationSeconds: number
    AttemptedAt: string
  }

  const quizAttempts = await executeSqlJsonQuery<RawAttemptRow[]>(`
    SELECT
      ea.AttemptId,
      ea.LessonId,
      ls.LessonNumber,
      ls.Title AS LessonTitle,
      lv.Title AS LevelTitle,
      lv.BadgeText AS LevelBadge,
      ea.TotalQuestions,
      ea.CorrectCount,
      ea.ScorePercent,
      ea.Passed,
      ea.DurationSeconds,
      ea.AttemptedAt
    FROM dbo.ExerciseAttempts ea
    INNER JOIN dbo.Lessons ls ON ls.LessonId = ea.LessonId
    INNER JOIN dbo.LearningLevels lv ON lv.LevelId = ls.LevelId
    WHERE ea.UserUid = ${safeUid}
    ORDER BY ea.AttemptedAt DESC
    FOR JSON PATH;
  `).catch(() => [] as RawAttemptRow[])

  interface RawActRow {
    ActivityId: number
    LessonId: number
    LessonTitle: string
    ActivityTitle: string
    ActivityType: string
    IsCompleted: boolean
    ScorePercent: number | null
    TimeSpentSeconds: number
    CompletedAt: string | null
    UpdatedAt: string
  }

  const activityProgress = await executeSqlJsonQuery<RawActRow[]>(`
    SELECT
      uap.ActivityId,
      uap.LessonId,
      ls.Title AS LessonTitle,
      act.Title AS ActivityTitle,
      act.ActivityType,
      uap.IsCompleted,
      uap.ScorePercent,
      uap.TimeSpentSeconds,
      uap.CompletedAt,
      uap.UpdatedAt
    FROM dbo.UserActivityProgress uap
    INNER JOIN dbo.LessonActivities act ON act.ActivityId = uap.ActivityId
    INNER JOIN dbo.Lessons ls ON ls.LessonId = uap.LessonId
    WHERE uap.UserUid = ${safeUid}
    ORDER BY uap.UpdatedAt DESC
    FOR JSON PATH;
  `).catch(() => [] as RawActRow[])

  interface RawSessionRow {
    SessionId: number
    LessonId: number
    ActivityId: number | null
    SessionType: string
    DurationSeconds: number
    XpEarned: number
    SummaryText: string
    StartedAt: string
  }

  const studySessions = await executeSqlJsonQuery<RawSessionRow[]>(`
    SELECT TOP 30
      SessionId, LessonId, ActivityId, SessionType, DurationSeconds, XpEarned, SummaryText, StartedAt
    FROM dbo.UserStudySessions
    WHERE UserUid = ${safeUid}
    ORDER BY StartedAt DESC
    FOR JSON PATH;
  `).catch(() => [] as RawSessionRow[])

  return {
    pathData,
    quizAttempts,
    activityProgress,
    studySessions,
  }
}

/**
 * 10. Quản lý nội dung lộ trình dành cho Admin (Mục 1 yêu cầu):
 * Cho phép Admin:
 * - Thêm, chỉnh sửa, xóa (archive) hoặc ẩn chủ đề và buổi học
 * - Quản lý lý thuyết, từ vựng, ngữ pháp, flashcard, bài tập trắc nghiệm, câu hỏi, đáp án và tài liệu
 * - Thay đổi thứ tự chủ đề và buổi học
 * - Lưu nháp (Draft) và xuất bản (Published) nội dung
 * - Cập nhật điều kiện mở khóa / hoàn thành (MinQuizPassPercent, RequireAllMandatoryActivities)
 */
export async function adminMutateCurriculumInSqlServer(payload: {
  action:
    | 'create_lesson'
    | 'update_lesson'
    | 'delete_lesson'
    | 'reorder_lessons'
    | 'create_topic'
    | 'update_topic'
    | 'delete_topic'
    | 'reorder_topics'
    | 'toggle_publish_status'
    | 'update_lesson_rule'
    | 'toggle_activity_required'
    | 'update_level'
    | 'save_section'
    | 'delete_section'
    | 'save_vocab'
    | 'delete_vocab'
    | 'save_grammar'
    | 'delete_grammar'
    | 'save_question'
    | 'delete_question'
    | 'save_resource'
    | 'delete_resource'
  levelId?: number
  topicId?: number
  lessonId?: number
  activityId?: number
  exerciseId?: number
  questionId?: number
  sectionId?: number
  vocabId?: number
  grammarId?: number
  resourceId?: number
  title?: string
  subtitle?: string
  learningObjective?: string
  textbookName?: string
  description?: string
  estimatedMinutes?: number
  displayOrder?: number
  minQuizPassPercent?: number
  requireAllMandatoryActivities?: boolean
  isRequired?: boolean
  status?: 'Draft' | 'Published' | 'Archived' | 'Active' | 'Inactive'
  target?: 'lesson' | 'topic'
  id?: number
  sectionType?: string
  contentHtmlOrMd?: string
  wordKo?: string
  pronunciation?: string
  meaningVi?: string
  wordType?: string
  exampleSentenceKo?: string
  exampleSentenceVi?: string
  patternKo?: string
  explanationVi?: string
  promptText?: string
  options?: Array<{ optionLabel: string; optionText: string; isCorrect: boolean }>
  resourceType?: string
  fileUrlOrStorageKey?: string
  orders?: Array<{ topicId?: number; lessonId?: number; displayOrder: number }>
}) {
  // 1. Quản lý Quy tắc Buổi học
  if (payload.action === 'update_lesson_rule' && payload.lessonId) {
    const lessonId = sqlInt(payload.lessonId)
    const minPass = Math.max(50, Math.min(100, sqlInt(payload.minQuizPassPercent, 80)))
    const reqMand = payload.requireAllMandatoryActivities === false ? 0 : 1
    await executeSqlJsonQuery(`
      UPDATE dbo.LessonCompletionRules
      SET MinQuizPassPercent = ${minPass},
          RequireAllMandatoryActivities = ${reqMand},
          UpdatedAt = SYSUTCDATETIME()
      WHERE LessonId = ${lessonId};
      UPDATE dbo.Exercises
      SET PassingScorePercent = ${minPass},
          UpdatedAt = SYSUTCDATETIME()
      WHERE LessonId = ${lessonId};
      SELECT 1 AS Updated FOR JSON PATH;
    `)
    return { updated: true, lessonId, minQuizPassPercent: minPass, requireAllMandatoryActivities: Boolean(reqMand) }
  }

  // 2. Bật/Tắt hoạt động bắt buộc
  if (payload.action === 'toggle_activity_required' && payload.activityId) {
    const actId = sqlInt(payload.activityId)
    const isReq = payload.isRequired ? 1 : 0
    await executeSqlJsonQuery(`
      UPDATE dbo.LessonActivities
      SET IsRequired = ${isReq},
          UpdatedAt = SYSUTCDATETIME()
      WHERE ActivityId = ${actId};
      SELECT 1 AS Updated FOR JSON PATH;
    `)
    return { updated: true, activityId: actId, isRequired: Boolean(isReq) }
  }

  // 3. Cập nhật thông tin Chặng (Level)
  if (payload.action === 'update_level' && payload.levelId) {
    const lvlId = sqlInt(payload.levelId)
    await executeSqlJsonQuery(`
      UPDATE dbo.LearningLevels
      SET TextbookName = ISNULL(${payload.textbookName ? sqlStr(payload.textbookName) : 'NULL'}, TextbookName),
          Description = ISNULL(${payload.description ? sqlStr(payload.description) : 'NULL'}, Description),
          UpdatedAt = SYSUTCDATETIME()
      WHERE LevelId = ${lvlId};
      SELECT 1 AS Updated FOR JSON PATH;
    `)
    return { updated: true, levelId: lvlId }
  }

  // 4. Tạo Buổi học mới (Hỗ trợ Lưu nháp hoặc Xuất bản)
  if (payload.action === 'create_lesson' && payload.levelId && payload.topicId && payload.title) {
    const lvlId = sqlInt(payload.levelId)
    const topId = sqlInt(payload.topicId)
    const code = `CUSTOM_LES_${Date.now()}`
    const status = payload.status || 'Published'
    const estMin = sqlInt(payload.estimatedMinutes, 25)
    const created = await executeSqlJsonQuery<Array<{ LessonId: number }>>(`
      DECLARE @NextOrder INT = ISNULL((SELECT MAX(DisplayOrder) FROM dbo.Lessons WHERE LevelId = ${lvlId}), 0) + 1;
      INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
      ) VALUES (
        ${topId}, ${lvlId}, ${sqlStr(code)}, @NextOrder,
        ${sqlStr(payload.title)},
        ${sqlStr(payload.subtitle || 'Buổi học do Quản trị viên biên soạn')},
        ${sqlStr(payload.learningObjective || 'Nắm vững kiến thức trọng tâm của buổi học.')},
        ${estMin}, @NextOrder, ${sqlStr(status)}, 0, 0
      );
      DECLARE @NewLessonId INT = SCOPE_IDENTITY();
      INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
      VALUES (@NewLessonId, 1, 1, 80, 1, 1);
      INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
      VALUES (@NewLessonId, ${sqlStr(code + '_ACT1')}, 'theory', N'Lý thuyết trọng tâm', N'Đọc kỹ nội dung bài học.', 1, 1, 20, ${sqlStr(status)});
      INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
      VALUES (@NewLessonId, ${sqlStr(code + '_EX')}, 'multiple_choice', N'Bài kiểm tra cuối buổi', N'Đạt tối thiểu 80% để hoàn thành buổi học.', 80, 600, 1, ${sqlStr(status)});
      SELECT @NewLessonId AS LessonId FOR JSON PATH;
    `)
    return { created: true, lessonId: created[0]?.LessonId, lessonCode: code }
  }

  // 5. Cập nhật thông tin Buổi học
  if (payload.action === 'update_lesson' && payload.lessonId) {
    const lesId = sqlInt(payload.lessonId)
    const titleClause = payload.title ? `Title = ${sqlStr(payload.title)},` : ''
    const subClause = payload.subtitle !== undefined ? `Subtitle = ${sqlStr(payload.subtitle)},` : ''
    const objClause = payload.learningObjective !== undefined ? `LearningObjective = ${sqlStr(payload.learningObjective)},` : ''
    const minClause = payload.estimatedMinutes !== undefined ? `EstimatedMinutes = ${sqlInt(payload.estimatedMinutes, 25)},` : ''
    const statusClause = payload.status ? `Status = ${sqlStr(payload.status)},` : ''
    const topClause = payload.topicId ? `TopicId = ${sqlInt(payload.topicId)},` : ''
    const orderClause = payload.displayOrder !== undefined ? `DisplayOrder = ${sqlInt(payload.displayOrder)},` : ''

    await executeSqlJsonQuery(`
      UPDATE dbo.Lessons
      SET ${titleClause} ${subClause} ${objClause} ${minClause} ${statusClause} ${topClause} ${orderClause} UpdatedAt = SYSUTCDATETIME()
      WHERE LessonId = ${lesId};
      SELECT 1 AS Updated FOR JSON PATH;
    `)
    return { updated: true, lessonId: lesId }
  }

  // 6. Xóa (Archive) Buổi học
  if (payload.action === 'delete_lesson' && payload.lessonId) {
    const lesId = sqlInt(payload.lessonId)
    await executeSqlJsonQuery(`
      UPDATE dbo.Lessons SET Status = 'Archived', UpdatedAt = SYSUTCDATETIME() WHERE LessonId = ${lesId};
      SELECT 1 AS Deleted FOR JSON PATH;
    `)
    return { deleted: true, lessonId: lesId }
  }

  // 7. Thay đổi thứ tự các Buổi học
  if (payload.action === 'reorder_lessons' && Array.isArray(payload.orders)) {
    for (const item of payload.orders) {
      if (item.lessonId && item.displayOrder !== undefined) {
        await executeSqlJsonQuery(`
          UPDATE dbo.Lessons SET DisplayOrder = ${sqlInt(item.displayOrder)}, UpdatedAt = SYSUTCDATETIME() WHERE LessonId = ${sqlInt(item.lessonId)};
        `)
      }
    }
    return { reordered: true }
  }

  // 8. Tạo Chủ đề (Topic) mới
  if (payload.action === 'create_topic' && payload.levelId && payload.title) {
    const lvlId = sqlInt(payload.levelId)
    const title = sqlStr(payload.title)
    const desc = sqlStr(payload.description || '')
    const code = `TOP_${Date.now()}`
    const status = sqlStr(payload.status || 'Published')
    const res = await executeSqlJsonQuery<Array<{ TopicId: number }>>(`
      DECLARE @NextOrder INT = ISNULL((SELECT MAX(DisplayOrder) FROM dbo.LearningTopics WHERE LevelId = ${lvlId}), 0) + 1;
      INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
      VALUES (${lvlId}, ${sqlStr(code)}, ${title}, ${desc}, @NextOrder, ${status});
      SELECT SCOPE_IDENTITY() AS TopicId FOR JSON PATH;
    `)
    return { created: true, topicId: res[0]?.TopicId, topicCode: code }
  }

  // 9. Cập nhật Chủ đề (Topic)
  if (payload.action === 'update_topic' && payload.topicId) {
    const topId = sqlInt(payload.topicId)
    const titleClause = payload.title ? `Title = ${sqlStr(payload.title)},` : ''
    const descClause = payload.description !== undefined ? `Description = ${sqlStr(payload.description)},` : ''
    const statusClause = payload.status ? `Status = ${sqlStr(payload.status)},` : ''
    const orderClause = payload.displayOrder !== undefined ? `DisplayOrder = ${sqlInt(payload.displayOrder)},` : ''

    await executeSqlJsonQuery(`
      UPDATE dbo.LearningTopics
      SET ${titleClause} ${descClause} ${statusClause} ${orderClause} UpdatedAt = SYSUTCDATETIME()
      WHERE TopicId = ${topId};
      SELECT 1 AS Updated FOR JSON PATH;
    `)
    return { updated: true, topicId: topId }
  }

  // 10. Xóa Chủ đề (Topic)
  if (payload.action === 'delete_topic' && payload.topicId) {
    const topId = sqlInt(payload.topicId)
    await executeSqlJsonQuery(`
      UPDATE dbo.LearningTopics SET Status = 'Archived', UpdatedAt = SYSUTCDATETIME() WHERE TopicId = ${topId};
      UPDATE dbo.Lessons SET Status = 'Archived', UpdatedAt = SYSUTCDATETIME() WHERE TopicId = ${topId};
      SELECT 1 AS Deleted FOR JSON PATH;
    `)
    return { deleted: true, topicId: topId }
  }

  // 11. Thay đổi thứ tự các Chủ đề
  if (payload.action === 'reorder_topics' && Array.isArray(payload.orders)) {
    for (const item of payload.orders) {
      if (item.topicId && item.displayOrder !== undefined) {
        await executeSqlJsonQuery(`
          UPDATE dbo.LearningTopics SET DisplayOrder = ${sqlInt(item.displayOrder)}, UpdatedAt = SYSUTCDATETIME() WHERE TopicId = ${sqlInt(item.topicId)};
        `)
      }
    }
    return { reordered: true }
  }

  // 12. Chuyển đổi Trạng thái Xuất bản (Draft <-> Published)
  if (payload.action === 'toggle_publish_status' && payload.target && payload.id && payload.status) {
    const id = sqlInt(payload.id)
    const status = sqlStr(payload.status)
    if (payload.target === 'lesson') {
      await executeSqlJsonQuery(`
        UPDATE dbo.Lessons SET Status = ${status}, UpdatedAt = SYSUTCDATETIME() WHERE LessonId = ${id};
        SELECT 1 AS Updated FOR JSON PATH;
      `)
    } else if (payload.target === 'topic') {
      await executeSqlJsonQuery(`
        UPDATE dbo.LearningTopics SET Status = ${status}, UpdatedAt = SYSUTCDATETIME() WHERE TopicId = ${id};
        SELECT 1 AS Updated FOR JSON PATH;
      `)
    }
    return { updated: true, target: payload.target, id, status: payload.status }
  }

  // 13. Lưu Lý thuyết (LessonSections)
  if (payload.action === 'save_section' && payload.lessonId && payload.title) {
    const lessonId = sqlInt(payload.lessonId)
    const secId = payload.sectionId ? sqlInt(payload.sectionId) : null
    const title = sqlStr(payload.title)
    const content = sqlStr(payload.contentHtmlOrMd || '')
    const secType = sqlStr(payload.sectionType || 'content')
    const displayOrder = sqlInt(payload.displayOrder, 1)

    if (secId) {
      await executeSqlJsonQuery(`
        UPDATE dbo.LessonSections
        SET Title = ${title},
            ContentHtmlOrMd = ${content},
            SectionType = ${secType},
            DisplayOrder = ${displayOrder},
            UpdatedAt = SYSUTCDATETIME()
        WHERE SectionId = ${secId};
        SELECT 1 AS Updated FOR JSON PATH;
      `)
      return { updated: true, sectionId: secId }
    } else {
      const secCode = `SEC_${Date.now()}`
      const res = await executeSqlJsonQuery<Array<{ SectionId: number }>>(`
        INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, DisplayOrder, Status)
        VALUES (${lessonId}, ${sqlStr(secCode)}, ${secType}, ${title}, ${content}, ${displayOrder}, 'Published');
        SELECT SCOPE_IDENTITY() AS SectionId FOR JSON PATH;
      `)
      return { created: true, sectionId: res[0]?.SectionId }
    }
  }

  // 14. Xóa Lý thuyết
  if (payload.action === 'delete_section' && payload.sectionId) {
    const secId = sqlInt(payload.sectionId)
    await executeSqlJsonQuery(`
      DELETE FROM dbo.LessonSections WHERE SectionId = ${secId};
      SELECT 1 AS Deleted FOR JSON PATH;
    `)
    return { deleted: true, sectionId: secId }
  }

  // 15. Lưu Từ vựng & Flashcard (dbo.Vocabulary & dbo.LessonVocabulary)
  if (payload.action === 'save_vocab' && payload.lessonId && payload.wordKo) {
    const lessonId = sqlInt(payload.lessonId)
    const vocabId = payload.vocabId ? sqlInt(payload.vocabId) : null
    const wordKo = sqlStr(payload.wordKo)
    const pron = sqlStr(payload.pronunciation || '')
    const meanVi = sqlStr(payload.meaningVi || '')
    const wordType = sqlStr(payload.wordType || 'noun')
    const exKo = sqlStr(payload.exampleSentenceKo || '')
    const exVi = sqlStr(payload.exampleSentenceVi || '')
    const displayOrder = sqlInt(payload.displayOrder, 1)

    if (vocabId) {
      await executeSqlJsonQuery(`
        UPDATE dbo.Vocabulary
        SET WordKo = ${wordKo},
            Pronunciation = ${pron},
            MeaningVi = ${meanVi},
            WordType = ${wordType},
            ExampleSentenceKo = ${exKo},
            ExampleSentenceVi = ${exVi},
            UpdatedAt = SYSUTCDATETIME()
        WHERE VocabId = ${vocabId};
        UPDATE dbo.LessonVocabulary
        SET DisplayOrder = ${displayOrder}
        WHERE LessonId = ${lessonId} AND VocabId = ${vocabId};
        SELECT 1 AS Updated FOR JSON PATH;
      `)
      return { updated: true, vocabId }
    } else {
      const res = await executeSqlJsonQuery<Array<{ VocabId: number }>>(`
        INSERT INTO dbo.Vocabulary (WordKo, Pronunciation, MeaningVi, WordType, ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, Status)
        VALUES (${wordKo}, ${pron}, ${meanVi}, ${wordType}, ${exKo}, ${exVi}, 'A1', N'TOPIK I', N'Từ vựng buổi học', 'Published');
        DECLARE @NewVocabId INT = SCOPE_IDENTITY();
        INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder)
        VALUES (${lessonId}, @NewVocabId, ${displayOrder});
        SELECT @NewVocabId AS VocabId FOR JSON PATH;
      `)
      return { created: true, vocabId: res[0]?.VocabId }
    }
  }

  // 16. Xóa Từ vựng khỏi Buổi học
  if (payload.action === 'delete_vocab' && payload.lessonId && payload.vocabId) {
    const lessonId = sqlInt(payload.lessonId)
    const vocabId = sqlInt(payload.vocabId)
    await executeSqlJsonQuery(`
      DELETE FROM dbo.LessonVocabulary WHERE LessonId = ${lessonId} AND VocabId = ${vocabId};
      SELECT 1 AS Deleted FOR JSON PATH;
    `)
    return { deleted: true, vocabId }
  }

  // 17. Lưu Ngữ pháp (dbo.Grammar & dbo.LessonGrammar)
  if (payload.action === 'save_grammar' && payload.lessonId && payload.patternKo) {
    const lessonId = sqlInt(payload.lessonId)
    const grammarId = payload.grammarId ? sqlInt(payload.grammarId) : null
    const patternKo = sqlStr(payload.patternKo)
    const meanVi = sqlStr(payload.meaningVi || '')
    const expVi = sqlStr(payload.explanationVi || '')
    const exKo = sqlStr(payload.exampleSentenceKo || '')
    const exVi = sqlStr(payload.exampleSentenceVi || '')
    const displayOrder = sqlInt(payload.displayOrder, 1)

    if (grammarId) {
      await executeSqlJsonQuery(`
        UPDATE dbo.Grammar
        SET PatternKo = ${patternKo},
            MeaningVi = ${meanVi},
            ExplanationVi = ${expVi},
            ExampleSentenceKo = ${exKo},
            ExampleSentenceVi = ${exVi},
            UpdatedAt = SYSUTCDATETIME()
        WHERE GrammarId = ${grammarId};
        UPDATE dbo.LessonGrammar
        SET DisplayOrder = ${displayOrder}
        WHERE LessonId = ${lessonId} AND GrammarId = ${grammarId};
        SELECT 1 AS Updated FOR JSON PATH;
      `)
      return { updated: true, grammarId }
    } else {
      const res = await executeSqlJsonQuery<Array<{ GrammarId: number }>>(`
        INSERT INTO dbo.Grammar (PatternKo, MeaningVi, StructureKo, ExplanationVi, ExampleSentenceKo, ExampleSentenceVi, TopikLevel, Status)
        VALUES (${patternKo}, ${meanVi}, ${patternKo}, ${expVi}, ${exKo}, ${exVi}, N'TOPIK I', 'Published');
        DECLARE @NewGId INT = SCOPE_IDENTITY();
        INSERT INTO dbo.LessonGrammar (LessonId, GrammarId, DisplayOrder)
        VALUES (${lessonId}, @NewGId, ${displayOrder});
        SELECT @NewGId AS GrammarId FOR JSON PATH;
      `)
      return { created: true, grammarId: res[0]?.GrammarId }
    }
  }

  // 18. Xóa Ngữ pháp khỏi Buổi học
  if (payload.action === 'delete_grammar' && payload.lessonId && payload.grammarId) {
    const lessonId = sqlInt(payload.lessonId)
    const grammarId = sqlInt(payload.grammarId)
    await executeSqlJsonQuery(`
      DELETE FROM dbo.LessonGrammar WHERE LessonId = ${lessonId} AND GrammarId = ${grammarId};
      SELECT 1 AS Deleted FOR JSON PATH;
    `)
    return { deleted: true, grammarId }
  }

  // 19. Lưu Câu hỏi trắc nghiệm & Đáp án (dbo.Questions & dbo.QuestionOptions)
  if (payload.action === 'save_question' && payload.exerciseId && payload.promptText) {
    const exerciseId = sqlInt(payload.exerciseId)
    const qId = payload.questionId ? sqlInt(payload.questionId) : null
    const prompt = sqlStr(payload.promptText)
    const explanation = sqlStr(payload.explanationVi || '')
    const displayOrder = sqlInt(payload.displayOrder, 1)

    if (qId) {
      await executeSqlJsonQuery(`
        UPDATE dbo.Questions
        SET PromptText = ${prompt},
            ExplanationVi = ${explanation},
            DisplayOrder = ${displayOrder},
            UpdatedAt = SYSUTCDATETIME()
        WHERE QuestionId = ${qId};
        SELECT 1 AS Updated FOR JSON PATH;
      `)
      if (Array.isArray(payload.options) && payload.options.length > 0) {
        await executeSqlJsonQuery(`
          DELETE FROM dbo.QuestionOptions WHERE QuestionId = ${qId};
          ${payload.options
            .map(
              (opt, idx) =>
                `INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder) VALUES (${qId}, ${sqlStr(opt.optionLabel || String.fromCharCode(65 + idx))}, ${sqlStr(opt.optionText)}, ${opt.isCorrect ? 1 : 0}, ${idx + 1});`,
            )
            .join('\n')}
          SELECT 1 AS OptionsUpdated FOR JSON PATH;
        `)
      }
      return { updated: true, questionId: qId }
    } else {
      const qCode = `Q_${Date.now()}`
      const res = await executeSqlJsonQuery<Array<{ QuestionId: number }>>(`
        INSERT INTO dbo.Questions (ExerciseId, QuestionCode, PromptText, QuestionType, ExplanationVi, DisplayOrder, Status)
        VALUES (${exerciseId}, ${sqlStr(qCode)}, ${prompt}, 'multiple_choice', ${explanation}, ${displayOrder}, 'Published');
        DECLARE @NewQId INT = SCOPE_IDENTITY();
        ${
          Array.isArray(payload.options)
            ? payload.options
                .map(
                  (opt, idx) =>
                    `INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder) VALUES (@NewQId, ${sqlStr(opt.optionLabel || String.fromCharCode(65 + idx))}, ${sqlStr(opt.optionText)}, ${opt.isCorrect ? 1 : 0}, ${idx + 1});`,
                )
                .join('\n')
            : ''
        }
        SELECT @NewQId AS QuestionId FOR JSON PATH;
      `)
      return { created: true, questionId: res[0]?.QuestionId }
    }
  }

  // 20. Xóa Câu hỏi
  if (payload.action === 'delete_question' && payload.questionId) {
    const qId = sqlInt(payload.questionId)
    await executeSqlJsonQuery(`
      DELETE FROM dbo.QuestionAnswers WHERE QuestionId = ${qId};
      DELETE FROM dbo.QuestionOptions WHERE QuestionId = ${qId};
      DELETE FROM dbo.Questions WHERE QuestionId = ${qId};
      SELECT 1 AS Deleted FOR JSON PATH;
    `)
    return { deleted: true, questionId: qId }
  }

  // 21. Lưu Tài liệu & Phiếu luyện viết (dbo.LessonResources)
  if (payload.action === 'save_resource' && payload.lessonId && payload.title) {
    const lessonId = sqlInt(payload.lessonId)
    const resId = payload.resourceId ? sqlInt(payload.resourceId) : null
    const title = sqlStr(payload.title)
    const resType = sqlStr(payload.resourceType || 'worksheet_pdf')
    const fileUrl = sqlStr(payload.fileUrlOrStorageKey || '')
    const displayOrder = sqlInt(payload.displayOrder, 1)

    if (resId) {
      await executeSqlJsonQuery(`
        UPDATE dbo.LessonResources
        SET Title = ${title},
            ResourceType = ${resType},
            FileUrlOrStorageKey = ${fileUrl},
            DisplayOrder = ${displayOrder}
        WHERE ResourceId = ${resId};
        SELECT 1 AS Updated FOR JSON PATH;
      `)
      return { updated: true, resourceId: resId }
    } else {
      const code = `RES_${Date.now()}`
      const res = await executeSqlJsonQuery<Array<{ ResourceId: number }>>(`
        INSERT INTO dbo.LessonResources (LessonId, ResourceCode, ResourceType, Title, FileUrlOrStorageKey, DisplayOrder, Status)
        VALUES (${lessonId}, ${sqlStr(code)}, ${resType}, ${title}, ${fileUrl}, ${displayOrder}, 'Published');
        SELECT SCOPE_IDENTITY() AS ResourceId FOR JSON PATH;
      `)
      return { created: true, resourceId: res[0]?.ResourceId }
    }
  }

  // 22. Xóa Tài liệu
  if (payload.action === 'delete_resource' && payload.resourceId) {
    const resId = sqlInt(payload.resourceId)
    await executeSqlJsonQuery(`
      DELETE FROM dbo.LessonResources WHERE ResourceId = ${resId};
      SELECT 1 AS Deleted FOR JSON PATH;
    `)
    return { deleted: true, resourceId: resId }
  }

  throw new Error('INVALID_ADMIN_CURRICULUM_ACTION')
}
