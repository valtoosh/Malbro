// components/layout/PageShell.tsx
import { TopBar } from './TopBar';
import { Footer } from './Footer';

export interface PageShellProps {
  children: React.ReactNode;
  schedule?: string;
}

export function PageShell({ children, schedule }: PageShellProps) {
  return (
    <div className="min-h-screen flex flex-col bg-paper">
      <TopBar schedule={schedule} />
      <main className="flex-1 max-w-[1280px] w-full mx-auto px-8 md:px-16 py-12">
        {children}
      </main>
      <Footer />
    </div>
  );
}
