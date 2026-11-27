'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryNotice } from '@/components/ui/query-notice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { apiGet, apiRequest } from '@/lib/api-client';
import {
  contactHandledSchema,
  contactMessagesSchema,
  contactStatus,
  contactStatusLabel,
  contactTopicLabel,
  type ContactMessage,
} from '@/lib/contact';
import { dateTime } from '@/lib/events';
import { useAuthState } from '@/stores/auth';

const endpoint = '/admin/contact-messages';
type Filter = '' | ContactMessage['status'];

export function AdminMessages() {
  const cache = useQueryClient();
  const adminId = useAuthState((state) => state.user?.id);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<Filter>('');
  const [selected, setSelected] = useState<ContactMessage | null>(null);
  const filterControl = useRef<HTMLSelectElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const scope = ['admin', 'contact-messages', adminId] as const;
  const list = useQuery({
    queryKey: [...scope, page, status],
    queryFn: ({ signal }) =>
      apiGet(
        `${endpoint}?page=${page}${status ? `&status=${status}` : ''}`,
        contactMessagesSchema,
        { signal },
      ),
  });
  const markHandled = useMutation({
    mutationFn: (id: string) => apiRequest('PATCH', `${endpoint}/${id}`, contactHandledSchema),
    onSuccess: (updated) => {
      setSelected((current) => (current?.id === updated.id ? { ...current, ...updated } : current));
      if (
        status === 'NEW' &&
        page > 1 &&
        list.data?.items.length === 1 &&
        list.data.items[0]?.id === updated.id
      )
        setPage(page - 1);
      void cache.invalidateQueries({ queryKey: scope });
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Tin nhắn liên hệ</h1>
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="message-status" className="text-sm font-medium">
          Trạng thái
        </label>
        <select
          id="message-status"
          ref={filterControl}
          className="rounded-xl border bg-card p-3 text-sm"
          value={status}
          onChange={(event) => {
            const value = contactStatus.safeParse(event.target.value);
            setStatus(value.success ? value.data : '');
            setPage(1);
          }}
        >
          <option value="">Tất cả</option>
          {contactStatus.options.map((value) => (
            <option key={value} value={value}>
              {contactStatusLabel[value]}
            </option>
          ))}
        </select>
      </div>
      {list.isError || !list.data ? (
        <QueryNotice
          pending={list.isPending}
          error={list.error}
          retry={() => void list.refetch()}
        />
      ) : (
        <>
          {list.data.items.length > 0 ? (
            <Card className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <caption className="sr-only">Danh sách tin nhắn liên hệ</caption>
                <thead>
                  <tr>
                    <th scope="col" className="pb-3 pr-4">
                      Người gửi
                    </th>
                    <th scope="col" className="pb-3 pr-4">
                      Chủ đề
                    </th>
                    <th scope="col" className="pb-3 pr-4">
                      Ngày gửi
                    </th>
                    <th scope="col" className="pb-3 pr-4">
                      Trạng thái
                    </th>
                    <th scope="col" className="pb-3">
                      <span className="sr-only">Thao tác</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {list.data.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="max-w-xs py-3 pr-4 break-words">{item.name}</td>
                      <td className="pr-4">{contactTopicLabel[item.topic]}</td>
                      <td className="pr-4">{dateTime(item.createdAt)}</td>
                      <td className="pr-4">
                        <Badge>{contactStatusLabel[item.status]}</Badge>
                      </td>
                      <td className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          aria-label={`Xem tin nhắn của ${item.name}`}
                          onClick={(event) => {
                            opener.current = event.currentTarget;
                            setSelected(item);
                          }}
                        >
                          Xem
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          ) : (
            <Card>
              <p role="status">Chưa có tin nhắn ở trang này.</p>
            </Card>
          )}
          {(page > 1 || list.data.pagination.totalPages > 1) && (
            <nav
              aria-label="Phân trang tin nhắn"
              className="flex flex-wrap items-center justify-center gap-3"
            >
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                Trang trước
              </Button>
              <span className="text-sm">
                Trang {page} / {Math.max(page, list.data.pagination.totalPages)}
              </span>
              <Button
                variant="outline"
                disabled={page >= list.data.pagination.totalPages}
                onClick={() => setPage(page + 1)}
              >
                Trang sau
              </Button>
            </nav>
          )}
        </>
      )}
      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open && !markHandled.isPending) {
            setSelected(null);
            markHandled.reset();
          }
        }}
      >
        {selected && (
          <DialogContent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              (opener.current?.isConnected ? opener.current : filterControl.current)?.focus();
            }}
          >
            <DialogTitle>{contactTopicLabel[selected.topic]}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Chi tiết tin nhắn liên hệ
            </DialogDescription>
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="font-semibold">Người gửi</dt>
                <dd className="break-words">{selected.name}</dd>
              </div>
              <div>
                <dt className="font-semibold">Email</dt>
                <dd className="break-all">{selected.email}</dd>
              </div>
              <div>
                <dt className="font-semibold">Ngày gửi</dt>
                <dd>{dateTime(selected.createdAt)}</dd>
              </div>
              <div>
                <dt className="font-semibold">Trạng thái</dt>
                <dd role="status">
                  {contactStatusLabel[selected.status]}
                  {selected.handledAt && ` · ${dateTime(selected.handledAt)}`}
                </dd>
              </div>
            </dl>
            <div className="rounded-xl border p-3">
              <h2 className="mb-2 text-sm font-semibold">Nội dung</h2>
              <p className="text-sm whitespace-pre-wrap break-words">{selected.message}</p>
            </div>
            {selected.status === 'NEW' && (
              <Button
                disabled={markHandled.isPending}
                onClick={() => markHandled.mutate(selected.id)}
              >
                {markHandled.isPending ? 'Đang cập nhật…' : 'Đánh dấu đã xử lý'}
              </Button>
            )}
            {markHandled.isError && (
              <p role="alert" className="text-sm text-danger">
                Chưa thể cập nhật trạng thái. Vui lòng thử lại.
              </p>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
