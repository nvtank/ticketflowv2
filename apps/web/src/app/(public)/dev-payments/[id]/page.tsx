import { notFound } from 'next/navigation';
import { MockPayment } from '@/components/booking/mock-payment';

export const dynamic = 'force-dynamic';

function isMockPaymentPageEnabled() {
  if (process.env.VERCEL_ENV === 'production') return false;
  if (process.env.NODE_ENV !== 'production') return true;
  return process.env.ENABLE_DEV_PAYMENTS === 'true';
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  if (!isMockPaymentPageEnabled()) {
    notFound();
  }
  const { id } = await params;
  return <MockPayment id={id} />;
}
