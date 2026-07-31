@echo off
echo === Clean XDZipApp from OpenWithList ===

for %%e in (.zip .rar .7z) do (
    for /f "tokens=1,2,*" %%a in ('reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\FileExts\%%e\OpenWithList" 2^>nul') do (
        if "%%c"=="XDZipApp.exe" (
            echo Deleting: %%e\OpenWithList\%%a = %%c
            reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\FileExts\%%e\OpenWithList" /v %%a /f 2>nul
        )
    )
)

echo.
echo === Delete App Paths ===
reg delete "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\XDZipApp.exe" /f 2>nul
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\XDZipApp.exe" /f 2>nul
reg delete "HKLM\SOFTWARE\Classes\Applications\XDZipApp.exe" /f 2>nul
reg delete "HKCU\SOFTWARE\Classes\Applications\XDZipApp.exe" /f 2>nul

echo.
echo === Clean HaoZip from OpenWithList ===
for %%e in (.zip .rar .7z) do (
    for /f "tokens=1,2,*" %%a in ('reg query "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\FileExts\%%e\OpenWithList" 2^>nul') do (
        echo %%c | findstr "HaoZip" >nul
        if not errorlevel 1 (
            echo Deleting: %%e\OpenWithList\%%a = %%c
            reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\FileExts\%%e\OpenWithList" /v %%a /f 2>nul
        )
    )
)

echo.
echo === Done! ===
