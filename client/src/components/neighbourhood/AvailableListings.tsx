import { useState } from 'react';
import { Search, Filter, MapPin, Package, AlertCircle } from 'lucide-react';
import { useListings } from './sharing-service';
import { ListingStatus, type ListingFilters } from './types';
import ListingCard from './ListingCard';

export default function AvailableListings() {
  const [filters, setFilters] = useState<ListingFilters>({
    status: ListingStatus.AVAILABLE,
    excludeOwnListings: true,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState('');

  const { 
    data: listings = [], 
    isLoading, 
    isError, 
    refetch 
  } = useListings({
    ...filters,
    search: search || undefined,
  });

  const handleFilterChange = (key: keyof ListingFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({
      status: ListingStatus.AVAILABLE,
      excludeOwnListings: true,
    });
    setSearch('');
  };

  const hasActiveFilters = filters.category || filters.location || search;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground/70">Loading available items...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Listings
          </h3>
          <p className="text-red-600 mb-4">
            Failed to fetch available items. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            Available Food Items
          </h2>
          <p className="text-foreground/70 text-sm">
            {listings.length} items available for sharing
          </p>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-smooth ${
            showFilters 
              ? 'bg-primary text-primary-foreground border-primary' 
              : 'bg-card border-border text-foreground hover:bg-secondary/10'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/60" />
        <input
          type="text"
          placeholder="Search for food items, categories, or locations..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-border rounded-lg bg-background text-foreground placeholder:text-foreground/50"
        />
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-foreground">Filter Options</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Category
              </label>
              <select
                value={filters.category || ''}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="">All Categories</option>
                <option value="fruit">Fruits</option>
                <option value="vegetable">Vegetables</option>
                <option value="dairy">Dairy</option>
                <option value="meat">Meat</option>
                <option value="grain">Grains</option>
                <option value="spice">Spices</option>
                <option value="condiment">Condiments</option>
                <option value="snack">Snacks</option>
                <option value="beverage">Beverages</option>
                <option value="custom">Custom Items</option>
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-foreground/60" />
                <input
                  type="text"
                  placeholder="Enter area or landmark"
                  value={filters.location || ''}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value={ListingStatus.AVAILABLE}>Available</option>
                <option value={ListingStatus.CLAIMED}>Claimed</option>
                <option value={ListingStatus.COMPLETED}>Completed</option>
                <option value="">All Status</option>
              </select>
            </div>
          </div>

          {/* Toggle Own Listings */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-foreground">Hide my own listings</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={filters.excludeOwnListings || false}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  excludeOwnListings: e.target.checked 
                }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      )}

      {/* Results */}
      {listings.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Package className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {hasActiveFilters ? 'No matching items found' : 'No items available'}
          </h3>
          <p className="text-foreground/60 mb-4">
            {hasActiveFilters 
              ? 'Try adjusting your filters or search terms.'
              : 'Be the first to share food with your community!'
            }
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {listings.map(listing => (
            <ListingCard
              key={listing.id}
              listing={listing}
              showActions={true}
              isOwner={false}
              onUpdate={() => refetch()}
            />
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {listings.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/70">
              Showing {listings.length} available items
            </span>
            <div className="flex items-center gap-4">
              <span className="text-foreground/60">
                Categories: {new Set(listings.map(l => 
                  l.inventoryItem.foodItem?.category || 'Custom'
                )).size}
              </span>
              <span className="text-foreground/60">
                Locations: {new Set(listings.map(l => 
                  l.pickupLocation
                ).filter(Boolean)).size}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}