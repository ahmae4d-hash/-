import { useCartSession } from "@/hooks/use-cart-session";
import {
  useGetCart,
  useUpdateCartItem,
  useRemoveCartItem,
  getGetCartQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";

export function Cart() {
  const sessionId = useCartSession();
  const queryClient = useQueryClient();
  const cartKey = getGetCartQueryKey({ sessionId: sessionId || "" });

  const { data: cart, isLoading } = useGetCart(
    { sessionId: sessionId || "" },
    { query: { enabled: !!sessionId, queryKey: cartKey } }
  );

  const updateItem = useUpdateCartItem({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKey }) }
  });
  const removeItem = useRemoveCartItem({
    mutation: { onSuccess: () => queryClient.invalidateQueries({ queryKey: cartKey }) }
  });

  if (!sessionId || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full mb-4" />)}
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">سلتك فارغة</h2>
        <p className="text-muted-foreground mb-6">لم تضف أي منتجات بعد</p>
        <Link href="/products">
          <Button size="lg" data-testid="button-browse-products">تصفح المنتجات</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">سلة المشتريات ({cart.itemCount} منتج)</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="bg-card border rounded-xl p-4 flex gap-4" data-testid={`cart-item-${item.id}`}>
              {item.productImageUrl ? (
                <img src={item.productImageUrl} alt={item.productName} className="w-24 h-24 object-cover rounded-lg bg-muted shrink-0" />
              ) : (
                <div className="w-24 h-24 bg-muted rounded-lg shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold line-clamp-2 mb-1">{item.productName}</h3>
                <p className="text-primary font-bold text-lg">{item.price} ر.س</p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                      className="px-2 py-1.5 hover:bg-muted"
                      onClick={() => updateItem.mutate({ id: item.id, data: { quantity: Math.max(1, item.quantity - 1) } })}
                      data-testid={`button-decrease-${item.id}`}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-3 py-1.5 text-sm font-medium min-w-[2.5rem] text-center">{item.quantity}</span>
                    <button
                      className="px-2 py-1.5 hover:bg-muted"
                      onClick={() => updateItem.mutate({ id: item.id, data: { quantity: item.quantity + 1 } })}
                      data-testid={`button-increase-${item.id}`}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    className="text-destructive hover:text-destructive/80 transition-colors"
                    onClick={() => removeItem.mutate({ id: item.id })}
                    data-testid={`button-remove-${item.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-left shrink-0 font-bold">
                {(item.price * item.quantity).toFixed(2)} ر.س
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-card border rounded-xl p-6 h-fit space-y-4">
          <h2 className="font-bold text-lg">ملخص الطلب</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">المجموع الفرعي</span>
              <span>{cart.subtotal.toFixed(2)} ر.س</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">الشحن</span>
              <span>{cart.subtotal >= 100 ? <span className="text-green-600">مجاني</span> : "10.00 ر.س"}</span>
            </div>
            {cart.subtotal < 100 && (
              <p className="text-xs text-muted-foreground">أضف {(100 - cart.subtotal).toFixed(2)} ر.س للحصول على شحن مجاني</p>
            )}
          </div>
          <div className="border-t pt-4 flex justify-between font-bold text-lg">
            <span>الإجمالي</span>
            <span className="text-primary">{(cart.subtotal + (cart.subtotal >= 100 ? 0 : 10)).toFixed(2)} ر.س</span>
          </div>
          <Link href="/checkout">
            <Button className="w-full h-12 text-base font-semibold" data-testid="button-checkout">
              إتمام الشراء
              <ArrowLeft className="w-4 h-4 mr-2" />
            </Button>
          </Link>
          <Link href="/products">
            <Button variant="outline" className="w-full" data-testid="button-continue-shopping">مواصلة التسوق</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
