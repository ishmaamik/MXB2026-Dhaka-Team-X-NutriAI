import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ScrapedRecipe {
    title: string;
    description: string;
    image: string;
    url: string;
    ingredients: string[];
    instructions: string[];
    prepTime?: string;
    cookTime?: string;
    servings?: string;
    author?: string;
}

export class WebScraperService {

    /**
     * Scrape a recipe from a given URL
     */
    async scrapeRecipe(url: string): Promise<ScrapedRecipe | null> {
        try {
            console.log(`ResourceImporter: Scraping ${url}...`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 10000
            });

            const $ = cheerio.load(response.data);
            const recipe: ScrapedRecipe = {
                title: '',
                description: '',
                image: '',
                url: url,
                ingredients: [],
                instructions: []
            };

            // 1. Try JSON-LD (Most modern sites)
            const jsonLd = $('script[type="application/ld+json"]');
            jsonLd.each((i, el) => {
                try {
                    const data = JSON.parse($(el).html() || '{}');
                    const graph = Array.isArray(data) ? data : (data['@graph'] || [data]);

                    const recipeData = graph.find((item: any) =>
                        item['@type'] === 'Recipe' || item['@type']?.includes('Recipe')
                    );

                    if (recipeData) {
                        console.log('ResourceImporter: Found JSON-LD Recipe data');
                        recipe.title = recipeData.name;
                        recipe.description = recipeData.description;
                        recipe.image = Array.isArray(recipeData.image) ? recipeData.image[0] : (recipeData.image?.url || recipeData.image);
                        recipe.author = recipeData.author?.name;
                        recipe.ingredients = recipeData.recipeIngredient || [];

                        // Parse instructions
                        if (Array.isArray(recipeData.recipeInstructions)) {
                            recipe.instructions = recipeData.recipeInstructions.map((inst: any) => {
                                if (typeof inst === 'string') return inst;
                                return inst.text || inst.name || '';
                            });
                        } else if (typeof recipeData.recipeInstructions === 'string') {
                            recipe.instructions = [recipeData.recipeInstructions];
                        }

                        recipe.prepTime = recipeData.prepTime;
                        recipe.cookTime = recipeData.cookTime;
                        recipe.servings = recipeData.recipeYield;
                    }
                } catch (e) {
                    console.warn('ResourceImporter: Failed to parse JSON-LD', e);
                }
            });

            // 2. Fallback to Microdata / Standard meta tags if JSON-LD failed or incomplete
            if (!recipe.title) {
                console.log('ResourceImporter: JSON-LD missing, trying meta tags...');
                recipe.title = $('meta[property="og:title"]').attr('content') || $('title').text();
                recipe.description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
                recipe.image = $('meta[property="og:image"]').attr('content') || '';

                // Try to find microdata ingredients
                $('[itemprop="recipeIngredient"], .ingredient, .recipe-ingredient').each((i, el) => {
                    recipe.ingredients.push($(el).text().trim());
                });

                // Try to find microdata instructions
                $('[itemprop="recipeInstructions"], .instruction, .recipe-instruction, .directions li').each((i, el) => {
                    recipe.instructions.push($(el).text().trim());
                });
            }

            // Clean up
            recipe.title = recipe.title.trim();
            recipe.description = recipe.description.trim();
            recipe.ingredients = recipe.ingredients.filter(i => i.length > 0);
            recipe.instructions = recipe.instructions.filter(i => i.length > 0);

            // Validate
            if (!recipe.title) {
                console.warn('ResourceImporter: Could not extract title');
                return null;
            }

            return recipe;

        } catch (error) {
            console.error('ResourceImporter: Error scraping recipe:', error);
            throw new Error('Failed to fetch resource');
        }
    }
}

export const webScraperService = new WebScraperService();
