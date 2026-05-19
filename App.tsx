import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import { StoreLayout } from "./components/layout/StoreLayout";
import { AdminLayout } from "./components/layout/AdminLayout";
import { Home } from "./pages/Home";
import { Products } from "./pages/Products";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { OrderConfirmation } from "./pages/OrderConfirmation";
import { CategoryPage } from "./pages/CategoryPage";
import { AdminDashboard } from "./pages/admin/Dashboard";
import { AdminOrders } from "./pages/admin/Orders";
import { AdminProducts } from "./pages/admin/Products";
import { AdminCustomers } from "./pages/admin/Customers";
import { AdminCategories } from "./pages/admin/Categories";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
    },
  },
});

const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";

function StoreRouter() {
  return (
    <StoreLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/products" component={Products} />
        <Route path="/products/:id" component={ProductDetail} />
        <Route path="/cart" component={Cart} />
        <Route path="/checkout" component={Checkout} />
        <Route path="/order-confirmation/:id" component={OrderConfirmation} />
        <Route path="/category/:slug" component={CategoryPage} />
        <Route component={NotFound} />
      </Switch>
    </StoreLayout>
  );
}

function AdminRouter() {
  return (
    <WouterRouter base={`${base}/admin`}>
      <AdminLayout>
        <Switch>
          <Route path="/" component={AdminDashboard} />
          <Route path="/orders" component={AdminOrders} />
          <Route path="/products" component={AdminProducts} />
          <Route path="/customers" component={AdminCustomers} />
          <Route path="/categories" component={AdminCategories} />
          <Route component={NotFound} />
        </Switch>
      </AdminLayout>
    </WouterRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={base}>
          <Switch>
            <Route path="/admin" component={AdminRouter} />
            <Route path="/admin/:rest+" component={AdminRouter} />
            <Route path="/:rest*" component={StoreRouter} />
          </Switch>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
