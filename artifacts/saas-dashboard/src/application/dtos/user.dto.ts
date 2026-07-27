import { z } from 'zod';

export const UserDTOSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
  status: z.enum(['active', 'inactive']),
  lastLogin: z.string(),
});

export type UserDTO = z.infer<typeof UserDTOSchema>;

export const CreateUserFormSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido'),
  role: z.enum(['admin', 'member', 'viewer']),
  status: z.enum(['active', 'inactive']).default('active'),
});

export type CreateUserFormValues = z.infer<typeof CreateUserFormSchema>;
