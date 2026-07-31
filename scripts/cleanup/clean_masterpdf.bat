@echo off
echo === Kill Explorer ===
taskkill /f /im explorer.exe 2>nul

echo === Delete Registry ===
reg delete "HKLM\SOFTWARE\Classes\CLSID\{9C5C6916-4F11-4D1E-A6F1-BE59BB91C731}" /f 2>nul
reg delete "HKLM\SOFTWARE\Classes\CLSID\{B4E15CD0-F916-4C8E-830A-15E3E9D01A1B}" /f 2>nul

echo === Delete Files ===
takeown /F "C:\Program Files (x86)\MasterPDF" /R /D Y >nul 2>&1
icacls "C:\Program Files (x86)\MasterPDF" /grant Everyone:F /T /Q >nul 2>&1
rmdir /s /q "C:\Program Files (x86)\MasterPDF" 2>nul
if exist "C:\Program Files (x86)\MasterPDF" (
    echo MasterPDF in Program Files needs reboot to delete
)

takeown /F "C:\Users\LENOVO\AppData\Roaming\MasterPDFData" /R /D Y >nul 2>&1
icacls "C:\Users\LENOVO\AppData\Roaming\MasterPDFData" /grant Everyone:F /T /Q >nul 2>&1
rmdir /s /q "C:\Users\LENOVO\AppData\Roaming\MasterPDFData" 2>nul
if exist "C:\Users\LENOVO\AppData\Roaming\MasterPDFData" (
    echo MasterPDFData needs reboot to delete - scheduling...
    reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce" /v CleanMasterPDF /t REG_SZ /d "cmd /c rmdir /s /q \"C:\Users\LENOVO\AppData\Roaming\MasterPDFData\"" /f >nul
)

echo === Restart Explorer ===
start explorer.exe

echo === Done! ===
