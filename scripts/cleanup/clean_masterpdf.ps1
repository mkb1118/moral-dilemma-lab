Write-Output "=== 1. 删除 MasterPDF shell 扩展注册表 ==="

# 删除已知 CLSID
reg delete "HKLM\SOFTWARE\Classes\CLSID\{9C5C6916-4F11-4D1E-A6F1-BE59BB91C731}" /f
reg delete "HKLM\SOFTWARE\Classes\CLSID\{B4E15CD0-F916-4C8E-830A-15E3E9D01A1B}" /f
Write-Output "已删除已知 CLSID"

# 搜索剩余 XDPdf CLSID
$result = reg query HKLM\SOFTWARE\Classes\CLSID /s /f XDPdf /k 2>$null
if ($result) {
    foreach ($line in $result) {
        if ($line -match 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\CLSID\\([{][^}]+[}])') {
            $key = "HKLM\SOFTWARE\Classes\CLSID\$($Matches[1])"
            Write-Output "删除: $key"
            reg delete $key /f
        }
    }
}

Write-Output ""
Write-Output "=== 2. 删除 Program Files 残留 ==="
takeown /F "C:\Program Files (x86)\MasterPDF" /R /D Y 2>$null
icacls "C:\Program Files (x86)\MasterPDF" /grant "Everyone:F" /T /Q 2>$null
cmd /c "rmdir /s /q `"C:\Program Files (x86)\MasterPDF`""
if (Test-Path "C:\Program Files (x86)\MasterPDF") {
    Write-Output "仍需重启后删除 MasterPDF"
    cmd /c "rmdir /s /q `"C:\Program Files (x86)\fastpdf`""
} else {
    Write-Output "已删除: C:\Program Files (x86)\MasterPDF"
}

if (Test-Path "C:\Program Files (x86)\fastpdf") {
    cmd /c "rmdir /s /q `"C:\Program Files (x86)\fastpdf`""
}

Write-Output ""
Write-Output "=== 3. 强制删除用户目录 MasterPDFData ==="
$mpd = "C:\Users\LENOVO\AppData\Roaming\MasterPDFData"
takeown /F $mpd /R /D Y 2>$null
icacls $mpd /grant "Everyone:F" /T /Q 2>$null
cmd /c "rmdir /s /q `"$mpd`""
if (Test-Path $mpd) {
    Write-Output "安排重启后删除: $mpd"
    $cmd = 'cmd /c rmdir /s /q "C:\Users\LENOVO\AppData\Roaming\MasterPDFData"'
    reg add "HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\RunOnce" /v CleanMasterPDF /t REG_SZ /d "$cmd" /f
} else {
    Write-Output "已删除: $mpd"
}

Write-Output ""
Write-Output "=== 全部完成! 按Enter退出 ==="
Read-Host
