import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useGetProduct, useAddToCart, getGetProductQueryKey, getGetCartQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useCartSession } from "@/hooks/use-cart-session";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart, Star, Minus, Plus, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [qty, setQty] = useState(1);
  const sessionId = useCartSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: product, isLoading } = useGetProduct(parseInt(id ?? "0"), {
    query: { enabled: !!id, queryKey: getGetProductQueryKey(parseInt(id ?? "0")) }
  });

  const addToCart = useAddToCart({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId: sessionId || "" }) });
        toast({ title: "تم الإضافة", description: `${product?.name} تمت إضافته للسلة` });
      },
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-10">
          <Skeleton className="aspect-square rounded-xl" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-12 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-muted-foreground">المنتج غير موجود</p>
      <Link href="/products"><Button className="mt-4">تصفح المنتجات</Button></Link>
    </div>
  );

  const discount = product.comparePrice
    ? Math.round((1 - product.price / product.comparePrice) * 100)
    : null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/" className="hover:text-primary">الرئيسية</Link>
        <ArrowRight className="w-3 h-3 rotate-180" />
        <Link href="/products" className="hover:text-primary">المنتجات</Link>
        <ArrowRight className="w-3 h-3 rotate-180" />
        <span className="text-foreground">{product.name}</span>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Image */}
        <div className="space-y-3">
          <div className="aspect-square bg-card rounded-2xl border overflow-hidden flex items-center justify-center p-8">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain" />
            ) : (
              <div className="text-muted-foreground">لا توجد صورة</div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          {product.categoryName && (
            <Badge variant="secondary" className="text-sm">{product.categoryName}</Badge>
          )}
          <h1 className="text-3xl font-bold leading-snug" data-testid="text-product-name">{product.name}</h1>

          {product.rating && (
            <div className="flex items-center gap-2">
              <div className="flex">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className={`w-4 h-4 ${s <= Math.round(product.rating ?? 0) ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">{product.rating} ({product.reviewCount} تقييم)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-end gap-3">
            <span className="text-4xl font-black text-primary" data-testid="text-price">{product.price} ر.س</span>
            {product.comparePrice && (
              <span className="text-xl text-muted-foreground line-through mb-1">{product.comparePrice} ر.س</span>
            )}
            {discount && <Badge className="bg-red-500 text-white text-sm mb-1">خصم {discount}%</Badge>}
          </div>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {/* Stock */}
          <div>
            {product.stock > 0 ? (
              <span className="text-green-600 font-medium text-sm">متوفر ({product.stock} قطعة)</span>
            ) : (
              <span className="text-destructive font-medium text-sm">نفذ من المخزن</span>
            )}
          </div>

          {/* Qty + Add to Cart */}
          {product.stock > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">الكمية:</span>
                <div className="flex items-center border rounded-lg overflow-hidden">
                  <button
                    className="px-3 py-2 hover:bg-muted transition-colors"
                    onClick={() => setQty(q => Math.max(1, q - 1))}
                    data-testid="button-decrease-qty"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 py-2 font-bold text-sm min-w-[3rem] text-center" data-testid="text-quantity">{qty}</span>
                  <button
                    className="px-3 py-2 hover:bg-muted transition-colors"
                    onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    data-testid="button-increase-qty"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 h-12 text-base font-semibold"
                  disabled={!sessionId || addToCart.isPending}
                  onClick={() => {
                    if (!sessionId) return;
                    addToCart.mutate({ data: { sessionId, productId: product.id, quantity: qty } });
                  }}
                  data-testid="button-add-to-cart"
                >
                  <ShoppingCart className="w-5 h-5 ml-2" />
                  {addToCart.isPending ? "جاري الإضافة..." : "أضف للسلة"}
                </Button>
                <Button size="lg" variant="outline" className="h-12 px-6" onClick={() => {
                  if (!sessionId) return;
                  addToCart.mutate({ data: { sessionId, productId: product.id, quantity: qty } }, {
                    onSuccess: () => setLocation("/checkout")
                  });
                }} data-testid="button-buy-now">
                  اشتر الآن
                </Button>
              </div>
            </div>
          )}

          {product.sku && (
            <p className="text-xs text-muted-foreground">رمز المنتج: {product.sku}</p>
          )}
        </div>
      </div>
    </div>
  );
}
