const { spawn } = require("child_process");
const ps = spawn("powershell", ["-NoProfile", "-Command", "-"]);
let out = "";
ps.stdout.on("data", (data) => out += data.toString());
ps.stderr.on("data", (data) => console.error("ERR:", data.toString()));
ps.on("close", () => { console.log("OUT:", out); });
const script = `
$all = Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name
$target = 33336
$children = @{}
foreach ($p in $all) {
    if (-not $children.ContainsKey($p.ParentProcessId)) {
        $children[$p.ParentProcessId] = @()
    }
    $children[$p.ParentProcessId] += $p
}
$queue = [System.Collections.Generic.Queue[int]]::new()
$queue.Enqueue($target)
$found = 0
while ($queue.Count -gt 0) {
    $curr = $queue.Dequeue()
    if ($children.ContainsKey($curr)) {
        foreach ($c in $children[$curr]) {
            if ($c.Name -match "java") {
                $found = $c.ProcessId
                break
            }
            $queue.Enqueue($c.ProcessId)
        }
    }
    if ($found -ne 0) { break }
}
Write-Output $found
`;
ps.stdin.write(script);
ps.stdin.end();
