import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV = [
  { href: '/dashboard', icon: '⬡', label: 'Arc' },
  { href: '/calendar',  icon: '📅', label: 'Mission' },
  { href: '/today',     icon: '●',  label: 'Today' },
  { href: '/sessions',  icon: '🎥', label: 'Sessions' },
];

export default function AppLayout({ children, title }) {
  const router = useRouter();

  return (
    <>
      {title && (
        <div style={{ background: '#111', borderBottom: '1px solid #2A2A2A', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          {router.pathname !== '/dashboard' && (
            <button
              onClick={() => router.back()}
              style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: 18, cursor: 'pointer', padding: 0, marginRight: 4 }}
            >‹</button>
          )}
          <span style={{ fontSize: 16, fontWeight: 700, color: '#F0F0F0' }}>{title}</span>
        </div>
      )}
      <div className="screen">
        <div className="page-content">
          {children}
        </div>
      </div>
      <nav className="bottom-nav">
        {NAV.map(({ href, icon, label }) => {
          const active = router.pathname === href || router.pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={`nav-tab${active ? ' active' : ''}`}>
              <span className="icon">{icon}</span>
              <span className="label">{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
