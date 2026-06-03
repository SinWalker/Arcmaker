// _app.js — ArcMaker root
// Phase 0: no nav, no layout chrome. Foundation only.
// Nav and layout will be added in Phase 1.
import '@/styles/globals.css';

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />;
}
