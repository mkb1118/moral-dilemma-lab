@echo off
set "WPS=D:\WPS\WPS Office\12.1.0.24657\office6\wps.exe"

echo === Setting WPS file associations ===

for %%e in (zip rar 7z) do (
    reg add "HKLM\SOFTWARE\Classes\WPSOffice.%%e\DefaultIcon" /ve /t REG_SZ /d "%WPS%,0" /f
    reg add "HKLM\SOFTWARE\Classes\WPSOffice.%%e\shell\open\command" /ve /t REG_SZ /d "\"%WPS%\" \"%%1\"" /f
    reg add "HKLM\SOFTWARE\Classes\.%%e" /ve /t REG_SZ /d "WPSOffice.%%e" /f
    reg add "HKLM\SOFTWARE\Classes\.%%e\OpenWithProgids" /v "WPSOffice.%%e" /f
    echo .%%e -^> WPSOffice.%%e
)

echo === Done! ===
pause
