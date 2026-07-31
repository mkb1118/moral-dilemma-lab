@echo off
echo === Clean ALL 52haozippic entries ===
for /f "tokens=*" %%k in ('reg query "HKLM\SOFTWARE\Classes\SystemFileAssociations" /s /f "52hao" /k 2^>nul ^| findstr /i "52hao"') do (
    reg delete "%%k" /f 2>nul
)
echo === Clean HaoZip ProgIDs ===
for /f "tokens=*" %%k in ('reg query "HKLM\SOFTWARE\Classes" /s /f "HaoZip" /k 2^>nul ^| findstr /i "HaoZip"') do (
    reg delete "%%k" /f 2>nul
)
echo === Done! ===
pause
