import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CreatorCheckRequest {
  creator_name: string;
  platform_links: Array<{
    platform: string;
    username: string;
    url: string;
  }>;
  user_id: string;
}

interface FraudCheckResult {
  passed: boolean;
  riskScore: number;
  flags: string[];
  similarCreators: Array<{
    id: string;
    name: string;
    slug: string;
    similarity_score: number;
  }>;
  duplicateLinks: string[];
}

// Normalize username for comparison
function normalizeUsername(input: string): string {
  return input
    .toLowerCase()
    .replace(/[._\-\s]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const norm1 = normalizeUsername(str1);
  const norm2 = normalizeUsername(str2);
  
  if (norm1 === norm2) return 1.0;
  
  const maxLen = Math.max(norm1.length, norm2.length);
  if (maxLen === 0) return 1.0;
  
  // Simple Levenshtein distance
  const matrix: number[][] = [];
  
  for (let i = 0; i <= norm1.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= norm2.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= norm1.length; i++) {
    for (let j = 1; j <= norm2.length; j++) {
      if (norm1[i - 1] === norm2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const distance = matrix[norm1.length][norm2.length];
  return 1 - (distance / maxLen);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Authenticate the caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Validate JWT
    const anonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const authenticatedUserId = claimsData.claims.sub as string;

    const { creator_name, platform_links, user_id }: CreatorCheckRequest = await req.json();

    if (!creator_name || !platform_links || !user_id) {
      return new Response(
        JSON.stringify({ error: 'creator_name, platform_links, and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Ensure caller can only check for themselves
    if (user_id !== authenticatedUserId) {
      return new Response(
        JSON.stringify({ error: 'Forbidden: user_id mismatch' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Checking creator: ${creator_name} with ${platform_links.length} links`);

    const flags: string[] = [];
    let riskScore = 0;
    const duplicateLinks: string[] = [];
    const similarCreators: FraudCheckResult['similarCreators'] = [];

    // 1. Check for similar creator names in database
    const { data: existingCreators } = await supabaseClient
      .from('creators')
      .select('id, name, slug, status')
      .neq('status', 'rejected');

    if (existingCreators) {
      for (const creator of existingCreators) {
        const similarity = calculateSimilarity(creator_name, creator.name);
        if (similarity >= 0.8) {
          similarCreators.push({
            id: creator.id,
            name: creator.name,
            slug: creator.slug,
            similarity_score: similarity,
          });
          
          if (similarity >= 0.95) {
            riskScore += 50;
            flags.push('nome_quasi_identico');
          } else if (similarity >= 0.85) {
            riskScore += 30;
            flags.push('nome_molto_simile');
          } else {
            riskScore += 15;
            flags.push('nome_simile');
          }
        }
      }
    }

    // 2. Check for duplicate platform links
    for (const link of platform_links) {
      const normalizedUsername = normalizeUsername(link.username);
      
      // Check for exact URL duplicate
      const { data: urlDuplicates } = await supabaseClient
        .from('platform_links')
        .select('id, url, creator_id, creators!inner(status)')
        .eq('url', link.url)
        .neq('creators.status', 'rejected');

      if (urlDuplicates && urlDuplicates.length > 0) {
        duplicateLinks.push(`URL: ${link.url}`);
        riskScore += 60;
        flags.push('link_url_duplicato');
      }

      // Check for normalized username on same platform
      const { data: existingLinks } = await supabaseClient
        .from('platform_links')
        .select('id, username, platform, creator_id, creators!inner(status)')
        .eq('platform', link.platform)
        .neq('creators.status', 'rejected');

      if (existingLinks) {
        for (const existingLink of existingLinks) {
          if (normalizeUsername(existingLink.username) === normalizedUsername) {
            duplicateLinks.push(`${link.platform}: @${link.username}`);
            riskScore += 50;
            flags.push('username_normalizzato_duplicato');
            break;
          }
        }
      }
    }

    // 3. Check user's fraud history
    const { data: userProfile } = await supabaseClient
      .from('profiles')
      .select('risk_score, is_banned')
      .eq('user_id', user_id)
      .single();

    if (userProfile) {
      if (userProfile.is_banned) {
        riskScore += 100;
        flags.push('utente_bannato');
      } else if (userProfile.risk_score && userProfile.risk_score > 50) {
        riskScore += 30;
        flags.push('utente_alto_rischio');
      } else if (userProfile.risk_score && userProfile.risk_score > 25) {
        riskScore += 15;
        flags.push('utente_rischio_medio');
      }
    }

    // 4. Check user's rejection history
    const { count: rejectedCreators } = await supabaseClient
      .from('creators')
      .select('*', { count: 'exact', head: true })
      .eq('added_by_user_id', user_id)
      .eq('status', 'rejected');

    if (rejectedCreators && rejectedCreators >= 3) {
      riskScore += 25;
      flags.push('molti_creator_rifiutati');
    }

    // 5. Check recent activity velocity
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentCreators } = await supabaseClient
      .from('creators')
      .select('*', { count: 'exact', head: true })
      .eq('added_by_user_id', user_id)
      .gte('created_at', oneHourAgo);

    if (recentCreators && recentCreators >= 5) {
      riskScore += 40;
      flags.push('troppi_creator_recenti');
    } else if (recentCreators && recentCreators >= 3) {
      riskScore += 20;
      flags.push('attivita_sospetta');
    }

    // 6. Update user risk score if high-risk activity detected
    if (riskScore >= 40 && userProfile) {
      const newRiskScore = Math.min(100, (userProfile.risk_score || 0) + Math.floor(riskScore / 10));
      await supabaseClient
        .from('profiles')
        .update({ risk_score: newRiskScore })
        .eq('user_id', user_id);
      console.log(`Updated user ${user_id} risk score to ${newRiskScore}`);
    }

    const passed = riskScore < 50;

    console.log(`Creator fraud check result: passed=${passed}, riskScore=${riskScore}, flags=${flags.join(', ')}`);

    return new Response(
      JSON.stringify({
        success: true,
        result: {
          passed,
          riskScore,
          flags,
          similarCreators,
          duplicateLinks,
          shouldBlock: riskScore >= 80,
          needsManualReview: riskScore >= 50 && riskScore < 80,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error checking creator:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
