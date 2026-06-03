import Link from 'next/link';
import { useRouter } from 'next/router';

const NAV = [
  { href: '/arc',   label: 'ARC' },
  { href: '/ops',   label: 'OPS' },
  { href: '/cal',   label: 'CAL' },
  { href: '/field', label: 'FIELD' },
  { href: '/log',   label: 'LOG' },
];

export default function AppLayout({ children, sysLabel, pageTitle }) {
  const router = useRouter();

  return (
    <>
      <div className="screen">
        <div className="page-content">
          {/* System Header */}
          <div className="sys-header">
            <div className="sys-label">{sysLabel || 'STORY OPERATIONS SYSTEM'}</div>
            <div className="sys-logo">{pageTitle || 'ARCMAKER'}</div>
          </div>
          {children}
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="bottom-nav">
        {NAV.map(({ href, label }) => {
          const active =
            router.pathname === href ||
            router.pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} className={`nav-tab${active ? ' active' : ''}`}>
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
