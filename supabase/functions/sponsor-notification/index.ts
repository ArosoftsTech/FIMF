// Edge Function Supabase : notification email d'une nouvelle demande de sponsoring.
// Déclenchement : Database Webhook (INSERT sur public.sponsor_requests) → POST vers cette fonction.
// Clé requise : RESEND_API_KEY (Supabase Dashboard → Edge Functions → Secrets)
// Déploiement : supabase functions deploy sponsor-notification
//   ou : SBP=<token> node supabase/deploy-function.mjs sponsor-notification
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Défauts : boîte partenaires + domaine fimf.ci (exige la vérification du domaine dans Resend).
// Secrets optionnels (Dashboard → Edge Functions → Secrets) :
//   RESEND_FROM=FIMF Partenariats <onboarding@resend.dev>  → test sans domaine vérifié
//   PARTNER_INBOX=reuvenethank3@gmail.com                  → test (compte Resend limité au propriétaire)
//   WEBHOOK_SECRET=<valeur>                                → authentification du Database Webhook
const PARTNER_INBOX = Deno.env.get('PARTNER_INBOX') ?? 'partenaires@fimf.ci';
const FROM = Deno.env.get('RESEND_FROM') ?? 'FIMF Partenariats <notifications@fimf.ci>';

interface WebhookPayload {
  type: string;
  record: {
    id: number;
    company: string;
    contact_name: string;
    email: string;
    phone: string | null;
    pack: string;
    message: string | null;
  };
}

const PACK_LABELS: Record<string, string> = {
  platinum: 'Platinum',
  gold: 'Gold',
  silver: 'Silver',
  custom: 'Autre / à définir',
};

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
    if (payload.type !== 'INSERT') {
      return new Response('Ignored', { status: 200 });
    }
    const r = payload.record;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#004724;color:#fff;padding:20px 24px">
          <h1 style="margin:0;font-size:18px">⚽ Nouvelle demande de sponsoring</h1>
          <p style="margin:4px 0 0;color:#a7f3d0;font-size:13px">Fédération Ivoirienne de Mini-Football</p>
        </div>
        <div style="padding:24px;color:#0f172a;font-size:14px;line-height:1.6">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#64748b;font-weight:bold;width:140px">Entreprise</td><td><b>${r.company}</b></td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-weight:bold">Contact</td><td>${r.contact_name}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-weight:bold">Email</td><td><a href="mailto:${r.email}">${r.email}</a></td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-weight:bold">Téléphone</td><td>${r.phone ?? '—'}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-weight:bold">Formule</td><td>${PACK_LABELS[r.pack] ?? r.pack}</td></tr>
          </table>
          ${r.message ? `<div style="margin-top:14px;padding:12px;background:#f8fafc;border-left:3px solid #ea580c;border-radius:6px"><i>« ${r.message} »</i></div>` : ''}
          <div style="margin-top:20px">
            <a href="${Deno.env.get('SITE_URL') ?? 'https://fimf.ci'}/#/admin" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:bold;font-size:13px">Traiter dans la console admin</a>
          </div>
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
        to: [PARTNER_INBOX],
        reply_to: r.email,
        subject: `⚽ Nouvelle demande de sponsoring — ${r.company} (${PACK_LABELS[r.pack] ?? r.pack})`,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errText = await resendRes.text();
      console.error('Resend error:', resendRes.status, errText);
      return new Response(JSON.stringify({ error: errText }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error('sponsor-notification:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
