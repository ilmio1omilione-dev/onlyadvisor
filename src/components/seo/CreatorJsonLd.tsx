import { Helmet } from 'react-helmet-async';

interface CreatorJsonLdProps {
  name: string;
  slug: string;
  description?: string;
  image?: string;
  rating?: number;
  reviewCount?: number;
  country?: string;
}

const BASE_URL = 'https://onlyadvisor.lovable.app';

export const CreatorJsonLd = ({
  name,
  slug,
  description,
  image,
  rating,
  reviewCount,
  country,
}: CreatorJsonLdProps) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name,
    url: `${BASE_URL}/creator/${slug}`,
    description: description || `Profilo e recensioni di ${name} su OnlyAdvisor`,
    image: image || undefined,
    ...(country && {
      address: {
        '@type': 'PostalAddress',
        addressCountry: country,
      },
    }),
    ...(rating && reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating.toFixed(1),
        bestRating: '5',
        worstRating: '1',
        reviewCount: reviewCount,
      },
    }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};
