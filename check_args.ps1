Start-Process 'C:\OmniHostWIPDAYZ\OmniHost\.omnihost-data\servers\48\PalServer.exe'
Start-Sleep -s 5
Get-WmiObject Win32_Process -Filter "Name='PalServer-Win64-Shipping.exe'" | Select-Object CommandLine
