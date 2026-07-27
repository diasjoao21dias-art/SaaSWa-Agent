import { Injectable, Logger } from '@nestjs/common';
import { SubscriptionsRepository } from './subscriptions.repository';
import { PlansRepository } from '../plans/plans.repository';
import { NotFoundException } from '../../common/exceptions/not-found.exception';
import type { CreateSubscriptionDto } from './dto/create-subscription.dto';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly repo: SubscriptionsRepository,
    private readonly plansRepo: PlansRepository,
  ) {}

  async create(tenantId: string, dto: CreateSubscriptionDto) {
    const plan = await this.plansRepo.findById(dto.planId);
    if (!plan) throw new NotFoundException('Plan', dto.planId);

    const trialEndsAt = plan.trialDays > 0
      ? new Date(Date.now() + plan.trialDays * 86400000)
      : null;

    const now = new Date();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

    const subscription = await this.repo.create(tenantId, {
      planId: dto.planId,
      externalId: dto.externalId,
      externalCustomerId: dto.externalCustomerId,
      status: plan.trialDays > 0 ? 'TRIAL' : 'ACTIVE',
      trialEndsAt,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });

    this.logger.log(`Subscription created for tenant ${tenantId} on plan ${plan.name}`);
    return subscription;
  }

  async getActive(tenantId: string) {
    return this.repo.findActivByTenant(tenantId);
  }

  async getHistory(tenantId: string) {
    return this.repo.findAllByTenant(tenantId);
  }

  async cancel(tenantId: string, reason?: string) {
    const active = await this.repo.findActivByTenant(tenantId);
    if (!active) throw new NotFoundException('Subscription', tenantId);
    return this.repo.cancel(active.id, reason);
  }
}
