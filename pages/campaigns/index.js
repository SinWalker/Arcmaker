import dynamic from 'next/dynamic';
import Head from 'next/head';

const CampaignLauncherUI = dynamic(() => import('../../components/campaigns/CampaignLauncherUI'), { ssr: false });

export default function CampaignsPage() {
  return (
    <>
      <Head><title>ArcMaker</title></Head>
      <CampaignLauncherUI />
    </>
  );
}
