/**
 * Prisma seed — Global Permissions
 *
 * Creates all Permission records used by the granular RBAC system.
 * Run once (or re-run idempotently) after the first migration:
 *
 *   pnpm --filter @workspace/api-server exec tsx prisma/seed.ts
 *   # or via package.json script:
 *   pnpm --filter @workspace/api-server run prisma:seed
 *
 * Permission keys follow the pattern  <resource>:<action>
 *
 * Role → permission mapping (applied per-tenant when a tenant is created):
 *   OWNER        — bypasses all checks (no role record needed)
 *   ADMIN        — all permissions except plans:write
 *   AGENT        — conversations, customers, knowledge:read, whatsapp:read
 *   VIEWER       — conversations:read, customers:read, reports:read
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Permission catalogue ──────────────────────────────────────────────────────

const PERMISSIONS: Array<{
  key: string;
  name: string;
  description: string;
  group: string;
}> = [
  // Users
  { key: 'users:read',   name: 'Ver usuários',      description: 'Listar e visualizar usuários do tenant',      group: 'users' },
  { key: 'users:write',  name: 'Gerenciar usuários', description: 'Criar e atualizar usuários',                  group: 'users' },
  { key: 'users:delete', name: 'Remover usuários',   description: 'Desativar e excluir usuários',                group: 'users' },

  // Agents
  { key: 'agents:read',   name: 'Ver agentes',      description: 'Listar e visualizar agentes de IA',           group: 'agents' },
  { key: 'agents:write',  name: 'Gerenciar agentes', description: 'Criar, editar e ativar/desativar agentes',    group: 'agents' },
  { key: 'agents:delete', name: 'Remover agentes',   description: 'Excluir agentes de IA',                       group: 'agents' },

  // Conversations
  { key: 'conversations:read',  name: 'Ver conversas',       description: 'Visualizar conversas e mensagens',      group: 'conversations' },
  { key: 'conversations:write', name: 'Interagir em conversas', description: 'Enviar mensagens e atualizar status', group: 'conversations' },
  { key: 'conversations:close', name: 'Encerrar conversas',   description: 'Fechar e arquivar conversas',          group: 'conversations' },

  // Customers
  { key: 'customers:read',   name: 'Ver clientes',      description: 'Listar e visualizar contatos',             group: 'customers' },
  { key: 'customers:write',  name: 'Gerenciar clientes', description: 'Criar e atualizar contatos',              group: 'customers' },
  { key: 'customers:delete', name: 'Remover clientes',   description: 'Excluir e bloquear contatos',             group: 'customers' },

  // Knowledge base
  { key: 'knowledge:read',   name: 'Ver base de conhecimento',      description: 'Acessar documentos e FAQs',    group: 'knowledge' },
  { key: 'knowledge:write',  name: 'Gerenciar base de conhecimento', description: 'Criar e editar documentos',   group: 'knowledge' },
  { key: 'knowledge:delete', name: 'Remover documentos',             description: 'Excluir documentos e FAQs',   group: 'knowledge' },

  // Prompts
  { key: 'prompts:read',   name: 'Ver prompts',      description: 'Listar e visualizar prompts',                 group: 'prompts' },
  { key: 'prompts:write',  name: 'Gerenciar prompts', description: 'Criar e editar prompts',                     group: 'prompts' },
  { key: 'prompts:delete', name: 'Remover prompts',   description: 'Excluir prompts',                            group: 'prompts' },

  // WhatsApp
  { key: 'whatsapp:read',    name: 'Ver números WhatsApp',   description: 'Visualizar números conectados',        group: 'whatsapp' },
  { key: 'whatsapp:write',   name: 'Gerenciar WhatsApp',     description: 'Adicionar e configurar números',        group: 'whatsapp' },
  { key: 'whatsapp:connect', name: 'Conectar WhatsApp',      description: 'Iniciar sessões e ler QR codes',        group: 'whatsapp' },

  // Webhooks
  { key: 'webhooks:read',   name: 'Ver webhooks',      description: 'Listar e visualizar webhooks',              group: 'webhooks' },
  { key: 'webhooks:write',  name: 'Gerenciar webhooks', description: 'Criar e atualizar webhooks',                group: 'webhooks' },
  { key: 'webhooks:delete', name: 'Remover webhooks',   description: 'Excluir webhooks',                          group: 'webhooks' },

  // Reports
  { key: 'reports:read', name: 'Ver relatórios', description: 'Acessar dashboards e métricas', group: 'reports' },

  // Settings
  { key: 'settings:read',  name: 'Ver configurações',      description: 'Visualizar configurações do tenant',     group: 'settings' },
  { key: 'settings:write', name: 'Alterar configurações',   description: 'Modificar configurações do tenant',      group: 'settings' },

  // Plans / Billing
  { key: 'plans:read',  name: 'Ver planos',     description: 'Visualizar planos e assinaturas disponíveis',      group: 'plans' },
  { key: 'plans:write', name: 'Gerenciar planos', description: 'Criar e modificar planos (platform admin only)', group: 'plans' },

  // Subscriptions
  { key: 'subscriptions:read',  name: 'Ver assinatura',      description: 'Ver status e histórico da assinatura', group: 'subscriptions' },
  { key: 'subscriptions:write', name: 'Gerenciar assinatura', description: 'Alterar plano e dados de cobrança',   group: 'subscriptions' },

  // Attendances
  { key: 'attendances:read',   name: 'Ver atendimentos',      description: 'Listar e visualizar registros de atendimento humano', group: 'attendances' },
  { key: 'attendances:write',  name: 'Gerenciar atendimentos', description: 'Criar e atualizar registros de atendimento',          group: 'attendances' },
  { key: 'attendances:delete', name: 'Remover atendimentos',   description: 'Excluir registros de atendimento',                    group: 'attendances' },

  // Financial
  { key: 'financial:read',   name: 'Ver transações',       description: 'Listar e visualizar transações financeiras', group: 'financial' },
  { key: 'financial:write',  name: 'Gerenciar transações',  description: 'Criar e atualizar transações financeiras',   group: 'financial' },
  { key: 'financial:delete', name: 'Remover transações',    description: 'Excluir transações financeiras',             group: 'financial' },
];

// ─── Seed runner ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('🌱  Seeding permissions…');

  let created = 0;
  let skipped = 0;

  for (const perm of PERMISSIONS) {
    const existing = await prisma.permission.findUnique({ where: { key: perm.key } });

    if (existing) {
      // Update metadata in case name/description changed, but keep existing ID
      await prisma.permission.update({
        where: { key: perm.key },
        data: { name: perm.name, description: perm.description, group: perm.group },
      });
      skipped++;
    } else {
      await prisma.permission.create({ data: perm });
      created++;
    }
  }

  console.log(`✅  Done — ${created} created, ${skipped} updated (${PERMISSIONS.length} total)`);
  console.log('');
  console.log('ℹ️   System roles (Administrador / Funcionário / Cliente) are created');
  console.log('    automatically per-tenant when a new tenant registers.');
  console.log('    Existing tenants: run the backfill script or assign roles manually.');
}

main()
  .catch((e) => {
    console.error('❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
