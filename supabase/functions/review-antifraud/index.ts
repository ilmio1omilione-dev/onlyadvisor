import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewData {
  id: string;
  user_id: string;
  creator_id: string;
  title: string;
  content: string;
  rating: number;
  platform: string;
  pros: string[];
  cons: string[];
}

interface FraudCheckResult {
  passed: boolean;
  riskScore: number;
  flags: string[];
  autoApprove: boolean;
}

// Spam keywords and patterns
const SPAM_PATTERNS = [
  /(.)\1{4,}/i, // Repeated characters (aaaaaaa)
  /https?:\/\//i, // URLs
  /\b(spam|fake|test|asdf)\b/i, // Common spam words
  /[A-Z]{10,}/, // All caps strings
];

const LOW_QUALITY_PATTERNS = [
  /^.{1,15}$/, // Too short content
  /^(.{1,3}\s*){5,}$/, // Repeated short words
];

// Suspicious review patterns
const SUSPICIOUS_PATTERNS = [
  /compra ora|buy now|click here/i,
  /guadagna soldi|make money/i,
  /contattami su|contact me on/i,
  /telegram|whatsapp/i,
];

function calculateRiskScore(review: ReviewData, userReviewCount: number, recentReviewCount: number): FraudCheckResult {
  const flags: string[] = [];
  let riskScore = 0;

  // Check content length
  if (review.content.length < 30) {
    riskScore += 20;
    flags.push('contenuto_troppo_corto');
  }

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(review.content) || pattern.test(review.title)) {
      riskScore += 25;
      flags.push('pattern_spam_rilevato');
      break;
    }
  }

  // Check for low quality patterns
  for (const pattern of LOW_QUALITY_PATTERNS) {
    if (pattern.test(review.content)) {
      riskScore += 15;
      flags.push('contenuto_bassa_qualita');
      break;
    }
  }

  // Check for suspicious patterns
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(review.content)) {
      riskScore += 30;
      flags.push('contenuto_sospetto');
      break;
    }
  }

  // Check review velocity - too many reviews from same user recently
  if (recentReviewCount >= 5) {
    riskScore += 40;
    flags.push('troppe_review_recenti');
  } else if (recentReviewCount >= 3) {
    riskScore += 15;
    flags.push('review_frequenti');
  }

  // New user with extreme rating
  if (userReviewCount === 0 && (review.rating === 5 || review.rating === 1)) {
    riskScore += 10;
    flags.push('nuovo_utente_rating_estremo');
  }

  // Only positive or only negative (suspicious if generic)
  if (review.pros.length >= 3 && review.cons.length === 0 && review.rating === 5) {
    const genericPros = review.pros.filter(p => p.length < 10).length;
    if (genericPros >= 2) {
      riskScore += 15;
      flags.push('pro_troppo_generici');
    }
  }

  // Content seems AI-generated or copy-pasted (check for unnatural patterns)
  const wordCount = review.content.split(/\s+/).length;
  const avgWordLength = review.content.replace(/\s+/g, '').length / wordCount;
  if (avgWordLength > 12) {
    riskScore += 10;
    flags.push('linguaggio_non_naturale');
  }

  // Determine if should auto-approve
  const passed = riskScore < 30;
  const autoApprove = riskScore < 15 && userReviewCount >= 2;

  return {
    passed,
    riskScore,
    flags,
    autoApprove,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { review_id } = await req.json();

    if (!review_id) {
      return new Response(
        JSON.stringify({ error: 'review_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing review: ${review_id}`);

    // Fetch the review
    const { data: review, error: reviewError } = await supabaseClient
      .from('reviews')
      .select('*')
      .eq('id', review_id)
      .single();

    if (reviewError || !review) {
      console.error('Error fetching review:', reviewError);
      return new Response(
        JSON.stringify({ error: 'Review not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user's review history
    const { count: totalUserReviews } = await supabaseClient
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', review.user_id)
      .eq('status', 'approved');

    // Get recent reviews from user (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentReviews } = await supabaseClient
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', review.user_id)
      .gte('created_at', oneDayAgo);

    // Run fraud check
    const result = calculateRiskScore(
      review as ReviewData,
      totalUserReviews || 0,
      (recentReviews || 1) - 1 // Exclude current review
    );

    console.log(`Fraud check result for ${review_id}:`, result);

    // Update user's risk score if needed
    if (result.riskScore >= 30) {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('risk_score')
        .eq('user_id', review.user_id)
        .single();

      if (profile) {
        const newRiskScore = Math.min(100, (profile.risk_score || 0) + Math.floor(result.riskScore / 5));
        await supabaseClient
          .from('profiles')
          .update({ risk_score: newRiskScore })
          .eq('user_id', review.user_id);
      }
    }

    // Auto-approve if passed all checks
    if (result.autoApprove) {
      console.log(`Auto-approving review ${review_id}`);
      
      await supabaseClient
        .from('reviews')
        .update({ status: 'approved' })
        .eq('id', review_id);

      // Approve the reward transaction
      await supabaseClient
        .from('wallet_transactions')
        .update({ status: 'approved', processed_at: new Date().toISOString() })
        .eq('reference_id', review_id)
        .eq('reference_type', 'review')
        .eq('transaction_type', 'review_reward');

      // Update user balance
      const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('pending_balance, available_balance')
        .eq('user_id', review.user_id)
        .single();

      if (profileData) {
        await supabaseClient
          .from('profiles')
          .update({
            pending_balance: Math.max(0, Number(profileData.pending_balance) - 0.20),
            available_balance: Number(profileData.available_balance) + 0.20,
          })
          .eq('user_id', review.user_id);
      }
    } else if (!result.passed) {
      // Reject if high risk score
      console.log(`Auto-rejecting review ${review_id} - risk score: ${result.riskScore}`);
      
      await supabaseClient
        .from('reviews')
        .update({ status: 'rejected' })
        .eq('id', review_id);

      // Reject the reward transaction
      await supabaseClient
        .from('wallet_transactions')
        .update({ status: 'rejected', processed_at: new Date().toISOString() })
        .eq('reference_id', review_id)
        .eq('reference_type', 'review')
        .eq('transaction_type', 'review_reward');

      // Remove from pending balance
      const { data: profileData } = await supabaseClient
        .from('profiles')
        .select('pending_balance')
        .eq('user_id', review.user_id)
        .single();

      if (profileData) {
        await supabaseClient
          .from('profiles')
          .update({
            pending_balance: Math.max(0, Number(profileData.pending_balance) - 0.20),
          })
          .eq('user_id', review.user_id);
      }
    }
    // If passed but not auto-approved, leave for manual review

    return new Response(
      JSON.stringify({
        success: true,
        result: {
          passed: result.passed,
          riskScore: result.riskScore,
          flags: result.flags,
          autoApproved: result.autoApprove,
          autoRejected: !result.passed,
          needsManualReview: result.passed && !result.autoApprove,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error processing review:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
