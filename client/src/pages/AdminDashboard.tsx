import { BookOpen, Package, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import AddFoodModal from '../components/admin/AddFoodModal';
import AddResourceModal from '../components/admin/AddResourceModal';

export default function AdminDashboard() {
  const [showAddFoodModal, setShowAddFoodModal] = useState(false);
  const [showAddResourceModal, setShowAddResourceModal] = useState(false);

  return (
    <AdminProtectedRoute>
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Admin Dashboard
            </h1>
            <p className="text-foreground/70">
              Manage food items and resources for the platform
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-foreground/70">Total Food Items</p>
                  <p className="text-2xl font-bold text-foreground">1,234</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-foreground/70">Total Resources</p>
                  <p className="text-2xl font-bold text-foreground">89</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-foreground/70">Active Users</p>
                  <p className="text-2xl font-bold text-foreground">456</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-foreground/70">This Month</p>
                  <p className="text-2xl font-bold text-foreground">+12%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card rounded-xl border border-border p-6 mb-8">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => setShowAddFoodModal(true)}
                className="p-6 border-2 border-dashed border-primary/30 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <Package className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Add Food Item
                  </h3>
                  <p className="text-sm text-foreground/70">
                    Add new food items to the database with nutritional
                    information
                  </p>
                </div>
              </button>

              <button
                onClick={() => setShowAddResourceModal(true)}
                className="p-6 border-2 border-dashed border-primary/30 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors group"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <BookOpen className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Add Resource
                  </h3>
                  <p className="text-sm text-foreground/70">
                    Add educational resources and guides for users
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Recent Activity
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-secondary/10 rounded-lg">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    New food item added
                  </p>
                  <p className="text-sm text-foreground/70">
                    Organic Quinoa was added to the database
                  </p>
                </div>
                <span className="text-sm text-foreground/70">2 hours ago</span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-secondary/10 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    Resource updated
                  </p>
                  <p className="text-sm text-foreground/70">
                    Meal Planning Guide was updated with new content
                  </p>
                </div>
                <span className="text-sm text-foreground/70">5 hours ago</span>
              </div>

              <div className="flex items-center gap-4 p-4 bg-secondary/10 rounded-lg">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-foreground">
                    New user registered
                  </p>
                  <p className="text-sm text-foreground/70">
                    15 new users joined the platform today
                  </p>
                </div>
                <span className="text-sm text-foreground/70">1 day ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        {showAddFoodModal && (
          <AddFoodModal onClose={() => setShowAddFoodModal(false)} />
        )}

        {showAddResourceModal && (
          <AddResourceModal onClose={() => setShowAddResourceModal(false)} />
        )}
      </div>
    </AdminProtectedRoute>
  );
}
