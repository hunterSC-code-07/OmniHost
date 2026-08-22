import sys

def main():
    path = 'src/renderer/src/components/hubs/DashboardHub/DashboardHub.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    for i, line in enumerate(lines):
        if "style={{backgroundImage: url('')}}></div>" in line:
            lines[i] = line.replace('<div ', '<motion.div layoutId={game-bg-Minecraft} ').replace('></div>', '></motion.div>')
        elif "style={{backgroundImage: url('')}}></div>" in line:
            lines[i] = line.replace('<div ', '<motion.div layoutId={game-bg-Palworld} ').replace('></div>', '></motion.div>')
        elif "style={{backgroundImage: url('')}}></div>" in line:
            lines[i] = line.replace('<div ', '<motion.div layoutId={game-bg-DayZ} ').replace('></div>', '></motion.div>')
        elif "style={{backgroundImage: url('')}}></div>" in line:
            lines[i] = line.replace('<div ', '<motion.div layoutId={game-bg-Satisfactory} ').replace('></div>', '></motion.div>')
        elif "style={{backgroundImage: url('')}}></div>" in line:
            lines[i] = line.replace('<div ', '<motion.div layoutId={game-bg-} ').replace('></div>', '></motion.div>')

    with open(path, 'w', encoding='utf-8') as f:
        f.writelines(lines)

main()
