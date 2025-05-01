import { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto relative">
      <div className="absolute top-8 right-8">
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
} 