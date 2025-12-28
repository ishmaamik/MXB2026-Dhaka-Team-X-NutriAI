import { useAuth, useClerk } from '@clerk/clerk-react';
import { Leaf, LogOut, Menu, Settings, User, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { isSignedIn, userId } = useAuth();
  const { signOut } = useClerk();
  const userMenuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleUserMenu = () => setIsUserMenuOpen(!isUserMenuOpen);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Impact', href: '#impact' },
  ];

  return (
    <nav className="fixed top-0 w-full bg-background/95 backdrop-blur-md border-b border-border z-50 transition-smooth">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 bg-gradient-to-br from-[#2D5A27] to-[#8FBC8F] rounded-xl flex items-center justify-center shadow-sm">
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl text-foreground hidden sm:inline">
              NutriTrack
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                className="text-foreground/70 hover:text-primary transition-smooth text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {isSignedIn ? (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={toggleUserMenu}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-secondary transition-smooth border border-transparent hover:border-border"
                >
                  <User className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Account</span>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-xl shadow-lg py-2 z-50">
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-smooth text-foreground"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Settings className="w-4 h-4 text-primary" />
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-secondary transition-smooth text-foreground"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4 text-primary" />
                      Profile
                    </Link>
                    <div className="border-t border-border my-1"></div>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 transition-smooth w-full text-left text-foreground hover:text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/sign-in"
                  className="text-foreground/80 hover:text-primary transition-smooth text-sm font-medium px-4 py-2"
                >
                  Log In
                </Link>
                <Link
                  to="/sign-up"
                  className="px-5 py-2.5 bg-gradient-to-r from-[#A67B5B] to-[#8B5A3C] text-white rounded-xl hover:opacity-90 transition-smooth text-sm font-medium shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            onClick={toggleMenu}
            className="md:hidden text-foreground hover:text-primary transition-smooth p-2"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 border-t border-border">
            <div className="flex flex-col gap-2 pt-4">
              {navLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-foreground/80 hover:text-primary transition-smooth text-sm font-medium px-4 py-3 rounded-lg hover:bg-secondary"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 px-4 mt-2 pt-4 border-t border-border">
                {isSignedIn ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-smooth rounded-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      <Settings className="w-4 h-4 text-primary" />
                      Dashboard
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-secondary transition-smooth rounded-lg"
                      onClick={() => setIsOpen(false)}
                    >
                      <User className="w-4 h-4 text-primary" />
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        signOut();
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-sm hover:bg-red-50 hover:text-red-600 transition-smooth rounded-lg w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/sign-in"
                      className="text-center text-foreground/80 hover:text-primary transition-smooth text-sm font-medium py-3 rounded-lg hover:bg-secondary"
                    >
                      Log In
                    </Link>
                    <Link
                      to="/sign-up"
                      className="text-center px-4 py-3 bg-gradient-to-r from-[#A67B5B] to-[#8B5A3C] text-white rounded-xl hover:opacity-90 transition-smooth text-sm font-medium"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
