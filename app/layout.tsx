import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "../components/ui/sonner";
import { ThemeProvider } from "../components/theme-provider";
import { shadcn } from '@clerk/themes';
import ConvexClientProvider from '../components/ConvexClientProvider';
import { ClerkProvider } from "@clerk/nextjs";
import { cn } from "../lib/utils";
import { TooltipProvider } from "../components/ui/tooltip";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Velt - Carrier Management Software",
  description: "Streamline your carrier operations with Velt.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("font-sans", inter.variable)}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkProvider appearance={{ baseTheme: shadcn }}>
          <ConvexClientProvider>
            <ThemeProvider attribute="class" enableSystem disableTransitionOnChange>
              <TooltipProvider>
                
                {/* Main Content Appears Here */}
                {children}
                
                {/* Single global toaster */}
                <Toaster richColors position="top-center" />
              </TooltipProvider>
            </ThemeProvider>
          </ConvexClientProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}