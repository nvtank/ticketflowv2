import { z } from 'zod';
import { paginationSchema } from './reporting';

export const contactTopic = z.enum(['GENERAL', 'ORGANIZER', 'TICKET', 'BUG']);
export const contactTopicLabel = {
  GENERAL: 'Câu hỏi chung',
  ORGANIZER: 'Tổ chức sự kiện',
  TICKET: 'Vé và đơn hàng',
  BUG: 'Báo lỗi',
} satisfies Record<z.infer<typeof contactTopic>, string>;

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Nhập họ tên ít nhất 2 ký tự.').max(100, 'Tối đa 100 ký tự.'),
  email: z.string().trim().max(254, 'Email tối đa 254 ký tự.').pipe(z.email('Nhập email hợp lệ.')),
  topic: z.enum(contactTopic.options, { error: 'Chọn một chủ đề.' }),
  message: z
    .string()
    .trim()
    .min(10, 'Nhập nội dung ít nhất 10 ký tự.')
    .max(5000, 'Tối đa 5.000 ký tự.'),
  website: z.string().max(200),
});

export const contactAcceptedSchema = z.object({ accepted: z.literal(true) });
export const contactStatus = z.enum(['NEW', 'HANDLED']);
export const contactStatusLabel = {
  NEW: 'Mới',
  HANDLED: 'Đã xử lý',
} satisfies Record<z.infer<typeof contactStatus>, string>;

export const contactHandledSchema = z.object({
  id: z.uuid(),
  status: contactStatus,
  handledAt: z.iso.datetime().nullable(),
  handledById: z.uuid().nullable(),
});

const contactMessageSchema = contactHandledSchema.extend({
  name: z.string(),
  email: z.string(),
  topic: contactTopic,
  message: z.string(),
  createdAt: z.iso.datetime(),
});

export const contactMessagesSchema = z.object({
  items: z.array(contactMessageSchema),
  pagination: paginationSchema,
});
export type ContactMessage = z.infer<typeof contactMessageSchema>;
