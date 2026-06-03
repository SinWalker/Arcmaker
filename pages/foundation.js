import dynamic from 'next/dynamic';
import Head from 'next/head';

// SSR disabled — all Dexie calls happen in the browser only
const FoundationUI = dynamic(
  () => import('../components/FoundationUI'),
  {
    ssr: false,
    loading: () => (
      <div style={{ padding: 32, color: '#888', fontFamily: 'monospace', background: '#0D0D0D', minHeight: '100vh' }}>
        Loading ArcMaker...
      </div>
    ),
  }
);

export default function FoundationPage() {
  return (
    <>
      <Head>
        <title>ArcMaker — Phase 0 Foundation</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <FoundationUI />
    </>
  );
}
