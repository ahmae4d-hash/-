import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable, customersTable, categoriesTable } from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [[totalOrders], [totalRevenue], [totalProducts], [totalCustomers], [pendingOrders], [todayStats]] =
      await Promise.all([
        db.select({ count: sql<number>`cast(count(*) as int)` }).from(ordersTable),
        db.select({ sum: sql<number>`cast(coalesce(sum(cast(total as numeric)), 0) as float)` }).from(ordersTable),
        db.select({ count: sql<number>`cast(count(*) as int)` }).from(productsTable),
        db.select({ count: sql<number>`cast(count(*) as int)` }).from(customersTable),
        db
          .select({ count: sql<number>`cast(count(*) as int)` })
          .from(ordersTable)
          .where(eq(ordersTable.status, "pending")),
        db
          .select({
            count: sql<number>`cast(count(*) as int)`,
            revenue: sql<number>`cast(coalesce(sum(cast(total as numeric)), 0) as float)`,
          })
          .from(ordersTable)
          .where(gte(ordersTable.createdAt, today)),
      ]);

    res.json({
      totalOrders: totalOrders.count,
      totalRevenue: totalRevenue.sum,
      totalProducts: totalProducts.count,
      totalCustomers: totalCustomers.count,
      pendingOrders: pendingOrders.count,
      todayOrders: todayStats.count,
      todayRevenue: todayStats.revenue,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/recent-orders", async (req, res) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) ?? "10"), 50);
    const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt)).limit(limit);
    const ordersWithItems = await Promise.all(
      orders.map(async (o) => {
        const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, o.id));
        return {
          ...o,
          subtotal: parseFloat(o.subtotal as string),
          shippingCost: parseFloat(o.shippingCost as string),
          total: parseFloat(o.total as string),
          items: items.map((i) => ({
            ...i,
            unitPrice: parseFloat(i.unitPrice as string),
            total: parseFloat(i.total as string),
          })),
        };
      })
    );
    res.json(ordersWithItems);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/sales-by-category", async (req, res) => {
  try {
    const rows = await db
      .select({
        categoryId: categoriesTable.id,
        categoryName: categoriesTable.name,
        totalSales: sql<number>`cast(coalesce(sum(cast(${orderItemsTable.total} as numeric)), 0) as float)`,
        orderCount: sql<number>`cast(count(distinct ${orderItemsTable.orderId}) as int)`,
      })
      .from(categoriesTable)
      .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
      .leftJoin(orderItemsTable, eq(orderItemsTable.productId, productsTable.id))
      .groupBy(categoriesTable.id, categoriesTable.name)
      .orderBy(desc(sql`sum(cast(${orderItemsTable.total} as numeric))`));
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/top-products", async (req, res) => {
  try {
    const limit = Math.min(parseInt((req.query.limit as string) ?? "10"), 50);
    const rows = await db
      .select({
        productId: productsTable.id,
        productName: productsTable.name,
        productImageUrl: productsTable.imageUrl,
        totalSold: sql<number>`cast(coalesce(sum(${orderItemsTable.quantity}), 0) as int)`,
        revenue: sql<number>`cast(coalesce(sum(cast(${orderItemsTable.total} as numeric)), 0) as float)`,
      })
      .from(productsTable)
      .leftJoin(orderItemsTable, eq(orderItemsTable.productId, productsTable.id))
      .groupBy(productsTable.id, productsTable.name, productsTable.imageUrl)
      .orderBy(desc(sql`sum(${orderItemsTable.quantity})`))
      .limit(limit);
    res.json(rows);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
