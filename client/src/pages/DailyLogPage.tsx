import {
  Apple,
  Calendar,
  ChefHat,
  Clock,
  Filter,
  Package,
  TrendingUp,
  Utensils,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useInventory, type ConsumptionLog } from '../hooks/useInventory';

export default function DailyLogPage() {
  // Stable default date range using useMemo to prevent cache misses
  const defaultDateRange = useMemo(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7); // Last 7 days
    // Normalize to start/end of day for consistent caching
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
  }, []);

  const [dateRange, setDateRange] = useState(defaultDateRange);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    inventoryId: '',
    category: '',
  });

  const { useGetConsumptionLogs, useGetInventories } = useInventory();
  const { data: inventories, isLoading: inventoriesLoading, isError: inventoriesError } =
    useGetInventories();
    
  // Memoize the consumption logs query parameters to prevent unnecessary refetches
  const consumptionParams = useMemo(() => ({
    startDate: dateRange.startDate,
    endDate: dateRange.endDate,
    inventoryId: filters.inventoryId || undefined,
  }), [dateRange.startDate, dateRange.endDate, filters.inventoryId]);

  const {
    data: consumptionLogs,
    isLoading: consumptionLoading,
    error: consumptionError,
  } = useGetConsumptionLogs(consumptionParams);

  // Combine loading states
  const isLoading = consumptionLoading;
  const error = consumptionError || (inventoriesError ? 'Failed to load inventories' : null);

  // Filter logs based on selected filters
  const filteredLogs = useMemo(() => {
    if (!consumptionLogs) return [];

    return consumptionLogs.filter(log => {
      const matchesCategory =
        !filters.category || log.foodItem?.category === filters.category;
      return matchesCategory;
    });
  }, [consumptionLogs, filters.category]);

  // Group logs by date
  const logsByDate = useMemo(() => {
    const grouped: Record<string, ConsumptionLog[]> = {};
    filteredLogs.forEach(log => {
      const date = new Date(log.consumedAt).toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(log);
    });
    return grouped;
  }, [filteredLogs]);

  // Calculate daily stats
  const dailyStats = useMemo(() => {
    const today = new Date().toDateString();
    const todayLogs = logsByDate[today] || [];

    const totalItems = todayLogs.length;
    const totalQuantity = todayLogs.reduce((sum, log) => sum + log.quantity, 0);
    const uniqueCategories = new Set(
      todayLogs.map(log => log.foodItem?.category).filter(Boolean),
    ).size;

    return { totalItems, totalQuantity, uniqueCategories };
  }, [logsByDate]);

  // Get category icon
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'fruit':
      case 'vegetable':
        return <Apple className="w-4 h-4" />;
      case 'dairy':
        return <Package className="w-4 h-4" />;
      default:
        return <Utensils className="w-4 h-4" />;
    }
  };

  // Get category colors
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'fruit':
        return 'bg-orange-100 text-orange-800';
      case 'vegetable':
        return 'bg-green-100 text-green-800';
      case 'dairy':
        return 'bg-blue-100 text-blue-800';
      case 'grain':
        return 'bg-yellow-100 text-yellow-800';
      case 'protein':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      inventoryId: '',
      category: '',
    });
  };

  const hasActiveFilters = filters.inventoryId || filters.category;

  // Optimized date change handlers to prevent unnecessary cache invalidation
  const handleStartDateChange = useMemo(() => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = new Date(e.target.value);
      newDate.setHours(0, 0, 0, 0); // Start of day
      setDateRange(prev => ({
        ...prev,
        startDate: newDate,
      }));
    }, []
  );

  const handleEndDateChange = useMemo(() => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = new Date(e.target.value);
      newDate.setHours(23, 59, 59, 999); // End of day
      setDateRange(prev => ({
        ...prev,
        endDate: newDate,
      }));
    }, []
  );

  // Get unique categories from logs
  const availableCategories = Array.from(
    new Set(
      (consumptionLogs || [])
        .map(log => log.foodItem?.category)
        .filter(Boolean),
    ),
  ).sort();

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Daily Log</h1>
          <p className="text-foreground/70">
            Track your daily food consumption
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-foreground/70" />
            <input
              type="date"
              value={dateRange.startDate.toISOString().split('T')[0]}
              onChange={handleStartDateChange}
              className="px-3 py-1 border border-border rounded-lg bg-background text-foreground text-sm"
            />
            <span className="text-foreground/50">to</span>
            <input
              type="date"
              value={dateRange.endDate.toISOString().split('T')[0]}
              onChange={handleEndDateChange}
              className="px-3 py-1 border border-border rounded-lg bg-background text-foreground text-sm"
            />
          </div>
        </div>
      </div>

      {/* Daily Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-foreground/70">Items Consumed Today</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">
                  {dailyStats.totalItems}
                </p>
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-70" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-foreground/70">Total Quantity</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">
                  {dailyStats.totalQuantity.toFixed(1)}
                </p>
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin opacity-70" />
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Apple className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-foreground/70">Food Categories</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-foreground">
                  {dailyStats.uniqueCategories}
                </p>
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin opacity-70" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        {/* Filter Toggle */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border border-border rounded-lg transition-colors flex items-center gap-2 ${
              showFilters || hasActiveFilters
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground hover:bg-secondary/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-primary-foreground text-primary rounded-full w-5 h-5 text-xs flex items-center justify-center font-semibold">
                {[filters.inventoryId, filters.category].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Inventory Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Inventory
                </label>
                <select
                  value={filters.inventoryId}
                  onChange={e =>
                    setFilters(prev => ({
                      ...prev,
                      inventoryId: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                  disabled={inventoriesLoading}
                >
                  <option value="">All Inventories</option>
                  {inventoriesLoading ? (
                    <option disabled>Loading inventories...</option>
                  ) : (
                    (inventories || []).map(inventory => (
                      <option key={inventory.id} value={inventory.id}>
                        {inventory.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={e =>
                    setFilters(prev => ({ ...prev, category: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
                >
                  <option value="">All Categories</option>
                  {availableCategories.map(category => (
                    <option key={category} value={category}>
                      {category
                        ? category.charAt(0).toUpperCase() + category.slice(1)
                        : 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Active Filter Tags */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-border">
                <span className="text-sm text-foreground/70">Active:</span>
                {filters.inventoryId && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs flex items-center gap-1">
                    {
                      (inventories || []).find(
                        inv => inv.id === filters.inventoryId,
                      )?.name
                    }
                    <button
                      onClick={() =>
                        setFilters(prev => ({ ...prev, inventoryId: '' }))
                      }
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {filters.category && (
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs flex items-center gap-1">
                    {filters.category.charAt(0).toUpperCase() +
                      filters.category.slice(1)}
                    <button
                      onClick={() =>
                        setFilters(prev => ({ ...prev, category: '' }))
                      }
                      className="hover:bg-primary/20 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Consumption Logs */}
      <div className="bg-card rounded-xl border border-border">
        <div className="p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Consumption Timeline
            {isLoading && (
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin opacity-70" />
            )}
          </h2>
          <p className="text-foreground/70 text-sm mt-1">
            {isLoading ? 'Loading...' : `${filteredLogs.length} consumption entries found`}
          </p>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-foreground/70">Loading consumption logs...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Unable to load consumption logs
              </h3>
              <p className="text-foreground/60 mb-4">
                {typeof error === 'string' ? error : 'There was an error loading your consumption data. Please try again.'}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium"
              >
                Retry
              </button>
            </div>
          ) : Object.keys(logsByDate).length === 0 ? (
            <div className="text-center py-12">
              <ChefHat className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {hasActiveFilters
                  ? 'No consumption logs match your filters'
                  : 'No consumption logs yet'}
              </h3>
              <p className="text-foreground/60">
                {hasActiveFilters
                  ? 'Try adjusting your filters or date range'
                  : 'Start consuming items to see your daily log'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(logsByDate)
                .sort(
                  ([a], [b]) => new Date(b).getTime() - new Date(a).getTime(),
                )
                .map(([date, logs]) => (
                  <div key={date} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-foreground">
                        {formatDate(date)}
                      </h3>
                      <div className="h-px bg-border flex-1" />
                      <span className="text-sm text-foreground/70">
                        {logs.length} item{logs.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="grid gap-3">
                      {logs
                        .sort(
                          (a, b) =>
                            new Date(b.consumedAt).getTime() -
                            new Date(a.consumedAt).getTime(),
                        )
                        .map(log => (
                          <div
                            key={log.id}
                            className="bg-secondary/5 rounded-lg p-4 border border-secondary/20 hover:bg-secondary/10 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3 flex-1">
                                <div
                                  className={`p-2 rounded-lg ${getCategoryColor(
                                    log.foodItem?.category,
                                  )}`}
                                >
                                  {getCategoryIcon(log.foodItem?.category)}
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-foreground truncate">
                                      {log.itemName}
                                    </h4>
                                    {log.foodItem?.category && (
                                      <span
                                        className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(
                                          log.foodItem.category,
                                        )}`}
                                      >
                                        {log.foodItem.category}
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-4 text-sm text-foreground/70">
                                    <span className="font-medium">
                                      {log.quantity} {log.unit}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {formatTime(log.consumedAt)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Package className="w-3 h-3" />
                                      {log.inventory.name}
                                    </span>
                                  </div>

                                  {log.notes && (
                                    <p className="text-sm text-foreground/80 mt-2 italic">
                                      "{log.notes}"
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
