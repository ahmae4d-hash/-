import { useState } from "react";
import { useListCustomers, getListCustomersQueryKey } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

export function AdminCustomers() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const queryParams = { search: search || undefined, page, limit: 20 };
  const { data, isLoading } = useListCustomers(queryParams);

  const customers = data?.customers ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / 20);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">العملاء</h1>
        <div className="text-sm text-muted-foreground">{total} عميل</div>
      </div>

      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="search" placeholder="ابحث عن عميل..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pr-10" data-testid="search-customers"
        />
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>العميل</TableHead>
              <TableHead>رقم الهاتف</TableHead>
              <TableHead>المدينة</TableHead>
              <TableHead>عدد الطلبات</TableHead>
              <TableHead>إجمالي الإنفاق</TableHead>
              <TableHead>تاريخ التسجيل</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>{Array.from({ length: 6 }).map((_, j) => <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>
            )) : customers.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground">لا يوجد عملاء</TableCell></TableRow>
            ) : customers.map((customer: any) => (
              <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                <TableCell>
                  <div className="font-medium">{customer.name}</div>
                  <div className="text-xs text-muted-foreground">{customer.email}</div>
                </TableCell>
                <TableCell className="text-sm">{customer.phone || "—"}</TableCell>
                <TableCell className="text-sm">{customer.city || "—"}</TableCell>
                <TableCell className="font-bold">{customer.orderCount}</TableCell>
                <TableCell className="font-bold text-primary">{(customer.totalSpent ?? 0).toFixed(2)} ر.س</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(customer.createdAt).toLocaleDateString("ar-SA")}
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
    </div>
  );
}
