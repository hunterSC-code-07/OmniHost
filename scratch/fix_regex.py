import re

def main():
    path = 'src/renderer/src/components/hubs/DashboardHub/DashboardHub.tsx'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the cards
    # Replace `<div className="... bg-cover ..." style={{backgroundImage: \`url('${getGameImageUrl('Minecraft')}')\`}}></div>`
    
    content = re.sub(
        r'<div([^>]*?style=\{\{backgroundImage:\s*`url\(\'\$\{getGameImageUrl\(\'Minecraft\'\)\}\'\)`\}\}[^>]*)></div>',
        r'<motion.div layoutId={`game-bg-Minecraft`}\1></motion.div>',
        content
    )
    content = re.sub(
        r'<div([^>]*?style=\{\{backgroundImage:\s*`url\(\'\$\{getGameImageUrl\(\'Palworld\'\)\}\'\)`\}\}[^>]*)></div>',
        r'<motion.div layoutId={`game-bg-Palworld`}\1></motion.div>',
        content
    )
    content = re.sub(
        r'<div([^>]*?style=\{\{backgroundImage:\s*`url\(\'\$\{getGameImageUrl\(\'DayZ\'\)\}\'\)`\}\}[^>]*)></div>',
        r'<motion.div layoutId={`game-bg-DayZ`}\1></motion.div>',
        content
    )
    content = re.sub(
        r'<div([^>]*?style=\{\{backgroundImage:\s*`url\(\'\$\{getGameImageUrl\(\'Satisfactory\'\)\}\'\)`\}\}[^>]*)></div>',
        r'<motion.div layoutId={`game-bg-Satisfactory`}\1></motion.div>',
        content
    )
    
    # Gamehub background
    content = re.sub(
        r'<div([^>]*?style=\{\{backgroundImage:\s*`url\(\'\$\{getGameImageUrl\(activeGameHub\)\}\'\)`\}\}[^>]*)></div>',
        r'<motion.div layoutId={`game-bg-${activeGameHub}`} initial={{ opacity: 1 }} animate={{ opacity: 0.15 }} exit={{ opacity: 1 }}\1></motion.div>',
        content
    )

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

main()
