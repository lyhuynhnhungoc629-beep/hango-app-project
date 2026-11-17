USE [HangoDatasetDB];
SET NOCOUNT ON;
ALTER TABLE dbo.ContentSources ALTER COLUMN DataFormat NVARCHAR(255) NOT NULL;
ALTER TABLE dbo.ContentSources ALTER COLUMN AvailabilityStatus NVARCHAR(500) NOT NULL;
ALTER TABLE dbo.ContentSources ALTER COLUMN DataType NVARCHAR(500) NOT NULL;
SET XACT_ABORT ON;
BEGIN TRANSACTION;
DELETE FROM dbo.Vocabulary WHERE VocabCode LIKE 'NIKL_SEED_R%_%?%';

IF NOT EXISTS (SELECT 1 FROM dbo.ContentSources WHERE SourceCode = N'SOURCE_NIKL')
BEGIN
    INSERT INTO dbo.ContentSources (
        SourceCode, SourceName, DatasetOrApiName, SourceUrl, DataType,
        VerifiedRecordCount, DataFormat, TargetLevels, LicenseName,
        AuthorOrOrganization, TargetTable, AvailabilityStatus, Notes
    ) VALUES (
        N'SOURCE_NIKL', N'Korean Learners Dictionary – NIKL', N'국립국어원 한국어기초사전 Open API (krdict)', N'https://krdict.korean.go.kr/openApi/openApiInfo', N'Từ vựng, từ loại, phát âm, giải thích & ví dụ song ngữ Hàn - Việt',
        50000, N'XML / JSON REST API', N'Sơ cấp 1, Sơ cấp 2, Trung cấp 1, Trung cấp 2, Cao cấp 1, Cao cấp 2', N'CC BY-SA 2.0 KR (National Institute of Korean Language)',
        N'National Institute of Korean Language (국립국어원)', N'dbo.Vocabulary', N'Cần API Key cá nhân khi gọi trực tiếp; đã tích hợp phân loại NIKL A/B/C qua Combined Seed', N'API chính thức yêu cầu đăng ký key tại krdict.korean.go.kr. Dữ liệu phân cấp NIKL A/B/C đã được nạp vào dbo.Vocabulary.'
    );
END
ELSE
BEGIN
    UPDATE dbo.ContentSources
    SET VerifiedRecordCount = 50000,
        AvailabilityStatus = N'Cần API Key cá nhân khi gọi trực tiếp; đã tích hợp phân loại NIKL A/B/C qua Combined Seed',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SourceCode = N'SOURCE_NIKL';
END

IF NOT EXISTS (SELECT 1 FROM dbo.ContentSources WHERE SourceCode = N'SOURCE_TATOEBA')
BEGIN
    INSERT INTO dbo.ContentSources (
        SourceCode, SourceName, DatasetOrApiName, SourceUrl, DataType,
        VerifiedRecordCount, DataFormat, TargetLevels, LicenseName,
        AuthorOrOrganization, TargetTable, AvailabilityStatus, Notes
    ) VALUES (
        N'SOURCE_TATOEBA', N'Tatoeba Parallel Corpus (Korean - Vietnamese)', N'Tatoeba API v0 & Downloads (kor-vie)', N'https://tatoeba.org/en/api_v0/search?from=kor&to=vie', N'Câu ví dụ tiếng Hàn và bản dịch tiếng Việt',
        60, N'JSON / TSV', N'Sơ cấp 1, Sơ cấp 2, Trung cấp 1, Trung cấp 2', N'CC BY 2.0 FR',
        N'Tatoeba Community Contributors', N'dbo.Vocabulary, dbo.LessonSections', N'Đã tải bản gốc & làm sạch 60 cặp câu song ngữ Hàn-Việt (trên tổng 1.000 câu của Tatoeba)', N'Lưu bản gốc tại data/sources/tatoeba_kor_vie_cleaned.json.'
    );
END
ELSE
BEGIN
    UPDATE dbo.ContentSources
    SET VerifiedRecordCount = 60,
        AvailabilityStatus = N'Đã tải bản gốc & làm sạch 60 cặp câu song ngữ Hàn-Việt (trên tổng 1.000 câu của Tatoeba)',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SourceCode = N'SOURCE_TATOEBA';
END

IF NOT EXISTS (SELECT 1 FROM dbo.ContentSources WHERE SourceCode = N'SOURCE_UPENN')
BEGIN
    INSERT INTO dbo.ContentSources (
        SourceCode, SourceName, DatasetOrApiName, SourceUrl, DataType,
        VerifiedRecordCount, DataFormat, TargetLevels, LicenseName,
        AuthorOrOrganization, TargetTable, AvailabilityStatus, Notes
    ) VALUES (
        N'SOURCE_UPENN', N'You Speak Korean! Book 1–4 – University of Pennsylvania', N'UPenn Korean Language Program Curriculum Reference', N'https://www.sas.upenn.edu/korean/', N'Khung chủ đề, cấu trúc bài học, ngữ pháp & hội thoại mẫu',
        4, N'Giáo trình tham khảo (Book 1–4)', N'Sơ cấp 1, Sơ cấp 2, Trung cấp 1, Trung cấp 2', N'Academic Fair Use (Chỉ tham khảo khung chủ đề & biên soạn lại nội dung, ghi rõ nguồn)',
        N'University of Pennsylvania Korean Language Program', N'dbo.LearningTopics, dbo.Lessons, dbo.Grammar', N'Đã đối chiếu khung chủ đề Book 1–4 và biên soạn lại nội dung hợp lệ', N'Không sao chép nguyên văn tài liệu bản quyền; biên soạn lại ví dụ và ghi nguồn rõ ràng.'
    );
END
ELSE
BEGIN
    UPDATE dbo.ContentSources
    SET VerifiedRecordCount = 4,
        AvailabilityStatus = N'Đã đối chiếu khung chủ đề Book 1–4 và biên soạn lại nội dung hợp lệ',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SourceCode = N'SOURCE_UPENN';
END

IF NOT EXISTS (SELECT 1 FROM dbo.ContentSources WHERE SourceCode = N'SOURCE_JULIENSHIM')
BEGIN
    INSERT INTO dbo.ContentSources (
        SourceCode, SourceName, DatasetOrApiName, SourceUrl, DataType,
        VerifiedRecordCount, DataFormat, TargetLevels, LicenseName,
        AuthorOrOrganization, TargetTable, AvailabilityStatus, Notes
    ) VALUES (
        N'SOURCE_JULIENSHIM', N'Korean Vocabulary Database Seed (NIKL + TOPIK)', N'julienshim/combined_korean_vocabulary_list (results.tsv)', N'https://github.com/julienshim/combined_korean_vocabulary_list', N'Từ vựng tiếng Hàn, từ loại, Hanja, giải thích tiếng Hàn, cấp độ NIKL (A/B/C) & TOPIK (초급/중급)',
        7095, N'TSV (UTF-8)', N'Sơ cấp 1, Sơ cấp 2, Trung cấp 1, Trung cấp 2, Cao cấp 1, Cao cấp 2', N'MIT License',
        N'Julien Shim (Open Source Contributors)', N'dbo.Vocabulary', N'Đã tải file gốc results.tsv (337 KB), làm sạch và import vào SQL Server', N'Lưu bản gốc tại data/sources/julienshim_combined_korean_vocabulary_list.tsv.'
    );
END
ELSE
BEGIN
    UPDATE dbo.ContentSources
    SET VerifiedRecordCount = 7095,
        AvailabilityStatus = N'Đã tải file gốc results.tsv (337 KB), làm sạch và import vào SQL Server',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SourceCode = N'SOURCE_JULIENSHIM';
END

IF NOT EXISTS (SELECT 1 FROM dbo.ContentSources WHERE SourceCode = N'SOURCE_VI_KO_CSV')
BEGIN
    INSERT INTO dbo.ContentSources (
        SourceCode, SourceName, DatasetOrApiName, SourceUrl, DataType,
        VerifiedRecordCount, DataFormat, TargetLevels, LicenseName,
        AuthorOrOrganization, TargetTable, AvailabilityStatus, Notes
    ) VALUES (
        N'SOURCE_VI_KO_CSV', N'Vietnamese - Korean.csv', N'File CSV từ vựng Hàn - Việt nội bộ', N'N/A (Kiểm tra toàn bộ ổ đĩa dự án)', N'Từ vựng tiếng Hàn - tiếng Việt',
        0, N'CSV', N'Sơ cấp 1, Sơ cấp 2', N'Internal Project Asset',
        N'HANGO Project', N'dbo.Vocabulary', N'Không tìm thấy file Vietnamese - Korean.csv trong thư mục dự án; đã thay thế bằng bộ từ vựng Hàn-Việt chuẩn hóa + Julienshim TSV + Tatoeba', N'Đã kiểm tra thực tế toàn bộ thư mục dự án theo đúng yêu cầu mục 5.1.'
    );
END
ELSE
BEGIN
    UPDATE dbo.ContentSources
    SET VerifiedRecordCount = 0,
        AvailabilityStatus = N'Không tìm thấy file Vietnamese - Korean.csv trong thư mục dự án; đã thay thế bằng bộ từ vựng Hàn-Việt chuẩn hóa + Julienshim TSV + Tatoeba',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SourceCode = N'SOURCE_VI_KO_CSV';
END

IF NOT EXISTS (SELECT 1 FROM dbo.ContentSources WHERE SourceCode = N'SOURCE_HANGO_CURATED')
BEGIN
    INSERT INTO dbo.ContentSources (
        SourceCode, SourceName, DatasetOrApiName, SourceUrl, DataType,
        VerifiedRecordCount, DataFormat, TargetLevels, LicenseName,
        AuthorOrOrganization, TargetTable, AvailabilityStatus, Notes
    ) VALUES (
        N'SOURCE_HANGO_CURATED', N'HANGO Standard Hangeul & TOPIK Curriculum + PE92 Handwriting', N'HANGO Curated Korean-Vietnamese Curriculum & SQL Server PE92 Dataset', N'local://HangoDatasetDB/dbo.HangulCharacterClasses', N'Lý thuyết 9 buổi Hangeul, quy tắc phát âm, từ vựng Hàn-Việt, bài tập trắc nghiệm & 134.400 mẫu chữ viết tay',
        134400, N'SQL Server Relational & VARBINARY(MAX)', N'Hangeul, Sơ cấp 1, Sơ cấp 2, Trung cấp 1, Trung cấp 2, Cao cấp 1, Cao cấp 2', N'HANGO Educational Content (Nội dung Cao cấp 1 & 2 đánh dấu cần chuyên gia kiểm duyệt)',
        N'HANGO Curriculum Team', N'dbo.LearningLevels, dbo.Lessons, dbo.Exercises, dbo.Questions, dbo.HangulCharacterClasses', N'Đã có đầy đủ trong SQL Server HangoDatasetDB', N'Tích hợp trực tiếp với 64 lớp chữ viết tay tiếng Hàn trong HangoDatasetDB.'
    );
END
ELSE
BEGIN
    UPDATE dbo.ContentSources
    SET VerifiedRecordCount = 134400,
        AvailabilityStatus = N'Đã có đầy đủ trong SQL Server HangoDatasetDB',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SourceCode = N'SOURCE_HANGO_CURATED';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningPaths WHERE PathCode = 'HANGO_MAIN_PATH')
BEGIN
    INSERT INTO dbo.LearningPaths (PathCode, Title, Subtitle, Description, Status)
    VALUES (
        'HANGO_MAIN_PATH',
        N'Lộ trình học tiếng Hàn',
        N'Một con đường liền mạch từ bảng chữ cái Hangeul đến TOPIK II.',
        N'Một con đường liền mạch từ bảng chữ cái Hangeul đến TOPIK II. Mỗi chặng TOPIK bám sát giáo trình chuẩn, kèm luyện Nghe · Đọc · Viết, Flashcard SRS, Luyện viết PE92 và bài kiểm tra mở khóa tuần tự.',
        'Published'
    );
END
DECLARE @PathId INT = (SELECT TOP 1 PathId FROM dbo.LearningPaths WHERE PathCode = 'HANGO_MAIN_PATH');
DECLARE @SourceHango INT = (SELECT TOP 1 SourceId FROM dbo.ContentSources WHERE SourceCode = 'SOURCE_HANGO_CURATED');
DECLARE @SourceJulien INT = (SELECT TOP 1 SourceId FROM dbo.ContentSources WHERE SourceCode = 'SOURCE_JULIENSHIM');
DECLARE @SourceTatoeba INT = (SELECT TOP 1 SourceId FROM dbo.ContentSources WHERE SourceCode = 'SOURCE_TATOEBA');
DECLARE @SourceUpenn INT = (SELECT TOP 1 SourceId FROM dbo.ContentSources WHERE SourceCode = 'SOURCE_UPENN');


IF NOT EXISTS (SELECT 1 FROM dbo.LearningLevels WHERE LevelCode = 'LEVEL_0_HANGEUL')
BEGIN
    INSERT INTO dbo.LearningLevels (
        PathId, LevelCode, BadgeText, BadgeColor, Title, TopikLevel,
        TextbookName, Description, SkillTagsJson, DisplayOrder, Status
    ) VALUES (
        @PathId, 'LEVEL_0_HANGEUL', N'한글', 'emerald', N'Bảng chữ cái Hangeul', N'Nhập môn',
        N'Quy tắc chuẩn Hangeul (국립국어원)',
        N'Nền tảng: nguyên âm, phụ âm, patchim và quy tắc phát âm cơ bản.',
        N'["Từ vựng","Nghe hiểu"]',
        1, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LearningLevels
    SET SkillTagsJson = N'["Từ vựng","Nghe hiểu"]',
        Description = N'Nền tảng: nguyên âm, phụ âm, patchim và quy tắc phát âm cơ bản.',
        UpdatedAt = SYSUTCDATETIME()
    WHERE LevelCode = 'LEVEL_0_HANGEUL';
END
DECLARE @Level0Id INT = (SELECT TOP 1 LevelId FROM dbo.LearningLevels WHERE LevelCode = 'LEVEL_0_HANGEUL');
IF NOT EXISTS (SELECT 1 FROM dbo.LevelUnlockRules WHERE LevelId = @Level0Id)
BEGIN
    INSERT INTO dbo.LevelUnlockRules (LevelId, PrerequisiteLevelId, RequiredCompletedLessonsPercent, MinAverageQuizScorePercent, IsDefaultUnlocked)
    VALUES (@Level0Id, NULL, 100, 80, 1);
END


IF NOT EXISTS (SELECT 1 FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_HG_1')
BEGIN
    INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
    VALUES (@Level0Id, N'TOPIC_HG_1', N'Chủ đề 1: 10 Nguyên âm đơn cơ bản (기본 모음)', N'Làm quen triết lý Thiên - Địa - Nhân và 10 nguyên âm đơn ㅏ, ㅑ, ㅓ, ㅕ, ㅗ, ㅛ, ㅜ, ㅠ, ㅡ, ㅣ.', 1, 'Published');
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_HG_2')
BEGIN
    INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
    VALUES (@Level0Id, N'TOPIC_HG_2', N'Chủ đề 2: 19 Phụ âm đơn, Bật hơi & Phụ âm đôi (자음과 쌍자음)', N'Làm chủ 14 phụ âm cơ bản và 5 phụ âm căng ㄲ, ㄸ, ㅃ, ㅆ, ㅉ.', 2, 'Published');
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_HG_3')
BEGIN
    INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
    VALUES (@Level0Id, N'TOPIC_HG_3', N'Chủ đề 3: 11 Nguyên âm đôi / Nguyên âm ghép (복합 모음)', N'Cách ghép và phát âm chuẩn 11 nguyên âm đôi ㅐ, ㅒ, ㅔ, ㅖ, ㅘ, ㅙ, ㅚ, ㅝ, ㅞ, ㅟ, ㅢ.', 3, 'Published');
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_HG_4')
BEGIN
    INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
    VALUES (@Level0Id, N'TOPIC_HG_4', N'Chủ đề 4: Phụ âm cuối Patchim & Tổng ôn Hangeul (받침과 총정리)', N'7 nhóm âm đại diện của Patchim, quy tắc nối âm, biến âm và tổng ôn 40 ký tự Hangeul.', 4, 'Published');
END

DECLARE @TopicId_HG_LESSON_01 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_HG_1');
IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_01')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @TopicId_HG_LESSON_01, @Level0Id, N'HG_LESSON_01', 1, N'Nguyên âm cơ bản 1: ㅏ ㅑ ㅓ ㅕ ㅗ', N'5 nguyên âm đầu tiên và cách phát âm.',
        N'Nhận diện, phát âm chuẩn và viết đúng thứ tự nét 5 nguyên âm ㅏ, ㅑ, ㅓ, ㅕ, ㅗ; ghép được âm tiết với phụ âm ㅇ.', 30, 1, 'Published', 0, 0
    );
END
ELSE
BEGIN
    UPDATE dbo.Lessons
    SET Title = N'Nguyên âm cơ bản 1: ㅏ ㅑ ㅓ ㅕ ㅗ',
        Subtitle = N'5 nguyên âm đầu tiên và cách phát âm.',
        LearningObjective = N'Nhận diện, phát âm chuẩn và viết đúng thứ tự nét 5 nguyên âm ㅏ, ㅑ, ㅓ, ㅕ, ㅗ; ghép được âm tiết với phụ âm ㅇ.',
        EstimatedMinutes = 30,
        UpdatedAt = SYSUTCDATETIME()
    WHERE LessonCode = N'HG_LESSON_01';
END
DECLARE @LessonId_HG_LESSON_01 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_01');

IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @LessonId_HG_LESSON_01)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@LessonId_HG_LESSON_01, 1, 1, 80, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_01_SEC_JAMO')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_01,
        N'HG_LESSON_01_SEC_JAMO',
        'jamo_cards',
        N'Bảng chữ cái & Phát âm tương tác',
        N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        N'[{"ko":"ㅏ","roman":"a","vi":"아 · Mở rộng miệng tự nhiên như âm \"a\" tiếng Việt"},{"ko":"ㅑ","roman":"ya","vi":"야 · Phát âm nhanh từ \"i\" sang \"a\" -> \"ya\""},{"ko":"ㅓ","roman":"eo · ơ","vi":"어 · Mở miệng vừa phải, gần giống âm \"ơ\" tiếng Việt"},{"ko":"ㅕ","roman":"yeo · yơ","vi":"여 · Phát âm nhanh từ \"i\" sang \"ơ\" -> \"yeo / yơ\""},{"ko":"ㅗ","roman":"o · ô (ngắn)","vi":"오 · Tròn môi, chu nhẹ môi về phía trước như âm \"ô\" ngắn"}]',
        1,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET ExamplesJson = N'[{"ko":"ㅏ","roman":"a","vi":"아 · Mở rộng miệng tự nhiên như âm \"a\" tiếng Việt"},{"ko":"ㅑ","roman":"ya","vi":"야 · Phát âm nhanh từ \"i\" sang \"a\" -> \"ya\""},{"ko":"ㅓ","roman":"eo · ơ","vi":"어 · Mở miệng vừa phải, gần giống âm \"ơ\" tiếng Việt"},{"ko":"ㅕ","roman":"yeo · yơ","vi":"여 · Phát âm nhanh từ \"i\" sang \"ơ\" -> \"yeo / yơ\""},{"ko":"ㅗ","roman":"o · ô (ngắn)","vi":"오 · Tròn môi, chu nhẹ môi về phía trước như âm \"ô\" ngắn"}]',
        ContentHtmlOrMd = N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        DisplayOrder = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_01_SEC_JAMO';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_01_SEC_THEORY')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_01,
        N'HG_LESSON_01_SEC_THEORY',
        'theory',
        N'Lý thuyết & Quy tắc phát âm trọng tâm',
        N'### 1. Nguyên lý cấu tạo nguyên âm Hangeul
Bảng chữ cái **Hangeul (한글)** do vua Sejong sáng제 năm 1443 dựa trên 3 yếu tố triết học phương Đông:
- **ㆍ (Thiên - Bầu trời)**: Điểm tròn (nay viết thành nét gạch ngắn)
- **ㅡ (Địa - Mặt đất)**: Nét ngang phẳng
- **ㅣ (Nhân - Con người)**: Nét sổ thẳng đứng

### 2. Chi tiết 5 nguyên âm cơ bản 1
| Nguyên âm | Phiên âm | Khẩu hình & Cách phát âm | Ghép với ㅇ |
|---|---|---|---|
| **ㅏ** | **a** | Mở rộng miệng tự nhiên như âm "a" tiếng Việt | **아** (a) |
| **ㅑ** | **ya** | Phát âm nhanh từ "i" sang "a" -> "ya" | **야** (ya) |
| **ㅓ** | **eo** | Mở miệng vừa phải, lưỡi hơi lùi về sau (gần giống âm "ơ" pha "o") | **어** (eo) |
| **ㅕ** | **yeo** | Phát âm nhanh từ "i" sang "ơ" -> "yeo" | **여** (yeo) |
| **ㅗ** | **o** | Tròn môi, chu nhẹ môi về phía trước như âm "ô" | **오** (o) |

### 3. Quy tắc ghép chữ cơ bản
Nguyên âm không bao giờ đứng một mình thành âm tiết hoàn chỉnh. Khi đọc nguyên âm độc lập, bắt buộc thêm phụ âm câm **ㅇ** ở bên trái (`ㅏ -> 아`) hoặc ở phía trên (`ㅗ -> 오`).',
        N'[{"ko":"아이","roman":"a-i","vi":"Em bé, đứa trẻ"},{"ko":"오이","roman":"o-i","vi":"Quả dưa chuột"},{"ko":"여우","roman":"yeo-u","vi":"Con cáo"}]',
        2,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET DisplayOrder = 2,
        ContentHtmlOrMd = N'### 1. Nguyên lý cấu tạo nguyên âm Hangeul
Bảng chữ cái **Hangeul (한글)** do vua Sejong sáng제 năm 1443 dựa trên 3 yếu tố triết học phương Đông:
- **ㆍ (Thiên - Bầu trời)**: Điểm tròn (nay viết thành nét gạch ngắn)
- **ㅡ (Địa - Mặt đất)**: Nét ngang phẳng
- **ㅣ (Nhân - Con người)**: Nét sổ thẳng đứng

### 2. Chi tiết 5 nguyên âm cơ bản 1
| Nguyên âm | Phiên âm | Khẩu hình & Cách phát âm | Ghép với ㅇ |
|---|---|---|---|
| **ㅏ** | **a** | Mở rộng miệng tự nhiên như âm "a" tiếng Việt | **아** (a) |
| **ㅑ** | **ya** | Phát âm nhanh từ "i" sang "a" -> "ya" | **야** (ya) |
| **ㅓ** | **eo** | Mở miệng vừa phải, lưỡi hơi lùi về sau (gần giống âm "ơ" pha "o") | **어** (eo) |
| **ㅕ** | **yeo** | Phát âm nhanh từ "i" sang "ơ" -> "yeo" | **여** (yeo) |
| **ㅗ** | **o** | Tròn môi, chu nhẹ môi về phía trước như âm "ô" | **오** (o) |

### 3. Quy tắc ghép chữ cơ bản
Nguyên âm không bao giờ đứng một mình thành âm tiết hoàn chỉnh. Khi đọc nguyên âm độc lập, bắt buộc thêm phụ âm câm **ㅇ** ở bên trái (`ㅏ -> 아`) hoặc ở phía trên (`ㅗ -> 오`).',
        ExamplesJson = N'[{"ko":"아이","roman":"a-i","vi":"Em bé, đứa trẻ"},{"ko":"오이","roman":"o-i","vi":"Quả dưa chuột"},{"ko":"여우","roman":"yeo-u","vi":"Con cáo"}]',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_01_SEC_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_01_RES_WRITE')
BEGIN
    INSERT INTO dbo.LessonResources (LessonId, ResourceCode, ResourceType, Title, Description, ResourceUrl, TargetCharsJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_01,
        N'HG_LESSON_01_RES_WRITE',
        'writing_sheet',
        N'Phiếu luyện viết ô ly & Mẫu chữ viết tay PE92 - Nguyên âm cơ bản 1: ㅏ ㅑ ㅓ ㅕ ㅗ',
        N'Đối chiếu trực tiếp với mẫu chữ viết tay SQL Server (dbo.HangulCharacterClasses) và luyện viết trên bảng ô ly.',
        N'/ai?tab=handwriting',
        N'["가","나","다"]',
        1,
        'Published'
    );
END
DECLARE @ResId_HG_LESSON_01 INT = (SELECT TOP 1 ResourceId FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_01_RES_WRITE');


IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG01_01')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG01_01', N'아이', N'a-i', N'Trẻ em, em bé', N'Danh từ',
        N'아이가 웃어요.', N'Em bé đang cười.', 'A', N'Nhập môn', N'Nguyên âm cơ bản 1: ㅏ ㅑ ㅓ ㅕ ㅗ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG01_01 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG01_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_01 AND VocabId = @VocabId_VC_HG01_01)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_01, @VocabId_VC_HG01_01, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG01_02')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG01_02', N'오이', N'o-i', N'Dưa chuột (dưa leo)', N'Danh từ',
        N'오이를 먹어요.', N'Tôi ăn dưa chuột.', 'A', N'Nhập môn', N'Nguyên âm cơ bản 1: ㅏ ㅑ ㅓ ㅕ ㅗ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG01_02 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG01_02');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_01 AND VocabId = @VocabId_VC_HG01_02)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_01, @VocabId_VC_HG01_02, 2, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG01_03')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG01_03', N'야구', N'ya-gu', N'Môn bóng chày', N'Danh từ',
        N'야구를 좋아해요.', N'Tôi thích bóng chày.', 'A', N'Nhập môn', N'Nguyên âm cơ bản 1: ㅏ ㅑ ㅓ ㅕ ㅗ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG01_03 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG01_03');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_01 AND VocabId = @VocabId_VC_HG01_03)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_01, @VocabId_VC_HG01_03, 3, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG01_04')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG01_04', N'어머니', N'eo-meo-ni', N'Mẹ', N'Danh từ',
        N'우리 어머니예요.', N'Đây là mẹ của tôi.', 'A', N'Nhập môn', N'Nguyên âm cơ bản 1: ㅏ ㅑ ㅓ ㅕ ㅗ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG01_04 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG01_04');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_01 AND VocabId = @VocabId_VC_HG01_04)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_01, @VocabId_VC_HG01_04, 4, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_01_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_01,
        N'HG_LESSON_01_FINAL_EX',
        'final_test',
        N'Bài kiểm tra cuối buổi — Nguyên âm cơ bản 1: ㅏ ㅑ ㅓ ㅕ ㅗ',
        N'Hoàn thành đúng từ 80% trở lên để hoàn thành buổi học và mở khóa buổi tiếp theo.',
        80,
        300,
        1,
        'Published'
    );
END
DECLARE @ExId_HG_LESSON_01 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_01_FINAL_EX');


IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG01_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_01,
        N'Q_HG01_1',
        'multiple_choice',
        N'Nguyên âm nào sau đây được phát âm là "eo" (gần giống âm "ơ" tiếng Việt)?',
        N'ㅓ / ㅏ / ㅗ / ㅑ',
        N'ㅏ phát âm là "a", ㅑ là "ya", ㅓ là "eo" (ơ), ㅗ là "o" (ô).',
        20,
        1,
        'Published'
    );
END
DECLARE @QId_Q_HG01_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG01_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG01_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG01_1, N'A', N'ㅏ', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG01_1, N'B', N'ㅓ', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG01_1, N'C', N'ㅗ', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG01_1, N'D', N'ㅑ', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG01_2')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_01,
        N'Q_HG01_2',
        'multiple_choice',
        N'Khi viết nguyên âm đứng (ㅏ, ㅑ, ㅓ, ㅕ) thành âm tiết độc lập, phụ âm câm ㅇ được đặt ở vị trí nào?',
        N'아, 야, 어, 여',
        N'Với các nguyên âm có trục dọc chính (ㅏ, ㅑ, ㅓ, ㅕ), phụ âm đầu ㅇ được đặt ở phía bên trái.',
        20,
        2,
        'Published'
    );
END
DECLARE @QId_Q_HG01_2 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG01_2');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG01_2)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG01_2, N'A', N'Đặt ở phía bên trái nguyên âm', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG01_2, N'B', N'Đặt ở phía dưới nguyên âm', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG01_2, N'C', N'Đặt ở phía bên phải nguyên âm', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG01_2, N'D', N'Không cần viết phụ âm ㅇ', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG01_3')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_01,
        N'Q_HG01_3',
        'multiple_choice',
        N'Từ tiếng Hàn "오이" có nghĩa tiếng Việt là gì?',
        N'오이',
        N'오이 (o-i) có nghĩa là quả dưa chuột (dưa leo).',
        20,
        3,
        'Published'
    );
END
DECLARE @QId_Q_HG01_3 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG01_3');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG01_3)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG01_3, N'A', N'Em bé', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG01_3, N'B', N'Quả dưa chuột', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG01_3, N'C', N'Mẹ', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG01_3, N'D', N'Bóng chày', 0, 4);
END

UPDATE dbo.LessonActivities
SET Status = 'Archived', IsRequired = 0
WHERE LessonId = @LessonId_HG_LESSON_01 AND ActivityCode = N'HG_LESSON_01_ACT_VOCAB';


IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_01_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_01, N'HG_LESSON_01_ACT_THEORY', N'theory', N'Học (5 chữ)', N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        1, NULL, NULL, 1, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'theory',
        Title = N'Học (5 chữ)',
        Description = N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        IsRequired = 1,
        DisplayOrder = 1,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_01_ACT_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_01_ACT_FLASHCARD')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_01, N'HG_LESSON_01_ACT_FLASHCARD', N'flashcard', N'Flashcard', N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        1, NULL, NULL, 2, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'flashcard',
        Title = N'Flashcard',
        Description = N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        IsRequired = 1,
        DisplayOrder = 2,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_01_ACT_FLASHCARD';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_01_ACT_PRACTICE')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_01, N'HG_LESSON_01_ACT_PRACTICE', N'practice_quiz', N'Trắc nghiệm', N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        1, NULL, NULL, 3, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'practice_quiz',
        Title = N'Trắc nghiệm',
        Description = N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        IsRequired = 1,
        DisplayOrder = 3,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_01_ACT_PRACTICE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_01_ACT_WRITING')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_01, N'HG_LESSON_01_ACT_WRITING', N'writing_sheet', N'Phiếu luyện viết', N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        1, NULL, @ResId_HG_LESSON_01, 4, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'writing_sheet',
        Title = N'Phiếu luyện viết',
        Description = N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        IsRequired = 1,
        DisplayOrder = 4,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_01_ACT_WRITING';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_01_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_01, N'HG_LESSON_01_ACT_QUIZ', N'final_test', N'Bài kiểm tra', N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        1, @ExId_HG_LESSON_01, NULL, 5, 50, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'final_test',
        Title = N'Bài kiểm tra',
        Description = N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        IsRequired = 1,
        DisplayOrder = 5,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_01_ACT_QUIZ';
END

DECLARE @TopicId_HG_LESSON_02 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_HG_1');
IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_02')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @TopicId_HG_LESSON_02, @Level0Id, N'HG_LESSON_02', 2, N'Nguyên âm cơ bản 2: ㅛ ㅜ ㅠ ㅡ ㅣ', N'5 nguyên âm đơn tiếp theo và cách ghép chữ ngang - dọc.',
        N'Phát âm chuẩn và viết đúng 5 nguyên âm ㅛ, ㅜ, ㅠ, ㅡ, ㅣ; nắm vững quy tắc ghép chữ ngang và dọc với 10 nguyên âm cơ bản.', 38, 2, 'Published', 0, 0
    );
END
ELSE
BEGIN
    UPDATE dbo.Lessons
    SET Title = N'Nguyên âm cơ bản 2: ㅛ ㅜ ㅠ ㅡ ㅣ',
        Subtitle = N'5 nguyên âm đơn tiếp theo và cách ghép chữ ngang - dọc.',
        LearningObjective = N'Phát âm chuẩn và viết đúng 5 nguyên âm ㅛ, ㅜ, ㅠ, ㅡ, ㅣ; nắm vững quy tắc ghép chữ ngang và dọc với 10 nguyên âm cơ bản.',
        EstimatedMinutes = 38,
        UpdatedAt = SYSUTCDATETIME()
    WHERE LessonCode = N'HG_LESSON_02';
END
DECLARE @LessonId_HG_LESSON_02 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_02');

IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @LessonId_HG_LESSON_02)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@LessonId_HG_LESSON_02, 1, 1, 80, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_02_SEC_JAMO')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_02,
        N'HG_LESSON_02_SEC_JAMO',
        'jamo_cards',
        N'Bảng chữ cái & Phát âm tương tác',
        N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        N'[{"ko":"ㅛ","roman":"yo · yô","vi":"요 · Chu môi tròn phát âm nhanh từ \"i\" sang \"ô\" -> \"yo\""},{"ko":"ㅜ","roman":"u","vi":"우 · Chu môi tròn như âm \"u\" tiếng Việt"},{"ko":"ㅠ","roman":"yu","vi":"유 · Phát âm nhanh từ \"i\" sang \"u\" -> \"yu\""},{"ko":"ㅡ","roman":"eu · ư","vi":"으 · Kéo nhẹ khóe miệng sang hai bên như âm \"ư\""},{"ko":"ㅣ","roman":"i","vi":"이 · Kéo miệng ngang như âm \"i\" tiếng Việt"}]',
        1,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET ExamplesJson = N'[{"ko":"ㅛ","roman":"yo · yô","vi":"요 · Chu môi tròn phát âm nhanh từ \"i\" sang \"ô\" -> \"yo\""},{"ko":"ㅜ","roman":"u","vi":"우 · Chu môi tròn như âm \"u\" tiếng Việt"},{"ko":"ㅠ","roman":"yu","vi":"유 · Phát âm nhanh từ \"i\" sang \"u\" -> \"yu\""},{"ko":"ㅡ","roman":"eu · ư","vi":"으 · Kéo nhẹ khóe miệng sang hai bên như âm \"ư\""},{"ko":"ㅣ","roman":"i","vi":"이 · Kéo miệng ngang như âm \"i\" tiếng Việt"}]',
        ContentHtmlOrMd = N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        DisplayOrder = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_02_SEC_JAMO';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_02_SEC_THEORY')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_02,
        N'HG_LESSON_02_SEC_THEORY',
        'theory',
        N'Lý thuyết & Quy tắc phát âm trọng tâm',
        N'### 1. Chi tiết 5 nguyên âm cơ bản 2
| Nguyên âm | Phiên âm | Khẩu hình & Cách phát âm | Ghép với ㅇ |
|---|---|---|---|
| **ㅛ** | **yo** | Chu môi tròn, phát âm nhanh từ "i" sang "ô" -> "yo" | **요** (yo) |
| **ㅜ** | **u** | Chu môi tròn như âm "u" tiếng Việt | **우** (u) |
| **ㅠ** | **yu** | Phát âm nhanh từ "i" sang "u" -> "yu" | **유** (yu) |
| **ㅡ** | **eu** | Kéo nhẹ khóe miệng sang hai bên, phát âm như âm "ư" | **으** (eu) |
| **ㅣ** | **i** | Kéo miệng ngang, phát âm như âm "i" tiếng Việt | **이** (i) |

### 2. Phân loại nguyên âm dọc và nguyên âm ngang
- **Nguyên âm dọc** (`ㅏ, ㅑ, ㅓ, ㅕ, ㅣ`): Phụ âm đứng **bên trái** (예: 아, 이).
- **Nguyên âm ngang** (`ㅗ, ㅛ, ㅜ, ㅠ, ㅡ`): Phụ âm đứng **phía trên** (예: 오, 우, 으).',
        N'[{"ko":"우유","roman":"u-yu","vi":"Sữa tươi"},{"ko":"이유","roman":"i-yu","vi":"Lý do"},{"ko":"여유","roman":"yeo-yu","vi":"Sự thong thả, dư dả"}]',
        2,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET DisplayOrder = 2,
        ContentHtmlOrMd = N'### 1. Chi tiết 5 nguyên âm cơ bản 2
| Nguyên âm | Phiên âm | Khẩu hình & Cách phát âm | Ghép với ㅇ |
|---|---|---|---|
| **ㅛ** | **yo** | Chu môi tròn, phát âm nhanh từ "i" sang "ô" -> "yo" | **요** (yo) |
| **ㅜ** | **u** | Chu môi tròn như âm "u" tiếng Việt | **우** (u) |
| **ㅠ** | **yu** | Phát âm nhanh từ "i" sang "u" -> "yu" | **유** (yu) |
| **ㅡ** | **eu** | Kéo nhẹ khóe miệng sang hai bên, phát âm như âm "ư" | **으** (eu) |
| **ㅣ** | **i** | Kéo miệng ngang, phát âm như âm "i" tiếng Việt | **이** (i) |

### 2. Phân loại nguyên âm dọc và nguyên âm ngang
- **Nguyên âm dọc** (`ㅏ, ㅑ, ㅓ, ㅕ, ㅣ`): Phụ âm đứng **bên trái** (예: 아, 이).
- **Nguyên âm ngang** (`ㅗ, ㅛ, ㅜ, ㅠ, ㅡ`): Phụ âm đứng **phía trên** (예: 오, 우, 으).',
        ExamplesJson = N'[{"ko":"우유","roman":"u-yu","vi":"Sữa tươi"},{"ko":"이유","roman":"i-yu","vi":"Lý do"},{"ko":"여유","roman":"yeo-yu","vi":"Sự thong thả, dư dả"}]',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_02_SEC_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_02_RES_WRITE')
BEGIN
    INSERT INTO dbo.LessonResources (LessonId, ResourceCode, ResourceType, Title, Description, ResourceUrl, TargetCharsJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_02,
        N'HG_LESSON_02_RES_WRITE',
        'writing_sheet',
        N'Phiếu luyện viết ô ly & Mẫu chữ viết tay PE92 - Nguyên âm cơ bản 2: ㅛ ㅜ ㅠ ㅡ ㅣ',
        N'Đối chiếu trực tiếp với mẫu chữ viết tay SQL Server (dbo.HangulCharacterClasses) và luyện viết trên bảng ô ly.',
        N'/ai?tab=handwriting',
        N'["구","기","고"]',
        1,
        'Published'
    );
END
DECLARE @ResId_HG_LESSON_02 INT = (SELECT TOP 1 ResourceId FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_02_RES_WRITE');


IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG02_01')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG02_01', N'우유', N'u-yu', N'Sữa', N'Danh từ',
        N'아침에 우유를 마셔요.', N'Buổi sáng tôi uống sữa.', 'A', N'Nhập môn', N'Nguyên âm cơ bản 2: ㅛ ㅜ ㅠ ㅡ ㅣ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG02_01 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG02_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_02 AND VocabId = @VocabId_VC_HG02_01)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_02, @VocabId_VC_HG02_01, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG02_02')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG02_02', N'이', N'i', N'Số 2 / Cái răng', N'Danh từ',
        N'이를 닦아요.', N'Tôi đánh răng.', 'A', N'Nhập môn', N'Nguyên âm cơ bản 2: ㅛ ㅜ ㅠ ㅡ ㅣ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG02_02 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG02_02');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_02 AND VocabId = @VocabId_VC_HG02_02)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_02, @VocabId_VC_HG02_02, 2, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG02_03')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG02_03', N'오리', N'o-ri', N'Con vịt', N'Danh từ',
        N'호수에 오리가 있어요.', N'Ở hồ có con vịt.', 'A', N'Nhập môn', N'Nguyên âm cơ bản 2: ㅛ ㅜ ㅠ ㅡ ㅣ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG02_03 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG02_03');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_02 AND VocabId = @VocabId_VC_HG02_03)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_02, @VocabId_VC_HG02_03, 3, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG02_04')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG02_04', N'요리', N'yo-ri', N'Món ăn, việc nấu ăn', N'Danh từ',
        N'한국 요리를 배워요.', N'Tôi học nấu món Hàn.', 'A', N'Nhập môn', N'Nguyên âm cơ bản 2: ㅛ ㅜ ㅠ ㅡ ㅣ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG02_04 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG02_04');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_02 AND VocabId = @VocabId_VC_HG02_04)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_02, @VocabId_VC_HG02_04, 4, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_02_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_02,
        N'HG_LESSON_02_FINAL_EX',
        'final_test',
        N'Bài kiểm tra cuối buổi — Nguyên âm cơ bản 2: ㅛ ㅜ ㅠ ㅡ ㅣ',
        N'Hoàn thành đúng từ 80% trở lên để hoàn thành buổi học và mở khóa buổi tiếp theo.',
        80,
        300,
        1,
        'Published'
    );
END
DECLARE @ExId_HG_LESSON_02 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_02_FINAL_EX');


IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG02_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_02,
        N'Q_HG02_1',
        'multiple_choice',
        N'Từ tiếng Hàn nào dưới đây có nghĩa là "Sữa" (ghép từ nguyên âm ㅜ và ㅠ)?',
        N'우유',
        N'우 (u) + 유 (yu) = 우유 (sữa).',
        20,
        1,
        'Published'
    );
END
DECLARE @QId_Q_HG02_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG02_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG02_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG02_1, N'A', N'오이', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG02_1, N'B', N'우유', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG02_1, N'C', N'아이', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG02_1, N'D', N'요리', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG02_2')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_02,
        N'Q_HG02_2',
        'multiple_choice',
        N'Nhóm nguyên âm nào sau đây đều là nguyên âm ngang (phụ âm đặt phía trên)?',
        N'ㅗ, ㅛ, ㅜ, ㅠ, ㅡ',
        N'Các nguyên âm có trục ngang chính gồm ㅗ, ㅛ, ㅜ, ㅠ, ㅡ luôn đặt phụ âm đầu ở phía trên.',
        20,
        2,
        'Published'
    );
END
DECLARE @QId_Q_HG02_2 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG02_2');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG02_2)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG02_2, N'A', N'ㅗ, ㅛ, ㅜ, ㅠ, ㅡ', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG02_2, N'B', N'ㅏ, ㅑ, ㅓ, ㅕ, ㅣ', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG02_2, N'C', N'ㅏ, ㅗ, ㅜ, ㅣ', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG02_2, N'D', N'ㅓ, ㅕ, ㅡ, ㅣ', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG02_3')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_02,
        N'Q_HG02_3',
        'multiple_choice',
        N'Nguyên âm "ㅡ" được phát âm tương ứng với âm nào trong tiếng Việt?',
        N'ㅡ (으)',
        N'ㅡ được phát âm là "eu", tương đương với âm "ư" trong tiếng Việt.',
        20,
        3,
        'Published'
    );
END
DECLARE @QId_Q_HG02_3 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG02_3');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG02_3)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG02_3, N'A', N'Âm "u"', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG02_3, N'B', N'Âm "ư"', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG02_3, N'C', N'Âm "i"', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG02_3, N'D', N'Âm "ô"', 0, 4);
END

UPDATE dbo.LessonActivities
SET Status = 'Archived', IsRequired = 0
WHERE LessonId = @LessonId_HG_LESSON_02 AND ActivityCode = N'HG_LESSON_02_ACT_VOCAB';


IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_02_ACT_WARMUP')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_02, N'HG_LESSON_02_ACT_WARMUP', N'warmup_quiz', N'Kiểm tra đầu buổi', N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        1, NULL, NULL, 1, 10, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'warmup_quiz',
        Title = N'Kiểm tra đầu buổi',
        Description = N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        IsRequired = 1,
        DisplayOrder = 1,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_02_ACT_WARMUP';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_02_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_02, N'HG_LESSON_02_ACT_THEORY', N'theory', N'Học (5 chữ)', N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        1, NULL, NULL, 2, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'theory',
        Title = N'Học (5 chữ)',
        Description = N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        IsRequired = 1,
        DisplayOrder = 2,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_02_ACT_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_02_ACT_FLASHCARD')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_02, N'HG_LESSON_02_ACT_FLASHCARD', N'flashcard', N'Flashcard', N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        1, NULL, NULL, 3, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'flashcard',
        Title = N'Flashcard',
        Description = N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        IsRequired = 1,
        DisplayOrder = 3,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_02_ACT_FLASHCARD';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_02_ACT_PRACTICE')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_02, N'HG_LESSON_02_ACT_PRACTICE', N'practice_quiz', N'Trắc nghiệm', N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        1, NULL, NULL, 4, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'practice_quiz',
        Title = N'Trắc nghiệm',
        Description = N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        IsRequired = 1,
        DisplayOrder = 4,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_02_ACT_PRACTICE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_02_ACT_WRITING')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_02, N'HG_LESSON_02_ACT_WRITING', N'writing_sheet', N'Phiếu luyện viết', N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        1, NULL, @ResId_HG_LESSON_02, 5, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'writing_sheet',
        Title = N'Phiếu luyện viết',
        Description = N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        IsRequired = 1,
        DisplayOrder = 5,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_02_ACT_WRITING';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_02_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_02, N'HG_LESSON_02_ACT_QUIZ', N'final_test', N'Bài kiểm tra', N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        1, @ExId_HG_LESSON_02, NULL, 6, 50, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'final_test',
        Title = N'Bài kiểm tra',
        Description = N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        IsRequired = 1,
        DisplayOrder = 6,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_02_ACT_QUIZ';
END

DECLARE @TopicId_HG_LESSON_03 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_HG_2');
IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_03')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @TopicId_HG_LESSON_03, @Level0Id, N'HG_LESSON_03', 3, N'Phụ âm cơ bản 1: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ', N'7 phụ âm đầu tiên mô phỏng hình dáng cơ quan phát âm.',
        N'Nhận biết, viết đúng thứ tự nét và ghép vần thành thạo 7 phụ âm ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅅ với 10 nguyên âm cơ bản.', 38, 3, 'Published', 0, 0
    );
END
ELSE
BEGIN
    UPDATE dbo.Lessons
    SET Title = N'Phụ âm cơ bản 1: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ',
        Subtitle = N'7 phụ âm đầu tiên mô phỏng hình dáng cơ quan phát âm.',
        LearningObjective = N'Nhận biết, viết đúng thứ tự nét và ghép vần thành thạo 7 phụ âm ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅅ với 10 nguyên âm cơ bản.',
        EstimatedMinutes = 38,
        UpdatedAt = SYSUTCDATETIME()
    WHERE LessonCode = N'HG_LESSON_03';
END
DECLARE @LessonId_HG_LESSON_03 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_03');

IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @LessonId_HG_LESSON_03)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@LessonId_HG_LESSON_03, 1, 1, 80, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_03_SEC_JAMO')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_03,
        N'HG_LESSON_03_SEC_JAMO',
        'jamo_cards',
        N'Bảng chữ cái & Phát âm tương tác',
        N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        N'[{"ko":"ㄱ","roman":"g / k · gi-yeok","vi":"가 · Đứng đầu đọc nhẹ giữa k/g; ghép với ㅏ thành 가 (ga)"},{"ko":"ㄴ","roman":"n · ni-eun","vi":"나 · Đầu lưỡi chạm chân răng trên như âm \"n\" (나 - na)"},{"ko":"ㄷ","roman":"d / t · di-geut","vi":"다 · Đầu lưỡi chạm lợi trên như âm \"t/đ\" nhẹ (다 - da)"},{"ko":"ㄹ","roman":"r / l · ri-eul","vi":"라 · Đầu lưỡi uốn nhẹ chạm vòm họng (라 - ra)"},{"ko":"ㅁ","roman":"m · mi-eum","vi":"마 · Khép hai môi mở ra như âm \"m\" (마 - ma)"},{"ko":"ㅂ","roman":"b / p · bi-eup","vi":"바 · Hai môi chạm nhẹ mở ra giữa b/p (바 - ba)"},{"ko":"ㅅ","roman":"s / x · si-ot","vi":"사 · Phát âm nhẹ như \"s/x\" (사 - sa)"}]',
        1,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET ExamplesJson = N'[{"ko":"ㄱ","roman":"g / k · gi-yeok","vi":"가 · Đứng đầu đọc nhẹ giữa k/g; ghép với ㅏ thành 가 (ga)"},{"ko":"ㄴ","roman":"n · ni-eun","vi":"나 · Đầu lưỡi chạm chân răng trên như âm \"n\" (나 - na)"},{"ko":"ㄷ","roman":"d / t · di-geut","vi":"다 · Đầu lưỡi chạm lợi trên như âm \"t/đ\" nhẹ (다 - da)"},{"ko":"ㄹ","roman":"r / l · ri-eul","vi":"라 · Đầu lưỡi uốn nhẹ chạm vòm họng (라 - ra)"},{"ko":"ㅁ","roman":"m · mi-eum","vi":"마 · Khép hai môi mở ra như âm \"m\" (마 - ma)"},{"ko":"ㅂ","roman":"b / p · bi-eup","vi":"바 · Hai môi chạm nhẹ mở ra giữa b/p (바 - ba)"},{"ko":"ㅅ","roman":"s / x · si-ot","vi":"사 · Phát âm nhẹ như \"s/x\" (사 - sa)"}]',
        ContentHtmlOrMd = N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        DisplayOrder = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_03_SEC_JAMO';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_03_SEC_THEORY')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_03,
        N'HG_LESSON_03_SEC_THEORY',
        'theory',
        N'Lý thuyết & Quy tắc phát âm trọng tâm',
        N'### 1. Bảng 7 phụ âm cơ bản 1
| Phụ âm | Tên gọi | Phiên âm | Gợi ý phát âm | Ghép với ㅏ |
|---|---|---|---|---|
| **ㄱ** | 기역 (gi-yeok) | **g / k** | Đứng đầu từ đọc nhẹ giữa k và g; đứng giữa từ đọc là g | **가** (ga) |
| **ㄴ** | 니은 (ni-eun) | **n** | Đầu lưỡi chạm chân răng trên như âm "n" | **나** (na) |
| **ㄷ** | 디귿 (di-geut) | **d / t** | Đầu lưỡi chạm lợi trên, tương đương âm "t/đ" nhẹ | **다** (da) |
| **ㄹ** | 리을 (ri-eul) | **r / l** | Đầu lưỡi uốn nhẹ chạm vòm họng (giữa r và l) | **라** (ra) |
| **ㅁ** | 미음 (mi-eum) | **m** | Khép hai môi rồi mở ra như âm "m" | **마** (ma) |
| **ㅂ** | 비읍 (bi-eup) | **b / p** | Hai môi chạm nhẹ mở ra phát âm giữa b và p | **바** (ba) |
| **ㅅ** | 시옷 (si-ot) | **s** | Phát âm nhẹ như "s/x"; khi ghép với ㅣ, ㅑ, ㅕ, ㅛ, ㅠ đọc cong lưỡi nhẹ [sh] | **사** (sa) |',
        N'[{"ko":"가수","roman":"ga-su","vi":"Ca sĩ"},{"ko":"나무","roman":"na-mu","vi":"Cái cây"},{"ko":"바다","roman":"ba-da","vi":"Biển"}]',
        2,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET DisplayOrder = 2,
        ContentHtmlOrMd = N'### 1. Bảng 7 phụ âm cơ bản 1
| Phụ âm | Tên gọi | Phiên âm | Gợi ý phát âm | Ghép với ㅏ |
|---|---|---|---|---|
| **ㄱ** | 기역 (gi-yeok) | **g / k** | Đứng đầu từ đọc nhẹ giữa k và g; đứng giữa từ đọc là g | **가** (ga) |
| **ㄴ** | 니은 (ni-eun) | **n** | Đầu lưỡi chạm chân răng trên như âm "n" | **나** (na) |
| **ㄷ** | 디귿 (di-geut) | **d / t** | Đầu lưỡi chạm lợi trên, tương đương âm "t/đ" nhẹ | **다** (da) |
| **ㄹ** | 리을 (ri-eul) | **r / l** | Đầu lưỡi uốn nhẹ chạm vòm họng (giữa r và l) | **라** (ra) |
| **ㅁ** | 미음 (mi-eum) | **m** | Khép hai môi rồi mở ra như âm "m" | **마** (ma) |
| **ㅂ** | 비읍 (bi-eup) | **b / p** | Hai môi chạm nhẹ mở ra phát âm giữa b và p | **바** (ba) |
| **ㅅ** | 시옷 (si-ot) | **s** | Phát âm nhẹ như "s/x"; khi ghép với ㅣ, ㅑ, ㅕ, ㅛ, ㅠ đọc cong lưỡi nhẹ [sh] | **사** (sa) |',
        ExamplesJson = N'[{"ko":"가수","roman":"ga-su","vi":"Ca sĩ"},{"ko":"나무","roman":"na-mu","vi":"Cái cây"},{"ko":"바다","roman":"ba-da","vi":"Biển"}]',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_03_SEC_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_03_RES_WRITE')
BEGIN
    INSERT INTO dbo.LessonResources (LessonId, ResourceCode, ResourceType, Title, Description, ResourceUrl, TargetCharsJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_03,
        N'HG_LESSON_03_RES_WRITE',
        'writing_sheet',
        N'Phiếu luyện viết ô ly & Mẫu chữ viết tay PE92 - Phụ âm cơ bản 1: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ',
        N'Đối chiếu trực tiếp với mẫu chữ viết tay SQL Server (dbo.HangulCharacterClasses) và luyện viết trên bảng ô ly.',
        N'/ai?tab=handwriting',
        N'["가","나","다","라","마","바","사"]',
        1,
        'Published'
    );
END
DECLARE @ResId_HG_LESSON_03 INT = (SELECT TOP 1 ResourceId FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_03_RES_WRITE');


IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG03_01')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG03_01', N'가방', N'ga-bang', N'Cặp sách, túi xách', N'Danh từ',
        N'가방이 커요.', N'Chiếc cặp sách to.', 'A', N'Nhập môn', N'Phụ âm cơ bản 1: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG03_01 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG03_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_03 AND VocabId = @VocabId_VC_HG03_01)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_03, @VocabId_VC_HG03_01, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG03_02')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG03_02', N'나무', N'na-mu', N'Cây cối, gỗ', N'Danh từ',
        N'공원에 나무가 많아요.', N'Ở công viên có nhiều cây.', 'A', N'Nhập môn', N'Phụ âm cơ bản 1: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG03_02 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG03_02');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_03 AND VocabId = @VocabId_VC_HG03_02)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_03, @VocabId_VC_HG03_02, 2, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG03_03')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG03_03', N'바다', N'ba-da', N'Biển', N'Danh từ',
        N'바다에 가고 싶어요.', N'Tôi muốn đi biển.', 'A', N'Nhập môn', N'Phụ âm cơ bản 1: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG03_03 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG03_03');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_03 AND VocabId = @VocabId_VC_HG03_03)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_03, @VocabId_VC_HG03_03, 3, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG03_04')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG03_04', N'사과', N'sa-gwa', N'Quả táo', N'Danh từ',
        N'사과가 맛있어요.', N'Quả táo ngon.', 'A', N'Nhập môn', N'Phụ âm cơ bản 1: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG03_04 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG03_04');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_03 AND VocabId = @VocabId_VC_HG03_04)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_03, @VocabId_VC_HG03_04, 4, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_03_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_03,
        N'HG_LESSON_03_FINAL_EX',
        'final_test',
        N'Bài kiểm tra cuối buổi — Phụ âm cơ bản 1: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅅ',
        N'Hoàn thành đúng từ 80% trở lên để hoàn thành buổi học và mở khóa buổi tiếp theo.',
        80,
        300,
        1,
        'Published'
    );
END
DECLARE @ExId_HG_LESSON_03 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_03_FINAL_EX');


IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG03_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_03,
        N'Q_HG03_1',
        'multiple_choice',
        N'Khi ghép phụ âm "ㄴ" với nguyên âm "ㅏ" và phụ âm "ㅁ" với nguyên âm "ㅜ", ta được từ nào?',
        N'ㄴ + ㅏ / ㅁ + ㅜ',
        N'ㄴ + ㅏ = 나, ㅁ + ㅜ = 무 -> 나무 (cái cây).',
        20,
        1,
        'Published'
    );
END
DECLARE @QId_Q_HG03_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG03_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG03_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG03_1, N'A', N'나무 (Cái cây)', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG03_1, N'B', N'바다 (Biển)', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG03_1, N'C', N'가수 (Ca sĩ)', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG03_1, N'D', N'나비 (Con bướm)', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG03_2')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_03,
        N'Q_HG03_2',
        'multiple_choice',
        N'Phụ âm nào sau đây mô phỏng hình dáng hai môi khép lại và mang âm "m"?',
        N'ㅁ (미음)',
        N'ㅁ (mi-eum) mô phỏng hình dáng miệng/hai môi và phát âm là "m".',
        20,
        2,
        'Published'
    );
END
DECLARE @QId_Q_HG03_2 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG03_2');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG03_2)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG03_2, N'A', N'ㄱ', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG03_2, N'B', N'ㄴ', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG03_2, N'C', N'ㅁ', 1, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG03_2, N'D', N'ㅅ', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG03_3')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_03,
        N'Q_HG03_3',
        'multiple_choice',
        N'Từ "바다" có nghĩa tiếng Việt là gì?',
        N'바다 (ba-da)',
        N'바다 (ba-da) nghĩa là Biển.',
        20,
        3,
        'Published'
    );
END
DECLARE @QId_Q_HG03_3 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG03_3');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG03_3)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG03_3, N'A', N'Cái cây', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG03_3, N'B', N'Biển', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG03_3, N'C', N'Ca sĩ', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG03_3, N'D', N'Cặp sách', 0, 4);
END

UPDATE dbo.LessonActivities
SET Status = 'Archived', IsRequired = 0
WHERE LessonId = @LessonId_HG_LESSON_03 AND ActivityCode = N'HG_LESSON_03_ACT_VOCAB';


IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_03_ACT_WARMUP')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_03, N'HG_LESSON_03_ACT_WARMUP', N'warmup_quiz', N'Kiểm tra đầu buổi', N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        1, NULL, NULL, 1, 10, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'warmup_quiz',
        Title = N'Kiểm tra đầu buổi',
        Description = N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        IsRequired = 1,
        DisplayOrder = 1,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_03_ACT_WARMUP';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_03_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_03, N'HG_LESSON_03_ACT_THEORY', N'theory', N'Học (7 chữ)', N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        1, NULL, NULL, 2, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'theory',
        Title = N'Học (7 chữ)',
        Description = N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        IsRequired = 1,
        DisplayOrder = 2,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_03_ACT_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_03_ACT_FLASHCARD')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_03, N'HG_LESSON_03_ACT_FLASHCARD', N'flashcard', N'Flashcard', N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        1, NULL, NULL, 3, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'flashcard',
        Title = N'Flashcard',
        Description = N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        IsRequired = 1,
        DisplayOrder = 3,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_03_ACT_FLASHCARD';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_03_ACT_PRACTICE')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_03, N'HG_LESSON_03_ACT_PRACTICE', N'practice_quiz', N'Trắc nghiệm', N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        1, NULL, NULL, 4, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'practice_quiz',
        Title = N'Trắc nghiệm',
        Description = N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        IsRequired = 1,
        DisplayOrder = 4,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_03_ACT_PRACTICE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_03_ACT_WRITING')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_03, N'HG_LESSON_03_ACT_WRITING', N'writing_sheet', N'Phiếu luyện viết', N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        1, NULL, @ResId_HG_LESSON_03, 5, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'writing_sheet',
        Title = N'Phiếu luyện viết',
        Description = N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        IsRequired = 1,
        DisplayOrder = 5,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_03_ACT_WRITING';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_03_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_03, N'HG_LESSON_03_ACT_QUIZ', N'final_test', N'Bài kiểm tra', N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        1, @ExId_HG_LESSON_03, NULL, 6, 50, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'final_test',
        Title = N'Bài kiểm tra',
        Description = N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        IsRequired = 1,
        DisplayOrder = 6,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_03_ACT_QUIZ';
END

DECLARE @TopicId_HG_LESSON_04 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_HG_2');
IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_04')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @TopicId_HG_LESSON_04, @Level0Id, N'HG_LESSON_04', 4, N'Phụ âm cơ bản 2: ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ', N'Hoàn thiện 14 phụ âm cơ bản và làm chủ nhóm phụ âm bật hơi (거센소리).',
        N'Phân biệt rõ âm thường (ㄱ, ㄷ, ㅂ, ㅈ) và âm bật hơi (ㅋ, ㅌ, ㅍ, ㅊ); đọc và viết thành thạo 14 phụ âm cơ bản.', 38, 4, 'Published', 0, 0
    );
END
ELSE
BEGIN
    UPDATE dbo.Lessons
    SET Title = N'Phụ âm cơ bản 2: ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ',
        Subtitle = N'Hoàn thiện 14 phụ âm cơ bản và làm chủ nhóm phụ âm bật hơi (거센소리).',
        LearningObjective = N'Phân biệt rõ âm thường (ㄱ, ㄷ, ㅂ, ㅈ) và âm bật hơi (ㅋ, ㅌ, ㅍ, ㅊ); đọc và viết thành thạo 14 phụ âm cơ bản.',
        EstimatedMinutes = 38,
        UpdatedAt = SYSUTCDATETIME()
    WHERE LessonCode = N'HG_LESSON_04';
END
DECLARE @LessonId_HG_LESSON_04 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_04');

IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @LessonId_HG_LESSON_04)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@LessonId_HG_LESSON_04, 1, 1, 80, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_04_SEC_JAMO')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_04,
        N'HG_LESSON_04_SEC_JAMO',
        'jamo_cards',
        N'Bảng chữ cái & Phát âm tương tác',
        N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        N'[{"ko":"ㅇ","roman":"câm / -ng","vi":"아 · Đứng đầu âm tiết là âm câm; đứng cuối đọc là -ng"},{"ko":"ㅈ","roman":"j / ch · ji-eut","vi":"자 · Âm thường giống \"ch\" nhẹ trong tiếng Việt (자 - ja)"},{"ko":"ㅊ","roman":"ch'' (bật hơi)","vi":"차 · Âm bật hơi của ㅈ, đẩy luồng hơi mạnh (차 - cha)"},{"ko":"ㅋ","roman":"k'' (bật hơi)","vi":"카 · Âm bật hơi của ㄱ, bật hơi mạnh từ cuống họng (카 - ka)"},{"ko":"ㅌ","roman":"t'' (bật hơi)","vi":"타 · Âm bật hơi của ㄷ, bật hơi mạnh đầu lưỡi (타 - ta)"},{"ko":"ㅍ","roman":"p'' (bật hơi)","vi":"파 · Âm bật hơi của ㅂ, mím môi bật luồng hơi mạnh (파 - pa)"},{"ko":"ㅎ","roman":"h · hi-eut","vi":"하 · Âm xát họng nhẹ như âm \"h\" tiếng Việt (하 - ha)"}]',
        1,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET ExamplesJson = N'[{"ko":"ㅇ","roman":"câm / -ng","vi":"아 · Đứng đầu âm tiết là âm câm; đứng cuối đọc là -ng"},{"ko":"ㅈ","roman":"j / ch · ji-eut","vi":"자 · Âm thường giống \"ch\" nhẹ trong tiếng Việt (자 - ja)"},{"ko":"ㅊ","roman":"ch'' (bật hơi)","vi":"차 · Âm bật hơi của ㅈ, đẩy luồng hơi mạnh (차 - cha)"},{"ko":"ㅋ","roman":"k'' (bật hơi)","vi":"카 · Âm bật hơi của ㄱ, bật hơi mạnh từ cuống họng (카 - ka)"},{"ko":"ㅌ","roman":"t'' (bật hơi)","vi":"타 · Âm bật hơi của ㄷ, bật hơi mạnh đầu lưỡi (타 - ta)"},{"ko":"ㅍ","roman":"p'' (bật hơi)","vi":"파 · Âm bật hơi của ㅂ, mím môi bật luồng hơi mạnh (파 - pa)"},{"ko":"ㅎ","roman":"h · hi-eut","vi":"하 · Âm xát họng nhẹ như âm \"h\" tiếng Việt (하 - ha)"}]',
        ContentHtmlOrMd = N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        DisplayOrder = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_04_SEC_JAMO';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_04_SEC_THEORY')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_04,
        N'HG_LESSON_04_SEC_THEORY',
        'theory',
        N'Lý thuyết & Quy tắc phát âm trọng tâm',
        N'### 1. Bảng 7 phụ âm cơ bản 2 (gồm nhóm âm bật hơi)
| Phụ âm | Phiên âm | Đặc điểm phát âm | Ghép với ㅏ |
|---|---|---|---|
| **ㅇ** | **câm / -ng** | Đứng đầu âm tiết là âm câm; đứng cuối âm tiết (Patchim) đọc là **-ng** | **아** (a) |
| **ㅈ** | **j / ch** | Âm thường, vị trí lưỡi giống "ch" nhẹ trong tiếng Việt | **자** (ja) |
| **ㅊ** | **ch''** | **Âm bật hơi** của ㅈ: đẩy luồng hơi mạnh ra khỏi miệng | **차** (cha) |
| **ㅋ** | **k''** | **Âm bật hơi** của ㄱ: bật hơi mạnh từ cuống họng | **카** (ka) |
| **ㅌ** | **t''** | **Âm bật hơi** của ㄷ: bật hơi mạnh đầu lưỡi (như âm "th" bật hơi) | **타** (ta) |
| **ㅍ** | **p''** | **Âm bật hơi** của ㅂ: mím môi và bật luồng hơi mạnh | **파** (pa) |
| **ㅎ** | **h** | Âm xát họng nhẹ như âm "h" tiếng Việt | **하** (ha) |',
        N'[{"ko":"커피","roman":"keo-pi","vi":"Cà phê"},{"ko":"치마","roman":"chi-ma","vi":"Chân váy"},{"ko":"포도","roman":"po-do","vi":"Quả nho"}]',
        2,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET DisplayOrder = 2,
        ContentHtmlOrMd = N'### 1. Bảng 7 phụ âm cơ bản 2 (gồm nhóm âm bật hơi)
| Phụ âm | Phiên âm | Đặc điểm phát âm | Ghép với ㅏ |
|---|---|---|---|
| **ㅇ** | **câm / -ng** | Đứng đầu âm tiết là âm câm; đứng cuối âm tiết (Patchim) đọc là **-ng** | **아** (a) |
| **ㅈ** | **j / ch** | Âm thường, vị trí lưỡi giống "ch" nhẹ trong tiếng Việt | **자** (ja) |
| **ㅊ** | **ch''** | **Âm bật hơi** của ㅈ: đẩy luồng hơi mạnh ra khỏi miệng | **차** (cha) |
| **ㅋ** | **k''** | **Âm bật hơi** của ㄱ: bật hơi mạnh từ cuống họng | **카** (ka) |
| **ㅌ** | **t''** | **Âm bật hơi** của ㄷ: bật hơi mạnh đầu lưỡi (như âm "th" bật hơi) | **타** (ta) |
| **ㅍ** | **p''** | **Âm bật hơi** của ㅂ: mím môi và bật luồng hơi mạnh | **파** (pa) |
| **ㅎ** | **h** | Âm xát họng nhẹ như âm "h" tiếng Việt | **하** (ha) |',
        ExamplesJson = N'[{"ko":"커피","roman":"keo-pi","vi":"Cà phê"},{"ko":"치마","roman":"chi-ma","vi":"Chân váy"},{"ko":"포도","roman":"po-do","vi":"Quả nho"}]',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_04_SEC_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_04_RES_WRITE')
BEGIN
    INSERT INTO dbo.LessonResources (LessonId, ResourceCode, ResourceType, Title, Description, ResourceUrl, TargetCharsJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_04,
        N'HG_LESSON_04_RES_WRITE',
        'writing_sheet',
        N'Phiếu luyện viết ô ly & Mẫu chữ viết tay PE92 - Phụ âm cơ bản 2: ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ',
        N'Đối chiếu trực tiếp với mẫu chữ viết tay SQL Server (dbo.HangulCharacterClasses) và luyện viết trên bảng ô ly.',
        N'/ai?tab=handwriting',
        N'["자","차","카","타","파","하"]',
        1,
        'Published'
    );
END
DECLARE @ResId_HG_LESSON_04 INT = (SELECT TOP 1 ResourceId FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_04_RES_WRITE');


IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG04_01')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG04_01', N'커피', N'keo-pi', N'Cà phê', N'Danh từ',
        N'커피를 마셔요.', N'Tôi uống cà phê.', 'A', N'Nhập môn', N'Phụ âm cơ bản 2: ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG04_01 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG04_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_04 AND VocabId = @VocabId_VC_HG04_01)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_04, @VocabId_VC_HG04_01, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG04_02')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG04_02', N'치마', N'chi-ma', N'Chân váy', N'Danh từ',
        N'예쁜 치마를 샀어요.', N'Tôi đã mua chiếc váy đẹp.', 'A', N'Nhập môn', N'Phụ âm cơ bản 2: ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG04_02 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG04_02');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_04 AND VocabId = @VocabId_VC_HG04_02)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_04, @VocabId_VC_HG04_02, 2, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG04_03')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG04_03', N'포도', N'po-do', N'Quả nho', N'Danh từ',
        N'포도가 달아요.', N'Quả nho ngọt.', 'A', N'Nhập môn', N'Phụ âm cơ bản 2: ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG04_03 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG04_03');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_04 AND VocabId = @VocabId_VC_HG04_03)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_04, @VocabId_VC_HG04_03, 3, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG04_04')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG04_04', N'타조', N'ta-jo', N'Đà điểu', N'Danh từ',
        N'타조가 빨라요.', N'Đà điểu chạy nhanh.', 'A', N'Nhập môn', N'Phụ âm cơ bản 2: ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG04_04 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG04_04');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_04 AND VocabId = @VocabId_VC_HG04_04)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_04, @VocabId_VC_HG04_04, 4, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_04_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_04,
        N'HG_LESSON_04_FINAL_EX',
        'final_test',
        N'Bài kiểm tra cuối buổi — Phụ âm cơ bản 2: ㅇ ㅈ ㅊ ㅋ ㅌ ㅍ ㅎ',
        N'Hoàn thành đúng từ 80% trở lên để hoàn thành buổi học và mở khóa buổi tiếp theo.',
        80,
        300,
        1,
        'Published'
    );
END
DECLARE @ExId_HG_LESSON_04 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_04_FINAL_EX');


IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG04_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_04,
        N'Q_HG04_1',
        'multiple_choice',
        N'Nhóm 4 phụ âm nào sau đây đều thuộc nhóm phụ âm bật hơi (거센소리)?',
        N'ㅊ, ㅋ, ㅌ, ㅍ',
        N'ㅊ, ㅋ, ㅌ, ㅍ được tạo bằng cách thêm nét vào ㅈ, ㄱ, ㄷ, ㅂ để biểu thị luồng hơi bật mạnh.',
        20,
        1,
        'Published'
    );
END
DECLARE @QId_Q_HG04_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG04_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG04_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG04_1, N'A', N'ㄱ, ㄷ, ㅂ, ㅈ', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG04_1, N'B', N'ㅊ, ㅋ, ㅌ, ㅍ', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG04_1, N'C', N'ㄴ, ㄹ, ㅁ, ㅇ', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG04_1, N'D', N'ㅅ, ㅇ, ㅈ, ㅎ', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG04_2')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_04,
        N'Q_HG04_2',
        'multiple_choice',
        N'Từ "커피" (Cà phê) được tạo bởi hai phụ âm bật hơi nào?',
        N'커피',
        N'커 dùng phụ âm ㅋ (k''), 피 dùng phụ âm ㅍ (p'').',
        20,
        2,
        'Published'
    );
END
DECLARE @QId_Q_HG04_2 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG04_2');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG04_2)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG04_2, N'A', N'ㅋ và ㅍ', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG04_2, N'B', N'ㄱ và ㅂ', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG04_2, N'C', N'ㅊ và ㅌ', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG04_2, N'D', N'ㅋ và ㅎ', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG04_3')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_04,
        N'Q_HG04_3',
        'multiple_choice',
        N'Từ "포도" có nghĩa là gì?',
        N'포도 (po-do)',
        N'포도 (po-do) nghĩa là quả nho.',
        20,
        3,
        'Published'
    );
END
DECLARE @QId_Q_HG04_3 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG04_3');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG04_3)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG04_3, N'A', N'Chân váy', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG04_3, N'B', N'Quả nho', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG04_3, N'C', N'Đà điểu', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG04_3, N'D', N'Cà phê', 0, 4);
END

UPDATE dbo.LessonActivities
SET Status = 'Archived', IsRequired = 0
WHERE LessonId = @LessonId_HG_LESSON_04 AND ActivityCode = N'HG_LESSON_04_ACT_VOCAB';


IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_04_ACT_WARMUP')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_04, N'HG_LESSON_04_ACT_WARMUP', N'warmup_quiz', N'Kiểm tra đầu buổi', N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        1, NULL, NULL, 1, 10, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'warmup_quiz',
        Title = N'Kiểm tra đầu buổi',
        Description = N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        IsRequired = 1,
        DisplayOrder = 1,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_04_ACT_WARMUP';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_04_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_04, N'HG_LESSON_04_ACT_THEORY', N'theory', N'Học (7 chữ)', N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        1, NULL, NULL, 2, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'theory',
        Title = N'Học (7 chữ)',
        Description = N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        IsRequired = 1,
        DisplayOrder = 2,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_04_ACT_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_04_ACT_FLASHCARD')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_04, N'HG_LESSON_04_ACT_FLASHCARD', N'flashcard', N'Flashcard', N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        1, NULL, NULL, 3, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'flashcard',
        Title = N'Flashcard',
        Description = N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        IsRequired = 1,
        DisplayOrder = 3,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_04_ACT_FLASHCARD';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_04_ACT_PRACTICE')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_04, N'HG_LESSON_04_ACT_PRACTICE', N'practice_quiz', N'Trắc nghiệm', N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        1, NULL, NULL, 4, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'practice_quiz',
        Title = N'Trắc nghiệm',
        Description = N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        IsRequired = 1,
        DisplayOrder = 4,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_04_ACT_PRACTICE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_04_ACT_WRITING')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_04, N'HG_LESSON_04_ACT_WRITING', N'writing_sheet', N'Phiếu luyện viết', N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        1, NULL, @ResId_HG_LESSON_04, 5, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'writing_sheet',
        Title = N'Phiếu luyện viết',
        Description = N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        IsRequired = 1,
        DisplayOrder = 5,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_04_ACT_WRITING';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_04_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_04, N'HG_LESSON_04_ACT_QUIZ', N'final_test', N'Bài kiểm tra', N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        1, @ExId_HG_LESSON_04, NULL, 6, 50, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'final_test',
        Title = N'Bài kiểm tra',
        Description = N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        IsRequired = 1,
        DisplayOrder = 6,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_04_ACT_QUIZ';
END

DECLARE @TopicId_HG_LESSON_05 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_HG_2');
IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_05')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @TopicId_HG_LESSON_05, @Level0Id, N'HG_LESSON_05', 5, N'Phụ âm đôi (căng): ㄲ ㄸ ㅃ ㅆ ㅉ', N'Làm chủ 5 phụ âm căng (된소리) và phân biệt bộ 3 đối lập: Âm thường – Âm bật hơi – Âm căng.',
        N'Phát âm chuẩn xác 5 phụ âm đôi ㄲ, ㄸ, ㅃ, ㅆ, ㅉ; phân biệt rõ 3 sắc thái ㄱ-ㅋ-ㄲ, ㄷ-ㅌ-ㄸ, ㅂ-ㅍ-ㅃ, ㅈ-ㅊ-ㅉ.', 38, 5, 'Published', 0, 0
    );
END
ELSE
BEGIN
    UPDATE dbo.Lessons
    SET Title = N'Phụ âm đôi (căng): ㄲ ㄸ ㅃ ㅆ ㅉ',
        Subtitle = N'Làm chủ 5 phụ âm căng (된소리) và phân biệt bộ 3 đối lập: Âm thường – Âm bật hơi – Âm căng.',
        LearningObjective = N'Phát âm chuẩn xác 5 phụ âm đôi ㄲ, ㄸ, ㅃ, ㅆ, ㅉ; phân biệt rõ 3 sắc thái ㄱ-ㅋ-ㄲ, ㄷ-ㅌ-ㄸ, ㅂ-ㅍ-ㅃ, ㅈ-ㅊ-ㅉ.',
        EstimatedMinutes = 38,
        UpdatedAt = SYSUTCDATETIME()
    WHERE LessonCode = N'HG_LESSON_05';
END
DECLARE @LessonId_HG_LESSON_05 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_05');

IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @LessonId_HG_LESSON_05)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@LessonId_HG_LESSON_05, 1, 1, 80, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_05_SEC_JAMO')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_05,
        N'HG_LESSON_05_SEC_JAMO',
        'jamo_cards',
        N'Bảng chữ cái & Phát âm tương tác',
        N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        N'[{"ko":"ㄲ","roman":"kk (căng)","vi":"까 · Âm căng của ㄱ, phát âm dứt khoát không bật hơi (까 - kka)"},{"ko":"ㄸ","roman":"tt (căng)","vi":"따 · Âm căng của ㄷ, phát âm dứt khoát không bật hơi (따 - tta)"},{"ko":"ㅃ","roman":"pp (căng)","vi":"빠 · Âm căng của ㅂ, phát âm dứt khoát không bật hơi (빠 - ppa)"},{"ko":"ㅆ","roman":"ss (căng)","vi":"싸 · Âm căng của ㅅ, phát âm sắc và mạnh (싸 - ssa)"},{"ko":"ㅉ","roman":"jj (căng)","vi":"짜 · Âm căng của ㅈ, phát âm dứt khoát không bật hơi (짜 - jja)"}]',
        1,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET ExamplesJson = N'[{"ko":"ㄲ","roman":"kk (căng)","vi":"까 · Âm căng của ㄱ, phát âm dứt khoát không bật hơi (까 - kka)"},{"ko":"ㄸ","roman":"tt (căng)","vi":"따 · Âm căng của ㄷ, phát âm dứt khoát không bật hơi (따 - tta)"},{"ko":"ㅃ","roman":"pp (căng)","vi":"빠 · Âm căng của ㅂ, phát âm dứt khoát không bật hơi (빠 - ppa)"},{"ko":"ㅆ","roman":"ss (căng)","vi":"싸 · Âm căng của ㅅ, phát âm sắc và mạnh (싸 - ssa)"},{"ko":"ㅉ","roman":"jj (căng)","vi":"짜 · Âm căng của ㅈ, phát âm dứt khoát không bật hơi (짜 - jja)"}]',
        ContentHtmlOrMd = N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        DisplayOrder = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_05_SEC_JAMO';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_05_SEC_THEORY')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_05,
        N'HG_LESSON_05_SEC_THEORY',
        'theory',
        N'Lý thuyết & Quy tắc phát âm trọng tâm',
        N'### 1. Bảng 5 phụ âm đôi (쌍자음 - Âm căng)
Khi phát âm phụ âm đôi, căng dây thanh quản, nén hơi rồi phát âm dứt khoát, cao giọng, **không bật hơi**:
| Phụ âm đôi | Tên gọi | Phiên âm | Đối chiếu bộ 3 (Thường - Bật hơi - Căng) |
|---|---|---|---|
| **ㄲ** | 쌍기역 | **kk** | 가 (ga) — 카 (k''a) — **까** (kka) |
| **ㄸ** | 쌍디귿 | **tt** | 다 (da) — 타 (t''a) — **따** (tta) |
| **ㅃ** | 쌍비읍 | **pp** | 바 (ba) — 파 (p''a) — **빠** (ppa) |
| **ㅆ** | 쌍시옷 | **ss** | 사 (sa) — **싸** (ssa) |
| **ㅉ** | 쌍지읒 | **jj** | 자 (ja) — 차 (ch''a) — **짜** (jja) |',
        N'[{"ko":"토끼","roman":"to-kki","vi":"Con thỏ"},{"ko":"오빠","roman":"o-ppa","vi":"Anh trai (em gái gọi)"},{"ko":"아저씨","roman":"a-jeo-ssi","vi":"Chú, bác"}]',
        2,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET DisplayOrder = 2,
        ContentHtmlOrMd = N'### 1. Bảng 5 phụ âm đôi (쌍자음 - Âm căng)
Khi phát âm phụ âm đôi, căng dây thanh quản, nén hơi rồi phát âm dứt khoát, cao giọng, **không bật hơi**:
| Phụ âm đôi | Tên gọi | Phiên âm | Đối chiếu bộ 3 (Thường - Bật hơi - Căng) |
|---|---|---|---|
| **ㄲ** | 쌍기역 | **kk** | 가 (ga) — 카 (k''a) — **까** (kka) |
| **ㄸ** | 쌍디귿 | **tt** | 다 (da) — 타 (t''a) — **따** (tta) |
| **ㅃ** | 쌍비읍 | **pp** | 바 (ba) — 파 (p''a) — **빠** (ppa) |
| **ㅆ** | 쌍시옷 | **ss** | 사 (sa) — **싸** (ssa) |
| **ㅉ** | 쌍지읒 | **jj** | 자 (ja) — 차 (ch''a) — **짜** (jja) |',
        ExamplesJson = N'[{"ko":"토끼","roman":"to-kki","vi":"Con thỏ"},{"ko":"오빠","roman":"o-ppa","vi":"Anh trai (em gái gọi)"},{"ko":"아저씨","roman":"a-jeo-ssi","vi":"Chú, bác"}]',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_05_SEC_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_05_RES_WRITE')
BEGIN
    INSERT INTO dbo.LessonResources (LessonId, ResourceCode, ResourceType, Title, Description, ResourceUrl, TargetCharsJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_05,
        N'HG_LESSON_05_RES_WRITE',
        'writing_sheet',
        N'Phiếu luyện viết ô ly & Mẫu chữ viết tay PE92 - Phụ âm đôi (căng): ㄲ ㄸ ㅃ ㅆ ㅉ',
        N'Đối chiếu trực tiếp với mẫu chữ viết tay SQL Server (dbo.HangulCharacterClasses) và luyện viết trên bảng ô ly.',
        N'/ai?tab=handwriting',
        N'["까","따","빠","싸","짜"]',
        1,
        'Published'
    );
END
DECLARE @ResId_HG_LESSON_05 INT = (SELECT TOP 1 ResourceId FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_05_RES_WRITE');


IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG05_01')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG05_01', N'토끼', N'to-kki', N'Con thỏ', N'Danh từ',
        N'토끼가 귀여워요.', N'Con thỏ dễ thương.', 'A', N'Nhập môn', N'Phụ âm đôi (căng): ㄲ ㄸ ㅃ ㅆ ㅉ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG05_01 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG05_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_05 AND VocabId = @VocabId_VC_HG05_01)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_05, @VocabId_VC_HG05_01, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG05_02')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG05_02', N'오빠', N'o-ppa', N'Anh trai (em gái gọi)', N'Danh từ',
        N'우리 오빠는 대학생이에요.', N'Anh trai tôi là sinh viên đại học.', 'A', N'Nhập môn', N'Phụ âm đôi (căng): ㄲ ㄸ ㅃ ㅆ ㅉ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG05_02 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG05_02');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_05 AND VocabId = @VocabId_VC_HG05_02)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_05, @VocabId_VC_HG05_02, 2, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG05_03')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG05_03', N'아빠', N'a-ppa', N'Bố, ba', N'Danh từ',
        N'아빠 사랑해요.', N'Con yêu bố.', 'A', N'Nhập môn', N'Phụ âm đôi (căng): ㄲ ㄸ ㅃ ㅆ ㅉ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG05_03 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG05_03');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_05 AND VocabId = @VocabId_VC_HG05_03)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_05, @VocabId_VC_HG05_03, 3, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG05_04')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG05_04', N'쓰다', N'sseu-da', N'Viết / Đắng / Đội (mũ)', N'Động từ',
        N'한글을 써요.', N'Tôi viết chữ Hangeul.', 'A', N'Nhập môn', N'Phụ âm đôi (căng): ㄲ ㄸ ㅃ ㅆ ㅉ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG05_04 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG05_04');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_05 AND VocabId = @VocabId_VC_HG05_04)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_05, @VocabId_VC_HG05_04, 4, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_05_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_05,
        N'HG_LESSON_05_FINAL_EX',
        'final_test',
        N'Bài kiểm tra cuối buổi — Phụ âm đôi (căng): ㄲ ㄸ ㅃ ㅆ ㅉ',
        N'Hoàn thành đúng từ 80% trở lên để hoàn thành buổi học và mở khóa buổi tiếp theo.',
        80,
        300,
        1,
        'Published'
    );
END
DECLARE @ExId_HG_LESSON_05 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_05_FINAL_EX');


IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG05_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_05,
        N'Q_HG05_1',
        'multiple_choice',
        N'Đặc điểm quan trọng nhất khi phát âm 5 phụ âm đôi (ㄲ, ㄸ, ㅃ, ㅆ, ㅉ) là gì?',
        N'ㄲ, ㄸ, ㅃ, ㅆ, ㅉ',
        N'Phụ âm đôi là âm căng (된소리): căng thanh quản, phát âm dứt khoát, cao giọng và không bật hơi.',
        20,
        1,
        'Published'
    );
END
DECLARE @QId_Q_HG05_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG05_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG05_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG05_1, N'A', N'Căng thanh quản, phát âm dứt khoát và không bật hơi', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG05_1, N'B', N'Đẩy luồng hơi thật mạnh ra ngoài môi', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG05_1, N'C', N'Đọc hoàn toàn giống phụ âm đơn', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG05_1, N'D', N'Không phát âm khi đứng đầu từ', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG05_2')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_05,
        N'Q_HG05_2',
        'multiple_choice',
        N'Từ nào sau đây có nghĩa là "Con thỏ"?',
        N'토끼',
        N'토끼 (to-kki) có nghĩa là con thỏ.',
        20,
        2,
        'Published'
    );
END
DECLARE @QId_Q_HG05_2 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG05_2');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG05_2)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG05_2, N'A', N'오빠', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG05_2, N'B', N'토끼', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG05_2, N'C', N'아빠', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG05_2, N'D', N'치마', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG05_3')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_05,
        N'Q_HG05_3',
        'multiple_choice',
        N'Trong từ "오빠" (Anh trai), âm tiết thứ hai sử dụng phụ âm đôi nào?',
        N'빠 (ㅃ + ㅏ)',
        N'빠 được tạo từ phụ âm đôi ㅃ (쌍비읍) ghép với nguyên âm ㅏ.',
        20,
        3,
        'Published'
    );
END
DECLARE @QId_Q_HG05_3 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG05_3');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG05_3)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG05_3, N'A', N'ㄲ', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG05_3, N'B', N'ㄸ', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG05_3, N'C', N'ㅃ', 1, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG05_3, N'D', N'ㅉ', 0, 4);
END

UPDATE dbo.LessonActivities
SET Status = 'Archived', IsRequired = 0
WHERE LessonId = @LessonId_HG_LESSON_05 AND ActivityCode = N'HG_LESSON_05_ACT_VOCAB';


IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_05_ACT_WARMUP')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_05, N'HG_LESSON_05_ACT_WARMUP', N'warmup_quiz', N'Kiểm tra đầu buổi', N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        1, NULL, NULL, 1, 10, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'warmup_quiz',
        Title = N'Kiểm tra đầu buổi',
        Description = N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        IsRequired = 1,
        DisplayOrder = 1,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_05_ACT_WARMUP';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_05_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_05, N'HG_LESSON_05_ACT_THEORY', N'theory', N'Học (5 chữ)', N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        1, NULL, NULL, 2, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'theory',
        Title = N'Học (5 chữ)',
        Description = N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        IsRequired = 1,
        DisplayOrder = 2,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_05_ACT_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_05_ACT_FLASHCARD')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_05, N'HG_LESSON_05_ACT_FLASHCARD', N'flashcard', N'Flashcard', N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        1, NULL, NULL, 3, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'flashcard',
        Title = N'Flashcard',
        Description = N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        IsRequired = 1,
        DisplayOrder = 3,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_05_ACT_FLASHCARD';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_05_ACT_PRACTICE')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_05, N'HG_LESSON_05_ACT_PRACTICE', N'practice_quiz', N'Trắc nghiệm', N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        1, NULL, NULL, 4, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'practice_quiz',
        Title = N'Trắc nghiệm',
        Description = N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        IsRequired = 1,
        DisplayOrder = 4,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_05_ACT_PRACTICE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_05_ACT_WRITING')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_05, N'HG_LESSON_05_ACT_WRITING', N'writing_sheet', N'Phiếu luyện viết', N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        1, NULL, @ResId_HG_LESSON_05, 5, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'writing_sheet',
        Title = N'Phiếu luyện viết',
        Description = N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        IsRequired = 1,
        DisplayOrder = 5,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_05_ACT_WRITING';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_05_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_05, N'HG_LESSON_05_ACT_QUIZ', N'final_test', N'Bài kiểm tra', N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        1, @ExId_HG_LESSON_05, NULL, 6, 50, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'final_test',
        Title = N'Bài kiểm tra',
        Description = N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        IsRequired = 1,
        DisplayOrder = 6,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_05_ACT_QUIZ';
END

DECLARE @TopicId_HG_LESSON_06 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_HG_3');
IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_06')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @TopicId_HG_LESSON_06, @Level0Id, N'HG_LESSON_06', 6, N'Nguyên âm đôi 1: ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ', N'Nhóm 6 nguyên âm ghép đầu tiên và cách kết hợp nguyên âm ngang + dọc.',
        N'Nhận diện, phát âm và viết đúng thứ tự nét 6 nguyên âm đôi ㅐ, ㅒ, ㅔ, ㅖ, ㅘ, ㅙ.', 38, 6, 'Published', 0, 0
    );
END
ELSE
BEGIN
    UPDATE dbo.Lessons
    SET Title = N'Nguyên âm đôi 1: ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ',
        Subtitle = N'Nhóm 6 nguyên âm ghép đầu tiên và cách kết hợp nguyên âm ngang + dọc.',
        LearningObjective = N'Nhận diện, phát âm và viết đúng thứ tự nét 6 nguyên âm đôi ㅐ, ㅒ, ㅔ, ㅖ, ㅘ, ㅙ.',
        EstimatedMinutes = 38,
        UpdatedAt = SYSUTCDATETIME()
    WHERE LessonCode = N'HG_LESSON_06';
END
DECLARE @LessonId_HG_LESSON_06 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_06');

IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @LessonId_HG_LESSON_06)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@LessonId_HG_LESSON_06, 1, 1, 80, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_06_SEC_JAMO')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_06,
        N'HG_LESSON_06_SEC_JAMO',
        'jamo_cards',
        N'Bảng chữ cái & Phát âm tương tác',
        N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        N'[{"ko":"ㅐ","roman":"ae · e","vi":"애 · ㅏ + ㅣ -> phát âm như \"e\" mở miệng hơi rộng"},{"ko":"ㅒ","roman":"yae · ye","vi":"얘 · ㅑ + ㅣ -> phát âm nhanh \"ye\""},{"ko":"ㅔ","roman":"e · ê","vi":"에 · ㅓ + ㅣ -> phát âm gần giống \"ê\" tiếng Việt"},{"ko":"ㅖ","roman":"ye · yê","vi":"예 · ㅕ + ㅣ -> phát âm là \"yê\""},{"ko":"ㅘ","roman":"wa · oa","vi":"와 · ㅗ + ㅏ -> tròn môi \"ô\" mở sang \"a\" thành \"wa/oa\""},{"ko":"ㅙ","roman":"wae · uê","vi":"왜 · ㅗ + ㅐ -> tròn môi mở sang \"e\" thành \"wae\""}]',
        1,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET ExamplesJson = N'[{"ko":"ㅐ","roman":"ae · e","vi":"애 · ㅏ + ㅣ -> phát âm như \"e\" mở miệng hơi rộng"},{"ko":"ㅒ","roman":"yae · ye","vi":"얘 · ㅑ + ㅣ -> phát âm nhanh \"ye\""},{"ko":"ㅔ","roman":"e · ê","vi":"에 · ㅓ + ㅣ -> phát âm gần giống \"ê\" tiếng Việt"},{"ko":"ㅖ","roman":"ye · yê","vi":"예 · ㅕ + ㅣ -> phát âm là \"yê\""},{"ko":"ㅘ","roman":"wa · oa","vi":"와 · ㅗ + ㅏ -> tròn môi \"ô\" mở sang \"a\" thành \"wa/oa\""},{"ko":"ㅙ","roman":"wae · uê","vi":"왜 · ㅗ + ㅐ -> tròn môi mở sang \"e\" thành \"wae\""}]',
        ContentHtmlOrMd = N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        DisplayOrder = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_06_SEC_JAMO';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_06_SEC_THEORY')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_06,
        N'HG_LESSON_06_SEC_THEORY',
        'theory',
        N'Lý thuyết & Quy tắc phát âm trọng tâm',
        N'### 1. Bảng 6 nguyên âm đôi 1
| Nguyên âm đôi | Cấu tạo | Phiên âm | Cách phát âm & Lưu ý |
|---|---|---|---|
| **ㅐ** | ㅏ + ㅣ | **ae** | Mở miệng rộng hơn "ê", phát âm như "e" trong tiếng Việt |
| **ㅒ** | ㅑ + ㅣ | **yae** | Phát âm nhanh từ "i" sang "e" -> "ye" |
| **ㅔ** | ㅓ + ㅣ | **e** | Khẩu hình hẹp hơn ㅐ, phát âm gần giống "ê" (trong giao tiếp hiện đại ㅐ và ㅔ phát âm rất gần nhau) |
| **ㅖ** | ㅕ + ㅣ | **ye** | Phát âm là "yê"; khi ghép với phụ âm khác ㅇ/ㅎ thường đọc như ㅔ (예: 시계 [시게]) |
| **ㅘ** | ㅗ + ㅏ | **wa** | Tròn môi "ô" rồi mở sang "a" -> "wa" (예: 과일 - hoa quả) |
| **ㅙ** | ㅗ + ㅐ | **wae** | Tròn môi "ô" rồi mở sang "e" -> "we" (예: 왜 - tại sao) |',
        N'[{"ko":"시계","roman":"si-gye","vi":"Đồng hồ"},{"ko":"과자","roman":"gwa-ja","vi":"Bánh kẹo, snack"},{"ko":"왜요","roman":"wae-yo","vi":"Tại sao vậy ạ?"}]',
        2,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET DisplayOrder = 2,
        ContentHtmlOrMd = N'### 1. Bảng 6 nguyên âm đôi 1
| Nguyên âm đôi | Cấu tạo | Phiên âm | Cách phát âm & Lưu ý |
|---|---|---|---|
| **ㅐ** | ㅏ + ㅣ | **ae** | Mở miệng rộng hơn "ê", phát âm như "e" trong tiếng Việt |
| **ㅒ** | ㅑ + ㅣ | **yae** | Phát âm nhanh từ "i" sang "e" -> "ye" |
| **ㅔ** | ㅓ + ㅣ | **e** | Khẩu hình hẹp hơn ㅐ, phát âm gần giống "ê" (trong giao tiếp hiện đại ㅐ và ㅔ phát âm rất gần nhau) |
| **ㅖ** | ㅕ + ㅣ | **ye** | Phát âm là "yê"; khi ghép với phụ âm khác ㅇ/ㅎ thường đọc như ㅔ (예: 시계 [시게]) |
| **ㅘ** | ㅗ + ㅏ | **wa** | Tròn môi "ô" rồi mở sang "a" -> "wa" (예: 과일 - hoa quả) |
| **ㅙ** | ㅗ + ㅐ | **wae** | Tròn môi "ô" rồi mở sang "e" -> "we" (예: 왜 - tại sao) |',
        ExamplesJson = N'[{"ko":"시계","roman":"si-gye","vi":"Đồng hồ"},{"ko":"과자","roman":"gwa-ja","vi":"Bánh kẹo, snack"},{"ko":"왜요","roman":"wae-yo","vi":"Tại sao vậy ạ?"}]',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_06_SEC_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_06_RES_WRITE')
BEGIN
    INSERT INTO dbo.LessonResources (LessonId, ResourceCode, ResourceType, Title, Description, ResourceUrl, TargetCharsJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_06,
        N'HG_LESSON_06_RES_WRITE',
        'writing_sheet',
        N'Phiếu luyện viết ô ly & Mẫu chữ viết tay PE92 - Nguyên âm đôi 1: ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ',
        N'Đối chiếu trực tiếp với mẫu chữ viết tay SQL Server (dbo.HangulCharacterClasses) và luyện viết trên bảng ô ly.',
        N'/ai?tab=handwriting',
        N'["개","네","과"]',
        1,
        'Published'
    );
END
DECLARE @ResId_HG_LESSON_06 INT = (SELECT TOP 1 ResourceId FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_06_RES_WRITE');


IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG06_01')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG06_01', N'시계', N'si-gye', N'Đồng hồ', N'Danh từ',
        N'시계를 봐요.', N'Tôi xem đồng hồ.', 'A', N'Nhập môn', N'Nguyên âm đôi 1: ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG06_01 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG06_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_06 AND VocabId = @VocabId_VC_HG06_01)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_06, @VocabId_VC_HG06_01, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG06_02')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG06_02', N'과자', N'gwa-ja', N'Bánh quy, snack', N'Danh từ',
        N'과자를 먹어요.', N'Tôi ăn bánh.', 'A', N'Nhập môn', N'Nguyên âm đôi 1: ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG06_02 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG06_02');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_06 AND VocabId = @VocabId_VC_HG06_02)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_06, @VocabId_VC_HG06_02, 2, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG06_03')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG06_03', N'세계', N'se-gye', N'Thế giới', N'Danh từ',
        N'세계 여행을 해요.', N'Tôi đi du lịch thế giới.', 'A', N'Nhập môn', N'Nguyên âm đôi 1: ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG06_03 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG06_03');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_06 AND VocabId = @VocabId_VC_HG06_03)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_06, @VocabId_VC_HG06_03, 3, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG06_04')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG06_04', N'왜', N'wae', N'Tại sao', N'Phó từ',
        N'왜 안 가요?', N'Tại sao bạn không đi?', 'A', N'Nhập môn', N'Nguyên âm đôi 1: ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG06_04 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG06_04');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_06 AND VocabId = @VocabId_VC_HG06_04)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_06, @VocabId_VC_HG06_04, 4, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_06_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_06,
        N'HG_LESSON_06_FINAL_EX',
        'final_test',
        N'Bài kiểm tra cuối buổi — Nguyên âm đôi 1: ㅐ ㅒ ㅔ ㅖ ㅘ ㅙ',
        N'Hoàn thành đúng từ 80% trở lên để hoàn thành buổi học và mở khóa buổi tiếp theo.',
        80,
        300,
        1,
        'Published'
    );
END
DECLARE @ExId_HG_LESSON_06 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_06_FINAL_EX');


IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG06_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_06,
        N'Q_HG06_1',
        'multiple_choice',
        N'Nguyên âm đôi "ㅘ" được ghép từ hai nguyên âm đơn nào?',
        N'ㅘ (와)',
        N'ㅘ được ghép từ nguyên âm ngang ㅗ và nguyên âm dọc ㅏ (ㅗ + ㅏ = ㅘ).',
        20,
        1,
        'Published'
    );
END
DECLARE @QId_Q_HG06_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG06_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG06_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG06_1, N'A', N'ㅗ + ㅏ', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG06_1, N'B', N'ㅜ + ㅓ', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG06_1, N'C', N'ㅗ + ㅣ', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG06_1, N'D', N'ㅡ + ㅣ', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG06_2')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_06,
        N'Q_HG06_2',
        'multiple_choice',
        N'Từ "시계" có nghĩa tiếng Việt là gì?',
        N'시계 (si-gye)',
        N'시계 có nghĩa là chiếc đồng hồ.',
        20,
        2,
        'Published'
    );
END
DECLARE @QId_Q_HG06_2 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG06_2');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG06_2)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG06_2, N'A', N'Bánh kẹo', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG06_2, N'B', N'Đồng hồ', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG06_2, N'C', N'Thế giới', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG06_2, N'D', N'Quả táo', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG06_3')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_06,
        N'Q_HG06_3',
        'multiple_choice',
        N'Từ để hỏi "왜" (Tại sao) sử dụng nguyên âm đôi nào?',
        N'왜 (ㅇ + ㅙ)',
        N'왜 được tạo từ phụ âm ㅇ ghép với nguyên âm đôi ㅙ (ㅗ + ㅐ).',
        20,
        3,
        'Published'
    );
END
DECLARE @QId_Q_HG06_3 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG06_3');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG06_3)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG06_3, N'A', N'ㅘ', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG06_3, N'B', N'ㅙ', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG06_3, N'C', N'ㅐ', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG06_3, N'D', N'ㅖ', 0, 4);
END

UPDATE dbo.LessonActivities
SET Status = 'Archived', IsRequired = 0
WHERE LessonId = @LessonId_HG_LESSON_06 AND ActivityCode = N'HG_LESSON_06_ACT_VOCAB';


IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_06_ACT_WARMUP')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_06, N'HG_LESSON_06_ACT_WARMUP', N'warmup_quiz', N'Kiểm tra đầu buổi', N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        1, NULL, NULL, 1, 10, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'warmup_quiz',
        Title = N'Kiểm tra đầu buổi',
        Description = N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        IsRequired = 1,
        DisplayOrder = 1,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_06_ACT_WARMUP';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_06_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_06, N'HG_LESSON_06_ACT_THEORY', N'theory', N'Học (6 chữ)', N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        1, NULL, NULL, 2, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'theory',
        Title = N'Học (6 chữ)',
        Description = N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        IsRequired = 1,
        DisplayOrder = 2,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_06_ACT_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_06_ACT_FLASHCARD')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_06, N'HG_LESSON_06_ACT_FLASHCARD', N'flashcard', N'Flashcard', N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        1, NULL, NULL, 3, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'flashcard',
        Title = N'Flashcard',
        Description = N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        IsRequired = 1,
        DisplayOrder = 3,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_06_ACT_FLASHCARD';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_06_ACT_PRACTICE')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_06, N'HG_LESSON_06_ACT_PRACTICE', N'practice_quiz', N'Trắc nghiệm', N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        1, NULL, NULL, 4, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'practice_quiz',
        Title = N'Trắc nghiệm',
        Description = N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        IsRequired = 1,
        DisplayOrder = 4,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_06_ACT_PRACTICE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_06_ACT_WRITING')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_06, N'HG_LESSON_06_ACT_WRITING', N'writing_sheet', N'Phiếu luyện viết', N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        1, NULL, @ResId_HG_LESSON_06, 5, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'writing_sheet',
        Title = N'Phiếu luyện viết',
        Description = N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        IsRequired = 1,
        DisplayOrder = 5,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_06_ACT_WRITING';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_06_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_06, N'HG_LESSON_06_ACT_QUIZ', N'final_test', N'Bài kiểm tra', N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        1, @ExId_HG_LESSON_06, NULL, 6, 50, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'final_test',
        Title = N'Bài kiểm tra',
        Description = N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        IsRequired = 1,
        DisplayOrder = 6,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_06_ACT_QUIZ';
END

DECLARE @TopicId_HG_LESSON_07 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_HG_3');
IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_07')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @TopicId_HG_LESSON_07, @Level0Id, N'HG_LESSON_07', 7, N'Nguyên âm đôi 2: ㅚ ㅝ ㅞ ㅟ ㅢ', N'Hoàn tất 11 nguyên âm đôi và nắm vững 3 cách phát âm đặc biệt của nguyên âm ㅢ.',
        N'Đọc và viết chuẩn 5 nguyên âm đôi ㅚ, ㅝ, ㅞ, ㅟ, ㅢ; áp dụng đúng quy tắc phát âm ㅢ theo vị trí trong từ.', 38, 7, 'Published', 0, 0
    );
END
ELSE
BEGIN
    UPDATE dbo.Lessons
    SET Title = N'Nguyên âm đôi 2: ㅚ ㅝ ㅞ ㅟ ㅢ',
        Subtitle = N'Hoàn tất 11 nguyên âm đôi và nắm vững 3 cách phát âm đặc biệt của nguyên âm ㅢ.',
        LearningObjective = N'Đọc và viết chuẩn 5 nguyên âm đôi ㅚ, ㅝ, ㅞ, ㅟ, ㅢ; áp dụng đúng quy tắc phát âm ㅢ theo vị trí trong từ.',
        EstimatedMinutes = 38,
        UpdatedAt = SYSUTCDATETIME()
    WHERE LessonCode = N'HG_LESSON_07';
END
DECLARE @LessonId_HG_LESSON_07 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_07');

IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @LessonId_HG_LESSON_07)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@LessonId_HG_LESSON_07, 1, 1, 80, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_07_SEC_JAMO')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_07,
        N'HG_LESSON_07_SEC_JAMO',
        'jamo_cards',
        N'Bảng chữ cái & Phát âm tương tác',
        N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        N'[{"ko":"ㅚ","roman":"oe · we","vi":"외 · ㅗ + ㅣ -> phát âm giống \"we\" [웨]"},{"ko":"ㅝ","roman":"wo · uơ","vi":"워 · ㅜ + ㅓ -> chu môi \"u\" mở sang \"ơ\" thành \"wo/uơ\""},{"ko":"ㅞ","roman":"we · uê","vi":"웨 · ㅜ + ㅔ -> chu môi \"u\" mở sang \"ê\" thành \"we/uê\""},{"ko":"ㅟ","roman":"wi · uy","vi":"위 · ㅜ + ㅣ -> chu môi \"u\" kéo sang \"i\" thành \"wi/uy\""},{"ko":"ㅢ","roman":"ui · ưi / i / e","vi":"의 · ㅡ + ㅣ -> đầu từ đọc \"ưi\", sau phụ âm đọc \"i\", sở hữu đọc \"e\""}]',
        1,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET ExamplesJson = N'[{"ko":"ㅚ","roman":"oe · we","vi":"외 · ㅗ + ㅣ -> phát âm giống \"we\" [웨]"},{"ko":"ㅝ","roman":"wo · uơ","vi":"워 · ㅜ + ㅓ -> chu môi \"u\" mở sang \"ơ\" thành \"wo/uơ\""},{"ko":"ㅞ","roman":"we · uê","vi":"웨 · ㅜ + ㅔ -> chu môi \"u\" mở sang \"ê\" thành \"we/uê\""},{"ko":"ㅟ","roman":"wi · uy","vi":"위 · ㅜ + ㅣ -> chu môi \"u\" kéo sang \"i\" thành \"wi/uy\""},{"ko":"ㅢ","roman":"ui · ưi / i / e","vi":"의 · ㅡ + ㅣ -> đầu từ đọc \"ưi\", sau phụ âm đọc \"i\", sở hữu đọc \"e\""}]',
        ContentHtmlOrMd = N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        DisplayOrder = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_07_SEC_JAMO';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_07_SEC_THEORY')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_07,
        N'HG_LESSON_07_SEC_THEORY',
        'theory',
        N'Lý thuyết & Quy tắc phát âm trọng tâm',
        N'### 1. Bảng 5 nguyên âm đôi 2
| Nguyên âm đôi | Cấu tạo | Phiên âm | Cách phát âm |
|---|---|---|---|
| **ㅚ** | ㅗ + ㅣ | **oe (we)** | Phát âm giống "we" [웨] |
| **ㅝ** | ㅜ + ㅓ | **wo** | Chu môi "u" rồi mở sang "ơ" -> "uơ / wo" |
| **ㅞ** | ㅜ + ㅔ | **we** | Chu môi "u" rồi mở sang "ê" -> "uê / we" |
| **ㅟ** | ㅜ + ㅣ | **wi** | Chu môi "u" rồi kéo sang "i" -> "uy / wi" |
| **ㅢ** | ㅡ + ㅣ | **ui / i / e** | Xem 3 quy tắc phát âm đặc biệt bên dưới |

### 2. Ba quy tắc phát âm của nguyên âm ㅢ
1. **Đứng đầu từ (không có phụ âm đầu)**: Đọc nguyên bản **[의 - ưi]** (예: 의사 -> [의사] Bác sĩ).
2. **Đứng sau phụ âm (khác ㅇ) hoặc đứng ở âm tiết thứ 2 trở đi**: Đọc thành **[이 - i]** (예: 회의 -> [회이] Cuộc họp; 희망 -> [히망] Hy vọng).
3. **Làm tiểu từ sở hữu (của)**: Đọc thành **[에 - e]** (예: 나의 꿈 -> [나에 꿈] Ước mơ của tôi).',
        N'[{"ko":"의사","roman":"ui-sa","vi":"Bác sĩ"},{"ko":"의자","roman":"ui-ja","vi":"Cái ghế"},{"ko":"귀","roman":"gwi","vi":"Đôi tai"}]',
        2,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET DisplayOrder = 2,
        ContentHtmlOrMd = N'### 1. Bảng 5 nguyên âm đôi 2
| Nguyên âm đôi | Cấu tạo | Phiên âm | Cách phát âm |
|---|---|---|---|
| **ㅚ** | ㅗ + ㅣ | **oe (we)** | Phát âm giống "we" [웨] |
| **ㅝ** | ㅜ + ㅓ | **wo** | Chu môi "u" rồi mở sang "ơ" -> "uơ / wo" |
| **ㅞ** | ㅜ + ㅔ | **we** | Chu môi "u" rồi mở sang "ê" -> "uê / we" |
| **ㅟ** | ㅜ + ㅣ | **wi** | Chu môi "u" rồi kéo sang "i" -> "uy / wi" |
| **ㅢ** | ㅡ + ㅣ | **ui / i / e** | Xem 3 quy tắc phát âm đặc biệt bên dưới |

### 2. Ba quy tắc phát âm của nguyên âm ㅢ
1. **Đứng đầu từ (không có phụ âm đầu)**: Đọc nguyên bản **[의 - ưi]** (예: 의사 -> [의사] Bác sĩ).
2. **Đứng sau phụ âm (khác ㅇ) hoặc đứng ở âm tiết thứ 2 trở đi**: Đọc thành **[이 - i]** (예: 회의 -> [회이] Cuộc họp; 희망 -> [히망] Hy vọng).
3. **Làm tiểu từ sở hữu (của)**: Đọc thành **[에 - e]** (예: 나의 꿈 -> [나에 꿈] Ước mơ của tôi).',
        ExamplesJson = N'[{"ko":"의사","roman":"ui-sa","vi":"Bác sĩ"},{"ko":"의자","roman":"ui-ja","vi":"Cái ghế"},{"ko":"귀","roman":"gwi","vi":"Đôi tai"}]',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_07_SEC_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_07_RES_WRITE')
BEGIN
    INSERT INTO dbo.LessonResources (LessonId, ResourceCode, ResourceType, Title, Description, ResourceUrl, TargetCharsJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_07,
        N'HG_LESSON_07_RES_WRITE',
        'writing_sheet',
        N'Phiếu luyện viết ô ly & Mẫu chữ viết tay PE92 - Nguyên âm đôi 2: ㅚ ㅝ ㅞ ㅟ ㅢ',
        N'Đối chiếu trực tiếp với mẫu chữ viết tay SQL Server (dbo.HangulCharacterClasses) và luyện viết trên bảng ô ly.',
        N'/ai?tab=handwriting',
        N'["외","워","위","의"]',
        1,
        'Published'
    );
END
DECLARE @ResId_HG_LESSON_07 INT = (SELECT TOP 1 ResourceId FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_07_RES_WRITE');


IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG07_01')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG07_01', N'의사', N'ui-sa', N'Bác sĩ', N'Danh từ',
        N'언니는 의사예요.', N'Chị gái tôi là bác sĩ.', 'A', N'Nhập môn', N'Nguyên âm đôi 2: ㅚ ㅝ ㅞ ㅟ ㅢ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG07_01 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG07_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_07 AND VocabId = @VocabId_VC_HG07_01)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_07, @VocabId_VC_HG07_01, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG07_02')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG07_02', N'의자', N'ui-ja', N'Cái ghế', N'Danh từ',
        N'의자에 앉으세요.', N'Xin mời ngồi xuống ghế.', 'A', N'Nhập môn', N'Nguyên âm đôi 2: ㅚ ㅝ ㅞ ㅟ ㅢ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG07_02 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG07_02');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_07 AND VocabId = @VocabId_VC_HG07_02)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_07, @VocabId_VC_HG07_02, 2, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG07_03')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG07_03', N'회사', N'hoe-sa', N'Công ty', N'Danh từ',
        N'회사에 가요.', N'Tôi đi đến công ty.', 'A', N'Nhập môn', N'Nguyên âm đôi 2: ㅚ ㅝ ㅞ ㅟ ㅢ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG07_03 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG07_03');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_07 AND VocabId = @VocabId_VC_HG07_03)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_07, @VocabId_VC_HG07_03, 3, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG07_04')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG07_04', N'위', N'wi', N'Phía trên / Dạ dày', N'Danh từ',
        N'책상 위에 있어요.', N'Nó ở phía trên bàn học.', 'A', N'Nhập môn', N'Nguyên âm đôi 2: ㅚ ㅝ ㅞ ㅟ ㅢ', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG07_04 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG07_04');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_07 AND VocabId = @VocabId_VC_HG07_04)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_07, @VocabId_VC_HG07_04, 4, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_07_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_07,
        N'HG_LESSON_07_FINAL_EX',
        'final_test',
        N'Bài kiểm tra cuối buổi — Nguyên âm đôi 2: ㅚ ㅝ ㅞ ㅟ ㅢ',
        N'Hoàn thành đúng từ 80% trở lên để hoàn thành buổi học và mở khóa buổi tiếp theo.',
        80,
        300,
        1,
        'Published'
    );
END
DECLARE @ExId_HG_LESSON_07 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_07_FINAL_EX');


IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG07_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_07,
        N'Q_HG07_1',
        'multiple_choice',
        N'Khi "의" được dùng làm tiểu từ sở hữu (ví dụ: 나의 가방 - cặp của tôi), "의" thường được phát âm thành âm gì?',
        N'나의 가방 -> [나에 가방]',
        N'Theo quy tắc chuẩn phát âm tiếng Hàn, tiểu từ sở hữu 의 được phép phát âm là [에].',
        20,
        1,
        'Published'
    );
END
DECLARE @QId_Q_HG07_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG07_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG07_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG07_1, N'A', N'Phát âm là [에]', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG07_1, N'B', N'Phát âm là [오]', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG07_1, N'C', N'Phát âm là [우]', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG07_1, N'D', N'Phát âm là [와]', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG07_2')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_07,
        N'Q_HG07_2',
        'multiple_choice',
        N'Từ nào sau đây có nghĩa là "Bác sĩ"?',
        N'의사',
        N'의사 (ui-sa) nghĩa là bác sĩ; 의자 (ui-ja) nghĩa là cái ghế.',
        20,
        2,
        'Published'
    );
END
DECLARE @QId_Q_HG07_2 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG07_2');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG07_2)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG07_2, N'A', N'의자', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG07_2, N'B', N'의사', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG07_2, N'C', N'회사', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG07_2, N'D', N'과자', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG07_3')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_07,
        N'Q_HG07_3',
        'multiple_choice',
        N'Nguyên âm đôi "ㅝ" được ghép từ hai nguyên âm đơn nào?',
        N'ㅝ (워)',
        N'ㅝ được tạo từ nguyên âm ngang ㅜ ghép với nguyên âm dọc ㅓ.',
        20,
        3,
        'Published'
    );
END
DECLARE @QId_Q_HG07_3 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG07_3');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG07_3)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG07_3, N'A', N'ㅗ + ㅏ', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG07_3, N'B', N'ㅜ + ㅓ', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG07_3, N'C', N'ㅜ + ㅣ', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG07_3, N'D', N'ㅡ + ㅣ', 0, 4);
END

UPDATE dbo.LessonActivities
SET Status = 'Archived', IsRequired = 0
WHERE LessonId = @LessonId_HG_LESSON_07 AND ActivityCode = N'HG_LESSON_07_ACT_VOCAB';


IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_07_ACT_WARMUP')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_07, N'HG_LESSON_07_ACT_WARMUP', N'warmup_quiz', N'Kiểm tra đầu buổi', N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        1, NULL, NULL, 1, 10, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'warmup_quiz',
        Title = N'Kiểm tra đầu buổi',
        Description = N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        IsRequired = 1,
        DisplayOrder = 1,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_07_ACT_WARMUP';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_07_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_07, N'HG_LESSON_07_ACT_THEORY', N'theory', N'Học (5 chữ)', N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        1, NULL, NULL, 2, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'theory',
        Title = N'Học (5 chữ)',
        Description = N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        IsRequired = 1,
        DisplayOrder = 2,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_07_ACT_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_07_ACT_FLASHCARD')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_07, N'HG_LESSON_07_ACT_FLASHCARD', N'flashcard', N'Flashcard', N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        1, NULL, NULL, 3, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'flashcard',
        Title = N'Flashcard',
        Description = N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        IsRequired = 1,
        DisplayOrder = 3,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_07_ACT_FLASHCARD';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_07_ACT_PRACTICE')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_07, N'HG_LESSON_07_ACT_PRACTICE', N'practice_quiz', N'Trắc nghiệm', N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        1, NULL, NULL, 4, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'practice_quiz',
        Title = N'Trắc nghiệm',
        Description = N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        IsRequired = 1,
        DisplayOrder = 4,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_07_ACT_PRACTICE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_07_ACT_WRITING')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_07, N'HG_LESSON_07_ACT_WRITING', N'writing_sheet', N'Phiếu luyện viết', N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        1, NULL, @ResId_HG_LESSON_07, 5, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'writing_sheet',
        Title = N'Phiếu luyện viết',
        Description = N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        IsRequired = 1,
        DisplayOrder = 5,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_07_ACT_WRITING';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_07_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_07, N'HG_LESSON_07_ACT_QUIZ', N'final_test', N'Bài kiểm tra', N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        1, @ExId_HG_LESSON_07, NULL, 6, 50, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'final_test',
        Title = N'Bài kiểm tra',
        Description = N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        IsRequired = 1,
        DisplayOrder = 6,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_07_ACT_QUIZ';
END

DECLARE @TopicId_HG_LESSON_08 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_HG_4');
IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_08')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @TopicId_HG_LESSON_08, @Level0Id, N'HG_LESSON_08', 8, N'Patchim (받침) — phụ âm cuối', N'7 nhóm âm đại diện của Patchim đơn, Patchim đôi và quy tắc nối âm (연음화).',
        N'Nắm vững 7 âm đại diện của Patchim [ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ] và áp dụng quy tắc nối âm khi sau Patchim là nguyên âm.', 38, 8, 'Published', 0, 0
    );
END
ELSE
BEGIN
    UPDATE dbo.Lessons
    SET Title = N'Patchim (받침) — phụ âm cuối',
        Subtitle = N'7 nhóm âm đại diện của Patchim đơn, Patchim đôi và quy tắc nối âm (연음화).',
        LearningObjective = N'Nắm vững 7 âm đại diện của Patchim [ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ] và áp dụng quy tắc nối âm khi sau Patchim là nguyên âm.',
        EstimatedMinutes = 38,
        UpdatedAt = SYSUTCDATETIME()
    WHERE LessonCode = N'HG_LESSON_08';
END
DECLARE @LessonId_HG_LESSON_08 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_08');

IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @LessonId_HG_LESSON_08)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@LessonId_HG_LESSON_08, 1, 1, 80, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_08_SEC_JAMO')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_08,
        N'HG_LESSON_08_SEC_JAMO',
        'jamo_cards',
        N'Bảng chữ cái & Phát âm tương tác',
        N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        N'[{"ko":"악","roman":"-k (ㄱ,ㅋ,ㄲ)","vi":"악 · Nhóm Patchim ㄱ, ㅋ, ㄲ đọc ngắt âm [-k] (예: 책, 밖)"},{"ko":"안","roman":"-n (ㄴ)","vi":"안 · Nhóm Patchim ㄴ đọc âm mũi [-n] (예: 산, 눈)"},{"ko":"앋","roman":"-t (ㄷ,ㅅ,ㅆ,ㅈ,ㅊ,ㅌ,ㅎ)","vi":"앋 · 7 phụ âm ㄷ,ㅅ,ㅆ,ㅈ,ㅊ,ㅌ,ㅎ ở cuối quy về [-t] (예: 옷, 꽃)"},{"ko":"알","roman":"-l (ㄹ)","vi":"알 · Nhóm Patchim ㄹ uốn lưỡi chạm hàm trên [-l] (예: 물, 달)"},{"ko":"암","roman":"-m (ㅁ)","vi":"암 · Nhóm Patchim ㅁ khép môi [-m] (예: 봄, 마음)"},{"ko":"압","roman":"-p (ㅂ,ㅍ)","vi":"압 · Nhóm Patchim ㅂ, ㅍ khép môi ngắt âm [-p] (예: 밥, 앞)"},{"ko":"앙","roman":"-ng (ㅇ)","vi":"앙 · Nhóm Patchim ㅇ đọc âm ngân [-ng] (예: 강, 방)"}]',
        1,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET ExamplesJson = N'[{"ko":"악","roman":"-k (ㄱ,ㅋ,ㄲ)","vi":"악 · Nhóm Patchim ㄱ, ㅋ, ㄲ đọc ngắt âm [-k] (예: 책, 밖)"},{"ko":"안","roman":"-n (ㄴ)","vi":"안 · Nhóm Patchim ㄴ đọc âm mũi [-n] (예: 산, 눈)"},{"ko":"앋","roman":"-t (ㄷ,ㅅ,ㅆ,ㅈ,ㅊ,ㅌ,ㅎ)","vi":"앋 · 7 phụ âm ㄷ,ㅅ,ㅆ,ㅈ,ㅊ,ㅌ,ㅎ ở cuối quy về [-t] (예: 옷, 꽃)"},{"ko":"알","roman":"-l (ㄹ)","vi":"알 · Nhóm Patchim ㄹ uốn lưỡi chạm hàm trên [-l] (예: 물, 달)"},{"ko":"암","roman":"-m (ㅁ)","vi":"암 · Nhóm Patchim ㅁ khép môi [-m] (예: 봄, 마음)"},{"ko":"압","roman":"-p (ㅂ,ㅍ)","vi":"압 · Nhóm Patchim ㅂ, ㅍ khép môi ngắt âm [-p] (예: 밥, 앞)"},{"ko":"앙","roman":"-ng (ㅇ)","vi":"앙 · Nhóm Patchim ㅇ đọc âm ngân [-ng] (예: 강, 방)"}]',
        ContentHtmlOrMd = N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        DisplayOrder = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_08_SEC_JAMO';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_08_SEC_THEORY')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_08,
        N'HG_LESSON_08_SEC_THEORY',
        'theory',
        N'Lý thuyết & Quy tắc phát âm trọng tâm',
        N'### 1. Khái niệm Patchim (받침)
**Patchim (받침)** là phụ âm đứng ở vị trí **dưới cùng** của một âm tiết tiếng Hàn (Cấu trúc: Phụ âm đầu + Nguyên âm + **Patchim**).

### 2. Bảng 7 nhóm âm đại diện của Patchim
Dù có nhiều phụ âm có thể viết ở vị trí cuối, khi phát âm độc lập chỉ quy về **7 âm đại diện**:
| Âm đại diện | Các phụ âm cuối thuộc nhóm | Ví dụ & Phát âm |
|---|---|---|
| **[ㄱ] (-k)** | **ㄱ, ㅋ, ㄲ** | 책 [책], 부엌 [부억], 밖 [박] |
| **[ㄴ] (-n)** | **ㄴ** | 산 [산], 눈 [눈] |
| **[ㄷ] (-t)** | **ㄷ, ㅅ, ㅆ, ㅈ, ㅊ, ㅌ, ㅎ** | 옷 [옫], 있다 [읻따], 꽃 [꼳], 끝 [끋] |
| **[ㄹ] (-l)** | **ㄹ** | 물 [물], 달 [달] |
| **[ㅁ] (-m)** | **ㅁ** | 마음 [마음], 봄 [봄] |
| **[ㅂ] (-p)** | **ㅂ, ㅍ** | 밥 [밥], 앞 [압] |
| **[ㅇ] (-ng)** | **ㅇ** | 강 [강], 방 [방] |

### 3. Quy tắc nối âm (연음화)
Khi âm tiết có Patchim đi liền trước một âm tiết bắt đầu bằng phụ âm câm **ㅇ**, phụ âm cuối sẽ nối sang vị trí của **ㅇ** để phát âm:
- **한국어** -> **[한구거]**
- **꽃이** -> **[꼬치]**',
        N'[{"ko":"한국어","roman":"han-gu-geo","vi":"Tiếng Hàn Quốc (nối âm [한구거])"},{"ko":"꽃","roman":"kkot","vi":"Bông hoa (phát âm [꼳])"},{"ko":"밥","roman":"bap","vi":"Cơm"}]',
        2,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET DisplayOrder = 2,
        ContentHtmlOrMd = N'### 1. Khái niệm Patchim (받침)
**Patchim (받침)** là phụ âm đứng ở vị trí **dưới cùng** của một âm tiết tiếng Hàn (Cấu trúc: Phụ âm đầu + Nguyên âm + **Patchim**).

### 2. Bảng 7 nhóm âm đại diện của Patchim
Dù có nhiều phụ âm có thể viết ở vị trí cuối, khi phát âm độc lập chỉ quy về **7 âm đại diện**:
| Âm đại diện | Các phụ âm cuối thuộc nhóm | Ví dụ & Phát âm |
|---|---|---|
| **[ㄱ] (-k)** | **ㄱ, ㅋ, ㄲ** | 책 [책], 부엌 [부억], 밖 [박] |
| **[ㄴ] (-n)** | **ㄴ** | 산 [산], 눈 [눈] |
| **[ㄷ] (-t)** | **ㄷ, ㅅ, ㅆ, ㅈ, ㅊ, ㅌ, ㅎ** | 옷 [옫], 있다 [읻따], 꽃 [꼳], 끝 [끋] |
| **[ㄹ] (-l)** | **ㄹ** | 물 [물], 달 [달] |
| **[ㅁ] (-m)** | **ㅁ** | 마음 [마음], 봄 [봄] |
| **[ㅂ] (-p)** | **ㅂ, ㅍ** | 밥 [밥], 앞 [압] |
| **[ㅇ] (-ng)** | **ㅇ** | 강 [강], 방 [방] |

### 3. Quy tắc nối âm (연음화)
Khi âm tiết có Patchim đi liền trước một âm tiết bắt đầu bằng phụ âm câm **ㅇ**, phụ âm cuối sẽ nối sang vị trí của **ㅇ** để phát âm:
- **한국어** -> **[한구거]**
- **꽃이** -> **[꼬치]**',
        ExamplesJson = N'[{"ko":"한국어","roman":"han-gu-geo","vi":"Tiếng Hàn Quốc (nối âm [한구거])"},{"ko":"꽃","roman":"kkot","vi":"Bông hoa (phát âm [꼳])"},{"ko":"밥","roman":"bap","vi":"Cơm"}]',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_08_SEC_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_08_RES_WRITE')
BEGIN
    INSERT INTO dbo.LessonResources (LessonId, ResourceCode, ResourceType, Title, Description, ResourceUrl, TargetCharsJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_08,
        N'HG_LESSON_08_RES_WRITE',
        'writing_sheet',
        N'Phiếu luyện viết ô ly & Mẫu chữ viết tay PE92 - Patchim (받침) — phụ âm cuối',
        N'Đối chiếu trực tiếp với mẫu chữ viết tay SQL Server (dbo.HangulCharacterClasses) và luyện viết trên bảng ô ly.',
        N'/ai?tab=handwriting',
        N'["각","간","갈","감","강"]',
        1,
        'Published'
    );
END
DECLARE @ResId_HG_LESSON_08 INT = (SELECT TOP 1 ResourceId FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_08_RES_WRITE');


IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG08_01')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG08_01', N'한국', N'han-guk', N'Hàn Quốc', N'Danh từ',
        N'한국에 가요.', N'Tôi đi Hàn Quốc.', 'A', N'Nhập môn', N'Patchim (받침) — phụ âm cuối', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG08_01 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG08_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_08 AND VocabId = @VocabId_VC_HG08_01)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_08, @VocabId_VC_HG08_01, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG08_02')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG08_02', N'책', N'chaek', N'Quyển sách', N'Danh từ',
        N'책을 읽어요.', N'Tôi đọc sách.', 'A', N'Nhập môn', N'Patchim (받침) — phụ âm cuối', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG08_02 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG08_02');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_08 AND VocabId = @VocabId_VC_HG08_02)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_08, @VocabId_VC_HG08_02, 2, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG08_03')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG08_03', N'꽃', N'kkot', N'Bông hoa', N'Danh từ',
        N'꽃이 예뻐요.', N'Bông hoa đẹp.', 'A', N'Nhập môn', N'Patchim (받침) — phụ âm cuối', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG08_03 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG08_03');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_08 AND VocabId = @VocabId_VC_HG08_03)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_08, @VocabId_VC_HG08_03, 3, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG08_04')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG08_04', N'물', N'mul', N'Nước', N'Danh từ',
        N'물을 마셔요.', N'Tôi uống nước.', 'A', N'Nhập môn', N'Patchim (받침) — phụ âm cuối', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG08_04 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG08_04');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_08 AND VocabId = @VocabId_VC_HG08_04)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_08, @VocabId_VC_HG08_04, 4, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_08_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_08,
        N'HG_LESSON_08_FINAL_EX',
        'final_test',
        N'Bài kiểm tra cuối buổi — Patchim (받침) — phụ âm cuối',
        N'Hoàn thành đúng từ 80% trở lên để hoàn thành buổi học và mở khóa buổi tiếp theo.',
        80,
        300,
        1,
        'Published'
    );
END
DECLARE @ExId_HG_LESSON_08 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_08_FINAL_EX');


IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG08_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_08,
        N'Q_HG08_1',
        'multiple_choice',
        N'Khi đứng ở vị trí Patchim cuối từ, các phụ âm "ㄷ, ㅅ, ㅆ, ㅈ, ㅊ, ㅌ, ㅎ" đều được phát âm quy về âm đại diện nào?',
        N'옷 -> [옫], 꽃 -> [꼳]',
        N'Tất cả 7 phụ âm ㄷ, ㅅ, ㅆ, ㅈ, ㅊ, ㅌ, ㅎ khi làm Patchim cuối âm tiết đều quy về âm đại diện [ㄷ] (-t).',
        20,
        1,
        'Published'
    );
END
DECLARE @QId_Q_HG08_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG08_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG08_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG08_1, N'A', N'Âm đại diện [ㄷ]', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG08_1, N'B', N'Âm đại diện [ㄱ]', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG08_1, N'C', N'Âm đại diện [ㅂ]', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG08_1, N'D', N'Âm đại diện [ㅇ]', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG08_2')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_08,
        N'Q_HG08_2',
        'multiple_choice',
        N'Theo quy tắc nối âm (연음화), từ "한국어" (Tiếng Hàn) được phát âm chuẩn là gì?',
        N'한국어',
        N'Patchim ㄱ của 국 gặp nguyên âm 어 (bắt đầu bằng ㅇ) nên nối sang thành [한구거].',
        20,
        2,
        'Published'
    );
END
DECLARE @QId_Q_HG08_2 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG08_2');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG08_2)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG08_2, N'A', N'[한구거]', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG08_2, N'B', N'[한국어]', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG08_2, N'C', N'[항국어]', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG08_2, N'D', N'[한궁어]', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG08_3')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_08,
        N'Q_HG08_3',
        'multiple_choice',
        N'Từ "꽃" (Bông hoa) khi đứng một mình được phát âm như thế nào?',
        N'꽃',
        N'Patchim ㅊ quy về âm đại diện [ㄷ], nên 꽃 được phát âm là [꼳].',
        20,
        3,
        'Published'
    );
END
DECLARE @QId_Q_HG08_3 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG08_3');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG08_3)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG08_3, N'A', N'[꼳]', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG08_3, N'B', N'[꼭]', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG08_3, N'C', N'[꼽]', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG08_3, N'D', N'[꽁]', 0, 4);
END

UPDATE dbo.LessonActivities
SET Status = 'Archived', IsRequired = 0
WHERE LessonId = @LessonId_HG_LESSON_08 AND ActivityCode = N'HG_LESSON_08_ACT_VOCAB';


IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_08_ACT_WARMUP')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_08, N'HG_LESSON_08_ACT_WARMUP', N'warmup_quiz', N'Kiểm tra đầu buổi', N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        1, NULL, NULL, 1, 10, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'warmup_quiz',
        Title = N'Kiểm tra đầu buổi',
        Description = N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        IsRequired = 1,
        DisplayOrder = 1,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_08_ACT_WARMUP';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_08_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_08, N'HG_LESSON_08_ACT_THEORY', N'theory', N'Học (7 chữ)', N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        1, NULL, NULL, 2, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'theory',
        Title = N'Học (7 chữ)',
        Description = N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        IsRequired = 1,
        DisplayOrder = 2,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_08_ACT_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_08_ACT_FLASHCARD')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_08, N'HG_LESSON_08_ACT_FLASHCARD', N'flashcard', N'Flashcard', N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        1, NULL, NULL, 3, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'flashcard',
        Title = N'Flashcard',
        Description = N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        IsRequired = 1,
        DisplayOrder = 3,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_08_ACT_FLASHCARD';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_08_ACT_PRACTICE')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_08, N'HG_LESSON_08_ACT_PRACTICE', N'practice_quiz', N'Trắc nghiệm', N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        1, NULL, NULL, 4, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'practice_quiz',
        Title = N'Trắc nghiệm',
        Description = N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        IsRequired = 1,
        DisplayOrder = 4,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_08_ACT_PRACTICE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_08_ACT_WRITING')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_08, N'HG_LESSON_08_ACT_WRITING', N'writing_sheet', N'Phiếu luyện viết', N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        1, NULL, @ResId_HG_LESSON_08, 5, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'writing_sheet',
        Title = N'Phiếu luyện viết',
        Description = N'In phiếu tô chữ ô ly và đối chiếu mẫu chữ viết tay PE92 từ SQL Server.',
        IsRequired = 1,
        DisplayOrder = 5,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_08_ACT_WRITING';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_08_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_08, N'HG_LESSON_08_ACT_QUIZ', N'final_test', N'Bài kiểm tra', N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        1, @ExId_HG_LESSON_08, NULL, 6, 50, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'final_test',
        Title = N'Bài kiểm tra',
        Description = N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        IsRequired = 1,
        DisplayOrder = 6,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_08_ACT_QUIZ';
END

DECLARE @TopicId_HG_LESSON_09 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_HG_4');
IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_09')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @TopicId_HG_LESSON_09, @Level0Id, N'HG_LESSON_09', 9, N'Tổng ôn bảng chữ cái Hangeul', N'Hệ thống hóa toàn bộ 40 ký tự Hangeul (21 nguyên âm + 19 phụ âm), quy tắc biến âm cơ bản và kiểm tra mở khóa Chặng Sơ cấp 1.',
        N'Đọc thông viết thạo toàn bộ 40 chữ cái Hangeul, nắm vững quy tắc nối âm, biến âm mũi hóa và đạt >= 80% bài kiểm tra tổng kết để mở khóa Chặng Sơ cấp 1.', 70, 9, 'Published', 0, 0
    );
END
ELSE
BEGIN
    UPDATE dbo.Lessons
    SET Title = N'Tổng ôn bảng chữ cái Hangeul',
        Subtitle = N'Hệ thống hóa toàn bộ 40 ký tự Hangeul (21 nguyên âm + 19 phụ âm), quy tắc biến âm cơ bản và kiểm tra mở khóa Chặng Sơ cấp 1.',
        LearningObjective = N'Đọc thông viết thạo toàn bộ 40 chữ cái Hangeul, nắm vững quy tắc nối âm, biến âm mũi hóa và đạt >= 80% bài kiểm tra tổng kết để mở khóa Chặng Sơ cấp 1.',
        EstimatedMinutes = 70,
        UpdatedAt = SYSUTCDATETIME()
    WHERE LessonCode = N'HG_LESSON_09';
END
DECLARE @LessonId_HG_LESSON_09 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'HG_LESSON_09');

IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @LessonId_HG_LESSON_09)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@LessonId_HG_LESSON_09, 1, 1, 80, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_09_SEC_JAMO')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_09,
        N'HG_LESSON_09_SEC_JAMO',
        'jamo_cards',
        N'Bảng chữ cái & Phát âm tương tác',
        N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        N'[{"ko":"ㅏ","roman":"a","vi":"아 · Nguyên âm đơn a"},{"ko":"ㅑ","roman":"ya","vi":"야 · Nguyên âm đơn ya"},{"ko":"ㅓ","roman":"eo · ơ","vi":"어 · Nguyên âm đơn eo/ơ"},{"ko":"ㅕ","roman":"yeo · yơ","vi":"여 · Nguyên âm đơn yeo/yơ"},{"ko":"ㅗ","roman":"o · ô","vi":"오 · Nguyên âm đơn o/ô"},{"ko":"ㅛ","roman":"yo · yô","vi":"요 · Nguyên âm đơn yo/yô"},{"ko":"ㅜ","roman":"u","vi":"우 · Nguyên âm đơn u"},{"ko":"ㅠ","roman":"yu","vi":"유 · Nguyên âm đơn yu"},{"ko":"ㅡ","roman":"eu · ư","vi":"으 · Nguyên âm đơn eu/ư"},{"ko":"ㅣ","roman":"i","vi":"이 · Nguyên âm đơn i"},{"ko":"ㅐ","roman":"ae · e","vi":"애 · Nguyên âm đôi ae/e"},{"ko":"ㅒ","roman":"yae · ye","vi":"얘 · Nguyên âm đôi yae/ye"},{"ko":"ㅔ","roman":"e · ê","vi":"에 · Nguyên âm đôi e/ê"},{"ko":"ㅖ","roman":"ye · yê","vi":"예 · Nguyên âm đôi ye/yê"},{"ko":"ㅘ","roman":"wa · oa","vi":"와 · Nguyên âm đôi wa/oa"},{"ko":"ㅙ","roman":"wae · uê","vi":"왜 · Nguyên âm đôi wae/uê"},{"ko":"ㅚ","roman":"oe · we","vi":"외 · Nguyên âm đôi oe/we"},{"ko":"ㅝ","roman":"wo · uơ","vi":"워 · Nguyên âm đôi wo/uơ"},{"ko":"ㅞ","roman":"we · uê","vi":"웨 · Nguyên âm đôi we/uê"},{"ko":"ㅟ","roman":"wi · uy","vi":"위 · Nguyên âm đôi wi/uy"},{"ko":"ㅢ","roman":"ui · ưi","vi":"의 · Nguyên âm đôi ui/ưi"},{"ko":"ㄱ","roman":"g / k","vi":"가 · Phụ âm cơ bản gi-yeok"},{"ko":"ㄴ","roman":"n","vi":"나 · Phụ âm cơ bản ni-eun"},{"ko":"ㄷ","roman":"d / t","vi":"다 · Phụ âm cơ bản di-geut"},{"ko":"ㄹ","roman":"r / l","vi":"라 · Phụ âm cơ bản ri-eul"},{"ko":"ㅁ","roman":"m","vi":"마 · Phụ âm cơ bản mi-eum"},{"ko":"ㅂ","roman":"b / p","vi":"바 · Phụ âm cơ bản bi-eup"},{"ko":"ㅅ","roman":"s / x","vi":"사 · Phụ âm cơ bản si-ot"},{"ko":"ㅇ","roman":"câm / -ng","vi":"아 · Phụ âm cơ bản i-eung"},{"ko":"ㅈ","roman":"j / ch","vi":"자 · Phụ âm cơ bản ji-eut"},{"ko":"ㅊ","roman":"ch''","vi":"차 · Phụ âm bật hơi chi-eut"},{"ko":"ㅋ","roman":"k''","vi":"카 · Phụ âm bật hơi ki-euk"},{"ko":"ㅌ","roman":"t''","vi":"타 · Phụ âm bật hơi ti-eut"},{"ko":"ㅍ","roman":"p''","vi":"파 · Phụ âm bật hơi pi-eup"},{"ko":"ㅎ","roman":"h","vi":"하 · Phụ âm cơ bản hi-eut"},{"ko":"ㄲ","roman":"kk (căng)","vi":"까 · Phụ âm đôi ssang-giyeok"},{"ko":"ㄸ","roman":"tt (căng)","vi":"따 · Phụ âm đôi ssang-digeut"},{"ko":"ㅃ","roman":"pp (căng)","vi":"빠 · Phụ âm đôi ssang-bieup"},{"ko":"ㅆ","roman":"ss (căng)","vi":"싸 · Phụ âm đôi ssang-siot"},{"ko":"ㅉ","roman":"jj (căng)","vi":"짜 · Phụ âm đôi ssang-jieut"}]',
        1,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET ExamplesJson = N'[{"ko":"ㅏ","roman":"a","vi":"아 · Nguyên âm đơn a"},{"ko":"ㅑ","roman":"ya","vi":"야 · Nguyên âm đơn ya"},{"ko":"ㅓ","roman":"eo · ơ","vi":"어 · Nguyên âm đơn eo/ơ"},{"ko":"ㅕ","roman":"yeo · yơ","vi":"여 · Nguyên âm đơn yeo/yơ"},{"ko":"ㅗ","roman":"o · ô","vi":"오 · Nguyên âm đơn o/ô"},{"ko":"ㅛ","roman":"yo · yô","vi":"요 · Nguyên âm đơn yo/yô"},{"ko":"ㅜ","roman":"u","vi":"우 · Nguyên âm đơn u"},{"ko":"ㅠ","roman":"yu","vi":"유 · Nguyên âm đơn yu"},{"ko":"ㅡ","roman":"eu · ư","vi":"으 · Nguyên âm đơn eu/ư"},{"ko":"ㅣ","roman":"i","vi":"이 · Nguyên âm đơn i"},{"ko":"ㅐ","roman":"ae · e","vi":"애 · Nguyên âm đôi ae/e"},{"ko":"ㅒ","roman":"yae · ye","vi":"얘 · Nguyên âm đôi yae/ye"},{"ko":"ㅔ","roman":"e · ê","vi":"에 · Nguyên âm đôi e/ê"},{"ko":"ㅖ","roman":"ye · yê","vi":"예 · Nguyên âm đôi ye/yê"},{"ko":"ㅘ","roman":"wa · oa","vi":"와 · Nguyên âm đôi wa/oa"},{"ko":"ㅙ","roman":"wae · uê","vi":"왜 · Nguyên âm đôi wae/uê"},{"ko":"ㅚ","roman":"oe · we","vi":"외 · Nguyên âm đôi oe/we"},{"ko":"ㅝ","roman":"wo · uơ","vi":"워 · Nguyên âm đôi wo/uơ"},{"ko":"ㅞ","roman":"we · uê","vi":"웨 · Nguyên âm đôi we/uê"},{"ko":"ㅟ","roman":"wi · uy","vi":"위 · Nguyên âm đôi wi/uy"},{"ko":"ㅢ","roman":"ui · ưi","vi":"의 · Nguyên âm đôi ui/ưi"},{"ko":"ㄱ","roman":"g / k","vi":"가 · Phụ âm cơ bản gi-yeok"},{"ko":"ㄴ","roman":"n","vi":"나 · Phụ âm cơ bản ni-eun"},{"ko":"ㄷ","roman":"d / t","vi":"다 · Phụ âm cơ bản di-geut"},{"ko":"ㄹ","roman":"r / l","vi":"라 · Phụ âm cơ bản ri-eul"},{"ko":"ㅁ","roman":"m","vi":"마 · Phụ âm cơ bản mi-eum"},{"ko":"ㅂ","roman":"b / p","vi":"바 · Phụ âm cơ bản bi-eup"},{"ko":"ㅅ","roman":"s / x","vi":"사 · Phụ âm cơ bản si-ot"},{"ko":"ㅇ","roman":"câm / -ng","vi":"아 · Phụ âm cơ bản i-eung"},{"ko":"ㅈ","roman":"j / ch","vi":"자 · Phụ âm cơ bản ji-eut"},{"ko":"ㅊ","roman":"ch''","vi":"차 · Phụ âm bật hơi chi-eut"},{"ko":"ㅋ","roman":"k''","vi":"카 · Phụ âm bật hơi ki-euk"},{"ko":"ㅌ","roman":"t''","vi":"타 · Phụ âm bật hơi ti-eut"},{"ko":"ㅍ","roman":"p''","vi":"파 · Phụ âm bật hơi pi-eup"},{"ko":"ㅎ","roman":"h","vi":"하 · Phụ âm cơ bản hi-eut"},{"ko":"ㄲ","roman":"kk (căng)","vi":"까 · Phụ âm đôi ssang-giyeok"},{"ko":"ㄸ","roman":"tt (căng)","vi":"따 · Phụ âm đôi ssang-digeut"},{"ko":"ㅃ","roman":"pp (căng)","vi":"빠 · Phụ âm đôi ssang-bieup"},{"ko":"ㅆ","roman":"ss (căng)","vi":"싸 · Phụ âm đôi ssang-siot"},{"ko":"ㅉ","roman":"jj (căng)","vi":"짜 · Phụ âm đôi ssang-jieut"}]',
        ContentHtmlOrMd = N'Bấm vào từng chữ để nghe âm đọc. Học thuộc mặt chữ + cách đọc rồi thử Flashcard / Trắc nghiệm, hoặc mở File viết để in phiếu tô chữ.',
        DisplayOrder = 1,
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_09_SEC_JAMO';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'HG_LESSON_09_SEC_THEORY')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_09,
        N'HG_LESSON_09_SEC_THEORY',
        'theory',
        N'Lý thuyết & Quy tắc phát âm trọng tâm',
        N'### 1. Tổng kết 40 ký tự Hangeul (한글 40자)
- **10 Nguyên âm đơn**: `ㅏ, ㅑ, ㅓ, ㅕ, ㅗ, ㅛ, ㅜ, ㅠ, ㅡ, ㅣ`
- **11 Nguyên âm đôi**: `ㅐ, ㅒ, ㅔ, ㅖ, ㅘ, ㅙ, ㅚ, ㅝ, ㅞ, ㅟ, ㅢ`
- **14 Phụ âm đơn**: `ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅅ, ㅇ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ`
- **5 Phụ âm đôi**: `ㄲ, ㄸ, ㅃ, ㅆ, ㅉ`

### 2. Tổng hợp 3 quy tắc phát âm cốt lõi cần nhớ
1. **Nối âm (연음화)**: Patchim + `ㅇ` -> đọc nối phụ âm cuối sang âm tiết sau (예: 음악 -> [으막]).
2. **Bật hơi hóa (격음화)**: `ㄱ, ㄷ, ㅂ, ㅈ` gặp `ㅎ` -> biến thành âm bật hơi `[ㅋ, ㅌ, ㅍ, ㅊ]` (예: 축하 -> [추카], 좋다 -> [조타]).
3. **Mũi hóa (비음화)**: Patchim `[ㄱ, ㄷ, ㅂ]` gặp `ㄴ, ㅁ` -> biến thành `[ㅇ, ㄴ, ㅁ]` (예: 감사합니다 -> [감사함니다]).',
        N'[{"ko":"안녕하세요","roman":"an-nyeong-ha-se-yo","vi":"Xin chào"},{"ko":"감사합니다","roman":"gam-sa-ham-ni-da","vi":"Xin cảm ơn ([감사함니다])"},{"ko":"축하합니다","roman":"chuk-ha-ham-ni-da","vi":"Xin chúc mừng ([추카함니다])"}]',
        2,
        'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonSections
    SET DisplayOrder = 2,
        ContentHtmlOrMd = N'### 1. Tổng kết 40 ký tự Hangeul (한글 40자)
- **10 Nguyên âm đơn**: `ㅏ, ㅑ, ㅓ, ㅕ, ㅗ, ㅛ, ㅜ, ㅠ, ㅡ, ㅣ`
- **11 Nguyên âm đôi**: `ㅐ, ㅒ, ㅔ, ㅖ, ㅘ, ㅙ, ㅚ, ㅝ, ㅞ, ㅟ, ㅢ`
- **14 Phụ âm đơn**: `ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅅ, ㅇ, ㅈ, ㅊ, ㅋ, ㅌ, ㅍ, ㅎ`
- **5 Phụ âm đôi**: `ㄲ, ㄸ, ㅃ, ㅆ, ㅉ`

### 2. Tổng hợp 3 quy tắc phát âm cốt lõi cần nhớ
1. **Nối âm (연음화)**: Patchim + `ㅇ` -> đọc nối phụ âm cuối sang âm tiết sau (예: 음악 -> [으막]).
2. **Bật hơi hóa (격음화)**: `ㄱ, ㄷ, ㅂ, ㅈ` gặp `ㅎ` -> biến thành âm bật hơi `[ㅋ, ㅌ, ㅍ, ㅊ]` (예: 축하 -> [추카], 좋다 -> [조타]).
3. **Mũi hóa (비음화)**: Patchim `[ㄱ, ㄷ, ㅂ]` gặp `ㄴ, ㅁ` -> biến thành `[ㅇ, ㄴ, ㅁ]` (예: 감사합니다 -> [감사함니다]).',
        ExamplesJson = N'[{"ko":"안녕하세요","roman":"an-nyeong-ha-se-yo","vi":"Xin chào"},{"ko":"감사합니다","roman":"gam-sa-ham-ni-da","vi":"Xin cảm ơn ([감사함니다])"},{"ko":"축하합니다","roman":"chuk-ha-ham-ni-da","vi":"Xin chúc mừng ([추카함니다])"}]',
        UpdatedAt = SYSUTCDATETIME()
    WHERE SectionCode = N'HG_LESSON_09_SEC_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_09_RES_WRITE')
BEGIN
    INSERT INTO dbo.LessonResources (LessonId, ResourceCode, ResourceType, Title, Description, ResourceUrl, TargetCharsJson, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_09,
        N'HG_LESSON_09_RES_WRITE',
        'writing_sheet',
        N'Phiếu luyện viết ô ly & Mẫu chữ viết tay PE92 - Tổng ôn bảng chữ cái Hangeul',
        N'Đối chiếu trực tiếp với mẫu chữ viết tay SQL Server (dbo.HangulCharacterClasses) và luyện viết trên bảng ô ly.',
        N'/ai?tab=handwriting',
        N'["한","글","가","나","다"]',
        1,
        'Published'
    );
END
DECLARE @ResId_HG_LESSON_09 INT = (SELECT TOP 1 ResourceId FROM dbo.LessonResources WHERE ResourceCode = N'HG_LESSON_09_RES_WRITE');


IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG09_01')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG09_01', N'한글', N'han-geul', N'Bảng chữ cái tiếng Hàn (Hangeul)', N'Danh từ',
        N'한글은 배우기 쉬워요.', N'Chữ Hangeul rất dễ học.', 'A', N'Nhập môn', N'Tổng ôn bảng chữ cái Hangeul', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG09_01 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG09_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_09 AND VocabId = @VocabId_VC_HG09_01)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_09, @VocabId_VC_HG09_01, 1, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG09_02')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG09_02', N'선생님', N'seon-saeng-nim', N'Giáo viên, thầy/cô giáo', N'Danh từ',
        N'선생님, 안녕하세요!', N'Em chào thầy/cô ạ!', 'A', N'Nhập môn', N'Tổng ôn bảng chữ cái Hangeul', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG09_02 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG09_02');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_09 AND VocabId = @VocabId_VC_HG09_02)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_09, @VocabId_VC_HG09_02, 2, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG09_03')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG09_03', N'학생', N'hak-saeng', N'Học sinh, sinh viên', N'Danh từ',
        N'저는 베트남 학생이에요.', N'Tôi là sinh viên Việt Nam.', 'A', N'Nhập môn', N'Tổng ôn bảng chữ cái Hangeul', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG09_03 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG09_03');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_09 AND VocabId = @VocabId_VC_HG09_03)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_09, @VocabId_VC_HG09_03, 3, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG09_04')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Romanization, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel, TopicName, SourceId, Status
    ) VALUES (
        N'VC_HG09_04', N'사랑해요', N'sa-rang-hae-yo', N'Tôi yêu bạn', N'Biểu hiện',
        N'가족을 사랑해요.', N'Tôi yêu gia đình.', 'A', N'Nhập môn', N'Tổng ôn bảng chữ cái Hangeul', @SourceHango, 'Published'
    );
END
DECLARE @VocabId_VC_HG09_04 INT = (SELECT TOP 1 VocabId FROM dbo.Vocabulary WHERE VocabCode = N'VC_HG09_04');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonVocabulary WHERE LessonId = @LessonId_HG_LESSON_09 AND VocabId = @VocabId_VC_HG09_04)
BEGIN
    INSERT INTO dbo.LessonVocabulary (LessonId, VocabId, DisplayOrder, IsCoreTerm)
    VALUES (@LessonId_HG_LESSON_09, @VocabId_VC_HG09_04, 4, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_09_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (
        @LessonId_HG_LESSON_09,
        N'HG_LESSON_09_FINAL_EX',
        'final_test',
        N'Bài kiểm tra cuối buổi — Tổng ôn bảng chữ cái Hangeul',
        N'Hoàn thành đúng từ 80% trở lên để hoàn thành buổi học và mở khóa buổi tiếp theo.',
        80,
        300,
        1,
        'Published'
    );
END
DECLARE @ExId_HG_LESSON_09 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'HG_LESSON_09_FINAL_EX');


IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG09_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_09,
        N'Q_HG09_1',
        'multiple_choice',
        N'Bảng chữ cái tiếng Hàn Hangeul có tổng cộng bao nhiêu ký tự (gồm cả nguyên âm và phụ âm)?',
        N'21 nguyên âm + 19 phụ âm',
        N'Hangeul gồm 21 nguyên âm (10 đơn + 11 đôi) và 19 phụ âm (14 đơn + 5 đôi) = 40 ký tự.',
        20,
        1,
        'Published'
    );
END
DECLARE @QId_Q_HG09_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG09_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG09_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG09_1, N'A', N'24 ký tự', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG09_1, N'B', N'40 ký tự (21 nguyên âm + 19 phụ âm)', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG09_1, N'C', N'29 ký tự', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG09_1, N'D', N'36 ký tự', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG09_2')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_09,
        N'Q_HG09_2',
        'multiple_choice',
        N'Do quy tắc mũi hóa (ㅂ gặp ㄴ biến thành ㅁ), câu "감사합니다" (Xin cảm ơn) được phát âm chuẩn là gì?',
        N'감사합니다',
        N'Patchim ㅂ của 합 đứng trước phụ âm ㄴ của 니 nên biến âm thành ㅁ -> [감사함니다].',
        20,
        2,
        'Published'
    );
END
DECLARE @QId_Q_HG09_2 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG09_2');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG09_2)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG09_2, N'A', N'[감사함니다]', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG09_2, N'B', N'[감사합니다]', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG09_2, N'C', N'[감삽니다]', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG09_2, N'D', N'[감사하니다]', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_HG09_3')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (
        @ExId_HG_LESSON_09,
        N'Q_HG09_3',
        'multiple_choice',
        N'Do quy tắc bật hơi hóa (ㄱ + ㅎ -> ㅋ), từ "축하해요" (Chúc mừng) được phát âm là gì?',
        N'축하해요',
        N'Patchim ㄱ của 축 kết hợp với phụ âm ㅎ của 하 tạo thành âm bật hơi [ㅋ] -> [추카해요].',
        20,
        3,
        'Published'
    );
END
DECLARE @QId_Q_HG09_3 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_HG09_3');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @QId_Q_HG09_3)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG09_3, N'A', N'[추카해요]', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG09_3, N'B', N'[축아해요]', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG09_3, N'C', N'[추가해요]', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@QId_Q_HG09_3, N'D', N'[충하해요]', 0, 4);
END

UPDATE dbo.LessonActivities
SET Status = 'Archived', IsRequired = 0
WHERE LessonId = @LessonId_HG_LESSON_09 AND ActivityCode = N'HG_LESSON_09_ACT_VOCAB';


IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_09_ACT_WARMUP')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_09, N'HG_LESSON_09_ACT_WARMUP', N'warmup_quiz', N'Kiểm tra đầu buổi', N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        1, NULL, NULL, 1, 10, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'warmup_quiz',
        Title = N'Kiểm tra đầu buổi',
        Description = N'Khởi động nhanh ôn lại các chữ cái đã học ở buổi trước.',
        IsRequired = 1,
        DisplayOrder = 1,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_09_ACT_WARMUP';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_09_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_09, N'HG_LESSON_09_ACT_THEORY', N'theory', N'Học (40 chữ)', N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        1, NULL, NULL, 2, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'theory',
        Title = N'Học (40 chữ)',
        Description = N'Bấm vào từng chữ để nghe âm đọc và xem quy tắc phát âm, từ vựng.',
        IsRequired = 1,
        DisplayOrder = 2,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_09_ACT_THEORY';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_09_ACT_FLASHCARD')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_09, N'HG_LESSON_09_ACT_FLASHCARD', N'flashcard', N'Flashcard', N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        1, NULL, NULL, 3, 15, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'flashcard',
        Title = N'Flashcard',
        Description = N'Lật thẻ 3D ghi nhớ mặt chữ, cách phát âm và từ vựng ứng dụng.',
        IsRequired = 1,
        DisplayOrder = 3,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_09_ACT_FLASHCARD';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_09_ACT_PRACTICE')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_09, N'HG_LESSON_09_ACT_PRACTICE', N'practice_quiz', N'Trắc nghiệm', N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        1, NULL, NULL, 4, 20, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'practice_quiz',
        Title = N'Trắc nghiệm',
        Description = N'Luyện phản xạ chọn nhanh âm đọc và mặt chữ Hangeul.',
        IsRequired = 1,
        DisplayOrder = 4,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_09_ACT_PRACTICE';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'HG_LESSON_09_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (
        LessonId, ActivityCode, ActivityType, Title, Description,
        IsRequired, ExerciseId, ResourceId, DisplayOrder, XpReward, Status
    ) VALUES (
        @LessonId_HG_LESSON_09, N'HG_LESSON_09_ACT_QUIZ', N'final_test', N'Bài kiểm tra', N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        1, @ExId_HG_LESSON_09, NULL, 5, 50, 'Published'
    );
END
ELSE
BEGIN
    UPDATE dbo.LessonActivities
    SET ActivityType = N'final_test',
        Title = N'Bài kiểm tra',
        Description = N'Hoàn thành bài kiểm tra cuối buổi (đạt >= 80%) để mở khóa buổi học tiếp theo.',
        IsRequired = 1,
        DisplayOrder = 5,
        Status = 'Published',
        UpdatedAt = SYSUTCDATETIME()
    WHERE ActivityCode = N'HG_LESSON_09_ACT_QUIZ';
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningLevels WHERE LevelCode = N'LEVEL_1_ELEM1')
BEGIN
    INSERT INTO dbo.LearningLevels (
        PathId, LevelCode, BadgeText, BadgeColor, Title, TopikLevel,
        TextbookName, Description, SkillTagsJson, DisplayOrder, Status
    ) VALUES (
        @PathId, N'LEVEL_1_ELEM1', N'1급', N'blue', N'Sơ cấp 1', N'TOPIK I',
        N'You Speak Korean! Book 1 & NIKL A', N'Từ vựng & mẫu câu cơ bản, chào hỏi, giới thiệu bản thân, số đếm và giao tiếp đời thường.', N'["Từ vựng","Ngữ pháp","Luyện đề","Ôn tập & kiểm tra"]', 2, 'Published'
    );
END
DECLARE @Level_2 INT = (SELECT TOP 1 LevelId FROM dbo.LearningLevels WHERE LevelCode = N'LEVEL_1_ELEM1');
IF NOT EXISTS (SELECT 1 FROM dbo.LevelUnlockRules WHERE LevelId = @Level_2)
BEGIN
    INSERT INTO dbo.LevelUnlockRules (LevelId, PrerequisiteLevelId, RequiredCompletedLessonsPercent, MinAverageQuizScorePercent, IsDefaultUnlocked)
    VALUES (@Level_2, @Level0Id, 100, 80, 0);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L1_1')
BEGIN
    INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
    VALUES (@Level_2, N'TOPIC_L1_1', N'Chủ đề 1: Chào hỏi & Giới thiệu bản thân (인사와 소개)', N'Cách chào hỏi lịch sự, giới thiệu tên, quốc tịch và nghề nghiệp theo chuẩn TOPIK I.', 1, 'Published');
END
DECLARE @Top_TOPIC_L1_1 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L1_1');

IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'L1_LESSON_01')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @Top_TOPIC_L1_1, @Level_2, N'L1_LESSON_01', 1, N'Bài 1: Xin chào! Tôi là học viên Việt Nam (안녕하세요, 저는 베트남 학생입니다)', N'Ngữ pháp danh từ + 입니다/입니까, tiểu từ chủ ngữ 은/는 và từ vựng quốc gia - nghề nghiệp.',
        N'Giới thiệu được tên, quốc tịch, nghề nghiệp bằng cấu trúc N-입니다 và N-이에요/예요.', 30, 1, 'Published', 0, 0
    );
END
DECLARE @Les_L1_LESSON_01 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'L1_LESSON_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @Les_L1_LESSON_01)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@Les_L1_LESSON_01, 1, 1, 80, 1, 1);
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'L1_LESSON_01_SEC1')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @Les_L1_LESSON_01,
        N'L1_LESSON_01_SEC1',
        'theory',
        N'Kiến thức trọng tâm & Ngữ pháp: N + 입니다 / 입니까?',
        N'### Ngữ pháp trọng tâm: N + 입니다 / 입니까?
- **Ý nghĩa**: Là N / Có phải là N không? (Đuôi câu trang trọng)
- **Cách dùng**: Gắn trực tiếp vào sau danh từ để giới thiệu hoặc hỏi thông tin trong bối cảnh lịch sự, trang trọng.
- **Quy tắc chia**: Không phân biệt danh từ có hay không có Patchim: 학생 + 입니다 -> 학생입니다.
- **Ví dụ**: 저는 베트남 사람입니다. (Tôi là người Việt Nam.)',
        N'[{"ko":"저는 베트남 사람입니다.","roman":"","vi":"Tôi là người Việt Nam."}]',
        1,
        'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Grammar WHERE GrammarCode = N'GR_L1_01')
BEGIN
    INSERT INTO dbo.Grammar (
        GrammarCode, GrammarPattern, MeaningVi, UsageExplanation, ConjugationRule,
        ExampleKo, ExampleVi, TopikLevel, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'GR_L1_01', N'N + 입니다 / 입니까?', N'Là N / Có phải là N không? (Đuôi câu trang trọng)', N'Gắn trực tiếp vào sau danh từ để giới thiệu hoặc hỏi thông tin trong bối cảnh lịch sự, trang trọng.', N'Không phân biệt danh từ có hay không có Patchim: 학생 + 입니다 -> 학생입니다.',
        N'저는 베트남 사람입니다.', N'Tôi là người Việt Nam.', N'TOPIK I', @SourceUpenn, 0, 0, 'Published'
    );
END
DECLARE @Gr_GR_L1_01 INT = (SELECT TOP 1 GrammarId FROM dbo.Grammar WHERE GrammarCode = N'GR_L1_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonGrammar WHERE LessonId = @Les_L1_LESSON_01 AND GrammarId = @Gr_GR_L1_01)
BEGIN
    INSERT INTO dbo.LessonGrammar (LessonId, GrammarId, DisplayOrder)
    VALUES (@Les_L1_LESSON_01, @Gr_GR_L1_01, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'L1_LESSON_01_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (@Les_L1_LESSON_01, N'L1_LESSON_01_FINAL_EX', 'final_test', N'Kiểm tra cuối bài — Bài 1: Xin chào! Tôi là học viên Việt Nam (안녕하세요, 저는 베트남 학생입니다)', N'Đạt từ 80% trở lên để mở khóa bài tiếp theo.', 80, 300, 1, 'Published');
END
DECLARE @Ex_L1_LESSON_01 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'L1_LESSON_01_FINAL_EX');

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_L1_01_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (@Ex_L1_LESSON_01, N'Q_L1_01_1', 'multiple_choice', N'Điền tiểu từ thích hợp vào chỗ trống: "저___ 학생입니다." (Tôi là học sinh)', N'저___ 학생입니다.', N'저 không có Patchim nên đi với tiểu từ chủ đề 는 -> 저는.', 20, 1, 'Published');
END
DECLARE @Q_Q_L1_01_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_L1_01_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @Q_Q_L1_01_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_01_1, N'A', N'은', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_01_1, N'B', N'는', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_01_1, N'C', N'을', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_01_1, N'D', N'를', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_L1_01_2')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (@Ex_L1_LESSON_01, N'Q_L1_01_2', 'multiple_choice', N'Câu hỏi trang trọng của "학생입니다" (Là học sinh) là gì?', N'학생___?', N'Đuôi câu nghi vấn trang trọng của 입니다 là 입니까?.', 20, 2, 'Published');
END
DECLARE @Q_Q_L1_01_2 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_L1_01_2');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @Q_Q_L1_01_2)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_01_2, N'A', N'학생입니까?', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_01_2, N'B', N'학생이다?', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_01_2, N'C', N'학생을?', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_01_2, N'D', N'학생에서?', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L1_LESSON_01_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L1_LESSON_01, N'L1_LESSON_01_ACT_THEORY', 'theory', N'Lý thuyết & Ngữ pháp trọng tâm', N'Nắm vững cấu trúc ngữ pháp và ví dụ hội thoại.', 1, 1, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L1_LESSON_01_ACT_GRAMMAR')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L1_LESSON_01, N'L1_LESSON_01_ACT_GRAMMAR', 'grammar', N'Phân tích cấu trúc & Câu mẫu', N'Đối chiếu cách chia và ngữ cảnh sử dụng.', 1, 2, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L1_LESSON_01_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, ExerciseId, DisplayOrder, XpReward, Status)
    VALUES (@Les_L1_LESSON_01, N'L1_LESSON_01_ACT_QUIZ', 'final_test', N'Bài kiểm tra cuối buổi (Đạt >= 80%)', N'Vượt qua bài kiểm tra để hoàn thành buổi học.', 1, @Ex_L1_LESSON_01, 3, 50, 'Published');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'L1_LESSON_02')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @Top_TOPIC_L1_1, @Level_2, N'L1_LESSON_02', 2, N'Bài 2: Sinh hoạt hàng ngày & Địa điểm (일상생활과 장소)', N'Cách chia đuôi câu thân mật lịch sự -아요/어요 và tiểu từ chỉ hướng/địa điểm 에, 에서.',
        N'Chia đúng động từ/tính từ với -아요/어요 và phân biệt rõ 에 (đến/ở) với 에서 (làm gì tại đâu).', 30, 2, 'Published', 0, 0
    );
END
DECLARE @Les_L1_LESSON_02 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'L1_LESSON_02');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @Les_L1_LESSON_02)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@Les_L1_LESSON_02, 1, 1, 80, 1, 1);
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'L1_LESSON_02_SEC1')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @Les_L1_LESSON_02,
        N'L1_LESSON_02_SEC1',
        'theory',
        N'Kiến thức trọng tâm & Ngữ pháp: V/A + -아요 / -어요 / -해요',
        N'### Ngữ pháp trọng tâm: V/A + -아요 / -어요 / -해요
- **Ý nghĩa**: Đuôi câu trần thuật/nghi vấn lịch sự thân mật ở thì hiện tại
- **Cách dùng**: Gắn sau thân động từ hoặc tính từ. Nguyên âm ㅏ/ㅗ cộng -아요; nguyên âm khác cộng -어요; 하다 biến thành 해요.
- **Quy tắc chia**: 가다 -> 가요, 먹다 -> 먹어요, 공부하다 -> 공부해요.
- **Ví dụ**: 도서관에서 한국어를 공부해요. (Tôi học tiếng Hàn ở thư viện.)',
        N'[{"ko":"도서관에서 한국어를 공부해요.","roman":"","vi":"Tôi học tiếng Hàn ở thư viện."}]',
        1,
        'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Grammar WHERE GrammarCode = N'GR_L1_02')
BEGIN
    INSERT INTO dbo.Grammar (
        GrammarCode, GrammarPattern, MeaningVi, UsageExplanation, ConjugationRule,
        ExampleKo, ExampleVi, TopikLevel, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'GR_L1_02', N'V/A + -아요 / -어요 / -해요', N'Đuôi câu trần thuật/nghi vấn lịch sự thân mật ở thì hiện tại', N'Gắn sau thân động từ hoặc tính từ. Nguyên âm ㅏ/ㅗ cộng -아요; nguyên âm khác cộng -어요; 하다 biến thành 해요.', N'가다 -> 가요, 먹다 -> 먹어요, 공부하다 -> 공부해요.',
        N'도서관에서 한국어를 공부해요.', N'Tôi học tiếng Hàn ở thư viện.', N'TOPIK I', @SourceUpenn, 0, 0, 'Published'
    );
END
DECLARE @Gr_GR_L1_02 INT = (SELECT TOP 1 GrammarId FROM dbo.Grammar WHERE GrammarCode = N'GR_L1_02');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonGrammar WHERE LessonId = @Les_L1_LESSON_02 AND GrammarId = @Gr_GR_L1_02)
BEGIN
    INSERT INTO dbo.LessonGrammar (LessonId, GrammarId, DisplayOrder)
    VALUES (@Les_L1_LESSON_02, @Gr_GR_L1_02, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'L1_LESSON_02_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (@Les_L1_LESSON_02, N'L1_LESSON_02_FINAL_EX', 'final_test', N'Kiểm tra cuối bài — Bài 2: Sinh hoạt hàng ngày & Địa điểm (일상생활과 장소)', N'Đạt từ 80% trở lên để mở khóa bài tiếp theo.', 80, 300, 1, 'Published');
END
DECLARE @Ex_L1_LESSON_02 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'L1_LESSON_02_FINAL_EX');

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_L1_02_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (@Ex_L1_LESSON_02, N'Q_L1_02_1', 'multiple_choice', N'Động từ "먹다" (ăn) khi chia với đuôi -아요/어요 sẽ thành dạng nào?', N'먹다 + -아요/어요', N'Thân từ 먹 chứa nguyên âm ㅓ (khác ㅏ/ㅗ) nên cộng với -어요 -> 먹어요.', 20, 1, 'Published');
END
DECLARE @Q_Q_L1_02_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_L1_02_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @Q_Q_L1_02_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_02_1, N'A', N'먹아요', 0, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_02_1, N'B', N'먹어요', 1, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_02_1, N'C', N'먹해요', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_02_1, N'D', N'먹여요', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_L1_02_2')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (@Ex_L1_LESSON_02, N'Q_L1_02_2', 'multiple_choice', N'Chọn tiểu từ đúng: "학교___ 공부를 해요." (Học bài ở trường)', N'학교___ 공부를 해요.', N'Khi diễn tả hành động diễn ra tại một địa điểm, dùng tiểu từ 에서.', 20, 2, 'Published');
END
DECLARE @Q_Q_L1_02_2 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_L1_02_2');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @Q_Q_L1_02_2)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_02_2, N'A', N'에서', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_02_2, N'B', N'를', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_02_2, N'C', N'은', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_02_2, N'D', N'과', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L1_LESSON_02_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L1_LESSON_02, N'L1_LESSON_02_ACT_THEORY', 'theory', N'Lý thuyết & Ngữ pháp trọng tâm', N'Nắm vững cấu trúc ngữ pháp và ví dụ hội thoại.', 1, 1, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L1_LESSON_02_ACT_GRAMMAR')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L1_LESSON_02, N'L1_LESSON_02_ACT_GRAMMAR', 'grammar', N'Phân tích cấu trúc & Câu mẫu', N'Đối chiếu cách chia và ngữ cảnh sử dụng.', 1, 2, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L1_LESSON_02_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, ExerciseId, DisplayOrder, XpReward, Status)
    VALUES (@Les_L1_LESSON_02, N'L1_LESSON_02_ACT_QUIZ', 'final_test', N'Bài kiểm tra cuối buổi (Đạt >= 80%)', N'Vượt qua bài kiểm tra để hoàn thành buổi học.', 1, @Ex_L1_LESSON_02, 3, 50, 'Published');
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L1_2')
BEGIN
    INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
    VALUES (@Level_2, N'TOPIC_L1_2', N'Chủ đề 2: Mua sắm, Thời gian & Ẩm thực (쇼핑과 음식)', N'Số Thuần Hàn, số Hán Hàn, hỏi giá cả, thời gian và gọi món tại nhà hàng.', 2, 'Published');
END
DECLARE @Top_TOPIC_L1_2 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L1_2');

IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'L1_LESSON_03')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @Top_TOPIC_L1_2, @Level_2, N'L1_LESSON_03', 3, N'Bài 3: Cho tôi 2 phần Kimbap (김밥 두 줄 주세요)', N'Cấu trúc yêu cầu N + 주세요, danh từ chỉ đơn vị (개, 명, 잔, 병) và số đếm.',
        N'Sử dụng thành thạo số đếm và cấu trúc N 주세요 khi mua sắm và gọi món.', 30, 3, 'Published', 0, 0
    );
END
DECLARE @Les_L1_LESSON_03 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'L1_LESSON_03');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @Les_L1_LESSON_03)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@Les_L1_LESSON_03, 1, 1, 80, 1, 1);
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'L1_LESSON_03_SEC1')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @Les_L1_LESSON_03,
        N'L1_LESSON_03_SEC1',
        'theory',
        N'Kiến thức trọng tâm & Ngữ pháp: N + 주세요',
        N'### Ngữ pháp trọng tâm: N + 주세요
- **Ý nghĩa**: Làm ơn cho tôi N
- **Cách dùng**: Dùng khi yêu cầu hoặc gọi món tại cửa hàng, quán ăn.
- **Quy tắc chia**: Danh từ + 주세요 (예: 물 주세요, 커피 한 잔 주세요).
- **Ví dụ**: 사과 세 개하고 우유 한 병 주세요. (Làm ơn cho tôi 3 quả táo và 1 chai sữa.)',
        N'[{"ko":"사과 세 개하고 우유 한 병 주세요.","roman":"","vi":"Làm ơn cho tôi 3 quả táo và 1 chai sữa."}]',
        1,
        'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Grammar WHERE GrammarCode = N'GR_L1_03')
BEGIN
    INSERT INTO dbo.Grammar (
        GrammarCode, GrammarPattern, MeaningVi, UsageExplanation, ConjugationRule,
        ExampleKo, ExampleVi, TopikLevel, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'GR_L1_03', N'N + 주세요', N'Làm ơn cho tôi N', N'Dùng khi yêu cầu hoặc gọi món tại cửa hàng, quán ăn.', N'Danh từ + 주세요 (예: 물 주세요, 커피 한 잔 주세요).',
        N'사과 세 개하고 우유 한 병 주세요.', N'Làm ơn cho tôi 3 quả táo và 1 chai sữa.', N'TOPIK I', @SourceUpenn, 0, 0, 'Published'
    );
END
DECLARE @Gr_GR_L1_03 INT = (SELECT TOP 1 GrammarId FROM dbo.Grammar WHERE GrammarCode = N'GR_L1_03');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonGrammar WHERE LessonId = @Les_L1_LESSON_03 AND GrammarId = @Gr_GR_L1_03)
BEGIN
    INSERT INTO dbo.LessonGrammar (LessonId, GrammarId, DisplayOrder)
    VALUES (@Les_L1_LESSON_03, @Gr_GR_L1_03, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'L1_LESSON_03_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (@Les_L1_LESSON_03, N'L1_LESSON_03_FINAL_EX', 'final_test', N'Kiểm tra cuối bài — Bài 3: Cho tôi 2 phần Kimbap (김밥 두 줄 주세요)', N'Đạt từ 80% trở lên để mở khóa bài tiếp theo.', 80, 300, 1, 'Published');
END
DECLARE @Ex_L1_LESSON_03 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'L1_LESSON_03_FINAL_EX');

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_L1_03_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (@Ex_L1_LESSON_03, N'Q_L1_03_1', 'multiple_choice', N'Câu "물 주세요" có nghĩa là gì?', N'물 주세요', N'물 (nước) + 주세요 (làm ơn cho tôi) = Làm ơn cho tôi nước.', 20, 1, 'Published');
END
DECLARE @Q_Q_L1_03_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_L1_03_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @Q_Q_L1_03_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_03_1, N'A', N'Làm ơn cho tôi nước', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_03_1, N'B', N'Nước rất ngon', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_03_1, N'C', N'Tôi không uống nước', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L1_03_1, N'D', N'Nước giá bao nhiêu?', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L1_LESSON_03_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L1_LESSON_03, N'L1_LESSON_03_ACT_THEORY', 'theory', N'Lý thuyết & Ngữ pháp trọng tâm', N'Nắm vững cấu trúc ngữ pháp và ví dụ hội thoại.', 1, 1, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L1_LESSON_03_ACT_GRAMMAR')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L1_LESSON_03, N'L1_LESSON_03_ACT_GRAMMAR', 'grammar', N'Phân tích cấu trúc & Câu mẫu', N'Đối chiếu cách chia và ngữ cảnh sử dụng.', 1, 2, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L1_LESSON_03_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, ExerciseId, DisplayOrder, XpReward, Status)
    VALUES (@Les_L1_LESSON_03, N'L1_LESSON_03_ACT_QUIZ', 'final_test', N'Bài kiểm tra cuối buổi (Đạt >= 80%)', N'Vượt qua bài kiểm tra để hoàn thành buổi học.', 1, @Ex_L1_LESSON_03, 3, 50, 'Published');
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningLevels WHERE LevelCode = N'LEVEL_2_ELEM2')
BEGIN
    INSERT INTO dbo.LearningLevels (
        PathId, LevelCode, BadgeText, BadgeColor, Title, TopikLevel,
        TextbookName, Description, SkillTagsJson, DisplayOrder, Status
    ) VALUES (
        @PathId, N'LEVEL_2_ELEM2', N'2급', N'sky', N'Sơ cấp 2', N'TOPIK I',
        N'You Speak Korean! Book 2 & NIKL A-B', N'Mở rộng vốn từ, ngữ pháp sơ cấp nâng cao, kính ngữ, thời tiết, du lịch và hội thoại tình huống.', N'["Từ vựng","Ngữ pháp","Luyện đề","Ôn tập & kiểm tra"]', 3, 'Published'
    );
END
DECLARE @Level_3 INT = (SELECT TOP 1 LevelId FROM dbo.LearningLevels WHERE LevelCode = N'LEVEL_2_ELEM2');
IF NOT EXISTS (SELECT 1 FROM dbo.LevelUnlockRules WHERE LevelId = @Level_3)
BEGIN
    INSERT INTO dbo.LevelUnlockRules (LevelId, PrerequisiteLevelId, RequiredCompletedLessonsPercent, MinAverageQuizScorePercent, IsDefaultUnlocked)
    VALUES (@Level_3, @Level_2, 100, 80, 0);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L2_1')
BEGIN
    INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
    VALUES (@Level_3, N'TOPIC_L2_1', N'Chủ đề 1: Kế hoạch, Kinh nghiệm & Du lịch (여행과 경험)', N'Biểu hiện mong muốn -고 싶다, dự định -(으)ㄹ 거예요 và kinh nghiệm -(으)ㄴ 적이 있다.', 1, 'Published');
END
DECLARE @Top_TOPIC_L2_1 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L2_1');

IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'L2_LESSON_01')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @Top_TOPIC_L2_1, @Level_3, N'L2_LESSON_01', 1, N'Bài 1: Kỳ nghỉ này tôi định đi đảo Jeju (방학에 제주도에 갈 거예요)', N'Thì tương lai dự định -(으)ㄹ 거예요 và biểu hiện mong muốn -고 싶다.',
        N'Trình bày kế hoạch tương lai và mong muốn cá nhân bằng tiếng Hàn.', 30, 1, 'Published', 0, 0
    );
END
DECLARE @Les_L2_LESSON_01 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'L2_LESSON_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @Les_L2_LESSON_01)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@Les_L2_LESSON_01, 1, 1, 80, 1, 1);
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'L2_LESSON_01_SEC1')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @Les_L2_LESSON_01,
        N'L2_LESSON_01_SEC1',
        'theory',
        N'Kiến thức trọng tâm & Ngữ pháp: V + -고 싶다',
        N'### Ngữ pháp trọng tâm: V + -고 싶다
- **Ý nghĩa**: Muốn làm V
- **Cách dùng**: Gắn vào sau thân động từ để bày tỏ mong muốn, nguyện vọng của người nói.
- **Quy tắc chia**: Không phân biệt Patchim: 가다 -> 가고 싶다, 먹다 -> 먹고 싶다.
- **Ví dụ**: 방학에 제주도로 여행하고 싶어요. (Tôi muốn đi du lịch đảo Jeju vào kỳ nghỉ.)',
        N'[{"ko":"방학에 제주도로 여행하고 싶어요.","roman":"","vi":"Tôi muốn đi du lịch đảo Jeju vào kỳ nghỉ."}]',
        1,
        'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Grammar WHERE GrammarCode = N'GR_L2_01')
BEGIN
    INSERT INTO dbo.Grammar (
        GrammarCode, GrammarPattern, MeaningVi, UsageExplanation, ConjugationRule,
        ExampleKo, ExampleVi, TopikLevel, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'GR_L2_01', N'V + -고 싶다', N'Muốn làm V', N'Gắn vào sau thân động từ để bày tỏ mong muốn, nguyện vọng của người nói.', N'Không phân biệt Patchim: 가다 -> 가고 싶다, 먹다 -> 먹고 싶다.',
        N'방학에 제주도로 여행하고 싶어요.', N'Tôi muốn đi du lịch đảo Jeju vào kỳ nghỉ.', N'TOPIK I', @SourceUpenn, 0, 0, 'Published'
    );
END
DECLARE @Gr_GR_L2_01 INT = (SELECT TOP 1 GrammarId FROM dbo.Grammar WHERE GrammarCode = N'GR_L2_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonGrammar WHERE LessonId = @Les_L2_LESSON_01 AND GrammarId = @Gr_GR_L2_01)
BEGIN
    INSERT INTO dbo.LessonGrammar (LessonId, GrammarId, DisplayOrder)
    VALUES (@Les_L2_LESSON_01, @Gr_GR_L2_01, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'L2_LESSON_01_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (@Les_L2_LESSON_01, N'L2_LESSON_01_FINAL_EX', 'final_test', N'Kiểm tra cuối bài — Bài 1: Kỳ nghỉ này tôi định đi đảo Jeju (방학에 제주도에 갈 거예요)', N'Đạt từ 80% trở lên để mở khóa bài tiếp theo.', 80, 300, 1, 'Published');
END
DECLARE @Ex_L2_LESSON_01 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'L2_LESSON_01_FINAL_EX');

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_L2_01_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (@Ex_L2_LESSON_01, N'Q_L2_01_1', 'multiple_choice', N'Để nói "Tôi muốn xem phim", ta chọn câu nào đúng ngữ pháp?', N'보다 (xem) + -고 싶다', N'영화를 보다 -> 영화를 보고 싶어요.', 20, 1, 'Published');
END
DECLARE @Q_Q_L2_01_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_L2_01_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @Q_Q_L2_01_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L2_01_1, N'A', N'영화를 보고 싶어요.', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L2_01_1, N'B', N'영화를 봐고 싶어요.', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L2_01_1, N'C', N'영화를 보은 싶어요.', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L2_01_1, N'D', N'영화를 볼 싶어요.', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L2_LESSON_01_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L2_LESSON_01, N'L2_LESSON_01_ACT_THEORY', 'theory', N'Lý thuyết & Ngữ pháp trọng tâm', N'Nắm vững cấu trúc ngữ pháp và ví dụ hội thoại.', 1, 1, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L2_LESSON_01_ACT_GRAMMAR')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L2_LESSON_01, N'L2_LESSON_01_ACT_GRAMMAR', 'grammar', N'Phân tích cấu trúc & Câu mẫu', N'Đối chiếu cách chia và ngữ cảnh sử dụng.', 1, 2, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L2_LESSON_01_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, ExerciseId, DisplayOrder, XpReward, Status)
    VALUES (@Les_L2_LESSON_01, N'L2_LESSON_01_ACT_QUIZ', 'final_test', N'Bài kiểm tra cuối buổi (Đạt >= 80%)', N'Vượt qua bài kiểm tra để hoàn thành buổi học.', 1, @Ex_L2_LESSON_01, 3, 50, 'Published');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'L2_LESSON_02')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @Top_TOPIC_L2_1, @Level_3, N'L2_LESSON_02', 2, N'Bài 2: Cuộc hẹn & Lý do (약속과 이유)', N'Liên từ chỉ nguyên nhân -아서/어서 và cấu trúc rủ rê -(으)ㄹ까요?.',
        N'Đặt lịch hẹn, nêu lý do từ chối lịch sự và đề xuất hoạt động chung.', 30, 2, 'Published', 0, 0
    );
END
DECLARE @Les_L2_LESSON_02 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'L2_LESSON_02');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @Les_L2_LESSON_02)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@Les_L2_LESSON_02, 1, 1, 80, 1, 1);
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'L2_LESSON_02_SEC1')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @Les_L2_LESSON_02,
        N'L2_LESSON_02_SEC1',
        'theory',
        N'Kiến thức trọng tâm & Ngữ pháp: V/A + -아서 / -어서 / -해서',
        N'### Ngữ pháp trọng tâm: V/A + -아서 / -어서 / -해서
- **Ý nghĩa**: Vì ... nên ... / Làm V1 rồi làm V2
- **Cách dùng**: Biểu thị nguyên nhân - kết quả hoặc trình tự hai hành động có liên hệ chặt chẽ.
- **Quy tắc chia**: 바쁘다 -> 바빠서, 늦다 -> 늦어서, 피곤하다 -> 피곤해서.
- **Ví dụ**: 비가 와서 집에 있었어요. (Vì trời mưa nên tôi đã ở nhà.)',
        N'[{"ko":"비가 와서 집에 있었어요.","roman":"","vi":"Vì trời mưa nên tôi đã ở nhà."}]',
        1,
        'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Grammar WHERE GrammarCode = N'GR_L2_02')
BEGIN
    INSERT INTO dbo.Grammar (
        GrammarCode, GrammarPattern, MeaningVi, UsageExplanation, ConjugationRule,
        ExampleKo, ExampleVi, TopikLevel, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'GR_L2_02', N'V/A + -아서 / -어서 / -해서', N'Vì ... nên ... / Làm V1 rồi làm V2', N'Biểu thị nguyên nhân - kết quả hoặc trình tự hai hành động có liên hệ chặt chẽ.', N'바쁘다 -> 바빠서, 늦다 -> 늦어서, 피곤하다 -> 피곤해서.',
        N'비가 와서 집에 있었어요.', N'Vì trời mưa nên tôi đã ở nhà.', N'TOPIK I', @SourceUpenn, 0, 0, 'Published'
    );
END
DECLARE @Gr_GR_L2_02 INT = (SELECT TOP 1 GrammarId FROM dbo.Grammar WHERE GrammarCode = N'GR_L2_02');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonGrammar WHERE LessonId = @Les_L2_LESSON_02 AND GrammarId = @Gr_GR_L2_02)
BEGIN
    INSERT INTO dbo.LessonGrammar (LessonId, GrammarId, DisplayOrder)
    VALUES (@Les_L2_LESSON_02, @Gr_GR_L2_02, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'L2_LESSON_02_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (@Les_L2_LESSON_02, N'L2_LESSON_02_FINAL_EX', 'final_test', N'Kiểm tra cuối bài — Bài 2: Cuộc hẹn & Lý do (약속과 이유)', N'Đạt từ 80% trở lên để mở khóa bài tiếp theo.', 80, 300, 1, 'Published');
END
DECLARE @Ex_L2_LESSON_02 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'L2_LESSON_02_FINAL_EX');

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_L2_02_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (@Ex_L2_LESSON_02, N'Q_L2_02_1', 'multiple_choice', N'Tính từ "바쁘다" (bận rộn) khi kết hợp với -아서/어서 biến đổi thành gì?', N'바쁘다 + -아서/어서', N'Bất quy tắc ㅡ: bỏ ㅡ, nguyên âm trước là ㅏ nên cộng -아서 -> 바빠서.', 20, 1, 'Published');
END
DECLARE @Q_Q_L2_02_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_L2_02_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @Q_Q_L2_02_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L2_02_1, N'A', N'바빠서', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L2_02_1, N'B', N'바뻐서', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L2_02_1, N'C', N'바쁘아서', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L2_02_1, N'D', N'바쁘해서', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L2_LESSON_02_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L2_LESSON_02, N'L2_LESSON_02_ACT_THEORY', 'theory', N'Lý thuyết & Ngữ pháp trọng tâm', N'Nắm vững cấu trúc ngữ pháp và ví dụ hội thoại.', 1, 1, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L2_LESSON_02_ACT_GRAMMAR')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L2_LESSON_02, N'L2_LESSON_02_ACT_GRAMMAR', 'grammar', N'Phân tích cấu trúc & Câu mẫu', N'Đối chiếu cách chia và ngữ cảnh sử dụng.', 1, 2, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L2_LESSON_02_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, ExerciseId, DisplayOrder, XpReward, Status)
    VALUES (@Les_L2_LESSON_02, N'L2_LESSON_02_ACT_QUIZ', 'final_test', N'Bài kiểm tra cuối buổi (Đạt >= 80%)', N'Vượt qua bài kiểm tra để hoàn thành buổi học.', 1, @Ex_L2_LESSON_02, 3, 50, 'Published');
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningLevels WHERE LevelCode = N'LEVEL_3_INTER1')
BEGIN
    INSERT INTO dbo.LearningLevels (
        PathId, LevelCode, BadgeText, BadgeColor, Title, TopikLevel,
        TextbookName, Description, SkillTagsJson, DisplayOrder, Status
    ) VALUES (
        @PathId, N'LEVEL_3_INTER1', N'3급', N'amber', N'Trung cấp 1', N'TOPIK II',
        N'You Speak Korean! Book 3, NIKL B & Tatoeba', N'Đọc hiểu đoạn văn, ngữ pháp trung cấp, câu gián tiếp và sắc thái lịch sự.', N'["Từ vựng","Ngữ pháp","Luyện đề","Ôn tập & kiểm tra"]', 4, 'Published'
    );
END
DECLARE @Level_4 INT = (SELECT TOP 1 LevelId FROM dbo.LearningLevels WHERE LevelCode = N'LEVEL_3_INTER1');
IF NOT EXISTS (SELECT 1 FROM dbo.LevelUnlockRules WHERE LevelId = @Level_4)
BEGIN
    INSERT INTO dbo.LevelUnlockRules (LevelId, PrerequisiteLevelId, RequiredCompletedLessonsPercent, MinAverageQuizScorePercent, IsDefaultUnlocked)
    VALUES (@Level_4, @Level_3, 100, 80, 0);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L3_1')
BEGIN
    INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
    VALUES (@Level_4, N'TOPIC_L3_1', N'Chủ đề 1: Đời sống học đường & Công sở (대학 생활과 직장)', N'Biểu hiện biến đổi trạng thái -게 되다, lời khuyên -(으)면 좋겠다 và trích dẫn gián tiếp.', 1, 'Published');
END
DECLARE @Top_TOPIC_L3_1 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L3_1');

IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'L3_LESSON_01')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @Top_TOPIC_L3_1, @Level_4, N'L3_LESSON_01', 1, N'Bài 1: Thích nghi môi trường mới (새로운 환경에 적응하게 되었어요)', N'Cấu trúc chỉ sự thay đổi hoàn cảnh V-게 되다 và từ vựng TOPIK II cấp 3.',
        N'Sử dụng V-게 되다 để diễn tả kết quả hoặc sự chuyển biến khách quan.', 30, 1, 'Published', 0, 0
    );
END
DECLARE @Les_L3_LESSON_01 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'L3_LESSON_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @Les_L3_LESSON_01)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@Les_L3_LESSON_01, 1, 1, 80, 1, 1);
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'L3_LESSON_01_SEC1')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @Les_L3_LESSON_01,
        N'L3_LESSON_01_SEC1',
        'theory',
        N'Kiến thức trọng tâm & Ngữ pháp: V + -게 되다',
        N'### Ngữ pháp trọng tâm: V + -게 되다
- **Ý nghĩa**: Trở nên / Được (hoặc phải) làm gì do hoàn cảnh khách quan
- **Cách dùng**: Diễn tả một sự thay đổi trạng thái hoặc quyết định xảy ra do tác động bên ngoài.
- **Quy tắc chia**: Gắn trực tiếp -게 되다 sau thân động từ: 알게 되다, 일하게 되다.
- **Ví dụ**: 한국 회사에서 일하게 되었어요. (Tôi đã được vào làm việc tại một công ty Hàn Quốc.)',
        N'[{"ko":"한국 회사에서 일하게 되었어요.","roman":"","vi":"Tôi đã được vào làm việc tại một công ty Hàn Quốc."}]',
        1,
        'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Grammar WHERE GrammarCode = N'GR_L3_01')
BEGIN
    INSERT INTO dbo.Grammar (
        GrammarCode, GrammarPattern, MeaningVi, UsageExplanation, ConjugationRule,
        ExampleKo, ExampleVi, TopikLevel, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'GR_L3_01', N'V + -게 되다', N'Trở nên / Được (hoặc phải) làm gì do hoàn cảnh khách quan', N'Diễn tả một sự thay đổi trạng thái hoặc quyết định xảy ra do tác động bên ngoài.', N'Gắn trực tiếp -게 되다 sau thân động từ: 알게 되다, 일하게 되다.',
        N'한국 회사에서 일하게 되었어요.', N'Tôi đã được vào làm việc tại một công ty Hàn Quốc.', N'TOPIK II', @SourceUpenn, 0, 0, 'Published'
    );
END
DECLARE @Gr_GR_L3_01 INT = (SELECT TOP 1 GrammarId FROM dbo.Grammar WHERE GrammarCode = N'GR_L3_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonGrammar WHERE LessonId = @Les_L3_LESSON_01 AND GrammarId = @Gr_GR_L3_01)
BEGIN
    INSERT INTO dbo.LessonGrammar (LessonId, GrammarId, DisplayOrder)
    VALUES (@Les_L3_LESSON_01, @Gr_GR_L3_01, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'L3_LESSON_01_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (@Les_L3_LESSON_01, N'L3_LESSON_01_FINAL_EX', 'final_test', N'Kiểm tra cuối bài — Bài 1: Thích nghi môi trường mới (새로운 환경에 적응하게 되었어요)', N'Đạt từ 80% trở lên để mở khóa bài tiếp theo.', 80, 300, 1, 'Published');
END
DECLARE @Ex_L3_LESSON_01 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'L3_LESSON_01_FINAL_EX');

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_L3_01_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (@Ex_L3_LESSON_01, N'Q_L3_01_1', 'multiple_choice', N'Cấu trúc "V + -게 되다" dùng để diễn tả ý nghĩa nào sau đây?', N'한국어를 좋아하게 되었어요.', N'V + -게 되다 diễn tả sự thay đổi trạng thái hoặc kết quả dẫn đến do hoàn cảnh.', 20, 1, 'Published');
END
DECLARE @Q_Q_L3_01_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_L3_01_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @Q_Q_L3_01_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L3_01_1, N'A', N'Sự thay đổi trạng thái hoặc hoàn cảnh dẫn đến hành động', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L3_01_1, N'B', N'Sự cấm đoán tuyệt đối', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L3_01_1, N'C', N'Hành động đang diễn ra ngay lúc nói', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L3_01_1, N'D', N'Sự hối tiếc về quá khứ', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L3_LESSON_01_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L3_LESSON_01, N'L3_LESSON_01_ACT_THEORY', 'theory', N'Lý thuyết & Ngữ pháp trọng tâm', N'Nắm vững cấu trúc ngữ pháp và ví dụ hội thoại.', 1, 1, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L3_LESSON_01_ACT_GRAMMAR')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L3_LESSON_01, N'L3_LESSON_01_ACT_GRAMMAR', 'grammar', N'Phân tích cấu trúc & Câu mẫu', N'Đối chiếu cách chia và ngữ cảnh sử dụng.', 1, 2, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L3_LESSON_01_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, ExerciseId, DisplayOrder, XpReward, Status)
    VALUES (@Les_L3_LESSON_01, N'L3_LESSON_01_ACT_QUIZ', 'final_test', N'Bài kiểm tra cuối buổi (Đạt >= 80%)', N'Vượt qua bài kiểm tra để hoàn thành buổi học.', 1, @Ex_L3_LESSON_01, 3, 50, 'Published');
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningLevels WHERE LevelCode = N'LEVEL_4_INTER2')
BEGIN
    INSERT INTO dbo.LearningLevels (
        PathId, LevelCode, BadgeText, BadgeColor, Title, TopikLevel,
        TextbookName, Description, SkillTagsJson, DisplayOrder, Status
    ) VALUES (
        @PathId, N'LEVEL_4_INTER2', N'4급', N'violet', N'Trung cấp 2', N'TOPIK II',
        N'You Speak Korean! Book 4, NIKL B-C & Tatoeba', N'Văn viết, tin tức cơ bản, biểu đồ câu 53 TOPIK II và ngữ pháp nâng cao dần.', N'["Từ vựng","Ngữ pháp","Luyện đề","Ôn tập & kiểm tra"]', 5, 'Published'
    );
END
DECLARE @Level_5 INT = (SELECT TOP 1 LevelId FROM dbo.LearningLevels WHERE LevelCode = N'LEVEL_4_INTER2');
IF NOT EXISTS (SELECT 1 FROM dbo.LevelUnlockRules WHERE LevelId = @Level_5)
BEGIN
    INSERT INTO dbo.LevelUnlockRules (LevelId, PrerequisiteLevelId, RequiredCompletedLessonsPercent, MinAverageQuizScorePercent, IsDefaultUnlocked)
    VALUES (@Level_5, @Level_4, 100, 80, 0);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L4_1')
BEGIN
    INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
    VALUES (@Level_5, N'TOPIC_L4_1', N'Chủ đề 1: Văn hóa, Truyền thông & Phân tích biểu đồ (문화와 언론)', N'Ngữ pháp nguyên nhân khách quan -(으)로 인해 và mẫu câu mô tả số liệu TOPIK II Viết câu 53.', 1, 'Published');
END
DECLARE @Top_TOPIC_L4_1 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L4_1');

IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'L4_LESSON_01')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @Top_TOPIC_L4_1, @Level_5, N'L4_LESSON_01', 1, N'Bài 1: Phân tích xu hướng tiêu dùng & Biểu đồ (소비 변화와 그래프 분석)', N'Cấu trúc N-(으)로 인해 và từ vựng tăng/giảm số liệu (증가하다, 감소하다, 차지하다).',
        N'Viết được đoạn văn 200–300 chữ phân tích biểu đồ theo chuẩn TOPIK II câu 53.', 30, 1, 'Published', 0, 0
    );
END
DECLARE @Les_L4_LESSON_01 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'L4_LESSON_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @Les_L4_LESSON_01)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@Les_L4_LESSON_01, 1, 1, 80, 1, 1);
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'L4_LESSON_01_SEC1')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @Les_L4_LESSON_01,
        N'L4_LESSON_01_SEC1',
        'theory',
        N'Kiến thức trọng tâm & Ngữ pháp: N + -(으)로 인해(서)',
        N'### Ngữ pháp trọng tâm: N + -(으)로 인해(서)
- **Ý nghĩa**: Do, bởi vì N (dùng trong văn viết và tin tức)
- **Cách dùng**: Biểu thị nguyên nhân mang tính xã hội, khách quan trong văn bản báo chí hoặc bài viết học thuật.
- **Quy tắc chia**: Danh từ có Patchim (trừ ㄹ) + -으로 인해; không có Patchim hoặc Patchim ㄹ + -로 인해.
- **Ví dụ**: 기술 발전으로 인해 생활이 편리해졌다. (Do sự phát triển công nghệ nên cuộc sống đã trở nên tiện lợi hơn.)',
        N'[{"ko":"기술 발전으로 인해 생활이 편리해졌다.","roman":"","vi":"Do sự phát triển công nghệ nên cuộc sống đã trở nên tiện lợi hơn."}]',
        1,
        'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Grammar WHERE GrammarCode = N'GR_L4_01')
BEGIN
    INSERT INTO dbo.Grammar (
        GrammarCode, GrammarPattern, MeaningVi, UsageExplanation, ConjugationRule,
        ExampleKo, ExampleVi, TopikLevel, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'GR_L4_01', N'N + -(으)로 인해(서)', N'Do, bởi vì N (dùng trong văn viết và tin tức)', N'Biểu thị nguyên nhân mang tính xã hội, khách quan trong văn bản báo chí hoặc bài viết học thuật.', N'Danh từ có Patchim (trừ ㄹ) + -으로 인해; không có Patchim hoặc Patchim ㄹ + -로 인해.',
        N'기술 발전으로 인해 생활이 편리해졌다.', N'Do sự phát triển công nghệ nên cuộc sống đã trở nên tiện lợi hơn.', N'TOPIK II', @SourceUpenn, 0, 0, 'Published'
    );
END
DECLARE @Gr_GR_L4_01 INT = (SELECT TOP 1 GrammarId FROM dbo.Grammar WHERE GrammarCode = N'GR_L4_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonGrammar WHERE LessonId = @Les_L4_LESSON_01 AND GrammarId = @Gr_GR_L4_01)
BEGIN
    INSERT INTO dbo.LessonGrammar (LessonId, GrammarId, DisplayOrder)
    VALUES (@Les_L4_LESSON_01, @Gr_GR_L4_01, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'L4_LESSON_01_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (@Les_L4_LESSON_01, N'L4_LESSON_01_FINAL_EX', 'final_test', N'Kiểm tra cuối bài — Bài 1: Phân tích xu hướng tiêu dùng & Biểu đồ (소비 변화와 그래프 분석)', N'Đạt từ 80% trở lên để mở khóa bài tiếp theo.', 80, 300, 1, 'Published');
END
DECLARE @Ex_L4_LESSON_01 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'L4_LESSON_01_FINAL_EX');

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_L4_01_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (@Ex_L4_LESSON_01, N'Q_L4_01_1', 'multiple_choice', N'Từ vựng nào thường dùng để diễn tả "tăng lên" trong bài viết phân tích biểu đồ TOPIK II?', N'매출이 크게 ___했다.', N'증가하다 là tăng lên; 감소하다 là giảm xuống.', 20, 1, 'Published');
END
DECLARE @Q_Q_L4_01_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_L4_01_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @Q_Q_L4_01_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L4_01_1, N'A', N'증가하다', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L4_01_1, N'B', N'감소하다', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L4_01_1, N'C', N'포기하다', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L4_01_1, N'D', N'거절하다', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L4_LESSON_01_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L4_LESSON_01, N'L4_LESSON_01_ACT_THEORY', 'theory', N'Lý thuyết & Ngữ pháp trọng tâm', N'Nắm vững cấu trúc ngữ pháp và ví dụ hội thoại.', 1, 1, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L4_LESSON_01_ACT_GRAMMAR')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L4_LESSON_01, N'L4_LESSON_01_ACT_GRAMMAR', 'grammar', N'Phân tích cấu trúc & Câu mẫu', N'Đối chiếu cách chia và ngữ cảnh sử dụng.', 1, 2, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L4_LESSON_01_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, ExerciseId, DisplayOrder, XpReward, Status)
    VALUES (@Les_L4_LESSON_01, N'L4_LESSON_01_ACT_QUIZ', 'final_test', N'Bài kiểm tra cuối buổi (Đạt >= 80%)', N'Vượt qua bài kiểm tra để hoàn thành buổi học.', 1, @Ex_L4_LESSON_01, 3, 50, 'Published');
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningLevels WHERE LevelCode = N'LEVEL_5_ADV1')
BEGIN
    INSERT INTO dbo.LearningLevels (
        PathId, LevelCode, BadgeText, BadgeColor, Title, TopikLevel,
        TextbookName, Description, SkillTagsJson, DisplayOrder, Status
    ) VALUES (
        @PathId, N'LEVEL_5_ADV1', N'5급', N'rose', N'Cao cấp 1', N'TOPIK II',
        N'NIKL C & HANGO Học thuật', N'Từ vựng học thuật, văn phong trang trọng, nghị luận câu 54 và chủ đề xã hội.', N'["Từ vựng","Ngữ pháp","Luyện đề","Ôn tập & kiểm tra"]', 6, 'Published'
    );
END
DECLARE @Level_6 INT = (SELECT TOP 1 LevelId FROM dbo.LearningLevels WHERE LevelCode = N'LEVEL_5_ADV1');
IF NOT EXISTS (SELECT 1 FROM dbo.LevelUnlockRules WHERE LevelId = @Level_6)
BEGIN
    INSERT INTO dbo.LevelUnlockRules (LevelId, PrerequisiteLevelId, RequiredCompletedLessonsPercent, MinAverageQuizScorePercent, IsDefaultUnlocked)
    VALUES (@Level_6, @Level_5, 100, 80, 0);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L5_1')
BEGIN
    INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
    VALUES (@Level_6, N'TOPIC_L5_1', N'Chủ đề 1: Kinh tế, Môi trường & Nghị luận xã hội (경제와 환경 논술)', N'Ngữ pháp học thuật -는 바이다, -(으)ㄹ 따름이다 và lập luận đa chiều.', 1, 'Published');
END
DECLARE @Top_TOPIC_L5_1 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L5_1');

IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'L5_LESSON_01')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @Top_TOPIC_L5_1, @Level_6, N'L5_LESSON_01', 1, N'Bài 1: Phát triển bền vững và Bảo vệ môi trường (지속 가능한 발전과 환경 보호)', N'Từ vựng học thuật NIKL C và cấu trúc nhấn mạnh điều kiện N-에 달려 있다.',
        N'Đọc hiểu văn bản nghị luận xã hội và sử dụng cấu trúc N-에 달려 있다.', 30, 1, 'Published', 1, 1
    );
END
DECLARE @Les_L5_LESSON_01 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'L5_LESSON_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @Les_L5_LESSON_01)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@Les_L5_LESSON_01, 1, 1, 80, 1, 1);
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'L5_LESSON_01_SEC1')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @Les_L5_LESSON_01,
        N'L5_LESSON_01_SEC1',
        'theory',
        N'Kiến thức trọng tâm & Ngữ pháp: N + -에 달려 있다',
        N'### Ngữ pháp trọng tâm: N + -에 달려 있다
- **Ý nghĩa**: Phụ thuộc vào N / Tùy thuộc vào N
- **Cách dùng**: Nhấn mạnh kết quả của một vấn đề phụ thuộc hoàn toàn vào yếu tố N đứng trước.
- **Quy tắc chia**: Danh từ + -에 달려 있다 (예: 성공은 노력에 달려 있다).
- **Ví dụ**: 환경 보호의 성공은 시민들의 의식에 달려 있다. (Sự thành công của việc bảo vệ môi trường phụ thuộc vào ý thức của người dân.)',
        N'[{"ko":"환경 보호의 성공은 시민들의 의식에 달려 있다.","roman":"","vi":"Sự thành công của việc bảo vệ môi trường phụ thuộc vào ý thức của người dân."}]',
        1,
        'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Grammar WHERE GrammarCode = N'GR_L5_01')
BEGIN
    INSERT INTO dbo.Grammar (
        GrammarCode, GrammarPattern, MeaningVi, UsageExplanation, ConjugationRule,
        ExampleKo, ExampleVi, TopikLevel, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'GR_L5_01', N'N + -에 달려 있다', N'Phụ thuộc vào N / Tùy thuộc vào N', N'Nhấn mạnh kết quả của một vấn đề phụ thuộc hoàn toàn vào yếu tố N đứng trước.', N'Danh từ + -에 달려 있다 (예: 성공은 노력에 달려 있다).',
        N'환경 보호의 성공은 시민들의 의식에 달려 있다.', N'Sự thành công của việc bảo vệ môi trường phụ thuộc vào ý thức của người dân.', N'TOPIK II', @SourceUpenn, 1, 1, 'Published'
    );
END
DECLARE @Gr_GR_L5_01 INT = (SELECT TOP 1 GrammarId FROM dbo.Grammar WHERE GrammarCode = N'GR_L5_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonGrammar WHERE LessonId = @Les_L5_LESSON_01 AND GrammarId = @Gr_GR_L5_01)
BEGIN
    INSERT INTO dbo.LessonGrammar (LessonId, GrammarId, DisplayOrder)
    VALUES (@Les_L5_LESSON_01, @Gr_GR_L5_01, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'L5_LESSON_01_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (@Les_L5_LESSON_01, N'L5_LESSON_01_FINAL_EX', 'final_test', N'Kiểm tra cuối bài — Bài 1: Phát triển bền vững và Bảo vệ môi trường (지속 가능한 발전과 환경 보호)', N'Đạt từ 80% trở lên để mở khóa bài tiếp theo.', 80, 300, 1, 'Published');
END
DECLARE @Ex_L5_LESSON_01 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'L5_LESSON_01_FINAL_EX');

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_L5_01_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (@Ex_L5_LESSON_01, N'Q_L5_01_1', 'multiple_choice', N'Biểu hiện "성공은 노력에 달려 있다" có nghĩa là gì?', N'노력에 달려 있다', N'-에 달려 있다 có nghĩa là phụ thuộc/tùy thuộc vào điều gì đó.', 20, 1, 'Published');
END
DECLARE @Q_Q_L5_01_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_L5_01_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @Q_Q_L5_01_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L5_01_1, N'A', N'Thành công phụ thuộc vào sự nỗ lực', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L5_01_1, N'B', N'Thành công không liên quan đến nỗ lực', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L5_01_1, N'C', N'Cần từ bỏ nỗ lực để thành công', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L5_01_1, N'D', N'Đã thành công nhờ may mắn', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L5_LESSON_01_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L5_LESSON_01, N'L5_LESSON_01_ACT_THEORY', 'theory', N'Lý thuyết & Ngữ pháp trọng tâm', N'Nắm vững cấu trúc ngữ pháp và ví dụ hội thoại.', 1, 1, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L5_LESSON_01_ACT_GRAMMAR')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L5_LESSON_01, N'L5_LESSON_01_ACT_GRAMMAR', 'grammar', N'Phân tích cấu trúc & Câu mẫu', N'Đối chiếu cách chia và ngữ cảnh sử dụng.', 1, 2, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L5_LESSON_01_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, ExerciseId, DisplayOrder, XpReward, Status)
    VALUES (@Les_L5_LESSON_01, N'L5_LESSON_01_ACT_QUIZ', 'final_test', N'Bài kiểm tra cuối buổi (Đạt >= 80%)', N'Vượt qua bài kiểm tra để hoàn thành buổi học.', 1, @Ex_L5_LESSON_01, 3, 50, 'Published');
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningLevels WHERE LevelCode = N'LEVEL_6_ADV2')
BEGIN
    INSERT INTO dbo.LearningLevels (
        PathId, LevelCode, BadgeText, BadgeColor, Title, TopikLevel,
        TextbookName, Description, SkillTagsJson, DisplayOrder, Status
    ) VALUES (
        @PathId, N'LEVEL_6_ADV2', N'6급', N'red', N'Cao cấp 2', N'TOPIK II',
        N'NIKL C Nâng cao & HANGO Biên soạn', N'Ngôn ngữ học thuật chuyên sâu, thành ngữ Hán Hàn (사자성어), văn bản pháp lý - khoa học và làm chủ TOPIK 6급.', N'["Từ vựng","Ngữ pháp","Luyện đề","Ôn tập & kiểm tra"]', 7, 'Published'
    );
END
DECLARE @Level_7 INT = (SELECT TOP 1 LevelId FROM dbo.LearningLevels WHERE LevelCode = N'LEVEL_6_ADV2');
IF NOT EXISTS (SELECT 1 FROM dbo.LevelUnlockRules WHERE LevelId = @Level_7)
BEGIN
    INSERT INTO dbo.LevelUnlockRules (LevelId, PrerequisiteLevelId, RequiredCompletedLessonsPercent, MinAverageQuizScorePercent, IsDefaultUnlocked)
    VALUES (@Level_7, @Level_6, 100, 80, 0);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L6_1')
BEGIN
    INSERT INTO dbo.LearningTopics (LevelId, TopicCode, Title, Description, DisplayOrder, Status)
    VALUES (@Level_7, N'TOPIC_L6_1', N'Chủ đề 1: Tư duy phản biện & Văn bản học thuật chuyên sâu (학술 담화와 사자성어)', N'Đọc hiểu chuyên ngành, thành ngữ 4 chữ (사자성어) và hoàn thiện kỹ năng viết 600–700 chữ.', 1, 'Published');
END
DECLARE @Top_TOPIC_L6_1 INT = (SELECT TOP 1 TopicId FROM dbo.LearningTopics WHERE TopicCode = N'TOPIC_L6_1');

IF NOT EXISTS (SELECT 1 FROM dbo.Lessons WHERE LessonCode = N'L6_LESSON_01')
BEGIN
    INSERT INTO dbo.Lessons (
        TopicId, LevelId, LessonCode, LessonNumber, Title, Subtitle,
        LearningObjective, EstimatedMinutes, DisplayOrder, Status, IsAiCompiled, NeedsExpertReview
    ) VALUES (
        @Top_TOPIC_L6_1, @Level_7, N'L6_LESSON_01', 1, N'Bài 1: Đạo đức AI và Xã hội tương lai (인공지능 윤리와 미래 사회)', N'Phân tích lập luận học thuật và cấu trúc nhượng bộ nâng cao -(으)ㄹ지언정.',
        N'Nắm vững từ vựng học thuật cấp 6 và cấu trúc -(으)ㄹ지언정 trong bài luận TOPIK II.', 30, 1, 'Published', 1, 1
    );
END
DECLARE @Les_L6_LESSON_01 INT = (SELECT TOP 1 LessonId FROM dbo.Lessons WHERE LessonCode = N'L6_LESSON_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonCompletionRules WHERE LessonId = @Les_L6_LESSON_01)
BEGIN
    INSERT INTO dbo.LessonCompletionRules (LessonId, RequireAllMandatoryActivities, RequireFinalQuizPass, MinQuizPassPercent, AllowUnlimitedRetakes, UnlockNextLessonOnComplete)
    VALUES (@Les_L6_LESSON_01, 1, 1, 80, 1, 1);
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonSections WHERE SectionCode = N'L6_LESSON_01_SEC1')
BEGIN
    INSERT INTO dbo.LessonSections (LessonId, SectionCode, SectionType, Title, ContentHtmlOrMd, ExamplesJson, DisplayOrder, Status)
    VALUES (
        @Les_L6_LESSON_01,
        N'L6_LESSON_01_SEC1',
        'theory',
        N'Kiến thức trọng tâm & Ngữ pháp: V/A + -(으)ㄹ지언정',
        N'### Ngữ pháp trọng tâm: V/A + -(으)ㄹ지언정
- **Ý nghĩa**: Thà rằng ... chứ quyết không ... / Dù có ... đi chăng nữa
- **Cách dùng**: Biểu thị quyết tâm mạnh mẽ hoặc sự nhượng bộ giả định trong văn viết trang trọng.
- **Quy tắc chia**: Có Patchim + -을지언정; không Patchim hoặc ㄹ + -ㄹ지언정.
- **Ví dụ**: 실패할지언정 결코 포기하지 않겠다. (Dù có thất bại đi chăng nữa tôi cũng quyết không bỏ cuộc.)',
        N'[{"ko":"실패할지언정 결코 포기하지 않겠다.","roman":"","vi":"Dù có thất bại đi chăng nữa tôi cũng quyết không bỏ cuộc."}]',
        1,
        'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Grammar WHERE GrammarCode = N'GR_L6_01')
BEGIN
    INSERT INTO dbo.Grammar (
        GrammarCode, GrammarPattern, MeaningVi, UsageExplanation, ConjugationRule,
        ExampleKo, ExampleVi, TopikLevel, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'GR_L6_01', N'V/A + -(으)ㄹ지언정', N'Thà rằng ... chứ quyết không ... / Dù có ... đi chăng nữa', N'Biểu thị quyết tâm mạnh mẽ hoặc sự nhượng bộ giả định trong văn viết trang trọng.', N'Có Patchim + -을지언정; không Patchim hoặc ㄹ + -ㄹ지언정.',
        N'실패할지언정 결코 포기하지 않겠다.', N'Dù có thất bại đi chăng nữa tôi cũng quyết không bỏ cuộc.', N'TOPIK II', @SourceUpenn, 1, 1, 'Published'
    );
END
DECLARE @Gr_GR_L6_01 INT = (SELECT TOP 1 GrammarId FROM dbo.Grammar WHERE GrammarCode = N'GR_L6_01');
IF NOT EXISTS (SELECT 1 FROM dbo.LessonGrammar WHERE LessonId = @Les_L6_LESSON_01 AND GrammarId = @Gr_GR_L6_01)
BEGIN
    INSERT INTO dbo.LessonGrammar (LessonId, GrammarId, DisplayOrder)
    VALUES (@Les_L6_LESSON_01, @Gr_GR_L6_01, 1);
END

IF NOT EXISTS (SELECT 1 FROM dbo.Exercises WHERE ExerciseCode = N'L6_LESSON_01_FINAL_EX')
BEGIN
    INSERT INTO dbo.Exercises (LessonId, ExerciseCode, ExerciseType, Title, Description, PassingScorePercent, TimeLimitSeconds, DisplayOrder, Status)
    VALUES (@Les_L6_LESSON_01, N'L6_LESSON_01_FINAL_EX', 'final_test', N'Kiểm tra cuối bài — Bài 1: Đạo đức AI và Xã hội tương lai (인공지능 윤리와 미래 사회)', N'Đạt từ 80% trở lên để mở khóa bài tiếp theo.', 80, 300, 1, 'Published');
END
DECLARE @Ex_L6_LESSON_01 INT = (SELECT TOP 1 ExerciseId FROM dbo.Exercises WHERE ExerciseCode = N'L6_LESSON_01_FINAL_EX');

IF NOT EXISTS (SELECT 1 FROM dbo.Questions WHERE QuestionCode = N'Q_L6_01_1')
BEGIN
    INSERT INTO dbo.Questions (ExerciseId, QuestionCode, QuestionType, PromptText, KoreanHighlight, ExplanationVi, Points, DisplayOrder, Status)
    VALUES (@Ex_L6_LESSON_01, N'Q_L6_01_1', 'multiple_choice', N'Cấu trúc "-(으)ㄹ지언정" mang sắc thái ngữ nghĩa nào trong văn phong cao cấp?', N'실패할지언정 포기하지 않겠다.', N'-(으)ㄹ지언정 nhấn mạnh dù thừa nhận giả định vế trước nhưng quyết không để vế sau xảy ra.', 20, 1, 'Published');
END
DECLARE @Q_Q_L6_01_1 INT = (SELECT TOP 1 QuestionId FROM dbo.Questions WHERE QuestionCode = N'Q_L6_01_1');
IF NOT EXISTS (SELECT 1 FROM dbo.QuestionOptions WHERE QuestionId = @Q_Q_L6_01_1)
BEGIN

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L6_01_1, N'A', N'Dù có ... đi chăng nữa thì vẫn quyết tâm ...', 1, 1);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L6_01_1, N'B', N'Vừa mới làm xong hành động', 0, 2);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L6_01_1, N'C', N'Do không biết nên mới làm', 0, 3);

    INSERT INTO dbo.QuestionOptions (QuestionId, OptionLabel, OptionText, IsCorrect, DisplayOrder)
    VALUES (@Q_Q_L6_01_1, N'D', N'Hỏi ý kiến người nghe', 0, 4);
END

IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L6_LESSON_01_ACT_THEORY')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L6_LESSON_01, N'L6_LESSON_01_ACT_THEORY', 'theory', N'Lý thuyết & Ngữ pháp trọng tâm', N'Nắm vững cấu trúc ngữ pháp và ví dụ hội thoại.', 1, 1, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L6_LESSON_01_ACT_GRAMMAR')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, DisplayOrder, XpReward, Status)
    VALUES (@Les_L6_LESSON_01, N'L6_LESSON_01_ACT_GRAMMAR', 'grammar', N'Phân tích cấu trúc & Câu mẫu', N'Đối chiếu cách chia và ngữ cảnh sử dụng.', 1, 2, 20, 'Published');
END
IF NOT EXISTS (SELECT 1 FROM dbo.LessonActivities WHERE ActivityCode = N'L6_LESSON_01_ACT_QUIZ')
BEGIN
    INSERT INTO dbo.LessonActivities (LessonId, ActivityCode, ActivityType, Title, Description, IsRequired, ExerciseId, DisplayOrder, XpReward, Status)
    VALUES (@Les_L6_LESSON_01, N'L6_LESSON_01_ACT_QUIZ', 'final_test', N'Bài kiểm tra cuối buổi (Đạt >= 80%)', N'Vượt qua bài kiểm tra để hoàn thành buổi học.', 1, @Ex_L6_LESSON_01, 3, 50, 'Published');
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13111664')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13111664', N'예!', N'Vâng!', N'Biểu hiện / Câu mẫu',
        N'예!', N'Vâng!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_12213650')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_12213650', N'예.', N'Vâng.', N'Biểu hiện / Câu mẫu',
        N'예.', N'Vâng.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_10622072')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_10622072', N'응.', N'Vâng.', N'Biểu hiện / Câu mẫu',
        N'응.', N'Vâng.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_5951679')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_5951679', N'네', N'Vâng.', N'Biểu hiện / Câu mẫu',
        N'네', N'Vâng.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_5548650')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_5548650', N'가!', N'Đi đi!', N'Biểu hiện / Câu mẫu',
        N'가!', N'Đi đi!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_1054233')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_1054233', N'네.', N'Vâng.', N'Biểu hiện / Câu mẫu',
        N'네.', N'Vâng.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13319305')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13319305', N'아야!', N'Đau!', N'Biểu hiện / Câu mẫu',
        N'아야!', N'Đau!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13319304')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13319304', N'ㅇ?', N'Hử?', N'Biểu hiện / Câu mẫu',
        N'ㅇ?', N'Hử?', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13252705')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13252705', N'추워.', N'Lạnh.', N'Biểu hiện / Câu mẫu',
        N'추워.', N'Lạnh.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13211652')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13211652', N'아뇨.', N'Không.', N'Biểu hiện / Câu mẫu',
        N'아뇨.', N'Không.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13175031')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13175031', N'저어...', N'Ờm...', N'Biểu hiện / Câu mẫu',
        N'저어...', N'Ờm...', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13174804')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13174804', N'잘 가!', N'Tạm biệt!', N'Biểu hiện / Câu mẫu',
        N'잘 가!', N'Tạm biệt!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13170264')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13170264', N'바빠.', N'Tôi đang bận.', N'Biểu hiện / Câu mẫu',
        N'바빠.', N'Tôi đang bận.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13168062')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13168062', N'제미!', N'Mẹ nó!', N'Biểu hiện / Câu mẫu',
        N'제미!', N'Mẹ nó!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13163576')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13163576', N'지금!', N'Bây giờ!', N'Biểu hiện / Câu mẫu',
        N'지금!', N'Bây giờ!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13163573')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13163573', N'당장!', N'Bây giờ!', N'Biểu hiện / Câu mẫu',
        N'당장!', N'Bây giờ!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13118390')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13118390', N'제발...', N'Đi mà...', N'Biểu hiện / Câu mẫu',
        N'제발...', N'Đi mà...', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_11106942')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_11106942', N'숙여!', N'Con vịt kìa!', N'Biểu hiện / Câu mẫu',
        N'숙여!', N'Con vịt kìa!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_11106940')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_11106940', N'숨어.', N'Trốn đi.', N'Biểu hiện / Câu mẫu',
        N'숨어.', N'Trốn đi.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_10622099')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_10622099', N'오키.', N'Ô kê.', N'Biểu hiện / Câu mẫu',
        N'오키.', N'Ô kê.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_10622097')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_10622097', N'아니.', N'Không.', N'Biểu hiện / Câu mẫu',
        N'아니.', N'Không.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_10622091')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_10622091', N'빠이!', N'Bai nha!', N'Biểu hiện / Câu mẫu',
        N'빠이!', N'Bai nha!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_8533897')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_8533897', N'응?', N'Hử?', N'Biểu hiện / Câu mẫu',
        N'응?', N'Hử?', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_8533845')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_8533845', N'있지.', N'Này.', N'Biểu hiện / Câu mẫu',
        N'있지.', N'Này.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_8363410')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_8363410', N'잘 봐.', N'Hãy nhìn thật kỹ.', N'Biểu hiện / Câu mẫu',
        N'잘 봐.', N'Hãy nhìn thật kỹ.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_8363367')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_8363367', N'말해.', N'Nói cho tôi đi.', N'Biểu hiện / Câu mẫu',
        N'말해.', N'Nói cho tôi đi.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_8355901')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_8355901', N'공격!', N'Tấn công!', N'Biểu hiện / Câu mẫu',
        N'공격!', N'Tấn công!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_8355900')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_8355900', N'들어.', N'Nghe này.', N'Biểu hiện / Câu mẫu',
        N'들어.', N'Nghe này.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_8355897')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_8355897', N'잠깐!', N'Đợi đã!', N'Biểu hiện / Câu mẫu',
        N'잠깐!', N'Đợi đã!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_8355893')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_8355893', N'점프!', N'Nhảy đi!', N'Biểu hiện / Câu mẫu',
        N'점프!', N'Nhảy đi!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_8355891')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_8355891', N'뛰어!', N'Chạy!', N'Biểu hiện / Câu mẫu',
        N'뛰어!', N'Chạy!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_8355888')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_8355888', N'안녕.', N'Chào chị.', N'Biểu hiện / Câu mẫu',
        N'안녕.', N'Chào chị.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_8355879')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_8355879', N'설마!', N'Thật khó tin!', N'Biểu hiện / Câu mẫu',
        N'설마!', N'Thật khó tin!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_8119580')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_8119580', N'힘내.', N'Đừng có rầu rĩ quá như thế.', N'Biểu hiện / Câu mẫu',
        N'힘내.', N'Đừng có rầu rĩ quá như thế.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_6821997')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_6821997', N'에취!', N'Hắt xì!', N'Biểu hiện / Câu mẫu',
        N'에취!', N'Hắt xì!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_6305326')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_6305326', N'씨발!', N'Mẹ nó!', N'Biểu hiện / Câu mẫu',
        N'씨발!', N'Mẹ nó!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_5548647')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_5548647', N'안녕!', N'Chào bạn.', N'Biểu hiện / Câu mẫu',
        N'안녕!', N'Chào bạn.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_5269435')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_5269435', N'건배!', N'Dô!', N'Biểu hiện / Câu mẫu',
        N'건배!', N'Dô!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_4739157')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_4739157', N'가자!', N'đi thôi!', N'Biểu hiện / Câu mẫu',
        N'가자!', N'đi thôi!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_4440446')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_4440446', N'잘자.', N'Chúc ngủ ngon.', N'Biểu hiện / Câu mẫu',
        N'잘자.', N'Chúc ngủ ngon.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_4430113')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_4430113', N'뭐?', N'Hả?', N'Biểu hiện / Câu mẫu',
        N'뭐?', N'Hả?', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_4430112')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_4430112', N'네?', N'Hả?', N'Biểu hiện / Câu mẫu',
        N'네?', N'Hả?', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_4038386')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_4038386', N'왜?', N'Tại sao?', N'Biểu hiện / Câu mẫu',
        N'왜?', N'Tại sao?', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_3189870')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_3189870', N'아냐.', N'Không.', N'Biểu hiện / Câu mẫu',
        N'아냐.', N'Không.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_2652664')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_2652664', N'몰라.', N'Tôi không biết.', N'Biểu hiện / Câu mẫu',
        N'몰라.', N'Tôi không biết.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_500829')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_500829', N'죽어!', N'Chết đi!', N'Biểu hiện / Câu mẫu',
        N'죽어!', N'Chết đi!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13549835')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13549835', N'도망가!', N'Chạy!', N'Biểu hiện / Câu mẫu',
        N'도망가!', N'Chạy!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13252696')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13252696', N'추워요.', N'Lạnh.', N'Biểu hiện / Câu mẫu',
        N'추워요.', N'Lạnh.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13222466')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13222466', N'정말?', N'Thật sao?', N'Biểu hiện / Câu mẫu',
        N'정말?', N'Thật sao?', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13211661')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13211661', N'아니요.', N'Không.', N'Biểu hiện / Câu mẫu',
        N'아니요.', N'Không.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13211650')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13211650', N'아니야.', N'Không.', N'Biểu hiện / Câu mẫu',
        N'아니야.', N'Không.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13211586')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13211586', N'몰라요.', N'Tôi không biết.', N'Biểu hiện / Câu mẫu',
        N'몰라요.', N'Tôi không biết.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13205058')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13205058', N'왜요?', N'Tại sao?', N'Biểu hiện / Câu mẫu',
        N'왜요?', N'Tại sao?', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13192861')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13192861', N'입 닥쳐!', N'Im miệng!', N'Biểu hiện / Câu mẫu',
        N'입 닥쳐!', N'Im miệng!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13175039')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13175039', N'저기요!', N'Chào bạn.', N'Biểu hiện / Câu mẫu',
        N'저기요!', N'Chào bạn.', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13174812')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13174812', N'잘 있어!', N'Tạm biệt!', N'Biểu hiện / Câu mẫu',
        N'잘 있어!', N'Tạm biệt!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13174803')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13174803', N'잘 가요!', N'Tạm biệt!', N'Biểu hiện / Câu mẫu',
        N'잘 가요!', N'Tạm biệt!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13174783')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13174783', N'안녕?', N'Chào buổi sáng!', N'Biểu hiện / Câu mẫu',
        N'안녕?', N'Chào buổi sáng!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13174362')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13174362', N'하지 마!', N'Đừng làm thế!', N'Biểu hiện / Câu mẫu',
        N'하지 마!', N'Đừng làm thế!', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'TAT_KOR_VIE_13171794')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, VietnameseMeaning, PartOfSpeech,
        ExampleSentenceKo, ExampleSentenceVi, NiklLevel, TopikLevel,
        TopicName, SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'TAT_KOR_VIE_13171794', N'피곤해.', N'Tôi mệt', N'Biểu hiện / Câu mẫu',
        N'피곤해.', N'Tôi mệt', 'A', N'TOPIK I',
        N'Giao tiếp Tatoeba (CC BY 2.0 FR)', @SourceTatoeba, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0001_001')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0001_001', N'것', NULL, N'의존명사 (먹을 것)', N'의존명사',
        N'먹을 것', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 1,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0002_002')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0002_002', N'하다', NULL, N'Động từ (운동을)', N'Động từ',
        N'운동을', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 2,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0003_003')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0003_003', N'있다', NULL, N'보조 용언', N'보조 용언',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 3,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0004_004')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0004_004', N'있다', NULL, N'Tính từ (집에)', N'Tính từ',
        N'집에', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 4,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0005_005')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0005_005', N'되다', NULL, N'Động từ (배우가; 어른이 ~)', N'Động từ',
        N'배우가; 어른이 ~', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 5,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0006_006')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0006_006', N'수', NULL, N'의존명사 (방법)', N'의존명사',
        N'방법', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 6,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0007_007')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0007_007', N'하다', NULL, N'보조 용언', N'보조 용언',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 7,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0008_008')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0008_008', N'나', NULL, N'Đại từ (나와 너)', N'Đại từ',
        N'나와 너', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 8,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0009_009')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0009_009', N'그', NULL, N'Định từ (그 사람)', N'Định từ',
        N'그 사람', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 9,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0010_010')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0010_010', N'없다', NULL, N'Tính từ (재미가)', N'Tính từ',
        N'재미가', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 10,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0011_011')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0011_011', N'않다', NULL, N'보조 용언', N'보조 용언',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 11,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0012_012')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0012_012', N'사람', NULL, N'Danh từ (이 살다)', N'Danh từ',
        N'이 살다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 12,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0013_013')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0013_013', N'우리', NULL, N'Đại từ (우리 가족)', N'Đại từ',
        N'우리 가족', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 13,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0014_014')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0014_014', N'이', NULL, N'Định từ (그, 저)', N'Định từ',
        N'그, 저', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 14,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0015_015')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0015_015', N'그', NULL, N'Đại từ (그 사람)', N'Đại từ',
        N'그 사람', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 15,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0016_016')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0016_016', N'아니다', NULL, N'Tính từ (−)', N'Tính từ',
        N'−', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 16,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0017_017')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0017_017', N'보다', NULL, N'Động từ (신문을)', N'Động từ',
        N'신문을', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 17,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0019_018')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0019_018', N'때', NULL, N'Danh từ (시간; 어릴 때)', N'Danh từ',
        N'시간; 어릴 때', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 19,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0020_019')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0020_019', N'거', NULL, N'의존명사 (것)', N'의존명사',
        N'것', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 20,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0021_020')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0021_020', N'보다', NULL, N'보조 용언', N'보조 용언',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 21,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0022_021')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0022_021', N'같다', NULL, N'Tính từ (서로 같다)', N'Tính từ',
        N'서로 같다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 22,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0023_022')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0023_022', N'주다', NULL, N'보조 용언', N'보조 용언',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 23,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0024_023')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0024_023', N'대하다', N'對-', N'Động từ (Hán Hàn: 對- · 얼굴을)', N'Động từ',
        N'얼굴을', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 24,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0025_024')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0025_024', N'가다', NULL, N'Động từ (학교에)', N'Động từ',
        N'학교에', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 25,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0026_025')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0026_025', N'년', N'年', N'의존명사 (Hán Hàn: 年 · 2015년)', N'의존명사',
        N'2015년', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 26,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0027_026')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0027_026', N'한', NULL, N'Định từ (한 명)', N'Định từ',
        N'한 명', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 27,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0028_027')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0028_027', N'말', NULL, N'Danh từ (~과 글; 을 하다)', N'Danh từ',
        N'~과 글; 을 하다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 28,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0029_028')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0029_028', N'일', NULL, N'Danh từ (이 쌓이다)', N'Danh từ',
        N'이 쌓이다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 29,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0030_029')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0030_029', N'이', NULL, N'Đại từ (그, 저)', N'Đại từ',
        N'그, 저', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 30,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0031_030')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0031_030', N'때문', NULL, N'의존명사', N'의존명사',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 31,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0032_031')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0032_031', N'말하다', NULL, N'Động từ', N'Động từ',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 32,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0033_032')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0033_032', N'위하다', N'爲-', N'Động từ (Hán Hàn: 爲- · 가족을)', N'Động từ',
        N'가족을', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 33,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0034_033')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0034_033', N'그러나', NULL, N'Phó từ (−)', N'Phó từ',
        N'−', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 34,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0035_034')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0035_034', N'오다', NULL, N'Động từ (한국에)', N'Động từ',
        N'한국에', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 35,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0036_035')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0036_035', N'알다', NULL, N'Động từ (사실을)', N'Động từ',
        N'사실을', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 36,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0037_036')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0037_036', N'씨', N'氏', N'의존명사 (Hán Hàn: 氏 · 마이클 씨)', N'의존명사',
        N'마이클 씨', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 37,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0038_037')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0038_037', N'그렇다', NULL, N'Tính từ (사정이)', N'Tính từ',
        N'사정이', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 38,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0039_038')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0039_038', N'크다', NULL, N'Tính từ (크기가)', N'Tính từ',
        N'크기가', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 39,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0040_039')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0040_039', N'또', NULL, N'Phó từ (또 생기다)', N'Phó từ',
        N'또 생기다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 40,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0041_040')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0041_040', N'일', NULL, N'의존명사 (삼 일; 하루)', N'의존명사',
        N'삼 일; 하루', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 41,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0042_041')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0042_041', N'사회', N'社會', N'Danh từ (Hán Hàn: 社會 · 상류 사회)', N'Danh từ',
        N'상류 사회', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 42,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0043_042')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0043_042', N'많다', NULL, N'Tính từ (돈이)', N'Tính từ',
        N'돈이', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 43,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0044_043')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0044_043', N'안', NULL, N'Phó từ (아니; 안 춥다)', N'Phó từ',
        N'아니; 안 춥다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 44,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0045_044')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0045_044', N'좋다', NULL, N'Tính từ (날씨가)', N'Tính từ',
        N'날씨가', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 45,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0046_045')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0046_045', N'더', NULL, N'Phó từ (하나 더)', N'Phó từ',
        N'하나 더', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 46,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0047_046')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0047_046', N'받다', NULL, N'Động từ (선물을 ~)', N'Động từ',
        N'선물을 ~', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 47,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0048_047')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0048_047', N'그것', NULL, N'Đại từ (−)', N'Đại từ',
        N'−', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 48,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0049_048')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0049_048', N'집', NULL, N'Danh từ (에 살다)', N'Danh từ',
        N'에 살다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 49,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0050_049')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0050_049', N'나오다', NULL, N'Động từ (밖에)', N'Động từ',
        N'밖에', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 50,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0051_050')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0051_050', N'따르다', NULL, N'Động từ (뒤를 ~)', N'Động từ',
        N'뒤를 ~', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 51,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0052_051')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0052_051', N'그리고', NULL, N'Phó từ (−)', N'Phó từ',
        N'−', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 52,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0053_052')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0053_052', N'문제', N'問題', N'Danh từ (Hán Hàn: 問題 · 를 풀다)', N'Danh từ',
        N'를 풀다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 53,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0054_053')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0054_053', N'그런', NULL, N'Định từ (그런 사람)', N'Định từ',
        N'그런 사람', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 54,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0055_054')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0055_054', N'살다', NULL, N'Động từ (오래)', N'Động từ',
        N'오래', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 55,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0056_055')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0056_055', N'저', NULL, N'Đại từ (사람(1인칭); 일인칭 대명사)', N'Đại từ',
        N'사람(1인칭); 일인칭 대명사', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 56,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0057_056')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0057_056', N'못하다', NULL, N'보조 용언', N'보조 용언',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 57,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0058_057')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0058_057', N'생각하다', NULL, N'Động từ', N'Động từ',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 58,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0059_058')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0059_058', N'모르다', NULL, N'Động từ (규칙을)', N'Động từ',
        N'규칙을', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 59,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0060_059')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0060_059', N'속', NULL, N'Danh từ (주머니 속)', N'Danh từ',
        N'주머니 속', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 60,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0061_060')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0061_060', N'만들다', NULL, N'Động từ (음식을)', N'Động từ',
        N'음식을', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 61,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0062_061')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0062_061', N'데', NULL, N'의존명사 (갈 데(장소))', N'의존명사',
        N'갈 데(장소)', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 62,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0063_062')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0063_062', N'두', NULL, N'Định từ (숫자)', N'Định từ',
        N'숫자', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 63,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0064_063')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0064_063', N'앞', NULL, N'Danh từ (으로 나가다)', N'Danh từ',
        N'으로 나가다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 64,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0066_064')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0066_064', N'중', N'中', N'의존명사 (Hán Hàn: 中 · 회의 중)', N'의존명사',
        N'회의 중', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 66,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0067_065')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0067_065', N'어떤', NULL, N'Định từ (어떤 느낌)', N'Định từ',
        N'어떤 느낌', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 67,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0068_066')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0068_066', N'잘', NULL, N'Phó từ (잘 알다)', N'Phó từ',
        N'잘 알다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 68,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0069_067')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0069_067', N'그녀', N'-女', N'Đại từ (Hán Hàn: -女 · 사람(3인칭))', N'Đại từ',
        N'사람(3인칭)', N'C', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 69,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0071_068')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0071_068', N'오다', NULL, N'보조 용언', N'보조 용언',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 71,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0072_069')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0072_069', N'자신', N'自身', N'Danh từ (Hán Hàn: 自身 · 나 자신)', N'Danh từ',
        N'나 자신', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 72,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0073_070')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0073_070', N'문화', N'文化', N'Danh từ (Hán Hàn: 文化 · 를 교류하다)', N'Danh từ',
        N'를 교류하다', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 73,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0074_071')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0074_071', N'원', NULL, N'의존명사 (천 원; 화폐 단위)', N'의존명사',
        N'천 원; 화폐 단위', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 74,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0075_072')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0075_072', N'생각', NULL, N'Danh từ (에 빠지다)', N'Danh từ',
        N'에 빠지다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 75,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0076_073')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0076_073', N'어떻다', NULL, N'Tính từ (마음이)', N'Tính từ',
        N'마음이', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 76,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0077_074')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0077_074', N'명', N'名', N'의존명사 (Hán Hàn: 名 · 한 ~; 한 명)', N'의존명사',
        N'한 ~; 한 명', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 77,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0078_075')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0078_075', N'통하다', N'通-', N'Động từ (Hán Hàn: 通- · 바람이)', N'Động từ',
        N'바람이', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 78,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0079_076')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0079_076', N'그러다', NULL, N'Động từ (−)', N'Động từ',
        N'−', N'C', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 79,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0080_077')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0080_077', N'소리', NULL, N'Danh từ (가 나다)', N'Danh từ',
        N'가 나다', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 80,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0081_078')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0081_078', N'다시', NULL, N'Phó từ (다시 시작하다)', N'Phó từ',
        N'다시 시작하다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 81,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0082_079')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0082_079', N'다른', NULL, N'Định từ (다른 나라)', N'Định từ',
        N'다른 나라', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 82,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0083_080')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0083_080', N'이런', NULL, N'Định từ (이런 일)', N'Định từ',
        N'이런 일', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 83,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0084_081')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0084_081', N'여자', N'女子', N'Danh từ (Hán Hàn: 女子 · 남자)', N'Danh từ',
        N'남자', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 84,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0085_082')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0085_082', N'개', N'個', N'의존명사 (Hán Hàn: 個 · 한 개)', N'의존명사',
        N'한 개', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 85,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0086_083')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0086_083', N'정도', N'程度', N'Danh từ (Hán Hàn: 程度 · 어느 정도)', N'Danh từ',
        N'어느 정도', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 86,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0087_084')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0087_084', N'뒤', NULL, N'Danh từ (에 있다)', N'Danh từ',
        N'에 있다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 87,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0088_085')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0088_085', N'듣다', NULL, N'Động từ (소리를 ~; 음악을)', N'Động từ',
        N'소리를 ~; 음악을', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 88,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0089_086')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0089_086', N'다', NULL, N'Phó từ (모두)', N'Phó từ',
        N'모두', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 89,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0090_087')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0090_087', N'좀', NULL, N'Phó từ (조금; 좀 비싸다)', N'Phó từ',
        N'조금; 좀 비싸다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 90,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0091_088')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0091_088', N'들다', NULL, N'Động từ (돈이; 여관에 ~)', N'Động từ',
        N'돈이; 여관에 ~', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 91,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0092_089')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0092_089', N'싶다', NULL, N'보조 용언', N'보조 용언',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 92,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0093_090')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0093_090', N'보이다', NULL, N'Động từ (''보다''의 피동사; 산이)', N'Động từ',
        N'''보다''의 피동사; 산이', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 93,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0094_091')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0094_091', N'가지다', NULL, N'Động từ (돈을)', N'Động từ',
        N'돈을', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 94,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0095_092')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0095_092', N'함께', NULL, N'Phó từ (함께 놀다)', N'Phó từ',
        N'함께 놀다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 95,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0096_093')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0096_093', N'아이', NULL, N'Danh từ (어른)', N'Danh từ',
        N'어른', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 96,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0097_094')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0097_094', N'지나다', NULL, N'Động từ (시간이)', N'Động từ',
        N'시간이', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 97,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0098_095')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0098_095', N'많이', NULL, N'Phó từ (많이 사다)', N'Phó từ',
        N'많이 사다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 98,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0099_096')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0099_096', N'시간', N'時間', N'Danh từ (Hán Hàn: 時間 · 이 걸리다)', N'Danh từ',
        N'이 걸리다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 99,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0100_097')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0100_097', N'너', NULL, N'Đại từ (나)', N'Đại từ',
        N'나', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 100,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0101_098')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0101_098', N'주다', NULL, N'Động từ (선물을)', N'Động từ',
        N'선물을', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 101,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0102_099')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0102_099', N'인간', N'人間', N'Danh từ (Hán Hàn: 人間 · 인간 사회)', N'Danh từ',
        N'인간 사회', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 102,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0103_100')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0103_100', N'사실', N'事實', N'Danh từ (Hán Hàn: 事實 · 을 밝히다)', N'Danh từ',
        N'을 밝히다', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 103,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0104_101')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0104_101', N'나다', NULL, N'Động từ (수염이)', N'Động từ',
        N'수염이', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 104,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0105_102')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0105_102', N'이렇다', NULL, N'Tính từ (결과가)', N'Tính từ',
        N'결과가', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 105,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0106_103')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0106_103', N'어머니', NULL, N'Danh từ (가족)', N'Danh từ',
        N'가족', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 106,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0107_104')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0107_104', N'눈', NULL, N'Danh từ (신체의 일부; 이 작다)', N'Danh từ',
        N'신체의 일부; 이 작다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 107,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0108_105')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0108_105', N'뭐', NULL, N'Đại từ (뭐라고 말하다)', N'Đại từ',
        N'뭐라고 말하다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 108,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0109_106')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0109_106', N'점', N'點', N'Danh từ (Hán Hàn: 點 · 을 찍다)', N'Danh từ',
        N'을 찍다', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 109,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0110_107')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0110_107', N'의하다', N'依-', N'Động từ (Hán Hàn: 依-)', N'Động từ',
        NULL, N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 110,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0111_108')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0111_108', N'시대', N'時代', N'Danh từ (Hán Hàn: 時代 · 조선 시대)', N'Danh từ',
        N'조선 시대', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 111,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0112_109')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0112_109', N'다음', NULL, N'Danh từ (다음 날)', N'Danh từ',
        N'다음 날', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 112,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0113_110')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0113_110', N'이러하다', NULL, N'Tính từ', N'Tính từ',
        NULL, N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 113,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0114_111')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0114_111', N'누구', NULL, N'Đại từ (거기 누구 계세요?)', N'Đại từ',
        N'거기 누구 계세요?', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 114,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0115_112')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0115_112', N'전', N'前', N'Danh từ (Hán Hàn: 前 · 오래 전)', N'Danh từ',
        N'오래 전', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 115,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0116_113')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0116_113', N'곳', NULL, N'Danh từ (어느 곳)', N'Danh từ',
        N'어느 곳', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 116,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0117_114')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0117_114', N'여러', NULL, N'Định từ (여러 나라)', N'Định từ',
        N'여러 나라', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 117,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0118_115')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0118_115', N'안', NULL, N'Danh từ (밖; 집 ~)', N'Danh từ',
        N'밖; 집 ~', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 118,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0119_116')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0119_116', N'하나', NULL, N'Số từ (숫자)', N'Số từ',
        N'숫자', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 119,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0120_117')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0120_117', N'세계', N'世界', N'Danh từ (Hán Hàn: 世界 · 세계 여행)', N'Danh từ',
        N'세계 여행', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 120,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0121_118')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0121_118', N'버리다', NULL, N'보조 용언', N'보조 용언',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 121,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0122_119')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0122_119', N'위', NULL, N'Danh từ (~아래)', N'Danh từ',
        N'~아래', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 122,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0123_120')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0123_120', N'운동', N'運動', N'Danh từ (Hán Hàn: 運動 · 운동 시설)', N'Danh từ',
        N'운동 시설', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 123,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0124_121')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0124_121', N'퍼센트', NULL, N'의존명사 (percent; 백 퍼센트)', N'의존명사',
        N'percent; 백 퍼센트', N'A', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 124,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0125_122')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0125_122', N'학교', N'學校', N'Danh từ (Hán Hàn: 學校 · 에 다니다)', N'Danh từ',
        N'에 다니다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 125,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0127_123')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0127_123', N'가장', NULL, N'Phó từ (가장 빠르다)', N'Phó từ',
        N'가장 빠르다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 127,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0128_124')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0128_124', N'대통령', N'大統領', N'Danh từ (Hán Hàn: 大統領 · 을 뽑다)', N'Danh từ',
        N'을 뽑다', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 128,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0129_125')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0129_125', N'가지', NULL, N'의존명사 (몇; 한 ~)', N'의존명사',
        N'몇; 한 ~', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 129,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0131_126')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0131_126', N'시작하다', N'始作-', N'Động từ (Hán Hàn: 始作-)', N'Động từ',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 131,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0132_127')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0132_127', N'바로', NULL, N'Phó từ (바로 시작하다)', N'Phó từ',
        N'바로 시작하다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 132,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0133_128')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0133_128', N'어느', NULL, N'Định từ (어느 나라)', N'Định từ',
        N'어느 나라', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 133,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0134_129')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0134_129', N'그래서', NULL, N'Phó từ (−)', N'Phó từ',
        N'−', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 134,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0135_130')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0135_130', N'무엇', NULL, N'Đại từ (−)', N'Đại từ',
        N'−', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 135,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0136_131')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0136_131', N'정부', N'政府', N'Danh từ (Hán Hàn: 政府 · 한국 정부)', N'Danh từ',
        N'한국 정부', N'C', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 136,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0137_132')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0137_132', N'모든', NULL, N'Định từ (모든 사람)', N'Định từ',
        N'모든 사람', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 137,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0138_133')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0138_133', N'번', N'番', N'의존명사 (Hán Hàn: 番 · 첫째 번)', N'의존명사',
        N'첫째 번', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 138,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0139_134')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0139_134', N'그거', NULL, N'Đại từ (그것)', N'Đại từ',
        N'그것', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 139,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0140_135')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0140_135', N'돈', NULL, N'Danh từ (을 벌다)', N'Danh từ',
        N'을 벌다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 140,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0141_136')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0141_136', N'국가', N'國家', N'Danh từ (Hán Hàn: 國家 · 민주 국가)', N'Danh từ',
        N'민주 국가', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 141,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0142_137')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0142_137', N'그런데', NULL, N'Phó từ (−)', N'Phó từ',
        N'−', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 142,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0143_138')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0143_138', N'날', NULL, N'Danh từ (마지막 날; 어느 ~)', N'Danh từ',
        N'마지막 날; 어느 ~', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 143,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0144_139')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0144_139', N'여기', NULL, N'Đại từ (장소)', N'Đại từ',
        N'장소', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 144,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0145_140')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0145_140', N'모두', NULL, N'Phó từ (모두 함께)', N'Phó từ',
        N'모두 함께', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 145,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0146_141')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0146_141', N'여성', N'女性', N'Danh từ (Hán Hàn: 女性 · 남성)', N'Danh từ',
        N'남성', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 146,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0147_142')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0147_142', N'친구', N'親舊', N'Danh từ (Hán Hàn: 親舊 · 를 만나다)', N'Danh từ',
        N'를 만나다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 147,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0148_143')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0148_143', N'마음', NULL, N'Danh từ (이 따뜻하다)', N'Danh từ',
        N'이 따뜻하다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 148,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0149_144')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0149_144', N'후', N'後', N'Danh từ (Hán Hàn: 後 · 오 분 후)', N'Danh từ',
        N'오 분 후', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 149,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0150_145')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0150_145', N'가다', NULL, N'보조 용언', N'보조 용언',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 150,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0151_146')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0151_146', N'놓다', NULL, N'보조 용언', N'보조 용언',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 151,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0152_147')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0152_147', N'관계', N'關係', N'Danh từ (Hán Hàn: 關係 · 를 맺다)', N'Danh từ',
        N'를 맺다', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 152,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0153_148')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0153_148', N'아버지', NULL, N'Danh từ (가족)', N'Danh từ',
        N'가족', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 153,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0154_149')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0154_149', N'남자', N'男子', N'Danh từ (Hán Hàn: 男子 · 여자)', N'Danh từ',
        N'여자', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 154,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0155_150')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0155_150', N'어디', NULL, N'Đại từ (어디예요?)', N'Đại từ',
        N'어디예요?', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 155,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0156_151')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0156_151', N'몸', NULL, N'Danh từ (이 건강하다)', N'Danh từ',
        N'이 건강하다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 156,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0157_152')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0157_152', N'얼굴', NULL, N'Danh từ (신체)', N'Danh từ',
        N'신체', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 157,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0158_153')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0158_153', N'들어가다', NULL, N'Động từ (방으로)', N'Động từ',
        N'방으로', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 158,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0159_154')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0159_154', N'왜', NULL, N'Phó từ (왜 그래?)', N'Phó từ',
        N'왜 그래?', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 159,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0160_155')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0160_155', N'나타나다', NULL, N'Động từ (건물이)', N'Động từ',
        N'건물이', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 160,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0161_156')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0161_156', N'말다', NULL, N'보조 용언', N'보조 용언',
        NULL, N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 161,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0162_157')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0162_157', N'지역', N'地域', N'Danh từ (Hán Hàn: 地域 · 서울 지역)', N'Danh từ',
        N'서울 지역', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 162,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0163_158')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0163_158', N'다르다', NULL, N'Tính từ (모양이)', N'Tính từ',
        N'모양이', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 163,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0164_159')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0164_159', N'모습', NULL, N'Danh từ (을 보이다)', N'Danh từ',
        N'을 보이다', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 164,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0165_160')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0165_160', N'물', NULL, N'Danh từ (바닷~; 을 마시다)', N'Danh từ',
        N'바닷~; 을 마시다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 165,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0166_161')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0166_161', N'만나다', NULL, N'Động từ (친구를)', N'Động từ',
        N'친구를', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 166,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0167_162')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0167_162', N'내다', NULL, N'Động từ (길을 ~; 문제를)', N'Động từ',
        N'길을 ~; 문제를', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 167,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0169_163')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0169_163', N'쓰다', NULL, N'Động từ (글씨를 ~; 글자를)', N'Động từ',
        N'글씨를 ~; 글자를', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 169,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0170_164')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0170_164', N'이것', NULL, N'Đại từ (−)', N'Đại từ',
        N'−', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 170,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0171_165')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0171_165', N'없이', NULL, N'Phó từ (죄 없이)', N'Phó từ',
        N'죄 없이', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 171,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0172_166')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0172_166', N'이번', N'-番', N'Danh từ (Hán Hàn: -番 · 이번 주)', N'Danh từ',
        N'이번 주', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 172,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0173_167')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0173_167', N'길', NULL, N'Danh từ (도로; 이 막히다)', N'Danh từ',
        N'도로; 이 막히다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 173,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0174_168')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0174_168', N'생활', N'生活', N'Danh từ (Hán Hàn: 生活 · 직장 생활)', N'Danh từ',
        N'직장 생활', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 174,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0176_169')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0176_169', N'지금', N'只今', N'Danh từ (Hán Hàn: 只今 · 지금부터)', N'Danh từ',
        N'지금부터', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 176,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0177_170')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0177_170', N'뿐', NULL, N'의존명사', N'의존명사',
        NULL, N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 177,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0178_171')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0178_171', N'사이', NULL, N'Danh từ (에 놓다)', N'Danh từ',
        N'에 놓다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 178,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0179_172')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0179_172', N'방법', N'方法', N'Danh từ (Hán Hàn: 方法 · 사용 방법)', N'Danh từ',
        N'사용 방법', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 179,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0180_173')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0180_173', N'새롭다', NULL, N'Tính từ (기억이)', N'Tính từ',
        N'기억이', N'C', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 180,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0181_174')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0181_174', N'우리나라', NULL, N'Danh từ (우리나라 사람)', N'Danh từ',
        N'우리나라 사람', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 181,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0182_175')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0182_175', N'내다', NULL, N'보조 용언 (참아 ~)', N'보조 용언',
        N'참아 ~', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 182,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0183_176')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0183_176', N'앉다', NULL, N'Động từ (의자에)', N'Động từ',
        N'의자에', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 183,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0184_177')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0184_177', N'처음', NULL, N'Danh từ (처음 시작하다)', N'Danh từ',
        N'처음 시작하다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 184,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0185_178')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0185_178', N'손', NULL, N'Danh từ (신체의 일부)', N'Danh từ',
        N'신체의 일부', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 185,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0186_179')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0186_179', N'몇', NULL, N'Định từ (몇 개)', N'Định từ',
        N'몇 개', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 186,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0187_180')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0187_180', N'그때', NULL, N'Danh từ (그때 그시절)', N'Danh từ',
        N'그때 그시절', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 187,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0188_181')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0188_181', N'과정', N'過程', N'Danh từ (Hán Hàn: 過程 · 을 겪다)', N'Danh từ',
        N'을 겪다', N'C', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 188,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0189_182')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0189_182', N'삶', NULL, N'Danh từ (을 누리다)', N'Danh từ',
        N'을 누리다', N'C', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 189,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0190_183')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0190_183', N'갖다', NULL, N'Động từ (가지다; 돈을)', N'Động từ',
        N'가지다; 돈을', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 190,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0191_184')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0191_184', N'찾다', NULL, N'Động từ (지갑을)', N'Động từ',
        N'지갑을', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 191,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0192_185')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0192_185', N'특히', N'特-', N'Phó từ (Hán Hàn: 特- · 특히 좋아하다)', N'Phó từ',
        N'특히 좋아하다', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 192,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0193_186')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0193_186', N'시', N'時', N'의존명사 (Hán Hàn: 時 · 몇 시/태어난 시)', N'의존명사',
        N'몇 시/태어난 시', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 193,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0194_187')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0194_187', N'이상', N'以上', N'Danh từ (Hán Hàn: 以上 · 한 시간 이상)', N'Danh từ',
        N'한 시간 이상', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 194,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0195_188')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0195_188', N'지금', N'只今', N'Phó từ (Hán Hàn: 只今 · 지금부터)', N'Phó từ',
        N'지금부터', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 195,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0196_189')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0196_189', N'나가다', NULL, N'Động từ (밖으로)', N'Động từ',
        N'밖으로', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 196,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0197_190')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0197_190', N'이야기', NULL, N'Danh từ (를 들려주다)', N'Danh từ',
        N'를 들려주다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 197,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0198_191')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0198_191', N'교육', N'敎育', N'Danh từ (Hán Hàn: 敎育 · 을 받다)', N'Danh từ',
        N'을 받다', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 198,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0199_192')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0199_192', N'사다', NULL, N'Động từ (물건을)', N'Động từ',
        N'물건을', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 199,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0200_193')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0200_193', N'경제', N'經濟', N'Danh từ (Hán Hàn: 經濟 · 경제 개발)', N'Danh từ',
        N'경제 개발', N'B', N'TOPIK II',
        N'Từ vựng cốt lõi NIKL & TOPIK', 200,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0201_194')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0201_194', N'아직', NULL, N'Phó từ (아직 없다)', N'Phó từ',
        N'아직 없다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 201,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0202_195')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0202_195', N'잡다', NULL, N'Động từ (손을)', N'Động từ',
        N'손을', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 202,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0203_196')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0203_196', N'같이', NULL, N'Phó từ (같이 살다)', N'Phó từ',
        N'같이 살다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 203,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0204_197')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0204_197', N'선생님', N'先生-', N'Danh từ (Hán Hàn: 先生- · 국어 선생님)', N'Danh từ',
        N'국어 선생님', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 204,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0205_198')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0205_198', N'예술', N'藝術', N'Danh từ (Hán Hàn: 藝術 · 예술 작품)', N'Danh từ',
        N'예술 작품', N'B', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 205,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0206_199')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0206_199', N'서다', NULL, N'Động từ (똑바로 서다)', N'Động từ',
        N'똑바로 서다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 206,
        @SourceJulien, 0, 0, 'Published'
    );
END

IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabCode = N'NIKL_SEED_R0207_200')
BEGIN
    INSERT INTO dbo.Vocabulary (
        VocabCode, KoreanWord, Hanja, VietnameseMeaning, PartOfSpeech,
        ExplanationKo, NiklLevel, TopikLevel, TopicName, FrequencyRank,
        SourceId, IsAiCompiled, NeedsExpertReview, Status
    ) VALUES (
        N'NIKL_SEED_R0207_200', N'못', NULL, N'Phó từ (못 마시다)', N'Phó từ',
        N'못 마시다', N'A', N'TOPIK I',
        N'Từ vựng cốt lõi NIKL & TOPIK', 207,
        @SourceJulien, 0, 0, 'Published'
    );
END
COMMIT TRANSACTION;

SELECT
  (SELECT COUNT(*) FROM dbo.LearningPaths) AS LearningPathsCount,
  (SELECT COUNT(*) FROM dbo.LearningLevels) AS LearningLevelsCount,
  (SELECT COUNT(*) FROM dbo.LearningTopics) AS LearningTopicsCount,
  (SELECT COUNT(*) FROM dbo.Lessons) AS LessonsCount,
  (SELECT COUNT(*) FROM dbo.LessonSections) AS LessonSectionsCount,
  (SELECT COUNT(*) FROM dbo.LessonResources) AS LessonResourcesCount,
  (SELECT COUNT(*) FROM dbo.ContentSources) AS ContentSourcesCount,
  (SELECT COUNT(*) FROM dbo.Vocabulary) AS VocabularyCount,
  (SELECT COUNT(*) FROM dbo.Grammar) AS GrammarCount,
  (SELECT COUNT(*) FROM dbo.LessonActivities) AS LessonActivitiesCount,
  (SELECT COUNT(*) FROM dbo.Exercises) AS ExercisesCount,
  (SELECT COUNT(*) FROM dbo.Questions) AS QuestionsCount,
  (SELECT COUNT(*) FROM dbo.QuestionOptions) AS QuestionOptionsCount,
  (SELECT COUNT(*) FROM dbo.LessonCompletionRules) AS LessonCompletionRulesCount,
  (SELECT COUNT(*) FROM dbo.LevelUnlockRules) AS LevelUnlockRulesCount
FOR JSON PATH;
