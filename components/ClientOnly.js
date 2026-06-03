// ClientOnly — SSR guard wrapper
// Renders children only in the browser.
// Use this to wrap any component that touches Dexie or browser APIs.
// All data-bearing components must use this or dynamic({ ssr: false }).

import { useEffect, useState } from 'react';

export default function ClientOnly({ children, fallback = null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return fallback;
  return children;
}
