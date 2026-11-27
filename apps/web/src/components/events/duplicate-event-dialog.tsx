'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import type { z } from 'zod';
import { apiRequest } from '@/lib/api-client';
import { eventDatesSchema, eventDatesToIso, eventDetailSchema } from '@/lib/events';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type Dates = z.infer<typeof eventDatesSchema>;
const fields = [
  ['startsAt', 'Bắt đầu sự kiện'],
  ['endsAt', 'Kết thúc sự kiện'],
  ['salesStartAt', 'Bắt đầu bán vé'],
  ['salesEndAt', 'Kết thúc bán vé'],
] as const;

export function DuplicateEventDialog({ id }: { id: string }) {
  const router = useRouter();
  const cache = useQueryClient();
  const inputPrefix = useId();
  const [open, setOpen] = useState(false);
  const form = useForm<Dates>({ resolver: zodResolver(eventDatesSchema) });
  const duplicate = useMutation({
    mutationFn: (dates: Dates) =>
      apiRequest(
        'POST',
        `/organizer/events/${id}/duplicate`,
        eventDetailSchema,
        eventDatesToIso(dates),
      ),
    onSuccess: (draft) => {
      setOpen(false);
      toast.success('Đã tạo bản nháp từ sự kiện này.');
      void cache.invalidateQueries({ queryKey: ['organizer'] });
      router.push(`/organizer/events/${draft.id}`);
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Nhân bản</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Nhân bản sự kiện</DialogTitle>
        <DialogDescription className="text-sm text-muted-foreground">
          Nhập lịch sự kiện và lịch bán vé mới theo giờ Việt Nam (UTC+7).
        </DialogDescription>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit((dates) => duplicate.mutate(dates))}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map(([field, label]) => {
              const inputId = `${inputPrefix}-${field}`;
              const error = form.formState.errors[field]?.message;
              return (
                <div key={field} className="min-w-0">
                  <label htmlFor={inputId} className="mb-2 block text-sm font-medium">
                    {label}
                  </label>
                  <Input
                    id={inputId}
                    type="datetime-local"
                    required
                    aria-invalid={!!error}
                    aria-describedby={error ? `${inputId}-error` : undefined}
                    {...form.register(field)}
                  />
                  {error && (
                    <p id={`${inputId}-error`} className="mt-1 text-xs text-danger">
                      {error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <Button type="submit" disabled={duplicate.isPending}>
            {duplicate.isPending ? 'Đang nhân bản…' : 'Tạo bản nháp'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
