import { useAuth } from '@clerk/clerk-react';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  Calendar,
  DollarSign,
  Leaf,
  Lightbulb,
  MessageSquare,
  Target,
  TrendingUp,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import AIResponseDisplay from '../components/AIResponseDisplay';

interface DashboardInsight {
  consumption?: {
    patterns?: {
      totalItems?: number;
      categoryBreakdown?: Record<string, number>;
      timePatterns?: Record<string, number>;
      consistencyScore?: number;
      favoriteCategories?: string[];
    };
    aiInsights?: string;
  };
  impact?: {
    impact?: {
      environmental?: {
        co2Saved?: number;
        waterSaved?: number;
        wastePrevented?: number;
      };
      financial?: {
        moneySaved?: number;
        avgSavingsPerDay?: number;
      };
      achievements?: string[];
      recommendations?: string[];
    };
  };
  waste?: {
    wasteRiskItems?: Array<{
      id: string;
      name: string;
      quantity: number;
      expiryDate: Date | null;
      daysUntilExpiry: number;
      wasteRisk: 'High' | 'Medium' | 'Low';
      estimatedValue: number;
      suggestions: string[];
    }>;
    totalPotentialWasteValue?: number;
    estimatedCO2Impact?: number;
    summary?: {
      highRisk?: number;
      mediumRisk?: number;
      totalAtRisk?: number;
    };
  };
}

interface AIResponse {
  success: boolean;
  response?: string;
  data?: Record<string, unknown>;
  insights?: string;
  toolsUsed?: number;
}

const IntelligentDashboard: React.FC = () => {
  const { getToken } = useAuth();
  const [insights, setInsights] = useState<DashboardInsight>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [chatQuery, setChatQuery] = useState('');
  const [chatResponse, setChatResponse] = useState<AIResponse | null>(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [quickActionResponse, setQuickActionResponse] =
    useState<AIResponse | null>(null);
  const [nutritionInsights, setNutritionInsights] = useState<AIResponse | null>(
    null,
  );
  const [loadingInsight, setLoadingInsight] = useState<string | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  const fetchDashboardInsights = useCallback(async () => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/intelligence/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInsights(data.data.insights || {});
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  }, [getToken, API_URL]);

  useEffect(() => {
    fetchDashboardInsights();
  }, [fetchDashboardInsights]);

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    setChatLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/intelligence/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ query: chatQuery }),
      });

      if (response.ok) {
        const data = await response.json();
        setChatResponse(data.data);
        setChatQuery('');
      }
    } catch (error) {
      console.error('Error in AI chat:', error);
      setChatResponse({
        success: false,
        response: 'Sorry, I encountered an error. Please try again.',
      });
    } finally {
      setChatLoading(false);
    }
  };

  const fetchSpecificInsight = async (
    endpoint: string,
    setter?: (data: Record<string, unknown>) => void,
  ) => {
    setLoadingInsight(endpoint);
    try {
      const token = await getToken();
      const response = await fetch(`${API_URL}/intelligence/${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Create an AI response object for display
        const aiResponse: AIResponse = {
          success: true,
          response:
            data.data.response ||
            data.data.insights ||
            data.message ||
            'Analysis completed successfully.',
          toolsUsed: data.data.toolsUsed || 1,
          data: data.data,
        };

        // Handle specific endpoints
        if (endpoint === 'nutrition-analysis') {
          setNutritionInsights(aiResponse);
        } else {
          setQuickActionResponse(aiResponse);
        }

        // Update insights state for data display
        if (endpoint === 'consumption-analysis') {
          setInsights(prev => ({ ...prev, consumption: data.data }));
        } else if (endpoint === 'waste-prediction') {
          setInsights(prev => ({ ...prev, waste: data.data }));
        } else if (endpoint === 'impact-analytics') {
          setInsights(prev => ({ ...prev, impact: data.data }));
        }

        if (setter) setter(data.data);
        return data.data;
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }
    } catch (error) {
      console.error(`Error fetching ${endpoint}:`, error);
      const errorResponse: AIResponse = {
        success: false,
        response: `Sorry, I encountered an error while fetching ${endpoint.replace(
          '-',
          ' ',
        )}. Please try again.`,
      };

      if (endpoint === 'nutrition-analysis') {
        setNutritionInsights(errorResponse);
      } else {
        setQuickActionResponse(errorResponse);
      }
    } finally {
      setLoadingInsight(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white p-6 rounded-lg shadow">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-20 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  AI Intelligence Dashboard
                </h1>
                <p className="text-gray-600">
                  Personalized insights and recommendations
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'consumption', label: 'Consumption', icon: TrendingUp },
                { id: 'waste', label: 'Waste Prevention', icon: AlertTriangle },
                { id: 'nutrition', label: 'Nutrition', icon: Target },
                { id: 'impact', label: 'Impact', icon: Leaf },
                { id: 'chat', label: 'AI Assistant', icon: MessageSquare },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Clear responses when switching tabs for cleaner experience
                    if (tab.id !== 'overview') setQuickActionResponse(null);
                    if (tab.id !== 'nutrition') setNutritionInsights(null);
                  }}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="font-medium text-gray-900">
                    Consumption Score
                  </h3>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {insights.consumption?.patterns?.consistencyScore || 0}%
                </div>
                <p className="text-sm text-gray-600">Tracking consistency</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600" />
                  <h3 className="font-medium text-gray-900">Items at Risk</h3>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  {insights.waste?.summary?.totalAtRisk || 0}
                </div>
                <p className="text-sm text-gray-600">Expiring soon</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-2">
                  <Leaf className="w-5 h-5 text-green-600" />
                  <h3 className="font-medium text-gray-900">CO₂ Saved</h3>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {insights.impact?.impact?.environmental?.co2Saved || 0}kg
                </div>
                <p className="text-sm text-gray-600">This month</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-purple-600" />
                  <h3 className="font-medium text-gray-900">Money Saved</h3>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  ${insights.impact?.impact?.financial?.moneySaved || 0}
                </div>
                <p className="text-sm text-gray-600">This month</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Quick Actions
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      title: 'Consumption Analysis',
                      description: 'Analyze your eating patterns',
                      icon: TrendingUp,
                      action: () =>
                        fetchSpecificInsight('consumption-analysis'),
                    },
                    {
                      title: 'Waste Prediction',
                      description: 'Predict upcoming waste',
                      icon: AlertTriangle,
                      action: () => fetchSpecificInsight('waste-prediction'),
                    },
                    {
                      title: 'Meal Plan Optimization',
                      description: 'Get AI-optimized meal plans',
                      icon: Calendar,
                      action: () => setActiveTab('nutrition'),
                    },
                    {
                      title: 'Nutrition Analysis',
                      description: 'Check nutrient gaps',
                      icon: Target,
                      action: () => fetchSpecificInsight('nutrition-analysis'),
                    },
                    {
                      title: 'Impact Analytics',
                      description: 'See your environmental impact',
                      icon: Leaf,
                      action: () => fetchSpecificInsight('impact-analytics'),
                    },
                    {
                      title: 'Get Recommendations',
                      description: 'Personalized suggestions',
                      icon: Lightbulb,
                      action: () => fetchSpecificInsight('recommendations'),
                    },
                  ].map((action, index) => (
                    <button
                      key={index}
                      onClick={action.action}
                      disabled={loadingInsight !== null}
                      className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {loadingInsight &&
                        ((action.title === 'Consumption Analysis' &&
                          loadingInsight === 'consumption-analysis') ||
                          (action.title === 'Waste Prediction' &&
                            loadingInsight === 'waste-prediction') ||
                          (action.title === 'Nutrition Analysis' &&
                            loadingInsight === 'nutrition-analysis') ||
                          (action.title === 'Impact Analytics' &&
                            loadingInsight === 'impact-analytics') ||
                          (action.title === 'Get Recommendations' &&
                            loadingInsight === 'recommendations')) ? (
                          <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <action.icon className="w-5 h-5 text-purple-600" />
                        )}
                        <h3 className="font-medium text-gray-900">
                          {action.title}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {action.description}
                      </p>
                    </button>
                  ))}
                </div>

                {/* Display Quick Action Response */}
                {quickActionResponse && (
                  <div className="mt-6">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="font-medium text-gray-900">
                        Analysis Results
                      </h3>
                      <button
                        onClick={() => setQuickActionResponse(null)}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        Clear Results
                      </button>
                    </div>
                    <AIResponseDisplay
                      response={quickActionResponse}
                      className=""
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Chat Tab */}
        {activeTab === 'chat' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  AI Assistant
                </h2>
                <p className="text-gray-600">
                  Ask me anything about your food management, nutrition, or
                  waste reduction!
                </p>
              </div>

              <div className="p-6">
                <form onSubmit={handleChatSubmit} className="space-y-4">
                  <div className="flex gap-4">
                    <input
                      type="text"
                      value={chatQuery}
                      onChange={e => setChatQuery(e.target.value)}
                      placeholder="Ask me about your consumption patterns, waste prediction, meal planning..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      disabled={chatLoading}
                    />
                    <button
                      type="submit"
                      disabled={chatLoading || !chatQuery.trim()}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {chatLoading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Thinking...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4" />
                          Ask AI
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {chatResponse && (
                  <AIResponseDisplay response={chatResponse} className="mt-6" />
                )}

                {/* Example Questions */}
                <div className="mt-6 border-t border-gray-200 pt-6">
                  <h3 className="font-medium text-gray-900 mb-3">
                    Try asking:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      'What are my consumption patterns this month?',
                      'Which items might go to waste soon?',
                      'Create an optimized meal plan for this week',
                      'What nutrient gaps do I have?',
                      'Show me my environmental impact',
                      'Find local food sharing opportunities',
                    ].map((question, index) => (
                      <button
                        key={index}
                        onClick={() => setChatQuery(question)}
                        className="text-left p-3 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
                      >
                        "{question}"
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Consumption Tab */}
        {activeTab === 'consumption' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Consumption Analysis
            </h2>
            {insights.consumption?.aiInsights && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">AI Insights</h3>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <MarkdownRenderer
                    content={insights.consumption.aiInsights}
                    className="space-y-3 text-gray-700"
                  />
                </div>
              </div>
            )}
            {insights.consumption?.patterns && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Category Breakdown
                  </h4>
                  {Object.entries(
                    insights.consumption.patterns.categoryBreakdown || {},
                  ).map(([category, count]) => (
                    <div
                      key={category}
                      className="flex justify-between items-center py-1"
                    >
                      <span className="text-gray-600">{category}</span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">
                    Time Patterns
                  </h4>
                  {Object.entries(
                    insights.consumption.patterns.timePatterns || {},
                  ).map(([time, count]) => (
                    <div
                      key={time}
                      className="flex justify-between items-center py-1"
                    >
                      <span className="text-gray-600">{time}</span>
                      <span className="font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {!insights.consumption && (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No consumption analysis available yet.
                </p>
                <button
                  onClick={() => fetchSpecificInsight('consumption-analysis')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Generate Consumption Report
                </button>
              </div>
            )}
          </div>
        )}

        {/* Waste Prevention Tab */}
        {activeTab === 'waste' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Waste Prevention
            </h2>
            {insights.waste?.wasteRiskItems && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-900">High Risk</h4>
                    <div className="text-2xl font-bold text-red-600">
                      {insights.waste.summary?.highRisk || 0}
                    </div>
                    <p className="text-sm text-red-600">Items expiring soon</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-900">Medium Risk</h4>
                    <div className="text-2xl font-bold text-orange-600">
                      {insights.waste.summary?.mediumRisk || 0}
                    </div>
                    <p className="text-sm text-orange-600">Items to monitor</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">
                      Potential Savings
                    </h4>
                    <div className="text-2xl font-bold text-green-600">
                      ${insights.waste.totalPotentialWasteValue || 0}
                    </div>
                    <p className="text-sm text-green-600">If waste prevented</p>
                  </div>
                </div>
                {insights.waste.wasteRiskItems.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Items at Risk
                    </h4>
                    <div className="space-y-2">
                      {insights.waste.wasteRiskItems
                        .slice(0, 5)
                        .map((item, index: number) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div>
                              <span className="font-medium text-gray-900">
                                {item.name}
                              </span>
                              <div className="text-sm text-gray-600">
                                {item.daysUntilExpiry} days until expiry •{' '}
                                {item.quantity} items
                              </div>
                            </div>
                            <div
                              className={`px-2 py-1 rounded text-xs font-medium ${
                                item.wasteRisk === 'High'
                                  ? 'bg-red-100 text-red-800'
                                  : item.wasteRisk === 'Medium'
                                  ? 'bg-orange-100 text-orange-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {item.wasteRisk} Risk
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!insights.waste && (
              <div className="text-center py-12">
                <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No waste analysis available yet.
                </p>
                <button
                  onClick={() => fetchSpecificInsight('waste-prediction')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Generate Waste Prediction
                </button>
              </div>
            )}
          </div>
        )}

        {/* Impact Tab */}
        {activeTab === 'impact' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Environmental & Financial Impact
            </h2>
            {insights.impact?.impact && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900">CO₂ Saved</h4>
                    <div className="text-2xl font-bold text-green-600">
                      {insights.impact.impact.environmental?.co2Saved || 0}kg
                    </div>
                    <p className="text-sm text-green-600">
                      Carbon footprint reduced
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900">Water Saved</h4>
                    <div className="text-2xl font-bold text-blue-600">
                      {insights.impact.impact.environmental?.waterSaved || 0}L
                    </div>
                    <p className="text-sm text-blue-600">Water conservation</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-900">Money Saved</h4>
                    <div className="text-2xl font-bold text-purple-600">
                      ${insights.impact.impact.financial?.moneySaved || 0}
                    </div>
                    <p className="text-sm text-purple-600">Financial benefit</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <h4 className="font-medium text-orange-900">
                      Waste Prevented
                    </h4>
                    <div className="text-2xl font-bold text-orange-600">
                      {insights.impact.impact.environmental?.wastePrevented ||
                        0}
                      kg
                    </div>
                    <p className="text-sm text-orange-600">
                      Food waste avoided
                    </p>
                  </div>
                </div>
                {insights.impact.impact.achievements?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Achievements
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {insights.impact.impact.achievements.map(
                        (achievement: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium"
                          >
                            🏆 {achievement}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
                {insights.impact.impact.recommendations?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Recommendations
                    </h4>
                    <div className="space-y-2">
                      {insights.impact.impact.recommendations.map(
                        (rec: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg"
                          >
                            <Lightbulb className="w-4 h-4 text-blue-600 mt-1 shrink-0" />
                            <span className="text-gray-700">{rec}</span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            {!insights.impact && (
              <div className="text-center py-12">
                <Leaf className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">
                  No impact analysis available yet.
                </p>
                <button
                  onClick={() => fetchSpecificInsight('impact-analytics')}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Generate Impact Report
                </button>
              </div>
            )}
          </div>
        )}

        {/* Nutrition Tab */}
        {activeTab === 'nutrition' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Nutrition Analysis
            </h2>

            {/* Display AI Insights if available */}
            {nutritionInsights && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">
                  AI Nutrition Analysis
                </h3>
                <AIResponseDisplay response={nutritionInsights} className="" />
              </div>
            )}

            {/* Generate button or loading state */}
            {!nutritionInsights && (
              <div className="text-center py-12">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nutrition Analysis
                </h3>
                <p className="text-gray-600 mb-4">
                  Get detailed nutrition insights and recommendations based on
                  your consumption patterns.
                </p>
                <button
                  onClick={() => fetchSpecificInsight('nutrition-analysis')}
                  disabled={loadingInsight === 'nutrition-analysis'}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {loadingInsight === 'nutrition-analysis' ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing Nutrition...
                    </>
                  ) : (
                    <>
                      <Target className="w-4 h-4" />
                      Generate Nutrition Report
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Clear Analysis Button */}
            {nutritionInsights && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setNutritionInsights(null)}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear Analysis
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default IntelligentDashboard;
