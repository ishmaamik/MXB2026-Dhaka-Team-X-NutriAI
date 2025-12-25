import { useState } from 'react';
import { 
  MapPin, 
  Clock, 
  Package, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Star,
  MessageSquare
} from 'lucide-react';
import type { FoodListing, ClaimListingRequest } from './types';
import { ListingStatus } from './types';
import { useClaimListing, useCompleteListing } from './sharing-service';

interface ListingCardProps {
  listing: FoodListing;
  showActions?: boolean;
  isOwner?: boolean;
  onUpdate?: () => void;
}

export default function ListingCard({ 
  listing, 
  showActions = true, 
  isOwner = false,
  onUpdate 
}: ListingCardProps) {
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  
  const claimMutation = useClaimListing();
  const completeMutation = useCompleteListing();

  const itemName = listing.inventoryItem.customName || 
                   listing.inventoryItem.foodItem?.name || 
                   'Unknown Item';
  const category = listing.inventoryItem.foodItem?.category || 'Custom';
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case ListingStatus.AVAILABLE:
        return 'bg-green-100 text-green-800 border-green-200';
      case ListingStatus.CLAIMED:
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case ListingStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case ListingStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case ListingStatus.AVAILABLE:
        return <Package className="w-3 h-3" />;
      case ListingStatus.CLAIMED:
        return <Clock className="w-3 h-3" />;
      case ListingStatus.COMPLETED:
        return <CheckCircle className="w-3 h-3" />;
      case ListingStatus.CANCELLED:
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Package className="w-3 h-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClaim = async (data: ClaimListingRequest) => {
    try {
      await claimMutation.mutateAsync({ id: listing.id, data });
      setShowClaimModal(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error claiming listing:', error);
    }
  };

  const handleComplete = async (notes: string) => {
    try {
      await completeMutation.mutateAsync({ id: listing.id, notes });
      setShowCompleteModal(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error completing listing:', error);
    }
  };

  const isExpiringSoon = listing.availableUntil && 
    new Date(listing.availableUntil) < new Date(Date.now() + 24 * 60 * 60 * 1000);

  return (
    <>
      <div className="bg-card rounded-xl border border-border p-6 shadow hover:shadow-lg transition-smooth">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground mb-1">
              {listing.title}
            </h3>
            <p className="text-sm text-foreground/70">
              {itemName} • {category}
            </p>
          </div>
          <div className={`px-2 py-1 rounded-lg border text-xs font-medium flex items-center gap-1 ${getStatusColor(listing.status)}`}>
            {getStatusIcon(listing.status)}
            {listing.status}
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <p className="text-foreground/80 text-sm mb-4 line-clamp-2">
            {listing.description}
          </p>
        )}

        {/* Quantity and Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Package className="w-4 h-4 text-foreground/60" />
            <span className="text-foreground/70">
              {listing.quantity} {listing.unit || 'units'}
            </span>
          </div>
          {listing.pickupLocation && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-foreground/60" />
              <span className="text-foreground/70 truncate">
                {listing.pickupLocation}
              </span>
            </div>
          )}
        </div>

        {/* Expiry Warning */}
        {isExpiringSoon && listing.status === ListingStatus.AVAILABLE && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <span className="text-orange-800 text-sm font-medium">
                Expires soon: {formatDate(listing.availableUntil!)}
              </span>
            </div>
          </div>
        )}

        {/* Lister Info */}
        <div className="flex items-center justify-between text-sm text-foreground/60 mb-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span>
              {listing.lister.profile?.fullName || 'Anonymous'}
              {listing.lister.profile?.location && (
                <span className="text-foreground/50">
                  • {listing.lister.profile.location}
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            <span>{formatDate(listing.createdAt)}</span>
          </div>
        </div>

        {/* Claims Info */}
        {listing.sharingLogs.length > 0 && (
          <div className="bg-secondary/10 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-foreground/60" />
              <span className="text-sm font-medium text-foreground">
                {listing.sharingLogs.length} claim(s)
              </span>
            </div>
            {listing.sharingLogs.slice(0, 2).map(log => (
              <div key={log.id} className="text-sm text-foreground/70 mb-1">
                <span className="font-medium">{log.claimerName || 'Anonymous'}</span>
                {log.claimedAt && (
                  <span className="text-foreground/50"> • {formatDate(log.claimedAt)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2">
            {!isOwner && listing.status === ListingStatus.AVAILABLE && (
              <button
                onClick={() => setShowClaimModal(true)}
                disabled={claimMutation.isPending}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-smooth font-medium flex items-center justify-center gap-2"
              >
                <Star className="w-4 h-4" />
                {claimMutation.isPending ? 'Claiming...' : 'Claim'}
              </button>
            )}
            
            {(isOwner || listing.sharingLogs.some(log => log.claimerId)) && 
             listing.status === ListingStatus.CLAIMED && (
              <button
                onClick={() => setShowCompleteModal(true)}
                disabled={completeMutation.isPending}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-smooth font-medium flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {completeMutation.isPending ? 'Completing...' : 'Mark Complete'}
              </button>
            )}

            {listing.status === ListingStatus.COMPLETED && (
              <div className="flex-1 px-4 py-2 bg-blue-100 text-blue-800 rounded-lg text-center font-medium">
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Completed
              </div>
            )}
          </div>
        )}
      </div>

      {/* Claim Modal */}
      {showClaimModal && (
        <ClaimModal
          listing={listing}
          onClose={() => setShowClaimModal(false)}
          onClaim={handleClaim}
          isLoading={claimMutation.isPending}
        />
      )}

      {/* Complete Modal */}
      {showCompleteModal && (
        <CompleteModal
          listing={listing}
          onClose={() => setShowCompleteModal(false)}
          onComplete={handleComplete}
          isLoading={completeMutation.isPending}
        />
      )}
    </>
  );
}

interface ClaimModalProps {
  listing: FoodListing;
  onClose: () => void;
  onClaim: (data: ClaimListingRequest) => void;
  isLoading: boolean;
}

function ClaimModal({ listing, onClose, onClaim, isLoading }: ClaimModalProps) {
  const [form, setForm] = useState({
    claimerName: '',
    notes: '',
    quantityClaimed: listing.quantity,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClaim({
      claimerName: form.claimerName || undefined,
      notes: form.notes || undefined,
      quantityClaimed: form.quantityClaimed,
    });
  };

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground mb-2">
            Claim "{listing.title}"
          </h3>
          <p className="text-foreground/70 text-sm">
            Let the owner know you're interested in this item.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={form.claimerName}
              onChange={(e) => setForm(prev => ({ ...prev, claimerName: e.target.value }))}
              placeholder="How should they contact you?"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Quantity Needed
            </label>
            <input
              type="number"
              min="0.1"
              max={listing.quantity}
              step="0.1"
              value={form.quantityClaimed}
              onChange={(e) => setForm(prev => ({ ...prev, quantityClaimed: parseFloat(e.target.value) }))}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
            <p className="text-xs text-foreground/60 mt-1">
              Available: {listing.quantity} {listing.unit}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Message (Optional)
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any special requests or pickup preferences?"
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-secondary/10 disabled:opacity-50 transition-smooth"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-smooth font-medium"
            >
              {isLoading ? 'Claiming...' : 'Send Claim'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface CompleteModalProps {
  listing: FoodListing;
  onClose: () => void;
  onComplete: (notes: string) => void;
  isLoading: boolean;
}

function CompleteModal({ listing, onClose, onComplete, isLoading }: CompleteModalProps) {
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(notes);
  };

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-bold text-foreground mb-2">
            Complete Sharing
          </h3>
          <p className="text-foreground/70 text-sm">
            Mark "{listing.title}" as successfully shared.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Completion Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did the sharing go? Any feedback?"
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-border text-foreground rounded-lg hover:bg-secondary/10 disabled:opacity-50 transition-smooth"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-smooth font-medium"
            >
              {isLoading ? 'Completing...' : 'Mark Complete'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}