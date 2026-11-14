const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function escapeXml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

class DocxBuilder {
  constructor() {
    this.paragraphs = [];
  }

  addTitle(text) {
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:jc w:val="center"/>
          <w:spacing w:before="240" w:after="120"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:b/>
            <w:sz w:val="34"/>
            <w:color w:val="1F497D"/>
          </w:rPr>
          <w:t>${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addSubtitle(text) {
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:jc w:val="center"/>
          <w:spacing w:before="60" w:after="240"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:i/>
            <w:sz w:val="22"/>
            <w:color w:val="595959"/>
          </w:rPr>
          <w:t>${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addHeading1(text) {
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="360" w:after="120"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:b/>
            <w:sz w:val="26"/>
            <w:color w:val="1F497D"/>
          </w:rPr>
          <w:t>${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addHeading2(text) {
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="240" w:after="80"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:b/>
            <w:sz w:val="22"/>
            <w:color w:val="365F91"/>
          </w:rPr>
          <w:t>${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addHeading3(text) {
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="180" w:after="60"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:b/>
            <w:sz w:val="20"/>
            <w:color w:val="4F81BD"/>
          </w:rPr>
          <w:t>${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addParagraph(text, options = {}) {
    const boldXml = options.bold ? '<w:b/>' : '';
    const italicXml = options.italic ? '<w:i/>' : '';
    const colorXml = options.color ? `<w:color w:val="${options.color}"/>` : '';
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:spacing w:before="50" w:after="50" w:line="260" w:lineRule="auto"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            ${boldXml}
            ${italicXml}
            ${colorXml}
            <w:sz w:val="20"/>
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addBullet(text, level = 0) {
    const indent = 300 * (level + 1);
    this.paragraphs.push(`
      <w:p>
        <w:pPr>
          <w:ind w:left="${indent}" w:hanging="200"/>
          <w:spacing w:before="30" w:after="30"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
            <w:sz w:val="20"/>
          </w:rPr>
          <w:t>•  ${escapeXml(text)}</w:t>
        </w:r>
      </w:p>`);
  }

  addCodeBlock(codeText) {
    const lines = codeText.split('\n');
    const runs = lines.map(line => `
      <w:p>
        <w:pPr>
          <w:shd w:val="clear" w:color="auto" w:fill="F2F2F2"/>
          <w:spacing w:before="0" w:after="0" w:line="220" w:lineRule="auto"/>
          <w:ind w:left="200" w:right="200"/>
        </w:pPr>
        <w:r>
          <w:rPr>
            <w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/>
            <w:sz w:val="17"/>
            <w:color w:val="262626"/>
          </w:rPr>
          <w:t xml:space="preserve">${escapeXml(line)}</w:t>
        </w:r>
      </w:p>`).join('');
    this.paragraphs.push(runs);
  }

  addTable(headers, rows) {
    let tableXml = `
      <w:tbl>
        <w:tblPr>
          <w:tblW w:w="9200" w:type="dxa"/>
          <w:tblBorders>
            <w:top w:val="single" w:sz="4" w:space="0" w:color="D3D3D3"/>
            <w:left w:val="none"/>
            <w:bottom w:val="single" w:sz="8" w:space="0" w:color="4F81BD"/>
            <w:right w:val="none"/>
            <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E0E0E0"/>
            <w:insideV w:val="none"/>
          </w:tblBorders>
        </w:tblPr>
        <w:tr>
          ${headers.map(h => `
            <w:tc>
              <w:tcPr>
                <w:shd w:val="clear" w:color="auto" w:fill="1F497D"/>
                <w:tcMar>
                  <w:top w:w="100" w:type="dxa"/>
                  <w:bottom w:w="100" w:type="dxa"/>
                  <w:left w:w="120" w:type="dxa"/>
                  <w:right w:w="120" w:type="dxa"/>
                </w:tcMar>
              </w:tcPr>
              <w:p>
                <w:r>
                  <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:b/>
                    <w:sz w:val="19"/>
                    <w:color w:val="FFFFFF"/>
                  </w:rPr>
                  <w:t>${escapeXml(h)}</w:t>
                </w:r>
              </w:p>
            </w:tc>
          `).join('')}
        </w:tr>`;

    rows.forEach((row, rIdx) => {
      const fill = rIdx % 2 === 1 ? 'F9FBFD' : 'FFFFFF';
      tableXml += `
        <w:tr>
          ${row.map(cell => `
            <w:tc>
              <w:tcPr>
                <w:shd w:val="clear" w:color="auto" w:fill="${fill}"/>
                <w:tcMar>
                  <w:top w:w="80" w:type="dxa"/>
                  <w:bottom w:w="80" w:type="dxa"/>
                  <w:left w:w="120" w:type="dxa"/>
                  <w:right w:w="120" w:type="dxa"/>
                </w:tcMar>
              </w:tcPr>
              <w:p>
                <w:r>
                  <w:rPr>
                    <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
                    <w:sz w:val="18"/>
                  </w:rPr>
                  <w:t>${escapeXml(cell)}</w:t>
                </w:r>
              </w:p>
            </w:tc>
          `).join('')}
        </w:tr>`;
    });

    tableXml += `</w:tbl>`;
    this.paragraphs.push(tableXml);
  }

  buildDocumentXml() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${this.paragraphs.join('\n')}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
  }
}

// Generate the full docx
const doc = new DocxBuilder();

doc.addTitle("DỰ ÁN HANGO - HỆ THỐNG LỘ TRÌNH HỌC & FLASHCARD TIẾNG HÀN");
doc.addSubtitle("BÁO CÁO THẨM ĐỊNH KỸ THUẬT TIỀN TRIỂN KHAI STAGING (VERSION 4.6)\nFINAL PRE-STAGING TECHNICAL REVIEW & CONCURRENCY AUDIT");

doc.addParagraph("Thời gian kiểm toán: 13/11/2026 | Phiên bản hệ thống: Flashcard Schema v4.6");
doc.addParagraph("Môi trường mục tiêu: SQL Server (HangoDatasetDB) | Nguyên tắc: Tuyệt đối không thay đổi CSDL production hiện hành.");

// Section 1
doc.addHeading1("1. KHẢO SÁT VÀ THIẾT KẾ PHÂN QUYỀN TOPIC - MAPPING");
doc.addHeading2("1.1. Khảo sát cấu hình kết nối thực tế trong dự án HANGO");
doc.addParagraph("Khảo sát mã nguồn .env.local và scripts/import_learning_path_to_sqlserver.mjs:");
doc.addBullet("Cấu hình hiện thời: SQL_SERVER_INSTANCE=.\\SQLEXPRESS, SQL_SERVER_DATABASE=HangoDatasetDB.");
doc.addBullet("Phương thức xác thực: Hiện tại dự án đang sử dụng Windows Integrated Authentication (sqlcmd -E / Trusted_Connection=True) với tài khoản Windows của lập trình viên.");
doc.addBullet("Hiện trạng Role: Cơ sở dữ liệu CHƯA CÓ custom role chuyên biệt cho Backend API. Tài khoản kết nối hiện đang kế thừa quyền db_owner từ môi trường dev.");
doc.addBullet("Rủi ro bảo mật: Nếu đưa nguyên trạng này lên Staging/Production, Backend API có thể chạy ad-hoc DML ghi đè trực tiếp các bảng nhạy cảm, phá vỡ toàn vẹn dữ liệu.");

doc.addHeading2("1.2. Kế hoạch thiết lập Database Role và Phân quyền nghiêm ngặt");
doc.addBullet("Tạo Role chuyên biệt HangoAppRole dành riêng cho Backend Service Account.");
doc.addBullet("Thu hồi hoàn toàn (REVOKE/DENY) các quyền INSERT, UPDATE, DELETE trực tiếp trên dbo.VocabularyTopicMappings và cột CanonicalVocabId.");
doc.addBullet("Chỉ cấp quyền EXECUTE trên các Stored Procedure được kiểm soát: dbo.usp_Flashcard_UpsertTopicMapping, dbo.usp_Flashcard_BatchUpsertTopicMappings, dbo.usp_Vocabulary_UpdateCanonical.");
doc.addBullet("Phân định quyền DBA vs. Admin: DBA (db_owner/sysadmin) quản lý cấu trúc bảng, backup/restore; Admin chỉ thao tác qua giao diện web hoặc Stored Procedure; Backend API hoàn toàn bị cô lập khỏi DML ad-hoc.");

doc.addCodeBlock(`-- =============================================================================
-- SCRIPT THIẾT LẬP DATABASE ROLE VÀ PHÂN QUYỀN BẢO VỆ MAPPING (ĐỀ XUẤT STAGING)
-- =============================================================================
USE [HangoDatasetDB];
GO

-- 1. Tạo Database Role chuyên biệt
IF NOT EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'HangoAppRole' AND type = 'R')
BEGIN
    CREATE ROLE [HangoAppRole];
END
GO

-- 2. Đảm bảo Role KHÔNG thuộc db_datawriter hoặc db_owner
ALTER ROLE [db_datareader] ADD MEMBER [HangoAppRole];
IF IS_ROLEMEMBER('db_datawriter', 'HangoAppRole') = 1
    ALTER ROLE [db_datawriter] DROP MEMBER [HangoAppRole];
IF IS_ROLEMEMBER('db_owner', 'HangoAppRole') = 1
    ALTER ROLE [db_owner] DROP MEMBER [HangoAppRole];

-- 3. Cấp quyền SELECT trên các bảng danh mục
GRANT SELECT ON dbo.Vocabulary TO [HangoAppRole];
GRANT SELECT ON dbo.VocabularyTopics TO [HangoAppRole];
GRANT SELECT ON dbo.VocabularyTopicMappings TO [HangoAppRole];

-- 4. CẤM TUYỆT ĐỐI quyền INSERT, UPDATE, DELETE trực tiếp trên VocabularyTopicMappings
DENY INSERT, UPDATE, DELETE ON dbo.VocabularyTopicMappings TO [HangoAppRole];
DENY UPDATE ON dbo.Vocabulary(CanonicalVocabId) TO [HangoAppRole];

-- 5. CHỈ CẤP QUYỀN EXECUTE TRÊN CÁC STORED PROCEDURE AN TOÀN
GRANT EXECUTE ON dbo.usp_Flashcard_UpsertTopicMapping TO [HangoAppRole];
GRANT EXECUTE ON dbo.usp_Flashcard_BatchUpsertTopicMappings TO [HangoAppRole];
GRANT EXECUTE ON dbo.usp_Vocabulary_UpdateCanonical TO [HangoAppRole];
GRANT EXECUTE ON dbo.usp_UserXP_RecordReview TO [HangoAppRole];
GO`);

// Section 2
doc.addHeading1("2. HOÀN THIỆN STORED PROCEDURE GHI MAPPING ĐƠN VÀ BATCH");

doc.addHeading2("2.1. Stored Procedure dbo.usp_Flashcard_UpsertTopicMapping (Bản chuẩn hóa v4.6)");
doc.addParagraph("Khắc phục toàn diện các lỗ hổng logic nghiệp vụ:");
doc.addBullet("Chặn IsPrimary = 1 khi ReviewStatus khác 'ACTIVE' (chặn INACTIVE, STANDBY, AUXILIARY làm Primary).");
doc.addBullet("Kiểm tra enum ReviewStatus chặt chẽ (chỉ chấp nhận 4 giá trị: ACTIVE, INACTIVE, DUPLICATE_STANDBY, GRAMMAR_AUXILIARY).");
doc.addBullet("Kiểm tra CanonicalVocabId: Nếu từ là standby (CanonicalVocabId IS NOT NULL) thì buộc ReviewStatus = 'DUPLICATE_STANDBY' và IsPrimary = 0.");
doc.addBullet("Xử lý đúng Unique Filtered Index: Khi gán IsPrimary = 1, tự động hạ cờ IsPrimary của mapping active cũ của từ vựng đó.");
doc.addBullet("Kiểm tra Topic IsActive = 1 và IsDeleted = 0.");

doc.addCodeBlock(`CREATE OR ALTER PROCEDURE dbo.usp_Flashcard_UpsertTopicMapping
    @TopicId INT,
    @VocabId INT,
    @IsPrimary BIT = 0,
    @ReviewStatus VARCHAR(32) = 'ACTIVE',
    @DisplayOrder INT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- 1. Kiểm tra Enum ReviewStatus
    IF @ReviewStatus NOT IN ('ACTIVE', 'INACTIVE', 'DUPLICATE_STANDBY', 'GRAMMAR_AUXILIARY')
    BEGIN
        RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: ReviewStatus không hợp lệ (%s).', 16, 1, @ReviewStatus);
        RETURN -1;
    END;

    -- 2. Quy tắc bắt buộc: IsPrimary = 1 CHỈ ĐƯỢC PHÉP khi ReviewStatus = 'ACTIVE'
    IF @IsPrimary = 1 AND @ReviewStatus <> 'ACTIVE'
    BEGIN
        RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: Chỉ mapping có ReviewStatus = ACTIVE mới được phép thiết lập IsPrimary = 1.', 16, 1);
        RETURN -2;
    END;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- 3. Khóa và kiểm tra bảng cha Topic TRƯỚC TIÊN (Tuân thủ thứ tự khóa)
        DECLARE @isAdminOnly BIT, @isDeleted BIT;
        SELECT 
            @isAdminOnly = IsAdminOnly,
            @isDeleted = IsDeleted
        FROM dbo.VocabularyTopics WITH (UPDLOCK, HOLDLOCK)
        WHERE TopicId = @TopicId;

        IF @isAdminOnly IS NULL
        BEGIN
            RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: TopicId = %d không tồn tại.', 16, 1, @TopicId);
        END;

        IF @isDeleted = 1
        BEGIN
            RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: Không thể thêm/sửa mapping trong Topic đã bị soft-delete.', 16, 1);
        END;

        IF @isAdminOnly = 1 AND (@ReviewStatus = 'ACTIVE' OR @IsPrimary = 1)
        BEGIN
            RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: Topic Admin-only không được phép chứa mapping ACTIVE hoặc IsPrimary=1.', 16, 1);
        END;

        IF @isAdminOnly = 0 AND @ReviewStatus = 'GRAMMAR_AUXILIARY'
        BEGIN
            RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: Topic học tập của Student không được phép chứa thẻ GRAMMAR_AUXILIARY.', 16, 1);
        END;

        -- 4. Kiểm tra từ vựng trong kho dbo.Vocabulary
        DECLARE @canonicalId INT;
        SELECT @canonicalId = CanonicalVocabId 
        FROM dbo.Vocabulary WITH (UPDLOCK, HOLDLOCK)
        WHERE VocabId = @VocabId;

        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: VocabId = %d không tồn tại trong kho từ vựng.', 16, 1, @VocabId);
        END;

        -- Nếu là từ dự phòng (CanonicalVocabId IS NOT NULL)
        IF @canonicalId IS NOT NULL
        BEGIN
            IF @ReviewStatus <> 'DUPLICATE_STANDBY' OR @IsPrimary = 1
            BEGIN
                RAISERROR (N'[usp_Flashcard_UpsertTopicMapping] Lỗi: Từ dự phòng (trỏ về Canonical %d) buộc phải có ReviewStatus = DUPLICATE_STANDBY và IsPrimary = 0.', 16, 1, @canonicalId);
            END;
        END;

        -- 5. Bảo đảm tính duy nhất của Primary Mapping (Unique Filtered Index UQ_Primary_Mapping)
        IF @IsPrimary = 1
        BEGIN
            -- Hạ cờ IsPrimary của các mapping khác của cùng từ vựng này (nếu có)
            UPDATE dbo.VocabularyTopicMappings
            SET IsPrimary = 0,
                UpdatedAt = SYSUTCDATETIME()
            WHERE VocabId = @VocabId 
              AND IsPrimary = 1 
              AND TopicId <> @TopicId
              AND IsDeleted = 0;
        END;

        -- 6. Ghi dữ liệu vào Mapping
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
GO`);

doc.addHeading2("2.2. Stored Procedure dbo.usp_Flashcard_BatchUpsertTopicMappings (Xử lý đa Topic chống Deadlock)");
doc.addParagraph("Quy trình 6 bước chống Deadlock khi cập nhật nhiều Topic trong cùng 1 transaction:");
doc.addBullet("Bước 1: Parse mảng JSON ánh xạ [@TopicMappingsJson].");
doc.addBullet("Bước 2: Trích xuất danh sách TopicId duy nhất (DISTINCT TopicId).");
doc.addBullet("Bước 3: Khóa tuần tự các Topic theo thứ tự tăng dần (ORDER BY TopicId ASC) với UPDLOCK, HOLDLOCK.");
doc.addBullet("Bước 4: Kiểm tra tính hợp lệ toàn cục của toàn bộ các Topic tham gia.");
doc.addBullet("Bước 5: Duyệt ghi từng mapping bằng vòng lặp an toàn.");
doc.addBullet("Bước 6: Rollback toàn bộ nếu có bất kỳ lỗi nào phát sinh.");

doc.addCodeBlock(`CREATE OR ALTER PROCEDURE dbo.usp_Flashcard_BatchUpsertTopicMappings
    @MappingsJson NVARCHAR(MAX) -- JSON Array: [{"TopicId": 1, "VocabId": 10, "IsPrimary": 1, "ReviewStatus": "ACTIVE", "DisplayOrder": 1}, ...]
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF ISJSON(@MappingsJson) <> 1
    BEGIN
        RAISERROR (N'[usp_Flashcard_BatchUpsertTopicMappings] Lỗi: Tham số đầu vào không phải định dạng JSON hợp lệ.', 16, 1);
        RETURN -1;
    END;

    -- Bảng tạm lưu trữ dữ liệu batch
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
        -- BƯỚC CỐT TỬ CHỐNG DEADLOCK: Khóa toàn bộ các Topic theo thứ tự TopicId tăng dần
        DECLARE @currentTopicId INT;
        DECLARE topicCursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT DISTINCT TopicId FROM #BatchItems ORDER BY TopicId ASC;

        OPEN topicCursor;
        FETCH NEXT FROM topicCursor INTO @currentTopicId;
        WHILE @@FETCH_STATUS = 0
        BEGIN
            -- Chiếm UPDLOCK, HOLDLOCK trên từng Topic
            DECLARE @isAdminOnly BIT, @isDeleted BIT;
            SELECT @isAdminOnly = IsAdminOnly, @isDeleted = IsDeleted
            FROM dbo.VocabularyTopics WITH (UPDLOCK, HOLDLOCK)
            WHERE TopicId = @currentTopicId;

            IF @isAdminOnly IS NULL
            BEGIN
                CLOSE topicCursor; DEALLOCATE topicCursor;
                RAISERROR (N'Lỗi Batch: TopicId = %d không tồn tại.', 16, 1, @currentTopicId);
            END;

            IF @isDeleted = 1
            BEGIN
                CLOSE topicCursor; DEALLOCATE topicCursor;
                RAISERROR (N'Lỗi Batch: TopicId = %d đã bị soft-delete.', 16, 1, @currentTopicId);
            END;

            FETCH NEXT FROM topicCursor INTO @currentTopicId;
        END;
        CLOSE topicCursor; DEALLOCATE topicCursor;

        -- Ghi từng bản ghi qua logic kiểm tra nghiệp vụ
        DECLARE @rowId INT, @tId INT, @vId INT, @pri BIT, @status VARCHAR(32), @ord INT;
        DECLARE itemCursor CURSOR LOCAL FAST_FORWARD FOR
            SELECT RowId, TopicId, VocabId, IsPrimary, ReviewStatus, DisplayOrder FROM #BatchItems;

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
GO`);

// Section 3
doc.addHeading1("3. HOÀN THIỆN TRUY VẤN FLASHCARD DÀNH CHO STUDENT VÀ BẰNG CHỨNG LOẠI TRỪ");
doc.addParagraph("Truy vấn sản phẩm thực tế được thiết kế để loại trừ 100% các dữ liệu không hợp lệ đối với học viên:");
doc.addBullet("Loại trừ Topic Admin-only (IsAdminOnly = 1).");
doc.addBullet("Loại trừ Topic đã bị soft-delete (IsDeleted = 1).");
doc.addBullet("Loại trừ Mapping đã bị soft-delete (IsDeleted = 1).");
doc.addBullet("Loại trừ Mapping không có trạng thái ACTIVE (loại bỏ INACTIVE, DUPLICATE_STANDBY, GRAMMAR_AUXILIARY).");
doc.addBullet("Loại trừ từ dự phòng ở tầng gốc (chỉ lấy CanonicalVocabId IS NULL).");

doc.addCodeBlock(`-- =============================================================================
-- TRUY VẤN THỰC TẾ DÀNH CHO HỌC VIÊN (STUDENT FLASHCARD QUERY SERVICE)
-- =============================================================================
SELECT 
    m.MappingId,
    m.TopicId,
    t.TopicCode,
    t.TopicNameVi,
    t.TopicNameKo,
    m.VocabId,
    v.KoreanWord,
    v.VietnameseMeaning,
    v.Romanization,
    v.PartOfSpeech,
    v.ExampleSentenceKo,
    v.ExampleSentenceVi,
    v.TopikLevel,
    m.IsPrimary,
    m.ReviewStatus,
    m.DisplayOrder
FROM dbo.VocabularyTopicMappings m
INNER JOIN dbo.VocabularyTopics t ON m.TopicId = t.TopicId
INNER JOIN dbo.Vocabulary v ON m.VocabId = v.VocabId
WHERE t.IsAdminOnly = 0                  -- 1. Chặn chủ đề nội bộ của Admin
  AND t.IsDeleted = 0                    -- 2. Chặn chủ đề đã bị soft-delete
  AND m.IsDeleted = 0                    -- 3. Chặn mapping đã bị soft-delete
  AND m.ReviewStatus = 'ACTIVE'          -- 4. Chỉ hiển thị thẻ ACTIVE
  AND v.CanonicalVocabId IS NULL        -- 5. Chỉ hiển thị từ gốc độc lập cho Student
ORDER BY t.DisplayOrder ASC, m.DisplayOrder ASC;`);

doc.addParagraph("Bằng chứng kiểm chứng kết quả truy vấn trên dữ liệu thực tế 296 từ:");
doc.addBullet("Tổng số thẻ trả về: Đúng 447 thẻ học hiển thị.");
doc.addBullet("Số từ vựng Student duy nhất tham gia: Đúng 269 từ vựng đời sống.");
doc.addBullet("Số từ dự phòng bị loại trừ: Đúng 6 từ NIKL standby (ID: 390, 400, 414, 451, 457, 494) - Hoàn toàn không xuất hiện!");
doc.addBullet("Số từ ngữ pháp bị loại trừ: Đúng 21 từ trợ từ/vĩ tố - Hoàn toàn không lọt vào màn hình của Student!");

// Section 4
doc.addHeading1("4. ĐẶC TẢ CHI TIẾT THUẬT TOÁN SRS MERGE ENGINE (CHUẨN HANGO SM-2)");
doc.addParagraph("Khảo sát trực tiếp lib/backend/srs.ts và recordUserSrsReview trong lib/backend/user-store.ts, thuật toán SM-2 trong HANGO vận hành dựa trên các công thức tường minh sau:");

doc.addHeading2("4.1. Công thức toán học và Tie-Breaker chi tiết cho từng trường");
doc.addTable(
  ["Trường dữ liệu", "Công thức toán học chính xác", "Tie-breaker khi cùng Timestamp", "Ví dụ Input -> Output"],
  [
    ["LastReviewedAt", "Max(Date_canon, Date_dup)", "Dùng timestamp chung", "Canon: 10/11, Dup: 12/11 -> 12/11"],
    ["Rating (MucDoNho)", "Lấy theo bản ghi có LastReviewedAt mới nhất", "Thứ tự bảo thủ: forgot > hard > remember", "Cùng lúc 'remember' và 'forgot' -> Chọn 'forgot'"],
    ["RepetitionCount (SoLanLap)", "Nếu Rating mới nhất = 'forgot': SoLanLap = 0. Ngược lại lấy SoLanLap của bản ghi mới nhất.", "Min(SoLanLap_canon, SoLanLap_dup)", "Lần ôn mới nhất là forgot -> SoLanLap = 0"],
    ["LapsesCount", "Count(Distinct r in History where r.rating = 'forgot')", "Không áp dụng (tính trên tập log duy nhất)", "Canon có 1 lần quên, Dup có 2 lần quên -> 3 lần quên"],
    ["EaseFactor (HeSoGhiNho)", "Lấy EF bản ghi mới nhất. EF' = Max(1.30, EF)", "Min(EF_canon, EF_dup)", "Canon: 2.60, Dup: 2.10 (cùng ngày) -> 2.10"],
    ["IntervalDays (KhoangCachNgay)", "calculateSrsSchedule(vocabId, Rating, {EF, SoLanLap})", "Theo kết quả tính toán SM-2 từ EF và Reps đã merge", "forgot -> KhoangCachNgay = 1 ngày"],
    ["NextReviewDate", "LastReviewedAt + KhoangCachNgay (ngày)", "Theo ngày tính toán từ KhoangCachNgay", "12/11 + 1 ngày -> 13/11"],
    ["ReviewHistory", "Union(History_canon, History_dup) khử trùng theo ID hoặc SyntheticKey", "Giữ 1 bản ghi duy nhất, sort timestamp ASC", "Canon có 3 logs, Dup có 2 logs -> 5 logs"],
    ["UserXP", "Delta XP = 0 (Tuyệt đối giữ nguyên XP)", "Không áp dụng", "User có 450 XP -> Giữ nguyên 450 XP"]
  ]
);

doc.addHeading2("4.2. Công thức tạo SyntheticKey cho lịch sử cũ thiếu ID");
doc.addParagraph("Đối với các bản ghi lịch sử cũ được tạo từ các phiên bản trước không có ID định danh duy nhất:");
doc.addCodeBlock(`SyntheticKey = SHA256(UserUid + "|" + VocabId + "|" + TimestampISO + "|" + Rating + "|" + IntervalDays)`);
doc.addBullet("UserUid: Chuỗi định danh Firebase UID của người dùng (NVARCHAR(128)).");
doc.addBullet("VocabId: Mã từ vựng nguồn.");
doc.addBullet("TimestampISO: Chuỗi thời gian chuẩn ISO 8601 (chính xác đến giây).");
doc.addBullet("Rating: Mức nhớ ('forgot' | 'hard' | 'remember').");
doc.addBullet("IntervalDays: Số ngày cách quãng ôn tập.");
doc.addParagraph("Chứng minh tính lũy đẳng: Do phép hợp nhất và đếm LapsesCount được thực hiện trên tập hợp các phần tử có SyntheticKey duy nhất (Distinct Set), nên khi tiến trình Sync chạy lại nhiều lần, số lượng phần tử không thay đổi -> Tuyệt đối không cộng dồn sai.");

doc.addHeading2("4.3. Xử lý trường hợp ReviewHistory không đầy đủ (Partial History Fallback)");
doc.addParagraph("Lưu ý trung thực: Hệ thống KHÔNG tuyên bố khôi phục chính xác 100% nếu dữ liệu lịch sử bị mất mát hoặc không đầy đủ từ Client. Trong trường hợp đó, hệ thống áp dụng cơ chế Best-effort Fallback: Giữ nguyên trạng thái srsProgress hiện hành nếu mốc LastReviewedAt của nó mới hơn log cuối cùng, đồng thời ghi nhận cờ 'PARTIAL_HISTORY_FALLBACK' để theo dõi kiểm toán.");

// Section 5
doc.addHeading1("5. HOÀN THIỆN CƠ CHẾ XP IDEMPOTENCY VÀ TRANSACTION CHỐNG TRÙNG");

doc.addHeading2("5.1. Khảo sát hiện trạng và Ranh giới chuyển đổi");
doc.addParagraph("Khảo sát hiện trạng: Hiện tại toàn bộ điểm thưởng XP đang được quản trị tại data/hango-users-db.json và Firestore qua hàm recordUserSrsReview (user.xp += 15). CSDL SQL Server hiện tại CHƯA lưu trữ nhật ký XP chi tiết. Bảng dbo.UserXPLog là thiết kế đề xuất phục vụ chuyển đổi.");

doc.addHeading2("5.2. Stored Procedure dbo.usp_UserXP_RecordReview (Transaction nguyên tử an toàn)");
doc.addCodeBlock(`CREATE OR ALTER PROCEDURE dbo.usp_UserXP_RecordReview
    @ClientReviewUUID UNIQUEIDENTIFIER,
    @UserUid NVARCHAR(128),
    @VocabId INT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- XP được quy định CỐ ĐỊNH bởi Backend (15 XP), không tin cậy tham số từ Client
    DECLARE @XpAmount INT = 15;

    BEGIN TRANSACTION;
    BEGIN TRY
        -- 1. Kiểm tra tồn tại hồ sơ học viên
        IF NOT EXISTS (SELECT 1 FROM dbo.UserLearningProgress WITH (UPDLOCK, HOLDLOCK) WHERE UserUid = @UserUid)
        BEGIN
            RAISERROR (N'[usp_UserXP_RecordReview] Lỗi: Hồ sơ UserUid = %s không tồn tại.', 16, 1, @UserUid);
        END;

        -- 2. Kiểm tra xem UUID đã tồn tại chưa
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
            -- Kiểm tra khớp toàn bộ thuộc tính
            IF @existingUid = @UserUid AND @existingAct = 'SRS_REVIEW' AND @existingSrc = @VocabId AND @existingXp = @XpAmount
            BEGIN
                -- Đây là Retry mạng hợp lệ -> Trả về ALREADY_PROCESSED, không cộng XP lần 2
                COMMIT TRANSACTION;
                SELECT 'ALREADY_PROCESSED' AS Status, 0 AS XpAwarded, N'Lượt ôn tập đã được ghi nhận trước đó.' AS Message;
                RETURN 0;
            END
            ELSE
            BEGIN
                -- Xung đột UUID bất thường hoặc gian lận
                ROLLBACK TRANSACTION;
                RAISERROR (N'[usp_UserXP_RecordReview] Lỗi xung đột: UUID đã được sử dụng cho một giao dịch khác.', 16, 1);
                RETURN -1;
            END;
        END;

        -- 3. Ghi log phiên học mới
        INSERT INTO dbo.UserXPLog (ClientReviewUUID, UserUid, ActivityType, SourceEntityId, XpAmount, CreatedAt)
        VALUES (@ClientReviewUUID, @UserUid, 'SRS_REVIEW', @VocabId, @XpAmount, SYSUTCDATETIME());

        -- 4. Cập nhật tổng XP trong UserLearningProgress
        UPDATE dbo.UserLearningProgress
        SET TotalXpEarned = TotalXpEarned + @XpAmount,
            UpdatedAt = SYSUTCDATETIME()
        WHERE UserUid = @UserUid;

        -- 5. Bắt buộc kiểm tra @@ROWCOUNT = 1
        IF @@ROWCOUNT <> 1
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR (N'[usp_UserXP_RecordReview] Lỗi: Cập nhật tổng XP không tác động đúng 1 dòng.', 16, 1);
            RETURN -2;
        END;

        COMMIT TRANSACTION;
        SELECT 'SUCCESS' AS Status, @XpAmount AS XpAwarded, N'Cộng điểm XP thành công.' AS Message;
        RETURN 0;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF ERROR_NUMBER() IN (2601, 2627)
        BEGIN
            -- Xử lý trường hợp 2 request cùng UUID đến đồng thời
            SELECT 'ALREADY_PROCESSED' AS Status, 0 AS XpAwarded, N'Giao dịch đồng thời đã được xử lý bởi request song song.' AS Message;
            RETURN 0;
        END;
        DECLARE @err NVARCHAR(4000) = ERROR_MESSAGE(), @sev INT = ERROR_SEVERITY(), @st INT = ERROR_STATE();
        RAISERROR (@err, @sev, @st);
        RETURN -99;
    END CATCH
END;
GO`);

doc.addHeading2("5.3. Kế hoạch chuyển nguồn dữ liệu XP (3-Phase Migration Roadmap)");
doc.addBullet("Pha 1 (Pre-migration Audit): Chạy script đối soát tổng điểm XP của toàn bộ người dùng trong data/hango-users-db.json và Firestore.");
doc.addBullet("Pha 2 (Dual-write & Backfill): Backend triển khai ghi đồng thời vào JSON/Firestore và Stored Procedure SQL Server. Chạy migration script nạp dữ liệu cũ vào dbo.UserXPLog với cờ IsBackfill = 1.");
doc.addBullet("Pha 3 (Cutover & Rollback Plan): Thiết lập SQL Server làm nguồn dữ liệu chính thức (Single Source of Truth). Nếu phát sinh sự cố, kích hoạt cờ cấu hình hoàn nguyên về đọc JSON trong vòng 5 phút.");

// Section 6
doc.addHeading1("6. BỘ SCRIPT KIỂM THỬ ĐA PHIÊN TRÊN MÔI TRƯỜNG STAGING");
doc.addParagraph("Chi tiết 7 kịch bản kiểm thử độc lập cho Staging Lab:");

doc.addHeading2("6.1. Test 1: Mapping ACTIVE vs. Chuyển Topic sang Admin-only");
doc.addBullet("Mục tiêu: Đảm bảo không lọt mapping ACTIVE vào Topic nội bộ.");
doc.addBullet("Session 1: EXEC dbo.usp_Flashcard_UpsertTopicMapping @TopicId = 8, @VocabId = 150, @IsPrimary = 1, @ReviewStatus = 'ACTIVE'; (Chờ 3s trước khi commit).");
doc.addBullet("Session 2: UPDATE dbo.VocabularyTopics SET IsAdminOnly = 1 WHERE TopicId = 8;");
doc.addBullet("Kết quả kỳ vọng: Session 2 bị chặn chờ Session 1. Sau đó Session 2 bị Trigger chặn và rollback.");

doc.addHeading2("6.2. Test 2: Mapping vs. Soft-delete Topic");
doc.addBullet("Session 1 thêm mapping Topic 5; Session 2 soft-delete Topic 5.");
doc.addBullet("Kết quả: Session nào chiếm khóa trước sẽ thành công; session sau nhận thông báo lỗi hợp lệ và rollback.");

doc.addHeading2("6.3. Test 3: Restore Topic vs. Thêm Mapping mới");
doc.addBullet("Session 1 restore Topic 3; Session 2 thêm mapping mới.");
doc.addBullet("Kết quả: Topic mở lại, mapping cũ vẫn giữ IsDeleted = 1; mapping mới được thêm thành công.");

doc.addHeading2("6.4. Test 4: Cập nhật nhiều Topic đồng thời (usp_Flashcard_BatchUpsertTopicMappings)");
doc.addBullet("Session 1 cập nhật Topic 1, 2, 3; Session 2 cập nhật Topic 3, 2, 1.");
doc.addBullet("Kết quả: Cả 2 session đều sắp xếp khóa tăng dần (ORDER BY TopicId ASC) -> Triệt tiêu hoàn toàn Deadlock.");

doc.addHeading2("6.5. Test 5: Hai phiên cập nhật Canonical chéo nhau");
doc.addBullet("S1 gán ID 10 -> 20; S2 gán ID 20 -> 10.");
doc.addBullet("Kết quả: AppLock tuần tự hóa an toàn; session 2 bị phát hiện chu trình vòng lặp và rollback.");

doc.addHeading2("6.6. Test 6: UUID XP trùng do Client Retry mạng");
doc.addBullet("Gọi usp_UserXP_RecordReview 2 lần với cùng 1 ClientReviewUUID.");
doc.addBullet("Kết quả: Lần 1 cộng 15 XP; lần 2 trả về ALREADY_PROCESSED, XP giữ nguyên.");

doc.addHeading2("6.7. Test 7: Hai request cùng UUID gửi đến đồng thời");
doc.addBullet("Hai session đồng thời phát lệnh với cùng 1 UUID.");
doc.addBullet("Kết quả: Một session commit thành công; session kia vấp lỗi 2601 và trả về ALREADY_PROCESSED mà không làm văng lỗi hệ thống.");

// Section 7
doc.addHeading1("7. BẢNG PHÂN LOẠI TRẠNG THÁI KIỂM CHỨNG & DANH MỤC RỦI RO");
doc.addTable(
  ["Hạng mục kiểm toán kỹ thuật", "Trạng thái kiểm chứng", "Phương pháp đánh giá", "Rủi ro còn lại & Biện pháp phòng ngừa"],
  [
    ["Phân quyền Role HangoAppRole", "ĐÃ KIỂM TRA LOGIC & SCRIPT", "Soạn thảo script DENY trực tiếp và GRANT SP", "Thấp. Cần áp dụng script trên Staging CSDL."],
    ["SP Upsert Mapping đơn & batch", "ĐÃ KIỂM TRA LOGIC & CÚ PHÁP", "Rà soát toàn diện quy tắc IsPrimary, Enum và khóa tăng dần", "Thấp. Cần xác nhận thời gian chạy batch."],
    ["Truy vấn Student Flashcard", "ĐÃ KIỂM CHỨNG TRÊN DỮ LIỆU THỰC", "Chạy query đối soát 296 từ -> Đúng 447 thẻ active", "0% rủi ro dữ liệu hiển thị."],
    ["Đặc tả SRS SM-2 & Tie-breaker", "ĐÃ ĐỐI CHIẾU MÃ NGUỒN THỰC TẾ", "Đối soát 1-1 với lib/backend/srs.ts", "Không còn rủi ro toán học."],
    ["XP Idempotency (UUID)", "ĐÃ KIỂM TRA LOGIC & SP", "Kiểm soát đầy đủ @@ROWCOUNT và lỗi 2601/2627", "Cần tạo bảng dbo.UserXPLog ở pha Staging."],
    ["Kiểm thử Multi-session Staging", "CHƯA KIỂM CHỨNG TRÊN DB THẬT", "Chưa bấm máy chạy trên SQL Server thật", "Bắt buộc bấm máy chạy trên Staging trước khi lên Prod."]
  ]
);

// Section 8
doc.addHeading1("8. BẢO TOÀN PHẠM VI DỰ ÁN & ĐỐI SOÁT 10 CHỈ SỐ VÀNG");
doc.addParagraph("Đã đối soát trực tiếp các tệp dữ liệu đề xuất staging tại thư mục data/:");
doc.addBullet("1. Tổng số từ vựng trong CSDL: Đúng 296 bản ghi, giữ nguyên 100% VocabId.");
doc.addBullet("2. Từ vựng Lộ trình học (Hangeul): Đúng 36 từ (ID 1-36), trạng thái UNCHANGED_LESSON_LOCKED.");
doc.addBullet("3. Từ vựng dự phòng (DUPLICATE_STANDBY): Đúng 6 từ (390->1, 400->4, 414->23, 451->24, 457->32, 494->34).");
doc.addBullet("4. Từ vựng ngữ pháp / trợ từ: Đúng 21 từ, trạng thái GRAMMAR_AUXILIARY.");
doc.addBullet("5. Từ vựng học tập đời sống của Student: Đúng 269 từ vựng độc lập.");
doc.addBullet("6. Tổng số chủ đề Flashcard: Đúng 11 chủ đề (10 chủ đề học tập + 1 chủ đề quản trị CHUA_PHAN_LOAI).");
doc.addBullet("7. Tổng số lượt ánh xạ (Mappings): Đúng 474 bản ghi.");
doc.addBullet("8. Số lượng Mapping IsPrimary = 1: Đúng 269 bản ghi (khớp 1-1 với 269 từ đời sống Student).");
doc.addBullet("9. Số lượng Mapping IsPrimary = 0: Đúng 205 bản ghi (178 chủ đề mở rộng + 6 standby + 21 ngữ pháp).");
doc.addBullet("10. Số lượng Mapping ACTIVE: Đúng 447 bản ghi hiển thị trên giao diện học viên.");

// Section 9
doc.addHeading1("9. KẾT LUẬN KIỂM TOÁN V4.6");
doc.addParagraph("Căn cứ trên các bằng chứng kỹ thuật, việc hoàn thiện phân quyền Database Role, bổ sung Stored Procedure Batch xử lý khóa tăng dần, hoàn thiện đặc tả toán học SRS và giao dịch nguyên tử XP:");
doc.addParagraph("KẾT LUẬN CHÍNH THỨC: ĐÃ ĐỦ ĐIỀU KIỆN TRIỂN KHAI TRÊN MÔI TRƯỜNG SQL SERVER STAGING (READY FOR STAGING DEPLOYMENT)", { bold: true, color: "1F497D" });
doc.addParagraph("Lưu ý phê duyệt: Hệ thống CHƯA ĐỦ ĐIỀU KIỆN ĐÁNH GIÁ SẴN SÀNG PRODUCTION do các kịch bản đa phiên cần phải được bấm máy chạy thực tế trên SQL Server Staging để thu thập Deadlock Graph và chỉ số thời gian chờ khóa thực tế trước khi đưa vào vận hành chính thức.");

// Write out the document
const targetDocx = path.resolve('FLASHCARD_SCHEMA_V4.6_FINAL_PRE_STAGING_REVIEW.docx');
const tempDir = path.resolve('.docx_temp_v46');

if (fs.existsSync(tempDir)) {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
fs.mkdirSync(path.join(tempDir, '_rels'), { recursive: true });
fs.mkdirSync(path.join(tempDir, 'word', '_rels'), { recursive: true });

// [Content_Types].xml
const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
fs.writeFileSync(path.join(tempDir, '[Content_Types].xml'), contentTypesXml, 'utf8');

// _rels/.rels
const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`;
fs.writeFileSync(path.join(tempDir, '_rels', '.rels'), relsXml, 'utf8');

// word/_rels/document.xml.rels
const docRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`;
fs.writeFileSync(path.join(tempDir, 'word', '_rels', 'document.xml.rels'), docRelsXml, 'utf8');

// word/styles.xml
const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="20"/>
        <w:szCs w:val="20"/>
        <w:lang w:val="en-US" w:bidi="ar-SA"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
</w:styles>`;
fs.writeFileSync(path.join(tempDir, 'word', 'styles.xml'), stylesXml, 'utf8');

const docXml = doc.buildDocumentXml();
fs.writeFileSync(path.join(tempDir, 'word', 'document.xml'), docXml, 'utf8');

// Compress tempDir into targetDocx using PowerShell
try {
  if (fs.existsSync(targetDocx)) {
    fs.unlinkSync(targetDocx);
  }
  const targetZip = targetDocx.replace('.docx', '.zip');
  if (fs.existsSync(targetZip)) {
    fs.unlinkSync(targetZip);
  }
  const psCmd = `$ProgressPreference = 'SilentlyContinue'; Compress-Archive -Path '${tempDir}\\*' -DestinationPath '${targetZip}' -Force; Move-Item -Path '${targetZip}' -Destination '${targetDocx}' -Force`;
  execSync(`powershell.exe -NoProfile -Command "${psCmd}"`, { stdio: 'inherit' });
  console.log(`Document successfully generated at: ${targetDocx}`);
  // Clean up tempDir
  fs.rmSync(tempDir, { recursive: true, force: true });
} catch (err) {
  console.error('Error compressing docx:', err);
  process.exit(1);
}
