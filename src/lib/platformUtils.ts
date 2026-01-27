export type PlatformType = 'onlyfans' | 'fansly' | 'tipmeon' | 'loyalfans';

export interface PlatformConfig {
  name: string;
  color: string;
  baseUrl: string;
  icon: string;
}

export const platformConfigs: Record<PlatformType, PlatformConfig> = {
  onlyfans: {
    name: 'OnlyFans',
    color: '#00AFF0',
    baseUrl: 'https://onlyfans.com/',
    icon: 'OF'
  },
  fansly: {
    name: 'Fansly',
    color: '#1DA1F2',
    baseUrl: 'https://fansly.com/',
    icon: 'F'
  },
  tipmeon: {
    name: 'Tipmeon',
    color: '#FF6B6B',
    baseUrl: 'https://tipmeon.com/',
    icon: 'TM'
  },
  loyalfans: {
    name: 'LoyalFans',
    color: '#9B59B6',
    baseUrl: 'https://loyalfans.com/',
    icon: 'LF'
  }
};

export const generateProfileUrl = (platform: PlatformType, username: string): string => {
  const config = platformConfigs[platform];
  // Normalize username - remove @ if present, trim whitespace
  const normalizedUsername = username.replace(/^@/, '').trim().toLowerCase();
  return `${config.baseUrl}${normalizedUsername}`;
};

export const normalizeUsername = (username: string): string => {
  return username
    .replace(/^@/, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.-]/g, '');
};

export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  const normalized = normalizeUsername(username);
  
  if (!normalized) {
    return { valid: false, error: 'Username richiesto' };
  }
  
  if (normalized.length < 2) {
    return { valid: false, error: 'Username troppo corto (min 2 caratteri)' };
  }
  
  if (normalized.length > 50) {
    return { valid: false, error: 'Username troppo lungo (max 50 caratteri)' };
  }
  
  return { valid: true };
};

export const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};
