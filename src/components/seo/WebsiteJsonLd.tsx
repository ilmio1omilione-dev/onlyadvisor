import { Helmet } from 'react-helmet-async';

const BASE_URL = 'https://onlyadvisor.lovable.app';

export const WebsiteJsonLd = () => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'OnlyAdvisor',
    url: BASE_URL,
    description: 'La piattaforma di recensioni per content creator più affidabile. Trova i migliori creator e condividi la tua esperienza.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/creators?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: ['it', 'en', 'es'],
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};
