import dynamic from 'next/dynamic';
import Head from 'next/head';
import { useRouter } from 'next/router';

const CampaignHomeUI = dynamic(() => import('../../components/campaigns/CampaignHomeUI'), { ssr: false });

export default function CampaignHomePage() {
  const router = useRouter();
  const { campaignId } = router.query;
  return (
    <>
      <Head><title>Campaign — ArcMaker</title></Head>
      {campaignId && <CampaignHomeUI campaignId={campaignId} />}
    </>
  );
}
