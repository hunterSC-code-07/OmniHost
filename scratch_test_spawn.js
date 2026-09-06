const { spawn } = require('child_process');

const exePath = 'C:\\OmniHostWIPDAYZ\\OmniHost\\.omnihost-data\\servers\\48\\Pal\\Binaries\\Win64\\PalServer-Win64-Shipping.exe';
const logPath = 'C:\\OmniHostWIPDAYZ\\OmniHost\\.omnihost-data\\servers\\48\\Pal\\Saved\\Logs\\Pal.log';

const args = [
  '/c',
  `""${exePath}" Pal -log > "${logPath}" 2>&1"`
];

const p = spawn('cmd.exe', args, {
  windowsVerbatimArguments: true,
  shell: false
});

p.stdout.on('data', d => console.log('STDOUT:', d.toString()));
p.stderr.on('data', d => console.log('STDERR:', d.toString()));
p.on('close', code => console.log('CODE:', code));
