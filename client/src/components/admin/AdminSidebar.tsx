import { LayoutDashboard, Activity } from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function AdminSidebar({
  activeTab,
  onTabChange,
}: AdminSidebarProps) {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'system-health', label: 'System Health', icon: Activity },
    // Future items
    // { id: 'food-items', label: 'Food Items', icon: Package },
    // { id: 'resources', label: 'Resources', icon: BookOpen },
  ];

  return (
    <div className="w-64 bg-card border-r border-border min-h-screen p-4 hidden md:block">
      <div className="mb-8 px-4">
        <h2 className="text-xl font-bold text-foreground">Admin Portal</h2>
        <p className="text-sm text-foreground/70">Management Dashboard</p>
      </div>

      <nav className="space-y-1">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === item.id
                ? 'bg-primary/10 text-primary'
                : 'text-foreground/70 hover:bg-secondary/50 hover:text-foreground'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
