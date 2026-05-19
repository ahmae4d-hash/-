import { Router } from "express";
import { db } from "@workspace/db";
import { productsTable, categoriesTable, insertProductSchema } from "@workspace/db";
import { eq, ilike, gte, lte, and, desc, sql } from "drizzle-orm";

const router = Router();

function buildProduct(p: any, categoryName?: string | null) {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: parseFloat(p.price),
    comparePrice: p.comparePrice ? parseFloat(p.comparePrice) : null,
    imageUrl: p.imageUrl,
    images: Array.isArray(p.images) ? p.images : [],
    stock: p.stock,
    sku: p.sku,
    categoryId: p.categoryId,
    categoryName: categoryName ?? null,
    isFeatured: p.isFeatured,
    rating: p.rating ? parseFloat(p.rating) : null,
    reviewCount: p.reviewCount ?? 0,
    createdAt: p.createdAt,
  };
}

router.get("/products", async (req, res) => {
  try {
    const { categoryId, search, minPrice, maxPrice, inStock, page = "1", limit = "20" } = req.query as any;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];
    if (categoryId) conditions.push(eq(productsTable.categoryId, parseInt(categoryId)));
    if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
    if (minPrice) conditions.push(gte(productsTable.price, minPrice));
    if (maxPrice) conditions.push(lte(productsTable.price, maxPrice));
    if (inStock === "true") conditions.push(gte(productsTable.stock, 1));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(productsTable)
      .where(where);

    const rows = await db
      .select({
        product: productsTable,
        categoryName: categoriesTable.name,
      })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(where)
      .orderBy(desc(productsTable.createdAt))
      .limit(limitNum)
      .offset(offset);

    res.json({
      products: rows.map((r) => buildProduct(r.product, r.categoryName)),
      total: count,
      page: pageNum,
      limit: limitNum,
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/featured", async (req, res) => {
  try {
    const rows = await db
      .select({ product: productsTable, categoryName: categoriesTable.name })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.isFeatured, true))
      .limit(12);
    res.json(rows.map((r) => buildProduct(r.product, r.categoryName)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [row] = await db
      .select({ product: productsTable, categoryName: categoriesTable.name })
      .from(productsTable)
      .leftJoin(categoriesTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(productsTable.id, id));
    if (!row) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(buildProduct(row.product, row.categoryName));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/products", async (req, res) => {
  try {
    const parsed = insertProductSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [p] = await db.insert(productsTable).values(parsed.data as any).returning();
    res.status(201).json(buildProduct(p));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [p] = await db.update(productsTable).set(req.body).where(eq(productsTable.id, id)).returning();
    if (!p) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.json(buildProduct(p));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/products/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(productsTable).where(eq(productsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
