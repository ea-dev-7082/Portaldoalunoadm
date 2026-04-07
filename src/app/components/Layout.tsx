import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router";
import { Menu, Sun, Moon, X, LayoutDashboard, Building2, GraduationCap, Users, Handshake } from "lucide-react";
import { Button } from "./ui/button";
import { ThemeProvider, useTheme } from "next-themes";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  
  return (
    <Button 
      variant="ghost" 
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Alternar tema</span>
    </Button>
  );
}

function LayoutContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard },
    { label: "Empresas", path: "/empresas", icon: Building2 },
    { label: "Treinamentos", path: "/treinamentos", icon: GraduationCap },
    { label: "Alunos", path: "/alunos", icon: Users },
    { label: "Parcerias", path: "/parcerias", icon: Handshake },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-card border-b border-border px-6 py-4 flex items-center justify-between backdrop-blur-sm bg-opacity-95">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
            <span className="text-white font-bold text-lg">EA</span>
          </div>
          <div>
            <h1 className="font-semibold text-foreground">Escola de Autopeças</h1>
            <p className="text-sm text-muted-foreground">Sistema de Gestão de Treinamentos</p>
          </div>
        </div>

        {/* Theme Toggle & Hamburger Menu */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="relative overflow-hidden w-10 h-10"
          >
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${sidebarOpen ? 'rotate-180 opacity-0 scale-50' : 'rotate-0 opacity-100 scale-100'}`}>
              <Menu className="h-6 w-6" />
            </div>
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${sidebarOpen ? 'rotate-0 opacity-100 scale-100' : '-rotate-180 opacity-0 scale-50'}`}>
              <X className="h-6 w-6" />
            </div>
          </Button>
        </div>
      </header>

      {/* Backdrop overlay for open sidebar */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Collapsible Sidebar */}
      <div className={`fixed right-0 top-[73px] bottom-0 bg-card border-l border-border transition-all duration-300 ease-in-out z-40 overflow-hidden ${
        sidebarOpen ? 'w-64' : 'w-0 lg:w-16'
      }`}>
        <nav className="flex flex-col gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-medium"
                    : "text-foreground hover:bg-accent"
                }`}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className={`whitespace-nowrap transition-opacity duration-300 ${
                  sidebarOpen ? "opacity-100" : "opacity-0"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Main Content with fixed margin for the small sidebar */}
      <main className="transition-all duration-300 ease-in-out lg:mr-16 px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export function Layout() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <LayoutContent />
    </ThemeProvider>
  );
}