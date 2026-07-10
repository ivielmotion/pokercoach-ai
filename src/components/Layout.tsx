import { Outlet } from 'react-router-dom';
import { Sidebar, MobileNav } from './Navigation';

export function Layout() {
  return (
    <div className="flex min-h-screen bg-bg-primary text-text-primary font-sans overflow-x-hidden">
      <Sidebar />
      <main className="flex-1 pb-20 md:pb-0 min-w-0">
        <div className="max-w-6xl mx-auto p-3 md:p-8">
          <Outlet />
        </div>
      </main>
      <MobileNav />
    </div>
  );
}