@echo off
echo === Clean Rogue Software Directories ===

if exist "%LOCALAPPDATA%\Tencent\QQBrowser" (
    rmdir /s /q "%LOCALAPPDATA%\Tencent\QQBrowser"
    echo Deleted: %LOCALAPPDATA%\Tencent\QQBrowser
)
if exist "%APPDATA%\Tencent\QQBrowser" (
    rmdir /s /q "%APPDATA%\Tencent\QQBrowser"
    echo Deleted: %APPDATA%\Tencent\QQBrowser
)
if exist "C:\Program Files (x86)\DupsClean" (
    rmdir /s /q "C:\Program Files (x86)\DupsClean"
    echo Deleted: C:\Program Files (x86)\DupsClean
)
if exist "C:\Program Files (x86)\WMeiPlayer" (
    rmdir /s /q "C:\Program Files (x86)\WMeiPlayer"
    echo Deleted: C:\Program Files (x86)\WMeiPlayer
)
if exist "%LOCALAPPDATA%\Quark" (
    rmdir /s /q "%LOCALAPPDATA%\Quark"
    echo Deleted: %LOCALAPPDATA%\Quark
)
if exist "%APPDATA%\Quark" (
    rmdir /s /q "%APPDATA%\Quark"
    echo Deleted: %APPDATA%\Quark
)
if exist "C:\Program Files (x86)\IShow" (
    rmdir /s /q "C:\Program Files (x86)\IShow"
    echo Deleted: C:\Program Files (x86)\IShow
)
if exist "C:\Program Files\IShow" (
    rmdir /s /q "C:\Program Files\IShow"
    echo Deleted: C:\Program Files\IShow
)

echo === Done! ===
