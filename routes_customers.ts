import { Router } from "express";
import { db } from "@workspace/db";
import { customersTable, ordersTable, insertCustomerSchema } from "@workspace/db";
import { eq, ilike, desc, sql } from "drizzle-orm";

const router = Router();

router.get("/customers", async (req, res) => {
  try {
    const { search, page = "1", limit = "20" } = req.query as any;
    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 100);
    const offset = (pageNum - 1) * limitNum;

    const where = search ? ilike(customersTable.name, `%${search}%`) : undefined;

    const [{ count }] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(customersTable)
      .where(where);

    const customers = await db
      .select({
        id: customersTable.id,
        name: customersTable.name,
        email: customersTable.email,
        phone: customersTable.phone,
        address: customersTable.address,
        city: customersTable.city,
        country: customersTable.country,
        createdAt: customersTable.createdAt,
        orderCount: sql<number>`cast(count(${ordersTable.id}) as int)`,
        totalSpent: sql<number>`cast(coalesce(sum(cast(${ordersTable.total} as numeric)), 0) as float)`,
      })
      .from(customersTable)
      .leftJoin(ordersTable, eq(ordersTable.customerId, customersTable.id))
      .where(where)
      .groupBy(customersTable.id)
      .orderBy(desc(customersTable.createdAt))
      .limit(limitNum)
      .offset(offset);

    res.json({ customers, total: count, page: pageNum, limit: limitNum });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/customers", async (req, res) => {
  try {
    const parsed = insertCustomerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [customer] = await db.insert(customersTable).values(parsed.data).returning();
    res.status(201).json({ ...customer, orderCount: 0, totalSpent: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/customers/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [customer] = await db
      .select({
        id: customersTable.id,
        name: customersTable.name,
        email: customersTable.email,
        phone: customersTable.phone,
        address: customersTable.address,
        city: customersTable.city,
        country: customersTable.country,
        createdAt: customersTable.createdAt,
        orderCount: sql<number>`cast(count(${ordersTable.id}) as int)`,
        totalSpent: sql<number>`cast(coalesce(sum(cast(${ordersTable.total} as numeric)), 0) as float)`,
      })
      .from(customersTable)
      .leftJoin(ordersTable, eq(ordersTable.customerId, customersTable.id))
      .where(eq(customersTable.id, id))
      .groupBy(customersTable.id);
    if (!customer) {
      res.status(404).json({ error: "Customer not found" });
      return;
    }
    res.json(customer);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
