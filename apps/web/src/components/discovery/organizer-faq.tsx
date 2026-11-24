'use client';

import { useState } from 'react';
import { AnimatePresence, m, useReducedMotion } from 'motion/react';
import { Plus, Minus } from 'lucide-react';

const organizerQuestions = [
  {
    title: 'Làm sao để tài khoản của tôi được duyệt quyền ban tổ chức?',
    answer:
      'Sau khi tạo tài khoản tại trang đăng ký, bạn gửi hồ sơ thông tin đơn vị tổ chức trong khu vực quản trị. Quản trị viên hệ thống sẽ xem xét thông tin sự kiện dự kiến trước khi kích hoạt quyền xuất bản.',
  },
  {
    title: 'Tôi có thể tự thiết kế sơ đồ ghế và hạng vé không?',
    answer:
      'Có. Trong trình chỉnh sửa sự kiện, bạn có thể tạo nhiều hạng vé với mức giá riêng, thiết lập lưới sơ đồ ghế theo khu vực và kiểm soát trạng thái từng ghế trước khi mở bán.',
  },
  {
    title: 'Phòng chờ hoạt động như thế nào khi sự kiện có lượng truy cập cao?',
    answer:
      'Bạn có thể bật phòng chờ và đặt giới hạn số người vào khu vực chọn ghế cùng lúc. Hệ thống xếp hàng theo thứ tự vào trước ra trước (FIFO) và cấp lượt tự động khi có người hoàn tất hoặc rời phiên.',
  },
  {
    title: 'Thanh toán và đối soát doanh thu qua PayOS diễn ra ra sao?',
    answer:
      'Khi người mua thanh toán qua cổng PayOS, webhook xác nhận giao dịch tự động cập nhật trạng thái đơn hàng và phát hành vé. Dữ liệu doanh thu từng sự kiện được tổng hợp trực tiếp trong mục thống kê của ban tổ chức.',
  },
  {
    title: 'Nhân viên soát vé tại cổng cần quyền truy cập gì?',
    answer:
      'Bạn có thể phân công tài khoản nhân viên (Staff) cho từng sự kiện cụ thể. Nhân viên chỉ có quyền mở trình quét mã QR để xác thực vé hợp lệ và ghi nhận lượt vào cổng, không can thiệp vào cấu hình giá hay doanh thu.',
  },
];

export function OrganizerFaq() {
  const [open, setOpen] = useState<number | null>(0);
  const reduced = useReducedMotion();

  return (
    <div className="divide-y rounded-2xl border bg-card px-5 md:px-8">
      {organizerQuestions.map((question, index) => (
        <div key={question.title}>
          <h3>
            <button
              type="button"
              id={`org-faq-question-${index}`}
              aria-expanded={open === index}
              aria-controls={`org-faq-answer-${index}`}
              onClick={() => setOpen(open === index ? null : index)}
              className="flex w-full items-center justify-between gap-5 py-6 text-left text-sm leading-6 font-semibold"
            >
              {question.title}
              {open === index ? (
                <Minus className="size-4 shrink-0 text-primary" />
              ) : (
                <Plus className="size-4 shrink-0 text-primary" />
              )}
            </button>
          </h3>
          <AnimatePresence initial={false}>
            {open === index && (
              <m.div
                key="answer"
                id={`org-faq-answer-${index}`}
                role="region"
                aria-labelledby={`org-faq-question-${index}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: reduced ? 0 : 0.25 }}
                className="overflow-hidden"
              >
                <p className="pb-6 pr-5 text-sm leading-8 text-muted-foreground">
                  {question.answer}
                </p>
              </m.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
}
