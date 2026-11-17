param(
    [ValidateSet("backup", "verify", "restore")]
    [string]$Action = "backup",
    [string]$ServerInstance = ".\SQLEXPRESS",
    [string]$DatabaseName = "HangoDatasetDB",
    [string]$BackupFilePath = ""
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

if (-not $BackupFilePath) {
    $DefaultBackupDir = "C:\Program Files\Microsoft SQL Server\MSSQL17.SQLEXPRESS\MSSQL\Backup"
    $BackupFilePath = Join-Path $DefaultBackupDir "$DatabaseName`_Full.bak"
}

if ($Action -eq "backup") {
    Write-Output "Running Full Backup of [$DatabaseName] to: $BackupFilePath ..."
    $sql = @"
BACKUP DATABASE [$DatabaseName]
TO DISK = N'$BackupFilePath'
WITH FORMAT, INIT,
     NAME = N'$DatabaseName - Full Database Backup',
     STATS = 25;
"@
    & sqlcmd -S $ServerInstance -E -C -Q $sql
    if ($LASTEXITCODE -ne 0) { throw "Backup failed!" }
    Write-Output "Backup succeeded! Backup file stored at: $BackupFilePath"
}
elseif ($Action -eq "verify") {
    Write-Output "Verifying backup integrity: $BackupFilePath ..."
    $sql = "RESTORE VERIFYONLY FROM DISK = N'$BackupFilePath';"
    & sqlcmd -S $ServerInstance -E -C -Q $sql
    if ($LASTEXITCODE -ne 0) { throw "Backup verification failed!" }
    Write-Output "Backup verification passed!"
}
elseif ($Action -eq "restore") {
    Write-Output "Restoring Database [$DatabaseName] from: $BackupFilePath ..."
    $sql = @"
USE [master];
IF DB_ID(N'$DatabaseName') IS NOT NULL
BEGIN
    ALTER DATABASE [$DatabaseName] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
END
RESTORE DATABASE [$DatabaseName]
FROM DISK = N'$BackupFilePath'
WITH REPLACE, STATS = 25;
ALTER DATABASE [$DatabaseName] SET MULTI_USER;
"@
    & sqlcmd -S $ServerInstance -E -C -Q $sql
    if ($LASTEXITCODE -ne 0) { throw "Restore failed!" }
    Write-Output "Database [$DatabaseName] restored successfully!"
}
