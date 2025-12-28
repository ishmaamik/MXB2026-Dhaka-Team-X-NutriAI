import axios from 'axios';
import * as cheerio from 'cheerio';

async function inspectFoodista() {
    const query = 'chicken';
    const strategies = [
        `https://www.foodista.com/search/apachesolr_search/${query}`,
        `https://www.foodista.com/search/node/${query}`,
        `https://www.foodista.com/?q=search/node/${query}`,
        `https://www.foodista.com/recipes/${query}`,
        `https://www.foodista.com/search?q=${query}`
    ];

    for (const url of strategies) {
        try {
            console.log(`\nTesting ${url}...`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 5000 // 5s timeout
            });

            console.log(`✅ Success! Status: ${response.status}`);
            const $ = cheerio.load(response.data);
            console.log('Title:', $('title').text());

            // Check for results
            const items = $('.views-row, .search-result, .node-recipe').length;
            console.log('Result items found:', items);

            if (items > 0) {
                console.log('🎉 FOUND WORKING SEARCH URL PATTERN!');

                // Log structure of first result
                const firstResult = $('.views-row, .search-result, .node-recipe').first();
                console.log('\n--- First Result Structure ---');
                console.log(firstResult.html()?.substring(0, 500));
                break;
            }

        } catch (error: any) {
            console.log(`❌ Failed: ${error.message}`);
        }
    }
}

inspectFoodista();
