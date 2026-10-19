import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

import { encryptSecret, decryptSecret, generateApprovalToken } from '../src/lib/crypto/tokens';
import { supabaseAdmin } from '../src/lib/supabase/admin'

async function main() {
  console.log('1. Testing AES-256-GCM encryption...');
  const sampleToken = '1//0gSampleGoogleRefreshToken_xyz987';
  const encrypted = encryptSecret(sampleToken);
  const decrypted = decryptSecret(encrypted);
  if (decrypted !== sampleToken) throw new Error('Encryption roundtrip failed!');
  console.log('   OK: Token encrypted & decrypted cleanly.');

  console.log('2. Testing SHA-256 magic link token generation...');
  const { rawToken, tokenHash, expiresAt } = generateApprovalToken(72);
  console.log(`   OK: Raw token (${rawToken.slice(0, 10)}...) -> Hash (${tokenHash.slice(0, 12)}...), expires ${expiresAt}`);

  console.log('3. Creating or fetching test owner in Supabase Auth...');
  const testEmail = 'owner@roastery-maadi.test';
  const { data: usersList, error: listErr } = await supabaseAdmin.auth.admin.listUsers();
  if (listErr) throw listErr;

  let owner = usersList.users.find((u) => u.email === testEmail);
  if (!owner) {
    const { data: createdUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: 'TestPassword123!',
      email_confirm: true,
    });
    if (createErr) throw createErr;
    owner = createdUser.user;
  }
  console.log(`   OK: Test Owner ID = ${owner.id}`);

  console.log('4. Seeding test business & Egyptian brand profile...');
  const { data: business, error: bizErr } = await supabaseAdmin
    .from('businesses')
    .upsert(
      {
        owner_id: owner.id,
        name: 'Roastery & Co. Café',
        plan: 'trial',
        status: 'active',
        notification_channel: 'email',
        notification_target: testEmail,
      },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (bizErr) throw bizErr;

  const { error: brandErr } = await supabaseAdmin.from('brand_profiles').upsert({
    business_id: business.id,
    tone: 'ودود، محترم، وباللهجة المصرية الطبيعية بدون مبالغة (Warm, polite Egyptian hospitality)',
    languages: ['ar', 'en'],
    arabic_dialect: 'egyptian',
    signature: 'فريق Roastery & Co.',
    do_list: [
      'اشكر العميل باسمه لو الاسم واضح',
      'خلي الرد قصير وطبيعي (سطرين أو تلاتة بالكتير)',
    ],
    dont_list: [
      'ممنوع تماماً الوعد بخصومات أو استرجاع فلوس أو مشروبات مجانية',
      'ممنوع الرد بأسلوب آلي أو فصحى ثقيلة لو الريفيو بالعامية المصرية',
    ],
    example_replies: [
      'نورتنا يا أستاذ أحمد! مبسوطين جداً إن السبانيش لاتيه عجبك، ومستنيينك تنورنا تاني قريب. - فريق Roastery & Co.',
      'أهلاً بيكِ يا أستاذة مريم، حقك علينا في أي تأخير حصل وقت الزحمة. ياريت تتواصلي معانا على الرقم ده عشان نعرف تفاصيل أكتر ونهتم بالموضوع فوراً. - فريق Roastery & Co.',
    ],
  });

  if (brandErr) throw brandErr;

  console.log('\nFOUNDATION VERIFIED SUCCESSFULLY!');
  console.log(`Use this TEST_BUSINESS_ID for Part 2: ${business.id}`);
}

main().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});