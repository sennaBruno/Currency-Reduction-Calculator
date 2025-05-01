import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      {children}
    </main>
  );
} 