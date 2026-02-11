import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { shadcn } from '@clerk/themes'
import ConvexClientProvider from '@/components/ConvexClientProvider'

//Clerk
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/theme-toggle";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Velt - Carrier Management Software",
  description: "Streamline your carrier operations with Velt.",
};

export default async function RootLayout({ children }: { children: React.ReactNode; }) {
  // Fetch the user session
  const user = {
    id: "user.id",
    name: "user.name",
    image: "user.image",
    email: "user.email",
  }



  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClerkProvider appearance={{ baseTheme: shadcn }}>
          <ConvexClientProvider>
            <ThemeProvider
              attribute="class"
              enableSystem
              disableTransitionOnChange
            >
              <SignedIn>
                <SidebarProvider

                  style={
                    {
                      "--sidebar-width": "calc(var(--spacing) * 72)",
                      "--header-height": "calc(var(--spacing) * 14)",
                    } as React.CSSProperties
                  }
                >
                  <AppSidebar
                    variant="inset"
                    user={user}
                    organization={{
                      id: "organization.id",
                      name: "organization.display_name || organization.name",
                    }}
                  />
                  <SidebarInset>
                    <SiteHeader />
                    {children}
                    <Toaster richColors position="top-center" />
                  </SidebarInset>
                </SidebarProvider>
              </SignedIn>
              <SignedOut>
                <div className="relative h-screen">
                  <div className="absolute top-0 left-0 w-full flex flex-row items-center p-4 bg-card shadow">
                    <div className="flex-1 text-left"></div>
                    <div className="flex-1 text-center">
                      <h1 className="font-semibold">Velt</h1>
                    </div>
                    <div className="flex-1 text-right">
                      <ThemeToggle />
                    </div>
                  </div>

                  <div className="h-screen flex items-center justify-center">
                    {children}
                  </div>
                </div>
                <Toaster richColors position="top-center" />
              </SignedOut>

            </ThemeProvider>
          </ConvexClientProvider>

        </ClerkProvider>

      </body>
    </html>


  );
}
