import sys

def main():
    path = 'src/renderer/src/components/hubs/DashboardHub/DashboardHub.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 1. Import AnimatePresence
    for i, line in enumerate(lines):
        if "import { motion } from 'motion/react';" in line:
            lines[i] = "import { motion, AnimatePresence } from 'motion/react';\n"
            break
        elif "import React, { useState } from 'react';" in line:
            lines[i] = "import React, { useState } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';\n"
            break
            
    # 2. Add AnimatePresence and dashboard key
    for i, line in enumerate(lines):
        if "{activeGameHub === null ? (" in line:
            lines[i] = '      <AnimatePresence mode="wait">\n      {activeGameHub === null ? (\n'
            # The next line is the dashboard div
            for j in range(i+1, min(i+5, len(lines))):
                if '<div className="w-full flex flex-col relative min-h-full pb-8">' in lines[j]:
                    lines[j] = lines[j].replace('<div', '<motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}')
                    break
            break
            
    # 3. Add game cards layoutId
    for i, line in enumerate(lines):
        if 'style={{backgroundImage: url(\'\')}}></div>' in line:
            lines[i] = line.replace('<div', '<motion.div layoutId={game-bg-Minecraft}').replace('</div>', '</motion.div>')
        elif 'style={{backgroundImage: url(\'\')}}></div>' in line:
            lines[i] = line.replace('<div', '<motion.div layoutId={game-bg-Palworld}').replace('</div>', '</motion.div>')
        elif 'style={{backgroundImage: url(\'\')}}></div>' in line:
            lines[i] = line.replace('<div', '<motion.div layoutId={game-bg-DayZ}').replace('</div>', '</motion.div>')
        elif 'style={{backgroundImage: url(\'\')}}></div>' in line:
            lines[i] = line.replace('<div', '<motion.div layoutId={game-bg-Satisfactory}').replace('</div>', '</motion.div>')
            
    # 4. Swap point
    for i, line in enumerate(lines):
        if line.strip() == ') : (':
            # Check next line for gamehub div
            if i + 1 < len(lines) and '<div className="w-full flex flex-col relative min-h-full pb-8">' in lines[i+1]:
                # We found the right ) : (
                if '</div>' in lines[i-1]:
                    lines[i-1] = lines[i-1].replace('</div>', '</motion.div>')
                
                lines[i+1] = lines[i+1].replace('<div', '<motion.div key="gamehub" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}')
                break
            
    # 5. Gamehub background
    for i, line in enumerate(lines):
        if 'className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"' in line:
            lines[i] = line.replace('<div ', '<motion.div layoutId={game-bg-} initial={{ opacity: 1 }} animate={{ opacity: 0.15 }} exit={{ opacity: 1 }} ').replace('</div>', '</motion.div>')
            
    # 6. End of ternary
    for i in range(len(lines)-1, -1, -1):
        if lines[i].strip() == ')}':
            # This is the end of ternary. The line before should be closing gamehub div.
            if '</div>' in lines[i-1]:
                lines[i-1] = lines[i-1].replace('</div>', '</motion.div>')
            lines.insert(i+1, '      </AnimatePresence>\n')
            break

    with open('scratch/DashboardHub_repaired2.tsx', 'w', encoding='utf-8') as f:
        f.writelines(lines)

main()
