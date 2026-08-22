import axios from 'axios';

const STEAM_API_KEY = '16C3DEE97F2D656EC9DF78A131565B37';

export class SteamWebAPI {
  static async searchWorkshop(query: string, appId: number = 221100, page: number = 1, queryType: number = 9, requiredTags: string[] = []) {
    try {
      let browsesort = 'trend';
      if (queryType === 14) browsesort = 'totaluniquesubscribers';
      else if (queryType === 1) browsesort = 'mostrecent';

      let url = `https://steamcommunity.com/workshop/browse/?appid=${appId}&searchtext=${encodeURIComponent(query)}&childpublishedfileid=0&browsesort=${browsesort}&section=readytouseitems&p=${page}`;
      
      if (requiredTags && requiredTags.length > 0) {
        requiredTags.forEach(tag => {
          url += `&requiredtags[]=${encodeURIComponent(tag)}`;
        });
      }

      const response = await axios.get(url);
      const html = response.data;
      
      // Extract IDs from HTML using regex
      const regex = /https:\/\/steamcommunity\.com\/sharedfiles\/filedetails\/\?id=(\d+)/g;
      const matches = [...html.matchAll(regex)].map(m => m[1]);
      const uniqueIds = [...new Set(matches)];
      
      if (uniqueIds.length === 0) return [];
      
      // Fetch details using the non-key endpoint
      return await this.getWorkshopItemDetails(uniqueIds);
    } catch (e) {
      console.error('SteamWebAPI searchWorkshop error:', e);
      return [];
    }
  }

  static async getModDependencies(modId: string): Promise<string[]> {
    try {
      const url = `https://steamcommunity.com/sharedfiles/filedetails/?id=${modId}`;
      const response = await axios.get(url);
      const html = response.data;
      const regex = /class="requiredItemsContainer"[\s\S]*?<\/div>/;
      const containerMatch = html.match(regex);
      if (containerMatch) {
        const idRegex = /filedetails\/\?id=(\d+)/g;
        const ids = [...containerMatch[0].matchAll(idRegex)].map(m => m[1]);
        return [...new Set(ids)];
      }
      return [];
    } catch (e) {
      console.error(`SteamWebAPI getModDependencies error for ${modId}:`, e);
      return [];
    }
  }

  static async getWorkshopItemDetails(modIds: string[]) {
    try {
      // Create x-www-form-urlencoded body for the request
      const params = new URLSearchParams();
      params.append('itemcount', modIds.length.toString());
      modIds.forEach((id, index) => {
        params.append(`publishedfileids[${index}]`, id);
      });

      const response = await axios.post(`https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/`, params.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      const details = response.data?.response?.publishedfiledetails || [];
      return details.map((mod: any) => ({
        id: mod.publishedfileid,
        title: mod.title,
        description: mod.description,
        author: mod.creator,
        subscriptions: mod.subscriptions || 0,
        thumbnail: mod.preview_url || '',
        updated: mod.time_updated
      }));
    } catch (e) {
      console.error('SteamWebAPI getWorkshopItemDetails error:', e);
      return [];
    }
  }
}
