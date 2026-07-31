@echo off
echo === Restore proper archive associations ===

set "Z7=D:\7-zip\7-Zip\7zFM.exe"

:: .zip - Windows native CompressedFolder (best for .zip)
reg add "HKLM\SOFTWARE\Classes\.zip" /ve /t REG_SZ /d "CompressedFolder" /f
reg add "HKLM\SOFTWARE\Classes\.zip\OpenWithProgids" /v "WPSOffice.zip" /f

:: .rar - 7-Zip
reg add "HKLM\SOFTWARE\Classes\.rar" /ve /t REG_SZ /d "7-Zip.rar" /f
reg add "HKLM\SOFTWARE\Classes\7-Zip.rar\DefaultIcon" /ve /t REG_SZ /d "%Z7%,0" /f
reg add "HKLM\SOFTWARE\Classes\7-Zip.rar\shell\open\command" /ve /t REG_SZ /d "\"%Z7%\" \"%%1\"" /f
reg add "HKLM\SOFTWARE\Classes\.rar\OpenWithProgids" /v "WPSOffice.rar" /f

:: .7z - 7-Zip
reg add "HKLM\SOFTWARE\Classes\.7z" /ve /t REG_SZ /d "7-Zip.7z" /f
reg add "HKLM\SOFTWARE\Classes\7-Zip.7z\DefaultIcon" /ve /t REG_SZ /d "%Z7%,0" /f
reg add "HKLM\SOFTWARE\Classes\7-Zip.7z\shell\open\command" /ve /t REG_SZ /d "\"%Z7%\" \"%%1\"" /f
reg add "HKLM\SOFTWARE\Classes\.7z\OpenWithProgids" /v "WPSOffice.7z" /f

:: Clear UserChoice
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.zip\UserChoice" /f 2>nul
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.rar\UserChoice" /f 2>nul
reg delete "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.7z\UserChoice" /f 2>nul

echo === Done! ===
echo .zip - Windows native
echo .rar - 7-Zip
echo .7z - 7-Zip
echo WPS is in right-click menu for all types
pause
