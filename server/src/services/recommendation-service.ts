import { userAnalyticsService } from './user-analytics-service';
import { newsAPIService, Article } from './news-api-service';
import { youtubeAPIService, Video } from './youtube-api-service';
import { foodistaService } from './foodista-service';

interface PersonalizedRecommendations {
    articles: Article[];
    videos: Video[];
    userProfile: {
        wasteReductionPercentage: number;
        spendingTier: string;
        primaryConcerns: string[];
        budgetRange: number | null;
    };
}

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    expiresAt: number;
}

export class RecommendationService {
    private cache: Map<string, CacheEntry<any>> = new Map();
    private readonly CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

    /**
     * Get personalized recommendations for a user
     */
    async getPersonalizedRecommendations(userId: string): Promise<PersonalizedRecommendations> {
        // Check cache first
        const cacheKey = `recommendations:${userId}`;
        const cached = this.getFromCache<PersonalizedRecommendations>(cacheKey);
        if (cached) {
            console.log('Returning cached recommendations for user:', userId);
            return cached;
        }

        try {
            // Get user analytics
            const analytics = await userAnalyticsService.getUserAnalytics(userId);

            // Generate keywords based on user profile
            const keywords = await userAnalyticsService.generateRecommendationKeywords(userId);

            // Fetch articles and videos in parallel
            const [newsArticles, foodistaArticles, videos] = await Promise.all([
                this.fetchArticles(keywords, analytics.primaryConcerns),
                this.fetchFoodistaArticles(keywords),
                this.fetchVideos(keywords, analytics.primaryConcerns),
            ]);

            // Combine and score articles
            const allArticles = [...newsArticles, ...foodistaArticles];
            const scoredArticles = this.scoreAndSortArticles(allArticles, analytics.primaryConcerns);
            const scoredVideos = this.scoreAndSortVideos(videos, analytics.primaryConcerns);

            const recommendations: PersonalizedRecommendations = {
                articles: scoredArticles.slice(0, 12), // Top 12 articles
                videos: scoredVideos.slice(0, 8), // Top 8 videos
                userProfile: {
                    wasteReductionPercentage: analytics.wasteReductionPercentage,
                    spendingTier: analytics.spendingTier,
                    primaryConcerns: analytics.primaryConcerns,
                    budgetRange: analytics.budgetRange,
                },
            };

            // Cache the results
            this.setCache(cacheKey, recommendations);

            return recommendations;
        } catch (error) {
            console.error('Error generating personalized recommendations:', error);

            // Return fallback recommendations
            return this.getFallbackRecommendations();
        }
    }

    /**
     * Fetch articles based on keywords and concerns
     */
    private async fetchArticles(
        keywords: { primary: string[]; secondary: string[]; dietary: string[]; categorySpecific: string[]; consumptionBased: string[] },
        primaryConcerns: string[]
    ): Promise<Article[]> {
        const allArticles: Article[] = [];

        try {
            // 1. Consumption-based (TOP PRIORITY - Fetch 8)
            // These are what the user actually eats, so they are most relevant
            if (keywords.consumptionBased.length > 0) {
                // Shuffle keywords to get variety if there are many
                const shuffled = [...keywords.consumptionBased].sort(() => 0.5 - Math.random());
                const consumptionArticles = await newsAPIService.searchArticles(shuffled.slice(0, 5), 8);
                allArticles.push(...consumptionArticles);
            }

            // 2. Primary Concerns (Fetching 4)
            if (keywords.primary.length > 0) {
                const primaryArticles = await newsAPIService.searchArticles(keywords.primary, 4);
                allArticles.push(...primaryArticles);
            }

            // 3. Dietary Preferences (Fetching 2)
            if (keywords.dietary.length > 0) {
                const dietaryArticles = await newsAPIService.searchArticles(keywords.dietary, 2);
                allArticles.push(...dietaryArticles);
            }

            // 4. Regional / Category Specific (Fetching 3)
            if (keywords.categorySpecific.length > 0) {
                // Prioritize regional keywords if present
                const regionalAmount = 3;
                const regionalArticles = await newsAPIService.searchArticles(keywords.categorySpecific.slice(0, 3), regionalAmount);
                allArticles.push(...regionalArticles);
            }

            // 4. Fill with General/Secondary if needed
            if (allArticles.length < 10 && keywords.secondary.length > 0) {
                const generalArticles = await newsAPIService.searchArticles(keywords.secondary, 4);
                allArticles.push(...generalArticles);
            }
        } catch (error) {
            console.error('Error fetching articles:', error);
        }

        // Remove duplicates within the fetched list
        return this.removeDuplicateArticles(allArticles);
    }

    /**
     * Fetch videos based on keywords and concerns
     */
    private async fetchVideos(
        keywords: { primary: string[]; secondary: string[]; dietary: string[]; categorySpecific: string[]; consumptionBased: string[] },
        primaryConcerns: string[]
    ): Promise<Video[]> {
        const allVideos: Video[] = [];

        try {
            // 1. Consumption-based (TOP PRIORITY - Fetch 6)
            if (keywords.consumptionBased.length > 0) {
                // Shuffle keywords to get variety
                const shuffled = [...keywords.consumptionBased].sort(() => 0.5 - Math.random());
                const consumptionVideos = await youtubeAPIService.searchVideos(shuffled.slice(0, 5), 6);
                allVideos.push(...consumptionVideos);
            }

            // 2. Primary Concerns (Fetch 3)
            if (keywords.primary.length > 0) {
                const primaryVideos = await youtubeAPIService.searchVideos(keywords.primary, 3);
                allVideos.push(...primaryVideos);
            }

            // 3. Dietary Preferences (Fetch 2)
            if (keywords.dietary.length > 0) {
                const dietaryVideos = await youtubeAPIService.searchVideos(keywords.dietary, 2);
                allVideos.push(...dietaryVideos);
            }

            // 4. Category Specific / Regional (Fetch 3)
            if (keywords.categorySpecific.length > 0) {
                const categoryVideos = await youtubeAPIService.searchVideos(keywords.categorySpecific.slice(0, 2), 3);
                allVideos.push(...categoryVideos);
            }

            // 5. Fill with General if needed
            if (allVideos.length < 8 && keywords.secondary.length > 0) {
                const generalVideos = await youtubeAPIService.searchVideos(keywords.secondary, 3);
                allVideos.push(...generalVideos);
            }
        } catch (error) {
            console.error('Error fetching videos:', error);
        }

        // Remove duplicates
        return this.removeDuplicateVideos(allVideos);
    }

    /**
     * Fetch and transform Foodista posts, scoring against keywords
     */
    private async fetchFoodistaArticles(
        keywords: { primary: string[]; secondary: string[]; dietary: string[]; categorySpecific: string[]; consumptionBased: string[] }
    ): Promise<Article[]> {
        try {
            const posts = await foodistaService.getLatestPosts();

            return posts.map((post, index): Article => {
                let reason = 'Foodista Blog';
                let score = 0;

                // Check if post matches any consumption keywords
                const content = `${post.title} ${post.description}`.toLowerCase();

                for (const keyword of keywords.consumptionBased) {
                    if (content.includes(keyword.toLowerCase())) {
                        reason = 'Based on your consumption';
                        score += 10;
                        break;
                    }
                    // Partial match (individual words)
                    const words = keyword.toLowerCase().split(' ');
                    if (words.some(w => w.length > 3 && content.includes(w))) {
                        reason = 'Related to your diet';
                        score += 3;
                    }
                }

                // If no consumption match, check primary keywords (now includes regional)
                if (score === 0) {
                    for (const keyword of keywords.primary) {
                        if (content.includes(keyword.toLowerCase())) {
                            // Special check for regional
                            if (keyword.includes('bangla') || keyword.includes('bengali')) {
                                reason = 'Regional Specialty';
                                score += 8;
                            } else {
                                reason = 'Recommended for you';
                                score += 5;
                            }
                            break;
                        }
                    }
                }

                // Check category specific (where regional keywords live)
                if (score === 0) {
                    for (const keyword of keywords.categorySpecific) {
                        if (content.includes(keyword.toLowerCase())) {
                            reason = 'Local Cuisine';
                            score += 6;
                            break;
                        }
                    }
                }

                return {
                    id: `foodista-${index}-${Date.now()}`,
                    title: post.title,
                    description: post.description,
                    url: post.link,
                    imageUrl: post.image || null, // Ensure string | null
                    source: 'Foodista',
                    publishedAt: post.pubDate,
                    recommendationReason: reason
                };
            });
        } catch (e) {
            console.error('Error fetching Foodista articles for recommendations:', e);
            return [];
        }
    }

    /**
     * Score and sort articles based on relevance to user's concerns
     */
    private scoreAndSortArticles(articles: Article[], primaryConcerns: string[]): Article[] {
        return articles
            .map(article => ({
                article,
                score: this.calculateArticleScore(article, primaryConcerns),
            }))
            .sort((a, b) => b.score - a.score)
            .map(item => item.article);
    }

    /**
     * Score and sort videos based on relevance to user's concerns
     */
    private scoreAndSortVideos(videos: Video[], primaryConcerns: string[]): Video[] {
        return videos
            .map(video => ({
                video,
                score: this.calculateVideoScore(video, primaryConcerns),
            }))
            .sort((a, b) => b.score - a.score)
            .map(item => item.video);
    }

    /**
     * Calculate relevance score for an article
     */
    private calculateArticleScore(article: Article, primaryConcerns: string[]): number {
        let score = 0;
        const content = `${article.title} ${article.description}`.toLowerCase();

        // Score based on primary concerns
        primaryConcerns.forEach((concern, index) => {
            const weight = 10 - index * 2; // First concern gets highest weight

            if (concern === 'budget' && (content.includes('budget') || content.includes('cheap') || content.includes('affordable'))) {
                score += weight;
            }
            if (concern === 'waste-reduction' && (content.includes('waste') || content.includes('leftover') || content.includes('zero waste'))) {
                score += weight;
            }
            if (concern === 'nutrition' && (content.includes('nutrition') || content.includes('healthy') || content.includes('diet'))) {
                score += weight;
            }
        });

        // Bonus for recent articles
        const publishedDate = new Date(article.publishedAt);
        const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePublished < 30) {
            score += 5;
        } else if (daysSincePublished < 90) {
            score += 2;
        }

        return score;
    }

    /**
     * Calculate relevance score for a video
     */
    private calculateVideoScore(video: Video, primaryConcerns: string[]): number {
        let score = 0;
        const content = `${video.title} ${video.description}`.toLowerCase();

        // Score based on primary concerns
        primaryConcerns.forEach((concern, index) => {
            const weight = 10 - index * 2;

            if (concern === 'budget' && (content.includes('budget') || content.includes('cheap') || content.includes('affordable'))) {
                score += weight;
            }
            if (concern === 'waste-reduction' && (content.includes('waste') || content.includes('leftover') || content.includes('zero waste'))) {
                score += weight;
            }
            if (concern === 'nutrition' && (content.includes('nutrition') || content.includes('healthy') || content.includes('diet'))) {
                score += weight;
            }
        });

        // Bonus for popular videos (view count)
        if (video.viewCount > 100000) {
            score += 5;
        } else if (video.viewCount > 10000) {
            score += 3;
        } else if (video.viewCount > 1000) {
            score += 1;
        }

        // Bonus for recent videos
        const publishedDate = new Date(video.publishedAt);
        const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSincePublished < 30) {
            score += 3;
        } else if (daysSincePublished < 90) {
            score += 1;
        }

        return score;
    }

    /**
     * Remove duplicate articles based on URL
     */
    private removeDuplicateArticles(articles: Article[]): Article[] {
        const seen = new Set<string>();
        return articles.filter(article => {
            if (seen.has(article.url)) {
                return false;
            }
            seen.add(article.url);
            return true;
        });
    }

    /**
     * Remove duplicate videos based on videoId
     */
    private removeDuplicateVideos(videos: Video[]): Video[] {
        const seen = new Set<string>();
        return videos.filter(video => {
            if (seen.has(video.videoId)) {
                return false;
            }
            seen.add(video.videoId);
            return true;
        });
    }

    /**
     * Get fallback recommendations when personalization fails
     */
    private async getFallbackRecommendations(): Promise<PersonalizedRecommendations> {
        try {
            const [articles, videos] = await Promise.all([
                newsAPIService.getArticlesByTopic('general', 8),
                youtubeAPIService.getVideosByTopic('general', 6),
            ]);

            return {
                articles,
                videos,
                userProfile: {
                    wasteReductionPercentage: 100,
                    spendingTier: 'moderate',
                    primaryConcerns: ['nutrition'],
                    budgetRange: null,
                },
            };
        } catch (error) {
            console.error('Error fetching fallback recommendations:', error);
            return {
                articles: [],
                videos: [],
                userProfile: {
                    wasteReductionPercentage: 100,
                    spendingTier: 'moderate',
                    primaryConcerns: ['nutrition'],
                    budgetRange: null,
                },
            };
        }
    }

    /**
     * Get data from cache if not expired
     */
    private getFromCache<T>(key: string): T | null {
        const entry = this.cache.get(key);
        if (!entry) {
            return null;
        }

        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set data in cache with TTL
     */
    private setCache<T>(key: string, data: T): void {
        const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            expiresAt: Date.now() + this.CACHE_TTL,
        };
        this.cache.set(key, entry);
    }

    /**
     * Clear cache for a specific user
     */
    clearUserCache(userId: string): void {
        const cacheKey = `recommendations:${userId}`;
        this.cache.delete(cacheKey);
    }

    /**
     * Clear all cache
     */
    clearAllCache(): void {
        this.cache.clear();
    }
}

export const recommendationService = new RecommendationService();
