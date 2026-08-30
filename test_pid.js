const pidusage = require('pidusage');
const { execSync } = require('child_process');

try {
  const pids = execSync('tasklist /FI "IMAGENAME eq PalServer-Win64-Shipping.exe" /NH /FO CSV').toString().split('\n').filter(l => l.trim() && !l.includes('INFO:'));
  if (pids.length > 0) {
    const pid = parseInt(pids[0].split(',')[1].replace(/"/g, ''));
    console.log('Found PID:', pid);
    
    // Poll 5 times
    let count = 0;
    const interval = setInterval(() => {
      pidusage(pid, (err, stats) => {
        console.log('STATS:', err, stats);
        count++;
        if (count >= 5) {
          clearInterval(interval);
          pidusage.clear();
        }
      });
    }, 2000);
  } else {
    console.log('Not running');
  }
} catch(e) {
  console.log('Error', e.message);
}
