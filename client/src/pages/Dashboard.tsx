import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  AlertTriangle,
  Package,
  ChefHat,
  Lightbulb,
  ArrowRight,
  Target,
  Leaf,
  BookOpen,
  BarChart
} from 'lucide-react';
import { useProfile } from '../context/ProfileContext';
import { useInventory } from '../hooks/useInventory';
import { getAllResources } from '../services/resources-service';
import { BASE_URL } from '../services/utils';

// Analytics interfaces
interface ConsumptionPattern {
  byCategory: Array<{
    category: string;
    consumptionCount: number;
    quantityConsumed: number;
  }>;
  byTime: Array<{
    timePeriod: string;
    consumptionCount: number;
  }>;
  wasteReduction: {
    wastePrevented: number;
    wasteReductionPercentage: number;
  };
}

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: string;
  tags: string[];
}

export default function Dashboard() {
  const { profile, loading: profileLoading } = useProfile();
  const { useGetInventories, useGetConsumptionLogs } = useInventory();
  
  // Date range for analytics (last 30 days) - Stable across renders
  const dateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    // Normalize to start/end of day for consistent caching
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }, []); // Empty dependency array for stable dates

  // Fetch user data
  const { data: inventories = [], isLoading: inventoriesLoading } = useGetInventories();
  
  // Memoize consumption query params to prevent refetches
  const consumptionParams = useMemo(() => ({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
  }), [dateRange.startDate, dateRange.endDate]);
  
  const { data: consumptionLogs = [], isLoading: consumptionLoading } = useGetConsumptionLogs(consumptionParams);
  const { data: resources = [], isLoading: resourcesLoading } = useQuery({
    queryKey: ['resources'],
    queryFn: getAllResources,
  });

  // Fetch analytics data with stable query key
  const { data: consumptionPatterns, isLoading: patternsLoading } = useQuery({
    queryKey: [
      'consumption-patterns', 
      {
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      }
    ],
    queryFn: async (): Promise<ConsumptionPattern> => {
      const params = new URLSearchParams({
        startDate: dateRange.startDate.toISOString(),
        endDate: dateRange.endDate.toISOString(),
      });
      const response = await fetch(`${BASE_URL}/inventories/analytics/consumption-patterns?${params}`, {
        headers: {
          'Authorization': `Bearer ${await (window as any).Clerk?.session?.getToken()}`,
        },
      });
      if (!response.ok) return { byCategory: [], byTime: [], wasteReduction: { wastePrevented: 0, wasteReductionPercentage: 0 } };
      const data = await response.json();
      return data.patterns;
    },
    enabled: !profileLoading,
  });

  // Get all inventory items for comprehensive stats
  // Memoize inventory IDs to prevent unnecessary refetches
  const inventoryIds = useMemo(() => 
    inventories.map(inv => inv.id).sort(), // Sort for consistent ordering
    [inventories]
  );
  
  const { data: allInventoryItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['all-inventory-items', inventoryIds],
    queryFn: async () => {
      if (!inventories.length) return [];
      
      const allItems = [];
      for (const inventory of inventories) {
        try {
          const response = await fetch(`${BASE_URL}/inventories/${inventory.id}/items`, {
            headers: {
              'Authorization': `Bearer ${await (window as any).Clerk?.session?.getToken()}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            allItems.push(...(data.items || []));
          }
        } catch (error) {
          console.error(`Error fetching items for inventory ${inventory.id}:`, error);
        }
      }
      return allItems;
    },
    enabled: inventories.length > 0 && !profileLoading,
  });

  // Calculate dashboard stats
  const dashboardStats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toDateString();
    
    // Total items tracked
    const totalItems = allInventoryItems.length;
    
    // Items expiring soon (within 3 days)
    const expiringItems = allInventoryItems.filter(item => {
      if (!item.expiryDate) return false;
      const expiryDate = new Date(item.expiryDate);
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
    }).length;

    // Today's consumption
    const todayConsumption = consumptionLogs.filter(log => 
      new Date(log.consumedAt).toDateString() === todayStr
    );

    // Waste prevented (simplified calculation)
    const wastePreventedKg = consumptionPatterns?.wasteReduction?.wastePrevented || 0;
    
    // Most consumed category
    const categoryStats = consumptionPatterns?.byCategory || [];
    const topCategory = categoryStats.sort((a, b) => b.quantityConsumed - a.quantityConsumed)[0];

    // Recent trend (comparing last 7 days vs previous 7 days)
    const last7Days = consumptionLogs.filter(log => {
      const logDate = new Date(log.consumedAt);
      const daysDiff = Math.ceil((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 7;
    });
    
    const previous7Days = consumptionLogs.filter(log => {
      const logDate = new Date(log.consumedAt);
      const daysDiff = Math.ceil((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff > 7 && daysDiff <= 14;
    });

    const recentTrend = last7Days.length - previous7Days.length;

    return {
      totalItems,
      expiringItems,
      todayConsumption: todayConsumption.length,
      wastePreventedKg: Math.round(wastePreventedKg * 100) / 100,
      topCategory: topCategory?.category || 'N/A',
      recentTrend,
      inventoryCount: inventories.length,
      totalConsumptionLogs: consumptionLogs.length,
    };
  }, [allInventoryItems, consumptionLogs, consumptionPatterns, inventories]);

  // Get recommended resources based on user activity
  const recommendedResources = useMemo(() => {
    if (!resources.length) return [];
    
    const userCategories = new Set(
      allInventoryItems.map(item => item.foodItem?.category).filter(Boolean)
    );
    
    const expiringItemsCount = dashboardStats.expiringItems;
    const hasLowActivity = dashboardStats.totalConsumptionLogs < 5;
    
    let recommendedTags = ['waste reduction'];
    
    if (expiringItemsCount > 0) {
      recommendedTags.push('storage', 'pantry');
    }
    
    if (hasLowActivity) {
      recommendedTags.push('meal planning', 'budget');
    }
    
    if (userCategories.has('fruit') || userCategories.has('vegetable')) {
      recommendedTags.push('seasonal', 'nutrition');
    }
    
    const relevant = resources.filter((resource: Resource) => 
      resource.tags.some(tag => recommendedTags.includes(tag))
    );
    
    return relevant.slice(0, 3);
  }, [resources, allInventoryItems, dashboardStats]);

  // Check if core data is loading
  const isInitialLoading = profileLoading || inventoriesLoading;
  const isDataLoading = consumptionLoading || itemsLoading || patternsLoading || resourcesLoading;

  if (isInitialLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground/70">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Loading spinner component
  const LoadingSpinner = ({ size = "w-4 h-4" }: { size?: string }) => (
    <div className={`${size} border-2 border-current border-t-transparent rounded-full animate-spin opacity-70`} />
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Welcome back, {profile?.profile?.fullName || 'User'}! 👋
        </h1>
        <p className="text-foreground/70">
          Here's your food tracking summary and insights
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Items */}
        <div className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-smooth">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-foreground/70">Items Tracked</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">{dashboardStats.totalItems}</p>
                {itemsLoading && <LoadingSpinner />}
              </div>
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-smooth">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              dashboardStats.expiringItems > 0 ? 'bg-orange-500/10' : 'bg-green-500/10'
            }`}>
              <Clock className={`w-6 h-6 ${
                dashboardStats.expiringItems > 0 ? 'text-orange-600' : 'text-green-600'
              }`} />
            </div>
            <div>
              <p className="text-sm text-foreground/70">Expiring Soon</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">{dashboardStats.expiringItems}</p>
                {itemsLoading && <LoadingSpinner />}
              </div>
            </div>
          </div>
        </div>

        {/* Today's Activity */}
        <div className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-smooth">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-foreground/70">Today's Activity</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">{dashboardStats.todayConsumption}</p>
                {consumptionLoading && <LoadingSpinner />}
              </div>
            </div>
          </div>
        </div>

        {/* Waste Prevented */}
        <div className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-smooth">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-foreground/70">Waste Prevented</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">{dashboardStats.wastePreventedKg} kg</p>
                {patternsLoading && <LoadingSpinner />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Overview & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Summary */}
        <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <BarChart className="w-5 h-5" />
              Activity Overview
              {isDataLoading && <LoadingSpinner />}
            </h2>
            <div className="flex items-center gap-2">
              {!consumptionLoading && (
                dashboardStats.recentTrend > 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                ) : dashboardStats.recentTrend < 0 ? (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                ) : null
              )}
              <span className="text-sm text-foreground/70">vs last week</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-2xl font-bold text-primary">{dashboardStats.inventoryCount}</p>
              <p className="text-sm text-foreground/70">Inventories</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{dashboardStats.totalConsumptionLogs}</p>
              <p className="text-sm text-foreground/70">Total Logs</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-2xl font-bold text-green-600">{dashboardStats.topCategory}</p>
              <p className="text-sm text-foreground/70">Top Category</p>
            </div>
            <div className="text-center p-4 bg-background rounded-lg">
              <p className="text-2xl font-bold text-orange-600">
                {consumptionPatterns?.wasteReduction?.wasteReductionPercentage || 0}%
              </p>
              <p className="text-sm text-foreground/70">Waste Reduced</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex flex-wrap gap-2">
              <Link
                to="/inventory"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium text-sm"
              >
                Manage Inventory
              </Link>
              <Link
                to="/daily-log"
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-smooth font-medium text-sm"
              >
                View Daily Log
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-linear-to-br from-primary/10 to-secondary/10 rounded-xl border border-border p-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            {dashboardStats.expiringItems > 0 && (
              <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-orange-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-orange-800">
                    {dashboardStats.expiringItems} items expiring soon!
                  </p>
                  <Link
                    to="/inventory"
                    className="text-xs text-orange-600 hover:text-orange-800 underline"
                  >
                    Check inventory →
                  </Link>
                </div>
              </div>
            )}
            
            {dashboardStats.todayConsumption === 0 && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <ChefHat className="w-5 h-5 text-blue-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">
                    No activity logged today
                  </p>
                  <Link
                    to="/daily-log"
                    className="text-xs text-blue-600 hover:text-blue-800 underline"
                  >
                    Log consumption →
                  </Link>
                </div>
              </div>
            )}
            
            {dashboardStats.totalItems === 0 && (
              <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <Package className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    Start tracking your food
                  </p>
                  <Link
                    to="/inventory"
                    className="text-xs text-primary hover:text-primary/80 underline"
                  >
                    Add your first item →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommended Resources */}
      {(recommendedResources.length > 0 || resourcesLoading) && (
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-yellow-600" />
              Recommended for You
              {resourcesLoading && <LoadingSpinner />}
            </h2>
            <Link
              to="/resources"
              className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              View all resources
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {resourcesLoading ? (
              // Loading placeholders
              Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="p-4 border border-border rounded-lg animate-pulse">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-lg shrink-0" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2" />
                      <div className="h-3 bg-gray-200 rounded mb-1" />
                      <div className="h-3 bg-gray-200 rounded w-2/3" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              recommendedResources.map((resource: Resource) => (
                <div
                  key={resource.id}
                  className="p-4 border border-border rounded-lg hover:shadow-md transition-smooth"
                >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground mb-1">{resource.title}</h3>
                    <p className="text-sm text-foreground/70 mb-2 line-clamp-2">
                      {resource.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-2 py-1 bg-secondary/20 text-secondary-foreground rounded">
                        {resource.type}
                      </span>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                      >
                        Read more →
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Welcome Section for New Users */}
      {dashboardStats.totalItems === 0 && (
        <div className="bg-linear-to-br from-primary/10 to-accent/10 rounded-2xl border border-border p-8">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Welcome to NutriTrack! 🌱
          </h2>
          <p className="text-foreground/70 mb-6">
            Start tracking your food consumption and reduce waste. Here are some quick actions to get you started:
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/inventory"
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium"
            >
              Add Your First Item
            </Link>
            <Link
              to="/resources"
              className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-smooth font-medium"
            >
              Learn Best Practices
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}