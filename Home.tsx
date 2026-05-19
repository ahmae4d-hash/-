import { useListFeaturedProducts, useListCategories } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";

export function Home() {
  const { data: featured } = useListFeaturedProducts();
  const { data: categories } = useListCategories();

  return (
    <div className="space-y-12 pb-12">
      {/* Hero */}
      <section className="bg-primary/10 py-16 md:py-24 px-4 border-b border-primary/20">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            اكتشف أفضل المنتجات <br />
            <span className="text-primary">بأسعار لا تقبل المنافسة</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            تسوق من بين آلاف المنتجات المختارة بعناية. جودة عالية وتوصيل سريع لباب منزلك.
          </p>
          <Link href="/products">
            <Button size="lg" className="rounded-full px-8 text-lg h-14">
              تسوق الآن
            </Button>
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">تسوق حسب التصنيف</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories?.map((cat) => (
            <Link key={cat.id} href={`/category/${cat.slug}`}>
              <Card className="hover:border-primary cursor-pointer transition-colors group">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    {/* Placeholder icon */}
                    <span className="text-2xl font-bold">{cat.name.charAt(0)}</span>
                  </div>
                  <h3 className="font-semibold text-foreground">{cat.name}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold">منتجات مختارة</h2>
          <Link href="/products" className="text-primary hover:underline text-sm font-medium">
            عرض الكل
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {featured?.slice(0, 5).map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer border-transparent bg-white group">
                <div className="aspect-square bg-muted/30 p-4">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      لا توجد صورة
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">{product.categoryName}</div>
                  <h3 className="font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="font-bold text-base">{product.price} ر.س</span>
                    <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary">
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
