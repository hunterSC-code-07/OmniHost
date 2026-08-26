import fs from 'fs';
import { join } from 'path';

export class DayzModGraph {
  static resolveMods(serverDir: string): string[] {
    const folders = fs.readdirSync(serverDir, { withFileTypes: true });
    let mods = folders
      .filter(f => (f.isDirectory() || f.isSymbolicLink()) && f.name.startsWith('@'))
      .filter(f => !fs.existsSync(join(serverDir, f.name, 'disabled.txt')))
      .map(f => f.name);

    const depsPath = join(serverDir, 'mod_dependencies.json');
    let modDeps: Record<string, string[]> = {};
    if (fs.existsSync(depsPath)) {
      try { modDeps = JSON.parse(fs.readFileSync(depsPath, 'utf8')); } catch (e) {}
    }

    // Map folder names to mod IDs
    const folderToId: Record<string, string> = {};
    const idToFolder: Record<string, string> = {};
    for (const folder of mods) {
      const modIdPath = join(serverDir, folder, 'modid.txt');
      if (fs.existsSync(modIdPath)) {
        const content = fs.readFileSync(modIdPath, 'utf-8');
        const modId = content.trim().split(':')[0];
        if (modId) {
          folderToId[folder] = modId;
          idToFolder[modId] = folder;
        }
      }
    }

    // Build graph
    const graph: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};
    
    mods.forEach(m => {
      graph[m] = [];
      inDegree[m] = 0;
    });

    mods.forEach(folder => {
      const modId = folderToId[folder];
      if (modId && modDeps[modId]) {
        modDeps[modId].forEach(depId => {
          const depFolder = idToFolder[depId];
          // If the dependency is installed and enabled, add an edge: depFolder -> folder
          if (depFolder && mods.includes(depFolder)) {
            graph[depFolder].push(folder);
            inDegree[folder]++;
          }
        });
      }
    });

    // Kahn's Algorithm
    const queue: string[] = [];
    
    // Force critical base mods to have precedence in queue if inDegree is 0
    const baseMods = ['@CF', '@CommunityOnlineTools', '@DabsFramework'];
    
    // Sort initial queue so base mods are processed first if they have 0 inDegree
    const initialZero = mods.filter(m => inDegree[m] === 0);
    initialZero.sort((a, b) => {
      const aIndex = baseMods.indexOf(a);
      const bIndex = baseMods.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b, undefined, { sensitivity: 'base' });
    });
    queue.push(...initialZero);

    const sortedMods: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sortedMods.push(current);
      
      for (const neighbor of graph[current]) {
        inDegree[neighbor]--;
        if (inDegree[neighbor] === 0) {
          queue.push(neighbor);
        }
      }
    }

    // If there's a cycle, some mods won't be in sortedMods. Just append them alphabetically.
    if (sortedMods.length < mods.length) {
      const remaining = mods.filter(m => !sortedMods.includes(m));
      remaining.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
      sortedMods.push(...remaining);
    }

    return sortedMods;
  }
}
