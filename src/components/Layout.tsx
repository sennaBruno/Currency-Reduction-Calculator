import { ReactNode } from "react";
import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";
import { History } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8 max-w-7xl mx-auto relative">
      <div className="absolute top-4 sm:top-6 md:top-8 right-4 sm:right-6 md:right-8 flex items-center space-x-4">
        <Link 
          href="/history" 
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          title="View Calculation History"
        >
          <History className="h-5 w-5" />
          <span className="ml-2 hidden sm:inline">History</span>
        </Link>
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
} 