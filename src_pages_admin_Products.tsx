import { useState, useRef } from "react";
import {
  useListProducts, useCreateProduct, useUpdateProduct, useDeleteProduct,
  useListCategories, getListProductsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, Upload, X, ImageIcon } from "lucide-react";

type ProductForm = {
  name: string; slug: string; description: string; price: number; comparePrice?: number;
  imageUrl?: string; stock: number; sku?: string; categoryId: number; isFeatured: boolean;
};

function ImageUploader({ value, onChange }: { value?: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string>(value || "");
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast({ title: "خطأ", description: "يجب أن يكون الملف صورة", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "خطأ", description: "حجم الصورة أكبر من 5MB", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setPreview(data.url);
      onChange(data.url);
      toast({ title: "تم الرفع", description: "تم رفع الصورة بنجاح" });
    } catch {
      toast({ title: "خطأ في الرفع", description: "تعذر رفع الصورة", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-3">
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${uploading ? "opacity-50 pointer-events-none" : "hover:border-primary hover:bg-primary/5"}`}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        data-testid="image-drop-zone"
      >
        {preview ? (
          <div className="relative inline-block">
            <img src={preview} alt="preview" className="w-32 h-32 object-cover rounded-lg mx-auto" />
            <button
              type="button"
              className="absolute -top-2 -right-2 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center"
              onClick={(e) => { e.stopPropagation(); setPreview(""); onChange(""); }}
              data-testid="button-remove-image"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {uploading ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">جاري الرفع...</p>
              </div>
            ) : (
              <>
                <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto" />
                <p className="text-sm font-medium">اسحب الصورة هنا أو اضغط للاختيار</p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WEBP — حتى 5MB</p>
              </>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          data-testid="input-file-upload"
        />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">أو أدخل رابطاً</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="https://example.com/image.jpg"
          value={value || ""}
          onChange={(e) => { onChange(e.target.value); setPreview(e.target.value); }}
          dir="ltr"
          data-testid="input-image-url"
        />
        {value && (
          <Button type="button" variant="ghost" size="icon" onClick={() => { onChange(""); setPreview(""); }}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

export function AdminProducts() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams = { search: search || undefined, page, limit: 20 };
  const { data, isLoading } = useListProducts(queryParams);
  const { data: categories } = useListCategories();

  const createProduct = useCreateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(queryParams) });
        setDialogOpen(false);
        toast({ title: "تم إضافة المنتج" });
      }
    }
  });
  const updateProduct = useUpdateProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(queryParams) });
        setDialogOpen(false);
        setEditingProduct(null);
        toast({ title: "تم تحديث المنتج" });
      }
    }
  });
  const deleteProduct = useDeleteProduct({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey(queryParams) });
        toast({ title: "تم حذف المنتج" });
      }
    }
  });

  const form = useForm<ProductForm>({ defaultValues: { stock: 0, isFeatured: false } });

  const openAdd = () => {
    form.reset({ stock: 0, isFeatured: false, imageUrl: "" });
    setEditingProduct(null);
    setDialogOpen(true);
  };

  const openEdit = (product: any) => {
    form.reset({
      name: product.name,
      slug: product.slug,
      description: product.description ?? "",
      price: product.price,
      comparePrice: product.comparePrice ?? undefined,
      imageUrl: product.imageUrl ?? "",
      stock: product.stock,
      sku: product.sku ?? "",
      categoryId: product.categoryId,
      isFeatured: product.isFeatured,
    });
    setEditingProduct(product);
    setDialogOpen(true);
  };

  const onSubmit = (data: ProductForm) => {
    const payload = {
      ...data,
      price: Number(data.price),
      stock: Number(data.stock),
      comparePrice: data.comparePrice ? Number(data.comparePrice) : undefined,
    };
    if (editingProduct) {
      updateProduct.mutate({ id: editingProduct.id, data: payload as any });
    } else {
      createProduct.mutate({ data: payload as any });
    }
  };

  const products = data?.products ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">المنتجات</h1>
        <Button onClick={openAdd} data-testid="button-add-product">
          <Plus className="w-4 h-4 ml-2" />
          إضافة منتج
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="ابحث عن منتج..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pr-10"
          data-testid="search-products"
        />
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>المنتج</TableHead>
              <TableHead>السعر</TableHead>
              <TableHead>المخزن</TableHead>
              <TableHead>التصنيف</TableHead>
              <TableHead>مميز</TableHead>
              <TableHead>إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              : products.length === 0
              ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">لا توجد منتجات</TableCell>
                </TableRow>
              )
              : products.map((product) => (
                <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {product.imageUrl
                        ? <img src={product.imageUrl} alt={product.name} className="w-10 h-10 object-cover rounded-md bg-muted" />
                        : <div className="w-10 h-10 bg-muted rounded-md flex items-center justify-center"><ImageIcon className="w-4 h-4 text-muted-foreground" /></div>
                      }
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-xs text-muted-foreground">{product.sku}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold">{product.price} ر.س</div>
                    {product.comparePrice && (
                      <div className="text-xs text-muted-foreground line-through">{product.comparePrice}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.stock > 0 ? "outline" : "destructive"}>{product.stock}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{product.categoryName}</TableCell>
                  <TableCell>
                    {product.isFeatured
                      ? <Badge className="bg-primary/20 text-primary border-0">نعم</Badge>
                      : <span className="text-muted-foreground text-xs">لا</span>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8"
                        onClick={() => openEdit(product)}
                        data-testid={`button-edit-${product.id}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                        onClick={() => deleteProduct.mutate({ id: product.id })}
                        data-testid={`button-delete-${product.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>السابق</Button>
          <span className="px-4 py-2 text-sm">{page} / {totalPages}</span>
          <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>التالي</Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingProduct(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              {editingProduct ? "تعديل المنتج" : "إضافة منتج جديد"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Image Upload */}
            <div>
              <Label className="text-sm font-semibold mb-2 block">صورة المنتج</Label>
              <Controller
                name="imageUrl"
                control={form.control}
                render={({ field }) => (
                  <ImageUploader value={field.value} onChange={field.onChange} />
                )}
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>اسم المنتج *</Label>
                <Input {...form.register("name", { required: true })} className="mt-1" data-testid="input-product-name" />
              </div>
              <div>
                <Label>الرابط (slug) *</Label>
                <Input {...form.register("slug", { required: true })} className="mt-1" dir="ltr" data-testid="input-product-slug" />
              </div>
              <div>
                <Label>السعر (ر.س) *</Label>
                <Input type="number" step="0.01" {...form.register("price", { required: true })} className="mt-1" data-testid="input-product-price" />
              </div>
              <div>
                <Label>السعر قبل الخصم</Label>
                <Input type="number" step="0.01" {...form.register("comparePrice")} className="mt-1" />
              </div>
              <div>
                <Label>الكمية في المخزن *</Label>
                <Input type="number" {...form.register("stock", { required: true })} className="mt-1" data-testid="input-product-stock" />
              </div>
              <div>
                <Label>رمز المنتج (SKU)</Label>
                <Input {...form.register("sku")} className="mt-1" dir="ltr" />
              </div>
              <div>
                <Label>التصنيف *</Label>
                <Controller
                  name="categoryId"
                  control={form.control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(parseInt(v))}>
                      <SelectTrigger className="mt-1" data-testid="select-category">
                        <SelectValue placeholder="اختر تصنيفاً" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((c) => (
                          <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  type="checkbox"
                  id="isFeatured"
                  {...form.register("isFeatured")}
                  className="rounded w-4 h-4"
                />
                <Label htmlFor="isFeatured" className="cursor-pointer">منتج مميز (يظهر في الرئيسية)</Label>
              </div>
            </div>

            <div>
              <Label>وصف المنتج</Label>
              <Textarea {...form.register("description")} className="mt-1" rows={3} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button
                type="submit"
                disabled={createProduct.isPending || updateProduct.isPending}
                data-testid="button-save-product"
              >
                {editingProduct ? "حفظ التغييرات" : "إضافة المنتج"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
