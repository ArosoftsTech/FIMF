// Edge Function Supabase : notification email d'une nouvelle demande d'adhésion.
// Déclenchement : trigger pg_net (INSERT sur public.member_requests) → POST vers cette fonction.
// Secrets requis : RESEND_API_KEY. Optionnels : MEMBER_INBOX (destinataire), RESEND_FROM, WEBHOOK_SECRET.
// Déploiement : SBP=<token> node supabase/deploy-function.mjs member-notification
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Défauts : boîte fédérale + domaine fimf.ci (exige la vérification du domaine dans Resend).
// Mode test actif : secrets MEMBER_INBOX / RESEND_FROM (mêmes valeurs que sponsor-notification).
const MEMBER_INBOX = Deno.env.get('MEMBER_INBOX') ?? 'partenaires@fimf.ci';
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
  };
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Fail-closed : sans secret configuré, la fonction refuse tout appel
  // (sinon n'importe qui pourrait déclencher des emails via Resend).
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
    if (payload.type !== 'INSERT') {
      return new Response('Ignored', { status: 200 });
    }
    const r = payload.record;
    const fullName = esc(r.full_name);
    const email = esc(r.email);

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#004724;color:#fff;padding:20px 24px">
          <h1 style="margin:0;font-size:18px">👥 Nouvelle demande d'adhésion</h1>
          <p style="margin:4px 0 0;color:#a7f3d0;font-size:13px">Fédération Ivoirienne de Mini-Football</p>
        </div>
        <div style="padding:24px;color:#0f172a;font-size:14px;line-height:1.6">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#64748b;font-weight:bold;width:140px">Nom</td><td><b>${fullName}</b></td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-weight:bold">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
          </table>
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
        to: [MEMBER_INBOX],
        reply_to: r.email,
        subject: `👥 Nouvelle demande d'adhésion — ${String(r.full_name ?? '').replace(/\s+/g, ' ').trim()}`,
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
    console.error('member-notification:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
