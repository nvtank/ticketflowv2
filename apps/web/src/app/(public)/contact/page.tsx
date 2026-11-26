import type { Metadata } from 'next';
import { ContactForm } from '@/components/contact/contact-form';

export const metadata: Metadata = {
  title: 'Liên hệ',
  description: 'Gửi câu hỏi hoặc phản hồi đến đội ngũ TikFlow.',
};

export default function ContactPage() {
  return (
    <div className="container max-w-2xl space-y-6 py-10 sm:py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold sm:text-4xl">Liên hệ</h1>
        <p className="text-muted-foreground">Gửi câu hỏi hoặc phản hồi đến đội ngũ TikFlow.</p>
      </header>
      <ContactForm />
    </div>
  );
}
