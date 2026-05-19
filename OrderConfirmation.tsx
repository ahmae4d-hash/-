import { useParams } from "wouter";
import { useGetOrder, getGetOrderQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle2 } from "lucide-react";

const statusMap: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  processing: "جاري التجهيز",
  shipped: "تم الشحن",
  delivered: "تم التوصيل",
  cancelled: "ملغي",
};

export function OrderConfirmation() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = useGetOrder(parseInt(id ?? "0"), {
    query: { enabled: !!id, queryKey: getGetOrderQueryKey(parseInt(id ?? "0")) }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Skeleton className="h-16 w-full mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-muted-foreground">الطلب غير موجود</p>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      {/* Success Header */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">تم تقديم طلبك بنجاح!</h1>
        <p className="text-muted-foreground">
          سنتواصل معك قريباً لتأكيد الطلب والشحن
        </p>
      </div>

      {/* Order Details */}
      <div className="bg-card border rounded-2xl p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">رقم الطلب</p>
            <p className="font-bold text-xl" data-testid="text-order-id">#{order.id}</p>
          </div>
          <Badge className="text-sm px-3 py-1">{statusMap[order.status] || order.status}</Badge>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 text-sm border-t pt-4">
          <div>
            <p className="text-muted-foreground mb-1">الاسم</p>
            <p className="font-medium">{order.customerName}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">البريد الإلكتروني</p>
            <p className="font-medium">{order.customerEmail}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground mb-1">عنوان التوصيل</p>
            <p className="font-medium">{order.shippingAddress}، {order.shippingCity}، {order.shippingCountry}</p>
          </div>
        </div>

        {/* Items */}
        {order.items && order.items.length > 0 && (
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">المنتجات</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center text-sm" data-testid={`order-item-${item.id}`}>
                  <div className="flex items-center gap-2">
                    {item.productImageUrl && (
                      <img src={item.productImageUrl} alt={item.productName} className="w-10 h-10 object-cover rounded-md bg-muted" />
                    )}
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      <p className="text-muted-foreground">الكمية: {item.quantity} × {item.unitPrice} ر.س</p>
                    </div>
                  </div>
                  <p className="font-bold">{item.total} ر.س</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Totals */}
        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">المجموع الفرعي</span>
            <span>{order.subtotal} ر.س</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">الشحن</span>
            <span>{parseFloat(order.shippingCost as unknown as string) === 0 ? <span className="text-green-600">مجاني</span> : `${order.shippingCost} ر.س`}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>الإجمالي</span>
            <span className="text-primary">{order.total} ر.س</span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">طريقة الدفع: الدفع عند الاستلام</p>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <Link href="/" className="flex-1">
          <Button className="w-full" data-testid="button-back-home">العودة للرئيسية</Button>
        </Link>
        <Link href="/products" className="flex-1">
          <Button variant="outline" className="w-full" data-testid="button-continue-shopping">مواصلة التسوق</Button>
        </Link>
      </div>
    </div>
  );
}
