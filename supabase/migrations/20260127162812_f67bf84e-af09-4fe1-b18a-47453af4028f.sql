-- Grant permissions on creators table to authenticated users
GRANT SELECT, INSERT ON public.creators TO authenticated;
GRANT SELECT ON public.creators TO anon;

-- Also ensure platform_links and wallet_transactions have proper grants
GRANT SELECT, INSERT ON public.platform_links TO authenticated;
GRANT SELECT ON public.platform_links TO anon;

GRANT SELECT, INSERT ON public.wallet_transactions TO authenticated;