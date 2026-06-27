import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // TODO: Replace this with your actual user fetch logic (e.g., Clerk auth() or Convex query)
  const user = {
    id: "user.id",
    name: "user.name",
    image: "user.image",
    email: "user.email",
  };

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 14)",
      } as React.CSSProperties}
    >
      <AppSidebar
        variant="inset"
        user={user}
        organization={{
          id: "organization.id",
          name: "Organization Name",
        }}
      />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}