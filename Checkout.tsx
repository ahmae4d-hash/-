import { useCartSession } from "@/hooks/use-cart-session";
import { useGetCart, useCreateOrder, getGetCartQueryKey, getGetOrderQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Package } from "lucide-react";

const schema = z.object({
  customerName: z.string().min(2, "الاسم مطلوب"),
  customerEmail: z.string().email("البريد الإلكتروني غير صحيح"),
  customerPhone: z.string().optional(),
  shippingAddress: z.string().min(5, "العنوان مطلوب"),
  shippingCity: z.string().min(2, "المدينة مطلوبة"),
  shippingCountry: z.string().min(2, "الدولة مطلوبة"),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function Checkout() {
  const sessionId = useCartSession();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cart, isLoading } = useGetCart(
    { sessionId: sessionId || "" },
    { query: { enabled: !!sessionId, queryKey: getGetCartQueryKey({ sessionId: sessionId || "" }) } }
  );

  const createOrder = useCreateOrder({
    mutation: {
      onSuccess: (order) => {
        queryClient.invalidateQueries({ queryKey: getGetCartQueryKey({ sessionId: sessionId || "" }) });
        setLocation(`/order-confirmation/${order.id}`);
      },
      onError: () => {
        toast({ title: "خطأ", description: "حدث خطأ أثناء تقديم الطلب", variant: "destructive" });
      }
    }
  });

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { shippingCountry: "المملكة العربية السعودية" }
  });

  const onSubmit = (data: FormData) => {
    if (!sessionId || !cart?.items.length) return;
    createOrder.mutate({
      data: {
        ...data,
        sessionId,
        items: [],
      }
    });
  };

  if (!sessionId || isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground mb-4">سلتك فارغة</p>
        <Link href="/products"><Button>تسوق الآن</Button></Link>
      </div>
    );
  }

  const shipping = cart.subtotal >= 100 ? 0 : 10;
  const total = cart.subtotal + shipping;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-8">إتمام الطلب</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2">
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-lg border-b pb-3">بيانات الاتصال</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customerName">الاسم الكامل *</Label>
                  <Input id="customerName" {...form.register("customerName")} className="mt-1" placeholder="محمد أحمد" data-testid="input-name" />
                  {form.formState.errors.customerName && <p className="text-xs text-destructive mt-1">{form.formState.errors.customerName.message}</p>}
                </div>
                <div>
                  <Label htmlFor="customerEmail">البريد الإلكتروني *</Label>
                  <Input id="customerEmail" type="email" {...form.register("customerEmail")} className="mt-1" placeholder="example@email.com" data-testid="input-email" />
                  {form.formState.errors.customerEmail && <p className="text-xs text-destructive mt-1">{form.formState.errors.customerEmail.message}</p>}
                </div>
              </div>
              <div>
                <Label htmlFor="customerPhone">رقم الهاتف</Label>
                <Input id="customerPhone" {...form.register("customerPhone")} className="mt-1" placeholder="05xxxxxxxx" data-testid="input-phone" />
              </div>
            </div>

            <div className="bg-card border rounded-xl p-6 space-y-4">
              <h2 className="font-bold text-lg border-b pb-3">عنوان التوصيل</h2>
              <div>
                <Label htmlFor="shippingAddress">العنوان *</Label>
                <Input id="shippingAddress" {...form.register("shippingAddress")} className="mt-1" placeholder="شارع، حي، رقم المبنى" data-testid="input-address" />
                {form.formState.errors.shippingAddress && <p className="text-xs text-destructive mt-1">{form.formState.errors.shippingAddress.message}</p>}
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shippingCity">المدينة *</Label>
                  <Input id="shippingCity" {...form.register("shippingCity")} className="mt-1" placeholder="الرياض" data-testid="input-city" />
                  {form.formState.errors.shippingCity && <p className="text-xs text-destructive mt-1">{form.formState.errors.shippingCity.message}</p>}
                </div>
                <div>
                  <Label htmlFor="shippingCountry">الدولة *</Label>
                  <Input id="shippingCountry" {...form.register("shippingCountry")} className="mt-1" data-testid="input-country" />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">ملاحظات إضافية</Label>
                <Textarea id="notes" {...form.register("notes")} className="mt-1" placeholder="أي تعليمات خاصة للتوصيل..." data-testid="input-notes" />
              </div>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
              <Package className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className="font-semibold text-sm">الدفع عند الاستلام</p>
                <p className="text-sm text-muted-foreground">ستدفع المبلغ نقداً عند استلام طلبك</p>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full h-14 text-base font-bold"
              disabled={createOrder.isPending}
              data-testid="button-place-order"
            >
              {createOrder.isPending ? "جاري تأكيد الطلب..." : `تأكيد الطلب — ${total.toFixed(2)} ر.س`}
            </Button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <div className="bg-card border rounded-xl p-5">
            <h2 className="font-bold mb-4 border-b pb-3">ملخص الطلب</h2>
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.id} className="flex gap-3" data-testid={`summary-item-${item.id}`}>
                  {item.productImageUrl && (
                    <img src={item.productImageUrl} alt={item.productName} className="w-12 h-12 object-cover rounded-md bg-muted" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium line-clamp-1">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">الكمية: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold shrink-0">{(item.price * item.quantity).toFixed(2)} ر.س</p>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">المجموع الفرعي</span>
                <span>{cart.subtotal.toFixed(2)} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">الشحن</span>
                <span>{shipping === 0 ? <span className="text-green-600">مجاني</span> : `${shipping} ر.س`}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-2 border-t">
                <span>الإجمالي</span>
                <span className="text-primary">{total.toFixed(2)} ر.س</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
