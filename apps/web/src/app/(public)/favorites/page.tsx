import type { Metadata } from 'next';
import { AuthGate } from '@/components/auth/auth-gate';
import { FavoritesPageContent } from '@/components/events/favorites-page-content';

export const metadata: Metadata = { title: 'Sự kiện yêu thích' };

export default function FavoritesPage() {
  return (
    <AuthGate embedded>
      <FavoritesPageContent />
    </AuthGate>
  );
}
