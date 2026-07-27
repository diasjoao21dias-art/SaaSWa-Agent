import { pgTable, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const transactionsTable = pgTable("dashboard_transactions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  description: text("description").notNull(),
  amount: real("amount").notNull(),
  type: text("type").notNull().default("income"),
  status: text("status").notNull().default("pending"),
  clientId: text("client_id"),
  clientName: text("client_name"),
  planId: text("plan_id"),
  planName: text("plan_name"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertTransactionSchema = createInsertSchema(transactionsTable).omit({ id: true, createdAt: true });
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;
