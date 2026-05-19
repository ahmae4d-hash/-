import { Router } from "express";
import { db } from "@workspace/db";
import { categoriesTable, insertCategorySchema, productsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.get("/categories", async (req, res) => {
  try {
    const cats = await db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
        description: categoriesTable.description,
        imageUrl: categoriesTable.imageUrl,
        createdAt: categoriesTable.createdAt,
        productCount: sql<number>`cast(count(${productsTable.id}) as int)`,
      })
      .from(categoriesTable)
      .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
      .groupBy(categoriesTable.id);
    res.json(cats);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/categories", async (req, res) => {
  try {
    const parsed = insertCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [cat] = await db.insert(categoriesTable).values(parsed.data).returning();
    res.status(201).json({ ...cat, productCount: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [cat] = await db
      .select({
        id: categoriesTable.id,
        name: categoriesTable.name,
        slug: categoriesTable.slug,
        description: categoriesTable.description,
        imageUrl: categoriesTable.imageUrl,
        createdAt: categoriesTable.createdAt,
        productCount: sql<number>`cast(count(${productsTable.id}) as int)`,
      })
      .from(categoriesTable)
      .leftJoin(productsTable, eq(productsTable.categoryId, categoriesTable.id))
      .where(eq(categoriesTable.id, id))
      .groupBy(categoriesTable.id);
    if (!cat) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json(cat);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.patch("/categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [cat] = await db
      .update(categoriesTable)
      .set(req.body)
      .where(eq(categoriesTable.id, id))
      .returning();
    if (!cat) {
      res.status(404).json({ error: "Category not found" });
      return;
    }
    res.json({ ...cat, productCount: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/categories/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
