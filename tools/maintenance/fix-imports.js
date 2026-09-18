const fs = require('fs')

const filesToFix = [
  'src/main/dayz/DayzConfigManager.ts',
  'src/main/dayz/DayzEconomyManager.ts',
  'src/main/dayz/DayzMissionManager.ts',
  'src/main/dayz/DayzModStatusManager.ts',
  'src/main/minecraft/MinecraftDownloader.ts',
  'src/main/satisfactory/SatisfactoryModManager.ts'
]

filesToFix.forEach((file) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8')

    // Some are import { app, BrowserWindow, dialog }
    content = content.replace(
      /import\s*{\s*([^,]+),\s*app\s*,\s*([^}]+)\s*}\s*from\s*'electron'/g,
      "import { $1, $2 } from 'electron'"
    )
    content = content.replace(
      /import\s*{\s*app\s*,\s*([^}]+)\s*}\s*from\s*'electron'/g,
      "import { $1 } from 'electron'"
    )

    fs.writeFileSync(file, content, 'utf8')
  }
})
