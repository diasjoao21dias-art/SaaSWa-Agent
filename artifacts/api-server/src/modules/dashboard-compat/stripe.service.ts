// =============================================================================
// StripeService — Stripe billing integration for the dashboard
// Handles checkout sessions, billing portal, and webhook events.
// Boots gracefully without STRIPE_SECRET_KEY (returns "not configured" errors).
// =============================================================================
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../database/prisma.service';
import type Stripe from 'stripe';

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private client: Stripe | null = null;
  private readonly webhookSecret: string | null;
  private readonly publishableKey: string | null;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const secretKey = process.env['STRIPE_SECRET_KEY'];
    this.webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'] ?? null;
    this.publishableKey = process.env['STRIPE_PUBLISHABLE_KEY'] ?? null;

    if (secretKey) {
      this.client = new Stripe(secretKey, {
        apiVersion: '2024-12-18.acacia' as Stripe.LatestApiVersion,
      });
      this.logger.log('Stripe initialized — real billing enabled');
    } else {
      this.logger.warn('Stripe not configured — STRIPE_SECRET_KEY missing. Billing endpoints return errors.');
    }
  }

  isConfigured(): boolean {
    return this.client !== null;
  }

  getPublishableKey(): string | null {
    return this.publishableKey;
  }

  // ─── Checkout Session ───────────────────────────────────────────────────────
  async createCheckoutSession(planId: string, planName: string, amount: number, interval: string) {
    if (!this.client) {
      return { error: 'Stripe not configured. Add STRIPE_SECRET_KEY in Secrets.' };
    }

    const baseUrl = this.configService.get<string>('app.publicUrl', 'http://localhost:3000');
    const session = await this.client.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{
        price_data: {
          currency: 'brl',
          product_data: { name: planName },
          unit_amount: Math.round(amount * 100),
          recurring: { interval: interval === 'year' ? 'year' : 'month' },
        },
        quantity: 1,
      }],
      success_url: `${baseUrl}/plans?status=success`,
      cancel_url: `${baseUrl}/plans?status=cancel`,
      metadata: { planId },
    });

    return { url: session.url };
  }

  // ─── Billing Portal ─────────────────────────────────────────────────────────
  async createPortalSession() {
    if (!this.client) {
      return { error: 'Stripe not configured' };
    }

    // Get or create customer from settings
    const customerId = await this.getStripeCustomerId();
    if (!customerId) {
      return { error: 'No active subscription found. Subscribe to a plan first.' };
    }

    const baseUrl = this.configService.get<string>('app.publicUrl', 'http://localhost:3000');
    const session = await this.client.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/financial`,
    });

    return { url: session.url };
  }

  // ─── Webhook Handler ─────────────────────────────────────────────────────────
  async handleWebhook(rawBody: Buffer, signature: string) {
    if (!this.client || !this.webhookSecret) {
      this.logger.warn('Stripe webhook received but no secret configured');
      return { received: true };
    }

    let event: Stripe.Event;
    try {
      event = this.client.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch (err) {
      this.logger.error(`Webhook signature verification failed: ${err instanceof Error ? err.message : String(err)}`);
      throw new Error('Invalid webhook signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.updateSubscriptionStatus('active');
        if (session.customer) {
          await this.saveStripeCustomerId(typeof session.customer === 'string' ? session.customer : session.customer.id);
        }
        this.logger.log('Subscription activated via checkout');
        break;
      }
      case 'invoice.paid':
        await this.updateSubscriptionStatus('active');
        this.logger.log('Invoice paid — subscription active');
        break;
      case 'invoice.payment_failed':
        await this.updateSubscriptionStatus('suspended');
        this.logger.warn('Invoice payment failed — subscription suspended');
        break;
      case 'customer.subscription.deleted':
        await this.updateSubscriptionStatus('canceled');
        this.logger.warn('Subscription deleted — access canceled');
        break;
      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }

    return { received: true };
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────
  private async updateSubscriptionStatus(status: string) {
    await this.prisma.$executeRawUnsafe(
      `UPDATE dashboard_settings SET subscription_status = $1, updated_at = now() WHERE id = 'default'`,
      status,
    );
  }

  private async getStripeCustomerId(): Promise<string | null> {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT stripe_customer_id FROM dashboard_settings WHERE id = 'default'`,
    );
    return rows[0]?.stripe_customer_id ?? null;
  }

  private async saveStripeCustomerId(customerId: string) {
    // Add column if not exists, then update
    try {
      await this.prisma.$executeRawUnsafe(
        `ALTER TABLE dashboard_settings ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT`,
      );
      await this.prisma.$executeRawUnsafe(
        `UPDATE dashboard_settings SET stripe_customer_id = $1 WHERE id = 'default'`,
        customerId,
      );
    } catch (err) {
      this.logger.warn(`Could not save Stripe customer ID: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}
