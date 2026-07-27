export type IntegrationId = string & { readonly _brand: 'IntegrationId' };
export type IntegrationType = 'whatsapp' | 'openai' | 'stripe' | 'slack' | 'webhook' | 'crm';
export type IntegrationStatus = 'connected' | 'disconnected';

export interface Integration {
  readonly id: IntegrationId;
  readonly name: string;
  readonly type: IntegrationType;
  readonly description: string;
  readonly isActive: boolean;
  readonly status: IntegrationStatus;
  readonly connectedAt: Date | null;
}
