param(
    [string]$ServerInstance = ".\SQLEXPRESS",
    [string]$DatabaseName = "HangoDatasetDB",
    [string]$ZipRelativePath = "dataset\handwritten-korean-characters.zip",
    [int]$BatchSize = 2000
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Add-Type -AssemblyName System.IO.Compression.FileSystem
Add-Type -AssemblyName System.Data

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$ZipPath = Join-Path $ProjectRoot $ZipRelativePath
$SchemaPath = Join-Path $PSScriptRoot "sql\schema_and_backup_restore.sql"
$ClassesJsonPath = Join-Path $PSScriptRoot "sql\classes_metadata.json"

if (-not (Test-Path $ZipPath)) {
    throw "Dataset ZIP not found at: $ZipPath"
}

Write-Output "=== STEP 1: INITIALIZE DATABASE AND TABLES ON SQL SERVER ($ServerInstance) ==="
& sqlcmd -S $ServerInstance -E -C -i $SchemaPath | Out-Null

$ConnStr = "Server=$ServerInstance;Database=$DatabaseName;Integrated Security=True;TrustServerCertificate=True;"
$Conn = New-Object System.Data.SqlClient.SqlConnection($ConnStr)
$Conn.Open()

$ResetCmd = $Conn.CreateCommand()
$ResetCmd.CommandTimeout = 120
$ResetCmd.CommandText = @"
DELETE FROM dbo.HangulHandwritingSamples;
DBCC CHECKIDENT ('dbo.HangulHandwritingSamples', RESEED, 0);
DELETE FROM dbo.HangulCharacterClasses;
DBCC CHECKIDENT ('dbo.HangulCharacterClasses', RESEED, 0);
"@
$ResetCmd.ExecuteNonQuery() | Out-Null

Write-Output "=== STEP 2: IMPORT 64 HANGUL CHARACTER CLASSES INTO dbo.HangulCharacterClasses ==="
$ClassesJsonRaw = [System.IO.File]::ReadAllText($ClassesJsonPath, [System.Text.Encoding]::UTF8)
$ClassesList = $ClassesJsonRaw | ConvertFrom-Json

$FolderMap = @{}
foreach ($item in $ClassesList) {
    $InsertClassCmd = $Conn.CreateCommand()
    $InsertClassCmd.CommandText = @"
INSERT INTO dbo.HangulCharacterClasses
(DatasetClassCode, FolderName, HangulChar, UnicodeHex, Romanization, MeaningVi, Category, StrokeCount, Choseong, Jungseong, Jongseong, WritingTip, OriginalSampleCount, AugmentedSampleCount)
OUTPUT INSERTED.ClassId
VALUES (@Code, @Folder, @Char, @Hex, @Roman, @Meaning, @Category, @Strokes, @Cho, @Jung, @Jong, @Tip, 100, 2000);
"@
    $InsertClassCmd.Parameters.AddWithValue("@Code", [string]$item.datasetClassId) | Out-Null
    $InsertClassCmd.Parameters.AddWithValue("@Folder", [string]$item.folder) | Out-Null
    $InsertClassCmd.Parameters.AddWithValue("@Char", [string]$item.char) | Out-Null
    $InsertClassCmd.Parameters.AddWithValue("@Hex", [string]$item.unicode) | Out-Null
    $InsertClassCmd.Parameters.AddWithValue("@Roman", [string]$item.roman) | Out-Null
    $InsertClassCmd.Parameters.AddWithValue("@Meaning", [string]$item.meaning) | Out-Null
    $InsertClassCmd.Parameters.AddWithValue("@Category", [string]$item.category) | Out-Null
    $InsertClassCmd.Parameters.AddWithValue("@Strokes", [int]$item.strokes) | Out-Null
    $InsertClassCmd.Parameters.AddWithValue("@Cho", [string]$item.choseong) | Out-Null
    $InsertClassCmd.Parameters.AddWithValue("@Jung", [string]$item.jungseong) | Out-Null
    if ($item.jongseong -and $item.jongseong.Length -gt 0) {
        $InsertClassCmd.Parameters.AddWithValue("@Jong", [string]$item.jongseong) | Out-Null
    } else {
        $InsertClassCmd.Parameters.AddWithValue("@Jong", [DBNull]::Value) | Out-Null
    }
    $InsertClassCmd.Parameters.AddWithValue("@Tip", [string]$item.tip) | Out-Null

    $classId = [int]$InsertClassCmd.ExecuteScalar()
    $FolderMap[[string]$item.folder] = @{
        ClassId = $classId
        HangulChar = [string]$item.char
    }
}
Write-Output "Imported $($FolderMap.Count) Hangul classes into dbo.HangulCharacterClasses."

Write-Output "=== STEP 3: STREAM ZIP ARCHIVE AND BATCH IMPORT ($BatchSize SAMPLES/BATCH) ==="

function New-SamplesDataTable {
    $dt = New-Object System.Data.DataTable
    $dt.Columns.Add("ClassId", [int]) | Out-Null
    $dt.Columns.Add("FolderName", [string]) | Out-Null
    $dt.Columns.Add("HangulChar", [string]) | Out-Null
    $dt.Columns.Add("SubsetType", [string]) | Out-Null
    $dt.Columns.Add("SampleIndex", [int]) | Out-Null
    $dt.Columns.Add("WriterIndex", [int]) | Out-Null
    $dt.Columns.Add("VariantIndex", [int]) | Out-Null
    $dt.Columns.Add("FileName", [string]) | Out-Null
    $dt.Columns.Add("ArchivePath", [string]) | Out-Null
    $dt.Columns.Add("FileSizeBytes", [int]) | Out-Null
    $dt.Columns.Add("MimeType", [string]) | Out-Null
    $dt.Columns.Add("ImageBinary", [byte[]]) | Out-Null
    return ,$dt
}

$BulkCopy = New-Object System.Data.SqlClient.SqlBulkCopy($Conn)
$BulkCopy.DestinationTableName = "dbo.HangulHandwritingSamples"
$BulkCopy.BatchSize = $BatchSize
$BulkCopy.BulkCopyTimeout = 300
foreach ($col in @("ClassId","FolderName","HangulChar","SubsetType","SampleIndex","WriterIndex","VariantIndex","FileName","ArchivePath","FileSizeBytes","MimeType","ImageBinary")) {
    $BulkCopy.ColumnMappings.Add($col, $col) | Out-Null
}

$Zip = [System.IO.Compression.ZipFile]::OpenRead($ZipPath)
$TotalZipEntries = $Zip.Entries.Count
$DataTable = New-SamplesDataTable

$SampleCounters = @{}
$ImportedOrig = 0
$ImportedAug = 0
$OrigBinaryBytes = [int64]0
$TotalUncompressed = [int64]0

$SortedEntries = $Zip.Entries | Where-Object { $_.FullName -like "*.jpg" } | Sort-Object FullName

foreach ($entry in $SortedEntries) {
    $parts = $entry.FullName -split '/'
    if ($parts.Count -lt 4) { continue }

    $topDir = $parts[0]
    $folder = $parts[2]
    $fileName = $parts[3]

    if (-not $FolderMap.ContainsKey($folder)) { continue }
    $meta = $FolderMap[$folder]

    $subset = if ($topDir -eq "Hangul Database") { "orig" } else { "aug" }
    $counterKey = "$folder|$subset"
    if (-not $SampleCounters.ContainsKey($counterKey)) {
        $SampleCounters[$counterKey] = 0
    }
    $sampleIdx = $SampleCounters[$counterKey]
    $SampleCounters[$counterKey] = $sampleIdx + 1

    $baseName = [System.IO.Path]::GetFileNameWithoutExtension($fileName)
    $nameTokens = $baseName -split '_'
    $writerIdx = if ($nameTokens.Count -ge 2) { [int]$nameTokens[1] } else { 0 }
    $variantIdx = if ($nameTokens.Count -ge 3) { [int]$nameTokens[2] } else { 0 }

    $fileLen = [int]$entry.Length
    $TotalUncompressed += $fileLen

    $row = $DataTable.NewRow()
    $row["ClassId"] = $meta.ClassId
    $row["FolderName"] = $folder
    $row["HangulChar"] = $meta.HangulChar
    $row["SubsetType"] = $subset
    $row["SampleIndex"] = $sampleIdx
    $row["WriterIndex"] = $writerIdx
    $row["VariantIndex"] = $variantIdx
    $row["FileName"] = $fileName
    $row["ArchivePath"] = $entry.FullName
    $row["FileSizeBytes"] = $fileLen
    $row["MimeType"] = "image/jpeg"

    if ($subset -eq "orig") {
        $stream = $entry.Open()
        $ms = New-Object System.IO.MemoryStream
        $stream.CopyTo($ms)
        $bytes = $ms.ToArray()
        $ms.Dispose()
        $stream.Dispose()

        $row["ImageBinary"] = $bytes
        $OrigBinaryBytes += $bytes.Length
        $ImportedOrig++
    } else {
        $row["ImageBinary"] = [DBNull]::Value
        $ImportedAug++
    }

    $DataTable.Rows.Add($row)

    if ($DataTable.Rows.Count -ge $BatchSize) {
        $BulkCopy.WriteToServer($DataTable)
        $DataTable.Clear()
        $totalDone = $ImportedOrig + $ImportedAug
        if ($totalDone % 20000 -eq 0 -or $totalDone -eq 6400) {
            Write-Output "  -> Batch imported: $totalDone / $($SortedEntries.Count) samples (Orig: $ImportedOrig, Aug: $ImportedAug)..."
        }
    }
}

if ($DataTable.Rows.Count -gt 0) {
    $BulkCopy.WriteToServer($DataTable)
    $DataTable.Clear()
}

$Zip.Dispose()
$BulkCopy.Close()

$TotalImported = $ImportedOrig + $ImportedAug

$LogCmd = $Conn.CreateCommand()
$LogCmd.CommandText = @"
INSERT INTO dbo.DatasetImportLogs
(SourceArchive, ZipEntriesCount, ImportedClassesCount, ImportedOrigCount, ImportedAugCount, TotalImportedSamples, OrigBinarySizeBytes, TotalUncompressedBytes, BatchSize, Status)
VALUES (@Archive, @ZipCount, @ClassCount, @OrigCount, @AugCount, @TotalCount, @OrigBytes, @TotalBytes, @BatchSize, 'COMPLETED');
"@
$LogCmd.Parameters.AddWithValue("@Archive", $ZipRelativePath) | Out-Null
$LogCmd.Parameters.AddWithValue("@ZipCount", $TotalZipEntries) | Out-Null
$LogCmd.Parameters.AddWithValue("@ClassCount", $FolderMap.Count) | Out-Null
$LogCmd.Parameters.AddWithValue("@OrigCount", $ImportedOrig) | Out-Null
$LogCmd.Parameters.AddWithValue("@AugCount", $ImportedAug) | Out-Null
$LogCmd.Parameters.AddWithValue("@TotalCount", $TotalImported) | Out-Null
$LogCmd.Parameters.AddWithValue("@OrigBytes", $OrigBinaryBytes) | Out-Null
$LogCmd.Parameters.AddWithValue("@TotalBytes", $TotalUncompressed) | Out-Null
$LogCmd.Parameters.AddWithValue("@BatchSize", $BatchSize) | Out-Null
$LogCmd.ExecuteNonQuery() | Out-Null

$Conn.Close()

Write-Output "=== DATASET IMPORT COMPLETED ==="
Write-Output "Total ZIP entries        : $TotalZipEntries"
Write-Output "Total Hangul classes     : $($FolderMap.Count)"
Write-Output "Original samples (Binary): $ImportedOrig ($([math]::Round($OrigBinaryBytes/1MB, 2)) MB VARBINARY)"
Write-Output "Augmented samples (Meta) : $ImportedAug"
Write-Output "Total imported rows      : $TotalImported"
