import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SearchIcon, ShoppingCartIcon, LogOutIcon, PackageIcon, SettingsIcon, HeartIcon, ChevronDownIcon, LayoutDashboard, Store, ShieldCheckIcon, MenuIcon, XIcon } from 'lucide-react';
import { useCart } from '../../lib/cartContext';

import { useTranslation } from 'react-i18next';

import { useAuth } from '../../lib/authContext';

export function Navbar() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { items } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate('/products');
    }
  };

  const navLinks = [
    { to: '/products', label: t('nav.catalog') },
    // Only show these based on roles later
  ];

  if (user?.role === 'SELLER') {
    navLinks.push({ to: '/seller', label: t('nav.myShop') });
  }

  if (user?.role === 'ADMIN') {
    navLinks.push({ to: '/admin', label: t('nav.admin') });
  }

  if (user?.role === 'MILITARY_UNIT') {
    navLinks.push({ to: '/military', label: t('nav.military') });
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-cream border-b-2 border-tactical shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <span className="border-2 border-slate px-3 py-1 font-black text-lg tracking-stencil text-slate group-hover:bg-slate group-hover:text-white transition-colors">
              MILHUB
            </span>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('nav.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-sm shadow-inner text-sm placeholder:text-gray-400 focus:outline-none focus:border-tactical focus:ring-1 focus:ring-tactical transition-all"
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`
                  text-xs font-semibold uppercase tracking-wider
                  transition-colors duration-150
                  ${location.pathname.startsWith(link.to) ? 'text-tactical border-b-2 border-tactical pb-0.5' : 'text-slate hover:text-tactical'}
                `}
              >
                {link.label}
              </Link>
            ))}

            {/* Language Switcher */}
            <div className="flex items-center gap-2 border-r border-slate/20 pr-4 mr-2">
              <button
                onClick={() => i18n.changeLanguage('en')}
                className={`text-xs font-bold transition-colors ${i18n.language === 'en' ? 'text-tactical' : 'text-gray-400 hover:text-slate'}`}
              >
                EN
              </button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => i18n.changeLanguage('uk')}
                className={`text-xs font-bold transition-colors ${i18n.language === 'uk' ? 'text-tactical' : 'text-gray-400 hover:text-slate'}`}
              >
                UK
              </button>
            </div>

            {/* Cart Icon */}
            <Link to="/cart" className="relative group p-1">
              <ShoppingCartIcon className="w-5 h-5 text-slate group-hover:text-tactical transition-colors" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* User Dropdown or Sign In */}
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-tactical text-white flex items-center justify-center font-bold text-xs ring-2 ring-transparent hover:ring-tactical/20 transition-all">
                      {user.firstName?.[0] || 'U'}{user.lastName?.[0] || 'N'}
                    </div>
                    {user.isVerified && (
                      <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-slate leading-none">{user.firstName || 'User'} {user.lastName || ''}</p>
                  </div>
                  <ChevronDownIcon className={`w-3 h-3 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-sm border border-slate/10 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* Header */}
                    <div className="px-4 py-3 bg-slate/5 border-b border-slate/10">
                      <p className="text-sm font-bold text-slate">{user.firstName || 'User'} {user.lastName || ''}</p>
                      {user.isVerified ? (
                        <p className={`text-xs font-medium flex items-center gap-1 mt-0.5 ${user.role === 'MILITARY_UNIT' ? 'text-green-600' :
                          user.role === 'SELLER' ? 'text-blue-600' :
                            user.role === 'ADMIN' ? 'text-purple-600' :
                              'text-gray-600'
                          }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${user.role === 'MILITARY_UNIT' ? 'bg-green-500' :
                            user.role === 'SELLER' ? 'bg-blue-500' :
                              user.role === 'ADMIN' ? 'bg-purple-500' :
                                'bg-gray-500'
                            }`}></span>
                          {user.role === 'MILITARY_UNIT' ? t('auth.verifiedMilitary') :
                            user.role === 'SELLER' ? t('auth.verifiedSeller') :
                              user.role === 'ADMIN' ? t('auth.adminRole') :
                                t('auth.verifiedAccount')}
                        </p>
                      ) : (
                        <p className="text-xs text-amber font-medium flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 bg-amber rounded-full"></span>
                          {t('auth.unverified')}
                        </p>
                      )}
                    </div>

                    {/* Links */}
                    <div className="py-1">
                      {user.role === 'ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-slate/5 hover:text-tactical transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4" />
                          {t('userMenu.adminPanel')}
                        </Link>
                      )}

                      {user.role === 'SELLER' && (
                        <Link
                          to="/seller"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-slate/5 hover:text-tactical transition-colors"
                        >
                          <Store className="w-4 h-4" />
                          {t('userMenu.myShop')}
                        </Link>
                      )}

                      {user.role === 'MILITARY_UNIT' && (
                        <Link
                          to="/military"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-slate/5 hover:text-tactical transition-colors"
                        >
                          <ShieldCheckIcon className="w-4 h-4" />
                          {t('userMenu.militaryDashboard')}
                        </Link>
                      )}

                      <div className="h-px bg-slate/10 my-1 mx-4" />

                      <Link
                        to="/dashboard"
                        state={{ tab: 'orders' }}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-slate/5 hover:text-tactical transition-colors"
                      >
                        <PackageIcon className="w-4 h-4" />
                        {t('userMenu.myOrders')}
                      </Link>
                      <Link
                        to="/dashboard"
                        state={{ tab: 'profile' }}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-slate/5 hover:text-tactical transition-colors"
                      >
                        <SettingsIcon className="w-4 h-4" />
                        {t('userMenu.profileSettings')}
                      </Link>
                      <Link
                        to="/dashboard"
                        state={{ tab: 'wishlist' }}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-slate/5 hover:text-tactical transition-colors"
                      >
                        <HeartIcon className="w-4 h-4" />
                        {t('userMenu.wishlist')}
                      </Link>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate/10 bg-gray-50 p-1">
                      <button
                        onClick={() => {
                          logout();
                          setIsDropdownOpen(false);
                          // Force navigation to home with reload as requested
                          window.location.href = '/';
                        }}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-bold text-cream bg-amber hover:bg-amber-dark rounded-sm transition-colors"
                      >
                        <LogOutIcon className="w-3 h-3" />
                        {t('auth.signOut')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link to="/login" className="text-xs font-bold uppercase tracking-wider text-tactical hover:text-slate transition-colors">
                {t('auth.signIn')}
              </Link>
            )}
          </nav>

          {/* Mobile Menu Toggle & Cart */}
          <div className="flex md:hidden items-center gap-4">
            {/* Language Switcher (Mobile) */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => i18n.changeLanguage('en')}
                className={`text-xs font-bold transition-colors ${i18n.language === 'en' ? 'text-tactical' : 'text-gray-400'}`}
              >EN</button>
              <span className="text-gray-300">|</span>
              <button
                onClick={() => i18n.changeLanguage('uk')}
                className={`text-xs font-bold transition-colors ${i18n.language === 'uk' ? 'text-tactical' : 'text-gray-400'}`}
              >UK</button>
            </div>

            <Link to="/cart" className="relative p-1">
              <ShoppingCartIcon className="w-5 h-5 text-slate" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 focus:outline-none">
              {isMobileMenuOpen ? <XIcon className="w-6 h-6 text-slate" /> : <MenuIcon className="w-6 h-6 text-slate" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t-2 border-slate/10 bg-white">
          <div className="px-4 pt-4 pb-6 space-y-4">
            {/* Mobile Search */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={t('nav.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-border rounded-sm text-sm focus:outline-none focus:border-tactical"
              />
            </div>

            {/* Mobile Links */}
            <div className="flex flex-col gap-4 pt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-sm font-bold uppercase ${location.pathname.startsWith(link.to) ? 'text-tactical' : 'text-slate'}`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            <div className="border-t border-slate/10 pt-4 mt-2">
              {isAuthenticated && user ? (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-tactical text-white flex items-center justify-center font-bold text-sm">
                      {user.firstName?.[0] || 'U'}{user.lastName?.[0] || 'N'}
                    </div>
                    <div>
                      <p className="font-bold text-slate">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>

                  <Link to="/dashboard" state={{ tab: 'orders' }} className="flex items-center gap-3 text-sm font-bold text-slate">
                    <PackageIcon className="w-4 h-4" /> {t('userMenu.myOrders')}
                  </Link>
                  <Link to="/dashboard" state={{ tab: 'profile' }} className="flex items-center gap-3 text-sm font-bold text-slate">
                    <SettingsIcon className="w-4 h-4" /> {t('userMenu.profileSettings')}
                  </Link>

                  <button
                    onClick={() => { logout(); window.location.href = '/'; }}
                    className="flex items-center gap-2 mt-4 px-4 py-2 bg-slate text-white text-sm font-bold rounded-sm justify-center"
                  >
                    <LogOutIcon className="w-4 h-4" /> {t('auth.signOut')}
                  </button>
                </div>
              ) : (
                <Link to="/login" className="flex items-center justify-center py-3 bg-tactical text-white font-bold uppercase rounded-sm">
                  {t('auth.signIn')}
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}