import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { BookOpen, Sparkles, Plus, Newspaper, Video as VideoIcon, Loader2 } from 'lucide-react';
import { ResourceCard } from '../components/resources/ResourceCard';
import { ArticleCard } from '../components/resources/ArticleCard';
import { VideoCard } from '../components/resources/VideoCard';
import { SearchBar } from '../components/resources/SearchBar';
import { AddResourceModal } from '../components/resources/AddResourceModal';
import {
  getAllResources,
  getPersonalizedRecommendations,
  searchExternalArticles,
  searchExternalVideos,
  fetchFoodistaFeed
} from '../services/resources-service';
import type { PersonalizedRecommendations, Article, Video } from '../types/resource-types';

export function ResourcesPage() {
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'personalized' | 'library'>('personalized');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'articles' | 'videos' | 'both'>('both');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    articles: Article[];
    videos: Video[];
  } | null>(null);
  const [resultTab, setResultTab] = useState<'articles' | 'videos'>('articles');

  const { getToken, isSignedIn } = useAuth();

  // Fetch static resources
  const { data: resources = [], isLoading: isLoadingResources, isError: isResourcesError } = useQuery({
    queryKey: ['resources'],
    queryFn: getAllResources,
  });

  // Fetch personalized recommendations
  const { data: recommendations, isLoading: isLoadingRecommendations, isError: isRecommendationsError } = useQuery<PersonalizedRecommendations>({
    queryKey: ['personalizedRecommendations'],
    queryFn: async () => {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      return getPersonalizedRecommendations(token);
    },
    enabled: isSignedIn && activeTab === 'personalized',
  });

  const allTags = Array.from(new Set(resources.flatMap((r: any) => r.tags as string[]))) as string[];
  const tags: string[] = ['All', ...allTags];

  const filteredResources = resources.filter((resource: any) => {
    const matchesTag = selectedTag === 'All' || (resource.tags as string[]).includes(selectedTag);
    return matchesTag;
  });

  const handleSearch = async (query: string, type: 'articles' | 'videos' | 'both') => {
    setIsSearching(true);
    setSearchQuery(query);
    setSearchType(type);

    try {
      const results: { articles: Article[]; videos: Video[] } = {
        articles: [],
        videos: [],
      };

      if (type === 'articles' || type === 'both') {
        results.articles = await searchExternalArticles(query);
      }

      if (type === 'videos' || type === 'both') {
        results.videos = await searchExternalVideos(query);
      }

      setSearchResults(results);
      // Set initial tab based on what has results
      if (results.articles.length > 0) {
        setResultTab('articles');
      } else if (results.videos.length > 0) {
        setResultTab('videos');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <BookOpen className="h-6 w-6 text-green-600" />
            <h1 className="text-xl font-bold text-gray-900">Food Sustainability Resources</h1>
          </div>
          <p className="text-gray-600">Learn best practices for food management and waste reduction</p>
        </div>
        {isSignedIn && activeTab === 'library' && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            <Plus className="h-5 w-5" />
            Add Resource
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      {isSignedIn && (
        <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
          <button
            onClick={() => setActiveTab('personalized')}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'personalized'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Recommended For You
            </div>
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${activeTab === 'library'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
          >
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Resource Library
            </div>
          </button>
        </div>
      )}

      {/* Personalized Recommendations Tab */}
      {activeTab === 'personalized' && isSignedIn && (
        <div className="space-y-6">
          {isLoadingRecommendations ? (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading personalized recommendations...</h3>
              <p className="text-gray-600">Analyzing your profile and preferences</p>
            </div>
          ) : isRecommendationsError ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-yellow-900 mb-2">Unable to load recommendations</h3>
              <p className="text-yellow-700 mb-4">We couldn't fetch personalized content at this time. Please try again later or browse our resource library.</p>
              <button
                onClick={() => setActiveTab('library')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Browse Resource Library
              </button>
            </div>
          ) : recommendations ? (
            <>
              {/* User Profile Summary */}
              {recommendations.userProfile && (
                <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-gray-900">Your Personalized Feed</h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Based on your {recommendations.userProfile.wasteReductionPercentage}% waste reduction rate
                    {recommendations.userProfile.budgetRange && ` and ${recommendations.userProfile.budgetRange} BDT monthly budget`}.
                    {recommendations.userProfile.primaryConcerns.length > 0 && (
                      <> Focusing on: <span className="font-medium">{recommendations.userProfile.primaryConcerns.join(', ')}</span>.</>
                    )}
                  </p>
                </div>
              )}

              {/* Articles Section */}
              {recommendations.articles && recommendations.articles.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Newspaper className="h-5 w-5 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Recommended Articles</h2>
                    <span className="text-sm text-gray-500">({recommendations.articles.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.articles.map((article) => (
                      <ArticleCard key={article.id} article={article} />
                    ))}
                  </div>
                </div>
              )}

              {/* Videos Section */}
              {recommendations.videos && recommendations.videos.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <VideoIcon className="h-5 w-5 text-gray-700" />
                    <h2 className="text-lg font-semibold text-gray-900">Recommended Videos</h2>
                    <span className="text-sm text-gray-500">({recommendations.videos.length})</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {recommendations.videos.map((video) => (
                      <VideoCard key={video.id} video={video} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {(!recommendations.articles || recommendations.articles.length === 0) &&
                (!recommendations.videos || recommendations.videos.length === 0) && (
                  <div className="text-center py-12">
                    <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recommendations available</h3>
                    <p className="text-gray-600 mb-4">We're still learning about your preferences. Check back soon!</p>
                    <button
                      onClick={() => setActiveTab('library')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Browse Resource Library
                    </button>
                  </div>
                )}
            </>
          ) : null}
        </div>
      )}

      {/* Resource Library Tab */}
      {activeTab === 'library' && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Search External Content</h3>
            <SearchBar
              onSearch={handleSearch}
              onClear={handleClearSearch}
              isSearching={isSearching}
            />
          </div>

          {/* Search Results */}
          {searchResults && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  Search Results for "{searchQuery}"
                </h3>
                <button
                  onClick={handleClearSearch}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Clear Results
                </button>
              </div>

              {/* Result Tabs */}
              {searchType === 'both' && (
                <div className="flex gap-2 mb-4 border-b border-gray-200">
                  <button
                    onClick={() => setResultTab('articles')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${resultTab === 'articles'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Articles ({searchResults.articles.length})
                  </button>
                  <button
                    onClick={() => setResultTab('videos')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${resultTab === 'videos'
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    Videos ({searchResults.videos.length})
                  </button>
                </div>
              )}

              {/* Articles Results */}
              {(searchType === 'articles' || (searchType === 'both' && resultTab === 'articles')) && (
                <div>
                  {searchResults.articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.articles.map((article) => (
                        <ArticleCard key={article.id} article={article} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No articles found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Videos Results */}
              {(searchType === 'videos' || (searchType === 'both' && resultTab === 'videos')) && (
                <div>
                  {searchResults.videos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchResults.videos.map((video) => (
                        <VideoCard key={video.id} video={video} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <VideoIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No videos found for "{searchQuery}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Static Resources */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Curated Resources</h3>

            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag: string) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setSelectedTag(tag as string)}
                  className={
                    `px-3 py-1 rounded-full border text-sm font-medium transition-colors ` +
                    (selectedTag === tag
                      ? 'bg-green-600 text-white border-green-600 shadow'
                      : 'bg-white text-gray-800 border-gray-300 hover:bg-green-50')
                  }
                >
                  {tag as string}
                </button>
              ))}
            </div>

            <div className="mb-4 pb-4 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                {isLoadingResources ? (
                  <>Loading resources...</>
                ) : isResourcesError ? (
                  <>Failed to load resources</>
                ) : (
                  <>Showing <span className="font-semibold text-gray-900">{filteredResources.length}</span> resources</>
                )}
              </p>
            </div>

            {isLoadingResources ? (
              <div className="text-center py-12">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading...</h3>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredResources.map((resource: any) => (
                    <ResourceCard key={resource.id} resource={resource} />
                  ))}
                </div>

                {filteredResources.length === 0 && (
                  <div className="text-center py-12">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No resources found</h3>
                    <p className="text-gray-600">Try adjusting your filters or search term</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Add Resource Modal */}
      <AddResourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
