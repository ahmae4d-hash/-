import { Link, useLocation } from "wouter";
import { LayoutDashboard, Package, ShoppingBag, Users, Tags, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "لوحة القيادة", icon: LayoutDashboard },
  { href: "/orders", label: "الطلبات", icon: ShoppingBag },
  { href: "/products", label: "المنتجات", icon: Package },
  { href: "/categories", label: "التصنيفات", icon: Tags },
  { href: "/customers", label: "العملاء", icon: Users },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-muted/20 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-card border-l md:min-h-screen flex flex-col shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-primary">الإدارة</h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}>
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t">
          <Link href="/">
            <span className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
              <LogOut className="w-4 h-4" />
              العودة للمتجر
            </span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
