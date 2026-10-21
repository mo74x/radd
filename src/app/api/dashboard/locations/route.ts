import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { z } from 'zod';

const UpdateLocationSchema = z.object({
  locationId: z.string().uuid(),
  contactPhone: z.string().nullable().optional(),
  signatureOverride: z.string().nullable().optional(),
  isPollingEnabled: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get('businessId');

    let query = supabaseAdmin
      .from('locations')
      .select('*, reviews (count)')
      .order('display_name', { ascending: true });

    if (businessId) {
      query = query.eq('business_id', businessId);
    }

    const { data: locations, error } = await query;
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ locations: locations ?? [] });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = UpdateLocationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid payload', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { locationId, contactPhone, signatureOverride, isPollingEnabled } = parsed.data;

    const updates: Record<string, string | boolean | null> = {};
    if (contactPhone !== undefined) {
      updates.contact_phone = contactPhone ? contactPhone.trim() : null;
    }
    if (signatureOverride !== undefined) {
      updates.signature_override = signatureOverride ? signatureOverride.trim() : null;
    }
    if (isPollingEnabled !== undefined) {
      updates.is_polling_enabled = isPollingEnabled;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields provided to update' }, { status: 400 });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('locations')
      .update(updates)
      .eq('id', locationId)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, location: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
