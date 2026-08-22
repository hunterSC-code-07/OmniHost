const fs = require('fs');
const wipPath = 'src/renderer/src/components/hubs/DashboardHub/DashboardHub.tsx';

try {
  let code = fs.readFileSync(wipPath, 'utf8');

  // Add import if missing
  if (!code.includes('import { motion } from')) {
    code = code.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { motion } from 'motion/react';");
  }

  // Minecraft
  code = code.replace(
    /<div className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-\[3px\] group-hover:blur-0 contrast-125 saturate-\[1\.2\] brightness-75 group-hover:brightness-100" style={{backgroundImage: \url\('\$\{getGameImageUrl\('Minecraft'\)\}'\)\}}><\/div>/g,
    '<motion.div layoutId={game-bg-Minecraft} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: url(\'\')}}></motion.div>'
  );

  // Palworld
  code = code.replace(
    /<div className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-\[3px\] group-hover:blur-0 contrast-125 saturate-\[1\.2\] brightness-75 group-hover:brightness-100" style={{backgroundImage: \url\('\$\{getGameImageUrl\('Palworld'\)\}'\)\}}><\/div>/g,
    '<motion.div layoutId={game-bg-Palworld} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: url(\'\')}}></motion.div>'
  );

  // DayZ
  code = code.replace(
    /<div className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-\[3px\] group-hover:blur-0 contrast-125 saturate-\[1\.2\] brightness-75 group-hover:brightness-100" style={{backgroundImage: \url\('\$\{getGameImageUrl\('DayZ'\)\}'\)\}}><\/div>/g,
    '<motion.div layoutId={game-bg-DayZ} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: url(\'\')}}></motion.div>'
  );

  // Satisfactory
  code = code.replace(
    /<div className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-\[3px\] group-hover:blur-0 contrast-125 saturate-\[1\.2\] brightness-75 group-hover:brightness-100" style={{backgroundImage: \url\('\$\{getGameImageUrl\('Satisfactory'\)\}'\)\}}><\/div>/g,
    '<motion.div layoutId={game-bg-Satisfactory} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out group-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 group-hover:brightness-100" style={{backgroundImage: url(\'\')}}></motion.div>'
  );

  // Active game hub background
  code = code.replace(
    /<div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{backgroundImage: \url\('\$\{getGameImageUrl\(activeGameHub\)\}'\)\}}><\/div>/g,
    '<motion.div layoutId={game-bg-} initial={{ opacity: 1 }} animate={{ opacity: 0.15 }} exit={{ opacity: 1 }} className="absolute inset-0 bg-cover bg-center pointer-events-none" style={{backgroundImage: url(\'\')}}></motion.div>'
  );

  // also need to animate the activeGameHub itself, wrap it in AnimatePresence?
  // In DashboardHub.tsx, activeGameHub is rendered as:
  // {activeGameHub === null ? ( ... ) : ( <div className="w-full flex flex-col relative min-h-full pb-8"> ... )}
  
  fs.writeFileSync(wipPath, code, 'utf8');
  console.log('Successfully applied layoutId animations to DashboardHub.tsx');
} catch (e) {
  console.error('Error running script:', e);
}
