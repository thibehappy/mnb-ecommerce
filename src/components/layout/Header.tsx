'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart, cartCount } from '@/lib/store/cart';
import { cn } from '@/lib/utils/cn';

/**
 * Identical to mynicebracelet.com main navigation.
 * The e-commerce app is accessed via a link on the main site's menu — so the
 * header MUST feel continuous with the main site. External anchors point back
 * to the main domain (we assume production = mynicebracelet.com).
 */
const MAIN_HOST = 'https://mynicebracelet.com';
const NAV_ITEMS = [
  { label: 'Accueil', href: `${MAIN_HOST}/`, external: true },
  {
    label: 'Ateliers',
    href: 'https://reservation.garcapps.com/mynicebracelet',
    external: true,
  },
  { label: 'Événements', href: `${MAIN_HOST}/evenements`, external: true },
  { label: 'FAQ', href: `${MAIN_HOST}/faq`, external: true },
];

export function Header() {
  const pathname = usePathname();
  const lines = useCart((s) => s.lines);
  const openCart = useCart((s) => s.open);
  const count = cartCount(lines);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');

  // Header transparent only on the home landing (dark hero).
  // Other pages keep the header solid cream so menu items stay readable.
  const isTransparent = pathname === '/';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => setIsMenuOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  const showSolidBg = !isTransparent || isScrolled;

  return (
    <>
      <nav
        className={cn(
          'fixed w-full z-[100] transition-all duration-500',
          showSolidBg
            ? 'bg-[#F5F0E8]/95 backdrop-blur-md shadow-lg py-2'
            : 'bg-transparent py-4 md:py-6',
        )}
      >
        <div className="container mx-auto px-4 md:px-6 flex justify-between items-center">
          {/* Logo — back to main site */}
          <a href={`${MAIN_HOST}/`} className="flex items-center gap-3 md:gap-4 group">
            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl overflow-hidden shadow-lg flex-shrink-0 bg-[#3D5A73] flex items-center justify-center">
              <span className="font-serif font-black text-white text-[22px] md:text-[28px]">M</span>
            </div>
            <div className="flex flex-col">
              <span
                className={cn(
                  'text-base md:text-xl font-serif font-black tracking-tighter leading-none transition-colors',
                  showSolidBg ? 'text-[#2D3748]' : 'text-white',
                )}
              >
                My Nice Bracelet
              </span>
              <span
                className={cn(
                  'text-[7px] md:text-[9px] font-black uppercase tracking-[0.4em] mt-1 opacity-70 transition-colors',
                  showSolidBg ? 'text-[#2D3748]' : 'text-white',
                )}
              >
                Paris Boutique
              </span>
            </div>
          </a>

          {/* Desktop nav + language toggle + cart */}
          <div className="hidden lg:flex items-center gap-8">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={cn(
                  'text-[10px] font-black uppercase tracking-widest relative py-2 transition-colors',
                  showSolidBg
                    ? 'text-[#2D3748] hover:text-[#3D5A73]'
                    : 'text-white/80 hover:text-white',
                )}
              >
                {item.label}
              </a>
            ))}

            {/* Language toggle */}
            <div
              className="flex items-center gap-1 ml-2 border rounded-full px-1 py-0.5"
              style={{
                borderColor: showSolidBg ? 'rgba(45,55,72,0.15)' : 'rgba(255,255,255,0.2)',
              }}
            >
              {(['FR', 'EN'] as const).map((code) => (
                <button
                  key={code}
                  onClick={() => setLang(code)}
                  className={cn(
                    'text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full transition-all',
                    lang === code
                      ? 'bg-[#3D5A73] text-white shadow-sm'
                      : showSolidBg
                        ? 'text-[#2D3748]/50 hover:text-[#2D3748]'
                        : 'text-white/40 hover:text-white',
                  )}
                >
                  {code}
                </button>
              ))}
            </div>

            {/* Cart */}
            <button
              type="button"
              onClick={openCart}
              aria-label={`Panier (${count} articles)`}
              className={cn(
                'relative ml-2 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                showSolidBg
                  ? 'text-[#2D3748] hover:bg-[#EEE9E0]'
                  : 'text-white hover:bg-white/10',
              )}
            >
              <ShoppingBag size={18} strokeWidth={1.8} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#3D5A73] text-white text-[10px] font-black rounded-full flex items-center justify-center tabular-nums px-1 shadow-md">
                  {count}
                </span>
              )}
            </button>
          </div>

          {/* Mobile */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              type="button"
              onClick={openCart}
              aria-label={`Panier (${count} articles)`}
              className={cn(
                'relative inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                showSolidBg ? 'text-[#2D3748]' : 'text-white',
              )}
            >
              <ShoppingBag size={22} strokeWidth={1.8} />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-[#3D5A73] text-white text-[10px] font-black rounded-full flex items-center justify-center tabular-nums px-1">
                  {count}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={cn(
                'p-2 rounded-xl transition-all',
                showSolidBg ? 'text-[#2D3748]' : 'text-white',
              )}
              aria-label="Menu"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </nav>

      {isMenuOpen && (
        <div className="fixed inset-0 z-[150] lg:hidden bg-[#2D3748] animate-fade-in">
          <div className="flex flex-col h-full items-center justify-center p-8">
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-6 right-6 text-white/50 hover:text-white"
              aria-label="Fermer le menu"
            >
              <X size={40} />
            </button>
            <div className="space-y-10 text-center">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="block text-3xl font-serif font-black text-white uppercase tracking-widest hover:text-[#A8BED4] transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <div className="flex items-center justify-center gap-2 pt-4">
                {(['FR', 'EN'] as const).map((code) => (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={cn(
                      'text-[11px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full transition-all',
                      lang === code
                        ? 'bg-white text-[#2D3748]'
                        : 'text-white/40 border border-white/20 hover:text-white',
                    )}
                  >
                    {code}
                  </button>
                ))}
              </div>
              <Link
                href="/"
                onClick={() => setIsMenuOpen(false)}
                className="inline-block px-8 py-4 bg-white text-[#2D3748] rounded-xl font-black uppercase tracking-widest text-[11px] shadow-xl"
              >
                Retour à la boutique
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
