import "@/styles/globals.css";
import Link from "next/link";
import { useRouter } from "next/router";

function BottomNav() {
  const { pathname } = useRouter();
  const tabs = [
    { href: "/calendar", icon: "📅", label: "Missions" },
    { href: "/today", icon: "🎯", label: "Today" },
    { href: "/log", icon: "📋", label: "Log" },
  ];
  return (
    <nav className="bottom-nav">
      {tabs.map((t) => (
        <Link key={t.href} href={t.href} className={`nav-tab${pathname.startsWith(t.href) ? " active" : ""}`}>
          <span className="icon">{t.icon}</span>
          <span className="label">{t.label}</span>
        </Link>
      ))}
    </nav>
  );
}

export default function App({ Component, pageProps }) {
  return (
    <>
      <div className="screen">
        <Component {...pageProps} />
      </div>
      <BottomNav />
    </>
  );
}
