import { encryptSecret } from '@/lib/crypto/tokens';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { googleGBP, NormalizedLocation } from '@/lib/google/client';

export async function connectBusinessGoogleAccount(params: {
  businessId: string;
  refreshToken: string;
  accessToken: string;
  expiresAt: string;
  googleEmail?: string;
}): Promise<NormalizedLocation[]> {
  const { businessId, refreshToken, accessToken, expiresAt, googleEmail } = params;

  // 1. Encrypt and store the refresh token in google_connections
  const { error: connErr } = await supabaseAdmin.from('google_connections').upsert(
    {
      business_id: businessId,
      google_email: googleEmail ?? 'owner@roastery-maadi.test',
      encrypted_refresh_token: encryptSecret(refreshToken),
      access_token: accessToken,
      token_expires_at: expiresAt,
      status: 'active',
      last_error: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'business_id' }
  );

  if (connErr) throw new Error(`Failed to store Google connection: ${connErr.message}`);

  // 2. Discover GBP locations and upsert into public.locations
  const discoveredLocations = await googleGBP.listLocations(businessId);

  for (const loc of discoveredLocations) {
    const { error: locErr } = await supabaseAdmin.from('locations').upsert(
      {
        business_id: businessId,
        google_account_id: loc.googleAccountId,
        google_location_id: loc.googleLocationId,
        display_name: loc.displayName,
        contact_phone: loc.contactPhone,
        is_polling_enabled: true,
      },
      { onConflict: 'google_account_id,google_location_id' }
    );

    if (locErr) throw new Error(`Failed to upsert location: ${locErr.message}`);
  }

  return discoveredLocations;
}