import axios from 'axios';


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
    } catch (e: any) {
      console.error('SteamWebAPI searchWorkshop error:', e);
      if (e.response && e.response.status === 429) {
        throw new Error('Steam is rate-limiting your requests. Please wait a few minutes before searching again.');
      }
      throw e;
    }
  }

  static async getModDependencies(modId: string): Promise<string[]> {
    try {
      const url = `https://steamcommunity.com/sharedfiles/filedetails/?id=${modId}`;
      const response = await axios.get(url);
      const html = response.data;
      
      const parts = html.split('class="requiredItemsContainer"');
      if (parts.length > 1) {
        let block = parts[1];
        // Ensure we don't accidentally match items from 'More from this author' section
        const endPart = block.indexOf('class="rightDetailsBlock"');
        if (endPart !== -1) {
            block = block.substring(0, endPart);
        }
        
        const idRegex = /filedetails\/\?id=(\d+)/g;
        const ids = [...block.matchAll(idRegex)].map(m => m[1]);
        return [...new Set(ids)];
      }
      return [];
    } catch (e: any) {
      console.error(`SteamWebAPI getModDependencies error for ${modId}:`, e);
      if (e.response && e.response.status === 429) {
        throw new Error('Steam is rate-limiting your requests. Please wait a few minutes before checking dependencies again.');
      }
      throw e;
    }
  }

  static async getWorkshopItemDetails(modIds: string[]) {
    try {
      modIds = modIds.filter(id => id && String(id) !== '0' && /^\d+$/.test(String(id)));
      if (modIds.length === 0) return [];
      
      const BATCH_SIZE = 25;
      let allDetails: any[] = [];

      for (let i = 0; i < modIds.length; i += BATCH_SIZE) {
        const batch = modIds.slice(i, i + BATCH_SIZE);
        let paramsStr = `itemcount=${batch.length}`;
        batch.forEach((id, index) => {
          paramsStr += `&publishedfileids[${index}]=${id}`;
        });

        const response = await axios.post(`https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/`, paramsStr, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        const details = (response.data?.response?.publishedfiledetails || []).filter((mod: any) => mod.result === 1);
        allDetails = allDetails.concat(details.map((mod: any) => ({
          id: mod.publishedfileid,
          publishedfileid: mod.publishedfileid,
          title: mod.title,
          description: mod.description,
          author: mod.creator,
          subscriptions: mod.subscriptions || 0,
          thumbnail: mod.preview_url || '',
          preview_url: mod.preview_url || '',
          updated: mod.time_updated,
          file_size: mod.file_size,
          tags: mod.tags
        })));
      }
      return allDetails;
    } catch (e: any) {
      console.error('SteamWebAPI getWorkshopItemDetails error:', e);
      if (e.response && e.response.status === 429) {
        throw new Error('Steam API is rate-limiting your requests. Please wait a few minutes before trying again.');
      }
      throw e;
    }
  }
}
