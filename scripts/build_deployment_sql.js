const fs = require('fs');
const path = require('path');

const mappingsPath = path.resolve('data/flashcard_topic_mappings_proposal_v4_3.json');
const mappings = JSON.parse(fs.readFileSync(mappingsPath, 'utf8'));

let mappingInsertStatements = '';
let batchSize = 100;
for (let i = 0; i < mappings.length; i += batchSize) {
  let chunk = mappings.slice(i, i + batchSize);
  let valuesSql = chunk.map(x => 
    `        (${x.TopicId}, ${x.VocabId}, ${x.IsPrimary}, '${x.ReviewStatus}', 1, ${x.IsDeleted})`
  ).join(',\n');

  mappingInsertStatements += `
    -- Nạp lô mapping ${i + 1} đến ${i + chunk.length}
    MERGE dbo.VocabularyTopicMappings AS target
    USING (VALUES
${valuesSql}
    ) AS source (TopicId, VocabId, IsPrimary, ReviewStatus, DisplayOrder, IsDeleted)
    ON target.TopicId = source.TopicId AND target.VocabId = source.VocabId
    WHEN MATCHED THEN
        UPDATE SET 
            target.IsPrimary = source.IsPrimary,
            target.ReviewStatus = source.ReviewStatus,
            target.DisplayOrder = source.DisplayOrder,
            target.IsDeleted = source.IsDeleted,
            target.UpdatedAt = SYSUTCDATETIME()
    WHEN NOT MATCHED THEN
        INSERT (TopicId, VocabId, IsPrimary, ReviewStatus, DisplayOrder, IsDeleted, CreatedAt, UpdatedAt)
        VALUES (source.TopicId, source.VocabId, source.IsPrimary, source.ReviewStatus, source.DisplayOrder, source.IsDeleted, SYSUTCDATETIME(), SYSUTCDATETIME());
`;
}

const fullSql = `-- =============================================================================
-- HANGO PROJECT - FINAL DATABASE DEPLOYMENT SCRIPT (STAGING)
-- Phiên bản: v4.6.1 Final Blocker Fix & Verification
-- Database: HangoDatasetDB | Target Instance: .\\SQLEXPRESS / Staging SQL Server
-- Nguyên tắc: Tính lũy đẳng (Idempotent), nạp đầy đủ 474 mappings, kiểm tra tiên quyết,
--             kiểm tra sau triển khai, TUYỆT ĐỐI không xóa dữ liệu gốc Vocabulary.
-- =============================================================================

USE [HangoDatasetDB];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

PRINT N'=============================================================================';
PRINT N'BƯỚC 0: KIỂM TRA ĐIỀU KIỆN TIÊN QUYẾT & SAO LƯU (PRE-DEPLOYMENT CHECKS)';
PRINT N'=============================================================================';

-- 0.1. Kiểm tra tồn tại bảng dbo.Vocabulary
IF OBJECT_ID(N'dbo.Vocabulary', N'U') IS NULL
BEGIN
    RAISERROR (N'LỖI BLOCKER: Bảng dbo.Vocabulary không tồn tại trong CSDL HangoDatasetDB. Hủy triển khai.', 20, 1) WITH LOG;
END;

-- 0.2. Kiểm tra tổng số lượng từ vựng gốc (phải đúng 296 bản ghi)
DECLARE @currentVocabCount INT;
SELECT @currentVocabCount = COUNT(*) FROM dbo.Vocabulary;
IF @currentVocabCount <> 296
BEGIN
    RAISERROR (N'LỖI BLOCKER: Số lượng từ vựng hiện tại (%d) không khớp với tiêu chuẩn 296 từ. Hủy triển khai.', 20, 1, @currentVocabCount) WITH LOG;
END;

-- 0.3. Kiểm tra bảo toàn 36 từ vựng Hangeul liên kết với LessonVocabulary
DECLARE @currentLessonVocabCount INT;
SELECT @currentLessonVocabCount = COUNT(*) FROM dbo.LessonVocabulary WHERE VocabId BETWEEN 1 AND 36;
IF @currentLessonVocabCount < 36
BEGIN
    RAISERROR (N'LỖI BLOCKER: Liên kết Lộ trình học (LessonVocabulary) bị thiếu hụt (%d/36). Hủy triển khai.', 20, 1, @currentLessonVocabCount) WITH LOG;
END;

PRINT N'>> [THÀNH CÔNG] Kiểm tra tiên quyết hoàn tất. CSDL sẵn sàng nạp cấu trúc Flashcard theo chủ đề.';
GO

-- =============================================================================
-- BƯỚC 1: BỔ SUNG CỘT CanonicalVocabId VÀO dbo.Vocabulary & RÀNG BUỘC PHÂN CẤP
-- =============================================================================
PRINT N'-----------------------------------------------------------------------------';
PRINT N'BƯỚC 1: BỔ SUNG CỘT CanonicalVocabId & THỦ TỤC / TRIGGER PHÂN CẤP';
PRINT N'-----------------------------------------------------------------------------';

BEGIN TRANSACTION;
BEGIN TRY
    -- 1.1. Thêm cột CanonicalVocabId nếu chưa có
    IF COL_LENGTH('dbo.Vocabulary', 'CanonicalVocabId') IS NULL
    BEGIN
        ALTER TABLE dbo.Vocabulary
        ADD CanonicalVocabId INT NULL;

        ALTER TABLE dbo.Vocabulary
        ADD CONSTRAINT FK_Vocabulary_CanonicalVocabId
        FOREIGN KEY (CanonicalVocabId) REFERENCES dbo.Vocabulary(VocabId);

        PRINT N'>> Đã thêm cột CanonicalVocabId và khóa ngoại tự tham chiếu FK_Vocabulary_CanonicalVocabId.';
    END;

    -- 1.2. Tạo chỉ mục tăng tốc tra cứu quan hệ Canonical
    IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Vocabulary_CanonicalVocabId' AND object_id = OBJECT_ID('dbo.Vocabulary'))
    BEGIN
        CREATE NONCLUSTERED INDEX IX_Vocabulary_CanonicalVocabId 
        ON dbo.Vocabulary (CanonicalVocabId)
        WHERE CanonicalVocabId IS NOT NULL;
        PRINT N'>> Đã tạo chỉ mục IX_Vocabulary_CanonicalVocabId.';
    END;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @errMsg1 NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR (N'Lỗi tại Bước 1: %s', 16, 1, @errMsg1);
END CATCH;
GO

-- 1.3. Cập nhật 6 bản ghi NIKL dự phòng trỏ về từ gốc tương ứng
BEGIN TRANSACTION;
BEGIN TRY
    -- 390 (아이) -> 1
    UPDATE dbo.Vocabulary SET CanonicalVocabId = 1 WHERE VocabId = 390 AND (CanonicalVocabId IS NULL OR CanonicalVocabId <> 1);
    -- 400 (어머니) -> 4
    UPDATE dbo.Vocabulary SET CanonicalVocabId = 4 WHERE VocabId = 400 AND (CanonicalVocabId IS NULL OR CanonicalVocabId <> 4);
    -- 414 (세계) -> 23
    UPDATE dbo.Vocabulary SET CanonicalVocabId = 23 WHERE VocabId = 414 AND (CanonicalVocabId IS NULL OR CanonicalVocabId <> 23);
    -- 451 (왜) -> 24
    UPDATE dbo.Vocabulary SET CanonicalVocabId = 24 WHERE VocabId = 451 AND (CanonicalVocabId IS NULL OR CanonicalVocabId <> 24);
    -- 457 (물) -> 32
    UPDATE dbo.Vocabulary SET CanonicalVocabId = 32 WHERE VocabId = 457 AND (CanonicalVocabId IS NULL OR CanonicalVocabId <> 32);
    -- 494 (선생님) -> 34
    UPDATE dbo.Vocabulary SET CanonicalVocabId = 34 WHERE VocabId = 494 AND (CanonicalVocabId IS NULL OR CanonicalVocabId <> 34);

    PRINT N'>> Đã thiết lập CanonicalVocabId cho 6 cặp từ đồng nghĩa NIKL dự phòng.';
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @errMsg2 NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR (N'Lỗi gán 6 cặp từ Canonical: %s', 16, 1, @errMsg2);
END CATCH;
GO

-- 1.4. Trigger dbo.TR_Vocabulary_EnforceDirectCanonical (Cú pháp T-SQL chuẩn hóa)
CREATE OR ALTER TRIGGER dbo.TR_Vocabulary_EnforceDirectCanonical
ON dbo.Vocabulary
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT UPDATE(CanonicalVocabId) AND NOT EXISTS (SELECT 1 FROM inserted WHERE CanonicalVocabId IS NOT NULL)
        RETURN;

    -- 1. Chặn tự tham chiếu (A -> A)
    IF EXISTS (
        SELECT 1 FROM inserted 
        WHERE CanonicalVocabId IS NOT NULL AND VocabId = CanonicalVocabId
    )
    BEGIN
        RAISERROR (N'[TR_Vocabulary_EnforceDirectCanonical] Vi phạm: Bản ghi không được tự tham chiếu CanonicalVocabId chính nó.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    -- 2. Đích đến phải là từ gốc độc lập (CanonicalVocabId IS NULL) cả trong CSDL và trong batch inserted
    IF EXISTS (
        SELECT 1 
        FROM inserted i
        LEFT JOIN dbo.Vocabulary existingTarget ON i.CanonicalVocabId = existingTarget.VocabId
        LEFT JOIN inserted batchTarget ON i.CanonicalVocabId = batchTarget.VocabId
        WHERE COALESCE(batchTarget.CanonicalVocabId, existingTarget.CanonicalVocabId) IS NOT NULL
    )
    BEGIN
        RAISERROR (N'[TR_Vocabulary_EnforceDirectCanonical] Vi phạm: CanonicalVocabId chỉ được trỏ trực tiếp đến từ gốc độc lập. Không cho phép tạo chuỗi A -> B -> C.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    -- 3. Chặn biến từ gốc thành từ dự phòng khi đang có bản ghi con phụ thuộc
    IF EXISTS (
        SELECT 1 
        FROM inserted i
        WHERE i.CanonicalVocabId IS NOT NULL
          AND EXISTS (
              SELECT 1 FROM dbo.Vocabulary child 
              WHERE child.CanonicalVocabId = i.VocabId 
                AND child.VocabId NOT IN (SELECT VocabId FROM inserted WHERE CanonicalVocabId IS NULL)
          )
    )
    BEGIN
        RAISERROR (N'[TR_Vocabulary_EnforceDirectCanonical] Vi phạm: Không thể chuyển từ vựng gốc thành từ dự phòng khi đang có bản ghi khác phụ thuộc vào nó.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    -- 4. Kiểm tra chu trình lặp kín qua đệ quy CTE (Cú pháp T-SQL chuẩn hóa)
    DECLARE @HasCycleOrDeepChain BIT = 0;

    ;WITH HierarchyCTE AS (
        SELECT 
            i.VocabId AS RootVocabId,
            i.CanonicalVocabId AS NextVocabId,
            1 AS Depth
        FROM inserted i
        WHERE i.CanonicalVocabId IS NOT NULL

        UNION ALL

        SELECT 
            h.RootVocabId,
            v.CanonicalVocabId,
            h.Depth + 1
        FROM HierarchyCTE h
        INNER JOIN dbo.Vocabulary v ON h.NextVocabId = v.VocabId
        WHERE v.CanonicalVocabId IS NOT NULL AND h.Depth < 10
    )
    SELECT TOP 1 @HasCycleOrDeepChain = 1
    FROM HierarchyCTE
    WHERE RootVocabId = NextVocabId OR Depth > 2;

    IF @HasCycleOrDeepChain = 1
    BEGIN
        RAISERROR (N'[TR_Vocabulary_EnforceDirectCanonical] Vi phạm: Phát hiện chu trình vòng lặp hoặc độ sâu phân cấp vượt quá 1 tầng.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
GO
PRINT N'>> Đã triển khai Trigger dbo.TR_Vocabulary_EnforceDirectCanonical.';
GO

-- 1.5. Stored Procedure dbo.usp_Vocabulary_UpdateCanonical
CREATE OR ALTER PROCEDURE dbo.usp_Vocabulary_UpdateCanonical
    @VocabId INT,
    @CanonicalVocabId INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabId = @VocabId)
    BEGIN
        RAISERROR (N'[usp_Vocabulary_UpdateCanonical] Lỗi: VocabId = %d không tồn tại.', 16, 1, @VocabId);
        RETURN -1;
    END;

    IF @CanonicalVocabId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabId = @CanonicalVocabId)
    BEGIN
        RAISERROR (N'[usp_Vocabulary_UpdateCanonical] Lỗi: CanonicalVocabId = %d không tồn tại.', 16, 1, @CanonicalVocabId);
        RETURN -2;
    END;

    BEGIN TRANSACTION;
    BEGIN TRY
        DECLARE @lockResult INT;
        EXEC @lockResult = sp_getapplock 
            @Resource = 'HANGO_CANONICAL_HIERARCHY_MUTEX',
            @LockMode = 'Exclusive',
            @LockOwner = 'Transaction',
            @LockTimeout = 5000;

        IF @lockResult < 0
        BEGIN
            RAISERROR (N'[usp_Vocabulary_UpdateCanonical] Lỗi chiếm khóa tuần tự hóa cây phân cấp (Timeout/Deadlock).', 16, 1);
        END;

        IF @CanonicalVocabId IS NOT NULL
        BEGIN
            IF @VocabId = @CanonicalVocabId
            BEGIN
                RAISERROR (N'[usp_Vocabulary_UpdateCanonical] Bản ghi không được tự tham chiếu chính nó.', 16, 1);
            END;

            IF EXISTS (
                SELECT 1 FROM dbo.Vocabulary WITH (UPDLOCK, HOLDLOCK)
                WHERE VocabId = @CanonicalVocabId AND CanonicalVocabId IS NOT NULL
            )
            BEGIN
                RAISERROR (N'[usp_Vocabulary_UpdateCanonical] Đích đến đang là từ dự phòng. Không cho phép A -> B -> C.', 16, 1);
            END;

            IF EXISTS (
                SELECT 1 FROM dbo.Vocabulary WITH (UPDLOCK, HOLDLOCK)
                WHERE CanonicalVocabId = @VocabId
            )
            BEGIN
                RAISERROR (N'[usp_Vocabulary_UpdateCanonical] Không thể chuyển từ gốc thành từ dự phòng khi đang có bản ghi khác phụ thuộc.', 16, 1);
            END;
        END;

        UPDATE dbo.Vocabulary
        SET CanonicalVocabId = @CanonicalVocabId,
            UpdatedAt = SYSUTCDATETIME()
        WHERE VocabId = @VocabId;

        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @err NVARCHAR(4000) = ERROR_MESSAGE(), @sev INT = ERROR_SEVERITY(), @st INT = ERROR_STATE();
        RAISERROR (@err, @sev, @st);
        RETURN -1;
    END CATCH
END;
GO
PRINT N'>> Đã triển khai Stored Procedure dbo.usp_Vocabulary_UpdateCanonical.';
GO

-- =============================================================================
-- BƯỚC 2: TẠO BẢNG dbo.VocabularyTopics (BỔ SUNG IsActive & IsDeleted) VÀ NẠP 11 CHỦ ĐỀ
-- =============================================================================
PRINT N'-----------------------------------------------------------------------------';
PRINT N'BƯỚC 2: TẠO BẢNG dbo.VocabularyTopics & NẠP 11 CHỦ ĐỀ FLASHCARD';
PRINT N'-----------------------------------------------------------------------------';

IF OBJECT_ID(N'dbo.VocabularyTopics', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VocabularyTopics (
        TopicId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_VocabularyTopics PRIMARY KEY,
        TopicCode VARCHAR(64) NOT NULL CONSTRAINT UQ_VocabularyTopics_TopicCode UNIQUE,
        TopicNameVi NVARCHAR(255) NOT NULL,
        TopicNameKo NVARCHAR(255) NOT NULL,
        Icon NVARCHAR(64) NOT NULL CONSTRAINT DF_VocabularyTopics_Icon DEFAULT ('Sparkles'),
        DisplayOrder INT NOT NULL CONSTRAINT DF_VocabularyTopics_DisplayOrder DEFAULT (1),
        TotalWords INT NOT NULL CONSTRAINT DF_VocabularyTopics_TotalWords DEFAULT (0),
        IsActive BIT NOT NULL CONSTRAINT DF_VocabularyTopics_IsActive DEFAULT (1), -- Bổ sung phân biệt Active
        IsAdminOnly BIT NOT NULL CONSTRAINT DF_VocabularyTopics_IsAdminOnly DEFAULT (0),
        IsDeleted BIT NOT NULL CONSTRAINT DF_VocabularyTopics_IsDeleted DEFAULT (0),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_VocabularyTopics_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_VocabularyTopics_UpdatedAt DEFAULT (SYSUTCDATETIME())
    );

    CREATE NONCLUSTERED INDEX IX_VocabularyTopics_Active_Admin_Deleted 
    ON dbo.VocabularyTopics (IsActive, IsAdminOnly, IsDeleted, DisplayOrder);

    PRINT N'>> Đã tạo bảng dbo.VocabularyTopics thành công (Bao gồm cả IsActive và IsDeleted).';
END;
GO

-- 2.2. Nạp dữ liệu 11 chủ đề chuẩn hóa (Idempotent MERGE)
MERGE dbo.VocabularyTopics AS target
USING (VALUES
    (1, 'GIA_DINH_BAN_THAN', N'Gia đình & Bản thân', N'가족과 자신', 'Heart', 1, 35, 1, 0, 0),
    (2, 'TRUONG_HOC_GIAO_DUC', N'Trường học & Giáo dục', N'학교와 교육', 'GraduationCap', 2, 42, 1, 0, 0),
    (3, 'AM_THUC_AN_UONG', N'Ẩm thực & Ăn uống', N'음식과 식사', 'Utensils', 3, 40, 1, 0, 0),
    (4, 'DU_LICH_GIAO_THONG', N'Du lịch, Nơi chốn & Giao thông', N'여행, 장소와 교통', 'Plane', 4, 48, 1, 0, 0),
    (5, 'MUA_SAM_TIEN_TE', N'Mua sắm & Tiền tệ, Giá cả', N'쇼핑과 화폐, 가격', 'ShoppingBag', 5, 36, 1, 0, 0),
    (6, 'NGHE_NGHIEP_CONG_VIEC', N'Nghề nghiệp & Công việc', N'직업과 일', 'Briefcase', 6, 38, 1, 0, 0),
    (7, 'SUC_KHOE_CO_THE', N'Sức khỏe & Cơ thể, Thể thao', N'건강, 신체와 운동', 'Activity', 7, 34, 1, 0, 0),
    (8, 'GIAO_TIEP_HANG_NGAY', N'Giao tiếp hằng ngày', N'일상 의사소통', 'MessageCircle', 8, 45, 1, 0, 0),
    (9, 'THOI_GIAN_CON_SO', N'Thời gian & Con số', N'시간과 숫자', 'Clock', 9, 39, 1, 0, 0),
    (10, 'DONG_VAT_THIEN_NHIEN', N'Động vật & Thiên nhiên', N'동물과 자연', 'Sun', 10, 36, 1, 0, 0),
    (11, 'CHUA_PHAN_LOAI', N'Chưa phân loại - Ngữ pháp / Trừu tượng', N'문법 및 미분류', 'FolderLock', 11, 21, 1, 1, 0)
) AS source (TopicId, TopicCode, TopicNameVi, TopicNameKo, Icon, DisplayOrder, TotalWords, IsActive, IsAdminOnly, IsDeleted)
ON target.TopicCode = source.TopicCode
WHEN MATCHED THEN
    UPDATE SET 
        target.TopicNameVi = source.TopicNameVi,
        target.TopicNameKo = source.TopicNameKo,
        target.Icon = source.Icon,
        target.DisplayOrder = source.DisplayOrder,
        target.TotalWords = source.TotalWords,
        target.IsActive = source.IsActive,
        target.IsAdminOnly = source.IsAdminOnly,
        target.IsDeleted = source.IsDeleted,
        target.UpdatedAt = SYSUTCDATETIME()
WHEN NOT MATCHED THEN
    INSERT (TopicCode, TopicNameVi, TopicNameKo, Icon, DisplayOrder, TotalWords, IsActive, IsAdminOnly, IsDeleted, CreatedAt, UpdatedAt)
    VALUES (source.TopicCode, source.TopicNameVi, source.TopicNameKo, source.Icon, source.DisplayOrder, source.TotalWords, source.IsActive, source.IsAdminOnly, source.IsDeleted, SYSUTCDATETIME(), SYSUTCDATETIME());
GO
PRINT N'>> Đã nạp thành công 11 danh mục Flashcard vào dbo.VocabularyTopics.';
GO

-- 2.3. Trigger dbo.TR_VocabularyTopics_EnforceStatusConsistency
CREATE OR ALTER TRIGGER dbo.TR_VocabularyTopics_EnforceStatusConsistency
ON dbo.VocabularyTopics
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Chặn chuyển sang IsAdminOnly=1 hoặc IsActive=0 khi đang chứa mapping ACTIVE hoặc Primary
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN deleted d ON i.TopicId = d.TopicId
        INNER JOIN dbo.VocabularyTopicMappings m WITH (HOLDLOCK, UPDLOCK) ON i.TopicId = m.TopicId
        WHERE ((d.IsAdminOnly = 0 AND i.IsAdminOnly = 1) OR (d.IsActive = 1 AND i.IsActive = 0))
          AND m.IsDeleted = 0
          AND (m.IsPrimary = 1 OR m.ReviewStatus = 'ACTIVE')
    )
    BEGIN
        RAISERROR (N'[TR_VocabularyTopics_EnforceStatusConsistency] Không thể chuyển Topic sang Admin-only hoặc Inactive khi đang chứa Mapping IsPrimary=1 hoặc ReviewStatus=ACTIVE.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    -- Sửa lỗi multi-row cascading soft-delete: Chỉ xóa mapping của các topic THỰC SỰ chuyển từ 0 sang 1
    UPDATE m
    SET m.IsDeleted = 1,
        m.UpdatedAt = SYSUTCDATETIME()
    FROM dbo.VocabularyTopicMappings m
    INNER JOIN (
        SELECT i.TopicId
        FROM inserted i
        INNER JOIN deleted d ON i.TopicId = d.TopicId
        WHERE d.IsDeleted = 0 AND i.IsDeleted = 1
    ) t ON m.TopicId = t.TopicId
    WHERE m.IsDeleted = 0;
END;
GO
PRINT N'>> Đã triển khai Trigger dbo.TR_VocabularyTopics_EnforceStatusConsistency.';
GO

-- =============================================================================
-- BƯỚC 3: TẠO BẢNG dbo.VocabularyTopicMappings, NẠP 474 MAPPINGS & THỦ TỤC
-- =============================================================================
PRINT N'-----------------------------------------------------------------------------';
PRINT N'BƯỚC 3: TẠO BẢNG dbo.VocabularyTopicMappings & NẠP 474 MAPPINGS STAGING';
PRINT N'-----------------------------------------------------------------------------';

IF OBJECT_ID(N'dbo.VocabularyTopicMappings', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.VocabularyTopicMappings (
        MappingId INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_VocabularyTopicMappings PRIMARY KEY,
        TopicId INT NOT NULL CONSTRAINT FK_VocabularyTopicMappings_Topics FOREIGN KEY REFERENCES dbo.VocabularyTopics(TopicId),
        VocabId INT NOT NULL CONSTRAINT FK_VocabularyTopicMappings_Vocab FOREIGN KEY REFERENCES dbo.Vocabulary(VocabId),
        IsPrimary BIT NOT NULL CONSTRAINT DF_VocabularyTopicMappings_IsPrimary DEFAULT (0),
        ReviewStatus VARCHAR(32) NOT NULL CONSTRAINT DF_VocabularyTopicMappings_ReviewStatus DEFAULT ('ACTIVE'),
        DisplayOrder INT NOT NULL CONSTRAINT DF_VocabularyTopicMappings_DisplayOrder DEFAULT (1),
        IsDeleted BIT NOT NULL CONSTRAINT DF_VocabularyTopicMappings_IsDeleted DEFAULT (0),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_VocabularyTopicMappings_CreatedAt DEFAULT (SYSUTCDATETIME()),
        UpdatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_VocabularyTopicMappings_UpdatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_VocabularyTopicMappings_Topic_Vocab UNIQUE (TopicId, VocabId),
        CONSTRAINT CK_VocabularyTopicMappings_ReviewStatus CHECK (ReviewStatus IN ('ACTIVE', 'INACTIVE', 'DUPLICATE_STANDBY', 'GRAMMAR_AUXILIARY'))
    );

    -- Unique Filtered Index: Mỗi từ chỉ có đúng 1 Mapping IsPrimary = 1 (khi IsDeleted = 0)
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Primary_Mapping 
    ON dbo.VocabularyTopicMappings (VocabId) 
    WHERE IsPrimary = 1 AND IsDeleted = 0;

    CREATE NONCLUSTERED INDEX IX_VocabularyTopicMappings_QueryStudent
    ON dbo.VocabularyTopicMappings (TopicId, ReviewStatus, IsDeleted, IsPrimary)
    INCLUDE (VocabId, DisplayOrder);

    PRINT N'>> Đã tạo bảng dbo.VocabularyTopicMappings và Unique Filtered Index UQ_Primary_Mapping.';
END;
GO

-- 3.1. BƯỚC NẠP DỮ LIỆU THỰC TẾ 474 MAPPINGS TỪ FILE STAGING
PRINT N'>> Bắt đầu nạp 474 mappings từ nguồn staging proposal...';
BEGIN TRANSACTION;
BEGIN TRY
${mappingInsertStatements}
    COMMIT TRANSACTION;
    PRINT N'>> Đã nạp thành công toàn bộ 474 mappings vào dbo.VocabularyTopicMappings.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    DECLARE @errMsgMap NVARCHAR(4000) = ERROR_MESSAGE();
    RAISERROR (N'Lỗi nạp dữ liệu mappings: %s', 16, 1, @errMsgMap);
END CATCH;
GO

-- 3.2. Trigger dbo.TR_VocabularyTopicMappings_EnforceStatusConsistency
CREATE OR ALTER TRIGGER dbo.TR_VocabularyTopicMappings_EnforceStatusConsistency
ON dbo.VocabularyTopicMappings
AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra 1: Topic Admin-only, Inactive hoặc soft-deleted không được chứa mapping ACTIVE hoặc IsPrimary=1
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.VocabularyTopics t WITH (HOLDLOCK) ON i.TopicId = t.TopicId
        WHERE (t.IsAdminOnly = 1 OR t.IsActive = 0 OR t.IsDeleted = 1)
          AND i.IsDeleted = 0
          AND (i.ReviewStatus = 'ACTIVE' OR i.IsPrimary = 1)
    )
    BEGIN
        RAISERROR (N'[TR_VocabularyTopicMappings_EnforceStatusConsistency] Topic Admin-only, Inactive hoặc soft-deleted không được chứa mapping ACTIVE hoặc IsPrimary=1.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    -- Kiểm tra 2: Topic Student không được chứa GRAMMAR_AUXILIARY
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.VocabularyTopics t WITH (HOLDLOCK) ON i.TopicId = t.TopicId
        WHERE t.IsAdminOnly = 0
          AND i.ReviewStatus = 'GRAMMAR_AUXILIARY'
          AND i.IsDeleted = 0
    )
    BEGIN
        RAISERROR (N'[TR_VocabularyTopicMappings_EnforceStatusConsistency] Topic học tập của Student không được chứa từ vựng phân loại GRAMMAR_AUXILIARY.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    -- Kiểm tra 3: Thẻ Standby không được phép là Primary
    IF EXISTS (
        SELECT 1
        FROM inserted i
        WHERE i.ReviewStatus = 'DUPLICATE_STANDBY'
          AND i.IsPrimary = 1
          AND i.IsDeleted = 0
    )
    BEGIN
        RAISERROR (N'[TR_VocabularyTopicMappings_EnforceStatusConsistency] Từ dự phòng DUPLICATE_STANDBY không được phép thiết lập IsPrimary=1.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;

    -- Kiểm tra 4: Từ Canonical độc lập (CanonicalVocabId IS NULL) KHÔNG ĐƯỢC gán DUPLICATE_STANDBY
    IF EXISTS (
        SELECT 1
        FROM inserted i
        INNER JOIN dbo.Vocabulary v ON i.VocabId = v.VocabId
        WHERE v.CanonicalVocabId IS NULL
          AND i.ReviewStatus = 'DUPLICATE_STANDBY'
          AND i.IsDeleted = 0
    )
    BEGIN
        RAISERROR (N'[TR_VocabularyTopicMappings_EnforceStatusConsistency] Từ độc lập (CanonicalVocabId IS NULL) không được gán ReviewStatus = DUPLICATE_STANDBY.', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END;
END;
GO
PRINT N'>> Đã triển khai Trigger dbo.TR_VocabularyTopicMappings_EnforceStatusConsistency.';
GO

-- 3.3. Stored Procedure dbo.usp_Flashcard_UpsertTopicMapping
CREATE OR ALTER PROCEDURE dbo.usp_Flashcard_UpsertTopicMapping
    @TopicId INT,
    @VocabId INT,
    @IsPrimary BIT = 0,
    @ReviewStatus VARCHAR(32) = 'ACTIVE',
    @DisplayOrder INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @ReviewStatus NOT IN ('ACTIVE', 'INACTIVE', 'DUPLICATE_STANDBY', 'GRAMMAR_AUXILIARY')
    BEGIN
        RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: ReviewStatus không hợp lệ (%s).', 16, 1, @ReviewStatus);
        RETURN -1;
    END;

    IF @IsPrimary = 1 AND @ReviewStatus <> 'ACTIVE'
    BEGIN
        RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: Chỉ mapping có ReviewStatus = ACTIVE mới được phép thiết lập IsPrimary = 1.', 16, 1);
        RETURN -2;
    END;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Khóa và kiểm tra bảng cha Topic
        DECLARE @isAdminOnly BIT, @isActive BIT, @isDeleted BIT;
        SELECT 
            @isAdminOnly = IsAdminOnly,
            @isActive = IsActive,
            @isDeleted = IsDeleted
        FROM dbo.VocabularyTopics WITH (UPDLOCK, HOLDLOCK)
        WHERE TopicId = @TopicId;

        IF @isAdminOnly IS NULL
        BEGIN
            RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: TopicId = %d không tồn tại.', 16, 1, @TopicId);
        END;

        IF @isDeleted = 1 OR @isActive = 0
        BEGIN
            RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: Không thể thêm/sửa mapping trong Topic đã bị soft-delete hoặc Inactive.', 16, 1);
        END;

        IF @isAdminOnly = 1 AND (@ReviewStatus = 'ACTIVE' OR @IsPrimary = 1)
        BEGIN
            RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: Topic Admin-only không được phép chứa mapping ACTIVE hoặc IsPrimary=1.', 16, 1);
        END;

        IF @isAdminOnly = 0 AND @ReviewStatus = 'GRAMMAR_AUXILIARY'
        BEGIN
            RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: Topic học tập của Student không được phép chứa thẻ GRAMMAR_AUXILIARY.', 16, 1);
        END;

        -- Khóa và kiểm tra từ vựng
        DECLARE @canonicalId INT;
        SELECT @canonicalId = CanonicalVocabId 
        FROM dbo.Vocabulary WITH (UPDLOCK, HOLDLOCK)
        WHERE VocabId = @VocabId;

        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: VocabId = %d không tồn tại trong kho từ vựng.', 16, 1, @VocabId);
        END;

        -- Ràng buộc Canonical Standby
        IF @canonicalId IS NOT NULL
        BEGIN
            IF @ReviewStatus <> 'DUPLICATE_STANDBY' OR @IsPrimary = 1
            BEGIN
                RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: Từ dự phòng buộc phải có ReviewStatus = DUPLICATE_STANDBY và IsPrimary = 0.', 16, 1);
            END;
        END
        ELSE
        BEGIN
            IF @ReviewStatus = 'DUPLICATE_STANDBY'
            BEGIN
                RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: Từ gốc độc lập không được gán DUPLICATE_STANDBY.', 16, 1);
            END;
        END;

        -- Đảm bảo chỉ mục duy nhất UQ_Primary_Mapping
        IF @IsPrimary = 1
        BEGIN
            UPDATE dbo.VocabularyTopicMappings
            SET IsPrimary = 0,
                UpdatedAt = SYSUTCDATETIME()
            WHERE VocabId = @VocabId 
              AND IsPrimary = 1 
              AND TopicId <> @TopicId
              AND IsDeleted = 0;
        END;

        IF EXISTS (SELECT 1 FROM dbo.VocabularyTopicMappings WHERE TopicId = @TopicId AND VocabId = @VocabId)
        BEGIN
            UPDATE dbo.VocabularyTopicMappings
            SET IsPrimary = @IsPrimary,
                ReviewStatus = @ReviewStatus,
                DisplayOrder = @DisplayOrder,
                IsDeleted = 0,
                UpdatedAt = SYSUTCDATETIME()
            WHERE TopicId = @TopicId AND VocabId = @VocabId;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.VocabularyTopicMappings (TopicId, VocabId, IsPrimary, ReviewStatus, DisplayOrder, IsDeleted, CreatedAt, UpdatedAt)
            VALUES (@TopicId, @VocabId, @IsPrimary, @ReviewStatus, @DisplayOrder, 0, SYSUTCDATETIME(), SYSUTCDATETIME());
        END;

        COMMIT TRANSACTION;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @err NVARCHAR(4000) = ERROR_MESSAGE(), @sev INT = ERROR_SEVERITY(), @st INT = ERROR_STATE();
        RAISERROR (@err, @sev, @st);
        RETURN -1;
    END CATCH
END;
GO
PRINT N'>> Đã triển khai Stored Procedure dbo.usp_Flashcard_UpsertTopicMapping.';
GO

-- 3.4. Stored Procedure dbo.usp_Flashcard_BatchUpsertTopicMappings
CREATE OR ALTER PROCEDURE dbo.usp_Flashcard_BatchUpsertTopicMappings
    @MappingsJson NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF ISJSON(@MappingsJson) <> 1
    BEGIN
        RAISERROR (N'[usp_Flashcard_BatchUpsertTopicMappings] Lỗi: Tham số đầu vào không phải định dạng JSON hợp lệ.', 16, 1);
        RETURN -1;
    END;

    CREATE TABLE #BatchItems (
        RowId INT IDENTITY(1,1) PRIMARY KEY,
        TopicId INT NOT NULL,
        VocabId INT NOT NULL,
        IsPrimary BIT NOT NULL,
        ReviewStatus VARCHAR(32) NOT NULL,
        DisplayOrder INT NOT NULL
    );

    INSERT INTO #BatchItems (TopicId, VocabId, IsPrimary, ReviewStatus, DisplayOrder)
    SELECT 
        JSON_VALUE(value, '$.TopicId'),
        JSON_VALUE(value, '$.VocabId'),
        ISNULL(CAST(JSON_VALUE(value, '$.IsPrimary') AS BIT), 0),
        ISNULL(JSON_VALUE(value, '$.ReviewStatus'), 'ACTIVE'),
        ISNULL(CAST(JSON_VALUE(value, '$.DisplayOrder') AS INT), 1)
    FROM OPENJSON(@MappingsJson);

    BEGIN TRANSACTION;
    BEGIN TRY
        -- Khóa toàn bộ các Topic theo thứ tự TopicId tăng dần
        DECLARE @currentTopicId INT;
        DECLARE topicCursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT DISTINCT TopicId FROM #BatchItems ORDER BY TopicId ASC;

        OPEN topicCursor;
        FETCH NEXT FROM topicCursor INTO @currentTopicId;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            DECLARE @isAdminOnly BIT, @isActive BIT, @isDeleted BIT;
            SELECT @isAdminOnly = IsAdminOnly, @isActive = IsActive, @isDeleted = IsDeleted
            FROM dbo.VocabularyTopics WITH (UPDLOCK, HOLDLOCK)
            WHERE TopicId = @currentTopicId;

            IF @isAdminOnly IS NULL
            BEGIN
                CLOSE topicCursor; DEALLOCATE topicCursor;
                RAISERROR (N'Lỗi Batch: TopicId = %d không tồn tại.', 16, 1, @currentTopicId);
            END;

            IF @isDeleted = 1 OR @isActive = 0
            BEGIN
                CLOSE topicCursor; DEALLOCATE topicCursor;
                RAISERROR (N'Lỗi Batch: TopicId = %d đã bị soft-delete hoặc Inactive.', 16, 1, @currentTopicId);
            END;

            FETCH NEXT FROM topicCursor INTO @currentTopicId;
        END;
        CLOSE topicCursor; DEALLOCATE topicCursor;

        DECLARE @rowId INT, @tId INT, @vId INT, @pri BIT, @status VARCHAR(32), @ord INT;
        DECLARE itemCursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT RowId, TopicId, VocabId, IsPrimary, ReviewStatus, DisplayOrder FROM #BatchItems ORDER BY TopicId ASC, VocabId ASC;

        OPEN itemCursor;
        FETCH NEXT FROM itemCursor INTO @rowId, @tId, @vId, @pri, @status, @ord;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            EXEC dbo.usp_Flashcard_UpsertTopicMapping 
                @TopicId = @tId, 
                @VocabId = @vId, 
                @IsPrimary = @pri, 
                @ReviewStatus = @status, 
                @DisplayOrder = @ord;

            FETCH NEXT FROM itemCursor INTO @rowId, @tId, @vId, @pri, @status, @ord;
        END;
        CLOSE itemCursor; DEALLOCATE itemCursor;

        COMMIT TRANSACTION;
        DROP TABLE #BatchItems;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF OBJECT_ID('tempdb..#BatchItems') IS NOT NULL DROP TABLE #BatchItems;
        DECLARE @err NVARCHAR(4000) = ERROR_MESSAGE(), @sev INT = ERROR_SEVERITY(), @st INT = ERROR_STATE();
        RAISERROR (@err, @sev, @st);
        RETURN -1;
    END CATCH
END;
GO
PRINT N'>> Đã triển khai Stored Procedure dbo.usp_Flashcard_BatchUpsertTopicMappings.';
GO

-- =============================================================================
-- BƯỚC 4: TẠO BẢNG dbo.UserXPLog VÀ THỦ TỤC GHI NHẬN XP IDEMPOTENCY
-- =============================================================================
PRINT N'-----------------------------------------------------------------------------';
PRINT N'BƯỚC 4: TẠO BẢNG dbo.UserXPLog & THỦ TỤC XP IDEMPOTENCY';
PRINT N'-----------------------------------------------------------------------------';

IF OBJECT_ID(N'dbo.UserXPLog', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.UserXPLog (
        LogId BIGINT IDENTITY(1,1) NOT NULL CONSTRAINT PK_UserXPLog PRIMARY KEY,
        ClientReviewUUID UNIQUEIDENTIFIER NOT NULL,
        UserUid NVARCHAR(128) NOT NULL,
        ActivityType VARCHAR(32) NOT NULL,
        SourceEntityId INT NOT NULL,
        XpAmount INT NOT NULL CONSTRAINT CK_UserXPLog_Amount CHECK (XpAmount >= 0),
        IsBackfill BIT NOT NULL CONSTRAINT DF_UserXPLog_IsBackfill DEFAULT (0),
        CreatedAt DATETIME2(3) NOT NULL CONSTRAINT DF_UserXPLog_CreatedAt DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT UQ_UserXPLog_ClientUUID UNIQUE (ClientReviewUUID)
    );

    CREATE NONCLUSTERED INDEX IX_UserXPLog_User_Activity 
    ON dbo.UserXPLog (UserUid, ActivityType, CreatedAt DESC);

    PRINT N'>> Đã tạo bảng dbo.UserXPLog và Unique Constraint UQ_UserXPLog_ClientUUID.';
END;
GO

-- 4.2. Stored Procedure dbo.usp_UserXP_RecordReview
CREATE OR ALTER PROCEDURE dbo.usp_UserXP_RecordReview
    @ClientReviewUUID UNIQUEIDENTIFIER,
    @UserUid NVARCHAR(128),
    @VocabId INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @XpAmount INT = 15;

    -- Kiểm tra VocabId hợp lệ trong kho từ vựng
    IF NOT EXISTS (SELECT 1 FROM dbo.Vocabulary WHERE VocabId = @VocabId)
    BEGIN
        RAISERROR (N'[usp_UserXP_RecordReview] Lỗi: VocabId = %d không tồn tại.', 16, 1, @VocabId);
        RETURN -1;
    END;

    BEGIN TRANSACTION;
    BEGIN TRY
        IF NOT EXISTS (SELECT 1 FROM dbo.UserLearningProgress WITH (UPDLOCK, HOLDLOCK) WHERE UserUid = @UserUid)
        BEGIN
            RAISERROR (N'[usp_UserXP_RecordReview] Lỗi: Hồ sơ UserUid = %s không tồn tại.', 16, 1, @UserUid);
        END;

        DECLARE @existingUid NVARCHAR(128), @existingAct VARCHAR(32), @existingSrc INT, @existingXp INT;
        SELECT 
            @existingUid = UserUid,
            @existingAct = ActivityType,
            @existingSrc = SourceEntityId,
            @existingXp = XpAmount
        FROM dbo.UserXPLog WITH (UPDLOCK, HOLDLOCK)
        WHERE ClientReviewUUID = @ClientReviewUUID;

        IF @existingUid IS NOT NULL
        BEGIN
            -- Kiểm tra khớp TOÀN BỘ 4 thuộc tính (UserUid, ActivityType, SourceEntityId, XpAmount)
            IF @existingUid = @UserUid AND @existingAct = 'SRS_REVIEW' AND @existingSrc = @VocabId AND @existingXp = @XpAmount
            BEGIN
                COMMIT TRANSACTION;
                SELECT 'ALREADY_PROCESSED' AS Status, 0 AS XpAwarded, N'Lượt ôn tập đã được ghi nhận trước đó.' AS Message;
                RETURN 0;
            END
            ELSE
            BEGIN
                ROLLBACK TRANSACTION;
                RAISERROR (N'[usp_UserXP_RecordReview] Lỗi xung đột: UUID đã được sử dụng cho một giao dịch khác không khớp thuộc tính (UUID_COLLISION_FRAUD).', 16, 1);
                RETURN -2;
            END;
        END;

        INSERT INTO dbo.UserXPLog (ClientReviewUUID, UserUid, ActivityType, SourceEntityId, XpAmount, CreatedAt)
        VALUES (@ClientReviewUUID, @UserUid, 'SRS_REVIEW', @VocabId, @XpAmount, SYSUTCDATETIME());

        UPDATE dbo.UserLearningProgress
        SET TotalXpEarned = TotalXpEarned + @XpAmount,
            UpdatedAt = SYSUTCDATETIME()
        WHERE UserUid = @UserUid;

        IF @@ROWCOUNT <> 1
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR (N'[usp_UserXP_RecordReview] Lỗi: Cập nhật tổng XP không tác động đúng 1 dòng.', 16, 1);
            RETURN -3;
        END;

        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS Status, @XpAmount AS XpAwarded, N'Cộng điểm XP thành công.' AS Message;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() IN (2601, 2627)
        BEGIN
            -- Kiểm tra lại để xác định xem có phải concurrent request cùng nội dung hay không
            SELECT 
                @existingUid = UserUid,
                @existingAct = ActivityType,
                @existingSrc = SourceEntityId,
                @existingXp = XpAmount
            FROM dbo.UserXPLog
            WHERE ClientReviewUUID = @ClientReviewUUID;

            IF @existingUid = @UserUid AND @existingAct = 'SRS_REVIEW' AND @existingSrc = @VocabId AND @existingXp = @XpAmount
            BEGIN
                SELECT 'ALREADY_PROCESSED' AS Status, 0 AS XpAwarded, N'Giao dịch đồng thời đã được xử lý bởi request song song.' AS Message;
                RETURN 0;
            END
            ELSE
            BEGIN
                RAISERROR (N'[usp_UserXP_RecordReview] Lỗi xung đột UUID khi xử lý giao dịch đồng thời.', 16, 1);
                RETURN -4;
            END;
        END;
        DECLARE @err NVARCHAR(4000) = ERROR_MESSAGE(), @sev INT = ERROR_SEVERITY(), @st INT = ERROR_STATE();
        RAISERROR (@err, @sev, @st);
        RETURN -99;
    END CATCH
END;
GO
PRINT N'>> Đã triển khai Stored Procedure dbo.usp_UserXP_RecordReview.';
GO

-- =============================================================================
-- BƯỚC 5: PHÂN QUYỀN DATABASE ROLE BẢO VỆ MAPPING & CANONICAL
-- =============================================================================
PRINT N'-----------------------------------------------------------------------------';
PRINT N'BƯỚC 5: CẤU HÌNH DATABASE ROLE HangoAppRole';
PRINT N'-----------------------------------------------------------------------------';

IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'HangoAppRole' AND type = 'R')
BEGIN
    CREATE ROLE [HangoAppRole];
END;

ALTER ROLE [db_datareader] ADD MEMBER [HangoAppRole];
IF IS_ROLEMEMBER('db_datawriter', 'HangoAppRole') = 1
    ALTER ROLE [db_datawriter] DROP MEMBER [HangoAppRole];
IF IS_ROLEMEMBER('db_owner', 'HangoAppRole') = 1
    ALTER ROLE [db_owner] DROP MEMBER [HangoAppRole];

GRANT SELECT ON dbo.Vocabulary TO [HangoAppRole];
GRANT SELECT ON dbo.VocabularyTopics TO [HangoAppRole];
GRANT SELECT ON dbo.VocabularyTopicMappings TO [HangoAppRole];
GRANT SELECT ON dbo.UserXPLog TO [HangoAppRole];

DENY INSERT, UPDATE, DELETE ON dbo.VocabularyTopicMappings TO [HangoAppRole];
DENY UPDATE ON dbo.Vocabulary(CanonicalVocabId) TO [HangoAppRole];

GRANT EXECUTE ON dbo.usp_Flashcard_UpsertTopicMapping TO [HangoAppRole];
GRANT EXECUTE ON dbo.usp_Flashcard_BatchUpsertTopicMappings TO [HangoAppRole];
GRANT EXECUTE ON dbo.usp_Vocabulary_UpdateCanonical TO [HangoAppRole];
GRANT EXECUTE ON dbo.usp_UserXP_RecordReview TO [HangoAppRole];
GO
PRINT N'>> Đã hoàn tất cấu hình phân quyền Role HangoAppRole.';
GO

-- =============================================================================
-- BƯỚC 6: KIỂM TRA ĐỐI SOÁT HẬU TRIỂN KHAI (POST-DEPLOYMENT AUDIT)
-- =============================================================================
PRINT N'=============================================================================';
PRINT N'BƯỚC 6: KIỂM TOÁN VÀ ĐỐI SOÁT SAU TRIỂN KHAI (VALIDATION AUDIT)';
PRINT N'=============================================================================';

DECLARE @checkVocabCount INT;
SELECT @checkVocabCount = COUNT(*) FROM dbo.Vocabulary;

DECLARE @checkTopicsCount INT;
SELECT @checkTopicsCount = COUNT(*) FROM dbo.VocabularyTopics;

DECLARE @checkStandbyCount INT;
SELECT @checkStandbyCount = COUNT(*) FROM dbo.Vocabulary WHERE CanonicalVocabId IS NOT NULL;

DECLARE @checkLessonLockCount INT;
SELECT @checkLessonLockCount = COUNT(*) FROM dbo.LessonVocabulary WHERE VocabId BETWEEN 1 AND 36;

DECLARE @checkMappingsCount INT;
SELECT @checkMappingsCount = COUNT(*) FROM dbo.VocabularyTopicMappings;

DECLARE @checkPrimaryCount INT;
SELECT @checkPrimaryCount = COUNT(*) FROM dbo.VocabularyTopicMappings WHERE IsPrimary = 1 AND IsDeleted = 0;

DECLARE @checkActiveCount INT;
SELECT @checkActiveCount = COUNT(*) FROM dbo.VocabularyTopicMappings WHERE ReviewStatus = 'ACTIVE' AND IsDeleted = 0;

PRINT N'>> KẾT QUẢ ĐỐI SOÁT CHỈ SỐ:';
PRINT N'   - Tổng số từ vựng: ' + CAST(@checkVocabCount AS NVARCHAR(10)) + N'/296';
PRINT N'   - Tổng số chủ đề: ' + CAST(@checkTopicsCount AS NVARCHAR(10)) + N'/11';
PRINT N'   - Số từ NIKL dự phòng: ' + CAST(@checkStandbyCount AS NVARCHAR(10)) + N'/6';
PRINT N'   - Khóa Lộ trình Hangeul: ' + CAST(@checkLessonLockCount AS NVARCHAR(10)) + N'/36';
PRINT N'   - Tổng số mappings: ' + CAST(@checkMappingsCount AS NVARCHAR(10)) + N'/474';
PRINT N'   - Mapping IsPrimary = 1: ' + CAST(@checkPrimaryCount AS NVARCHAR(10)) + N'/269';
PRINT N'   - Mapping ACTIVE: ' + CAST(@checkActiveCount AS NVARCHAR(10)) + N'/447';

IF @checkVocabCount = 296 AND @checkTopicsCount = 11 AND @checkStandbyCount = 6 
   AND @checkLessonLockCount >= 36 AND @checkMappingsCount = 474 
   AND @checkPrimaryCount = 269 AND @checkActiveCount = 447
BEGIN
    PRINT N'>> [THÀNH CÔNG RỰC RỠ] TOÀN BỘ SCRIPT TRIỂN KHAI ĐÃ ĐẠT CHUẨN XÁC TOÀN VẸN 100%!';
END
ELSE
BEGIN
    RAISERROR (N'CẢNH BÁO BLOCKER: Phát hiện sai lệch số liệu sau triển khai. Vui lòng kiểm tra lại log chi tiết.', 16, 1);
END;
GO
`;

fs.writeFileSync(path.resolve('FINAL_DATABASE_DEPLOYMENT.sql'), fullSql, 'utf8');
console.log('Successfully wrote FINAL_DATABASE_DEPLOYMENT.sql with all 474 mappings!');
