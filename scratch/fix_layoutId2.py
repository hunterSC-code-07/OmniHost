import sys

def main():
    path = 'src/renderer/src/components/hubs/DashboardHub/DashboardHub.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Cards
    content = content.replace('<div className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out \ngroup-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 \ngroup-hover:brightness-100" style={{backgroundImage: `url(\'${getGameImageUrl(\'Minecraft\')}\')`}}></div>', '<motion.div layoutId={`game-bg-Minecraft`} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out \ngroup-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 \ngroup-hover:brightness-100" style={{backgroundImage: `url(\'${getGameImageUrl(\'Minecraft\')}\')`}}></motion.div>')

    content = content.replace('<div className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out \ngroup-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 \ngroup-hover:brightness-100" style={{backgroundImage: `url(\'${getGameImageUrl(\'Palworld\')}\')`}}></div>', '<motion.div layoutId={`game-bg-Palworld`} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out \ngroup-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 \ngroup-hover:brightness-100" style={{backgroundImage: `url(\'${getGameImageUrl(\'Palworld\')}\')`}}></motion.div>')

    content = content.replace('<div className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out \ngroup-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 \ngroup-hover:brightness-100" style={{backgroundImage: `url(\'${getGameImageUrl(\'DayZ\')}\')`}}></div>', '<motion.div layoutId={`game-bg-DayZ`} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out \ngroup-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 \ngroup-hover:brightness-100" style={{backgroundImage: `url(\'${getGameImageUrl(\'DayZ\')}\')`}}></motion.div>')

    content = content.replace('<div className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out \ngroup-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 \ngroup-hover:brightness-100" style={{backgroundImage: `url(\'${getGameImageUrl(\'Satisfactory\')}\')`}}></div>', '<motion.div layoutId={`game-bg-Satisfactory`} className="absolute inset-0 bg-cover bg-center z-0 transition-all duration-700 ease-out \ngroup-hover:scale-105 blur-[3px] group-hover:blur-0 contrast-125 saturate-[1.2] brightness-75 \ngroup-hover:brightness-100" style={{backgroundImage: `url(\'${getGameImageUrl(\'Satisfactory\')}\')`}}></motion.div>')

    # Game hub background
    content = content.replace('<div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{backgroundImage: \n`url(\'${getGameImageUrl(activeGameHub)}\')`}}></div>', '<motion.div layoutId={`game-bg-${activeGameHub}`} initial={{ opacity: 1 }} animate={{ opacity: 0.15 }} exit={{ opacity: 1 }} transition={{ duration: 0.4 }} className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{backgroundImage: \n`url(\'${getGameImageUrl(activeGameHub)}\')`}}></motion.div>')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

main()
