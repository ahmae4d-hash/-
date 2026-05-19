import { Router } from "express";
import { db } from "@workspace/db";
import { ordersTable, orderItemsTable, productsTable, cartItemsTable } from "@workspace/db";
import { eq, desc, and, sql } from "drizzle-orm";

const router = Router();

async function getOrderWithItems(orderId: number) {
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, orderId));
  if (!order) return null;
  const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, orderId));
  return {
    ...order,
    subtotal: parseFloat(order.subtotal as string),
    shippingCost: parseFloat(order.shippingCost as string),
    total: parseFloat(order.total as string),
    items: items.map((i) => ({
      ...i,
      unitPrice: parseFloat(i.unitPrice as string),
      total: parseFloat(i.total as string),
    })),
  };
}

router.get("/orders", async (req, res) => {
  try {
    const { status, customerId, page = "1", limit = "20" } = req.query as any;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];
    if (status) conditions.push(eq(ordersTable.status, status));
    if (customerId) conditions.push(eq(ordersTable.customerId, parseInt(customerId)));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(ordersTable)
      .where(where);

    const orders = await db
      .select()
      .from(ordersTable)
      .where(where)
      .orderBy(desc(ordersTable.createdAt))
      .limit(limitNum)
      .offset(offset);

    const ordersWithItems = await Promise.all(orders.map((o) => getOrderWithItems(o.id)));

    res.json({ orders: ordersWithItems.filter(Boolean), total: count, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/orders", async (req, res) => {
  try {
    const { customerId, customerName, customerEmail, customerPhone, shippingAddress, shippingCity,
      shippingCountry, notes, sessionId, items } = req.body;

    if (!customerName || !customerEmail || !shippingAddress || !shippingCity || !shippingCountry) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    let orderItems = items;

    if (sessionId && (!orderItems || orderItems.length === 0)) {
      const cartItems = await db.select().from(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
      orderItems = cartItems.map((c: any) => ({ productId: c.productId, quantity: c.quantity }));
    }

    if (!orderItems || orderItems.length === 0) {
      res.status(400).json({ error: "No items in order" });
      return;
    }

    let subtotal = 0;
    const itemsWithPrices = await Promise.all(
      orderItems.map(async (item: { productId: number; quantity: number }) => {
        const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
        if (!product) throw new Error(`Product ${item.productId} not found`);
        const lineTotal = parseFloat(product.price as string) * item.quantity;
        subtotal += lineTotal;
        return {
          productId: item.productId,
          productName: product.name,
          productImageUrl: product.imageUrl,
          quantity: item.quantity,
          unitPrice: product.price,
          total: lineTotal.toFixed(2),
        };
      })
    );

    const shippingCost = subtotal >= 100 ? 0 : 10;
    const total = subtotal + shippingCost;

    const [order] = await db.insert(ordersTable).values({
      customerId: customerId ?? null,
      customerName,
      customerEmail,
      customerPhone: customerPhone ?? null,
      shippingAddress,
      shippingCity,
      shippingCountry,
      status: "pending",
      subtotal: subtotal.toFixed(2),
      shippingCost: shippingCost.toFixed(2),
      total: total.toFixed(2),
      notes: notes ?? null,
    }).returning();

    await db.insert(orderItemsTable).values(
      itemsWithPrices.map((i) => ({ ...i, orderId: order.id }))
    );

    if (sessionId) {
      await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
    }

    res.status(201).json(await getOrderWithItems(order.id));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const order = await getOrderWithItems(id);
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(order);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/orders/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const [order] = await db
      .update(ordersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(await getOrderWithItems(order.id));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
