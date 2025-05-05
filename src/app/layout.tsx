import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";
import { ThemeProvider } from "@/components/theme-provider";
import ReduxProvider from "@/components/ReduxProvider";
import SupabaseProvider from "@/providers/SupabaseProvider";
import { createClient } from "@/lib/supabase/server";
import "@/lib/suppressHydrationWarnings";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Currency Exchange Rate Calculator",
  description: "Calculate step-by-step reductions of an amount in USD to BRL",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SupabaseProvider initialSession={session}>
            <ReduxProvider>
              <Layout>{children}</Layout>
            </ReduxProvider>
          </SupabaseProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
