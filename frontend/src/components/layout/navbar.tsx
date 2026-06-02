import { UserButton } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import {
  Flame,
  LayoutDashboard,
  ListChecks,
  Settings,
  Sparkles,
  Terminal,
  User,
  UserPlus,
} from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';

import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';
import { useAppAuth } from '@/hooks/use-app-auth';
import { cn } from '@/lib/utils';
import { useProgressStore } from '@/stores/progress-store';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/problems', label: 'Problems', icon: ListChecks },
  { to: '/playground', label: 'Playground', icon: Terminal },
  { to: '/chat', label: 'Assistant', icon: Sparkles },
  { to: '/profile', label: 'Profile', icon: User },
] as const;

function NavItem({
  to,
  label,
  icon: Icon,
  compact = false,
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  compact?: boolean;
}): JSX.Element {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'relative flex items-center gap-2 rounded-lg px-3 text-sm font-medium transition-colors',
          compact ? 'py-1.5' : 'py-2',
          isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
        )
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <motion.span
              layoutId={compact ? 'nav-active-mobile' : 'nav-active'}
              className="bg-primary/10 ring-primary/20 absolute inset-0 rounded-lg ring-1"
              transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            />
          )}
          <Icon className="relative z-10 h-4 w-4" />
          <span className="relative z-10">{label}</span>
        </>
      )}
    </NavLink>
  );
}

export function Navbar(): JSX.Element {
  const getStreak = useProgressStore((s) => s.getStreak);
  const streak = getStreak();
  const { isGuest } = useAppAuth();

  // Guests can't manage a profile (it requires a real account).
  const navLinks = isGuest ? NAV_LINKS.filter((link) => link.to !== '/profile') : NAV_LINKS;

  return (
    <header className="glass-strong sticky top-0 z-40 border-b border-white/5">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <Logo size="md" />
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <NavItem key={link.to} {...link} />
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className={cn(
              'flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium tabular-nums transition-colors sm:gap-1.5 sm:px-3',
              streak > 0
                ? 'border-orange-500/25 bg-orange-500/10 text-orange-400'
                : 'border-border/60 bg-card/40 text-muted-foreground',
            )}
            title={`${streak} day streak`}
          >
            <Flame
              className={cn('h-3 w-3 sm:h-3.5 sm:w-3.5', streak > 0 && 'fill-orange-500/30')}
            />
            <span>
              {streak}
              <span className="hidden sm:inline"> day{streak !== 1 ? 's' : ''}</span>
            </span>
          </div>

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              cn(
                'hidden h-9 w-9 items-center justify-center rounded-lg transition-colors sm:flex',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground',
              )
            }
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </NavLink>

          {isGuest ? (
            <Button asChild variant="gradient" size="sm" className="gap-1.5">
              <Link to="/sign-up">
                <UserPlus className="h-4 w-4" />
                <span className="hidden sm:inline">Sign up to save</span>
              </Link>
            </Button>
          ) : (
            <UserButton appearance={{ elements: { avatarBox: 'h-9 w-9' } }} />
          )}
        </div>
      </div>

      {/* Mobile nav row */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 md:hidden">
        {navLinks.map((link) => (
          <NavItem key={link.to} {...link} compact />
        ))}
        <NavItem to="/settings" label="Settings" icon={Settings} compact />
      </nav>
    </header>
  );
}
