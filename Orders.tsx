import { useState } from "react";
import { useListOrders, useUpdateOrderStatus, getListOrdersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const statusOptions = [
  { value: "pending", label: "قيد الانتظار", variant: "secondary" as const },
  { value: "confirmed", label: "مؤكد", variant: "default" as const },
  { value: "processing", label: "جاري التجهيز", variant: "default" as const },
  { value: "shipped", label: "تم الشحن", variant: "default" as const },
  { value: "delivered", label: "تم التوصيل", variant: "outline" as const },
  { value: "cancelled", label: "ملغي", variant: "destructive" as const },
];

const statusMap = Object.fromEntries(statusOptions.map((s) => [s.value, s]));

export function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const queryParams = { status: statusFilter || undefined, page, limit: 20 };
  const { data, isLoading } = useListOrders(queryParams);
  const updateStatus = useUpdateOrderStatus({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListOrdersQueryKey(queryParams) });
        toast({ title: "تم التحديث", description: "تم تحديث حالة الطلب" });
      }
    }
  });

  const orders = data?.orders ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الطلبات</h1>
        <div className="text-sm text-muted-foreground">{total} طلب</div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={!statusFilter ? "default" : "outline"}
          size="sm"
          onClick={() => { setStatusFilter(""); setPage(1); }}
          data-testid="filter-all"
        >الكل</Button>
        {statusOptions.map((s) => (
          <Button
            key={s.value}
            variant={statusFilter === s.value ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter(s.value); setPage(1); }}
            data-testid={`filter-${s.value}`}
          >{s.label}</Button>
        ))}
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>رقم الطلب</TableHead>
              <TableHead>العميل</TableHead>
              <TableHead>التاريخ</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>الإجمالي</TableHead>
              <TableHead>تغيير الحالة</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">لا توجد طلبات</TableCell>
              </TableRow>
            ) : orders.map((order: any) => (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedOrder(order)}
                data-testid={`row-order-${order.id}`}
              >
                <TableCell className="font-bold">#{order.id}</TableCell>
                <TableCell>
                  <div>{order.customerName}</div>
                  <div className="text-xs text-muted-foreground">{order.customerEmail}</div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(order.createdAt).toLocaleDateString("ar-SA")}
                </TableCell>
                <TableCell>
                  <Badge variant={statusMap[order.status]?.variant || "default"}>
                    {statusMap[order.status]?.label || order.status}
                  </Badge>
                </TableCell>
                <TableCell className="font-bold text-primary">{order.total} ر.س</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Select
                    value={order.status}
                    onValueChange={(val) => updateStatus.mutate({ id: order.id, data: { status: val as any } })}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs" data-testid={`select-status-${order.id}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
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

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الطلب #{selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">العميل: </span>{selectedOrder.customerName}</div>
                <div><span className="text-muted-foreground">البريد: </span>{selectedOrder.customerEmail}</div>
                <div><span className="text-muted-foreground">الهاتف: </span>{selectedOrder.customerPhone || "—"}</div>
                <div><span className="text-muted-foreground">المدينة: </span>{selectedOrder.shippingCity}</div>
                <div className="sm:col-span-2"><span className="text-muted-foreground">العنوان: </span>{selectedOrder.shippingAddress}</div>
                {selectedOrder.notes && <div className="sm:col-span-2"><span className="text-muted-foreground">ملاحظات: </span>{selectedOrder.notes}</div>}
              </div>
              {selectedOrder.items?.length > 0 && (
                <div className="border-t pt-3">
                  <h4 className="font-semibold mb-2">المنتجات</h4>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.productName} × {item.quantity}</span>
                        <span className="font-medium">{item.total} ر.س</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t pt-3 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">المجموع الفرعي</span><span>{selectedOrder.subtotal} ر.س</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">الشحن</span><span>{selectedOrder.shippingCost} ر.س</span></div>
                <div className="flex justify-between font-bold"><span>الإجمالي</span><span className="text-primary">{selectedOrder.total} ر.س</span></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
