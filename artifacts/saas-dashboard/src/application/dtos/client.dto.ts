import { z } from 'zod';

export const ClientDTOSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().nullable(),
  company: z.string().nullable(),
  status: z.enum(['active', 'inactive']),
  totalConversations: z.number().int().nonnegative(),
  createdAt: z.string(),
});

export type ClientDTO = z.infer<typeof ClientDTOSchema>;

export const CreateClientFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type CreateClientFormValues = z.infer<typeof CreateClientFormSchema>;
