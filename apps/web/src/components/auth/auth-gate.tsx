'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { UserRole } from '@tixflow/shared';
import { useAuthState } from '@/stores/auth';
import { apiGet } from '@/lib/api-client';
import { authUserSchema, refreshSession, roleHome } from '@/lib/auth-session';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';

export function AuthGate({
  roles,
  children,
  embedded = false,
}: {
  roles?: UserRole[];
  children: React.ReactNode;
  embedded?: boolean;
}) {
  const Container = embedded ? 'div' : 'main';
  const status = useAuthState((state) => state.status);
  const user = useAuthState((state) => state.user);
  const pathname = usePathname();
  const router = useRouter();
  const me = useQuery({
    queryKey: ['auth', 'me', user?.id],
    queryFn: ({ signal }) => apiGet('/auth/me', authUserSchema, { signal }),
    enabled: status === 'authenticated',
    staleTime: 15_000,
    retry: false,
  });
  useEffect(() => {
    if (status === 'anonymous') router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, router, pathname]);
  useEffect(() => {
    if (me.data) useAuthState.getState().updateUser(me.data);
  }, [me.data]);
  const activeUser = me.data ?? user;
  if (status === 'error' || (status === 'authenticated' && me.isError && !activeUser))
    return (
      <Container id={embedded ? undefined : 'main-content'} className="container py-16">
        <EmptyState
          title="Chưa thể xác minh phiên đăng nhập"
          description="Kiểm tra kết nối máy chủ rồi thử lại."
          action={
            <Button
              onClick={() => {
                if (status === 'error') void refreshSession().catch(() => {});
                else void me.refetch();
              }}
            >
              Thử lại
            </Button>
          }
        />
      </Container>
    );
  if (status !== 'authenticated' || !activeUser)
    return (
      <div role="status" aria-label="Đang xác minh quyền truy cập" className="container py-16">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-6 h-40" />
      </div>
    );
  if (roles && !roles.includes(activeUser.role))
    return (
      <Container id={embedded ? undefined : 'main-content'} className="container py-16">
        <EmptyState
          title="Bạn không có quyền truy cập"
          description="Không gian này dành cho vai trò được phân quyền. Quyền truy cập cũng được kiểm tra ở backend."
          action={
            <Button asChild>
              <Link href={roleHome(activeUser.role)}>Về không gian của tôi</Link>
            </Button>
          }
        />
      </Container>
    );
  return children;
}
