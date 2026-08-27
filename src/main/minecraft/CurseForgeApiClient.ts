import axios from 'axios'

const FALLBACK_CURSEFORGE_API_KEY = '$2a$10$WLjUD.aJlcjuSSdEOByujetqwwhUeTTfS2AsFhIOq31vLq./E1nRO';

export class CurseForgeApiClient {
  static async searchCurseforgeMods(
    search: string,
    type: string,
    version: string,
    page: number = 0,
    classId: number = 6,
    sortField: number = 2
  ) {
    try {
      require('dotenv').config();
      const apiKey = process.env.CURSEFORGE_API_KEY || FALLBACK_CURSEFORGE_API_KEY;
      if (!apiKey) {
        console.error('Error searching Curseforge mods: API Key is missing from environment.');
      }

      let url = `https://api.curseforge.com/v1/mods/search?gameId=432&classId=${classId}&sortField=${sortField}&sortOrder=desc&index=${page * 50}`
      
      if (search) url += `&searchFilter=${encodeURIComponent(search)}`
      
      if (version) {
        const cfVersion = version.endsWith('.0') && version.split('.').length === 3 
          ? version.slice(0, -2) 
          : version
        url += `&gameVersion=${encodeURIComponent(cfVersion)}`
      }
      
      if (type) {
        if (type === 'Forge') url += '&modLoaderType=1'
        else if (type === 'Fabric') url += '&modLoaderType=4'
        else if (type === 'NeoForge') url += '&modLoaderType=6'
        else if (type === 'Quilt') url += '&modLoaderType=5'
      }

      const res = await axios.get(url, { headers: { 'x-api-key': apiKey } })
      return res.data.data
    } catch (e: any) {
      console.error('Error searching Curseforge mods:', e.message)
      return []
    }
  }

  static async getCurseforgeMod(modId: number) {
    try {
      require('dotenv').config();
      const apiKey = process.env.CURSEFORGE_API_KEY || FALLBACK_CURSEFORGE_API_KEY;
      const res = await axios.get(`https://api.curseforge.com/v1/mods/${modId}`, {
        headers: { 'x-api-key': apiKey }
      })
      return res.data.data
    } catch (e: any) {
      console.error('Error getting Curseforge mod:', e.message)
      return null
    }
  }

  static async getCurseforgeFile(modId: number, fileId: number) {
    try {
      require('dotenv').config();
      const apiKey = process.env.CURSEFORGE_API_KEY || FALLBACK_CURSEFORGE_API_KEY;
      const res = await axios.get(`https://api.curseforge.com/v1/mods/${modId}/files/${fileId}`, {
        headers: { 'x-api-key': apiKey }
      })
      return res.data.data
    } catch (e: any) {
      console.error('Error getting Curseforge file:', e.message)
      return null
    }
  }

  static async searchModpacks(query: string, version: string, modloader: string) {
    return this.searchCurseforgeMods(query, modloader, version, 0, 4471, 2)
  }

  static async getModpackDetails(modId: string) {
    return this.getCurseforgeMod(parseInt(modId))
  }
}
