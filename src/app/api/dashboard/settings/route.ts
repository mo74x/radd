/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { pollAllActiveLocations } from '@/lib/google/ingestor';
import {
  disconnectGoogleAccount,
  disconnectAndDeleteAllData,
} from '@/lib/google/lifecycle';

const UpdateSettingsSchema = z.object({
  businessId: z.string().uuid(),
  businessName: z.string().min(2),
  notificationChannel: z.enum(['email', 'telegram', 'whatsapp']),
  notificationTarget: z.string().min(2),
  contactPhone: z.string().optional(),
  tone: z.string().min(3),
  arabicDialect: z.enum(['egyptian', 'msa', 'gulf', 'levantine']),
  signature: z.string().min(1),
  doList: z.array(z.string()),
  dontList: z.array(z.string()),
  exampleReplies: z.array(z.string()),
});

export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get('businessId');

  // Load either the requested business or the most recent active business
  const query = supabaseAdmin
    .from('businesses')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (businessId) {
    query.eq('id', businessId);
  }

  const { data: business, error: bizErr } = await query.maybeSingle();
  if (bizErr || !business) {
    return NextResponse.json({ error: 'No business found' }, { status: 404 });
  }

  const [brandRes, locRes, connRes] = await Promise.all([
    supabaseAdmin
      .from('brand_profiles')
      .select('*')
      .eq('business_id', business.id)
      .maybeSingle(),
    supabaseAdmin
      .from('locations')
      .select('*')
      .eq('business_id', business.id)
      .order('created_at', { ascending: true }),
    supabaseAdmin
      .from('google_connections')
      .select('status, google_email, updated_at, last_error')
      .eq('business_id', business.id)
      .maybeSingle(),
  ]);

  return NextResponse.json({
    business,
    brand: brandRes.data,
    locations: locRes.data ?? [],
    googleConnection: connRes.data,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support one-click manual poll from the dashboard
    if (body.action === 'poll_now') {
      const summary = await pollAllActiveLocations(10);
      return NextResponse.json({ ok: true, summary });
    }

    // Gracefully disconnect Google Account
    if (body.action === 'disconnect_google') {
      const bizId = body.businessId;
      if (!bizId) {
        return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
      }
      const result = await disconnectGoogleAccount(bizId);
      return NextResponse.json({ ok: true, result });
    }

    // Clean Disconnect & Delete Data flow complying with Google API & GDPR privacy standards
    if (body.action === 'disconnect_and_delete_data') {
      const bizId = body.businessId;
      if (!bizId) {
        return NextResponse.json({ error: 'Missing businessId' }, { status: 400 });
      }
      const result = await disconnectAndDeleteAllData(bizId);
      return NextResponse.json({ ok: true, result });
    }

    const parsed = UpdateSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid settings payload', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const now = new Date().toISOString();

    // 1. Update business notification settings
    const { error: bizErr } = await supabaseAdmin
      .from('businesses')
      .update({
        name: data.businessName,
        notification_channel: data.notificationChannel,
        notification_target: data.notificationTarget,
        updated_at: now,
      })
      .eq('id', data.businessId);

    if (bizErr) throw new Error(bizErr.message);

    // 2. Upsert brand profile
    const { error: brandErr } = await supabaseAdmin
      .from('brand_profiles')
      .upsert({
        business_id: data.businessId,
        tone: data.tone,
        arabic_dialect: data.arabicDialect,
        signature: data.signature,
        do_list: data.doList,
        dont_list: data.dontList,
        example_replies: data.exampleReplies,
        updated_at: now,
      });

    if (brandErr) throw new Error(brandErr.message);

    // 3. Update primary contact phone on locations for complaint routing
    if (data.contactPhone !== undefined) {
      await supabaseAdmin
        .from('locations')
        .update({ contact_phone: data.contactPhone || null })
        .eq('business_id', data.businessId);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}