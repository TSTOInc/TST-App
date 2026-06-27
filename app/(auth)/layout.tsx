import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-screen flex flex-col">
      {/* Signed out top bar */}
      <div className="w-full flex flex-row items-center p-4 bg-card shadow">
        <div className="flex-1" />
        <div className="flex-1 text-center">
          <h1 className="font-semibold">Velt</h1>
        </div>
        <div className="flex-1 text-right">
          <ThemeToggle />
        </div>
      </div>

      {/* Centered Auth Content (Sign-in / Sign-up cards) */}
      <div className="flex-1 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}