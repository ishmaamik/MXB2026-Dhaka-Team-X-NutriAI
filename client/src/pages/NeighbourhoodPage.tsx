import { useState } from "react";
import { Package, Plus, List, Search } from 'lucide-react';
import AvailableListings from '../components/neighbourhood/AvailableListings';
import CreateListing from '../components/neighbourhood/CreateListing';
import MyListings from '../components/neighbourhood/MyListings';

type TabType = 'available' | 'create' | 'my-listings';

export default function NeighbourhoodPage() {
  const [activeTab, setActiveTab] = useState<TabType>('available');

  const tabs = [
    {
      id: 'available' as TabType,
      label: 'Browse Food',
      icon: Search,
      description: 'Find food shared by neighbors'
    },
    {
      id: 'create' as TabType,
      label: 'Share Food',
      icon: Plus,
      description: 'Share your surplus'
    },
    {
      id: 'my-listings' as TabType,
      label: 'My Listings',
      icon: List,
      description: 'Manage your shares'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Neighbourhood</h1>
        </div>
        <p className="text-foreground/70 text-lg">
          Connect with your community and share food surplus to reduce waste together.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-card rounded-xl border border-border p-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-lg transition-all duration-200 text-left ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-secondary/10 text-foreground/80 hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <Icon className={`w-5 h-5 ${
                    activeTab === tab.id ? 'text-primary-foreground' : 'text-primary'
                  }`} />
                  <span className="font-medium">{tab.label}</span>
                </div>
                <p className={`text-sm ${
                  activeTab === tab.id 
                    ? 'text-primary-foreground/80' 
                    : 'text-foreground/60'
                }`}>
                  {tab.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {activeTab === 'available' && <AvailableListings />}
        {activeTab === 'create' && <CreateListing />}
        {activeTab === 'my-listings' && <MyListings />}
      </div>

      {/* Footer Info */}
      <div className="bg-secondary/5 rounded-xl border border-border p-6">
        <h3 className="font-semibold text-foreground mb-2">
          How Food Sharing Works
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-foreground/70">
          <div>
            <div className="font-medium text-foreground mb-1">1. Share</div>
            <p>List surplus food items from your inventory that you want to give away for free.</p>
          </div>
          <div>
            <div className="font-medium text-foreground mb-1">2. Connect</div>
            <p>Browse available food from neighbors and claim items you can use.</p>
          </div>
          <div>
            <div className="font-medium text-foreground mb-1">3. Reduce Waste</div>
            <p>Complete the exchange and help reduce food waste in your community.</p>
          </div>
        </div>
      </div>
    </div>
  );
}