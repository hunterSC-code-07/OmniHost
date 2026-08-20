const { exec } = require("child_process");
exec(`powershell -NoProfile -Command "Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name | ConvertTo-Json -Compress"`, { maxBuffer: 1024*1024*10 }, (err, stdout) => {
    const processes = JSON.parse(stdout);
    const javaProcs = processes.filter(p => p.Name && p.Name.toLowerCase().includes("java"));
    javaProcs.forEach(jp => {
        console.log("Java PID:", jp.ProcessId);
        let curr = jp.ParentProcessId;
        while(curr) {
            const parent = processes.find(p => p.ProcessId === curr);
            if (!parent) break;
            console.log(" -> Parent:", parent.ProcessId, parent.Name);
            curr = parent.ParentProcessId;
        }
    });
});
