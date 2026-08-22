import re

path = 'src/renderer/src/App.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add getGameThemeColor
theme_color_code = """};

const getGameThemeColor = (game: string | null) => {
  if (!game) return { omni: '#ffffff', host: '#cccccc' };
  const g = game.toLowerCase();
  if (g.includes('minecraft')) return { omni: '#4ade80', host: '#bbf7d0' };
  if (g.includes('palworld')) return { omni: '#3b82f6', host: '#bfdbfe' };
  if (g.includes('dayz')) return { omni: '#ef4444', host: '#fecaca' };
  if (g.includes('satisfactory')) return { omni: '#eab308', host: '#fef08a' };
  return { omni: '#ffffff', host: '#cccccc' };
};

export default function App() {"""

content = content.replace("};\n\nexport default function App() {", theme_color_code)

# 2. Add lastGameHub state and useEffect
state_search = "const [activeGameHub, setActiveGameHub] = useState<string | null>(null)"
state_replace = """const [activeGameHub, setActiveGameHub] = useState<string | null>(null)
  const [lastGameHub, setLastGameHub] = useState<string | null>(null)

  useEffect(() => {
    if (activeGameHub) {
      setLastGameHub(activeGameHub)
    }
  }, [activeGameHub])"""

content = content.replace(state_search, state_replace)

# 3. Replace Logo
logo_search = """          <div className="flex items-center gap-6">
            {/* LOGO */}
            <div className="flex items-center gap-3 cursor-default group">
              <h1 className="text-3xl font-sans text-white flex items-center whitespace-nowrap">
                <span className="text-brand mr-2 flex">
                  {"Omni".split("").map((char, i) => (
                    <span key={`omni-${i}`} className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110" style={{ transitionDelay: `${i * 30}ms` }}>{char}</span>
                  ))}
                </span>
                <span className="flex">
                  {"Host".split("").map((char, i) => (
                    <span key={`host-${i}`} className="transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110" style={{ transitionDelay: `${(i + 4) * 30}ms` }}>{char}</span>
                  ))}
                </span>
              </h1>
            </div>"""
            
logo_replace = """          <div className="flex items-center gap-6">
            {/* LOGO */}
            <div className="flex items-center gap-3 cursor-default group">
              <h1 className="text-[34px] leading-none tracking-tight font-bold flex items-center whitespace-nowrap transition-transform duration-300 group-hover:scale-105" style={{ fontFamily: '"Oswald", sans-serif' }}>
                <span 
                  className={`mr-2 logo-sweep ${activeGameHub ? 'active' : ''}`}
                  style={{ '--logo-default-color': '#ffffff', '--logo-game-color': getGameThemeColor(activeGameHub || lastGameHub).omni } as React.CSSProperties}
                >
                  Omni
                </span>
                <span 
                  className={`logo-sweep ${activeGameHub ? 'active' : ''}`}
                  style={{ '--logo-default-color': '#cccccc', '--logo-game-color': getGameThemeColor(activeGameHub || lastGameHub).host } as React.CSSProperties}
                >
                  Host
                </span>
              </h1>
            </div>"""

content = content.replace(logo_search, logo_replace)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Done")
