import { z } from 'zod';

export function extractErrors(error: z.ZodError): Record<string, string> {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? ''])
  );
}

export const productEditSchema = z.object({
  name:  z.string().min(1, 'El nombre es obligatorio'),
  price: z.number({ error: 'El precio debe ser un número' }).positive('El precio debe ser mayor a 0'),
  cost:  z.number({ error: 'El costo debe ser un número' }).min(0, 'El costo no puede ser negativo'),
  stock: z.number({ error: 'El stock debe ser un número' }).int('Debe ser un número entero').min(0, 'El stock no puede ser negativo'),
});

export const customerSchema = z.object({
  type:        z.enum(['natural', 'empresa'] as const, { error: 'Selecciona un tipo de cliente' }),
  name:        z.string().min(1, 'El nombre es obligatorio'),
  document_id: z.string().min(8, 'El RUC/DNI debe tener al menos 8 caracteres'),
});

export const promotionSchema = z.object({
  name:  z.string().min(1, 'El nombre es obligatorio'),
  code:  z.string().min(2, 'El código debe tener al menos 2 caracteres'),
  type:  z.enum(['percentage', 'fixed'] as const),
  value: z.number({ error: 'El valor debe ser un número' }).positive('El valor debe ser mayor a 0'),
}).refine(
  (d) => !(d.type === 'percentage' && d.value > 100),
  { message: 'El porcentaje no puede ser mayor a 100', path: ['value'] }
);

export const userCreateSchema = z.object({
  first_name: z.string().min(1, 'El nombre es obligatorio'),
  last_name:  z.string().min(1, 'El apellido es obligatorio'),
  username:   z.string().min(3, 'Mínimo 3 caracteres'),
  role:       z.string().min(1, 'El rol es obligatorio'),
  password:   z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

export const userEditSchema = z.object({
  first_name: z.string().min(1, 'El nombre es obligatorio'),
  last_name:  z.string().min(1, 'El apellido es obligatorio'),
  username:   z.string().min(3, 'Mínimo 3 caracteres'),
  role:       z.string().min(1, 'El rol es obligatorio'),
  password:   z.union([z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'), z.literal('')]).optional(),
});

export const profileInfoSchema = z.object({
  first_name: z.string().min(1, 'El nombre es obligatorio'),
  last_name:  z.string().min(1, 'El apellido es obligatorio'),
  username:   z.string().min(3, 'Mínimo 3 caracteres'),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es obligatoria'),
  newPassword:     z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma la nueva contraseña'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});
