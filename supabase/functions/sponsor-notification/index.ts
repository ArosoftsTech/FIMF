// Edge Function Supabase : emails automatiques du module sponsoring.
// Déclenchement : Database Webhook (INSERT sur public.sponsor_requests) → POST vers cette fonction.
// Deux emails sont envoyés à chaque demande :
//   1. Équipe FIMF (destinataire = sponsor_settings.notify_email, repli PARTNER_INBOX)
//   2. Confirmation automatique au demandeur (accusé de réception)
//
// Clé requise : RESEND_API_KEY (Supabase Dashboard → Edge Functions → Secrets)
// Secrets optionnels :
//   RESEND_FROM=FIMF Partenariats <onboarding@resend.dev>  → test sans domaine vérifié
//   PARTNER_INBOX=reuvenethank3@gmail.com                  → test (compte Resend limité au propriétaire)
//   WEBHOOK_SECRET=<valeur>                                → authentification du Database Webhook
// Déploiement : supabase functions deploy sponsor-notification
//   ou : SBP=<token> node supabase/deploy-function.mjs sponsor-notification
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Défauts : boîte partenaires + domaine fimf.ci (exige la vérification du domaine dans Resend).
const PARTNER_INBOX = Deno.env.get('PARTNER_INBOX') ?? 'partenaires@fimf.ci';
const FROM = Deno.env.get('RESEND_FROM') ?? 'FIMF Partenariats <notifications@fimf.ci>';

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
    company: string;
    contact_name: string;
    email: string;
    phone: string | null;
    pack: string;
    message: string | null;
  };
}

/** Labels de repli — slugs actuels + valeurs historiques du site. */
const PACK_LABELS: Record<string, string> = {
  bronze: 'Bronze',
  argent: 'Argent',
  or: 'Or',
  diamant: 'Diamant',
  autre: 'Sur devis / sur-mesure',
  // anciennes valeurs (avant la refonte des trophées)
  silver: 'Argent (ancien pack)',
  gold: 'Or (ancien pack)',
  platinum: 'Diamant (ancien pack)',
  custom: 'Sur devis (ancien pack)',
};

// Client anon : lit les données publiquement accessibles (RLS) —
// packages actifs et lignes de configuration du module.
const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
);

/** Libellé du pack : table sponsor_packages (slug → nom) puis repli statique. */
async function packLabel(slug: string): Promise<string> {
  if (!(slug in PACK_LABELS)) {
    const { data } = await supabase
      .from('sponsor_packages')
      .select('name')
      .eq('slug', slug)
      .eq('active', true)
      .maybeSingle();
    if (data?.name) return String(data.name);
  }
  return PACK_LABELS[slug] ?? slug;
}

/** Destinataire de l'équipe : sponsor_settings.notify_email puis PARTNER_INBOX. */
async function teamRecipient(): Promise<string> {
  const { data } = await supabase
    .from('sponsor_settings')
    .select('notify_email')
    .eq('id', 1)
    .maybeSingle();
  const notify = String(data?.notify_email ?? '').trim();
  return notify || PARTNER_INBOX;
}

/** Envoi Resend ; lance une erreur si l'API refuse. */
async function sendViaResend(body: {
  from: string;
  to: string[];
  reply_to?: string;
  subject: string;
  html: string;
}): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${await res.text()}`);
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Fail-closed : sans secret configuré, la fonction refuse tout appel.
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

    const label = await packLabel(r.pack);
    const toTeam = await teamRecipient();

    const company = esc(r.company);
    const contactName = esc(r.contact_name);
    const email = esc(r.email);
    const phone = r.phone ? esc(r.phone) : '—';
    const packLabel2 = esc(label);
    const message = r.message ? esc(r.message) : '';
    const adminUrl = `${Deno.env.get('SITE_URL') ?? 'https://fimf.ci'}/#/admin`;

    /* 1) Notification équipe FIMF ---------------------------------- */
    const teamHtml = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#004724;color:#fff;padding:20px 24px">
          <h1 style="margin:0;font-size:18px">⚽ Nouvelle demande de sponsoring</h1>
          <p style="margin:4px 0 0;color:#a7f3d0;font-size:13px">Fédération Ivoirienne de Mini-Football</p>
        </div>
        <div style="padding:24px;color:#0f172a;font-size:14px;line-height:1.6">
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;color:#64748b;font-weight:bold;width:140px">Entreprise</td><td><b>${company}</b></td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-weight:bold">Contact</td><td>${contactName}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-weight:bold">Email</td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-weight:bold">Téléphone</td><td>${phone}</td></tr>
            <tr><td style="padding:6px 0;color:#64748b;font-weight:bold">Package</td><td>${packLabel2}</td></tr>
          </table>
          ${message ? `<div style="margin-top:14px;padding:12px;background:#f8fafc;border-left:3px solid #ea580c;border-radius:6px"><i>« ${message} »</i></div>` : ''}
          <div style="margin-top:20px">
            <a href="${adminUrl}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:bold;font-size:13px">Traiter dans la console admin</a>
          </div>
        </div>
      </div>`;

    await sendViaResend({
      from: FROM,
      to: [toTeam],
      reply_to: r.email,
      subject: `⚽ Nouvelle demande de sponsoring — ${String(r.company ?? '').replace(/\s+/g, ' ').trim()} (${label})`,
      html: teamHtml,
    });

    /* 2) Accusé de réception au demandeur -------------------------- */
    const requestorHtml = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#ea580c;color:#fff;padding:20px 24px">
          <h1 style="margin:0;font-size:18px">Merci pour votre demande de partenariat !</h1>
          <p style="margin:4px 0 0;color:#ffedd5;font-size:13px">Fédération Ivoirienne de Mini-Football</p>
        </div>
        <div style="padding:24px;color:#0f172a;font-size:14px;line-height:1.7">
          <p>Bonjour ${contactName},</p>
          <p>Nous avons bien reçu la demande de <b>${company}</b> concernant le package <b>${packLabel2}</b>.</p>
          <p>La commission partenariats vous recontacte <b>sous 72 heures ouvrées</b> avec une proposition détaillée.
          Vous pouvez également nous joindre directement via WhatsApp ou par téléphone.</p>
          ${message ? `<div style="margin-top:14px;padding:12px;background:#f8fafc;border-left:3px solid #004724;border-radius:6px"><i>« ${message} »</i></div>` : ''}
          <p style="margin-top:18px;color:#64748b;font-size:12px">
            Cet email est un accusé de réception automatique du site officiel de la FIMF — ne répondez pas directement ;
            un membre de l'équipe vous écrira depuis son adresse d'équipe.
          </p>
        </div>
      </div>`;

    // L'accusé ne doit jamais bloquer la notification équipe : en cas
    // d'échec on log uniquement.
    try {
      await sendViaResend({
        from: FROM,
        to: [r.email],
        reply_to: toTeam,
        subject: `Votre demande de partenariat FIMF a bien été reçue (${label})`,
        html: requestorHtml,
      });
    } catch (ackErr) {
      console.error('Accusé de réception non envoyé :', ackErr);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (e) {
    console.error('sponsor-notification:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
