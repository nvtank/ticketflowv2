import type { RealtimeConnectionStatus } from '../../lib/realtime';

type RealtimeStatusProps = {
  status: RealtimeConnectionStatus;
  feature: 'booking' | 'attendance';
};

export function RealtimeStatus({ status, feature }: RealtimeStatusProps) {
  if (status === 'connected')
    return (
      <p className="text-xs text-success" role="status">
        Đã kết nối cập nhật trực tiếp
      </p>
    );

  if (status === 'connecting')
    return (
      <p className="text-xs text-muted-foreground" role="status">
        Đang kết nối cập nhật trực tiếp…
      </p>
    );

  const message =
    feature === 'booking'
      ? status === 'unavailable'
        ? 'Cập nhật sơ đồ ghế trực tiếp chưa được cấu hình. Trạng thái ghế có thể chưa phản ánh thay đổi mới; hãy kiểm tra lại trước khi giữ ghế.'
        : 'Mất kết nối cập nhật trực tiếp. Trạng thái ghế có thể đã cũ; hệ thống vẫn đồng bộ định kỳ. Hãy kiểm tra lại trước khi giữ ghế.'
      : status === 'unavailable'
        ? 'Cập nhật check-in trực tiếp chưa được cấu hình. Số liệu có thể chưa phản ánh thay đổi mới; hãy làm mới để kiểm tra trạng thái hiện tại.'
        : 'Mất kết nối cập nhật trực tiếp. Số liệu check-in có thể đã cũ; hệ thống vẫn làm mới định kỳ.';

  return (
    <p
      className="rounded-xl border border-warning/40 bg-warning/10 p-4 text-sm text-warning"
      role="alert"
      aria-live="assertive"
    >
      {message}
    </p>
  );
}
