import { Layout } from '@/components/layout/Layout';
import { HeroSection } from '@/components/home/HeroSection';
import { FeaturedCreators } from '@/components/home/FeaturedCreators';
import { CategoriesSection } from '@/components/home/CategoriesSection';
import { RewardsSection } from '@/components/home/RewardsSection';

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturedCreators />
      <CategoriesSection />
      <RewardsSection />
    </Layout>
  );
};

export default Index;
