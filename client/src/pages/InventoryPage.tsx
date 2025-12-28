import { useState, useEffect } from 'react';
import { Plus, Package, Calendar, AlertCircle, Apple, ShoppingCart, Utensils, ArrowRight } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useInventory } from '../hooks/useInventory';

import { useNavigate } from 'react-router-dom';
export interface Inventory {
  id: string;
  name: string;
  description?: string;
  isPrivate?: boolean;
  createdAt: string;
  updatedAt: string;
}
export default function InventoryPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { useGetInventories, useCreateInventory } = useInventory();
  const { data: inventories, isLoading, isError, refetch } = useGetInventories();

  // Create inventory mutation
  const createInventoryMutation = useCreateInventory();

  useEffect(() => {
    if (!isLoading && !isError) {
      setLoading(false);
    }
  }, [isLoading, isError]);

  const handleCreateInventory = async (inventoryData: Omit<Inventory, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await createInventoryMutation.mutateAsync(inventoryData);
      setShowAddModal(false);
      // No need to manually refetch, mutation will invalidate the query
    } catch (err) {
      console.error('Error creating inventory:', err);
      setError('Failed to create inventory');
    }
  };

  const filteredInventories = inventories?.filter(inv =>
    inv.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading && loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-foreground/70">Loading inventories...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-xl max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-red-800 mb-2">Error Loading Inventories</h3>
          <p className="text-red-600 mb-4">Failed to fetch your inventories. Please try again later.</p>
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
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#A67B5B] to-[#8B5A3C] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">My Inventories</h1>
            <p className="text-sm text-foreground/70">Manage your inventory collections</p>
          </div>
        </div>
        <button
          className="px-4 py-2 bg-gradient-to-r from-[#A67B5B] to-[#8B5A3C] text-white rounded-xl hover:opacity-90 transition-smooth font-medium flex items-center gap-2 shadow-sm"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4" /> Create Inventory
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#A67B5B]/10 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-[#A67B5B]" />
              </div>
              <div>
                <p className="text-sm text-foreground/70">Total Inventories</p>
                <p className="text-2xl font-bold text-foreground">{inventories?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#8FBC8F]/20 rounded-xl flex items-center justify-center">
                <Apple className="w-5 h-5 text-[#2D5A27]" />
              </div>
              <div>
                <p className="text-sm text-foreground/70">Active</p>
                <p className="text-2xl font-bold text-foreground">{inventories?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFF8DC] rounded-xl flex items-center justify-center">
                <Utensils className="w-5 h-5 text-[#A67B5B]" />
              </div>
              <div>
                <p className="text-sm text-foreground/70">Items</p>
                <p className="text-2xl font-bold text-foreground">0</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search bar */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search inventories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-red-500 mb-4 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {filteredInventories.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No inventories found</h3>
            <p className="text-foreground/60 mb-4">Get started by creating your first inventory</p>
            <button
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium"
              onClick={() => setShowAddModal(true)}
            >
              Create Inventory
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInventories.map(inventory => (
              <div
                key={inventory.id}
                className="bg-card rounded-xl border border-border p-6 shadow hover:shadow-lg transition-smooth cursor-pointer"
                onClick={() => navigate(`/inventory/${inventory.id}`)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Package className="w-6 h-6 text-primary" />
                    <span className="font-bold text-lg text-foreground">{inventory.name}</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-foreground/70" />
                </div>

                <div className="space-y-2 text-sm">
                  {inventory.description && (
                    <div className="text-foreground/70 line-clamp-2">{inventory.description}</div>
                  )}
                  <div className="flex items-center gap-4 text-foreground/60 text-xs">
                    <div className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      <span>0 items</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>0 expiring</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Inventory Modal */}
      {showAddModal && (
        <CreateInventoryModal
          onClose={() => setShowAddModal(false)}
          onCreate={handleCreateInventory}
        />
      )}
    </div>
  );
}

interface CreateInventoryModalProps {
  onClose: () => void;
  onCreate: (inventory: Omit<Inventory, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

function CreateInventoryModal({ onClose, onCreate }: CreateInventoryModalProps) {
  const [form, setForm] = useState<Omit<Inventory, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm({
      ...form,
      [name]: value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!form.name.trim()) {
      setError('Inventory name is required');
      setLoading(false);
      return;
    }

    try {
      await onCreate({
        name: form.name,
        description: form.description
      });
    } catch (err) {
      setError('Failed to create inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/60 backdrop-blur-md flex items-center justify-center z-50">
      <form
        className="bg-card rounded-2xl border border-border shadow-xl p-8 w-full max-w-md"
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-bold text-foreground mb-4">Create New Inventory</h2>

        {error && (
          <div className="text-red-500 mb-4 p-2 bg-red-50 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-col gap-3">
          <input
            name="name"
            required
            placeholder="Inventory name"
            value={form.name}
            onChange={handleChange}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          />

          <textarea
            name="description"
            placeholder="Description (optional)"
            value={form.description}
            onChange={handleChange}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            rows={2}
          />
        </div>

        <div className="flex gap-2 mt-6">
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-smooth font-medium flex-1"
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-card border border-border text-foreground rounded-lg hover:bg-secondary/10 transition-smooth font-medium flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}