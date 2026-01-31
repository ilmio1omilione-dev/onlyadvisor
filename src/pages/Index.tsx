import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedCreators } from '@/components/home/FeaturedCreators';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { RewardsSection } from '@/components/home/RewardsSection';
import { SEOHead, WebsiteJsonLd } from '@/components/seo';

const Index = () => {
  return (
    <Layout>
      <SEOHead 
        title="OnlyAdvisor - Recensioni Creator Verificate"
        description="La piattaforma di recensioni per content creator più affidabile. Trova i migliori creator OnlyFans, Fansly e altre piattaforme con recensioni verificate dalla community."
        canonicalUrl="/"
        keywords={['recensioni creator', 'onlyfans recensioni', 'fansly recensioni', 'content creator', 'onlyadvisor']}
      />
      <WebsiteJsonLd />
      <HeroSection />
      <FeaturedCreators />
      <CategoriesSection />
      <RewardsSection />
    </Layout>
  );
};

export default Index;
