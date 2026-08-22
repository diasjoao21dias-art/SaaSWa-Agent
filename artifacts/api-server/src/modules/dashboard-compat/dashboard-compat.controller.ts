// =============================================================================
// DashboardCompatController — mirrors the Express-era dashboard API surface
// Routes are unversioned and @Public() so the React dashboard can call them
// without auth headers. Reads/writes to dashboard_* tables (Drizzle schema).
// =============================================================================
import {
  Controller, Get, Post, Patch, Put, Delete,
  Body, Param, Query, HttpCode, HttpStatus, NotFoundException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { RawResponse } from '../../common/decorators/raw-response.decorator';
import { DashboardCompatService } from './dashboard-compat.service';
import { StripeService } from './stripe.service';
import { Req } from '@nestjs/common';

@ApiTags('dashboard-compat')
@Public()
@RawResponse()
@Controller({ version: VERSION_NEUTRAL }) // opt-out of global URI versioning — routes at /api/* (no /v1/)
export class DashboardCompatController {
  constructor(
    private readonly svc: DashboardCompatService,
    private readonly stripe: StripeService,
  ) {}

  // ─── Health ─────────────────────────────────────────────────────────────────
  @Get('healthz')
  healthz() { return { status: 'ok', service: 'nestjs', ts: new Date() }; }

  // ─── Dashboard stats / activity ──────────────────────────────────────────────
  @Get('dashboard/stats')
  getStats() { return this.svc.getDashboardStats(); }

  @Get('dashboard/activity')
  getActivity() { return this.svc.getDashboardActivity(); }

  // ─── Reports ─────────────────────────────────────────────────────────────────
  @Get('reports/conversations')
  convReport() { return this.svc.getConversationReport(); }

  @Get('reports/channel-breakdown')
  channelBreakdown() { return this.svc.getChannelBreakdown(); }

  // ─── Conversations ────────────────────────────────────────────────────────────
  @Get('conversations')
  listConversations(
    @Query('status') status?: string,
    @Query('agentId') agentId?: string,
    @Query('clientId') clientId?: string,
  ) { return this.svc.listConversations({ status, agentId, clientId }); }

  @Post('conversations')
  createConversation(@Body() body: any) { return this.svc.createConversation(body); }

  @Get('conversations/:id')
  async getConversation(@Param('id') id: string) {
    const r = await this.svc.getConversation(id);
    if (!r) throw new NotFoundException();
    return r;
  }

  @Patch('conversations/:id')
  updateConversation(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateConversation(id, body);
  }

  @Delete('conversations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteConversation(@Param('id') id: string) { return this.svc.deleteConversation(id); }

  // ─── Clients ──────────────────────────────────────────────────────────────────
  @Get('clients')
  listClients() { return this.svc.listClients(); }

  @Post('clients')
  createClient(@Body() body: any) { return this.svc.createClient(body); }

  @Get('clients/:id')
  async getClient(@Param('id') id: string) {
    const r = await this.svc.getClient(id);
    if (!r) throw new NotFoundException();
    return r;
  }

  @Patch('clients/:id')
  updateClient(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateClient(id, body);
  }

  @Delete('clients/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteClient(@Param('id') id: string) { return this.svc.deleteClient(id); }

  // ─── Agents ───────────────────────────────────────────────────────────────────
  @Get('agents')
  listAgents() { return this.svc.listAgents(); }

  @Post('agents')
  createAgent(@Body() body: any) { return this.svc.createAgent(body); }

  @Get('agents/:id')
  async getAgent(@Param('id') id: string) {
    const r = await this.svc.getAgent(id);
    if (!r) throw new NotFoundException();
    return r;
  }

  @Patch('agents/:id')
  updateAgent(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateAgent(id, body);
  }

  @Delete('agents/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAgent(@Param('id') id: string) { return this.svc.deleteAgent(id); }

  // ─── Attendances ──────────────────────────────────────────────────────────────
  @Get('attendances')
  listAttendances() { return this.svc.listAttendances(); }

  @Post('attendances')
  createAttendance(@Body() body: any) { return this.svc.createAttendance(body); }

  @Patch('attendances/:id')
  updateAttendance(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateAttendance(id, body);
  }

  @Delete('attendances/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAttendance(@Param('id') id: string) { return this.svc.deleteAttendance(id); }

  // ─── Users ────────────────────────────────────────────────────────────────────
  @Get('users')
  listUsers() { return this.svc.listUsers(); }

  @Post('users')
  createUser(@Body() body: any) { return this.svc.createUser(body); }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateUser(id, body);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteUser(@Param('id') id: string) { return this.svc.deleteUser(id); }

  // ─── Plans ────────────────────────────────────────────────────────────────────
  @Get('plans')
  listPlans() { return this.svc.listPlans(); }

  @Post('plans')
  createPlan(@Body() body: any) { return this.svc.createPlan(body); }

  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() body: any) {
    return this.svc.updatePlan(id, body);
  }

  @Delete('plans/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deletePlan(@Param('id') id: string) { return this.svc.deletePlan(id); }

  // ─── Financial ────────────────────────────────────────────────────────────────
  @Get('transactions')
  listTransactions() { return this.svc.listTransactions(); }

  @Get('financial/report')
  financialReport() { return this.svc.getFinancialReport(); }

  // ─── Integrations ─────────────────────────────────────────────────────────────
  @Get('integrations')
  listIntegrations() { return this.svc.listIntegrations(); }

  @Patch('integrations/:id')
  updateIntegration(@Param('id') id: string, @Body() body: any) {
    return this.svc.updateIntegration(id, body);
  }

  // ─── Settings ──────────────────────────────────────────────────────────────────
  @Get('settings')
  getSettings() { return this.svc.getSettings(); }

  @Put('settings')
  updateSettings(@Body() body: any) { return this.svc.updateSettings(body); }

  // ─── Messages (chat) ──────────────────────────────────────────────────────────
  @Get('conversations/:id/messages')
  listMessages(@Param('id') id: string) { return this.svc.listMessages(id); }

  @Post('conversations/:id/messages')
  sendMessage(@Param('id') id: string, @Body() body: any) { return this.svc.sendMessage(id, body); }

  // ─── Subscription status ───────────────────────────────────────────────────────
  @Get('subscription-status')
  getSubscriptionStatus() { return this.svc.getSubscriptionStatus(); }

  @Put('subscription-status')
  @HttpCode(HttpStatus.OK)
  updateSubscriptionStatus(@Body() body: any) {
    return this.svc.updateSettings({ subscriptionStatus: body.status });
  }

  // ─── WhatsApp (Evolution API) ──────────────────────────────────────────────
  @Post('whatsapp/connect')
  connectWhatsapp() { return this.svc.connectWhatsapp(); }

  @Get('whatsapp/status')
  getWhatsappStatus() { return this.svc.getWhatsappStatus(); }

  @Post('whatsapp/disconnect')
  disconnectWhatsapp() { return this.svc.disconnectWhatsapp(); }

  // ─── Stripe Billing ─────────────────────────────────────────────────────────
  @Get('stripe/config')
  getStripeConfig() {
    return { publishableKey: this.stripe.getPublishableKey(), configured: this.stripe.isConfigured() };
  }

  @Post('stripe/checkout')
  createCheckout(@Body() body: any) {
    return this.stripe.createCheckoutSession(body.planId, body.planName, body.amount, body.interval);
  }

  @Post('stripe/portal')
  createPortal() {
    return this.stripe.createPortalSession();
  }

  @Post('webhooks/stripe')
  @HttpCode(HttpStatus.OK)
  handleStripeWebhook(@Req() req: any, @Body() _body: any) {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = req.rawBody as Buffer;
    return this.stripe.handleWebhook(rawBody, signature);
  }
}
