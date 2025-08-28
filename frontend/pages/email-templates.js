import React from 'react';
import Layout from '../components/Layout';
import EmailTemplateEditor from '../components/EmailTemplateEditor';

export default function EmailTemplates() {
  return (
    <Layout title="Templates d'Email">
      <EmailTemplateEditor />
    </Layout>
  );
}
