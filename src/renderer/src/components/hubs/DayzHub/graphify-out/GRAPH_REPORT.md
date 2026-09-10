# Graph Report - D:\\github\\OmniHost\\src\\renderer\\src\\components\\hubs\\DayzHub (2026-08-26)

## Corpus Check

- Corpus is ~8,446 words - fits in a single context window. You may not need a graph.

## Summary

- 48 nodes · 70 edges · 12 communities detected
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Structure Signals

- Entity graph basis: 40 non-file, non-concept node(s)
- Weakly connected components: 3
- Singleton components: 2
- Isolated nodes: 2
- Largest component: 38 node(s) (95% of the entity graph basis)
- Low-cohesion communities: 0
- Largest low-cohesion community: none on the entity graph basis

## Workspace Bridges

1. `DayzHubContent\(\)` - connects `Tabs Dayz Economy Tab`, `Tabs Dayz Files Tab`, `Tabs Dayz Installed Mods Tab`, `Tabs Dayz Mods Tab`, `Tabs Dayz Options Tab`; home: `Dayz Hub`; degree 6; score 307
   source files: `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/DayzHub.tsx`, `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzEconomyTab.tsx`, `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzFilesTab.tsx`, `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzInstalledModsTab.tsx`, `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzModsTab.tsx`, `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzOptionsTab.tsx`
2. `DayzOptionsTab\(\)` - connects `Dayz Hub`, `Tabs Dayz Options Tab — Config`, `Tabs Dayz Options Tab — Replace`; home: `Tabs Dayz Options Tab`; degree 6; score 398
   source files: `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/DayzHub.tsx`, `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzOptionsTab.tsx`
3. `DayzModsTab\(\)` - connects `Dayz Hub`, `Tabs Dayz Mods Tab — Handle`; home: `Tabs Dayz Mods Tab`; degree 9; score 364.5
   source files: `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/DayzHub.tsx`, `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzModsTab.tsx`
4. `DayzFilesTab\(\)` - connects `Dayz Hub`; home: `Tabs Dayz Files Tab`; degree 9; score 351.5
   source files: `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/DayzHub.tsx`, `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzFilesTab.tsx`
5. `DayzEconomyTab\(\)` - connects `Dayz Hub`; home: `Tabs Dayz Economy Tab`; degree 5; score 193.5
   source files: `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/DayzHub.tsx`, `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzEconomyTab.tsx`
6. `parseConfig\(\)` - connects `Tabs Dayz Options Tab`; home: `Tabs Dayz Options Tab — Config`; degree 4; score 105
   source files: `D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzOptionsTab.tsx`

## God Nodes

1. `DayzFilesTab\(\)` - 11 edges
2. `DayzModsTab\(\)` - 11 edges
3. `DayzOptionsTab\(\)` - 8 edges
4. `DayzEconomyTab\(\)` - 7 edges
5. `DayzHubContent\(\)` - 7 edges
6. `fetchDir\(\)` - 5 edges
7. `DayzInstalledModsTab\(\)` - 4 edges
8. `loadInstalledMods\(\)` - 4 edges
9. `parseConfig\(\)` - 4 edges
10. `CustomSelect\(\)` - 3 edges

## Surprising Connections

- `DayzHubContent\(\)` --renders--> `DayzOptionsTab\(\)` [EXTRACTED]
  D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/DayzHub.tsx → D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzOptionsTab.tsx _bridges separate communities_
- `DayzHubContent\(\)` --renders--> `DayzEconomyTab\(\)` [EXTRACTED]
  D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/DayzHub.tsx → D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzEconomyTab.tsx _bridges separate communities_
- `DayzHubContent\(\)` --renders--> `DayzModsTab\(\)` [EXTRACTED]
  D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/DayzHub.tsx → D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzModsTab.tsx _bridges separate communities_
- `DayzHubContent\(\)` --renders--> `DayzInstalledModsTab\(\)` [EXTRACTED]
  D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/DayzHub.tsx → D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzInstalledModsTab.tsx _bridges separate communities_
- `DayzHubContent\(\)` --renders--> `DayzFilesTab\(\)` [EXTRACTED]
  D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/DayzHub.tsx → D:/github/OmniHost/src/renderer/src/components/hubs/DayzHub/tabs/DayzFilesTab.tsx _bridges separate communities_

## Semantic Anomalies

- **[HIGH] Bridge node** - DayzOptionsTab\(\) bridges Tabs Dayz Options Tab and Dayz Hub, Tabs Dayz Options Tab — Config, Tabs Dayz Options Tab — Replace, Tabs Dayz Animated Background.
  _High betweenness centrality \(362.000\) across 5 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - DayzHubContent\(\) bridges Dayz Hub and Tabs Dayz Animated Background, Tabs Dayz Options Tab, Tabs Dayz Economy Tab, Tabs Dayz Mods Tab, Tabs Dayz Installed Mods Tab, Tabs Dayz Files Tab.
  _High betweenness centrality \(251.000\) across 7 communities makes this node a likely dependency chokepoint._
- **[HIGH] Bridge node** - DayzModsTab\(\) bridges Tabs Dayz Mods Tab and Dayz Hub, Tabs Dayz Mods Tab — Dayz, Tabs Dayz Mods Tab — Handle, Tabs Dayz Animated Background.
  _High betweenness centrality \(335.500\) across 5 communities makes this node a likely dependency chokepoint._
- **[HIGH] Cross-boundary edge** - DayzHubContent\(\) → DayzEconomyTab\(\) crosses graph boundaries in an unexpected way.
  _bridges separate communities_
- **[HIGH] Cross-boundary edge** - DayzHubContent\(\) → DayzFilesTab\(\) crosses graph boundaries in an unexpected way.
  _bridges separate communities_

## Communities

### Community 0 - "Tabs Dayz Files Tab"

Cohesion (entity basis within full-graph community): 0.36
Nodes (9): DayzFilesTab\(\), fetchDir\(\), formatSize\(\), handleCreateFolder\(\), handleDelete\(\), handleFileClick\(\), handleNavigate\(\), handleNavigateUp\(\) (+1 more)

### Community 1 - "Tabs Dayz Mods Tab"

Cohesion (entity basis within full-graph community): 0.43
Nodes (7): DayzModsTab\(\), handleBrowseWorkshop\(\), handleImportWorkshop\(\), handleInstall\(\), handleUninstall\(\), loadInstalledMods\(\), stripBBCode\(\)

### Community 2 - "Tabs Dayz Economy Tab"

Cohesion (entity basis within full-graph community): 0.4
Nodes (5): DayzEconomyTab\(\), handleMultiplierChange\(\), handleSave\(\), loadEconomy\(\), renderSlider\(\)

### Community 3 - "Tabs Dayz Options Tab"

Cohesion (entity basis within full-graph community): 0.5
Nodes (4): CustomNumberInput\(\), CustomSelect\(\), handleClickOutside\(\), DayzOptionsTab\(\)

### Community 4 - "Tabs Dayz Options Tab — Config"

Cohesion (entity basis within full-graph community): 0.5
Nodes (4): loadConfig\(\), parseConfig\(\), extractNumber\(\), extractString\(\)

### Community 5 - "Tabs Dayz Animated Background"

Cohesion (entity basis within full-graph community): n/a
Nodes (0):

### Community 6 - "Tabs Dayz Installed Mods Tab"

Cohesion (entity basis within full-graph community): 1
Nodes (2): DayzInstalledModsTab\(\), openWorkshopPage\(\)

### Community 7 - "Tabs Dayz Options Tab — Replace"

Cohesion (entity basis within full-graph community): 0.67
Nodes (3): handleSave\(\), replaceNumber\(\), replaceString\(\)

### Community 8 - "Tabs Dayz Files Tab — Dayz"

Cohesion (entity basis within full-graph community): 1
Nodes (1): FileEntry

### Community 9 - "Dayz Hub"

Cohesion (entity basis within full-graph community): 1
Nodes (2): DayzHub\(\), DayzHubContent\(\)

### Community 10 - "Tabs Dayz Mods Tab — Dayz"

Cohesion (entity basis within full-graph community): 1
Nodes (1): DayzModsTabProps

### Community 11 - "Tabs Dayz Mods Tab — Handle"

Cohesion (entity basis within full-graph community): 1
Nodes (2): handleCategoryChange\(\), handleSearch\(\)

## Knowledge Gaps

- **18 weakly connected node(s):** `DayzHub\(\)`, `loadEconomy\(\)`, `handleMultiplierChange\(\)`, `handleSave\(\)`, `renderSlider\(\)` (+13 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Tabs Dayz Files Tab — Dayz`** (2 nodes): `DayzFilesTab.tsx`, `FileEntry`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Dayz Hub`** (2 nodes): `DayzHub\(\)`, `DayzHubContent\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tabs Dayz Mods Tab — Dayz`** (2 nodes): `DayzModsTab.tsx`, `DayzModsTabProps`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Tabs Dayz Mods Tab — Handle`** (2 nodes): `handleCategoryChange\(\)`, `handleSearch\(\)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions

_Questions this graph is uniquely positioned to answer:_

- **Why does \`DayzOptionsTab\(\)\` connect \`Tabs Dayz Options Tab\` to \`Dayz Hub\`, \`Tabs Dayz Options Tab — Config\`, \`Tabs Dayz Options Tab — Replace\`, \`Tabs Dayz Animated Background\`?**
  _High betweenness centrality \(362.000\) - this node is a cross-community bridge._
- **Why does \`DayzModsTab\(\)\` connect \`Tabs Dayz Mods Tab\` to \`Dayz Hub\`, \`Tabs Dayz Mods Tab — Dayz\`, \`Tabs Dayz Mods Tab — Handle\`, \`Tabs Dayz Animated Background\`?**
  _High betweenness centrality \(335.500\) - this node is a cross-community bridge._
- **Why does \`DayzFilesTab\(\)\` connect \`Tabs Dayz Files Tab\` to \`Dayz Hub\`, \`Tabs Dayz Files Tab — Dayz\`, \`Tabs Dayz Animated Background\`?**
  _High betweenness centrality \(332.500\) - this node is a cross-community bridge._
- **What connects \`DayzHub\(\)\`, \`loadEconomy\(\)\`, \`handleMultiplierChange\(\)\` to the rest of the system?**
  _18 weakly-connected nodes found - possible documentation gaps or missing edges._
