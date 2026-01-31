import { Helmet } from 'react-helmet-async';

interface ReviewJsonLdProps {
  reviews: Array<{
    id: string;
    authorName: string;
    rating: number;
    title: string;
    content: string;
    datePublished: string;
  }>;
  itemName: string;
  itemSlug: string;
  aggregateRating?: number;
  reviewCount?: number;
}

const BASE_URL = 'https://onlyadvisor.lovable.app';

export const ReviewJsonLd = ({
  reviews,
  itemName,
  itemSlug,
  aggregateRating,
  reviewCount,
}: ReviewJsonLdProps) => {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: itemName,
    url: `${BASE_URL}/creator/${itemSlug}`,
    ...(aggregateRating && reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.toFixed(1),
        bestRating: '5',
        worstRating: '1',
        reviewCount: reviewCount,
      },
    }),
    review: reviews.slice(0, 10).map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.authorName,
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: '5',
        worstRating: '1',
      },
      name: review.title,
      reviewBody: review.content,
      datePublished: review.datePublished,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
};
