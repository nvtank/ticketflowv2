'use client';

import { useAuthState } from '@/stores/auth';
import { WorldLink } from '@/components/world/primitives';

export function OrganizerHeroActions() {
  const user = useAuthState((state) => state.user);
  if (user) {
    return (
      <div className="mt-7 flex flex-wrap items-center gap-3">
        <WorldLink href="/organizer">Mở không gian ban tổ chức</WorldLink>
        <WorldLink href="#workflow" secondary>
          Xem quy trình 4 bước
        </WorldLink>
      </div>
    );
  }
  return (
    <div className="mt-7 flex flex-wrap items-center gap-3">
      <WorldLink href="/register">Đăng ký ban tổ chức</WorldLink>
      <WorldLink href="/login" secondary>
        Đăng nhập tài khoản
      </WorldLink>
    </div>
  );
}

export function OrganizerFinalCtaLink() {
  const user = useAuthState((state) => state.user);
  if (user) {
    return <WorldLink href="/organizer">Đi tới bảng điều khiển tổ chức</WorldLink>;
  }
  return <WorldLink href="/register">Tạo tài khoản ban tổ chức</WorldLink>;
}
