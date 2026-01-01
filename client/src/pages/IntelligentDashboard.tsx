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
  Plus,
  Sparkles,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import MarkdownRenderer from '../components/MarkdownRenderer';
import AIResponseDisplay from '../components/AIResponseDisplay';
import DirectConsumption from '../components/DirectConsumption';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
} from 'recharts';

interface DashboardInsight {
  consumption?: {
    patterns?: {
      totalItems?: number;
      categoryBreakdown?: Record<string, number>;
      timePatterns?: Record<string, number>;
      consistencyScore?: number;
      favoriteCategories?: string[];
      dailyNutrition?: Array<{
        date: string;
        calories: number;
        protein: number;
        carbohydrates: number;
        fat: number;
        fiber: number;
        sugar: number;
        sodium: number;
      }>;
      dailyCost?: Array<{
        date: string;
        cost: number;
      }>;
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
  error?: string;
}

const IntelligentDashboard: React.FC = () => {
  const { getToken } = useAuth();
  const [insights, setInsights] = useState<DashboardInsight>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
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
        // Check if the AI service itself reported an error even if the API call was 200 OK
        const aiServiceSuccess = data.data && data.data.success !== false;

        // Create an AI response object for display
        const aiResponse: AIResponse = {
          success: aiServiceSuccess,
          response: aiServiceSuccess
            ? (data.data.response ||
              data.data.aiInsights ||
              data.data.content ||
              data.data.insights ||
              (typeof data.data === 'string' ? data.data : null) ||
              (data.data && typeof data.data === 'object' ? JSON.stringify(data.data, null, 2) : null) ||
              data.message ||
              'Analysis completed successfully.')
            : null,
          error: !aiServiceSuccess ? (data.data.error || data.data.message || 'AI service error') : undefined,
          insights: data.data.insights || data.message || 'AI Analysis',
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
      <div className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-tr from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-200">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                  Intelligence Dashboard
                </h1>
                <p className="text-sm font-medium text-gray-500">
                  AI-powered inventory & nutrition insights
                </p>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
            <nav className="flex space-x-1 p-1 bg-gray-100/50 rounded-xl w-fit">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'direct-consumption', label: 'Direct Consume', icon: Plus },
                { id: 'consumption', label: 'Consumption', icon: TrendingUp },
                { id: 'waste', label: 'Waste Risk', icon: AlertTriangle },
                { id: 'nutrition', label: 'Nutrition', icon: Target },
                { id: 'impact', label: 'Impact', icon: Leaf },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    if (tab.id !== 'overview') setQuickActionResponse(null);
                    if (tab.id !== 'nutrition') setNutritionInsights(null);
                  }}
                  className={`relative flex items-center gap-2 py-2.5 px-4 rounded-lg font-bold text-sm transition-all duration-300 ${activeTab === tab.id
                    ? 'text-purple-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                    }`}
                >
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <tab.icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`} />
                    {tab.label}
                  </span>
                </button>
              ))}
              <div className="w-px h-6 bg-gray-200 mx-2 self-center" />
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('toggleNutriChat', { detail: true }))}
                className="flex items-center gap-2 py-2.5 px-4 rounded-xl font-black text-xs bg-purple-600 text-white hover:bg-purple-700 transition-all shadow-lg shadow-purple-200 active:scale-95"
              >
                <MessageSquare className="w-4 h-4 animate-pulse" />
                AI Assistant
              </button>
            </nav>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-soft">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="w-5 h-5 text-black" />
                  <h3 className="font-bold text-foreground">
                    Consumption Score
                  </h3>
                </div>
                <div className="text-2xl font-bold text-black">
                  {insights.consumption?.patterns?.consistencyScore || 0}%
                </div>
                <p className="text-sm text-muted-foreground">Tracking consistency</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-soft">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="font-bold text-foreground">Items at Risk</h3>
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {insights.waste?.summary?.totalAtRisk || 0}
                </div>
                <p className="text-sm text-muted-foreground">Expiring soon</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-soft">
                <div className="flex items-center gap-3 mb-2">
                  <Leaf className="w-5 h-5 text-black" />
                  <h3 className="font-bold text-foreground">CO₂ Saved</h3>
                </div>
                <div className="text-2xl font-bold text-black">
                  {insights.impact?.impact?.environmental?.co2Saved || 0}kg
                </div>
                <p className="text-sm text-muted-foreground">This month</p>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-soft">
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="w-5 h-5 text-black" />
                  <h3 className="font-bold text-foreground">Money Saved</h3>
                </div>
                <div className="text-2xl font-bold text-black">
                  ৳{insights.impact?.impact?.financial?.moneySaved || 0}
                </div>
                <p className="text-sm text-muted-foreground">This month</p>
              </div>
            </div>

            {/* Cost Chart - Overview */}
            <div className="bg-white p-6 rounded-2xl shadow-soft">
              <h3 className="font-bold text-foreground mb-4">
                Spending Trend (Last 7 Days)
              </h3>
              {insights.consumption?.patterns?.dailyCost &&
                insights.consumption.patterns.dailyCost.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={insights.consumption.patterns.dailyCost}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(str) => {
                          const date = new Date(str);
                          return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                      />
                      <YAxis />
                      <Tooltip formatter={(value) => [`৳${value}`, 'Cost']} />
                      <Legend />
                      <Line type="monotone" dataKey="cost" stroke="#D2E823" name="Cost (৳)" strokeWidth={3} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-32 flex items-center justify-center text-muted-foreground">
                  <p>Not enough data to show spending trends.</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-soft">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-foreground">
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
                      className="p-4 border border-gray-100 rounded-xl hover:border-primary/50 hover:bg-gray-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
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
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <action.icon className="w-5 h-5 text-black group-hover:text-primary transition-colors" />
                        )}
                        <h3 className="font-bold text-foreground">
                          {action.title}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
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


        {/* Direct Consumption Tab */}
        {activeTab === 'direct-consumption' && (
          <div className="space-y-6">
            <DirectConsumption />
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
                <h3 className="font-bold text-foreground mb-3">AI Insights</h3>
                <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                  <MarkdownRenderer
                    content={insights.consumption.aiInsights}
                    className="space-y-3 text-foreground"
                  />
                </div>
              </div>
            )}
            {insights.consumption?.patterns && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="font-bold text-foreground mb-3">
                    Category Breakdown
                  </h4>
                  {Object.entries(
                    insights.consumption.patterns.categoryBreakdown || {},
                  ).map(([category, count]) => (
                    <div
                      key={category}
                      className="flex justify-between items-center py-1 border-b border-gray-100 last:border-0"
                    >
                      <span className="text-muted-foreground">{category}</span>
                      <span className="font-bold text-foreground">{count}</span>
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
                <span className="material-icons-outlined text-5xl text-muted-foreground/30 mb-4">trending_up</span>
                <p className="text-muted-foreground mb-4">
                  No consumption analysis available yet.
                </p>
                <button
                  onClick={() => fetchSpecificInsight('consumption-analysis')}
                  className="px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-900 transition-all shadow-lg"
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
                              className={`px-2 py-1 rounded text-xs font-medium ${item.wasteRisk === 'High'
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

                {insights.impact.impact.achievements && insights.impact.impact.achievements.length > 0 && (
                  <div>
                    <h4 className="font-bold text-foreground mb-3">
                      Achievements
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {insights.impact.impact.achievements.map(
                        (achievement: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-primary/20 text-black rounded-full text-sm font-bold border border-primary/30"
                          >
                            🏆 {achievement}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                )}
                {insights.impact.impact.recommendations && insights.impact.impact.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-bold text-foreground mb-3">
                      Recommendations
                    </h4>
                    <div className="space-y-2">
                      {insights.impact.impact.recommendations.map(
                        (rec: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl"
                          >
                            <Lightbulb className="w-4 h-4 text-black mt-1 shrink-0" />
                            <span className="text-muted-foreground font-medium">{rec}</span>
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
                <span className="material-icons-outlined text-5xl text-muted-foreground/30 mb-4">eco</span>
                <p className="text-muted-foreground mb-4">
                  No impact analysis available yet.
                </p>
                <button
                  onClick={() => fetchSpecificInsight('impact-analytics')}
                  className="px-8 py-3 bg-black text-white rounded-full font-bold hover:bg-gray-900 transition-all shadow-lg"
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
            {/* Nutrition Charts */}
            {insights.consumption?.patterns?.dailyNutrition &&
              insights.consumption.patterns.dailyNutrition.length > 0 && (
                <div className="space-y-6 mb-6">
                  {/* Daily Calories & Macros Chart */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-medium text-gray-900 mb-4">
                      Daily Nutrient Intake
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={insights.consumption.patterns.dailyNutrition}
                          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient
                              id="colorCalories"
                              x1="0"
                              y1="0"
                              x2="0"
                              y2="1"
                            >
                              <stop
                                offset="5%"
                                stopColor="#8884d8"
                                stopOpacity={0.8}
                              />
                              <stop
                                offset="95%"
                                stopColor="#8884d8"
                                stopOpacity={0}
                              />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            tickFormatter={(str) => {
                              const date = new Date(str);
                              return `${date.getDate()}/${date.getMonth() + 1}`;
                            }}
                          />
                          <YAxis />
                          <CartesianGrid strokeDasharray="3 3" />
                          <Tooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="calories"
                            stroke="#8884d8"
                            fillOpacity={1}
                            fill="url(#colorCalories)"
                            name="Calories (kcal)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Macros Breakdown */}
                  <div className="bg-white p-6 rounded-lg shadow">
                    <h3 className="font-medium text-gray-900 mb-4">
                      Macronutrients Trend
                    </h3>
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={insights.consumption.patterns.dailyNutrition}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={(str) => {
                              const date = new Date(str);
                              return `${date.getDate()}/${date.getMonth() + 1}`;
                            }}
                          />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="protein" stackId="a" fill="#82ca9d" name="Protein (g)" />
                          <Bar dataKey="carbohydrates" stackId="a" fill="#8884d8" name="Carbs (g)" />
                          <Bar dataKey="fat" stackId="a" fill="#ffc658" name="Fat (g)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}
            {(!insights.consumption?.patterns?.dailyNutrition ||
              insights.consumption.patterns.dailyNutrition.length === 0) && (
                <div className="bg-white p-6 rounded-lg shadow mb-6 text-center">
                  <p className="text-gray-500">Log consumption to see nutrition trends.</p>
                </div>
              )}

            {/* Cost Chart */}
            {insights.consumption?.patterns?.dailyCost &&
              insights.consumption.patterns.dailyCost.length > 0 && (
                <div className="bg-white p-6 rounded-2xl shadow-soft mb-6">
                  <h3 className="font-bold text-foreground mb-4">
                    Daily Food Cost
                  </h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={insights.consumption.patterns.dailyCost}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(str) => {
                            const date = new Date(str);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                          }}
                        />
                        <YAxis />
                        <Tooltip formatter={(value) => [`৳${value}`, 'Cost']} />
                        <Legend />
                        <Line type="monotone" dataKey="cost" stroke="#D2E823" name="Cost (৳)" strokeWidth={3} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

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
                <span className="material-icons-outlined text-5xl text-muted-foreground/30 mb-4">track_changes</span>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Nutrition Analysis
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Get detailed nutrition insights and recommendations based on
                  your consumption patterns.
                </p>
                <button
                  onClick={() => fetchSpecificInsight('nutrition-analysis')}
                  disabled={loadingInsight === 'nutrition-analysis'}
                  className="px-8 py-4 bg-black text-white rounded-full font-bold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto transition-all shadow-lg"
                >
                  {loadingInsight === 'nutrition-analysis' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Analyzing Nutrition...
                    </>
                  ) : (
                    <>
                      <span className="material-icons-outlined">track_changes</span>
                      Generate Nutrition Report
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Clear Analysis Button */}
            {nutritionInsights && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => setNutritionInsights(null)}
                  className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-purple-600 transition-colors py-2 px-4 rounded-xl hover:bg-purple-50"
                >
                  <Sparkles className="w-4 h-4" />
                  Clear Current Analysis
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
