import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-20 md:pt-24">{children}</main>
      <Footer />
    </div>
  );
}
