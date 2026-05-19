import { useState } from "react";
import { useListProducts, useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Star, SlidersHorizontal, X } from "lucide-react";

export function Products() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [inStock, setInStock] = useState(false);
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: categories } = useListCategories();
  const { data, isLoading } = useListProducts({
    search: search || undefined,
    categoryId: selectedCategory,
    minPrice: priceRange[0] > 0 ? priceRange[0] : undefined,
    maxPrice: priceRange[1] < 10000 ? priceRange[1] : undefined,
    inStock: inStock || undefined,
    page,
    limit: 20,
  });

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex gap-6">
        {/* Sidebar Filters */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="bg-card rounded-lg border p-5 space-y-6 sticky top-20">
            <h2 className="font-bold text-lg">تصفية النتائج</h2>

            {/* Category */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">التصنيف</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory(undefined)}
                  className={`w-full text-right px-3 py-2 rounded-md text-sm transition-colors ${!selectedCategory ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted"}`}
                  data-testid="filter-category-all"
                >
                  الكل
                </button>
                {categories?.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-right px-3 py-2 rounded-md text-sm transition-colors flex justify-between items-center ${selectedCategory === cat.id ? "bg-primary text-primary-foreground font-medium" : "hover:bg-muted"}`}
                    data-testid={`filter-category-${cat.id}`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs opacity-70">{cat.productCount}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">نطاق السعر</h3>
              <Slider
                min={0} max={10000} step={50}
                value={priceRange}
                onValueChange={setPriceRange}
                className="mb-3"
                data-testid="filter-price-range"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{priceRange[0]} ر.س</span>
                <span>{priceRange[1]} ر.س</span>
              </div>
            </div>

            {/* In Stock */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="instock"
                checked={inStock}
                onCheckedChange={(v) => setInStock(!!v)}
                data-testid="filter-in-stock"
              />
              <Label htmlFor="instock" className="cursor-pointer">متوفر في المخزن فقط</Label>
            </div>

            {(selectedCategory || inStock || priceRange[0] > 0 || priceRange[1] < 10000) && (
              <Button variant="outline" size="sm" className="w-full" onClick={() => {
                setSelectedCategory(undefined);
                setInStock(false);
                setPriceRange([0, 10000]);
              }}>
                <X className="w-3 h-3 ml-1" />
                إعادة ضبط
              </Button>
            )}
          </div>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <Input
                type="search"
                placeholder="ابحث عن منتج..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pr-4 pl-10"
                data-testid="search-input"
              />
            </div>
            <Button variant="outline" className="md:hidden" onClick={() => setShowFilters(true)}>
              <SlidersHorizontal className="w-4 h-4 ml-2" />
              فلتر
            </Button>
          </div>

          <div className="flex justify-between items-center mb-4 text-sm text-muted-foreground">
            <span>{total} منتج</span>
            <span>صفحة {page} من {totalPages || 1}</span>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-card rounded-lg border p-0 overflow-hidden">
                  <Skeleton className="aspect-square" />
                  <div className="p-3 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">لا توجد منتجات مطابقة</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                      <p className="text-xs text-muted-foreground mb-1">{product.categoryName}</p>
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                      {product.rating && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star className="w-3 h-3 fill-primary text-primary" />
                          <span className="text-xs text-muted-foreground">{product.rating} ({product.reviewCount})</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-primary">{product.price} ر.س</span>
                        {product.comparePrice && (
                          <span className="text-xs text-muted-foreground line-through">{product.comparePrice}</span>
                        )}
                      </div>
                      {product.stock === 0 && <Badge variant="destructive" className="text-xs mt-1">نفذ</Badge>}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)} data-testid="button-prev-page">السابق</Button>
              <span className="px-4 py-2 text-sm">{page} / {totalPages}</span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} data-testid="button-next-page">التالي</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
