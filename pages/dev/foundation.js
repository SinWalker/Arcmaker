import dynamic from 'next/dynamic';
import Head from 'next/head';

const FoundationUI = dynamic(() => import('../../components/FoundationUI'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: 32, color: '#888', fontFamily: 'monospace', background: '#0D0D0D', minHeight: '100vh' }}>
      Loading diagnostics...
    </div>
  ),
});

export default function DevFoundationPage() {
  return (
    <>
      <Head><title>Dev — Foundation Diagnostics</title></Head>
      <FoundationUI />
    </>
  );
}
