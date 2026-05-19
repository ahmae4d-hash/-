import { Link } from "wouter";
import { Search, ShoppingCart, User, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCartSession } from "@/hooks/use-cart-session";
import { useGetCart, getGetCartQueryKey } from "@workspace/api-client-react";

export function StoreLayout({ children }: { children: React.ReactNode }) {
  const sessionId = useCartSession();
  const { data: cart } = useGetCart(
    { sessionId: sessionId || "" },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId: sessionId || "" }) } }
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="w-5 h-5" />
            </Button>
            <Link href="/" className="text-2xl font-bold text-primary tracking-tight">
              سوق نون
            </Link>
          </div>
          
          <div className="flex-1 max-w-xl hidden md:flex relative">
            <Input 
              type="search" 
              placeholder="عن ماذا تبحث؟" 
              className="w-full pr-4 pl-10 rounded-full bg-muted/50 border-transparent focus-visible:bg-background"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>

          <div className="flex items-center gap-2">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cart && cart.itemCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
                    {cart.itemCount}
                  </span>
                )}
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="hidden sm:inline-flex">
              <User className="w-5 h-5" />
            </Button>
            <Link href="/admin">
              <Button variant="outline" size="sm" className="hidden sm:inline-flex text-xs">
                الإدارة
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-muted/30">
        {children}
      </main>

      <footer className="bg-white border-t py-12 mt-auto">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-primary mb-4">سوق نون</h3>
            <p className="text-sm text-muted-foreground">أفضل متجر إلكتروني لتسوق المنتجات المميزة بأسعار رائعة.</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/">الرئيسية</Link></li>
              <li><Link href="/products">المنتجات</Link></li>
              <li><Link href="/cart">سلة المشتريات</Link></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
