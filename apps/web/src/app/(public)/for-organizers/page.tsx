import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Armchair,
  ArrowUpRight,
  BarChart3,
  CreditCard,
  QrCode,
  ScanLine,
  Users,
} from 'lucide-react';
import { OrganizerFinalCtaLink, OrganizerHeroActions } from '@/components/discovery/organizer-cta';
import { OrganizerFaq } from '@/components/discovery/organizer-faq';
import { Reveal } from '@/components/motion/reveal';
import { EditorialHero } from '@/components/world/editorial-hero';
import { DisplayHeading, SectionLabel } from '@/components/world/primitives';

export const metadata: Metadata = {
  title: 'Dành cho ban tổ chức | TikFlow',
  description:
    'Nền tảng phát hành vé sự kiện với giữ ghế thời gian thực, phòng chờ FIFO, vé QR có chữ ký, trình quét soát vé và thanh toán PayOS.',
};

const features = [
  {
    icon: Armchair,
    title: 'Giữ ghế theo vị trí',
    description:
      'Khóa ghế tức thì theo phiên giao dịch với đồng hồ đếm ngược, hạn chế trùng chỗ khi nhiều khán giả chọn cùng một khu vực.',
  },
  {
    icon: Users,
    title: 'Phòng chờ điều tiết lưu lượng',
    description:
      'Cấu hình giới hạn người đặt vé đồng thời và xếp hàng theo thứ tự FIFO để bảo vệ hệ thống trong khung giờ mở bán cao điểm.',
  },
  {
    icon: QrCode,
    title: 'Vé QR có chữ ký bảo mật',
    description:
      'Mỗi vé sau thanh toán được cấp mã QR định danh riêng, chống làm giả và chỉ cho phép xác thực check-in hợp lệ một lần.',
  },
  {
    icon: ScanLine,
    title: 'Trình quét soát vé cho nhân viên',
    description:
      'Phân quyền nhân viên theo từng sự kiện để quét mã trực tiếp trên trình duyệt di động, phản hồi trạng thái vé ngay tại cổng.',
  },
  {
    icon: BarChart3,
    title: 'Thống kê bán vé thời gian thực',
    description:
      'Theo dõi tiến độ lấp đầy từng hạng vé, tỷ lệ check-in và doanh thu cập nhật liên tục ngay trong không gian quản trị.',
  },
  {
    icon: CreditCard,
    title: 'Thanh toán & đối soát PayOS',
    description:
      'Tích hợp thanh toán chuyển khoản VietQR qua PayOS, tự động xác nhận đơn hàng qua webhook và ghi nhận lịch sử giao dịch rõ ràng.',
  },
];

const workflowSteps = [
  {
    title: 'Đăng ký tài khoản ban tổ chức.',
    text: 'Tạo tài khoản TikFlow bằng email công việc và khai báo thông tin đơn vị tổ chức sự kiện của bạn.',
    href: '/register',
    label: 'Bắt đầu đăng ký',
  },
  {
    title: 'Phê duyệt hồ sơ tổ chức.',
    text: 'Quản trị viên xác minh thông tin đơn vị tổ chức để kích hoạt quyền khởi tạo và quản lý sự kiện trên hệ thống.',
    href: '#faq',
    label: 'Xem điều kiện duyệt',
  },
  {
    title: 'Thiết lập & xuất bản sự kiện.',
    text: 'Cấu hình thông tin chương trình, hạng vé, sơ đồ ghế ngồi và bật phòng chờ nếu cần trước khi đưa sự kiện lên danh mục công khai.',
    href: '/guide',
    label: 'Xem trải nghiệm người mua',
  },
  {
    title: 'Mở bán & soát vé tại cổng.',
    text: 'Theo dõi đơn hàng, doanh thu theo thời gian thực và phân công nhân viên dùng trình quét QR để check-in khán giả.',
    href: '/events',
    label: 'Khám phá sự kiện đang mở',
  },
];

export default function ForOrganizersPage() {
  return (
    <div className="world-editorial">
      <EditorialHero
        eyebrow="Dành cho ban tổ chức"
        title={
          <>
            Tổ chức sự kiện.
            <br />
            <em>Vận hành trọn vẹn.</em>
          </>
        }
        description="Từ mở bán sơ đồ ghế, điều tiết phòng chờ đến soát vé QR tại cổng — mọi công cụ cần thiết để bạn làm chủ toàn bộ vòng đời sự kiện trên một nền tảng."
        image="/images/live-stage.jpg"
        alt="Sân khấu sự kiện trực tiếp được chuẩn bị cho khán giả"
      >
        <OrganizerHeroActions />
      </EditorialHero>

      <section id="features" className="world-section">
        <div className="container">
          <div className="max-w-2xl">
            <SectionLabel>Năng lực nền tảng</SectionLabel>
            <DisplayHeading>
              Công cụ thực tế cho
              <br />
              từng khâu bán vé.
            </DisplayHeading>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Reveal
                  key={feature.title}
                  className="flex flex-col justify-between rounded-2xl border bg-card p-6"
                >
                  <div>
                    <div className="inline-flex size-10 items-center justify-center rounded-xl border bg-background text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <h3 className="mt-5 text-base font-semibold tracking-tight">{feature.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-muted-foreground">
                      {feature.description}
                    </p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <section id="workflow" className="world-section">
        <div className="container editorial-guide-layout">
          <div className="editorial-guide-sticky">
            <SectionLabel>Quy trình 4 bước</SectionLabel>
            <DisplayHeading>
              Từ khởi tạo
              <br />
              đến giờ mở cổng.
            </DisplayHeading>
            <Link href="#faq" className="text-link">
              Câu hỏi thường gặp cho ban tổ chức <ArrowUpRight className="size-4" />
            </Link>
          </div>
          <div>
            {workflowSteps.map((step, index) => (
              <Reveal key={step.title} className="editorial-guide-step">
                <span className="editorial-step-number">0{index + 1}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                  <Link href={step.href} className="text-link">
                    {step.label}
                    <ArrowUpRight className="size-4" />
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="editorial-faq world-section">
        <div className="container editorial-story-grid">
          <div>
            <SectionLabel>Câu hỏi thường gặp</SectionLabel>
            <DisplayHeading>Giải đáp cho nhà tổ chức.</DisplayHeading>
            <p className="editorial-note mt-4">
              Tìm hiểu về quy trình xét duyệt, cấu hình sơ đồ ghế, phòng chờ và đối soát thanh toán
              trên TikFlow.
            </p>
          </div>
          <OrganizerFaq />
        </div>
      </section>

      <section className="editorial-cta">
        <div className="container">
          <Reveal className="editorial-cta-inner">
            <div>
              <SectionLabel>Sẵn sàng mở bán</SectionLabel>
              <h2>
                Đưa sự kiện tiếp theo
                <br />
                lên TikFlow.
              </h2>
            </div>
            <OrganizerFinalCtaLink />
          </Reveal>
        </div>
      </section>
    </div>
  );
}
