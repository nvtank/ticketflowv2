'use client';

import { API_PREFIX } from '@tixflow/shared';
import { z } from 'zod';
import { useAuthState } from '@/stores/auth';
import { refreshSession } from './auth-session';

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

interface RequestOptions {
  signal?: AbortSignal;
  acceptDegraded?: boolean;
  anonymous?: boolean;
}

async function apiResponse(
  method: string,
  path: string,
  accept: string,
  body?: unknown,
  options?: RequestOptions,
): Promise<Response> {
  const send = async (): Promise<Response> => {
    const headers = new Headers({ Accept: accept });
    if (body !== undefined) headers.set('Content-Type', 'application/json');
    const token = useAuthState.getState().accessToken;
    if (!options?.anonymous && token) headers.set('Authorization', `Bearer ${token}`);
    try {
      return await fetch(`${API_PREFIX}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        credentials: 'same-origin',
        cache: 'no-store',
        signal: options?.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') throw error;
      throw new ApiClientError('Không kết nối được máy chủ. Kiểm tra API local và thử lại.', 0);
    }
  };
  let response = await send();
  if (response.status === 401 && !options?.anonymous) {
    try {
      await refreshSession();
      response = await send();
    } catch {
      /* Preserve the original 401 for a consistent caller error. */
    }
  }
  return response;
}

function apiFailure(response: Response, raw: unknown) {
  const errorBody = z.object({ message: z.string() }).safeParse(raw);
  return new ApiClientError(
    errorBody.success ? errorBody.data.message : 'Không thể xử lý yêu cầu. Vui lòng thử lại.',
    response.status,
    response.headers.get('X-Request-ID') ?? undefined,
  );
}

export async function apiRequest<T>(
  method: string,
  path: string,
  schema: z.ZodType<T>,
  body?: unknown,
  options?: RequestOptions,
): Promise<T> {
  const response = await apiResponse(method, path, 'application/json', body, options);
  const requestId = response.headers.get('X-Request-ID') ?? undefined;
  const raw: unknown =
    response.status === 204 ? undefined : await response.json().catch(() => null);
  if (!response.ok && !(options?.acceptDegraded && response.status === 503))
    throw apiFailure(response, raw);
  const parsed = schema.safeParse(raw);
  if (!parsed.success)
    throw new ApiClientError('Máy chủ chưa trả về dữ liệu hợp lệ.', response.status, requestId);
  return parsed.data;
}

export async function downloadCsv(path: string) {
  const response = await apiResponse('GET', path, 'text/csv');
  if (!response.ok) throw apiFailure(response, await response.json().catch(() => null));
  if (!/^text\/csv(?:;|$)/i.test(response.headers.get('Content-Type') ?? ''))
    throw new ApiClientError('Máy chủ chưa trả về tệp CSV hợp lệ.', response.status);

  const disposition = response.headers.get('Content-Disposition') ?? '';
  const filename = /\bfilename="([\w-]+\.csv)"(?:;|$)/i.exec(disposition)?.[1] ?? 'attendees.csv';
  const url = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function apiGet<T>(
  path: string,
  schema: z.ZodType<T>,
  options?: RequestOptions,
): Promise<T> {
  return apiRequest('GET', path, schema, undefined, options);
}

export const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  service: z.literal('tixflow-api'),
  timestamp: z.iso.datetime(),
  uptimeSeconds: z.number().nonnegative(),
  dependencies: z.object({ postgres: z.enum(['up', 'down']), redis: z.enum(['up', 'down']) }),
});

export const eventListSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      title: z.string(),
      category: z.string(),
      city: z.string(),
      venueName: z.string(),
      startsAt: z.iso.datetime(),
      coverUrl: z.url().nullable(),
      minPriceVnd: z.number().int().nonnegative(),
      availableSeats: z.number().int().nonnegative(),
    }),
  ),
  pagination: z.object({
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});
