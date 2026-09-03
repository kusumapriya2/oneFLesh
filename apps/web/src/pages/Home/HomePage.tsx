// ============================================================
// OneFlesh — Home Page
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../services/api.js';
import { Footer } from '../../components/layout/Footer.js';
import { Button } from '../../components/ui/Button.js';

// ─── Count-up hook ────────────────────────────────────────────
function useCountUp(target: number, duration = 1500) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

// ─── Photo strip images ───────────────────────────────────────
const STRIP_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=600&q=80',
    alt: 'Wedding ceremony',
  },
  {
    src: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=600&q=80',
    alt: 'Wedding rings',
  },
  {
    src: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80',
    alt: 'Couple portrait',
  },
  {
    src: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&q=80',
    alt: 'Church wedding',
  },
  {
    src: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=80',
    alt: 'Wedding celebration',
  },
  {
    src: 'https://images.unsplash.com/photo-1587271407850-8d438ca9fdf2?w=600&q=80',
    alt: 'Wedding bouquet',
  },
];

// ─── Gallery images ───────────────────────────────────────────
const GALLERY_IMAGES = [
  {
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=85',
    alt: 'Wedding ceremony aisle',
    caption: 'Covenant beginnings',
    tall: true,
  },
  {
    src: 'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=600&q=80',
    alt: 'Exchange of vows',
    caption: 'Vows of faithfulness',
    tall: false,
  },
  {
    src: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=600&q=80',
    alt: 'Couple by the church',
    caption: 'Reformed traditions',
    tall: false,
  },
  {
    src: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?w=600&q=80',
    alt: 'Family blessing',
    caption: 'Family blessings',
    tall: false,
  },
  {
    src: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=600&q=80',
    alt: 'Wedding reception',
    caption: 'Joy & celebration',
    tall: false,
  },
];

// ─── How it Works steps ───────────────────────────────────────
const HOW_STEPS = [
  {
    icon: '⛪',
    step: '01',
    title: 'Church Registers',
    desc: 'Your pastor submits the church application. Our team verifies Reformed doctrinal alignment.',
  },
  {
    icon: '📋',
    step: '02',
    title: 'Profile Created',
    desc: 'Pastor creates profiles for eligible members with testimony, endorsements, and pastoral recommendation.',
  },
  {
    icon: '🤝',
    step: '03',
    title: 'Pastors Match',
    desc: 'AI-assisted matching surfaces compatible profiles. Pastors review and shortlist candidates prayerfully.',
  },
  {
    icon: '👨‍👩‍👧',
    step: '04',
    title: 'Families Introduced',
    desc: 'Pastors exchange formal introduction letters. Families meet under pastoral supervision.',
  },
  {
    icon: '💍',
    step: '05',
    title: 'Alliance Formed',
    desc: 'With family consent, an official alliance is opened. Six counselling sessions guide the couple.',
  },
  {
    icon: '🎊',
    step: '06',
    title: 'Wedding Services',
    desc: 'Connect with verified Christian photographers, caterers, florists, and more for the celebration.',
  },
];

// ─── Vendor categories ────────────────────────────────────────
const VENDOR_CATEGORIES = [
  {
    label: 'Photography & Video',
    img: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=400&q=75',
    tag: 'PHOTOGRAPHY',
  },
  {
    label: 'Catering & Chefs',
    img: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=400&q=75',
    tag: 'CATERING',
  },
  {
    label: 'Flowers & Stage Décor',
    img: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=75',
    tag: 'DECOR',
  },
  {
    label: 'Music & Worship',
    img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=75',
    tag: 'MUSIC',
  },
  {
    label: 'Tailors & Bridal Wear',
    img: 'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?w=400&q=75',
    tag: 'TAILORS',
  },
  {
    label: 'Destinations & Venues',
    img: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=400&q=75',
    tag: 'VENUES',
  },
  {
    label: 'Invitations & Stationery',
    img: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=400&q=75',
    tag: 'INVITATIONS',
  },
  {
    label: 'Wedding Cakes',
    img: 'https://images.unsplash.com/photo-1535141192574-5f897571e120?w=400&q=75',
    tag: 'CAKES',
  },
];

// ─── Stats row component ──────────────────────────────────────
interface StatItemProps {
  value: number;
  label: string;
  suffix?: string;
}

function StatItem({ value, label, suffix = '' }: StatItemProps) {
  const count = useCountUp(value);
  return (
    <div className="text-center px-6 first:pl-0 last:pr-0">
      <div className="font-display text-[26px] text-gold leading-none">
        {count}
        {suffix}
      </div>
      <div className="font-body text-[10px] tracking-[0.1em] uppercase text-white/55 mt-0.5">
        {label}
      </div>
    </div>
  );
}

// ─── Main HomePage ────────────────────────────────────────────
export default function HomePage() {
  const navigate = useNavigate();
  const [expandedStrip, setExpandedStrip] = useState<number | null>(null);

  const { data: statsRes } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => dashboardApi.publicStats(),
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });

  const stats = statsRes?.data?.data as { totalChurches: number; totalProfiles: number; totalAlliances: number; totalVendors: number } | undefined;

  const churchCount    = stats?.totalChurches  ?? 0;
  const profileCount   = stats?.totalProfiles  ?? 0;
  const allianceCount  = stats?.totalAlliances ?? 0;
  const vendorCount    = stats?.totalVendors   ?? 0;

  return (
    <div className="min-h-screen bg-[#1a0508] font-body">
      {/* ══════════════════════════════════════════════
          HERO SECTION
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden min-h-[calc(100vh-190px)] flex flex-col justify-between">
        {/* Background image */}
        <img
          src="https://images.unsplash.com/photo-1519741497674-611481863552?w=1800&q=90"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.45 }}
        />

        {/* Dark overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a0508]/80 via-[#1a0508]/55 to-[#1a0508]/92" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1a0508]/60 via-transparent to-[#1a0508]/30" />

        {/* Nav bar */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-4">
          <div className="font-display text-[22px] text-gold-light select-none">
            One<em className="font-light italic">Flesh</em>
          </div>
          <div className="hidden md:flex items-center gap-7">
            <Link
              to="/profiles"
              className="font-body text-[12px] tracking-[0.1em] uppercase text-white/80 hover:text-white transition-colors"
            >
              Profiles
            </Link>
            <Link
              to="/vendors"
              className="font-body text-[12px] tracking-[0.1em] uppercase text-white/80 hover:text-white transition-colors"
            >
              Vendors
            </Link>
            <Link
              to="/counselling"
              className="font-body text-[12px] tracking-[0.1em] uppercase text-white/80 hover:text-white transition-colors"
            >
              Counselling
            </Link>
            <Link to="/login">
              <Button variant="dark" size="sm">
                Sign In
              </Button>
            </Link>
          </div>
        </nav>

        {/* Hero content — centred */}
        <div className="relative z-10 max-w-[720px] mx-auto px-8 pt-6 pb-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="h-px w-8 bg-gold/60" />
            <span className="font-body text-[11px] tracking-[0.16em] uppercase text-gold/90 bg-gold/10 border border-gold/25 px-3 py-1 rounded-full">
              Reformed Church Matrimonial Network · India
            </span>
            <div className="h-px w-8 bg-gold/60" />
          </div>

          {/* H1 */}
          <h1
            className="font-display text-white leading-[1.06] mb-4"
            style={{ fontSize: 'clamp(36px, 5vw, 62px)' }}
          >
            Covenant <em className="italic font-light text-gold-light">Marriages</em>
            <br />
            Begin Here
          </h1>

          {/* Subtitle */}
          <p className="font-body text-[14px] text-white/70 mx-auto leading-relaxed mb-5">
            A pastor-led platform where Reformed churches across India connect families, oversee
            alliances, and celebrate covenant marriages rooted in Scripture.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/profiles')}
            >
              Browse Profiles
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={() => navigate('/register-church')}
            >
              Register Your Church
            </Button>
          </div>

          {/* Stats row */}
          <div className="border-t border-gold/18 pt-5 flex justify-center flex-wrap gap-y-4 divide-x divide-gold/18">
            <StatItem value={churchCount} label="Reformed Churches" />
            <StatItem value={profileCount} label="Active Profiles" />
            <StatItem value={allianceCount} label="Alliances Formed" />
            <StatItem value={vendorCount} label="Verified Vendors" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PHOTO STRIP
      ══════════════════════════════════════════════ */}
      <section className="flex h-[190px] overflow-hidden">
        {STRIP_IMAGES.map((img, i) => (
          <div
            key={i}
            className="relative flex-1 overflow-hidden cursor-pointer transition-all duration-500"
            style={{
              flexBasis: expandedStrip === i ? '28%' : `${100 / STRIP_IMAGES.length}%`,
              minWidth: '60px',
            }}
            onMouseEnter={() => setExpandedStrip(i)}
            onMouseLeave={() => setExpandedStrip(null)}
          >
            <img
              src={img.src}
              alt={img.alt}
              className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            />
            <div className="absolute inset-0 bg-crimson-deep/20" />
          </div>
        ))}
      </section>

      {/* ══════════════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════════════ */}
      <section className="py-20 px-8" style={{ background: '#ffffff' }}>
        <div className="max-w-[1080px] mx-auto">
          {/* Section header */}
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-6" style={{ background: 'rgba(107,30,35,0.25)' }} />
              <span className="font-body font-bold text-[11px] tracking-[0.16em] uppercase" style={{ color: '#c0152a' }}>
                The Process
              </span>
              <div className="h-px w-6" style={{ background: 'rgba(107,30,35,0.25)' }} />
            </div>
            <h2 className="font-display text-[38px] font-bold leading-tight mb-3" style={{ color: '#c0152a' }}>
              How OneFlesh Works
            </h2>
            <p className="font-body font-light text-[14px] max-w-[480px] mx-auto leading-relaxed" style={{ color: 'rgba(44,15,18,0.60)' }}>
              Every step is pastor-led and family-honoured, from church registration to wedding
              celebration.
            </p>
          </div>

          {/* Steps grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {HOW_STEPS.map((step) => (
              <div
                key={step.step}
                className="group rounded-xl px-6 py-6 hover:-translate-y-1 transition-all duration-250"
                style={{
                  background: '#fdf9f7',
                  border: '1px solid rgba(107,30,35,0.10)',
                  boxShadow: '0 2px 12px rgba(44,15,18,0.06)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#fff5f0'; e.currentTarget.style.borderColor = 'rgba(107,30,35,0.22)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#fdf9f7'; e.currentTarget.style.borderColor = 'rgba(107,30,35,0.10)'; }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-11 h-11 rounded-lg flex items-center justify-center text-[20px]"
                      style={{ background: 'rgba(107,30,35,0.07)' }}>
                      {step.icon}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-body font-light text-[10px] tracking-[0.14em] uppercase" style={{ color: '#c9a84c' }}>
                        Step {step.step}
                      </span>
                    </div>
                    <h3 className="font-display font-light text-[19px] mb-1.5 leading-tight" style={{ color: '#2C0F12' }}>
                      {step.title}
                    </h3>
                    <p className="font-body font-light text-[13px] leading-relaxed" style={{ color: 'rgba(44,15,18,0.60)' }}>
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          GALLERY
      ══════════════════════════════════════════════ */}
      <section className="bg-warm-white py-20 px-8">
        <div className="max-w-[1080px] mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-6 bg-gold/50" />
              <span className="font-body text-[11px] tracking-[0.16em] uppercase" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Gallery
              </span>
              <div className="h-px w-6 bg-gold/50" />
            </div>
            <h2 className="font-display text-[38px] leading-tight" style={{ color: '#ffffff' }}>
              Covenant Moments
            </h2>
          </div>

          {/* CSS Grid */}
          <div className="grid grid-cols-3 grid-rows-2 gap-3 h-[520px]">
            {/* Tall left image */}
            <div className="col-span-1 row-span-2 group relative overflow-hidden rounded-xl cursor-pointer">
              <img
                src={GALLERY_IMAGES[0].src}
                alt={GALLERY_IMAGES[0].alt}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-crimson-deep/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                <p className="font-display text-[17px] text-gold-light">{GALLERY_IMAGES[0].caption}</p>
              </div>
            </div>

            {/* Four right images */}
            {GALLERY_IMAGES.slice(1).map((img) => (
              <div
                key={img.alt}
                className="group relative overflow-hidden rounded-xl cursor-pointer"
              >
                <img
                  src={img.src}
                  alt={img.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-crimson-deep/65 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0">
                  <p className="font-display text-[14px] text-gold-light">{img.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          COUNSELLING CALLOUT
      ══════════════════════════════════════════════ */}
      <section
        className="relative py-24 px-8 overflow-hidden"
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Crimson accent lines */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-transparent to-crimson/30" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-t from-transparent to-crimson/30" />

        <div className="relative z-10 max-w-[640px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 mb-5">
            <div className="h-px w-6" style={{ background: 'rgba(107,30,35,0.30)' }} />
            <span className="font-body font-bold text-[11px] tracking-[0.16em] uppercase" style={{ color: '#c0152a' }}>
              Pre-Marital Counselling
            </span>
            <div className="h-px w-6" style={{ background: 'rgba(107,30,35,0.30)' }} />
          </div>

          <h2 className="font-display text-[40px] leading-tight mb-4" style={{ color: '#2C0F12' }}>
            Preparing Hearts for{' '}
            <em className="italic font-light" style={{ color: '#c0152a' }}>Covenant Marriage</em>
          </h2>

          <p className="font-body text-[14px] leading-relaxed mb-9 max-w-[460px] mx-auto" style={{ color: 'rgba(44,15,18,0.65)' }}>
            Six structured counselling sessions guided by your pastor, covering communication,
            finances, faith, intimacy, and family. AI-assisted questions. Certificate upon
            completion.
          </p>

          <button
            onClick={() => navigate('/counselling')}
            className="inline-flex items-center gap-2 font-body text-[13px] tracking-widest uppercase font-semibold px-7 py-3 rounded-full transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: '#2C0F12', color: '#ffffff',
              border: '1px solid rgba(44,15,18,0.15)',
              boxShadow: '0 4px 18px rgba(44,15,18,0.18)',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#4a0a12'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(44,15,18,0.28)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#2C0F12'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(44,15,18,0.18)'; }}
          >
            Explore the Programme
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          VENDOR CATEGORIES
      ══════════════════════════════════════════════ */}
      <section className="bg-cream py-20 px-8">
        <div className="max-w-[1080px] mx-auto">
          {/* Section header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="h-px w-6 bg-gold/50" />
              <span className="font-body text-[11px] tracking-[0.16em] uppercase" style={{ color: 'rgba(255,255,255,0.55)' }}>
                Wedding Services
              </span>
              <div className="h-px w-6 bg-gold/50" />
            </div>
            <h2 className="font-display text-[38px] leading-tight mb-3" style={{ color: '#ffffff' }}>
              Trusted Christian Vendors
            </h2>
            <p className="font-body text-[14px] max-w-[420px] mx-auto leading-relaxed" style={{ color: 'rgba(255,255,255,0.70)' }}>
              Every vendor is pastor-verified. Support faith-aligned businesses for your special day.
            </p>
          </div>

          {/* Category grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {VENDOR_CATEGORIES.map((cat) => (
              <Link
                key={cat.tag}
                to={`/vendors?category=${cat.tag}`}
                className="group relative overflow-hidden rounded-xl h-[160px] cursor-pointer"
              >
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-crimson-deep/80 via-crimson-deep/25 to-transparent" />
                <div className="absolute inset-0 flex items-end p-4">
                  <span className="font-display text-[17px] text-white leading-tight">
                    {cat.label}
                  </span>
                </div>
              </Link>
            ))}

            {/* List your business card */}
            <Link
              to="/vendors/add"
              className="group relative overflow-hidden rounded-xl h-[160px] cursor-pointer border-2 border-dashed border-gold/35 bg-warm-white hover:border-gold/70 hover:bg-white/8 transition-all duration-200 flex flex-col items-center justify-center gap-2"
            >
              <div className="w-10 h-10 rounded-full border-2 border-gold/45 group-hover:border-gold flex items-center justify-center transition-colors">
                <svg
                  className="w-5 h-5 text-gold/60 group-hover:text-gold transition-colors"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <span className="font-display text-[15px] text-text-muted group-hover:text-gold transition-colors text-center px-3">
                List Your Business
              </span>
              <span className="font-body text-[11px] text-text-muted/60 text-center px-4">
                Pastor-verified listings
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <Footer />
    </div>
  );
}
