import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
  BellIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  FolderIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  MoonIcon,
  ShieldCheckIcon,
  SunIcon,
  UserCircleIcon,
  UserGroupIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import notificationService from '../services/notificationService';
import Avatar from '../ui/Avatar';

const navGroups = [
  {
    label: 'Overview',
    items: [{ name: 'Dashboard', to: '/dashboard', icon: HomeIcon }],
  },
  {
    label: 'Discover',
    items: [
      { name: 'Clubs', to: '/browse-clubs', icon: UserGroupIcon },
      { name: 'Events', to: '/browse-events', icon: CalendarDaysIcon },
    ],
  },
  {
    label: 'Manage',
    items: [
      { name: 'My clubs', to: '/my-clubs', icon: UserGroupIcon },
      { name: 'My events', to: '/my-events', icon: CalendarDaysIcon },
      { name: 'Announcements', to: '/announcements', icon: MegaphoneIcon },
      { name: 'Payments', to: '/payment-history', icon: CreditCardIcon },
    ],
  },
  {
    label: 'Community',
    items: [
      { name: 'Feedback', to: '/feedback', icon: ChatBubbleLeftRightIcon },
      { name: 'My reports', to: '/my-reports', icon: ShieldCheckIcon },
      { name: 'Files', to: '/files', icon: FolderIcon },
      { name: 'Notifications', to: '/notifications', icon: BellIcon },
    ],
  },
  {
    label: 'Account',
    items: [
      { name: 'Profile', to: '/profile', icon: UserCircleIcon },
      { name: 'Settings', to: '/settings', icon: Cog6ToothIcon },
    ],
  },
];

const adminGroup = {
  label: 'Administration',
  items: [
    { name: 'Overview', to: '/admin/dashboard', icon: AcademicCapIcon },
    { name: 'Users', to: '/admin/users', icon: UserGroupIcon },
    { name: 'Club approvals', to: '/admin/clubs', icon: ClipboardDocumentListIcon },
    { name: 'Payments', to: '/admin/payments', icon: CreditCardIcon },
    { name: 'Announcements', to: '/admin/announcements', icon: MegaphoneIcon },
    { name: 'Reports', to: '/admin/reports', icon: ShieldCheckIcon },
    { name: 'Feedback', to: '/admin/feedback', icon: ChatBubbleLeftRightIcon },
  ],
};

const SidebarLink = ({ item, onNavigate }) => {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-[10px] px-3 py-2 text-sm font-medium transition-colors ${
          isActive
            ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-300'
            : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`h-[18px] w-[18px] shrink-0 ${
              isActive
                ? 'text-brand-600 dark:text-brand-400'
                : 'text-ink-400 group-hover:text-ink-600 dark:text-ink-500 dark:group-hover:text-ink-300'
            }`}
            aria-hidden="true"
          />
          <span className="truncate">{item.name}</span>
        </>
      )}
    </NavLink>
  );
};

const Sidebar = ({ user, onNavigate }) => {
  const groups = user?.role === 'admin' ? [...navGroups, adminGroup] : navGroups;

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-ink-200 px-5 dark:border-ink-800">
        <Link to="/dashboard" className="flex items-center gap-2.5" onClick={onNavigate}>
          <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-sm">
            <AcademicCapIcon className="h-5 w-5" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-[15px] font-semibold leading-tight text-ink-900 dark:text-white">
              CampusHub
            </span>
            <span className="block text-[11px] leading-tight text-ink-500 dark:text-ink-400">
              University clubs
            </span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5" aria-label="Primary">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-400 dark:text-ink-500">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <SidebarLink key={item.to} item={item} onNavigate={onNavigate} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-ink-200 p-3 dark:border-ink-800">
        <Link
          to="/profile"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-[10px] px-2 py-2 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800"
        >
          <Avatar name={`${user?.firstName || ''} ${user?.lastName || ''}`} src={user?.profilePicture} size="sm" />
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-ink-900 dark:text-white">
              {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Student' : 'Student'}
            </span>
            <span className="block truncate text-xs text-ink-500 dark:text-ink-400">
              {user?.email || 'Signed in'}
            </span>
          </span>
        </Link>
      </div>
    </div>
  );
};

const AppShell = ({ children }) => {
  const { user, logout } = useAuth();
  const { isDark, updateTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const userMenuRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setUserMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const stats = await notificationService.getNotificationStats();
        if (active) setUnread(stats?.unread || 0);
      } catch (error) {
        /* notifications are non-critical for the shell */
      }
    };
    load();
    const interval = setInterval(load, 60000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user
    ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Student'
    : 'Student';

  const currentNav = [...navGroups, adminGroup]
    .flatMap((group) => group.items)
    .find((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));

  return (
    <div className="min-h-screen bg-ink-50 dark:bg-[#0b1220]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] border-r border-ink-200 bg-white lg:block dark:border-ink-800 dark:bg-ink-950">
        <Sidebar user={user} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div
            className="absolute inset-0 bg-ink-950/40 backdrop-blur-[1px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-[280px] animate-slide-up bg-white shadow-pop dark:bg-ink-950">
            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3.5 rounded-[10px] p-2 text-ink-500 hover:bg-ink-100 dark:text-ink-400 dark:hover:bg-ink-800"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
            <Sidebar user={user} onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="lg:pl-[264px]">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-ink-200 bg-white/85 px-4 backdrop-blur-md sm:px-6 lg:px-8 dark:border-ink-800 dark:bg-ink-950/85">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            className="rounded-[10px] p-2 text-ink-600 hover:bg-ink-100 lg:hidden dark:text-ink-300 dark:hover:bg-ink-800"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 items-center gap-2 text-sm">
            <span className="hidden text-ink-400 sm:inline dark:text-ink-500">CampusHub</span>
            <span className="hidden text-ink-300 sm:inline dark:text-ink-600">/</span>
            <span className="truncate font-medium text-ink-900 dark:text-white">
              {currentNav?.name || 'Dashboard'}
            </span>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Link
              to="/browse-clubs"
              className="hidden h-9 items-center gap-2 rounded-[10px] border border-ink-200 bg-white px-3 text-sm text-ink-500 transition-colors hover:border-ink-300 hover:text-ink-700 md:flex dark:border-ink-800 dark:bg-ink-900 dark:text-ink-400 dark:hover:text-white"
            >
              <MagnifyingGlassIcon className="h-4 w-4" aria-hidden="true" />
              <span className="pr-8">Search clubs</span>
            </Link>

            <button
              type="button"
              onClick={() => updateTheme(isDark ? 'light' : 'dark')}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="rounded-[10px] p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white"
            >
              {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
            </button>

            <Link
              to="/notifications"
              aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
              className="relative rounded-[10px] p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-ink-800 dark:hover:text-white"
            >
              <BellIcon className="h-5 w-5" />
              {unread > 0 ? (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-600 px-1 text-[10px] font-semibold text-white">
                  {unread > 99 ? '99+' : unread}
                </span>
              ) : null}
            </Link>

            <div className="relative ml-1" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                className="flex items-center gap-2 rounded-[10px] p-1 pr-2 transition-colors hover:bg-ink-100 dark:hover:bg-ink-800"
              >
                <Avatar
                  name={displayName}
                  src={user?.profilePicture}
                  size="sm"
                />
                <span className="hidden max-w-[140px] truncate text-sm font-medium text-ink-700 sm:block dark:text-ink-200">
                  {displayName}
                </span>
              </button>

              {userMenuOpen ? (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-60 animate-fade-in overflow-hidden rounded-card border border-ink-200 bg-white shadow-pop dark:border-ink-800 dark:bg-ink-900"
                >
                  <div className="border-b border-ink-100 px-4 py-3 dark:border-ink-800">
                    <p className="truncate text-sm font-semibold text-ink-900 dark:text-white">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-ink-500 dark:text-ink-400">{user?.email}</p>
                    {user?.role === 'admin' ? (
                      <span className="mt-2 inline-flex rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-300">
                        Administrator
                      </span>
                    ) : null}
                  </div>
                  <div className="p-1.5">
                    <Link
                      role="menuitem"
                      to="/profile"
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                    >
                      <UserCircleIcon className="h-4 w-4 text-ink-400" />
                      Profile
                    </Link>
                    <Link
                      role="menuitem"
                      to="/settings"
                      className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                    >
                      <Cog6ToothIcon className="h-4 w-4 text-ink-400" />
                      Settings
                    </Link>
                    {user?.role === 'admin' ? (
                      <Link
                        role="menuitem"
                        to="/admin/dashboard"
                        className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-ink-800"
                      >
                        <ShieldCheckIcon className="h-4 w-4 text-ink-400" />
                        Admin console
                      </Link>
                    ) : null}
                    <button
                      role="menuitem"
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-danger-600 hover:bg-danger-50 dark:text-rose-400 dark:hover:bg-danger-600/10"
                    >
                      <ArrowRightOnRectangleIcon className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
};

export default AppShell;
