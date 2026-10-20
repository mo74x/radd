/* eslint-disable @typescript-eslint/no-explicit-any */
import 'server-only';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendReconnectionNotification } from '@/lib/notifications/dispatcher';
import { BusinessRow } from '@/types/database';

export interface RevocationDetails {
  businessId: string;
  reason: string;
  errorCode?: string | number;
}

export interface DisconnectResult {
  success: boolean;
  businessId: string;
  deletedReviewsCount?: number;
  deletedDraftsCount?: number;
  message: string;
}

/**
 * Handles Google OAuth revocation or token expiry.
 * Atomically updates connection and business status to 'revoked',
 * disables location polling, and dispatches exactly one owner notification.
 */
export async function handleGoogleRevocation(details: RevocationDetails): Promise<boolean> {
  const { businessId, reason, errorCode } = details;
  const now = new Date().toISOString();
  const formattedReason = errorCode ? `[${errorCode}] ${reason}` : reason;

  // 1. Atomic status transition: only succeeds if NOT already 'revoked'
  const { data: transitionedConn, error: connErr } = await supabaseAdmin
    .from('google_connections')
    .update({
      status: 'revoked',
      last_error: formattedReason,
      access_token: null, // Clear transient access token
      updated_at: now,
    })
    .eq('business_id', businessId)
    .neq('status', 'revoked')
    .select('id, business_id')
    .maybeSingle();

  if (connErr) {
    console.error(`[Revocation Handler] Error updating google_connections for ${businessId}:`, connErr.message);
  }

  // 2. Disable polling across all locations for this business
  const { error: locErr } = await supabaseAdmin
    .from('locations')
    .update({ is_polling_enabled: false })
    .eq('business_id', businessId);

  if (locErr) {
    console.error(`[Revocation Handler] Error disabling location polling for ${businessId}:`, locErr.message);
  }

  // 3. Mark business status as revoked
  await supabaseAdmin
    .from('businesses')
    .update({ status: 'revoked', updated_at: now })
    .eq('id', businessId);

  // 4. Trigger exactly ONE reconnection notification if this was the initial revocation transition
  const isInitialTransition = Boolean(transitionedConn?.id);
  if (isInitialTransition) {
    try {
      const { data: business } = await supabaseAdmin
        .from('businesses')
        .select('*')
        .eq('id', businessId)
        .single<BusinessRow>();

      if (business) {
        await sendReconnectionNotification({
          business,
          reason: formattedReason,
        });
      }
    } catch (notifErr: any) {
      console.error(`[Revocation Handler] Failed sending reconnection notification:`, notifErr.message);
    }
  }

  return isInitialTransition;
}

/**
 * Disconnects the Google connection and disables polling without deleting historical reviews.
 */
export async function disconnectGoogleAccount(businessId: string): Promise<DisconnectResult> {
  const now = new Date().toISOString();

  // Revoke token with Google if live
  await attemptGoogleTokenRevoke(businessId);

  // Mark connection revoked and clear cached tokens
  await supabaseAdmin
    .from('google_connections')
    .update({
      status: 'revoked',
      access_token: null,
      last_error: 'Disconnected by owner via settings',
      updated_at: now,
    })
    .eq('business_id', businessId);

  // Disable location polling
  await supabaseAdmin
    .from('locations')
    .update({ is_polling_enabled: false })
    .eq('business_id', businessId);

  await supabaseAdmin
    .from('businesses')
    .update({ status: 'revoked', updated_at: now })
    .eq('id', businessId);

  return {
    success: true,
    businessId,
    message: 'Google account disconnected successfully and background polling paused.',
  };
}

/**
 * Clean "Disconnect & Delete Data" flow complying with GDPR and Google User Data Privacy Standards.
 * Permanently removes OAuth tokens, locations, drafts, and reviews.
 */
export async function disconnectAndDeleteAllData(businessId: string): Promise<DisconnectResult> {
  const now = new Date().toISOString();

  // 1. Attempt token revocation at Google endpoint
  await attemptGoogleTokenRevoke(businessId);

  // 2. Count existing records before deletion
  const [draftsRes, reviewsRes] = await Promise.all([
    supabaseAdmin.from('drafts').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
    supabaseAdmin.from('reviews').select('id', { count: 'exact', head: true }).eq('business_id', businessId),
  ]);

  const deletedDraftsCount = draftsRes.count ?? 0;
  const deletedReviewsCount = reviewsRes.count ?? 0;

  // 3. Atomically purge customer & draft data
  await supabaseAdmin.from('drafts').delete().eq('business_id', businessId);
  await supabaseAdmin.from('reviews').delete().eq('business_id', businessId);
  await supabaseAdmin.from('locations').delete().eq('business_id', businessId);
  await supabaseAdmin.from('brand_profiles').delete().eq('business_id', businessId);

  // 4. Remove stored encrypted credentials
  await supabaseAdmin.from('google_connections').delete().eq('business_id', businessId);

  // 5. Update business status to revoked
  await supabaseAdmin
    .from('businesses')
    .update({
      status: 'revoked',
      notification_target: null,
      updated_at: now,
    })
    .eq('id', businessId);

  return {
    success: true,
    businessId,
    deletedDraftsCount,
    deletedReviewsCount,
    message: 'All synced Google data, drafts, locations, and OAuth tokens permanently deleted.',
  };
}

/**
 * Best-effort token revocation with Google OAuth2 revoke endpoint
 */
async function attemptGoogleTokenRevoke(businessId: string): Promise<void> {
  if (process.env.GOOGLE_API_MODE !== 'live') return;

  try {
    const { data: conn } = await supabaseAdmin
      .from('google_connections')
      .select('encrypted_refresh_token')
      .eq('business_id', businessId)
      .maybeSingle();

    if (!conn?.encrypted_refresh_token) return;

    const { decryptSecret } = await import('@/lib/crypto/tokens');
    const refreshToken = decryptSecret(conn.encrypted_refresh_token);

    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refreshToken)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  } catch (err: any) {
    console.warn(`[Google Revoke] Best-effort token revocation failed for ${businessId}:`, err.message);
  }
}
