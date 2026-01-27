export type Platform = 'onlyfans' | 'fansly' | 'tipmeon' | 'loyalfans';

export interface PlatformLink {
  platform: Platform;
  username: string;
  url: string;
  verified: boolean;
}

export interface Creator {
  id: string;
  name: string;
  slug: string;
  avatar: string;
  coverImage: string;
  bio: string;
  category: string;
  country: string;
  languages: string[];
  platforms: PlatformLink[];
  rating: number;
  reviewCount: number;
  isVerified: boolean;
  isPremium: boolean;
  createdAt: string;
  tags: string[];
}

export interface Review {
  id: string;
  creatorId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  title: string;
  content: string;
  pros: string[];
  cons: string[];
  language: string;
  createdAt: string;
  helpful: number;
  platform: Platform;
}

export const platformInfo: Record<Platform, { name: string; color: string; baseUrl: string }> = {
  onlyfans: { name: 'OnlyFans', color: '#00AFF0', baseUrl: 'https://onlyfans.com/' },
  fansly: { name: 'Fansly', color: '#1DA1F2', baseUrl: 'https://fansly.com/' },
  tipmeon: { name: 'Tipmeon', color: '#FF6B6B', baseUrl: 'https://tipmeon.com/' },
  loyalfans: { name: 'LoyalFans', color: '#9B59B6', baseUrl: 'https://loyalfans.com/' },
};

export const categories = [
  'Fitness & Lifestyle',
  'Cosplay & Gaming',
  'Modeling',
  'Dance & Performance',
  'Art & Photography',
  'ASMR & Audio',
  'Couples',
  'Alternative & Tattoo',
];

export const mockCreators: Creator[] = [
  {
    id: '1',
    name: 'Alessia Rose',
    slug: 'alessia-rose',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=400&fit=crop',
    bio: 'Fitness enthusiast & lifestyle creator. Daily content, exclusive workout routines, and behind-the-scenes of my fitness journey.',
    category: 'Fitness & Lifestyle',
    country: 'IT',
    languages: ['it', 'en'],
    platforms: [
      { platform: 'onlyfans', username: 'alessiarose', url: 'https://onlyfans.com/alessiarose', verified: true },
      { platform: 'fansly', username: 'alessia_rose', url: 'https://fansly.com/alessia_rose', verified: true },
    ],
    rating: 4.8,
    reviewCount: 342,
    isVerified: true,
    isPremium: true,
    createdAt: '2023-06-15',
    tags: ['fitness', 'lifestyle', 'workout', 'italian'],
  },
  {
    id: '2',
    name: 'Luna Starlight',
    slug: 'luna-starlight',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1200&h=400&fit=crop',
    bio: 'Professional cosplayer bringing your favorite characters to life. Weekly themed content and custom requests available.',
    category: 'Cosplay & Gaming',
    country: 'US',
    languages: ['en'],
    platforms: [
      { platform: 'onlyfans', username: 'lunastarlight', url: 'https://onlyfans.com/lunastarlight', verified: true },
    ],
    rating: 4.9,
    reviewCount: 567,
    isVerified: true,
    isPremium: true,
    createdAt: '2023-02-20',
    tags: ['cosplay', 'gaming', 'anime', 'custom'],
  },
  {
    id: '3',
    name: 'Sofia Vega',
    slug: 'sofia-vega',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200&h=400&fit=crop',
    bio: 'International model with 5+ years experience. High-quality professional shoots and exclusive behind-the-scenes.',
    category: 'Modeling',
    country: 'ES',
    languages: ['es', 'en'],
    platforms: [
      { platform: 'fansly', username: 'sofiavega', url: 'https://fansly.com/sofiavega', verified: true },
      { platform: 'loyalfans', username: 'sofia_vega', url: 'https://loyalfans.com/sofia_vega', verified: false },
    ],
    rating: 4.6,
    reviewCount: 189,
    isVerified: true,
    isPremium: false,
    createdAt: '2023-08-10',
    tags: ['modeling', 'professional', 'spanish'],
  },
  {
    id: '4',
    name: 'Mika Chen',
    slug: 'mika-chen',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200&h=400&fit=crop',
    bio: 'Dance performer & choreographer. Exclusive dance videos, tutorials, and live performances.',
    category: 'Dance & Performance',
    country: 'JP',
    languages: ['ja', 'en'],
    platforms: [
      { platform: 'tipmeon', username: 'mikachen', url: 'https://tipmeon.com/mikachen', verified: true },
    ],
    rating: 4.7,
    reviewCount: 234,
    isVerified: true,
    isPremium: false,
    createdAt: '2023-04-05',
    tags: ['dance', 'choreography', 'performance', 'japanese'],
  },
  {
    id: '5',
    name: 'Valentina Dark',
    slug: 'valentina-dark',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=1200&h=400&fit=crop',
    bio: 'Alternative model with extensive tattoo collection. Dark aesthetic, artistic content, and authentic vibes.',
    category: 'Alternative & Tattoo',
    country: 'DE',
    languages: ['de', 'en'],
    platforms: [
      { platform: 'onlyfans', username: 'valentinadark', url: 'https://onlyfans.com/valentinadark', verified: true },
      { platform: 'fansly', username: 'valentina_dark', url: 'https://fansly.com/valentina_dark', verified: true },
    ],
    rating: 4.5,
    reviewCount: 156,
    isVerified: false,
    isPremium: true,
    createdAt: '2023-09-01',
    tags: ['alternative', 'tattoo', 'gothic', 'artistic'],
  },
  {
    id: '6',
    name: 'Emma Whisper',
    slug: 'emma-whisper',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop',
    coverImage: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop',
    bio: 'ASMR artist creating relaxing and immersive audio experiences. Custom audio available.',
    category: 'ASMR & Audio',
    country: 'UK',
    languages: ['en'],
    platforms: [
      { platform: 'onlyfans', username: 'emmawhisper', url: 'https://onlyfans.com/emmawhisper', verified: true },
    ],
    rating: 4.4,
    reviewCount: 98,
    isVerified: true,
    isPremium: false,
    createdAt: '2023-11-15',
    tags: ['asmr', 'audio', 'relaxation', 'custom'],
  },
];

export const mockReviews: Review[] = [
  {
    id: 'r1',
    creatorId: '1',
    userId: 'u1',
    userName: 'Marco_IT',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    rating: 5,
    title: 'Contenuti di altissima qualità!',
    content: 'Alessia è una creator fantastica. I suoi workout sono professionali e il contenuto è sempre fresco e interessante. Risponde anche ai messaggi velocemente. Consigliata!',
    pros: ['Contenuti regolari', 'Alta qualità', 'Risponde ai messaggi'],
    cons: ['Prezzo leggermente alto'],
    language: 'it',
    createdAt: '2024-01-10',
    helpful: 45,
    platform: 'onlyfans',
  },
  {
    id: 'r2',
    creatorId: '1',
    userId: 'u2',
    userName: 'FitnessFan92',
    userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
    rating: 5,
    title: 'Best fitness content creator',
    content: 'Amazing workout routines and she really engages with her subscribers. The exclusive content is worth every penny. Highly recommended for fitness enthusiasts!',
    pros: ['Great workouts', 'Interactive', 'Value for money'],
    cons: [],
    language: 'en',
    createdAt: '2024-01-08',
    helpful: 32,
    platform: 'fansly',
  },
  {
    id: 'r3',
    creatorId: '2',
    userId: 'u3',
    userName: 'CosplayLover',
    userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
    rating: 5,
    title: 'Incredible cosplay quality',
    content: 'Luna\'s cosplays are museum quality. The attention to detail is insane. She does characters from anime, games, and even takes custom requests. Best cosplay creator out there!',
    pros: ['Amazing costumes', 'Custom requests', 'Fast delivery'],
    cons: ['Booking slots fill up fast'],
    language: 'en',
    createdAt: '2024-01-12',
    helpful: 78,
    platform: 'onlyfans',
  },
];

export const getCreatorBySlug = (slug: string): Creator | undefined => {
  return mockCreators.find(c => c.slug === slug);
};

export const getReviewsByCreatorId = (creatorId: string): Review[] => {
  return mockReviews.filter(r => r.creatorId === creatorId);
};
