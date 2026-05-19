import { useState } from "react";
import {
  useListCategories, useCreateCategory, useUpdateCategory, useDeleteCategory,
  getListCategoriesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";

type CatForm = { name: string; slug: string; description?: string; imageUrl?: string };

export function AdminCategories() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories, isLoading } = useListCategories();
  const createCategory = useCreateCategory({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }); setDialogOpen(false); toast({ title: "تم إضافة التصنيف" }); } }
  });
  const updateCategory = useUpdateCategory({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }); setDialogOpen(false); setEditingCat(null); toast({ title: "تم تحديث التصنيف" }); } }
  });
  const deleteCategory = useDeleteCategory({
    mutation: { onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListCategoriesQueryKey() }); toast({ title: "تم حذف التصنيف" }); } }
  });

  const form = useForm<CatForm>();

  const openAdd = () => {
    form.reset({});
    setEditingCat(null);
    setDialogOpen(true);
  };

  const openEdit = (cat: any) => {
    form.reset({ name: cat.name, slug: cat.slug, description: cat.description ?? "", imageUrl: cat.imageUrl ?? "" });
    setEditingCat(cat);
    setDialogOpen(true);
  };

  const onSubmit = (data: CatForm) => {
    if (editingCat) {
      updateCategory.mutate({ id: editingCat.id, data });
    } else {
      createCategory.mutate({ data });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">التصنيفات</h1>
        <Button onClick={openAdd} data-testid="button-add-category">
          <Plus className="w-4 h-4 ml-2" />
          إضافة تصنيف
        </Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>التصنيف</TableHead>
              <TableHead>الرابط</TableHead>
              <TableHead>عدد المنتجات</TableHead>
              <TableHead>الوصف</TableHead>
              <TableHead>إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 4 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 5 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
            )) : !categories?.length ? (
              <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">لا توجد تصنيفات</TableCell></TableRow>
            ) : categories.map((cat) => (
              <TableRow key={cat.id} data-testid={`row-category-${cat.id}`}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    {cat.imageUrl && <img src={cat.imageUrl} alt={cat.name} className="w-10 h-10 object-cover rounded-md bg-muted" />}
                    <span className="font-semibold">{cat.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground" dir="ltr">{cat.slug}</TableCell>
                <TableCell className="font-bold">{cat.productCount}</TableCell>
                <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{cat.description || "—"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)} data-testid={`button-edit-cat-${cat.id}`}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCategory.mutate({ id: cat.id })} data-testid={`button-delete-cat-${cat.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingCat(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCat ? "تعديل التصنيف" : "إضافة تصنيف جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>اسم التصنيف *</Label>
              <Input {...form.register("name", { required: true })} className="mt-1" data-testid="input-category-name" />
            </div>
            <div>
              <Label>الرابط (slug) *</Label>
              <Input {...form.register("slug", { required: true })} className="mt-1" dir="ltr" data-testid="input-category-slug" />
            </div>
            <div>
              <Label>رابط الصورة</Label>
              <Input {...form.register("imageUrl")} className="mt-1" dir="ltr" placeholder="https://..." />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea {...form.register("description")} className="mt-1" rows={2} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
              <Button type="submit" disabled={createCategory.isPending || updateCategory.isPending} data-testid="button-save-category">
                {editingCat ? "حفظ" : "إضافة"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
