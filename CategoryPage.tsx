import { useParams } from "wouter";
import { useListProducts, useListCategories, getListProductsQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Star } from "lucide-react";

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);

  const { data: categories } = useListCategories();
  const category = categories?.find((c) => c.slug === slug);

  const { data, isLoading } = useListProducts(
    { categoryId: category?.id, page, limit: 20 },
    { query: { enabled: !!category?.id, queryKey: getListProductsQueryKey({ categoryId: category?.id, page, limit: 20 }) } }
  );

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">{category?.name ?? slug}</h1>
        {category?.description && <p className="text-muted-foreground">{category.description}</p>}
        {total > 0 && <p className="text-sm text-muted-foreground mt-1">{total} منتج</p>}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border overflow-hidden">
              <Skeleton className="aspect-square" />
              <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">لا توجد منتجات في هذا التصنيف</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group overflow-hidden" data-testid={`card-product-${product.id}`}>
                <div className="aspect-square bg-muted/30 overflow-hidden">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">لا توجد صورة</div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                  {product.rating && (
                    <div className="flex items-center gap-1 mb-2">
                      <Star className="w-3 h-3 fill-primary text-primary" />
                      <span className="text-xs text-muted-foreground">{product.rating}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-primary">{product.price} ر.س</span>
                    {product.comparePrice && (
                      <span className="text-xs text-muted-foreground line-through">{product.comparePrice}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
          <span className="px-4 py-2 text-sm">{page} / {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</Button>
        </div>
      )}
    </div>
  );
}
