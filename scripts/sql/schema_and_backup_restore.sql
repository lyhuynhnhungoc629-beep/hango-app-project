-- =============================================================================
-- HANGO PROJECT - SQL SERVER DATASET SCHEMA, BACKUP & RESTORE SCRIPT
-- Instance: .\SQLEXPRESS | Database: HangoDatasetDB
-- Nguồn dữ liệu: dataset/handwritten-korean-characters.zip (PE92 / Kaggle)
-- =============================================================================

IF DB_ID(N'HangoDatasetDB') IS NULL
BEGIN
    CREATE DATABASE [HangoDatasetDB];
END
GO

USE [HangoDatasetDB];
GO

-- 1. Bảng danh mục 64 lớp âm tiết chữ Hàn (Hỗ trợ đầy đủ Unicode tiếng Hàn NVARCHAR)
IF OBJECT_ID(N'dbo.HangulCharacterClasses', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HangulCharacterClasses (
        ClassId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        DatasetClassCode VARCHAR(32) NOT NULL UNIQUE,
        FolderName VARCHAR(32) NOT NULL UNIQUE,
        HangulChar NVARCHAR(8) NOT NULL,
        UnicodeHex VARCHAR(16) NOT NULL,
        Romanization VARCHAR(32) NOT NULL,
        MeaningVi NVARCHAR(255) NOT NULL,
        Category VARCHAR(32) NOT NULL,
        StrokeCount INT NOT NULL,
        Choseong NVARCHAR(8) NOT NULL,
        Jungseong NVARCHAR(8) NOT NULL,
        Jongseong NVARCHAR(8) NULL,
        WritingTip NVARCHAR(500) NOT NULL,
        OriginalSampleCount INT NOT NULL DEFAULT 100,
        AugmentedSampleCount INT NOT NULL DEFAULT 2000,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- 2. Bảng lưu trữ toàn bộ 134,400 mẫu chữ viết tay tiếng Hàn
-- Phương án lưu ảnh tối ưu (Hybrid Storage):
-- + 6,400 ảnh gốc (SubsetType = 'orig'): Lưu trực tiếp dữ liệu nhị phân JPEG vào cột ImageBinary VARBINARY(MAX) (~14.93 MB)
--   giúp truy xuất ảnh trực tiếp từ SQL Server qua API mà không phụ thuộc file ZIP hay thư mục ngoài.
-- + 128,000 ảnh mở rộng (SubsetType = 'aug'): Lưu đầy đủ 100% metadata, nhãn Unicode, kích thước, chỉ số người viết/biến thể
--   và đặt ImageBinary = NULL để tránh làm Database phình thêm ~168 MB ảnh xoay nhân tạo dư thừa.
IF OBJECT_ID(N'dbo.HangulHandwritingSamples', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.HangulHandwritingSamples (
        SampleId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ClassId INT NOT NULL,
        FolderName VARCHAR(32) NOT NULL,
        HangulChar NVARCHAR(8) NOT NULL,
        SubsetType VARCHAR(16) NOT NULL, -- 'orig' (6,400 mẫu gốc) | 'aug' (128,000 mẫu mở rộng)
        SampleIndex INT NOT NULL,        -- 0..99 đối với 'orig', 0..1999 đối với 'aug'
        WriterIndex INT NOT NULL,
        VariantIndex INT NOT NULL,
        FileName NVARCHAR(128) NOT NULL,
        ArchivePath NVARCHAR(260) NOT NULL,
        FileSizeBytes INT NOT NULL,
        MimeType VARCHAR(32) NOT NULL DEFAULT 'image/jpeg',
        ImageBinary VARBINARY(MAX) NULL,
        CreatedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_Samples_ClassId FOREIGN KEY (ClassId) REFERENCES dbo.HangulCharacterClasses(ClassId)
    );

    -- Ràng buộc UNIQUE chống import trùng lặp và tăng tốc truy vấn ảnh theo (FolderName, SubsetType, SampleIndex)
    CREATE UNIQUE NONCLUSTERED INDEX UX_Samples_Folder_Subset_Index
        ON dbo.HangulHandwritingSamples(FolderName, SubsetType, SampleIndex);

    CREATE NONCLUSTERED INDEX IX_Samples_ClassId_Subset
        ON dbo.HangulHandwritingSamples(ClassId, SubsetType);
END
GO

-- 3. Bảng nhật ký kiểm toán quá trình Import Batch & Backup
IF OBJECT_ID(N'dbo.DatasetImportLogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DatasetImportLogs (
        LogId INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        SourceArchive NVARCHAR(260) NOT NULL,
        ZipEntriesCount INT NOT NULL,
        ImportedClassesCount INT NOT NULL,
        ImportedOrigCount INT NOT NULL,
        ImportedAugCount INT NOT NULL,
        TotalImportedSamples INT NOT NULL,
        OrigBinarySizeBytes BIGINT NOT NULL,
        TotalUncompressedBytes BIGINT NOT NULL,
        BatchSize INT NOT NULL,
        Status VARCHAR(32) NOT NULL,
        ImportedAt DATETIME2 NOT NULL DEFAULT SYSDATETIME()
    );
END
GO

-- =============================================================================
-- QUY TRÌNH SAO LƯU (BACKUP) VÀ PHỤC HỒI (RESTORE) DATABASE HangoDatasetDB
-- =============================================================================
/*
-- A. SAO LƯU TOÀN BỘ (FULL BACKUP):
BACKUP DATABASE [HangoDatasetDB]
TO DISK = N'C:\Đồ án chuyên ngành\hango-app-project\dataset\backup\HangoDatasetDB_Full.bak'
WITH FORMAT, INIT,
     NAME = N'HangoDatasetDB - Full Backup (64 Classes, 134,400 Samples)',
     STATS = 10;
GO

-- B. KIỂM TRA TÍNH TOÀN VẸN CỦA FILE BACKUP:
RESTORE VERIFYONLY
FROM DISK = N'C:\Đồ án chuyên ngành\hango-app-project\dataset\backup\HangoDatasetDB_Full.bak';
GO

-- C. PHỤC HỒI DATABASE TỪ FILE BACKUP (RESTORE):
USE [master];
GO
IF DB_ID(N'HangoDatasetDB') IS NOT NULL
BEGIN
    ALTER DATABASE [HangoDatasetDB] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
END
RESTORE DATABASE [HangoDatasetDB]
FROM DISK = N'C:\Đồ án chuyên ngành\hango-app-project\dataset\backup\HangoDatasetDB_Full.bak'
WITH REPLACE, STATS = 10;
ALTER DATABASE [HangoDatasetDB] SET MULTI_USER;
GO
*/
