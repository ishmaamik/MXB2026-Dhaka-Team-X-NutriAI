import axios from 'axios';

const urls = [
    'https://www.foodista.com/rss',
    'https://www.foodista.com/rss.xml',
    'https://www.foodista.com/feed',
    'https://www.foodista.com/feeds/all',
    'https://www.foodista.com/?q=rss.xml',
    'https://www.foodista.com/blog/feed',
    'https://www.foodista.com/recipes/feed'
];

async function checkUrls() {
    console.log('Testing RSS URLs for Foodista...');

    for (const url of urls) {
        try {
            console.log(`Testing: ${url}`);
            const response = await axios.get(url, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                },
                timeout: 5000
            });

            if (response.status === 200) {
                console.log(`✅ SUCCESS: ${url}`);
                console.log('Content Type:', response.headers['content-type']);
                console.log('Preview:', response.data.substring(0, 200));
                return; // Found one!
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.log(`❌ FAILED: ${url} - ${error.response?.status || error.message}`);
            } else {
                console.log(`❌ FAILED: ${url} - ${error}`);
            }
        }
    }
    console.log('All URLs failed.');
}

checkUrls();
