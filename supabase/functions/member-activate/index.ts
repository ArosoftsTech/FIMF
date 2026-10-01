// Edge Function Supabase : activation d'un compte membre approuvé.
// Déclenchement : trigger pg_net (UPDATE member_requests → status 'approuvée') → POST ici.
// Actions :
//   1. Crée le compte auth.users (email + mot de passe choisi) via l'API admin service_role.
//   2. Envoie l'email de bienvenue via Resend.
//   3. Purge le mot de passe stocké et lie la demande au compte (auth_user_id, activated_at).
// Secrets : RESEND_API_KEY, WEBHOOK_SECRET, + injectés : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Optionnels : RESEND_FROM, SITE_URL.
// Déploiement : SBP=<token> node supabase/deploy-function.mjs member-activate
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FROM = Deno.env.get('RESEND_FROM') ?? 'FIMF Adhésions <notifications@fimf.ci>';

interface WebhookPayload {
  type: string;
  record: {
    id: number;
    full_name: string;
    email: string;
    password: string | null;
    status: string;
    auth_user_id: string | null;
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (secret && req.headers.get('x-webhook-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload: WebhookPayload = await req.json();
    if (payload.type !== 'UPDATE') {
      return new Response('Ignored', { status: 200 });
    }
    const r = payload.record;

    if (r.status !== 'approuvée' || !r.password || r.auth_user_id) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
    }

    // 1. Création du compte (service_role, bypass RLS + GoTrue)
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: r.email,
      password: r.password,
      email_confirm: true,
      user_metadata: { full_name: r.full_name, member_request_id: r.id },
    });

    let userId = created?.user?.id ?? null;
    if (createErr) {
      const msg = (createErr.message ?? '').toLowerCase();
      if (!msg.includes('already') && createErr.code !== 'email_exists') {
        throw new Error(`createUser: ${createErr.code ?? ''} ${createErr.message}`);
      }
      // Compte déjà existant (nouvelle tentative) : on retrouve son id pour la liaison
      console.log('Compte déjà existant pour', r.email);
      const { data: list } = await admin.auth.admin.listUsers({ perPage: 500 });
      userId = list?.users?.find((u) => u.email?.toLowerCase() === r.email.toLowerCase())?.id ?? null;
    }

    // 2. Email de bienvenue
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://fimf.ci';
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#004724;color:#fff;padding:20px 24px">
          <h1 style="margin:0;font-size:18px">⚽ Bienvenue à la FIMF !</h1>
          <p style="margin:4px 0 0;color:#a7f3d0;font-size:13px">Fédération Ivoirienne de Mini-Football</p>
        </div>
        <div style="padding:24px;color:#0f172a;font-size:14px;line-height:1.7">
          <p>Bonjour <b>${r.full_name}</b>,</p>
          <p>Votre demande d'adhésion a été <b style="color:#059669">approuvée</b> 🎉 Votre compte membre est dès à présent actif :</p>
          <table style="width:100%;border-collapse:collapse;margin:12px 0">
            <tr><td style="padding:8px 12px;background:#f8fafc;border-radius:8px 0 0 8px;color:#64748b;font-weight:bold;width:130px">Identifiant</td><td style="padding:8px 12px;background:#f8fafc;border-radius:0 8px 8px 0"><b>${r.email}</b></td></tr>
            <tr><td style="padding:8px 12px;color:#64748b;font-weight:bold">Mot de passe</td><td>celui que vous avez choisi lors de votre inscription</td></tr>
          </table>
          <p>Connectez-vous via le bouton <b>CONNEXION</b> du site pour profiter de vos avantages membres, de la billetterie et des contenus réservés.</p>
          <div style="margin-top:20px">
            <a href="${siteUrl}/" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:bold;font-size:13px">Se connecter au site FIMF</a>
          </div>
          <p style="margin-top:24px;color:#64748b;font-size:12px">À très bientôt dans nos stades,<br/>La Fédération Ivoirienne de Mini-Football</p>
        </div>
      </div>`;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: [r.email],
        subject: '⚽ Bienvenue à la FIMF — votre compte membre est actif',
        html,
      }),
    });
    if (!resendRes.ok) {
      console.error('Resend error:', resendRes.status, await resendRes.text());
      // Le compte est créé : on n'échoue pas pour autant, mais on le signale
    }

    // 3. Purge du mot de passe + liaison du compte
    const { error: updateErr } = await admin
      .from('member_requests')
      .update({ password: null, auth_user_id: userId, activated_at: new Date().toISOString() })
      .eq('id', r.id);
    if (updateErr) throw new Error(`update member_requests: ${updateErr.message}`);

    return new Response(JSON.stringify({ ok: true, userId }), { status: 200 });
  } catch (e) {
    console.error('member-activate:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
