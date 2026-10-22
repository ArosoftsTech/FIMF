// Edge Function Supabase : activation d'un compte membre approuvé.
// Déclenchement : trigger pg_net (UPDATE member_requests → status 'approuvée') → POST ici.
// Actions :
//   1. Crée le compte auth.users (mot de passe aléatoire, jamais communiqué).
//   2. Génère un lien sécurisé « définir mon mot de passe » et l'envoie via Resend.
//   3. Lie la demande au compte (auth_user_id, activated_at).
//
// Aucun mot de passe n'est stocké en base : la colonne member_requests.password
// a été supprimée (voir supabase/security-hardening.sql). Le membre choisit son
// mot de passe via le lien reçu, qui expire.
//
// Secrets : RESEND_API_KEY, WEBHOOK_SECRET, + injectés : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
// Optionnels : RESEND_FROM, SITE_URL.
// Déploiement : SBP=<token> node supabase/deploy-function.mjs member-activate
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FROM = Deno.env.get('RESEND_FROM') ?? 'FIMF Adhésions <notifications@fimf.ci>';

/** Échappe les valeurs saisies par le public avant injection dans l'email HTML. */
function esc(value: unknown): string {
  return String(value ?? '').replace(/[&<>"'`]/g, (c) => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return '&#96;';
    }
  });
}

interface WebhookPayload {
  type: string;
  record: {
    id: number;
    full_name: string;
    email: string;
    status: string;
    auth_user_id: string | null;
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Fail-closed : cette fonction crée des comptes, elle ne doit jamais être
  // invocable sans secret partagé.
  const secret = Deno.env.get('WEBHOOK_SECRET');
  if (!secret) {
    console.error('WEBHOOK_SECRET non configuré : appel refusé');
    return new Response(JSON.stringify({ error: 'webhook secret not configured' }), { status: 503 });
  }
  if (req.headers.get('x-webhook-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const payload: WebhookPayload = await req.json();
    if (payload.type !== 'UPDATE') {
      return new Response('Ignored', { status: 200 });
    }
    const r = payload.record;

    if (r.status !== 'approuvée' || r.auth_user_id) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), { status: 200 });
    }

    // 1. Création du compte (service_role, bypass RLS + GoTrue).
    //    Le mot de passe est aléatoire et n'est jamais transmis : le membre
    //    définit le sien via le lien de récupération ci-dessous.
    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const randomPassword = `${crypto.randomUUID()}-${crypto.randomUUID()}`;

    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: r.email,
      password: randomPassword,
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

    // 2. Lien « définir mon mot de passe » (récupération Supabase, usage unique)
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://fimf.ci';
    let actionLink: string | null = null;
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email: r.email,
      options: { redirectTo: siteUrl },
    });
    if (linkErr) {
      console.error('generateLink:', linkErr.code ?? '', linkErr.message);
    } else {
      actionLink = linkData?.properties?.action_link ?? null;
    }

    // 3. Email de bienvenue
    const fullName = esc(r.full_name);
    const email = esc(r.email);
    const cta = actionLink
      ? `<div style="margin-top:20px">
           <a href="${esc(actionLink)}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:bold;font-size:13px">Définir mon mot de passe</a>
         </div>
         <p style="margin-top:12px;color:#64748b;font-size:12px">Ce lien personnel expire rapidement. Si besoin, demandez-en un nouveau à la FIMF.</p>`
      : `<p style="margin-top:16px">Contactez la FIMF à <a href="mailto:fimf.infos@gmail.com">fimf.infos@gmail.com</a> pour recevoir votre lien de connexion.</p>`;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#004724;color:#fff;padding:20px 24px">
          <h1 style="margin:0;font-size:18px">⚽ Bienvenue à la FIMF !</h1>
          <p style="margin:4px 0 0;color:#a7f3d0;font-size:13px">Fédération Ivoirienne de Mini-Football</p>
        </div>
        <div style="padding:24px;color:#0f172a;font-size:14px;line-height:1.7">
          <p>Bonjour <b>${fullName}</b>,</p>
          <p>Votre demande d'adhésion a été <b style="color:#059669">approuvée</b> 🎉 Votre compte membre est dès à présent actif :</p>
          <table style="width:100%;border-collapse:collapse;margin:12px 0">
            <tr><td style="padding:8px 12px;background:#f8fafc;border-radius:8px 0 0 8px;color:#64748b;font-weight:bold;width:130px">Identifiant</td><td style="padding:8px 12px;background:#f8fafc;border-radius:0 8px 8px 0"><b>${email}</b></td></tr>
            <tr><td style="padding:8px 12px;color:#64748b;font-weight:bold">Mot de passe</td><td>à définir via le bouton ci-dessous</td></tr>
          </table>
          ${cta}
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
        subject: '⚽ Bienvenue à la FIMF — activez votre compte membre',
        html,
      }),
    });
    if (!resendRes.ok) {
      console.error('Resend error:', resendRes.status, await resendRes.text());
      // Le compte est créé : on n'échoue pas pour autant, mais on le signale
    }

    // 4. Liaison du compte à la demande (aucun secret stocké)
    const { error: updateErr } = await admin
      .from('member_requests')
      .update({ auth_user_id: userId, activated_at: new Date().toISOString() })
      .eq('id', r.id);
    if (updateErr) throw new Error(`update member_requests: ${updateErr.message}`);

    return new Response(JSON.stringify({ ok: true, userId, linkSent: Boolean(actionLink) }), {
      status: 200,
    });
  } catch (e) {
    console.error('member-activate:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
