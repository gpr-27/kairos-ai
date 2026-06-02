import { Outlet } from 'react-router-dom';

import { Backdrop } from '@/components/brand/backdrop';
import { Navbar } from './navbar';

export function AppLayout(): JSX.Element {
  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Ambient grid + faint aurora behind the whole app shell */}
      <Backdrop />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
