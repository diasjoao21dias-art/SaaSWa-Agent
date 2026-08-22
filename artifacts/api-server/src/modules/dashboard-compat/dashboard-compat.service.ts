// =============================================================================
// DashboardCompatService — serves the Express-era dashboard API routes
// reads from dashboard_* tables (Drizzle schema, same DB) via Prisma $queryRaw
// =============================================================================
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardCompatService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Conversations ──────────────────────────────────────────────────────────
  async listConversations(params: { status?: string; agentId?: string; clientId?: string }) {
    const where: string[] = [];
    if (params.status) where.push(`status = '${params.status.replace(/'/g, '')}'`);
    if (params.agentId) where.push(`agent_id = '${params.agentId.replace(/'/g, '')}'`);
    if (params.clientId) where.push(`client_id = '${params.clientId.replace(/'/g, '')}'`);
    const sql = `SELECT * FROM dashboard_conversations${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY updated_at DESC`;
    const rows: any[] = await this.prisma.$queryRawUnsafe(sql);
    return rows.map(this.mapConversation);
  }

  async getConversation(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT * FROM dashboard_conversations WHERE id = $1`, id
    );
    return rows[0] ? this.mapConversation(rows[0]) : null;
  }

  async createConversation(data: any) {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO dashboard_conversations (id, client_id, client_name, agent_id, agent_name, status, channel, last_message, unread_count, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`,
      id, data.clientId||null, data.clientName||null, data.agentId||null, data.agentName||null,
      data.status||'open', data.channel||'whatsapp', data.lastMessage||'', data.unreadCount||0
    );
    return this.getConversation(id);
  }

  async updateConversation(id: string, data: any) {
    const sets: string[] = ['updated_at = now()'];
    const vals: any[] = [];
    let i = 1;
    if (data.status !== undefined) { sets.push(`status = $${i++}`); vals.push(data.status); }
    if (data.lastMessage !== undefined) { sets.push(`last_message = $${i++}`); vals.push(data.lastMessage); }
    if (data.unreadCount !== undefined) { sets.push(`unread_count = $${i++}`); vals.push(data.unreadCount); }
    if (data.agentId !== undefined) { sets.push(`agent_id = $${i++}`); vals.push(data.agentId); }
    if (data.agentName !== undefined) { sets.push(`agent_name = $${i++}`); vals.push(data.agentName); }
    vals.push(id);
    await this.prisma.$executeRawUnsafe(
      `UPDATE dashboard_conversations SET ${sets.join(', ')} WHERE id = $${i}`, ...vals
    );
    return this.getConversation(id);
  }

  async deleteConversation(id: string) {
    await this.prisma.$executeRawUnsafe(`DELETE FROM dashboard_conversations WHERE id = $1`, id);
  }

  private mapConversation(r: any) {
    return {
      id: r.id, clientId: r.client_id, clientName: r.client_name,
      agentId: r.agent_id, agentName: r.agent_name, status: r.status,
      channel: r.channel, lastMessage: r.last_message, unreadCount: Number(r.unread_count),
      createdAt: r.created_at, updatedAt: r.updated_at,
    };
  }

  // ─── Clients ────────────────────────────────────────────────────────────────
  async listClients() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM dashboard_clients ORDER BY created_at DESC`);
    return rows.map(this.mapClient);
  }

  async getClient(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM dashboard_clients WHERE id = $1`, id);
    return rows[0] ? this.mapClient(rows[0]) : null;
  }

  async createClient(data: any) {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO dashboard_clients (id, name, email, phone, company, status, total_conversations, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now())`,
      id, data.name, data.email||null, data.phone||null, data.company||null, data.status||'active', 0
    );
    return this.getClient(id);
  }

  async updateClient(id: string, data: any) {
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (data.name !== undefined) { sets.push(`name = $${i++}`); vals.push(data.name); }
    if (data.email !== undefined) { sets.push(`email = $${i++}`); vals.push(data.email); }
    if (data.phone !== undefined) { sets.push(`phone = $${i++}`); vals.push(data.phone); }
    if (data.company !== undefined) { sets.push(`company = $${i++}`); vals.push(data.company); }
    if (data.status !== undefined) { sets.push(`status = $${i++}`); vals.push(data.status); }
    if (!sets.length) return this.getClient(id);
    vals.push(id);
    await this.prisma.$executeRawUnsafe(`UPDATE dashboard_clients SET ${sets.join(', ')} WHERE id = $${i}`, ...vals);
    return this.getClient(id);
  }

  async deleteClient(id: string) {
    await this.prisma.$executeRawUnsafe(`DELETE FROM dashboard_clients WHERE id = $1`, id);
  }

  private mapClient(r: any) {
    return {
      id: r.id, name: r.name, email: r.email, phone: r.phone,
      company: r.company, status: r.status,
      totalConversations: Number(r.total_conversations), createdAt: r.created_at,
    };
  }

  // ─── Agents ─────────────────────────────────────────────────────────────────
  async listAgents() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM dashboard_agents ORDER BY created_at DESC`);
    return rows.map(this.mapAgent);
  }

  async getAgent(id: string) {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM dashboard_agents WHERE id = $1`, id);
    return rows[0] ? this.mapAgent(rows[0]) : null;
  }

  async createAgent(data: any) {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO dashboard_agents (id, name, email, role, status, active_conversations, total_attendances, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,now())`,
      id, data.name, data.email||'', data.role||'agent', data.status||'offline', 0, 0
    );
    return this.getAgent(id);
  }

  async updateAgent(id: string, data: any) {
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (data.name !== undefined) { sets.push(`name = $${i++}`); vals.push(data.name); }
    if (data.status !== undefined) { sets.push(`status = $${i++}`); vals.push(data.status); }
    if (data.role !== undefined) { sets.push(`role = $${i++}`); vals.push(data.role); }
    if (!sets.length) return this.getAgent(id);
    vals.push(id);
    await this.prisma.$executeRawUnsafe(`UPDATE dashboard_agents SET ${sets.join(', ')} WHERE id = $${i}`, ...vals);
    return this.getAgent(id);
  }

  async deleteAgent(id: string) {
    await this.prisma.$executeRawUnsafe(`DELETE FROM dashboard_agents WHERE id = $1`, id);
  }

  private mapAgent(r: any) {
    return {
      id: r.id, name: r.name, email: r.email, role: r.role, status: r.status,
      avatar: r.avatar, activeConversations: Number(r.active_conversations),
      totalAttendances: Number(r.total_attendances),
      satisfactionScore: r.satisfaction_score ? Number(r.satisfaction_score) : null,
      createdAt: r.created_at,
    };
  }

  // ─── Attendances ────────────────────────────────────────────────────────────
  async listAttendances() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM dashboard_attendances ORDER BY created_at DESC`);
    return rows.map(this.mapAttendance);
  }

  async createAttendance(data: any) {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO dashboard_attendances (id, conversation_id, client_id, client_name, agent_id, agent_name, status, channel, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,now())`,
      id, data.conversationId||null, data.clientId||null, data.clientName||null,
      data.agentId||null, data.agentName||null, data.status||'pending', data.channel||'whatsapp'
    );
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM dashboard_attendances WHERE id = $1`, id);
    return rows[0] ? this.mapAttendance(rows[0]) : null;
  }

  async updateAttendance(id: string, data: any) {
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (data.status !== undefined) { sets.push(`status = $${i++}`); vals.push(data.status); }
    if (data.notes !== undefined) { sets.push(`notes = $${i++}`); vals.push(data.notes); }
    if (!sets.length) return;
    vals.push(id);
    await this.prisma.$executeRawUnsafe(`UPDATE dashboard_attendances SET ${sets.join(', ')} WHERE id = $${i}`, ...vals);
  }

  async deleteAttendance(id: string) {
    await this.prisma.$executeRawUnsafe(`DELETE FROM dashboard_attendances WHERE id = $1`, id);
  }

  private mapAttendance(r: any) {
    return {
      id: r.id, conversationId: r.conversation_id, clientId: r.client_id,
      clientName: r.client_name, agentId: r.agent_id, agentName: r.agent_name,
      status: r.status, channel: r.channel, startedAt: r.started_at,
      endedAt: r.ended_at, durationSeconds: r.duration_seconds ? Number(r.duration_seconds) : null,
      notes: r.notes, createdAt: r.created_at,
    };
  }

  // ─── Users ──────────────────────────────────────────────────────────────────
  async listUsers() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM dashboard_users ORDER BY created_at DESC`);
    return rows.map(this.mapUser);
  }

  async createUser(data: any) {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO dashboard_users (id, name, email, role, status, created_at) VALUES ($1,$2,$3,$4,$5,now())`,
      id, data.name, data.email, data.role||'member', data.status||'active'
    );
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM dashboard_users WHERE id = $1`, id);
    return rows[0] ? this.mapUser(rows[0]) : null;
  }

  async updateUser(id: string, data: any) {
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (data.name !== undefined) { sets.push(`name = $${i++}`); vals.push(data.name); }
    if (data.email !== undefined) { sets.push(`email = $${i++}`); vals.push(data.email); }
    if (data.role !== undefined) { sets.push(`role = $${i++}`); vals.push(data.role); }
    if (data.status !== undefined) { sets.push(`status = $${i++}`); vals.push(data.status); }
    if (!sets.length) return;
    vals.push(id);
    await this.prisma.$executeRawUnsafe(`UPDATE dashboard_users SET ${sets.join(', ')} WHERE id = $${i}`, ...vals);
  }

  async deleteUser(id: string) {
    await this.prisma.$executeRawUnsafe(`DELETE FROM dashboard_users WHERE id = $1`, id);
  }

  private mapUser(r: any) {
    return {
      id: r.id, name: r.name, email: r.email, role: r.role,
      status: r.status, avatar: r.avatar, lastLogin: r.last_login, createdAt: r.created_at,
    };
  }

  // ─── Plans ──────────────────────────────────────────────────────────────────
  async listPlans() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM dashboard_plans ORDER BY price ASC`);
    return rows.map(this.mapPlan);
  }

  async createPlan(data: any) {
    const { v4: uuidv4 } = await import('uuid');
    const id = uuidv4();
    const feats = Array.isArray(data.features) ? `'{${data.features.map((f: string) => `"${f}"`).join(',')}}'` : "'{}'";
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO dashboard_plans (id, name, description, price, interval, is_active, subscriber_count, features, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,${feats}::text[],now())`,
      id, data.name, data.description||null, data.price||0, data.interval||'monthly', true, 0
    );
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM dashboard_plans WHERE id = $1`, id);
    return rows[0] ? this.mapPlan(rows[0]) : null;
  }

  async updatePlan(id: string, data: any) {
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (data.name !== undefined) { sets.push(`name = $${i++}`); vals.push(data.name); }
    if (data.price !== undefined) { sets.push(`price = $${i++}`); vals.push(data.price); }
    if (data.isActive !== undefined) { sets.push(`is_active = $${i++}`); vals.push(data.isActive); }
    if (!sets.length) return;
    vals.push(id);
    await this.prisma.$executeRawUnsafe(`UPDATE dashboard_plans SET ${sets.join(', ')} WHERE id = $${i}`, ...vals);
  }

  async deletePlan(id: string) {
    await this.prisma.$executeRawUnsafe(`DELETE FROM dashboard_plans WHERE id = $1`, id);
  }

  private mapPlan(r: any) {
    return {
      id: r.id, name: r.name, description: r.description,
      price: Number(r.price), interval: r.interval,
      isActive: r.is_active, subscriberCount: Number(r.subscriber_count),
      maxAgents: r.max_agents ? Number(r.max_agents) : null,
      maxConversations: r.max_conversations ? Number(r.max_conversations) : null,
      features: r.features || [], createdAt: r.created_at,
    };
  }

  // ─── Financial / Transactions ────────────────────────────────────────────────
  async listTransactions() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM dashboard_transactions ORDER BY created_at DESC`);
    return rows.map(this.mapTransaction);
  }

  async getFinancialReport() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      WITH months AS (
        SELECT generate_series(
          (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '11 months')::date,
          DATE_TRUNC('month', CURRENT_DATE)::date,
          '1 month'::interval
        )::date AS month
      )
      SELECT
        to_char(m.month, 'MM/YYYY') AS label,
        COALESCE(SUM(t.amount) FILTER (WHERE t.type = 'income' AND t.status = 'paid'), 0) AS value
      FROM months m
      LEFT JOIN dashboard_transactions t ON DATE_TRUNC('month', t.created_at) = m.month
      GROUP BY m.month
      ORDER BY m.month ASC
    `);
    return rows.map(r => ({ label: r.label, value: Number(r.value) }));
  }

  private mapTransaction(r: any) {
    return {
      id: r.id, description: r.description, amount: Number(r.amount),
      type: r.type, status: r.status, clientId: r.client_id,
      clientName: r.client_name, planId: r.plan_id, planName: r.plan_name,
      dueDate: r.due_date, paidAt: r.paid_at, createdAt: r.created_at,
    };
  }

  // ─── Integrations ────────────────────────────────────────────────────────────
  async listIntegrations() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM dashboard_integrations ORDER BY name ASC`);
    return rows.map(this.mapIntegration);
  }

  async updateIntegration(id: string, data: any) {
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (data.isActive !== undefined) { sets.push(`is_active = $${i++}`); vals.push(data.isActive); }
    if (data.status !== undefined) { sets.push(`status = $${i++}`); vals.push(data.status); }
    if (!sets.length) return;
    vals.push(id);
    await this.prisma.$executeRawUnsafe(`UPDATE dashboard_integrations SET ${sets.join(', ')} WHERE id = $${i}`, ...vals);
    const rows: any[] = await this.prisma.$queryRawUnsafe(`SELECT * FROM dashboard_integrations WHERE id = $1`, id);
    return rows[0] ? this.mapIntegration(rows[0]) : null;
  }

  private mapIntegration(r: any) {
    return {
      id: r.id, name: r.name, type: r.type, description: r.description,
      isActive: r.is_active, status: r.status, icon: r.icon,
      connectedAt: r.connected_at, createdAt: r.created_at,
    };
  }

  // ─── Dashboard Stats ─────────────────────────────────────────────────────────
  async getDashboardStats() {
    const [convRows, clientRows, agentRows, finRows, attRows, scoreRows, responseRows]: any[] = await Promise.all([
      this.prisma.$queryRawUnsafe(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'open') AS open_count,
          COUNT(*) FILTER (WHERE status = 'pending') AS pending_count
        FROM dashboard_conversations
      `),
      this.prisma.$queryRawUnsafe(`
        SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'active') AS active_count
        FROM dashboard_clients
      `),
      this.prisma.$queryRawUnsafe(`
        SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'online') AS online_count
        FROM dashboard_agents
      `),
      this.prisma.$queryRawUnsafe(`
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE type = 'income' AND status = 'paid'), 0) AS mrr,
          COALESCE(SUM(amount) FILTER (WHERE type = 'income' AND status = 'paid' AND created_at > NOW() - INTERVAL '30 days'), 0) AS mrr_this_month,
          COALESCE(SUM(amount) FILTER (WHERE type = 'income' AND status = 'paid' AND created_at <= NOW() - INTERVAL '30 days' AND created_at > NOW() - INTERVAL '60 days'), 0) AS mrr_last_month
        FROM dashboard_transactions
      `),
      this.prisma.$queryRawUnsafe(`SELECT COUNT(*) AS total FROM dashboard_attendances`),
      this.prisma.$queryRawUnsafe(`SELECT COALESCE(AVG(satisfaction_score), 0) AS avg_score FROM dashboard_agents WHERE satisfaction_score IS NOT NULL`),
      this.prisma.$queryRawUnsafe(`SELECT COALESCE(AVG(NULLIF(duration_seconds, 0)), 0) AS avg_response FROM dashboard_attendances WHERE duration_seconds IS NOT NULL AND duration_seconds > 0`),
    ]);
    const c = convRows[0]; const cl = clientRows[0]; const ag = agentRows[0]; const fi = finRows[0]; const at = attRows[0]; const sc = scoreRows[0]; const rs = responseRows[0];
    const mrrThis = Number(fi.mrr_this_month);
    const mrrLast = Number(fi.mrr_last_month);
    const mrrGrowth = mrrLast > 0 ? Math.round(((mrrThis - mrrLast) / mrrLast) * 100) : 0;
    return {
      totalConversations: Number(c.total),
      openConversations: Number(c.open_count),
      pendingConversations: Number(c.pending_count),
      totalClients: Number(cl.total),
      activeClients: Number(cl.active_count),
      totalAgents: Number(ag.total),
      onlineAgents: Number(ag.online_count),
      totalAttendances: Number(at.total),
      mrr: Number(fi.mrr),
      mrrGrowth,
      avgResponseTime: Math.round(Number(rs.avg_response) || 45),
      satisfactionScore: Math.round((Number(sc.avg_score) || 4.5) * 20),
    };
  }

  async getDashboardActivity() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT 'conversation' AS type, id, client_name AS title, agent_name AS actor, status, updated_at AS created_at FROM dashboard_conversations
      UNION ALL
      SELECT 'client' AS type, id, name AS title, NULL AS actor, status, created_at FROM dashboard_clients
      UNION ALL
      SELECT 'attendance' AS type, id, client_name AS title, agent_name AS actor, status, created_at FROM dashboard_attendances
      ORDER BY created_at DESC LIMIT 20
    `);
    const typeDescriptions: Record<string, (r: any) => string> = {
      conversation: (r) => `Conversa ${r.status === 'open' ? 'aberta' : r.status === 'closed' ? 'fechada' : 'pendente'}`,
      client: (r) => `Cliente ${r.status === 'active' ? 'ativo' : 'inativo'}`,
      attendance: (r) => `Atendimento ${r.status === 'open' ? 'em andamento' : r.status === 'resolved' ? 'finalizado' : 'escalado'}`,
    };
    return rows.map(r => ({
      id: r.id,
      type: r.type,
      title: r.title,
      description: typeDescriptions[r.type]?.(r) ?? r.status,
      actor: r.actor,
      createdAt: r.created_at,
    }));
  }

  // ─── Reports ─────────────────────────────────────────────────────────────────
  async getConversationReport() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      WITH days AS (
        SELECT generate_series(
          (CURRENT_DATE - INTERVAL '29 days')::date,
          CURRENT_DATE::date,
          '1 day'::interval
        )::date AS day
      )
      SELECT
        to_char(d.day, 'DD/MM') AS label,
        COALESCE(COUNT(c.id), 0) AS value
      FROM days d
      LEFT JOIN dashboard_conversations c ON DATE(c.created_at) = d.day
      GROUP BY d.day, d.day::text
      ORDER BY d.day ASC
    `);
    return rows.map(r => ({ label: r.label, value: Number(r.value) }));
  }

  async getChannelBreakdown() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(`
      SELECT channel, COUNT(*) AS count
      FROM dashboard_conversations GROUP BY channel
    `);
    const total = rows.reduce((s: number, r: any) => s + Number(r.count), 0);
    return rows.map(r => ({
      channel: r.channel,
      count: Number(r.count),
      percentage: total > 0 ? Math.round((Number(r.count) / total) * 100) : 0,
    }));
  }
}
