'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ApiClientError, apiRequest } from '@/lib/api-client';
import {
  contactAcceptedSchema,
  contactFormSchema,
  contactTopic,
  contactTopicLabel,
} from '@/lib/contact';

type ContactValues = z.infer<typeof contactFormSchema>;

export function ContactForm() {
  const form = useForm<ContactValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { name: '', email: '', message: '', website: '' },
  });
  const { errors } = form.formState;
  const submit = useMutation({
    mutationFn: (values: ContactValues) =>
      apiRequest('POST', '/contact', contactAcceptedSchema, values, { anonymous: true }),
    onSuccess: () => form.reset(),
  });
  const feedback = submit.isError
    ? submit.error instanceof ApiClientError && submit.error.status === 429
      ? 'Bạn đã gửi quá nhiều tin nhắn. Vui lòng đợi một phút rồi thử lại.'
      : 'Chưa thể gửi tin nhắn. Vui lòng thử lại.'
    : null;

  return (
    <Card>
      <form
        noValidate
        className="space-y-5"
        onSubmit={form.handleSubmit((values) => submit.mutate(values))}
      >
        <Field label="Họ và tên" name="name" error={errors.name?.message}>
          <Input
            id="contact-name"
            autoComplete="name"
            required
            {...form.register('name')}
            {...errorAttrs('name', errors.name?.message)}
          />
        </Field>
        <Field label="Email" name="email" error={errors.email?.message}>
          <Input
            id="contact-email"
            type="email"
            autoComplete="email"
            required
            {...form.register('email')}
            {...errorAttrs('email', errors.email?.message)}
          />
        </Field>
        <Field label="Chủ đề" name="topic" error={errors.topic?.message}>
          <select
            id="contact-topic"
            required
            defaultValue=""
            className="w-full rounded-xl border bg-card px-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
            {...form.register('topic')}
            {...errorAttrs('topic', errors.topic?.message)}
          >
            <option value="" disabled>
              Chọn chủ đề
            </option>
            {contactTopic.options.map((topic) => (
              <option key={topic} value={topic}>
                {contactTopicLabel[topic]}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Nội dung" name="message" error={errors.message?.message}>
          <textarea
            id="contact-message"
            rows={6}
            required
            className="w-full resize-y rounded-xl border bg-card px-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-primary"
            {...form.register('message')}
            {...errorAttrs('message', errors.message?.message)}
          />
        </Field>
        <div hidden>
          <label htmlFor="contact-website">Website</label>
          <input
            id="contact-website"
            tabIndex={-1}
            autoComplete="off"
            {...form.register('website')}
          />
        </div>
        <Button type="submit" disabled={submit.isPending}>
          {submit.isPending ? 'Đang gửi…' : 'Gửi tin nhắn'}
        </Button>
        {feedback && (
          <p role="alert" className="text-sm text-danger">
            {feedback}
          </p>
        )}
        {submit.isSuccess && (
          <p role="status" className="text-sm font-medium text-success">
            Đã gửi tin nhắn. Cảm ơn bạn đã liên hệ.
          </p>
        )}
      </form>
    </Card>
  );
}

type VisibleField = Exclude<keyof ContactValues, 'website'>;

function errorAttrs(name: VisibleField, error?: string) {
  return {
    'aria-invalid': !!error,
    'aria-describedby': error ? `contact-${name}-error` : undefined,
  };
}

function Field({
  label,
  name,
  error,
  children,
}: {
  label: string;
  name: VisibleField;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium" htmlFor={`contact-${name}`}>
        {label}
      </label>
      {children}
      {error && (
        <p id={`contact-${name}-error`} className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
