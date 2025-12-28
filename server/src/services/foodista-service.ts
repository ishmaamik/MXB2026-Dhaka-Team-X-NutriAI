import axios from 'axios';
import * as cheerio from 'cheerio';

export interface FoodistaPost {
    title: string;
    link: string;
    description: string;
    pubDate: string;
    image?: string;
}

export class FoodistaService {
    // The official RSS feed URL found via testing
    private readonly RSS_URL = 'https://www.foodista.com/rss.xml';

    /**
     * Fetch latest posts from Foodista RSS feed
     */
    async getLatestPosts(): Promise<FoodistaPost[]> {
        try {
            console.log(`Fetching RSS feed from ${this.RSS_URL}...`);
            const response = await axios.get(this.RSS_URL, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 5000
            });

            const $ = cheerio.load(response.data, { xmlMode: true });
            const posts: FoodistaPost[] = [];

            $('item').each((i, el) => {
                if (i >= 12) return; // Limit to 12 items

                const title = $(el).find('title').text();
                const link = $(el).find('link').text();
                const descriptionRaw = $(el).find('description').text();
                const pubDate = $(el).find('pubDate').text();

                // Extract image from description if possible (often RSS has CDATA with img)
                let image = '';
                const imgMatch = descriptionRaw.match(/<img[^>]+src="([^">]+)"/);
                if (imgMatch) {
                    image = imgMatch[1];
                }

                // Clean description
                const cleanDesc = descriptionRaw.replace(/<[^>]+>/g, '').trim().substring(0, 150) + '...';

                posts.push({
                    title,
                    link,
                    description: cleanDesc,
                    pubDate,
                    image
                });
            });

            return posts;
        } catch (error) {
            console.error('Error fetching Foodista RSS:', error);
            return [];
        }
    }
}

export const foodistaService = new FoodistaService();
