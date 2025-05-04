import { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 max-w-7xl mx-auto relative">
      <div className="absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8">
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
} 