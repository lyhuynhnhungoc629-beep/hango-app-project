-- =============================================================================
-- HANGO LEARNING PATH & CURRICULUM SCHEMA MIGRATION (SQL SERVER)
-- Database: HangoDatasetDB (.\SQLEXPRESS)
-- Giữ nguyên toàn bộ bảng hiện có (HangulCharacterClasses, HangulHandwritingSamples, DatasetImportLogs)
-- Bổ sung 25 bảng chuẩn hóa cho Lộ trình 7 chặng, Kho học liệu, Bài tập & Tiến độ học viên
-- =============================================================================

USE [HangoDatasetDB];
GO

-- =============================================================================
-- NHÓM A: QUẢN LÝ LỘ TRÌNH (LearningPaths, LearningLevels, LearningTopics, Lessons, LessonSections, LessonResources)
-- =============================================================================

IF OBJECT_ID('dbo.LearningPaths', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LearningPaths (
        PathId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LearningPaths PRIMARY KEY,
        PathCode VARCHAR(64) NOT NULL CONSTRAINT UQ_LearningPaths_Code UNIQUE,
        Title NVARCHAR(255) NOT NULL,
        Subtitle NVARCHAR(500) NULL,
        Description NVARCHAR(MAX) NULL,
        Status VARCHAR(32) NOT NULL CONSTRAINT DF_LearningPaths_Status DEFAULT ('Published'),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LearningPaths_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LearningPaths_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
END
GO

IF OBJECT_ID('dbo.LearningLevels', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LearningLevels (
        LevelId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LearningLevels PRIMARY KEY,
        PathId INT NOT NULL CONSTRAINT FK_LearningLevels_Paths FOREIGN KEY REFERENCES dbo.LearningPaths(PathId),
        LevelCode VARCHAR(64) NOT NULL CONSTRAINT UQ_LearningLevels_Code UNIQUE,
        BadgeText NVARCHAR(32) NOT NULL,
        BadgeColor VARCHAR(64) NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        TopikLevel NVARCHAR(64) NOT NULL,
        TextbookName NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX) NOT NULL,
        SkillTagsJson NVARCHAR(1000) NOT NULL,
        DisplayOrder INT NOT NULL,
        Status VARCHAR(32) NOT NULL CONSTRAINT DF_LearningLevels_Status DEFAULT ('Published'),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LearningLevels_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LearningLevels_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_LearningLevels_Path_Order ON dbo.LearningLevels(PathId, DisplayOrder);
END
GO

IF OBJECT_ID('dbo.LearningTopics', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LearningTopics (
        TopicId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LearningTopics PRIMARY KEY,
        LevelId INT NOT NULL CONSTRAINT FK_LearningTopics_Levels FOREIGN KEY REFERENCES dbo.LearningLevels(LevelId),
        TopicCode VARCHAR(64) NOT NULL CONSTRAINT UQ_LearningTopics_Code UNIQUE,
        Title NVARCHAR(255) NOT NULL,
        Description NVARCHAR(MAX) NULL,
        DisplayOrder INT NOT NULL,
        Status VARCHAR(32) NOT NULL CONSTRAINT DF_LearningTopics_Status DEFAULT ('Published'),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LearningTopics_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LearningTopics_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_LearningTopics_Level_Order ON dbo.LearningTopics(LevelId, DisplayOrder);
END
GO

IF OBJECT_ID('dbo.Lessons', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Lessons (
        LessonId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Lessons PRIMARY KEY,
        TopicId INT NOT NULL CONSTRAINT FK_Lessons_Topics FOREIGN KEY REFERENCES dbo.LearningTopics(TopicId),
        LevelId INT NOT NULL CONSTRAINT FK_Lessons_Levels FOREIGN KEY REFERENCES dbo.LearningLevels(LevelId),
        LessonCode VARCHAR(64) NOT NULL CONSTRAINT UQ_Lessons_Code UNIQUE,
        LessonNumber INT NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Subtitle NVARCHAR(500) NULL,
        LearningObjective NVARCHAR(MAX) NOT NULL,
        EstimatedMinutes INT NOT NULL CONSTRAINT DF_Lessons_Minutes DEFAULT (25),
        DisplayOrder INT NOT NULL,
        Status VARCHAR(32) NOT NULL CONSTRAINT DF_Lessons_Status DEFAULT ('Published'),
        IsAiCompiled BIT NOT NULL CONSTRAINT DF_Lessons_IsAi DEFAULT (0),
        NeedsExpertReview BIT NOT NULL CONSTRAINT DF_Lessons_NeedsReview DEFAULT (0),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Lessons_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Lessons_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_Lessons_Level_Order ON dbo.Lessons(LevelId, DisplayOrder);
    CREATE INDEX IX_Lessons_Topic_Order ON dbo.Lessons(TopicId, DisplayOrder);
END
GO

IF OBJECT_ID('dbo.LessonSections', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LessonSections (
        SectionId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LessonSections PRIMARY KEY,
        LessonId INT NOT NULL CONSTRAINT FK_LessonSections_Lessons FOREIGN KEY REFERENCES dbo.Lessons(LessonId) ON DELETE CASCADE,
        SectionCode VARCHAR(64) NOT NULL CONSTRAINT UQ_LessonSections_Code UNIQUE,
        SectionType VARCHAR(64) NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        ContentHtmlOrMd NVARCHAR(MAX) NOT NULL,
        ExamplesJson NVARCHAR(MAX) NULL,
        DisplayOrder INT NOT NULL,
        Status VARCHAR(32) NOT NULL CONSTRAINT DF_LessonSections_Status DEFAULT ('Published'),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LessonSections_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LessonSections_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_LessonSections_Lesson_Order ON dbo.LessonSections(LessonId, DisplayOrder);
END
GO

IF OBJECT_ID('dbo.LessonResources', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LessonResources (
        ResourceId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LessonResources PRIMARY KEY,
        LessonId INT NOT NULL CONSTRAINT FK_LessonResources_Lessons FOREIGN KEY REFERENCES dbo.Lessons(LessonId) ON DELETE CASCADE,
        ResourceCode VARCHAR(64) NOT NULL CONSTRAINT UQ_LessonResources_Code UNIQUE,
        ResourceType VARCHAR(64) NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Description NVARCHAR(1000) NULL,
        ResourceUrl NVARCHAR(1000) NOT NULL,
        TargetCharsJson NVARCHAR(1000) NULL,
        DisplayOrder INT NOT NULL CONSTRAINT DF_LessonResources_Order DEFAULT (1),
        Status VARCHAR(32) NOT NULL CONSTRAINT DF_LessonResources_Status DEFAULT ('Published'),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LessonResources_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LessonResources_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_LessonResources_Lesson ON dbo.LessonResources(LessonId, DisplayOrder);
END
GO

-- =============================================================================
-- NHÓM B: KHO HỌC LIỆU (ContentSources, Vocabulary, Grammar, LessonVocabulary, LessonGrammar)
-- =============================================================================

IF OBJECT_ID('dbo.ContentSources', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ContentSources (
        SourceId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ContentSources PRIMARY KEY,
        SourceCode VARCHAR(64) NOT NULL CONSTRAINT UQ_ContentSources_Code UNIQUE,
        SourceName NVARCHAR(255) NOT NULL,
        DatasetOrApiName NVARCHAR(255) NOT NULL,
        SourceUrl NVARCHAR(1000) NOT NULL,
        DataType NVARCHAR(128) NOT NULL,
        VerifiedRecordCount INT NOT NULL CONSTRAINT DF_ContentSources_Count DEFAULT (0),
        DataFormat VARCHAR(64) NOT NULL,
        TargetLevels NVARCHAR(255) NOT NULL,
        LicenseName NVARCHAR(255) NOT NULL,
        AuthorOrOrganization NVARCHAR(255) NOT NULL,
        TargetTable VARCHAR(128) NOT NULL,
        AvailabilityStatus NVARCHAR(128) NOT NULL,
        Notes NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_ContentSources_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_ContentSources_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
END
GO

IF OBJECT_ID('dbo.Vocabulary', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Vocabulary (
        VocabId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Vocabulary PRIMARY KEY,
        VocabCode VARCHAR(64) NOT NULL CONSTRAINT UQ_Vocabulary_Code UNIQUE,
        KoreanWord NVARCHAR(255) NOT NULL,
        Hanja NVARCHAR(255) NULL,
        Romanization NVARCHAR(255) NULL,
        VietnameseMeaning NVARCHAR(500) NOT NULL,
        PartOfSpeech NVARCHAR(64) NOT NULL,
        ExplanationKo NVARCHAR(1000) NULL,
        ExampleSentenceKo NVARCHAR(1000) NULL,
        ExampleSentenceVi NVARCHAR(1000) NULL,
        NiklLevel VARCHAR(32) NULL,
        TopikLevel NVARCHAR(64) NOT NULL,
        TopicName NVARCHAR(128) NULL,
        FrequencyRank INT NULL,
        SourceId INT NULL CONSTRAINT FK_Vocabulary_Sources FOREIGN KEY REFERENCES dbo.ContentSources(SourceId),
        IsAiCompiled BIT NOT NULL CONSTRAINT DF_Vocabulary_IsAi DEFAULT (0),
        NeedsExpertReview BIT NOT NULL CONSTRAINT DF_Vocabulary_Review DEFAULT (0),
        Status VARCHAR(32) NOT NULL CONSTRAINT DF_Vocabulary_Status DEFAULT ('Published'),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Vocabulary_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Vocabulary_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_Vocabulary_TopikLevel ON dbo.Vocabulary(TopikLevel);
    CREATE INDEX IX_Vocabulary_KoreanWord ON dbo.Vocabulary(KoreanWord);
END
GO

IF OBJECT_ID('dbo.Grammar', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Grammar (
        GrammarId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Grammar PRIMARY KEY,
        GrammarCode VARCHAR(64) NOT NULL CONSTRAINT UQ_Grammar_Code UNIQUE,
        GrammarPattern NVARCHAR(255) NOT NULL,
        MeaningVi NVARCHAR(500) NOT NULL,
        UsageExplanation NVARCHAR(MAX) NOT NULL,
        ConjugationRule NVARCHAR(1000) NULL,
        ExampleKo NVARCHAR(1000) NOT NULL,
        ExampleVi NVARCHAR(1000) NOT NULL,
        TopikLevel NVARCHAR(64) NOT NULL,
        SourceId INT NULL CONSTRAINT FK_Grammar_Sources FOREIGN KEY REFERENCES dbo.ContentSources(SourceId),
        IsAiCompiled BIT NOT NULL CONSTRAINT DF_Grammar_IsAi DEFAULT (0),
        NeedsExpertReview BIT NOT NULL CONSTRAINT DF_Grammar_Review DEFAULT (0),
        Status VARCHAR(32) NOT NULL CONSTRAINT DF_Grammar_Status DEFAULT ('Published'),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Grammar_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Grammar_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_Grammar_TopikLevel ON dbo.Grammar(TopikLevel);
END
GO

IF OBJECT_ID('dbo.LessonVocabulary', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LessonVocabulary (
        LessonVocabId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LessonVocabulary PRIMARY KEY,
        LessonId INT NOT NULL CONSTRAINT FK_LessonVocabulary_Lessons FOREIGN KEY REFERENCES dbo.Lessons(LessonId) ON DELETE CASCADE,
        VocabId INT NOT NULL CONSTRAINT FK_LessonVocabulary_Vocabulary FOREIGN KEY REFERENCES dbo.Vocabulary(VocabId) ON DELETE CASCADE,
        DisplayOrder INT NOT NULL CONSTRAINT DF_LessonVocabulary_Order DEFAULT (1),
        IsCoreTerm BIT NOT NULL CONSTRAINT DF_LessonVocabulary_Core DEFAULT (1),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LessonVocabulary_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_LessonVocabulary UNIQUE (LessonId, VocabId)
    );
    CREATE INDEX IX_LessonVocabulary_Lesson ON dbo.LessonVocabulary(LessonId, DisplayOrder);
END
GO

IF OBJECT_ID('dbo.LessonGrammar', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LessonGrammar (
        LessonGrammarId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LessonGrammar PRIMARY KEY,
        LessonId INT NOT NULL CONSTRAINT FK_LessonGrammar_Lessons FOREIGN KEY REFERENCES dbo.Lessons(LessonId) ON DELETE CASCADE,
        GrammarId INT NOT NULL CONSTRAINT FK_LessonGrammar_Grammar FOREIGN KEY REFERENCES dbo.Grammar(GrammarId) ON DELETE CASCADE,
        DisplayOrder INT NOT NULL CONSTRAINT DF_LessonGrammar_Order DEFAULT (1),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LessonGrammar_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_LessonGrammar UNIQUE (LessonId, GrammarId)
    );
    CREATE INDEX IX_LessonGrammar_Lesson ON dbo.LessonGrammar(LessonId, DisplayOrder);
END
GO

-- =============================================================================
-- NHÓM C: HOẠT ĐỘNG VÀ BÀI TẬP (Exercises, LessonActivities, Questions, QuestionOptions, ExerciseAttempts, QuestionAnswers)
-- =============================================================================

IF OBJECT_ID('dbo.Exercises', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Exercises (
        ExerciseId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Exercises PRIMARY KEY,
        LessonId INT NOT NULL CONSTRAINT FK_Exercises_Lessons FOREIGN KEY REFERENCES dbo.Lessons(LessonId) ON DELETE CASCADE,
        ExerciseCode VARCHAR(64) NOT NULL CONSTRAINT UQ_Exercises_Code UNIQUE,
        ExerciseType VARCHAR(64) NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Description NVARCHAR(1000) NULL,
        PassingScorePercent INT NOT NULL CONSTRAINT DF_Exercises_Pass DEFAULT (80),
        TimeLimitSeconds INT NOT NULL CONSTRAINT DF_Exercises_Time DEFAULT (600),
        DisplayOrder INT NOT NULL CONSTRAINT DF_Exercises_Order DEFAULT (1),
        Status VARCHAR(32) NOT NULL CONSTRAINT DF_Exercises_Status DEFAULT ('Published'),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Exercises_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Exercises_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_Exercises_Lesson ON dbo.Exercises(LessonId, DisplayOrder);
END
GO

IF OBJECT_ID('dbo.LessonActivities', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LessonActivities (
        ActivityId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LessonActivities PRIMARY KEY,
        LessonId INT NOT NULL CONSTRAINT FK_LessonActivities_Lessons FOREIGN KEY REFERENCES dbo.Lessons(LessonId) ON DELETE CASCADE,
        ActivityCode VARCHAR(64) NOT NULL CONSTRAINT UQ_LessonActivities_Code UNIQUE,
        ActivityType VARCHAR(64) NOT NULL,
        Title NVARCHAR(255) NOT NULL,
        Description NVARCHAR(1000) NULL,
        IsRequired BIT NOT NULL CONSTRAINT DF_LessonActivities_Required DEFAULT (1),
        ExerciseId INT NULL CONSTRAINT FK_LessonActivities_Exercises FOREIGN KEY REFERENCES dbo.Exercises(ExerciseId),
        ResourceId INT NULL CONSTRAINT FK_LessonActivities_Resources FOREIGN KEY REFERENCES dbo.LessonResources(ResourceId),
        DisplayOrder INT NOT NULL,
        XpReward INT NOT NULL CONSTRAINT DF_LessonActivities_Xp DEFAULT (15),
        Status VARCHAR(32) NOT NULL CONSTRAINT DF_LessonActivities_Status DEFAULT ('Published'),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LessonActivities_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LessonActivities_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_LessonActivities_Lesson_Order ON dbo.LessonActivities(LessonId, DisplayOrder);
END
GO

IF OBJECT_ID('dbo.Questions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Questions (
        QuestionId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Questions PRIMARY KEY,
        ExerciseId INT NOT NULL CONSTRAINT FK_Questions_Exercises FOREIGN KEY REFERENCES dbo.Exercises(ExerciseId) ON DELETE CASCADE,
        QuestionCode VARCHAR(64) NOT NULL CONSTRAINT UQ_Questions_Code UNIQUE,
        QuestionType VARCHAR(64) NOT NULL CONSTRAINT DF_Questions_Type DEFAULT ('multiple_choice'),
        PromptText NVARCHAR(MAX) NOT NULL,
        KoreanHighlight NVARCHAR(500) NULL,
        ExplanationVi NVARCHAR(MAX) NOT NULL,
        Points INT NOT NULL CONSTRAINT DF_Questions_Points DEFAULT (20),
        DisplayOrder INT NOT NULL,
        Status VARCHAR(32) NOT NULL CONSTRAINT DF_Questions_Status DEFAULT ('Published'),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Questions_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_Questions_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_Questions_Exercise_Order ON dbo.Questions(ExerciseId, DisplayOrder);
END
GO

IF OBJECT_ID('dbo.QuestionOptions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.QuestionOptions (
        OptionId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QuestionOptions PRIMARY KEY,
        QuestionId INT NOT NULL CONSTRAINT FK_QuestionOptions_Questions FOREIGN KEY REFERENCES dbo.Questions(QuestionId) ON DELETE CASCADE,
        OptionLabel VARCHAR(16) NOT NULL,
        OptionText NVARCHAR(1000) NOT NULL,
        IsCorrect BIT NOT NULL CONSTRAINT DF_QuestionOptions_Correct DEFAULT (0),
        DisplayOrder INT NOT NULL,
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_QuestionOptions_CreatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_QuestionOptions_Question_Order ON dbo.QuestionOptions(QuestionId, DisplayOrder);
END
GO

IF OBJECT_ID('dbo.ExerciseAttempts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ExerciseAttempts (
        AttemptId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ExerciseAttempts PRIMARY KEY,
        UserUid NVARCHAR(128) NOT NULL,
        ExerciseId INT NOT NULL CONSTRAINT FK_ExerciseAttempts_Exercises FOREIGN KEY REFERENCES dbo.Exercises(ExerciseId),
        LessonId INT NOT NULL CONSTRAINT FK_ExerciseAttempts_Lessons FOREIGN KEY REFERENCES dbo.Lessons(LessonId),
        TotalQuestions INT NOT NULL,
        CorrectCount INT NOT NULL,
        ScorePercent INT NOT NULL,
        Passed BIT NOT NULL,
        DurationSeconds INT NOT NULL CONSTRAINT DF_ExerciseAttempts_Duration DEFAULT (0),
        SubmittedAt DATETIME2(3) NOT NULL CONSTRAINT DF_ExerciseAttempts_SubmittedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_ExerciseAttempts_User_Exercise ON dbo.ExerciseAttempts(UserUid, ExerciseId, SubmittedAt DESC);
END
GO

IF OBJECT_ID('dbo.QuestionAnswers', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.QuestionAnswers (
        AnswerId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_QuestionAnswers PRIMARY KEY,
        AttemptId INT NOT NULL CONSTRAINT FK_QuestionAnswers_Attempts FOREIGN KEY REFERENCES dbo.ExerciseAttempts(AttemptId) ON DELETE CASCADE,
        QuestionId INT NOT NULL CONSTRAINT FK_QuestionAnswers_Questions FOREIGN KEY REFERENCES dbo.Questions(QuestionId),
        SelectedOptionId INT NULL CONSTRAINT FK_QuestionAnswers_Options FOREIGN KEY REFERENCES dbo.QuestionOptions(OptionId),
        AnswerText NVARCHAR(1000) NULL,
        IsCorrect BIT NOT NULL CONSTRAINT DF_QuestionAnswers_Correct DEFAULT (0),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_QuestionAnswers_CreatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_QuestionAnswers_Attempt ON dbo.QuestionAnswers(AttemptId);
END
GO

-- =============================================================================
-- NHÓM D: TIẾN ĐỘ HỌC VIÊN (UserLearningProgress, UserLevelProgress, UserLessonProgress, UserActivityProgress, UserVocabularyProgress, UserStudySessions)
-- =============================================================================

IF OBJECT_ID('dbo.UserLearningProgress', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserLearningProgress (
        UserProgressId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_UserLearningProgress PRIMARY KEY,
        UserUid NVARCHAR(128) NOT NULL CONSTRAINT UQ_UserLearningProgress_Uid UNIQUE,
        PathId INT NOT NULL CONSTRAINT FK_UserLearningProgress_Paths FOREIGN KEY REFERENCES dbo.LearningPaths(PathId),
        CurrentLevelId INT NOT NULL CONSTRAINT FK_UserLearningProgress_Levels FOREIGN KEY REFERENCES dbo.LearningLevels(LevelId),
        CurrentLessonId INT NOT NULL CONSTRAINT FK_UserLearningProgress_Lessons FOREIGN KEY REFERENCES dbo.Lessons(LessonId),
        CurrentActivityId INT NULL CONSTRAINT FK_UserLearningProgress_Activities FOREIGN KEY REFERENCES dbo.LessonActivities(ActivityId),
        CompletedLessonsCount INT NOT NULL CONSTRAINT DF_UserLearningProgress_Completed DEFAULT (0),
        OverallProgressPercent DECIMAL(5,2) NOT NULL CONSTRAINT DF_UserLearningProgress_Percent DEFAULT (0),
        TotalXpEarned INT NOT NULL CONSTRAINT DF_UserLearningProgress_Xp DEFAULT (0),
        LastAccessedAt DATETIME2(3) NOT NULL CONSTRAINT DF_UserLearningProgress_LastAccess DEFAULT (SYSUTCDATETIME()),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_UserLearningProgress_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_UserLearningProgress_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
END
GO

IF OBJECT_ID('dbo.UserLevelProgress', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserLevelProgress (
        UserLevelProgressId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_UserLevelProgress PRIMARY KEY,
        UserUid NVARCHAR(128) NOT NULL,
        LevelId INT NOT NULL CONSTRAINT FK_UserLevelProgress_Levels FOREIGN KEY REFERENCES dbo.LearningLevels(LevelId),
        UnlockStatus VARCHAR(32) NOT NULL CONSTRAINT DF_UserLevelProgress_Status DEFAULT ('Locked'),
        CompletedLessonsCount INT NOT NULL CONSTRAINT DF_UserLevelProgress_Completed DEFAULT (0),
        TotalLessonsCount INT NOT NULL CONSTRAINT DF_UserLevelProgress_Total DEFAULT (0),
        ProgressPercent DECIMAL(5,2) NOT NULL CONSTRAINT DF_UserLevelProgress_Percent DEFAULT (0),
        UnlockedAt DATETIME2(3) NULL,
        CompletedAt DATETIME2(3) NULL,
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_UserLevelProgress_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_UserLevelProgress UNIQUE (UserUid, LevelId)
    );
    CREATE INDEX IX_UserLevelProgress_Uid ON dbo.UserLevelProgress(UserUid);
END
GO

IF OBJECT_ID('dbo.UserLessonProgress', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserLessonProgress (
        UserLessonProgressId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_UserLessonProgress PRIMARY KEY,
        UserUid NVARCHAR(128) NOT NULL,
        LessonId INT NOT NULL CONSTRAINT FK_UserLessonProgress_Lessons FOREIGN KEY REFERENCES dbo.Lessons(LessonId),
        LevelId INT NOT NULL CONSTRAINT FK_UserLessonProgress_Levels FOREIGN KEY REFERENCES dbo.LearningLevels(LevelId),
        UnlockStatus VARCHAR(32) NOT NULL CONSTRAINT DF_UserLessonProgress_Status DEFAULT ('Locked'),
        CompletedRequiredActivities INT NOT NULL CONSTRAINT DF_UserLessonProgress_CompReq DEFAULT (0),
        TotalRequiredActivities INT NOT NULL CONSTRAINT DF_UserLessonProgress_TotReq DEFAULT (0),
        BestQuizScorePercent INT NOT NULL CONSTRAINT DF_UserLessonProgress_BestScore DEFAULT (0),
        QuizAttemptsCount INT NOT NULL CONSTRAINT DF_UserLessonProgress_Attempts DEFAULT (0),
        ProgressPercent DECIMAL(5,2) NOT NULL CONSTRAINT DF_UserLessonProgress_Percent DEFAULT (0),
        UnlockedAt DATETIME2(3) NULL,
        CompletedAt DATETIME2(3) NULL,
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_UserLessonProgress_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_UserLessonProgress UNIQUE (UserUid, LessonId)
    );
    CREATE INDEX IX_UserLessonProgress_Uid_Level ON dbo.UserLessonProgress(UserUid, LevelId);
END
GO

IF OBJECT_ID('dbo.UserActivityProgress', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserActivityProgress (
        UserActivityProgressId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_UserActivityProgress PRIMARY KEY,
        UserUid NVARCHAR(128) NOT NULL,
        LessonId INT NOT NULL CONSTRAINT FK_UserActivityProgress_Lessons FOREIGN KEY REFERENCES dbo.Lessons(LessonId),
        ActivityId INT NOT NULL CONSTRAINT FK_UserActivityProgress_Activities FOREIGN KEY REFERENCES dbo.LessonActivities(ActivityId),
        IsCompleted BIT NOT NULL CONSTRAINT DF_UserActivityProgress_Completed DEFAULT (0),
        ScorePercent INT NULL,
        TimeSpentSeconds INT NOT NULL CONSTRAINT DF_UserActivityProgress_Time DEFAULT (0),
        CompletedAt DATETIME2(3) NULL,
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_UserActivityProgress_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_UserActivityProgress UNIQUE (UserUid, ActivityId)
    );
    CREATE INDEX IX_UserActivityProgress_Uid_Lesson ON dbo.UserActivityProgress(UserUid, LessonId);
END
GO

IF OBJECT_ID('dbo.UserVocabularyProgress', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserVocabularyProgress (
        UserVocabProgressId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_UserVocabularyProgress PRIMARY KEY,
        UserUid NVARCHAR(128) NOT NULL,
        VocabId INT NOT NULL CONSTRAINT FK_UserVocabularyProgress_Vocab FOREIGN KEY REFERENCES dbo.Vocabulary(VocabId),
        MasteryStatus VARCHAR(32) NOT NULL CONSTRAINT DF_UserVocabularyProgress_Status DEFAULT ('Learning'),
        IntervalDays INT NOT NULL CONSTRAINT DF_UserVocabularyProgress_Interval DEFAULT (1),
        EaseFactor DECIMAL(4,2) NOT NULL CONSTRAINT DF_UserVocabularyProgress_Ease DEFAULT (2.50),
        ReviewCount INT NOT NULL CONSTRAINT DF_UserVocabularyProgress_Reviews DEFAULT (1),
        NextReviewAt DATETIME2(3) NULL,
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_UserVocabularyProgress_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_UserVocabularyProgress UNIQUE (UserUid, VocabId)
    );
    CREATE INDEX IX_UserVocabularyProgress_Uid ON dbo.UserVocabularyProgress(UserUid);
END
GO

IF OBJECT_ID('dbo.UserStudySessions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserStudySessions (
        SessionId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_UserStudySessions PRIMARY KEY,
        UserUid NVARCHAR(128) NOT NULL,
        LessonId INT NULL CONSTRAINT FK_UserStudySessions_Lessons FOREIGN KEY REFERENCES dbo.Lessons(LessonId),
        ActivityId INT NULL CONSTRAINT FK_UserStudySessions_Activities FOREIGN KEY REFERENCES dbo.LessonActivities(ActivityId),
        SessionType VARCHAR(64) NOT NULL,
        DurationSeconds INT NOT NULL CONSTRAINT DF_UserStudySessions_Duration DEFAULT (60),
        XpEarned INT NOT NULL CONSTRAINT DF_UserStudySessions_Xp DEFAULT (0),
        SummaryText NVARCHAR(500) NOT NULL,
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_UserStudySessions_CreatedAt DEFAULT (SYSUTCDATETIME())
    );
    CREATE INDEX IX_UserStudySessions_Uid_Created ON dbo.UserStudySessions(UserUid, CreatedAt DESC);
END
GO

-- =============================================================================
-- NHÓM E: ĐIỀU KIỆN HOÀN THÀNH & MỞ KHÓA (LessonCompletionRules, LevelUnlockRules)
-- =============================================================================

IF OBJECT_ID('dbo.LessonCompletionRules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LessonCompletionRules (
        RuleId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LessonCompletionRules PRIMARY KEY,
        LessonId INT NOT NULL CONSTRAINT UQ_LessonCompletionRules_Lesson UNIQUE
            CONSTRAINT FK_LessonCompletionRules_Lessons FOREIGN KEY REFERENCES dbo.Lessons(LessonId) ON DELETE CASCADE,
        RequireAllMandatoryActivities BIT NOT NULL CONSTRAINT DF_LessonCompletionRules_ReqMand DEFAULT (1),
        RequireFinalQuizPass BIT NOT NULL CONSTRAINT DF_LessonCompletionRules_ReqQuiz DEFAULT (1),
        MinQuizPassPercent INT NOT NULL CONSTRAINT DF_LessonCompletionRules_MinPass DEFAULT (80),
        AllowUnlimitedRetakes BIT NOT NULL CONSTRAINT DF_LessonCompletionRules_Retakes DEFAULT (1),
        UnlockNextLessonOnComplete BIT NOT NULL CONSTRAINT DF_LessonCompletionRules_UnlockNext DEFAULT (1),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LessonCompletionRules_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LessonCompletionRules_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
END
GO

IF OBJECT_ID('dbo.LevelUnlockRules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LevelUnlockRules (
        LevelRuleId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_LevelUnlockRules PRIMARY KEY,
        LevelId INT NOT NULL CONSTRAINT UQ_LevelUnlockRules_Level UNIQUE
            CONSTRAINT FK_LevelUnlockRules_Levels FOREIGN KEY REFERENCES dbo.LearningLevels(LevelId) ON DELETE CASCADE,
        PrerequisiteLevelId INT NULL CONSTRAINT FK_LevelUnlockRules_Prereq FOREIGN KEY REFERENCES dbo.LearningLevels(LevelId),
        RequiredCompletedLessonsPercent INT NOT NULL CONSTRAINT DF_LevelUnlockRules_ReqPct DEFAULT (100),
        MinAverageQuizScorePercent INT NOT NULL CONSTRAINT DF_LevelUnlockRules_MinAvg DEFAULT (80),
        IsDefaultUnlocked BIT NOT NULL CONSTRAINT DF_LevelUnlockRules_Default DEFAULT (0),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LevelUnlockRules_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_LevelUnlockRules_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );
END
GO
