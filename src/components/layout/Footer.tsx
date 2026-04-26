import Link from 'next/link';
import { Clock, Instagram, Mail, MapPin, Phone } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Accueil' },
  { href: '/kits', label: 'Kits' },
  { href: '/creer', label: 'Créer mon bracelet' },
];

export function Footer() {
  return (
    <footer className="bg-[#2D3748] text-[#F5F0E8] pt-16 md:pt-32 pb-12 md:pb-16">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid md:grid-cols-3 gap-12 md:gap-16 mb-16 md:mb-20">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-6">
            <div className="w-16 h-16 rounded-[1.2rem] overflow-hidden shadow-2xl bg-[#3D5A73] flex items-center justify-center">
              <span className="font-serif font-black text-white text-[26px]">M</span>
            </div>
            <h2 className="text-2xl font-serif font-black tracking-tighter uppercase leading-none text-white">
              my nice bracelet
            </h2>
            <p className="text-[#D6E0EC] text-sm italic leading-relaxed font-medium text-center md:text-left">
              Bijoux personnalisés, faits à Paris. Composez votre bracelet en boutique ou en ligne.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#B0C2D3] mb-2">
              Navigation
            </h3>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#D6E0EC] hover:text-white text-sm transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#B0C2D3] mb-2">
              Contact
            </h3>
            <div className="flex items-center gap-3 text-[#D6E0EC] text-sm">
              <MapPin size={16} /> 3 Rue du Général Lanrezac, 75017 Paris
            </div>
            <div className="flex items-center gap-3 text-[#D6E0EC] text-sm">
              <Clock size={16} /> Ouvert 7j/7
            </div>
            <a
              href="tel:+33170233108"
              className="flex items-center gap-3 text-[#D6E0EC] hover:text-white text-sm transition-colors"
            >
              <Phone size={16} /> 01.70.23.31.08
            </a>
            <a
              href="tel:+33768247400"
              className="flex items-center gap-3 text-[#D6E0EC] hover:text-white text-sm transition-colors"
            >
              <Phone size={16} /> 07.68.24.74.00
            </a>
            <a
              href="mailto:contact@mynicebracelet.com"
              className="flex items-center gap-3 text-[#D6E0EC] hover:text-white text-sm transition-colors"
            >
              <Mail size={16} /> contact@mynicebracelet.com
            </a>
            <a
              href="https://instagram.com/mynicebracelet"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-[#D6E0EC] hover:text-white text-sm transition-colors mt-2"
            >
              <Instagram size={16} /> @mynicebracelet
            </a>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col items-center gap-3 md:flex-row md:justify-between text-[#C6D5E4] text-[7px] sm:text-[8px] md:text-[10px] font-black uppercase tracking-[0.12em] sm:tracking-[0.2em] md:tracking-[0.3em]">
          <span className="text-center">
            &copy; {new Date().getFullYear()} My Nice Bracelet Paris
          </span>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 md:gap-6">
            <Link href="/mentions-legales" className="hover:text-white transition-colors">
              Mentions légales
            </Link>
            <Link href="/politique-confidentialite" className="hover:text-white transition-colors">
              Confidentialité
            </Link>
            <Link href="/cgv" className="hover:text-white transition-colors">
              CGV
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
