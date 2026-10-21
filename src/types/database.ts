export type BusinessPlan = 'trial' | 'starter' | 'pro' | 'agency';
export type BusinessStatus = 'active' | 'paused' | 'revoked';
export type NotificationChannel = 'email' | 'telegram' | 'whatsapp';
export type ArabicDialect = 'egyptian' | 'msa' | 'gulf' | 'levantine';
export type ReviewLanguage = 'ar' | 'en' | 'mixed' | 'none';
export type ReviewFlag = 'refund' | 'legal' | 'medical' | 'threat' | 'abuse' | 'injection_suspected';
export type DraftStatus =
  | 'pending'
  | 'posting'
  | 'approved'
  | 'edited'
  | 'skipped'
  | 'posted'
  | 'failed'
  | 'expired';

export interface BusinessRow {
  id: string;
  owner_id: string;
  name: string;
  plan: BusinessPlan;
  status: BusinessStatus;
  trial_ends_at: string;
  notification_channel: NotificationChannel;
  notification_target: string | null;
  created_at: string;
  updated_at: string;
}

export interface LocationRow {
  id: string;
  business_id: string;
  google_account_id: string;
  google_location_id: string;
  display_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  signature_override?: string | null;
  is_polling_enabled: boolean;
  last_polled_at: string | null;
  last_review_update_time: string | null;
  poll_lock_until: string | null;
  poll_lock_token: string | null;
  created_at: string;
}

export interface BrandProfileRow {
  business_id: string;
  tone: string;
  languages: string[];
  arabic_dialect: ArabicDialect;
  signature: string | null;
  do_list: string[];
  dont_list: string[];
  example_replies: string[];
  updated_at: string;
}

export interface ReviewRow {
  id: string;
  business_id: string;
  location_id: string;
  google_review_id: string;
  rating: number;
  reviewer_name: string | null;
  text: string | null;
  language: ReviewLanguage | null;
  flags: ReviewFlag[];
  requires_careful_review: boolean;
  google_created_at: string | null;
  google_updated_at: string | null;
  created_at: string;
}

export interface DraftRow {
  id: string;
  business_id: string;
  review_id: string;
  body: string;
  status: DraftStatus;
  final_body: string | null;
  approval_token_hash: string | null;
  token_expires_at: string | null;
  expires_at: string;
  last_renewed_at: string | null;
  renewal_count: number;
  decided_at: string | null;
  posted_at: string | null;
  last_error: string | null;
  attempts: number;
  posting_started_at: string | null;
  next_retry_at: string | null;
  google_reply_posted_at: string | null;
  model: string;
  prompt_version: string;
  created_at: string;
}