import { UserButton, useClerk, useUser } from '@clerk/clerk-react';
import {
  BookMarked,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Leaf,
  LogOut,
  Package,
  Shield,
  User,
  Users,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'AI Intelligence',
    to: '/intelligence',
    icon: Brain,
  },
  {
    label: 'Daily Log',
    to: '/daily-log',
    icon: BookOpen,
  },
  {
    label: 'Inventory',
    to: '/inventory',
    icon: Package,
  },
  {
    label: 'Resources',
    to: '/resources',
    icon: BookMarked,
  },
  {
    label: 'Neighbourhood',
    to: '/neighbourhood',
    icon: Users,
  },
];

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed }: SidebarProps) {
  const location = useLocation();
  const { signOut } = useClerk();
  const { user } = useUser();

  // Check if user has admin role
  const isAdmin = user?.publicMetadata?.role === 'admin';

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside
      className={`h-screen fixed left-0 top-0 z-20 bg-card border-r border-border transition-all duration-300 ease-in-out ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header with collapse button */}
        <div className="relative">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center flex-shrink-0 shadow-sm">
                <Leaf className="w-5 h-5 text-primary-foreground" />
              </div>
              <div
                className={`font-bold text-lg text-foreground truncate transition-opacity duration-200 ${
                  collapsed ? 'opacity-0 w-0' : 'opacity-100'
                }`}
              >
                NutriTrack
              </div>
            </div>
            {!collapsed && (
              <button
                aria-label="Collapse sidebar"
                onClick={() => setCollapsed(true)}
                className="p-1.5 rounded-lg hover:bg-secondary/20 text-foreground/70 hover:text-foreground transition-all duration-200 flex-shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* External expand button when collapsed */}
          {collapsed && (
            <button
              aria-label="Expand sidebar"
              onClick={() => setCollapsed(false)}
              className="absolute -right-3 top-6 w-6 h-6 rounded-full bg-card border border-border hover:bg-secondary/20 text-foreground transition-all duration-200 flex items-center justify-center shadow-lg z-30"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="flex flex-col gap-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to;

              return (
                <Link key={item.to} to={item.to} className="no-underline">
                  <button
                    className={`w-full flex items-center gap-3 h-11 rounded-lg transition-all duration-200 ${
                      collapsed ? 'px-0 justify-center' : 'px-3 justify-start'
                    } ${
                      isActive
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm'
                        : 'text-foreground/70 hover:bg-secondary/20 hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span
                      className={`truncate transition-all duration-200 font-medium ${
                        collapsed ? 'opacity-0 w-0' : 'opacity-100'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-border bg-secondary/5">
          <div className="flex flex-col gap-1">
            {/* Admin Dashboard - only show for admin users */}
            {isAdmin && (
              <Link to="/admin" className="no-underline">
                <button
                  className={`w-full flex items-center gap-3 h-10 rounded-lg transition-all duration-200 ${
                    location.pathname === '/admin'
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground/70 hover:bg-secondary/20 hover:text-foreground'
                  } ${
                    collapsed ? 'px-0 justify-center' : 'px-3 justify-start'
                  }`}
                >
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span
                    className={`transition-all duration-200 ${
                      collapsed ? 'opacity-0 w-0' : 'opacity-100'
                    }`}
                  >
                    Admin Dashboard
                  </span>
                </button>
              </Link>
            )}

            {/* Profile */}
            <Link to="/profile" className="no-underline">
              <button
                className={`w-full flex items-center gap-3 h-10 rounded-lg text-foreground/70 hover:bg-secondary/20 hover:text-foreground transition-all duration-200 ${
                  collapsed ? 'px-0 justify-center' : 'px-3 justify-start'
                }`}
              >
                <User className="w-4 h-4 flex-shrink-0" />
                <span
                  className={`transition-all duration-200 ${
                    collapsed ? 'opacity-0 w-0' : 'opacity-100'
                  }`}
                >
                  Profile
                </span>
              </button>
            </Link>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className={`w-full flex items-center gap-3 h-10 rounded-lg text-foreground/70 hover:bg-red-50 hover:text-red-600 transition-all duration-200 ${
                collapsed ? 'px-0 justify-center' : 'px-3 justify-start'
              }`}
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span
                className={`transition-all duration-200 ${
                  collapsed ? 'opacity-0 w-0' : 'opacity-100'
                }`}
              >
                Logout
              </span>
            </button>
          </div>

          {/* Clerk User Button (only when expanded)
          {!collapsed && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="flex items-center gap-3 px-3">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: 'w-8 h-8',
                    },
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    Your Account
                  </p>
                  <p className="text-xs text-foreground/60 truncate">
                    Manage settings
                  </p>
                </div>
              </div>
            </div>
          )} */}
        </div>
      </div>
    </aside>
  );
}
