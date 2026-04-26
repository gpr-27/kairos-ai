import { UserButton } from '@clerk/clerk-react';
import { Flame, LayoutDashboard, ListChecks, Terminal, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { Logo } from '@/components/brand/logo';
import { cn } from '@/lib/utils';
import { useProgressStore } from '@/stores/progress-store';

const NAV_LINKS = [
  { to: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { to: '/problems',   label: 'Problems',   icon: ListChecks },
  { to: '/playground', label: 'Playground', icon: Terminal },
  { to: '/profile',    label: 'Profile',    icon: User },
] as const;

export function Navbar(): JSX.Element {
  const getStreak = useProgressStore((s) => s.getStreak);
  const streak = getStreak();

  return (
    <header className="border-border/50 bg-background/80 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <NavLink to="/dashboard" className="flex items-center gap-2">
            <Logo size="md" />
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground',
                  )
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-orange-500/20 bg-orange-500/10 px-2 py-1 text-xs font-medium text-orange-400 sm:gap-1.5 sm:px-3">
            <Flame className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <span className="tabular-nums">{streak}<span className="hidden sm:inline"> day{streak !== 1 ? 's' : ''} streak</span></span>
          </div>

          <UserButton
            appearance={{
              elements: {
                avatarBox: 'h-9 w-9',
              },
            }}
          />
        </div>
      </div>

      <nav className="border-border/50 flex items-center gap-1 overflow-x-auto border-t px-4 py-2 md:hidden">
        {NAV_LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground',
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  );
}
