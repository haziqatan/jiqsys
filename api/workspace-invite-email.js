import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL;

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
}

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function getDisplayName(user) {
  return (
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split('@')[0] ||
    'Jiqsys user'
  );
}

function getAppUrl(req) {
  if (process.env.APP_BASE_URL) return process.env.APP_BASE_URL;
  if (req.headers.origin) return req.headers.origin;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:5173';
}

function renderInviteEmail({ inviterName, workspaceName, recipientEmail, appUrl }) {
  return `
    <div style="font-family:Arial,sans-serif;background:#f6f4ef;padding:32px;color:#1e1d1a">
      <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5dfd2;border-radius:18px;overflow:hidden">
        <div style="padding:28px 28px 18px;background:linear-gradient(135deg,#102038 0%,#214d8a 45%,#167a66 100%);color:#ffffff">
          <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;opacity:.8;margin-bottom:10px">Jiqsys Workspace Invite</div>
          <div style="font-size:28px;font-weight:700;line-height:1.2">You’ve been invited to join ${workspaceName}</div>
        </div>
        <div style="padding:28px">
          <p style="margin:0 0 14px;font-size:15px;line-height:1.7">${inviterName} invited <strong>${recipientEmail}</strong> to collaborate in <strong>${workspaceName}</strong> on Jiqsys.</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.7">Sign in with Google using this same email address and the shared workspace will appear alongside your own private workspace automatically.</p>
          <p style="margin:0 0 24px">
            <a href="${appUrl}" style="display:inline-block;background:#102038;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-weight:600">Open Jiqsys</a>
          </p>
          <div style="font-size:13px;color:#66604f;line-height:1.7">
            If the button above doesn’t open, visit:<br />
            <a href="${appUrl}" style="color:#214d8a">${appUrl}</a>
          </div>
        </div>
      </div>
    </div>
  `;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return json(res, 405, { error: 'Method not allowed' });
  }

  if (!supabaseUrl || !supabaseServiceRoleKey || !resendApiKey || !resendFromEmail) {
    return json(res, 500, {
      error: 'Missing server email configuration. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, and RESEND_FROM_EMAIL.',
    });
  }

  const accessToken = getBearerToken(req);
  if (!accessToken) {
    return json(res, 401, { error: 'Missing access token' });
  }

  const { invitationId, workspaceId } = req.body || {};
  if (!invitationId || !workspaceId) {
    return json(res, 400, { error: 'Missing invitationId or workspaceId' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (userError || !user) {
    return json(res, 401, { error: 'Invalid session' });
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('workspace_members')
    .select('role, can_manage_members')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) {
    return json(res, 500, { error: membershipError.message || 'Unable to verify workspace permissions' });
  }

  const canManageMembers = membership?.role === 'owner' || !!membership?.can_manage_members;
  if (!membership || !canManageMembers) {
    return json(res, 403, { error: 'You do not have permission to send invitations for this workspace' });
  }

  const { data: invitation, error: invitationError } = await supabaseAdmin
    .from('workspace_invitations')
    .select('id, invited_email, status')
    .eq('id', invitationId)
    .eq('workspace_id', workspaceId)
    .maybeSingle();

  if (invitationError) {
    return json(res, 500, { error: invitationError.message || 'Unable to load invitation' });
  }

  if (!invitation || invitation.status !== 'pending') {
    return json(res, 404, { error: 'Invitation no longer exists or is no longer pending' });
  }

  const { data: workspace, error: workspaceError } = await supabaseAdmin
    .from('workspaces')
    .select('name')
    .eq('id', workspaceId)
    .maybeSingle();

  if (workspaceError) {
    return json(res, 500, { error: workspaceError.message || 'Unable to load workspace details' });
  }

  const resend = new Resend(resendApiKey);
  const appUrl = getAppUrl(req);
  const inviterName = getDisplayName(user);

  try {
    const { data, error } = await resend.emails.send({
      from: resendFromEmail,
      to: [invitation.invited_email],
      subject: `Invitation to join ${workspace?.name || 'a workspace'} on Jiqsys`,
      html: renderInviteEmail({
        inviterName,
        workspaceName: workspace?.name || 'Jiqsys Workspace',
        recipientEmail: invitation.invited_email,
        appUrl,
      }),
    });

    if (error) {
      return json(res, 502, { error: error.message || 'Email provider rejected the invitation email' });
    }

    return json(res, 200, {
      ok: true,
      emailId: data?.id || null,
    });
  } catch (error) {
    return json(res, 500, { error: error?.message || 'Failed to send invitation email' });
  }
}
