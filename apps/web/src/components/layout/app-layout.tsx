import { Outlet } from 'react-router-dom';

import { Navbar } from './navbar';

export function AppLayout(): JSX.Element {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
