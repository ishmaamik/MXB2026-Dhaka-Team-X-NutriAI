import { useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Apple,
  ArrowLeft,
  Calendar,
  Camera,
  FileText,
  Filter,
  Hash,
  Package,
  Plus,
  Search,
  Trash2,
  Utensils,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ImageUploadModal from '../components/inventory/ImageUploadModal';
import { useInventory } from '../hooks/useInventory';

export interface Inventory {
  id: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: string;
  inventoryId: string;
  foodItemId?: string;
  customName?: string;
  quantity: number;
  unit?: string;
  expiryDate?: string;
  notes?: string;
  foodItem?: {
    id?: string;
    name: string;
    category: string;
    unit?: string;
    typicalExpirationDays?: number;
    description?: string;
  };
}

export interface FoodItem {
  id: string;
  name: string;
  unit?: string;
  category?: string;
  typicalExpirationDays?: number;
  sampleCostPerUnit?: number;
  description?: string;
}

export default function InventoryDetailPage() {
  // Image upload modal state
  const [showImageUploadModal, setShowImageUploadModal] = useState(false);

  // Rest of the states
  const { inventoryId } = useParams<{ inventoryId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    expiryStatus: '',
    stockLevel: '',
  });

  const {
    useGetInventories,
    useGetInventoryItems,
    useAddItemToInventory,
    useLogConsumption,
  } = useInventory();
  const { data: inventories, isLoading } = useGetInventories();
  const { data: inventoryItems, isLoading: itemsLoading } =
    useGetInventoryItems(inventoryId!);
  const addItemMutation = useAddItemToInventory(inventoryId!);
  const logConsumptionMutation = useLogConsumption(inventoryId!);

  useEffect(() => {
    if (!inventoryId) {
      setError('Inventory ID is required');
      setLoading(false);
      return;
    }

    if (isLoading) return;

    try {
      if (inventories) {
        const foundInventory = inventories.find(inv => inv.id === inventoryId);
        if (foundInventory) {
          setInventory(foundInventory);
          setLoading(false);
        } else {
          setError('Inventory not found');
          setLoading(false);
        }
      } else {
        setError('Failed to load inventories');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to load inventory');
      console.error(err);
      setLoading(false);
    }
  }, [inventoryId, inventories, isLoading]);

  // Handle image upload success
  const handleImageUploadSuccess = (extractedItems: any[]) => {
    console.log('OCR items added successfully:', extractedItems);
    setShowImageUploadModal(false);
    // Refresh the inventory data
    queryClient.invalidateQueries({
      queryKey: ['inventory-items', inventoryId],
    });
  };

  if (isLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground/70">Loading inventory...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Inventory
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/inventory')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth"
          >
            Go Back to Inventories
          </button>
        </div>
      </div>
    );
  }

  if (!inventory) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-6 bg-card border border-border rounded-xl max-w-md">
          <Package className="w-12 h-12 text-foreground/70 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            Inventory Not Found
          </h3>
          <p className="text-foreground/70 mb-4">
            The requested inventory could not be found.
          </p>
          <button
            onClick={() => navigate('/inventory')}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth"
          >
            Go Back to Inventories
          </button>
        </div>
      </div>
    );
  }

  const filteredItems = (inventoryItems || []).filter(item => {
    const itemName = item.customName || item.foodItem?.name || '';
    const itemNotes = item.notes || '';
    const itemCategory =
      item.foodItem?.category || (item.foodItemId ? 'uncategorized' : 'custom');

    const matchesSearch =
      itemName.toLowerCase().includes(search.toLowerCase()) ||
      itemNotes.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      !filters.category || itemCategory === filters.category;

    let matchesExpiry = true;
    if (filters.expiryStatus) {
      const today = new Date();
      if (item.expiryDate) {
        const expDate = new Date(item.expiryDate);
        const diffTime = expDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        switch (filters.expiryStatus) {
          case 'expired':
            matchesExpiry = diffDays < 0;
            break;
          case 'expiring-soon':
            matchesExpiry = diffDays >= 0 && diffDays <= 3;
            break;
          case 'fresh':
            matchesExpiry = diffDays > 3;
            break;
          default:
            matchesExpiry = true;
        }
      } else {
        matchesExpiry = filters.expiryStatus === 'no-expiry';
      }
    }

    let matchesStock = true;
    if (filters.stockLevel) {
      switch (filters.stockLevel) {
        case 'out-of-stock':
          matchesStock = item.quantity <= 0;
          break;
        case 'low-stock':
          matchesStock = item.quantity > 0 && item.quantity <= 2;
          break;
        case 'in-stock':
          matchesStock = item.quantity > 2;
          break;
        default:
          matchesStock = true;
      }
    }

    return matchesSearch && matchesCategory && matchesExpiry && matchesStock;
  });

  const handleConsumption = (item: InventoryItem) => {
    setSelectedItem(item);
    setShowConsumptionModal(true);
  };

  const handleConsumptionSubmit = async (consumptionData: {
    quantity: number;
    unit?: string;
    notes?: string;
  }) => {
    if (!selectedItem) return;

    const itemName =
      selectedItem.customName || selectedItem.foodItem?.name || 'Unknown Item';

    try {
      await logConsumptionMutation.mutateAsync({
        inventoryId: inventoryId!,
        inventoryItemId: selectedItem.id,
        foodItemId: selectedItem.foodItemId,
        itemName,
        quantity: consumptionData.quantity,
        unit: consumptionData.unit || selectedItem.unit,
        notes: consumptionData.notes,
      });
      setShowConsumptionModal(false);
      setSelectedItem(null);
    } catch (error) {
      console.error('Error logging consumption:', error);
      // Show user-friendly error message
      alert('Failed to log consumption. Please try again.');
    }
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      expiryStatus: '',
      stockLevel: '',
    });
    setSearch('');
  };

  const hasActiveFilters =
    filters.category || filters.expiryStatus || filters.stockLevel || search;

  const availableCategories = Array.from(
    new Set(
      (inventoryItems || [])
        .map(
          item =>
            item.foodItem?.category ||
            (item.foodItemId ? 'uncategorized' : 'custom'),
        )
        .filter(Boolean),
    ),
  ).sort();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-3 max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/inventory')}
            className="p-2 hover:bg-secondary/20 rounded-lg transition-smooth"
          >
            <ArrowLeft className="w-5 h-5 text-foreground/70" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-foreground">
                {inventory.name}
              </h1>
              {inventory.description && (
                <p className="text-sm text-foreground/70">
                  {inventory.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-foreground/70">Total Items</p>
                <p className="text-2xl font-bold text-foreground">
                  {inventoryItems?.length || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
                <Apple className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-foreground/70">Categories</p>
                <p className="text-2xl font-bold text-foreground">
                  {availableCategories.length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-foreground/70">Expiring Soon</p>
                <p className="text-2xl font-bold text-foreground">
                  {inventoryItems?.filter(item => {
                    if (!item.expiryDate) return false;
                    const expDate = new Date(item.expiryDate);
                    const today = new Date();
                    const diffDays = Math.ceil(
                      (expDate.getTime() - today.getTime()) /
                        (1000 * 60 * 60 * 24),
                    );
                    return diffDays >= 0 && diffDays <= 3;
                  }).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 px-4 py-3 bg-card border-2 border-dashed border-primary/30 
                       rounded-lg hover:border-primary hover:bg-primary/5 transition-smooth
                       flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5 text-primary" />
            <span className="font-medium text-primary">Add Manually</span>
          </button>

          <button
            onClick={() => setShowImageUploadModal(true)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-primary to-primary/80 
                       text-primary-foreground rounded-lg hover:shadow-lg 
                       transition-smooth flex items-center justify-center gap-2"
          >
            <Camera className="w-5 h-5" />
            <span className="font-medium">Smart OCR Scan</span>
          </button>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type="text"
                placeholder="Search items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-foreground"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-smooth ${
                showFilters || hasActiveFilters
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card border border-border text-foreground hover:bg-secondary/10'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-card border border-border rounded-lg p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  >
                    <option value="">All Categories</option>
                    {availableCategories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Expiry Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Expiry Status
                  </label>
                  <select
                    value={filters.expiryStatus}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        expiryStatus: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  >
                    <option value="">All Status</option>
                    <option value="expired">Expired</option>
                    <option value="expiring-soon">
                      Expiring Soon (≤3 days)
                    </option>
                    <option value="fresh">Fresh (&gt;3 days)</option>
                    <option value="no-expiry">No Expiry Date</option>
                  </select>
                </div>

                {/* Stock Level Filter */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Stock Level
                  </label>
                  <select
                    value={filters.stockLevel}
                    onChange={e =>
                      setFilters(prev => ({
                        ...prev,
                        stockLevel: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  >
                    <option value="">All Levels</option>
                    <option value="out-of-stock">Out of Stock</option>
                    <option value="low-stock">Low Stock (≤2)</option>
                    <option value="in-stock">In Stock (&gt;2)</option>
                  </select>
                </div>
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary hover:text-primary/80 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Items List */}
        {itemsLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-foreground/70">Loading items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-xl border border-border">
            <Package className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {hasActiveFilters
                ? 'No items match your filters'
                : 'No items yet'}
            </h3>
            <p className="text-foreground/60 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your search or filters'
                : 'Add your first item to get started'}
            </p>
            {!hasActiveFilters && (
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth"
              >
                Add Item
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map(item => {
              const itemName =
                item.customName || item.foodItem?.name || 'Unknown Item';
              const category = item.foodItem?.category || 'custom';
              const expiryDate = item.expiryDate
                ? new Date(item.expiryDate)
                : null;
              const today = new Date();
              const daysUntilExpiry = expiryDate
                ? Math.ceil(
                    (expiryDate.getTime() - today.getTime()) /
                      (1000 * 60 * 60 * 24),
                  )
                : null;

              let expiryStatus = 'none';
              let expiryColor = 'text-foreground/60';
              if (daysUntilExpiry !== null) {
                if (daysUntilExpiry < 0) {
                  expiryStatus = 'expired';
                  expiryColor = 'text-red-600';
                } else if (daysUntilExpiry <= 3) {
                  expiryStatus = 'expiring-soon';
                  expiryColor = 'text-orange-600';
                } else {
                  expiryStatus = 'fresh';
                  expiryColor = 'text-green-600';
                }
              }

              return (
                <div
                  key={item.id}
                  className="bg-card rounded-xl border border-border p-4 hover:shadow-lg transition-smooth"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground mb-1">
                        {itemName}
                      </h3>
                      <p className="text-sm text-foreground/70 capitalize">
                        {category}
                      </p>
                    </div>
                    <button
                      onClick={() => handleConsumption(item)}
                      className="text-foreground/60 hover:text-red-600 transition-smooth"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="w-4 h-4 text-foreground/40" />
                      <span className="text-foreground">
                        Quantity: {item.quantity} {item.unit || 'units'}
                      </span>
                    </div>

                    {expiryDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4 text-foreground/40" />
                        <span className={expiryColor}>
                          {expiryStatus === 'expired'
                            ? `Expired ${Math.abs(daysUntilExpiry!)} days ago`
                            : expiryStatus === 'expiring-soon'
                            ? `Expires in ${daysUntilExpiry} days`
                            : `Expires ${expiryDate.toLocaleDateString()}`}
                        </span>
                      </div>
                    )}

                    {item.notes && (
                      <div className="flex items-start gap-2 text-sm">
                        <FileText className="w-4 h-4 text-foreground/40 mt-0.5" />
                        <span className="text-foreground/70 text-xs">
                          {item.notes}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Consumption Button */}
                  <button
                    onClick={() => handleConsumption(item)}
                    disabled={item.quantity <= 0 || item.id.startsWith('temp-')}
                    className={`w-full px-3 py-2 rounded-lg transition-smooth font-medium flex items-center justify-center gap-2 ${
                      item.quantity <= 0 || item.id.startsWith('temp-')
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-primary text-primary-foreground hover:bg-primary/90'
                    }`}
                    title={
                      item.id.startsWith('temp-')
                        ? 'Item is being saved, please wait...'
                        : undefined
                    }
                  >
                    <Utensils className="w-4 h-4" />
                    {item.quantity <= 0
                      ? 'Out of Stock'
                      : item.id.startsWith('temp-')
                      ? 'Saving...'
                      : 'Consume'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Consumption Modal */}
      {showConsumptionModal && selectedItem && (
        <ConsumptionModal
          item={selectedItem}
          onClose={() => {
            setShowConsumptionModal(false);
            setSelectedItem(null);
          }}
          onConsume={handleConsumptionSubmit}
        />
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <AddItemModal
          onClose={() => setShowAddModal(false)}
          onAdd={addItemMutation.mutate}
        />
      )}

      {/* Smart OCR Upload Modal */}
      {showImageUploadModal && (
        <ImageUploadModal
          inventoryId={inventoryId!}
          onClose={() => setShowImageUploadModal(false)}
          onSuccess={handleImageUploadSuccess}
        />
      )}
    </div>
  );
}

// ConsumptionModal Component
interface ConsumptionModalProps {
  item: InventoryItem;
  onClose: () => void;
  onConsume: (data: {
    quantity: number;
    unit?: string;
    notes?: string;
  }) => void;
}

function ConsumptionModal({ item, onClose, onConsume }: ConsumptionModalProps) {
  const [form, setForm] = useState({
    quantity: 1,
    unit: item.unit || '',
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const itemName = item.customName || item.foodItem?.name || 'Unknown Item';
  const maxQuantity = item.quantity;
  const remainingAfterConsumption = Math.max(0, maxQuantity - form.quantity);
  const willBeRemoved = remainingAfterConsumption === 0;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: name === 'quantity' ? Number(value) : value,
    }));
  };

  const handleConsumeAll = () => {
    setForm(prev => ({
      ...prev,
      quantity: maxQuantity,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.quantity <= 0) {
      setError('Quantity must be greater than 0');
      setLoading(false);
      return;
    }

    if (form.quantity > maxQuantity) {
      setError(`Cannot consume more than ${maxQuantity} ${item.unit}`);
      setLoading(false);
      return;
    }

    try {
      await onConsume({
        quantity: form.quantity,
        unit: form.unit,
        notes: form.notes || undefined,
      });
    } catch (err) {
      console.error('Error logging consumption:', err);
      setError('Failed to log consumption');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Log Consumption</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary/20 rounded-lg transition-smooth"
          >
            <X className="w-5 h-5 text-foreground/70" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <p className="text-sm text-foreground/70 mb-1">Item</p>
            <p className="font-medium text-foreground">{itemName}</p>
            <p className="text-sm text-foreground/60">
              Available: {maxQuantity} {item.unit || 'units'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Quantity Consumed
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="0"
                max={maxQuantity}
                step="0.01"
                className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                required
              />
              <button
                type="button"
                onClick={handleConsumeAll}
                className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-smooth text-sm font-medium"
              >
                All
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Unit (optional)
            </label>
            <input
              type="text"
              name="unit"
              value={form.unit}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
              placeholder={item.unit || 'e.g., kg, liters, pieces'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground resize-none"
              placeholder="Add any notes..."
            />
          </div>

          {remainingAfterConsumption > 0 && (
            <div className="p-3 bg-primary/5 rounded-lg">
              <p className="text-sm text-foreground/70">
                Remaining after consumption:{' '}
                <span className="font-medium text-foreground">
                  {remainingAfterConsumption} {item.unit || 'units'}
                </span>
              </p>
            </div>
          )}

          {willBeRemoved && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-600">
                ⚠️ This will remove the item from your inventory
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-smooth font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium disabled:opacity-50"
            >
              {loading ? 'Logging...' : 'Log Consumption'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// AddItemModal Component
interface AddItemModalProps {
  onClose: () => void;
  onAdd: (item: {
    foodItemId?: string;
    customName?: string;
    quantity: number;
    unit?: string;
    expiryDate?: Date;
    notes?: string;
  }) => void;
}

function AddItemModal({ onClose, onAdd }: AddItemModalProps) {
  const [form, setForm] = useState({
    selectedFoodItemId: '',
    customName: '',
    quantity: 0,
    unit: '',
    expirationDate: '',
    notes: '',
    useCustomItem: false,
  });
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [loadingFoodItems, setLoadingFoodItems] = useState(true);

  useEffect(() => {
    const fetchFoodItems = async () => {
      try {
        const API_URL =
          import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await fetch(`${API_URL}/foods`);
        const data = await response.json();
        setFoodItems(data.data || []);
      } catch (err) {
        console.error('Error fetching food items:', err);
      } finally {
        setLoadingFoodItems(false);
      }
    };

    fetchFoodItems();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      setForm(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
        selectedFoodItemId: '',
        customName: '',
      }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }

    if (name === 'selectedFoodItemId' && value) {
      const selectedItem = foodItems.find(item => item.id === value);
      if (selectedItem) {
        setForm(prev => ({
          ...prev,
          unit: selectedItem.unit || prev.unit,
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const itemData: any = {
        quantity: Number(form.quantity),
        unit: form.unit,
        notes: form.notes || undefined,
      };

      if (form.expirationDate) {
        itemData.expiryDate = new Date(form.expirationDate);
      }

      if (form.useCustomItem) {
        if (!form.customName.trim()) {
          setError('Custom item name is required');
          setLoading(false);
          return;
        }
        itemData.customName = form.customName;
      } else {
        if (!form.selectedFoodItemId) {
          setError('Please select a food item');
          setLoading(false);
          return;
        }
        itemData.foodItemId = form.selectedFoodItemId;
      }

      await onAdd(itemData);
      onClose();
    } catch (err) {
      setError('Failed to add item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            Add Item to Inventory
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary/20 rounded-lg transition-smooth"
          >
            <X className="w-5 h-5 text-foreground/70" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="useCustomItem"
              name="useCustomItem"
              checked={form.useCustomItem}
              onChange={handleChange}
              className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary"
            />
            <label
              htmlFor="useCustomItem"
              className="text-sm font-medium text-foreground"
            >
              Add custom item (not in database)
            </label>
          </div>

          {form.useCustomItem ? (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Item Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="customName"
                value={form.customName}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                placeholder="Enter item name"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Select Food Item <span className="text-red-500">*</span>
              </label>
              {loadingFoodItems ? (
                <p className="text-sm text-foreground/60">
                  Loading food items...
                </p>
              ) : (
                <select
                  name="selectedFoodItemId"
                  value={form.selectedFoodItemId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                  required
                >
                  <option value="">Select an item</option>
                  {foodItems.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} {item.category && `(${item.category})`}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={form.quantity}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Unit
              </label>
              <input
                type="text"
                name="unit"
                value={form.unit}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
                placeholder="e.g., kg, liters, pieces"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Expiration Date (optional)
            </label>
            <input
              type="date"
              name="expirationDate"
              value={form.expirationDate}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Notes (optional)
            </label>
            <textarea
              name="notes"
              value={form.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground resize-none"
              placeholder="Add any additional notes..."
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-smooth font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingFoodItems}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
