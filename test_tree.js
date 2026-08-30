const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const serverDir = 'C:\\OmniHostWIPDAYZ\\OmniHost\\.omnihost-data\\servers\\48';
const shippingExePath = path.join(serverDir, 'Pal', 'Binaries', 'Win64', 'PalServer-Win64-Shipping.exe');
const logFilePath = path.join(serverDir, 'Pal', 'Saved', 'Logs', 'Pal.log');

const args = [
  '/c',
  `""${shippingExePath}" Pal -log > "${logFilePath}" 2>&1"`
];

const child = spawn('cmd.exe', args, { cwd: serverDir, shell: false, windowsHide: false, windowsVerbatimArguments: true });

console.log('Started cmd.exe with PID:', child.pid);

setTimeout(() => {
  const ps = spawn('powershell', ['-NoProfile', '-Command', '-']);
  const script = `
    $all = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name
    $target = ${child.pid}
    Write-Output "Target cmd PID: $target"
    
    $children = @{}
    foreach ($p in $all) {
        if (-not $children.ContainsKey($p.ParentProcessId)) {
            $children[$p.ParentProcessId] = @()
        }
        $children[$p.ParentProcessId] += $p
    }
    
    $queue = [System.Collections.Generic.Queue[int]]::new()
    $queue.Enqueue($target)
    
    while ($queue.Count -gt 0) {
        $curr = $queue.Dequeue()
        if ($children.ContainsKey($curr)) {
            foreach ($c in $children[$curr]) {
                Write-Output "Found Child: $($c.Name) (PID: $($c.ProcessId)) (Parent: $($c.ParentProcessId))"
                $queue.Enqueue($c.ProcessId)
            }
        }
    }
  `;
  
  let out = '';
  ps.stdout.on('data', data => out += data.toString());
  ps.on('close', () => {
    console.log(out);
    child.kill('SIGTERM');
  });
  
  ps.stdin.write(script);
  ps.stdin.end();
}, 2000);
