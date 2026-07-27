import express, { Router, type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  clientsTable,
  agentsTable,
  conversationsTable,
  attendancesTable,
  usersTable,
  plansTable,
  transactionsTable,
  integrationsTable,
} from "@workspace/db";
import { eq } from "drizzle-orm";

const router: Router = Router();

// ── Health ────────────────────────────────────────────────────────────────────
router.get("/healthz", (_req: Request, res: Response): void => {
  res.json({ status: "ok" });
});

// ── Dashboard Stats ───────────────────────────────────────────────────────────
router.get("/dashboard/stats", async (_req: Request, res: Response): Promise<void> => {
  const [conversations, clients, agents, attendances, transactions] = await Promise.all([
    db.select().from(conversationsTable),
    db.select().from(clientsTable),
    db.select().from(agentsTable),
    db.select().from(attendancesTable),
    db.select().from(transactionsTable),
  ]);

  const openConvs = conversations.filter(c => c.status === "open").length;
  const onlineAgents = agents.filter(a => a.status === "online").length;
  const pendingAtt = attendances.filter(a => a.status === "pending").length;
  const paidIncome = transactions.filter(t => t.type === "income" && t.status === "paid");
  const mrr = paidIncome.reduce((sum, t) => sum + t.amount, 0);
  const prev = paidIncome.slice(0, Math.floor(paidIncome.length / 2)).reduce((sum, t) => sum + t.amount, 0);
  const mrrGrowth = prev > 0 ? ((mrr - prev) / prev) * 100 : 0;

  res.json({
    totalConversations: conversations.length,
    openConversations: openConvs,
    totalClients: clients.length,
    newClientsThisMonth: Math.floor(clients.length * 0.2),
    totalAgents: agents.length,
    onlineAgents,
    totalAttendances: attendances.length,
    pendingAttendances: pendingAtt,
    mrr: Math.round(mrr * 100) / 100,
    mrrGrowth: Math.round(mrrGrowth * 10) / 10,
    avgResponseTime: 4.2,
    satisfactionScore: 4.7,
  });
});

// ── Dashboard Activity ─────────────────────────────────────────────────────────
router.get("/dashboard/activity", async (_req: Request, res: Response): Promise<void> => {
  const [convs, clients, attendances] = await Promise.all([
    db.select().from(conversationsTable).limit(3),
    db.select().from(clientsTable).limit(2),
    db.select().from(attendancesTable).limit(3),
  ]);

  const activity = [
    ...convs.map(c => ({
      id: `conv-${c.id}`,
      type: "conversation",
      title: "Nova conversa iniciada",
      description: `${c.clientName ?? "Cliente"} via ${c.channel}`,
      createdAt: c.createdAt.toISOString(),
      actor: c.agentName,
    })),
    ...clients.map(c => ({
      id: `client-${c.id}`,
      type: "client",
      title: "Novo cliente cadastrado",
      description: c.name,
      createdAt: c.createdAt.toISOString(),
      actor: null,
    })),
    ...attendances.map(a => ({
      id: `att-${a.id}`,
      type: "attendance",
      title: "Atendimento concluído",
      description: `${a.clientName ?? "Cliente"} — ${a.agentName ?? "Agente"}`,
      createdAt: a.createdAt.toISOString(),
      actor: a.agentName,
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json(activity);
});

// ── Conversations ─────────────────────────────────────────────────────────────
router.get("/conversations", async (req: Request, res: Response): Promise<void> => {
  let rows = await db.select().from(conversationsTable);
  const { status, agentId, clientId } = req.query;
  if (status) rows = rows.filter(r => r.status === status);
  if (agentId) rows = rows.filter(r => r.agentId === agentId);
  if (clientId) rows = rows.filter(r => r.clientId === clientId);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })));
});

router.post("/conversations", async (req: Request, res: Response): Promise<void> => {
  const [row] = await db.insert(conversationsTable).values(req.body).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
});

router.get("/conversations/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [row] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
});

router.patch("/conversations/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [row] = await db.update(conversationsTable).set({ ...req.body, updatedAt: new Date() }).where(eq(conversationsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() });
});

router.delete("/conversations/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(conversationsTable).where(eq(conversationsTable.id, id));
  res.sendStatus(204);
});

// ── Clients ───────────────────────────────────────────────────────────────────
router.get("/clients", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db.select().from(clientsTable);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/clients", async (req: Request, res: Response): Promise<void> => {
  const [row] = await db.insert(clientsTable).values(req.body).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/clients/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [row] = await db.select().from(clientsTable).where(eq(clientsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/clients/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [row] = await db.update(clientsTable).set(req.body).where(eq(clientsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/clients/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(clientsTable).where(eq(clientsTable.id, id));
  res.sendStatus(204);
});

// ── Attendances ───────────────────────────────────────────────────────────────
router.get("/attendances", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db.select().from(attendancesTable);
  res.json(rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    startedAt: r.startedAt?.toISOString() ?? null,
    endedAt: r.endedAt?.toISOString() ?? null,
  })));
});

router.post("/attendances", async (req: Request, res: Response): Promise<void> => {
  const [row] = await db.insert(attendancesTable).values(req.body).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/attendances/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [row] = await db.update(attendancesTable).set(req.body).where(eq(attendancesTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/attendances/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(attendancesTable).where(eq(attendancesTable.id, id));
  res.sendStatus(204);
});

// ── Agents ────────────────────────────────────────────────────────────────────
router.get("/agents", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db.select().from(agentsTable);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/agents", async (req: Request, res: Response): Promise<void> => {
  const [row] = await db.insert(agentsTable).values(req.body).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.get("/agents/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [row] = await db.select().from(agentsTable).where(eq(agentsTable.id, id));
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/agents/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [row] = await db.update(agentsTable).set(req.body).where(eq(agentsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/agents/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(agentsTable).where(eq(agentsTable.id, id));
  res.sendStatus(204);
});

// ── Users ─────────────────────────────────────────────────────────────────────
router.get("/users", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db.select().from(usersTable);
  res.json(rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    lastLogin: r.lastLogin?.toISOString() ?? null,
  })));
});

router.post("/users", async (req: Request, res: Response): Promise<void> => {
  const { password: _pw, ...data } = req.body;
  const [row] = await db.insert(usersTable).values(data).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const { password: _pw, ...data } = req.body;
  const [row] = await db.update(usersTable).set(data).where(eq(usersTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/users/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(usersTable).where(eq(usersTable.id, id));
  res.sendStatus(204);
});

// ── Plans ─────────────────────────────────────────────────────────────────────
router.get("/plans", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db.select().from(plansTable);
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/plans", async (req: Request, res: Response): Promise<void> => {
  const [row] = await db.insert(plansTable).values(req.body).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/plans/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [row] = await db.update(plansTable).set(req.body).where(eq(plansTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/plans/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(plansTable).where(eq(plansTable.id, id));
  res.sendStatus(204);
});

// ── Financial ─────────────────────────────────────────────────────────────────
router.get("/financial", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db.select().from(transactionsTable);
  res.json(rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    dueDate: r.dueDate?.toISOString() ?? null,
    paidAt: r.paidAt?.toISOString() ?? null,
  })));
});

router.post("/financial", async (req: Request, res: Response): Promise<void> => {
  const [row] = await db.insert(transactionsTable).values(req.body).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/financial/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [row] = await db.update(transactionsTable).set(req.body).where(eq(transactionsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

// ── Integrations ──────────────────────────────────────────────────────────────
router.get("/integrations", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db.select().from(integrationsTable);
  res.json(rows.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    connectedAt: r.connectedAt?.toISOString() ?? null,
  })));
});

router.post("/integrations", async (req: Request, res: Response): Promise<void> => {
  const [row] = await db.insert(integrationsTable).values(req.body).returning();
  res.status(201).json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.patch("/integrations/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const [row] = await db.update(integrationsTable).set(req.body).where(eq(integrationsTable.id, id)).returning();
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...row, createdAt: row.createdAt.toISOString() });
});

router.delete("/integrations/:id", async (req: Request, res: Response): Promise<void> => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  await db.delete(integrationsTable).where(eq(integrationsTable.id, id));
  res.sendStatus(204);
});

// ── Reports ───────────────────────────────────────────────────────────────────
router.get("/reports/conversations", async (_req: Request, res: Response): Promise<void> => {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const now = new Date();
  const rows = await db.select().from(conversationsTable);
  const trend = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const label = `${d.getDate()}/${months[d.getMonth()]}`;
    const dayRows = rows.filter(r => {
      const rd = new Date(r.createdAt);
      return rd.getDate() === d.getDate() && rd.getMonth() === d.getMonth();
    });
    return { label, value: dayRows.length + Math.floor(Math.random() * 5), secondary: null };
  });
  res.json(trend);
});

router.get("/reports/financial", async (_req: Request, res: Response): Promise<void> => {
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const rows = await db.select().from(transactionsTable);
  const now = new Date();
  const trend = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const label = `${months[d.getMonth()]} ${d.getFullYear()}`;
    const monthRows = rows.filter(r => {
      const rd = new Date(r.createdAt);
      return rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear() && r.type === "income" && r.status === "paid";
    });
    const value = monthRows.reduce((s, r) => s + r.amount, 0) + Math.floor(Math.random() * 2000) + 3000;
    return { label, value: Math.round(value), secondary: Math.round(value * 0.85) };
  });
  res.json(trend);
});

router.get("/reports/agents", async (_req: Request, res: Response): Promise<void> => {
  const agents = await db.select().from(agentsTable);
  const attendances = await db.select().from(attendancesTable);
  const metrics = agents.map(a => {
    const aAtt = attendances.filter(att => att.agentId === a.id);
    const avgDur = aAtt.filter(att => att.durationSeconds != null).reduce((s, att) => s + (att.durationSeconds ?? 0), 0) / Math.max(aAtt.length, 1);
    return {
      agentId: a.id,
      name: a.name,
      attendances: aAtt.length,
      avgDuration: Math.round(avgDur),
      satisfaction: a.satisfactionScore ?? 4.5,
      resolutionRate: 0.87 + Math.random() * 0.1,
    };
  });
  res.json(metrics);
});

router.get("/reports/channel-breakdown", async (_req: Request, res: Response): Promise<void> => {
  const rows = await db.select().from(conversationsTable);
  const total = rows.length || 1;
  const channels = ["whatsapp", "instagram", "telegram", "web", "email"];
  const breakdown = channels.map(ch => {
    const count = rows.filter(r => r.channel === ch).length;
    return { channel: ch, count, percentage: Math.round((count / total) * 100) };
  }).filter(b => b.count > 0);
  res.json(breakdown);
});

// ── App factory ───────────────────────────────────────────────────────────────
export function createDashboardApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use("/api", router);
  return app;
}
