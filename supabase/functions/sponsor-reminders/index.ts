// Edge Function Supabase : rappels automatiques de fin de contrat sponsor.
// À déclencher quotidiennement (cron externe, pg_cron + pg_net, ou
// Supabase Dashboard → Intégrations → Cron):
//   POST <function-url> avec en-tête x-reminders-secret: <REMINDERS_SECRET>
//
// Comportement :
//   - Lit sponsor_settings (notify_email) et sponsor_clients
//   - Sélectionne les contrats actifs finissant dans les 30 jours
//   - Envoie un email de synthèse à l'équipe partenaires (Resend)
//
// Secrets requis :
//   RESEND_API_KEY             (Dashboard → Edge Functions → Secrets)
//   REMINDERS_SECRET           (protège l'appel cron, valeur longue aléatoire)
//   SUPABASE_SERVICE_ROLE_KEY  (lecture des contrats : la table est protégée
//                               par RLS admin côté serveur)
// Optionnels : RESEND_FROM, PARTNER_INBOX, SITE_URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseAnon = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_ANON_KEY')!,
);

/** Client service_role (contournement RLS) — requis pour lire les contrats. */
function serviceClient() {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) return null;
  return createClient(Deno.env.get('SUPABASE_URL')!, key);
}

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

interface ClientRow {
  name: string;
  contact_email: string;
  end_date: string | null;
  amount: number | null;
  currency: string | null;
  payment_status: string | null;
}

Deno.serve(async (req) => {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  // Fail-closed : jamais de rappels si le secret n'est pas posé.
  const secret = Deno.env.get('REMINDERS_SECRET');
  if (!secret) {
    console.error('REMINDERS_SECRET non configuré : appel refusé');
    return new Response(JSON.stringify({ error: 'reminders secret not configured' }), { status: 503 });
  }
  if (req.headers.get('x-reminders-secret') !== secret) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    /* Fail-safe : sans clé service_role, les contrats sont inaccessibles (RLS). */
    const svc = serviceClient();
    if (!svc) {
      console.error('SUPABASE_SERVICE_ROLE_KEY non configurée : contrats illisibles');
      return new Response(
        JSON.stringify({ error: 'service role key not configured (sponsor_clients est protégé par RLS admin)' }),
        { status: 503 },
      );
    }

    /* Destinataire : personnalisé ou boîte fonctionnelle. */
    const { data: settings } = await supabaseAnon
      .from('sponsor_settings')
      .select('notify_email')
      .eq('id', 1)
      .maybeSingle();
    const to = String(settings?.notify_email ?? '').trim() ||
      (Deno.env.get('PARTNER_INBOX') ?? 'partenaires@fimf.ci');

    /* Contrats finissant dans 30 jours (bornes incluses). */
    const today = new Date();
    const end = new Date(today.getTime() + 30 * 24 * 3600 * 1000);
    const { data: clients, error } = await svc
      .from('sponsor_clients')
      .select('name, contact_email, end_date, amount, currency, payment_status')
      .gte('end_date', today.toISOString().slice(0, 10))
      .lte('end_date', end.toISOString().slice(0, 10))
      .order('end_date', { ascending: true });
    if (error) throw error;
    const rows: ClientRow[] = (clients ?? []) as ClientRow[];

    if (rows.length === 0) {
      return new Response(JSON.stringify({ ok: true, reminded: 0 }), { status: 200 });
    }

    const paymentLabel: Record<string, string> = {
      attente: 'En attente',
      partiel: 'Partiel',
      paye: 'Payé',
    };

    const lines = rows
      .map(
        (c) => `<tr>
          <td style="padding:6px 0;font-weight:bold">${esc(c.name)}</td>
          <td style="padding:6px 0">${esc(c.end_date ? new Date(c.end_date).toLocaleDateString('fr-FR') : '—')}</td>
          <td style="padding:6px 0">${esc(Number(c.amount ?? 0).toLocaleString('fr-FR').replace(/\u202f|\u00a0/g, ' '))} ${esc(c.currency ?? 'FCFA')}</td>
          <td style="padding:6px 0">${esc(paymentLabel[c.payment_status ?? ''] ?? c.payment_status)}</td>
        </tr>`,
      )
      .join('');

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
        <div style="background:#052818;color:#fff;padding:20px 24px">
          <h1 style="margin:0;font-size:18px">⏰ Rappel — ${rows.length} contrat${rows.length > 1 ? 's' : ''} arrivant${rows.length > 1 ? 's' : ''} à échéance</h1>
          <p style="margin:4px 0 0;color:#a7f3d0;font-size:13px">Sponsoring — FIMF</p>
        </div>
        <div style="padding:24px;color:#0f172a;font-size:14px">
          <table style="width:100%;border-collapse:collapse;font-size:13px">
            <tr style="color:#64748b;font-weight:bold;text-align:left">
              <td style="padding:6px 0">Sponsor</td><td>Fin</td><td>Montant</td><td>Paiement</td>
            </tr>
            ${lines}
          </table>
          <p style="margin-top:18px;color:#475569;font-size:13px">
            Pensez à ouvrir la console admin → Sponsoring → Sponsors pour renouveler
            le contrat, envoyer une facture ou archiver la fiche.
          </p>
        </div>
      </div>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM') ?? 'FIMF Partenariats <notifications@fimf.ci>',
        to: [to],
        subject: `⏰ ${rows.length} contrat${rows.length > 1 ? 's' : ''} de sponsoring à renouveler sous 30 jours`,
        html,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend error:', res.status, errText);
      return new Response(JSON.stringify({ error: errText }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true, reminded: rows.length }), { status: 200 });
  } catch (e) {
    console.error('sponsor-reminders:', e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
