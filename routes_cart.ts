import { Router } from "express";
import { db } from "@workspace/db";
import { cartItemsTable, productsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

async function getCartData(sessionId: string) {
  const items = await db
    .select({
      id: cartItemsTable.id,
      sessionId: cartItemsTable.sessionId,
      productId: cartItemsTable.productId,
      quantity: cartItemsTable.quantity,
      price: cartItemsTable.price,
      productName: productsTable.name,
      productImageUrl: productsTable.imageUrl,
    })
    .from(cartItemsTable)
    .leftJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
    .where(eq(cartItemsTable.sessionId, sessionId));

  const mapped = items.map((i) => ({
    id: i.id,
    sessionId: i.sessionId,
    productId: i.productId,
    productName: i.productName ?? "",
    productImageUrl: i.productImageUrl ?? null,
    quantity: i.quantity,
    price: parseFloat(i.price as string),
  }));

  const subtotal = mapped.reduce((s, i) => s + i.price * i.quantity, 0);
  const itemCount = mapped.reduce((s, i) => s + i.quantity, 0);
  return { items: mapped, subtotal, itemCount };
}

router.get("/cart", async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      res.status(400).json({ error: "sessionId required" });
      return;
    }
    res.json(await getCartData(sessionId));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/cart/items", async (req, res) => {
  try {
    const { sessionId, productId, quantity } = req.body;
    if (!sessionId || !productId || !quantity) {
      res.status(400).json({ error: "Missing fields" });
      return;
    }

    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const [existing] = await db
      .select()
      .from(cartItemsTable)
      .where(and(eq(cartItemsTable.sessionId, sessionId), eq(cartItemsTable.productId, productId)));

    if (existing) {
      await db
        .update(cartItemsTable)
        .set({ quantity: existing.quantity + quantity })
        .where(eq(cartItemsTable.id, existing.id));
    } else {
      await db.insert(cartItemsTable).values({
        sessionId,
        productId,
        quantity,
        price: product.price,
      });
    }

    res.status(201).json(await getCartData(sessionId));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/cart/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { quantity } = req.body;
    const [item] = await db
      .update(cartItemsTable)
      .set({ quantity })
      .where(eq(cartItemsTable.id, id))
      .returning();
    if (!item) {
      res.status(404).json({ error: "Cart item not found" });
      return;
    }
    res.json(await getCartData(item.sessionId));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cart/items/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [item] = await db.select().from(cartItemsTable).where(eq(cartItemsTable.id, id));
    if (!item) {
      res.status(404).json({ error: "Cart item not found" });
      return;
    }
    await db.delete(cartItemsTable).where(eq(cartItemsTable.id, id));
    res.json(await getCartData(item.sessionId));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/cart/clear", async (req, res) => {
  try {
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      res.status(400).json({ error: "sessionId required" });
      return;
    }
    await db.delete(cartItemsTable).where(eq(cartItemsTable.sessionId, sessionId));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
