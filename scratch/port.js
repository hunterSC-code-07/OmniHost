const fs = require('fs');
const mainPath = 'scratch/main_App.tsx';
const wipPath = 'src/renderer/src/components/hubs/MinecraftHub/MinecraftHub.tsx';

try {
  const main = fs.readFileSync(mainPath, 'utf8');
  const wip = fs.readFileSync(wipPath, 'utf8');

  const mainStart = main.indexOf('{activeServer !== undefined && activeServerId !== null && (');
  if (mainStart === -1) throw new Error('mainStart not found');

  const motionStart = main.indexOf('<motion.div', mainStart);
  let braces = 0;
  let mainEnd = -1;
  let started = false;
  for (let i = motionStart; i < main.length; i++) {
      if (main.substring(i, i+11) === '<motion.div') { braces++; started = true; i += 10; }
      else if (main.substring(i, i+12) === '</motion.div>') {
          braces--;
          i += 11;
          if (started && braces === 0) {
              mainEnd = i + 1;
              break;
          }
      }
  }

  const mainContent = main.slice(motionStart, mainEnd);
  console.log('Found mainContent block of size:', mainContent.length);

  const innerStart = mainContent.indexOf('>') + 1;
  const innerEnd = mainContent.lastIndexOf('</motion.div>');
  const innerJSX = mainContent.slice(innerStart, innerEnd);

  const wipReturnIdx = wip.indexOf('return (', wip.indexOf('activeLogs ='));
  braces = 0;
  let wipEndIdx = -1;
  started = false;
  for (let i = wipReturnIdx; i < wip.length; i++) {
      if (wip[i] === '(') { braces++; started = true; }
      else if (wip[i] === ')') {
          braces--;
          if (started && braces === 0) {
              wipEndIdx = i;
              break;
          }
      }
  }
  console.log('WIP return block indices:', wipReturnIdx, wipEndIdx);

  const newReturnBlock = 'return (\n    <div className=\"flex-1 flex flex-col relative overflow-hidden\">' + innerJSX + '    </div>\n  )';

  const newWip = wip.slice(0, wipReturnIdx) + newReturnBlock + wip.slice(wipEndIdx + 1);

  fs.writeFileSync(wipPath, newWip, 'utf8');
  console.log('Successfully wrote new UI. Size went from ' + wip.length + ' to ' + newWip.length);
} catch (e) {
  console.error('Error running script:', e);
}
