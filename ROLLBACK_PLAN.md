# HANGO - KẾ HOẠCH VÀ SCRIPT HOÀN NGUYÊN HỆ THỐNG
## FINAL SYSTEM ROLLBACK & CONTINGENCY PLAN (VERSION 4.6.1 FINAL)

> **Dự án**: HANGO – Hệ thống Lộ trình học & Flashcard tiếng Hàn  
> **Cảnh báo an toàn**: **TUYỆT ĐỐI KHÔNG TỰ ĐỘNG CHẠY SCRIPT NÀY TRÊN CSDL LIVE.** Mọi thao tác hoàn nguyên phải có sự phê duyệt trực tiếp bằng văn bản của Quản trị viên Cơ sở dữ liệu (DBA).

---

## 1. YÊU CẦU SAO LƯU TIÊN QUYẾT & KIỂM TRA TÍNH TOÀN VẸN

Trước khi triển khai bất kỳ thay đổi nào trên Staging, bắt buộc phải sao lưu vật lý độc lập kèm mốc thời gian (Timestamp) để **tránh ghi đè lên các bản sao lưu cũ**:

```sql
-- 1. Sao lưu Full Backup có gắn nhãn thời gian
DECLARE @backupFileName NVARCHAR(500);
SET @backupFileName = N'C:\Đồ án chuyên ngành\hango-app-project\dataset\backup\HangoDatasetDB_PreFlashcard_' 
                      + REPLACE(REPLACE(REPLACE(CONVERT(VARCHAR(19), GETDATE(), 120), ' ', '_'), ':', ''), '-', '') 
                      + N'.bak';

BACKUP DATABASE [HangoDatasetDB]
TO DISK = @backupFileName
WITH FORMAT, INIT,
     NAME = N'HangoDatasetDB - Full Backup Pre-Deployment v4.6.1',
     STATS = 10;
GO

-- 2. Bắt buộc kiểm tra tính toàn vẹn của tệp sao lưu trước khi tiến hành triển khai
RESTORE VERIFYONLY
FROM DISK = N'C:\Đồ án chuyên ngành\hango-app-project\dataset\backup\HangoDatasetDB_PreFlashcard_v46.bak';
GO
```

Đồng thời sao lưu tệp JSON người dùng:
```powershell
Copy-Item "data\hango-users-db.json" -Destination "data\hango-users-db.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss').json" -Force
```

---

## 2. PHÂN BIỆT RÕ 2 CẤP ĐỘ HOÀN NGUYÊN

| Cấp độ | Phương thức áp dụng | Khi nào sử dụng? | Mức độ rủi ro & Cảnh báo |
| :---: | :--- | :--- | :--- |
| **CẤP ĐỘ 1** | **Hoàn nguyên Cấu trúc (DDL Undo Script)** | Triển khai thất bại ở các bước tạo bảng, trigger hoặc thủ tục; dữ liệu Vocabulary gốc vẫn nguyên vẹn. | **CẢNH BÁO MẤT DỮ LIỆU**: Lệnh `DROP TABLE` và `DROP COLUMN` sẽ xóa vĩnh viễn dữ liệu trong các bảng `VocabularyTopics`, `VocabularyTopicMappings`, `UserXPLog` và cột `CanonicalVocabId`! |
| **CẤP ĐỘ 2** | **Phục hồi Cơ sở dữ liệu Khẩn cấp (Physical Restore .BAK)** | CSDL bị hỏng hóc cấu trúc nghiêm trọng, mất mát bản ghi trong `dbo.Vocabulary` hoặc hỏng phân hệ Lộ trình. | **GHI ĐÈ TOÀN BỘ CSDL**: CSDL sẽ được đưa về đúng thời điểm tạo bản backup; mọi giao dịch phát sinh sau đó sẽ bị hủy bỏ. |

---

## 3. SCRIPT HOÀN NGUYÊN CẤU TRÚC (CẤP ĐỘ 1 - DDL UNDO SCRIPT)

> [!CAUTION]
> **CẢNH BÁO NGUY HIỂM TỪ DBA**: Script dưới đây chứa các câu lệnh `DROP TABLE` và `DROP COLUMN`. Chỉ chạy script này khi muốn gỡ bỏ hoàn toàn phân hệ Flashcard theo chủ đề mới và đưa schema về nguyên trạng.

```sql
USE [HangoDatasetDB];
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

PRINT N'>> [CẢNH BÁO] BẮT ĐẦU HOÀN NGUYÊN CẤU TRÚC PHÂN HỆ FLASHCARD...';

-- 1. Thu hồi phân quyền Role HangoAppRole
IF EXISTS (SELECT 1 FROM sys.database_principals WHERE name = 'HangoAppRole' AND type = 'R')
BEGIN
    DROP ROLE [HangoAppRole];
    PRINT N'>> Đã xóa Role HangoAppRole.';
END;

-- 2. Xóa các Stored Procedure mới
DROP PROCEDURE IF EXISTS dbo.usp_UserXP_RecordReview;
DROP PROCEDURE IF EXISTS dbo.usp_Flashcard_BatchUpsertTopicMappings;
DROP PROCEDURE IF EXISTS dbo.usp_Flashcard_UpsertTopicMapping;
DROP PROCEDURE IF EXISTS dbo.usp_Vocabulary_UpdateCanonical;
PRINT N'>> Đã gỡ bỏ 4 Stored Procedure.';

-- 3. Xóa các Trigger mới
DROP TRIGGER IF EXISTS dbo.TR_VocabularyTopicMappings_EnforceStatusConsistency;
DROP TRIGGER IF EXISTS dbo.TR_VocabularyTopics_EnforceStatusConsistency;
DROP TRIGGER IF EXISTS dbo.TR_Vocabulary_EnforceDirectCanonical;
PRINT N'>> Đã gỡ bỏ 3 Trigger bảo vệ.';

-- 4. Xóa bảng dữ liệu mới (Xóa vĩnh viễn mapping và log XP mới tạo)
DROP TABLE IF EXISTS dbo.UserXPLog;
DROP TABLE IF EXISTS dbo.VocabularyTopicMappings;
DROP TABLE IF EXISTS dbo.VocabularyTopics;
PRINT N'>> Đã gỡ bỏ các bảng UserXPLog, VocabularyTopicMappings, VocabularyTopics.';

-- 5. Hoàn nguyên cột CanonicalVocabId trên dbo.Vocabulary (Bảo toàn 296 từ gốc)
IF COL_LENGTH('dbo.Vocabulary', 'CanonicalVocabId') IS NOT NULL
BEGIN
    DROP INDEX IF EXISTS IX_Vocabulary_CanonicalVocabId ON dbo.Vocabulary;
    ALTER TABLE dbo.Vocabulary DROP CONSTRAINT IF EXISTS FK_Vocabulary_CanonicalVocabId;
    ALTER TABLE dbo.Vocabulary DROP COLUMN CanonicalVocabId;
    PRINT N'>> Đã gỡ bỏ cột CanonicalVocabId khỏi bảng dbo.Vocabulary.';
END;

PRINT N'>> [HOÀN TẤT] CSDL đã được đưa về cấu trúc nguyên bản của Lộ trình học 7 chặng.';
GO
```

---

## 4. QUY TRÌNH PHỤC HỒI CƠ SỞ DỮ LIỆU KHẨN CẤP (CẤP ĐỘ 2 - DISASTER RECOVERY)

Khi phát hiện dữ liệu gốc bị sai lệch, thực hiện khôi phục độc quyền từ bản sao lưu:

```sql
USE [master];
GO

-- 1. Đưa CSDL về chế độ Single User để ngắt kết nối các tiến trình khác
ALTER DATABASE [HangoDatasetDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO

-- 2. Phục hồi toàn bộ CSDL từ file backup
RESTORE DATABASE [HangoDatasetDB]
FROM DISK = N'C:\Đồ án chuyên ngành\hango-app-project\dataset\backup\HangoDatasetDB_PreFlashcard_v46.bak'
WITH REPLACE, STATS = 10;
GO

-- 3. Đưa CSDL trở lại chế độ Multi User
ALTER DATABASE [HangoDatasetDB] SET MULTI_USER;
GO
PRINT N'>> [THÀNH CÔNG] Đã phục hồi toàn vẹn CSDL từ bản sao lưu vật lý.';
```

---

## 5. HOÀN NGUYÊN BACKEND VÀ NGUỒN DỮ LIỆU XP/SRS

1. **Khôi phục nguồn XP**:
   - Nếu đã kích hoạt ghi nhận XP vào SQL Server: Chuyển cờ môi trường `USE_SQL_XP_STORE=false`.
   - Backend quay lại đọc và ghi 100% trên `data/hango-users-db.json` và Firestore.
2. **Khôi phục file dữ liệu JSON**:
   ```powershell
   Copy-Item "data\hango-users-db.backup.v46.json" -Destination "data\hango-users-db.json" -Force
   ```
3. **Bảo toàn dữ liệu học viên**:
   - Quá trình rollback tuyệt đối không làm ảnh hưởng đến tài khoản người dùng, tiến độ luyện viết hoặc kết quả thi thử TOPIK trên Firestore.
