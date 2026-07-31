@echo off
chcp 65001 >nul
echo 正在备份项目...

set BACKUP_NAME=my-project-backup-%date:~0,4%%date:~5,2%%date:~8,2%.zip
set DESKTOP=%USERPROFILE%\Desktop

if exist "%DESKTOP%" (
    set DEST=%DESKTOP%\%BACKUP_NAME%
) else (
    set DEST=E:\我的桌面\%BACKUP_NAME%
)

powershell -Command "Compress-Archive -Path 'E:\my project\*' -DestinationPath '%DEST%' -Force"
echo ✅ 备份完成: %DEST%
pause
