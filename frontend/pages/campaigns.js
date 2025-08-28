import React from 'react';
import Layout from '../components/Layout';
import CampaignManager from '../components/CampaignManager';

export default function Campaigns() {
  return (
    <Layout title="Campagnes Email">
      <div className="campaign-manager">
        <CampaignManager />
      </div>
    </Layout>
  );
}
