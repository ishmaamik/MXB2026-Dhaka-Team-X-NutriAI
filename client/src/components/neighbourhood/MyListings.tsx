import { useState } from 'react';
import { MoreVertical, Trash2, Clock, CheckCircle, Package } from 'lucide-react';
import { useListings, useDeleteListing, useUpdateListing } from './sharing-service';
import { ListingStatus } from './types';
import type { FoodListing } from './types';

export default function MyListings() {
  const [statusFilter, setStatusFilter] = useState<'all' | ListingStatus>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  const { data: listings = [], isLoading, error } = useListings();
  const deleteListingMutation = useDeleteListing();
  const updateListingMutation = useUpdateListing();

  const filteredListings = listings.filter((listing: FoodListing) => 
    statusFilter === 'all' || listing.status === statusFilter
  );

  const handleDelete = async (listingId: string) => {
    try {
      await deleteListingMutation.mutateAsync(listingId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting listing:', error);
    }
  };

  const handleStatusUpdate = async (listingId: string, status: ListingStatus) => {
    try {
      await updateListingMutation.mutateAsync({ 
        id: listingId, 
        data: { status }
      });
    } catch (error) {
      console.error('Error updating listing status:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">My Listings</h2>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-xl border border-border p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-5 bg-foreground/10 rounded w-3/4"></div>
                <div className="h-4 bg-foreground/10 rounded w-1/2"></div>
                <div className="h-4 bg-foreground/10 rounded w-full"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-foreground">My Listings</h2>
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-600">Failed to load your listings</p>
          <p className="text-red-500 text-sm mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            My Listings
          </h2>
          <p className="text-foreground/70">
            Manage your shared food items
          </p>
        </div>
        
        {/* Status Filter */}
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | ListingStatus)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground text-sm"
          >
            <option value="all">All Status</option>
            <option value={ListingStatus.AVAILABLE}>Available</option>
            <option value={ListingStatus.CLAIMED}>Claimed</option>
            <option value={ListingStatus.COMPLETED}>Completed</option>
            <option value={ListingStatus.CANCELLED}>Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {listings.filter((l: FoodListing) => l.status === ListingStatus.AVAILABLE).length}
          </div>
          <div className="text-sm text-foreground/70">Available</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {listings.filter((l: FoodListing) => l.status === ListingStatus.CLAIMED).length}
          </div>
          <div className="text-sm text-foreground/70">Claimed</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">
            {listings.filter((l: FoodListing) => l.status === ListingStatus.COMPLETED).length}
          </div>
          <div className="text-sm text-foreground/70">Completed</div>
        </div>
        <div className="bg-card rounded-lg border border-border p-4 text-center">
          <div className="text-2xl font-bold text-gray-600">
            {listings.filter((l: FoodListing) => l.status === ListingStatus.CANCELLED).length}
          </div>
          <div className="text-sm text-foreground/70">Cancelled</div>
        </div>
      </div>

      {/* Listings */}
      {filteredListings.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Package className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            {statusFilter === 'all' ? 'No Listings Yet' : `No ${String(statusFilter).toLowerCase()} listings`}
          </h3>
          <p className="text-foreground/60">
            {statusFilter === 'all' 
              ? 'Share your surplus food to help others in your neighborhood'
              : `You don't have any ${String(statusFilter).toLowerCase()} listings right now`
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing: FoodListing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onDelete={() => setShowDeleteConfirm(listing.id)}
              onStatusUpdate={handleStatusUpdate}
              isUpdating={updateListingMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(showDeleteConfirm)}
          onCancel={() => setShowDeleteConfirm(null)}
          isDeleting={deleteListingMutation.isPending}
        />
      )}
    </div>
  );
}

interface ListingCardProps {
  listing: FoodListing;
  onDelete: () => void;
  onStatusUpdate: (listingId: string, status: ListingStatus) => void;
  isUpdating: boolean;
}

function ListingCard({ listing, onDelete, onStatusUpdate, isUpdating }: ListingCardProps) {
  const [showActions, setShowActions] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case ListingStatus.AVAILABLE:
        return 'text-green-600 bg-green-50 border-green-200';
      case ListingStatus.CLAIMED:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case ListingStatus.COMPLETED:
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case ListingStatus.CANCELLED:
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case ListingStatus.AVAILABLE:
        return <Package className="w-4 h-4" />;
      case ListingStatus.CLAIMED:
        return <Clock className="w-4 h-4" />;
      case ListingStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAvailableActions = () => {
    const actions = [];
    
    if (listing.status === ListingStatus.CLAIMED) {
      actions.push({
        label: 'Mark as Completed',
        action: () => onStatusUpdate(listing.id, ListingStatus.COMPLETED),
        color: 'text-blue-600'
      });
    }
    
    if (listing.status === ListingStatus.AVAILABLE) {
      actions.push({
        label: 'Cancel Listing',
        action: () => onStatusUpdate(listing.id, ListingStatus.CANCELLED),
        color: 'text-gray-600'
      });
    }
    
    if (listing.status !== ListingStatus.COMPLETED) {
      actions.push({
        label: 'Delete Listing',
        action: onDelete,
        color: 'text-red-600'
      });
    }
    
    return actions;
  };

  const availableActions = getAvailableActions();

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground">
              {listing.title}
            </h3>
            <div className={`px-3 py-1 rounded-full border text-sm font-medium flex items-center gap-2 ${getStatusColor(listing.status)}`}>
              {getStatusIcon(listing.status)}
              {listing.status}
            </div>
          </div>
          
          {listing.description && (
            <p className="text-foreground/70 mb-3">
              {listing.description}
            </p>
          )}
        </div>
        
        {availableActions.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              disabled={isUpdating}
              className="p-2 hover:bg-secondary/10 rounded-lg transition-smooth disabled:opacity-50"
            >
              <MoreVertical className="w-5 h-5 text-foreground/60" />
            </button>
            
            {showActions && (
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
                <div className="py-2">
                  {availableActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.action();
                        setShowActions(false);
                      }}
                      disabled={isUpdating}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-secondary/10 transition-smooth disabled:opacity-50 ${action.color}`}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-foreground/60">Quantity:</span>
          <p className="font-medium text-foreground">
            {listing.quantity} {listing.inventoryItem?.unit || ''}
          </p>
        </div>
        
        {listing.pickupLocation && (
          <div>
            <span className="text-foreground/60">Pickup:</span>
            <p className="font-medium text-foreground">
              {listing.pickupLocation}
            </p>
          </div>
        )}
        
        <div>
          <span className="text-foreground/60">Created:</span>
          <p className="font-medium text-foreground">
            {formatDate(listing.createdAt)}
          </p>
        </div>
        
        {listing.availableUntil && (
          <div>
            <span className="text-foreground/60">Available Until:</span>
            <p className="font-medium text-foreground">
              {formatDate(listing.availableUntil)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

interface DeleteConfirmModalProps {
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteConfirmModal({ onConfirm, onCancel, isDeleting }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center gap-3 mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-bold text-foreground">
            Delete Listing
          </h3>
        </div>
        
        <p className="text-foreground/70 mb-6">
          Are you sure you want to delete this listing? This action cannot be undone.
        </p>
        
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-secondary/10 transition-smooth disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-smooth disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}