import { useEffect, useMemo, useState } from 'react';
import { callLegacyAction } from '../../../lib/callLegacyAction.js';
import { getSupabaseClient } from '../../../lib/supabase.js';
import { getUserDisplayName, hasWorkspacePermission, isWorkspaceOwner } from '../../../lib/workspacePermissions.js';

const MEMBER_PERMISSION_FIELDS = [
  ['can_create_tickets', 'Create tickets'],
  ['can_edit_tickets', 'Edit tickets'],
  ['can_delete_tickets', 'Delete tickets'],
  ['can_create_features', 'Create features'],
  ['can_edit_features', 'Edit features'],
  ['can_delete_features', 'Delete features'],
  ['can_manage_team', 'Manage team'],
  ['can_manage_statuses', 'Manage statuses'],
  ['can_manage_settings', 'Manage settings'],
  ['can_manage_members', 'Manage members'],
];

async function signOutWorkspaceUser() {
  const supabase = getSupabaseClient();
  await supabase.auth.signOut();
  window.location.reload();
}

async function sendInvitationEmail({ invitationId, workspaceId }) {
  const supabase = getSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch('/api/workspace-invite-email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token || ''}`,
    },
    body: JSON.stringify({
      invitationId,
      workspaceId,
    }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload?.error || 'Automatic email delivery is not available right now.');
  }

  return response.json().catch(() => ({}));
}

function WorkspaceMembersPane({ auth }) {
  const supabase = getSupabaseClient();
  const workspaceId = auth?.access?.workspace?.id || null;
  const workspaceName = auth?.access?.workspace?.name || 'Jiqsys Workspace';
  const canManageMembers = hasWorkspacePermission(auth?.access, 'can_manage_members');
  const [members, setMembers] = useState([]);
  const [invitations, setInvitations] = useState([]);
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [invitePermissions, setInvitePermissions] = useState(() =>
    Object.fromEntries(MEMBER_PERMISSION_FIELDS.map(([field]) => [field, false])),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  function openInviteEmailDraft(targetEmail) {
    const subject = encodeURIComponent(`Invitation to join ${workspaceName} on Jiqsys`);
    const body = encodeURIComponent(
      `Hi,\n\nYou have been invited to join "${workspaceName}" on Jiqsys.\n\nSign in with Google using ${targetEmail} at ${window.location.origin} and this workspace will appear automatically in your workspace switcher.\n\nThanks.`,
    );
    window.location.href = `mailto:${targetEmail}?subject=${subject}&body=${body}`;
  }

  async function loadAccessData() {
    if (!workspaceId) {
      setMembers([]);
      setInvitations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setMessage('');

    const { data: membershipRows, error: membershipError } = await supabase
      .from('workspace_members')
      .select('workspace_id, user_id, role, can_create_tickets, can_edit_tickets, can_delete_tickets, can_create_features, can_edit_features, can_delete_features, can_manage_team, can_manage_statuses, can_manage_settings, can_manage_members, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    if (membershipError) {
      setMessage(membershipError.message || 'Unable to load workspace members.');
      setMembers([]);
      setInvitations([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set((membershipRows || []).map((row) => row.user_id))];
    let profilesById = {};

    if (userIds.length) {
      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);

      if (profileError) {
        setMessage(profileError.message || 'Unable to load member profiles.');
      } else {
        profilesById = Object.fromEntries((profileRows || []).map((profile) => [profile.id, profile]));
      }
    }

    setMembers(
      (membershipRows || []).map((row) => ({
        ...row,
        profile: profilesById[row.user_id] || null,
      })),
    );

    const { data: invitationRows, error: invitationError } = await supabase
      .from('workspace_invitations')
      .select('id, invited_email, role, can_create_tickets, can_edit_tickets, can_delete_tickets, can_create_features, can_edit_features, can_delete_features, can_manage_team, can_manage_statuses, can_manage_settings, can_manage_members, status, created_at')
      .eq('workspace_id', workspaceId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (invitationError) {
      setMessage(invitationError.message || 'Unable to load pending invitations.');
      setInvitations([]);
      setLoading(false);
      return;
    }

    setInvitations(invitationRows || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAccessData();
  }, [workspaceId]);

  const ownerCount = useMemo(
    () => members.filter((member) => member.role === 'owner').length,
    [members],
  );

  async function inviteMember() {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!normalizedEmail) {
      setMessage('Enter an email address first.');
      return;
    }

    if (normalizedEmail === String(auth?.user?.email || '').trim().toLowerCase()) {
      setMessage('You are already in this workspace.');
      return;
    }

    setSaving(true);
    setMessage('');

    const { data, error } = await supabase.rpc('create_workspace_invitation', {
      invited_email_input: normalizedEmail,
      invited_role_input: inviteRole,
      can_create_tickets_input: inviteRole === 'owner' ? true : !!invitePermissions.can_create_tickets,
      can_edit_tickets_input: inviteRole === 'owner' ? true : !!invitePermissions.can_edit_tickets,
      can_delete_tickets_input: inviteRole === 'owner' ? true : !!invitePermissions.can_delete_tickets,
      can_create_features_input: inviteRole === 'owner' ? true : !!invitePermissions.can_create_features,
      can_edit_features_input: inviteRole === 'owner' ? true : !!invitePermissions.can_edit_features,
      can_delete_features_input: inviteRole === 'owner' ? true : !!invitePermissions.can_delete_features,
      can_manage_team_input: inviteRole === 'owner' ? true : !!invitePermissions.can_manage_team,
      can_manage_statuses_input: inviteRole === 'owner' ? true : !!invitePermissions.can_manage_statuses,
      can_manage_settings_input: inviteRole === 'owner' ? true : !!invitePermissions.can_manage_settings,
      can_manage_members_input: inviteRole === 'owner' ? true : !!invitePermissions.can_manage_members,
    });

    setSaving(false);

    if (error) {
      setMessage(error.message || 'Could not create this invitation.');
      return;
    }

    const invitationRow = Array.isArray(data) ? data[0] : data;
    const invitationId = invitationRow?.invitation_id || invitationRow?.id || null;
    const invitationEmail = invitationRow?.invited_email_value || invitationRow?.invited_email || normalizedEmail;

    setEmail('');
    setInviteRole('member');
    setInvitePermissions(Object.fromEntries(MEMBER_PERMISSION_FIELDS.map(([field]) => [field, false])));
    await loadAccessData();

    try {
      if (!invitationId) throw new Error('Missing invitation id');
      await sendInvitationEmail({
        invitationId,
        workspaceId,
      });
      setMessage(`Invitation created and email sent to ${invitationEmail}.`);
    } catch (emailError) {
      setMessage(`Invitation created for ${invitationEmail}. Automatic email could not be sent, so a draft was opened instead.`);
      openInviteEmailDraft(invitationEmail);
      console.error(emailError);
    }
  }

  async function updateMember(userId, patch) {
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('workspace_members')
      .update(patch)
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId);

    setSaving(false);

    if (error) {
      setMessage(error.message || 'Could not update member permissions.');
      return;
    }

    await loadAccessData();
  }

  async function handleRoleChange(member, nextRole) {
    const patch = { role: nextRole };
    if (nextRole === 'owner') {
      MEMBER_PERMISSION_FIELDS.forEach(([field]) => {
        patch[field] = true;
      });
    }
    await updateMember(member.user_id, patch);
  }

  async function revokeInvitation(invitation) {
    if (!confirm(`Revoke the invitation for ${invitation.invited_email}?`)) return;

    setSaving(true);
    setMessage('');

    const { error } = await supabase.rpc('revoke_workspace_invitation', {
      invitation_id_input: invitation.id,
    });

    setSaving(false);

    if (error) {
      setMessage(error.message || 'Could not revoke this invitation.');
      return;
    }

    await loadAccessData();
  }

  async function removeMember(member) {
    if (!confirm(`Remove ${member.profile?.full_name || member.profile?.email || 'this user'} from the workspace?`)) return;
    setSaving(true);
    setMessage('');

    const { error } = await supabase
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('user_id', member.user_id);

    setSaving(false);

    if (error) {
      setMessage(error.message || 'Could not remove member.');
      return;
    }

    await loadAccessData();
  }

  function toggleInvitePermission(field, checked) {
    setInvitePermissions((current) => ({
      ...current,
      [field]: checked,
    }));
  }

  const invitePermissionValues = inviteRole === 'owner'
    ? Object.fromEntries(MEMBER_PERMISSION_FIELDS.map(([field]) => [field, true]))
    : invitePermissions;

  return (
    <section className="st-pane" data-st-pane="members">
      <div className="st-pane-eyebrow">Members</div>
      <div className="st-pane-title">Workspace Members</div>
      <div className="st-pane-copy">Each user keeps their own private workspace. Inviting them here adds this shared workspace to their workspace switcher after they sign in with the invited email.</div>
      {!canManageMembers ? (
        <div className="auth-note" style={{ marginTop: '0', marginBottom: '16px' }}>
          You can view the current member list, but only owners or members with member-management permission can invite or change access.
        </div>
      ) : null}
      <div className="st-card">
        <div className="st-grid">
          <div style={{ gridColumn: '1/-1' }}>
            <div className="ilbl">Invite By Email</div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
              <input
                className="inf"
                value={email}
                disabled={!canManageMembers || saving}
                placeholder="member@example.com"
                onChange={(event) => setEmail(event.currentTarget.value)}
              />
              <select
                className="inf"
                style={{ width: '120px', paddingRight: '28px' }}
                value={inviteRole}
                disabled={!canManageMembers || saving}
                onChange={(event) => setInviteRole(event.currentTarget.value)}
              >
                <option value="member">Member</option>
                <option value="owner">Owner</option>
              </select>
              <button className="btn btn-p" type="button" onClick={inviteMember} disabled={!canManageMembers || saving}>
                Invite
              </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              {MEMBER_PERMISSION_FIELDS.map(([field, label]) => (
                <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid var(--bdr)', borderRadius: '12px', background: 'var(--bg)' }}>
                  <input
                    type="checkbox"
                    checked={!!invitePermissionValues[field]}
                    disabled={!canManageMembers || saving || inviteRole === 'owner'}
                    onChange={(event) => toggleInvitePermission(field, event.currentTarget.checked)}
                    style={{ width: '15px', height: '15px', accentColor: 'var(--ink)' }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--t1)' }}>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
        {message ? <div className="auth-msg" style={{ marginTop: '10px' }}>{message}</div> : null}
      </div>

      <div className="st-card" style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', marginBottom: '14px' }}>Pending Invitations</div>
        {loading ? (
          <div style={{ fontSize: '13px', color: 'var(--tm)' }}>Loading invitations…</div>
        ) : invitations.length ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {invitations.map((invitation) => (
              <div key={invitation.id} style={{ border: '1px solid var(--bdr)', borderRadius: '14px', padding: '14px', background: 'var(--wh)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--t1)' }}>{invitation.invited_email}</div>
                    <div style={{ fontSize: '12px', color: 'var(--tm)', marginTop: '4px' }}>
                      Pending {invitation.role === 'owner' ? 'owner' : 'member'} invitation
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <button className="btn btn-s" type="button" disabled={!canManageMembers || saving} onClick={() => openInviteEmailDraft(invitation.invited_email)}>
                      Email Again
                    </button>
                    <button className="btn btn-s" type="button" disabled={!canManageMembers || saving} onClick={() => revokeInvitation(invitation)} style={{ color: 'var(--red)' }}>
                      Revoke
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--tm)' }}>No pending invitations.</div>
        )}
      </div>

      <div className="st-card" style={{ marginTop: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)', marginBottom: '14px' }}>Current Members</div>
        {loading ? (
          <div style={{ fontSize: '13px', color: 'var(--tm)' }}>Loading workspace members…</div>
        ) : members.length ? (
          <div style={{ display: 'grid', gap: '14px' }}>
            {members.map((member) => {
              const isSelf = member.user_id === auth?.user?.id;
              const disableRoleDowngrade = member.role === 'owner' && ownerCount <= 1;
              const disableRemove = isSelf || (member.role === 'owner' && ownerCount <= 1);
              const displayName = member.profile?.full_name || member.profile?.email || member.user_id;

              return (
                <div key={member.user_id} style={{ border: '1px solid var(--bdr)', borderRadius: '16px', padding: '16px', background: 'var(--wh)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--t1)' }}>{displayName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--tm)', marginTop: '4px' }}>{member.profile?.email || 'No email'}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {isSelf ? <span className="st-chip">You</span> : null}
                      <select
                        className="inf"
                        style={{ width: '120px', paddingRight: '28px' }}
                        value={member.role}
                        disabled={!canManageMembers || saving || disableRoleDowngrade}
                        onChange={(event) => handleRoleChange(member, event.currentTarget.value)}
                      >
                        <option value="owner">Owner</option>
                        <option value="member">Member</option>
                      </select>
                      <button className="btn btn-s" type="button" disabled={!canManageMembers || saving || disableRemove} onClick={() => removeMember(member)} style={{ color: 'var(--red)' }}>
                        Remove
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                    {MEMBER_PERMISSION_FIELDS.map(([field, label]) => (
                      <label key={field} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', border: '1px solid var(--bdr)', borderRadius: '12px', background: 'var(--bg)' }}>
                        <input
                          type="checkbox"
                          checked={member.role === 'owner' ? true : !!member[field]}
                          disabled={!canManageMembers || saving || member.role === 'owner'}
                          onChange={(event) => updateMember(member.user_id, { [field]: event.currentTarget.checked })}
                          style={{ width: '15px', height: '15px', accentColor: 'var(--ink)' }}
                        />
                        <span style={{ fontSize: '12px', color: 'var(--t1)' }}>{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: '13px', color: 'var(--tm)' }}>No members yet.</div>
        )}
      </div>
    </section>
  );
}

export default function WorkspaceOverlays({ auth }) {
  const canManageSettings = hasWorkspacePermission(auth?.access, 'can_manage_settings');
  const canEditTickets = hasWorkspacePermission(auth?.access, 'can_edit_tickets');
  const canDeleteTickets = hasWorkspacePermission(auth?.access, 'can_delete_tickets');
  const canCreateTickets = hasWorkspacePermission(auth?.access, 'can_create_tickets');
  const canManageTeam = hasWorkspacePermission(auth?.access, 'can_manage_team');
  const canManageMembers = hasWorkspacePermission(auth?.access, 'can_manage_members');
  const workspaceName = auth?.access?.workspace?.name || 'Jiqsys Workspace';
  const workspaceKind = auth?.access?.workspace?.kind === 'shared' ? 'Shared Workspace' : 'Private Workspace';
  const workspaceCount = auth?.access?.memberships?.length || 1;
  const displayName = getUserDisplayName(auth?.user);
  const roleLabel = isWorkspaceOwner(auth?.access) ? 'Owner' : 'Member';

  return (
    <>
      <div className="drawer-overlay" id="dw-ovl">
        <div className="drawer-backdrop" onClick={() => callLegacyAction('closeDw')} />
        <div className="drawer" id="dw">
          <div className="dw-head">
            <div className="dw-head-left">
              <div className="dw-id" id="dw-id" />
              <input className="dw-title-inp" id="dw-title" placeholder="Ticket title…" onInput={(e) => callLegacyAction('dwField', 'title', e.currentTarget.value)} disabled={!canEditTickets} />
            </div>
            <button className="dw-close" onClick={() => callLegacyAction('closeDw')}>×</button>
          </div>
          <div className="dw-body">
            <div className="dw-section">
              <div className="dw-slbl">Details</div>
              <div className="dw-grid">
                <div className="dw-field">
                  <label>Status</label>
                  <select className="inf" id="dw-status" onInput={(e) => callLegacyAction('dwField', 'statusId', e.currentTarget.value)} disabled={!canEditTickets} />
                </div>
                <div className="dw-field">
                  <label>Priority</label>
                  <select className="inf" id="dw-priority" onInput={(e) => callLegacyAction('dwField', 'priority', e.currentTarget.value)} disabled={!canEditTickets}>
                    <option>To Do ASAP</option>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Normal</option>
                    <option>Low</option>
                  </select>
                </div>
                <div className="dw-field">
                  <label>Assignee</label>
                  <select className="inf" id="dw-assignee" onInput={(e) => callLegacyAction('dwField', 'assigneeId', e.currentTarget.value)} disabled={!canEditTickets} />
                </div>
                <div className="dw-field">
                  <label>Start Date</label>
                  <input type="date" className="inf" id="dw-start" onInput={(e) => callLegacyAction('dwField', 'start', e.currentTarget.value)} disabled={!canEditTickets} />
                </div>
                <div className="dw-field">
                  <label>Due Date</label>
                  <input type="date" className="inf" id="dw-due" onInput={(e) => callLegacyAction('dwField', 'due', e.currentTarget.value)} disabled={!canEditTickets} />
                </div>
              </div>
            </div>

            <div className="dw-section">
              <div className="dw-slbl">Description</div>
              <textarea className="dw-desc" id="dw-desc" rows="3" placeholder="Add notes, context, or details…" onInput={(e) => callLegacyAction('dwField', 'desc', e.currentTarget.value)} disabled={!canEditTickets} />
            </div>

            <div className="dw-section">
              <div className="dw-slbl">Linked Modules</div>
              <p style={{ fontSize: '12px', color: 'var(--tm)', marginBottom: '10px' }}>Tag which module this ticket relates to.</p>
              <div className="mod-tags" id="mod-tags-dyn" />
            </div>

            <div className="dw-section">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div className="dw-slbl" style={{ marginBottom: 0 }}>Linked Test Cases</div>
                <button className="btn btn-s btn-sm" id="dw-pick-groups-btn" onClick={() => callLegacyAction('openGroupPicker')} style={{ fontSize: '11.5px' }} disabled={!canEditTickets}>＋ Select Groups</button>
              </div>
              <div id="dw-testcases" />
            </div>
          </div>
          <div className="dw-foot">
            <div className="dw-del" onClick={() => callLegacyAction('deleteTicket')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', opacity: canDeleteTickets ? 1 : 0.45, pointerEvents: canDeleteTickets ? 'auto' : 'none' }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /></svg>
              <span>Delete ticket</span>
            </div>
            <button className="btn btn-p btn-sm" onClick={() => callLegacyAction('closeDw')}>Done</button>
          </div>
        </div>
      </div>

      <div className="ovl" id="tm-ovl">
        <div className="modal" style={{ width: '400px', maxWidth: '95vw' }}>
          <div className="mhd">
            <div className="mttl" id="tm-modal-title">Add Member</div>
            <button className="mcls" onClick={() => callLegacyAction('closeOvl', 'tm-ovl')}>×</button>
          </div>
          <div className="mbdy">
            <div className="fr"><div className="ilbl">Full Name <span style={{ color: 'var(--red)' }}>*</span></div><input className="inf" id="tm-name" placeholder="e.g. Ahmad Faris" onInput={() => callLegacyAction('tmPreviewAv')} /></div>
            <div className="fr"><div className="ilbl">Role / Position</div><input className="inf" id="tm-role" placeholder="e.g. Engineer, Manager…" /></div>
            <div className="fr"><div className="ilbl">Email</div><input className="inf" id="tm-email" type="email" placeholder="e.g. ahmad@company.com" /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <div id="tm-av-preview" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--t1)', color: '#fff', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, letterSpacing: '.5px' }}>?</div>
              <div style={{ fontSize: '12px', color: 'var(--tm)' }}>Avatar initials are auto-generated from the name.</div>
            </div>
          </div>
          <div className="mft">
            <button className="btn btn-s" onClick={() => callLegacyAction('closeOvl', 'tm-ovl')}>Cancel</button>
            <button className="btn btn-p" id="tm-save-btn" onClick={() => callLegacyAction('saveMember')} disabled={!canManageTeam}>Add Member</button>
          </div>
        </div>
      </div>

      <div className="ovl" id="gp-ovl">
        <div className="modal" style={{ width: '480px', maxWidth: '95vw' }}>
          <div className="mhd">
            <div className="mttl">Select Test Groups</div>
            <button className="mcls" onClick={() => callLegacyAction('closeOvl', 'gp-ovl')}>×</button>
          </div>
          <div className="mbdy" style={{ padding: 0 }}>
            <div id="gp-empty" style={{ display: 'none', padding: '32px 24px', textAlign: 'center', color: 'var(--tm)', fontSize: '13px' }}>
              No test groups available. Add groups in a linked feature&apos;s Test Cases tab first.
            </div>
            <div id="gp-list" style={{ maxHeight: '420px', overflowY: 'auto' }} />
          </div>
          <div className="mft">
            <button className="btn btn-s" onClick={() => callLegacyAction('closeOvl', 'gp-ovl')}>Cancel</button>
            <button className="btn btn-p" onClick={() => callLegacyAction('saveGroupPicker')}>Apply</button>
          </div>
        </div>
      </div>

      <div className="ovl" id="sm-ovl">
        <div className="modal wd">
          <div className="mhd">
            <div className="mttl">Manage Statuses</div>
            <button className="mcls" onClick={() => callLegacyAction('closeOvl', 'sm-ovl')}>×</button>
          </div>
          <div className="mbdy">
            <p style={{ fontSize: '12.5px', color: 'var(--t2)', marginBottom: '16px' }}>Create, rename, colour-code, and drag to reorder statuses.</p>
            <div id="sm-list" />
            <div className="sladd" onClick={() => callLegacyAction('smAdd')}>
              <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              Add new status
            </div>
          </div>
          <div className="mft">
            <button className="btn btn-s" onClick={() => callLegacyAction('closeOvl', 'sm-ovl')}>Cancel</button>
            <button className="btn btn-p" onClick={() => callLegacyAction('smSave')}>Save Changes</button>
          </div>
        </div>
      </div>

      <div className="ovl" id="nt-ovl">
        <div className="modal wd">
          <div className="mhd">
            <div className="mttl">New Ticket</div>
            <button className="mcls" onClick={() => callLegacyAction('closeOvl', 'nt-ovl')}>×</button>
          </div>
          <div className="mbdy">
            <div className="fr"><div className="ilbl">Title <span style={{ color: 'var(--red)' }}>*</span></div><input className="inf" id="nt-title" placeholder="Brief description…" /></div>
            <div className="fr"><div className="ilbl">Description</div><textarea className="inf" id="nt-desc" rows="2" style={{ resize: 'none' }} placeholder="Optional details…" /></div>
            <div className="ntg">
              <div className="fr"><div className="ilbl">Status</div><select className="inf" id="nt-status" /></div>
              <div className="fr"><div className="ilbl">Priority</div><select className="inf" id="nt-pri" defaultValue="Normal"><option>To Do ASAP</option><option>Critical</option><option>High</option><option>Normal</option><option>Low</option></select></div>
              <div className="fr"><div className="ilbl">Assignee</div><select className="inf" id="nt-asgn" /></div>
              <div className="fr"><div className="ilbl">Start Date</div><input type="date" className="inf" id="nt-start" /></div>
              <div className="fr"><div className="ilbl">Due Date</div><input type="date" className="inf" id="nt-due" /></div>
            </div>
          </div>
          <div className="mft">
            <button className="btn btn-s" onClick={() => callLegacyAction('closeOvl', 'nt-ovl')}>Cancel</button>
            <button className="btn btn-p" onClick={() => callLegacyAction('ntCreate')} disabled={!canCreateTickets}>Create Ticket</button>
          </div>
        </div>
      </div>

      <div className="ovl" id="settings-ovl">
        <div className="modal xl">
          <div className="mhd">
            <div className="mttl">Workspace Settings</div>
            <button className="mcls" onClick={() => callLegacyAction('closeOvl', 'settings-ovl')}>×</button>
          </div>
          <div className="st-shell">
            <aside className="st-side">
              <div className="st-brand">
                <div className="st-brand-mark"><svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg></div>
                <div className="st-brand-copy">
                  <div className="st-brand-name">Jiqsys</div>
                  <div className="st-brand-sub">Workspace controls</div>
                </div>
              </div>
              <div className="st-nav">
                <button className="st-nav-btn active" data-st-section="general" onClick={() => callLegacyAction('switchSettingsSection', 'general')}>
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M17.66 17.66l-1.41-1.41M6.34 17.66l1.41-1.41" /></svg>
                  General
                </button>
                <button className="st-nav-btn" data-st-section="appearance" onClick={() => callLegacyAction('switchSettingsSection', 'appearance')}>
                  <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" /><path d="M12 1v2" /><path d="M12 21v2" /><path d="M4.22 4.22l1.42 1.42" /><path d="M18.36 18.36l1.42 1.42" /><path d="M1 12h2" /><path d="M21 12h2" /><path d="M4.22 19.78l1.42-1.42" /><path d="M18.36 5.64l1.42-1.42" /></svg>
                  Appearance
                </button>
                <button className="st-nav-btn" data-st-section="security" onClick={() => callLegacyAction('switchSettingsSection', 'security')}>
                  <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" /></svg>
                  Security
                </button>
                {canManageMembers ? (
                  <button className="st-nav-btn" data-st-section="members" onClick={() => callLegacyAction('switchSettingsSection', 'members')}>
                    <svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>
                    Members
                  </button>
                ) : null}
              </div>
            </aside>
            <div className="st-main">
              <section className="st-pane active" data-st-pane="general">
                <div className="st-pane-eyebrow">Workspace</div>
                <div className="st-pane-title">Profile & Access</div>
                <div className="st-pane-copy">Open your workspace settings from the sidebar footer. Google sign-in now controls who can reach this workspace, and the password lock here remains an optional extra gate inside the app.</div>
                <div className="st-card">
                  <div className="st-grid">
                    <div>
                      <div className="ilbl">Workspace Name</div>
                      <input className="inf" value={workspaceName} readOnly />
                    </div>
                    <div>
                      <div className="ilbl">Signed In As</div>
                      <input className="inf" value={displayName} readOnly />
                    </div>
                    <div>
                      <div className="ilbl">Email</div>
                      <input className="inf" value={auth?.user?.email || ''} readOnly />
                    </div>
                    <div>
                      <div className="ilbl">Role</div>
                      <input className="inf" value={roleLabel} readOnly />
                    </div>
                    <div>
                      <div className="ilbl">Workspace Type</div>
                      <input className="inf" value={workspaceKind} readOnly />
                    </div>
                    <div>
                      <div className="ilbl">Available Workspaces</div>
                      <input className="inf" value={String(workspaceCount)} readOnly />
                    </div>
                  </div>
                  <div className="st-actions">
                    <span className="st-chip"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>Google-auth workspace mode</span>
                    <span className="st-chip"><svg viewBox="0 0 24 24"><path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 000 7H14.5a3.5 3.5 0 010 7H6" /></svg>Access enforced by Supabase RLS</span>
                    {canManageMembers ? (
                      <button className="btn btn-s" onClick={() => callLegacyAction('switchSettingsSection', 'members')}>Manage Members</button>
                    ) : null}
                    <button className="btn btn-s" onClick={() => signOutWorkspaceUser()}>Sign Out</button>
                  </div>
                </div>
              </section>

              <section className="st-pane" data-st-pane="appearance">
                <div className="st-pane-eyebrow">Appearance</div>
                <div className="st-pane-title">Theme</div>
                <div className="st-pane-copy">Choose how Jiqsys looks in this workspace. The selected mode is saved in Supabase and applied when the app loads.</div>
                <div className="st-card">
                  <div className="st-grid">
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className="st-option" id="appearance-option-light">
                        <input type="radio" name="appearance-theme" value="light" onChange={() => callLegacyAction('refreshSettingsAppearanceUi', false)} />
                        <div className="st-option-copy">
                          <div className="st-option-title">Light Mode</div>
                          <div className="st-option-sub">Bright neutral surfaces with the current default Jiqsys look.</div>
                        </div>
                      </label>
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label className="st-option" id="appearance-option-dark">
                        <input type="radio" name="appearance-theme" value="dark" onChange={() => callLegacyAction('refreshSettingsAppearanceUi', false)} />
                        <div className="st-option-copy">
                          <div className="st-option-title">Dark Mode</div>
                          <div className="st-option-sub">Lower-light interface with darker surfaces and stronger contrast for focus.</div>
                        </div>
                      </label>
                    </div>
                  </div>
                  <div className="st-actions">
                    <button className="btn btn-p" onClick={() => callLegacyAction('saveSettingsAppearance')} disabled={!canManageSettings}>Save Appearance</button>
                  </div>
                </div>
              </section>

              <section className="st-pane" data-st-pane="security">
                <div className="st-pane-eyebrow">Security</div>
                <div className="st-pane-title">Password Lock</div>
                <div className="st-pane-copy">Turn the workspace password on only if you want it. The password is stored as a one-way hash in Supabase, and this browser can stay remembered after you unlock once.</div>
                <div className="st-card">
                  <div className="st-grid">
                    <div style={{ gridColumn: '1/-1' }}>
                      <div className="ilbl">Current Status</div>
                      <div className="st-chip" id="security-status-chip"><svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg><span id="security-status-text">No password set</span></div>
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', border: '1px solid var(--bdr)', borderRadius: '12px', background: 'var(--wh)', cursor: 'pointer' }}>
                        <input id="settings-password-enabled" type="checkbox" style={{ width: '16px', height: '16px', accentColor: 'var(--ink)' }} onChange={() => callLegacyAction('refreshSettingsSecurityUi', false)} disabled={!canManageSettings} />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>Require password to open Jiqsys</div>
                          <div style={{ fontSize: '12px', color: 'var(--tm)', marginTop: '2px' }}>If this stays off, the app opens directly with no login prompt.</div>
                        </div>
                      </label>
                    </div>
                    <div>
                      <div className="ilbl">Password</div>
                      <input className="inf" id="settings-password" type="password" placeholder="Set or replace password" disabled={!canManageSettings} />
                    </div>
                    <div>
                      <div className="ilbl">Confirm Password</div>
                      <input className="inf" id="settings-password-confirm" type="password" placeholder="Confirm password" disabled={!canManageSettings} />
                    </div>
                  </div>
                  <div className="auth-msg" id="settings-password-msg" style={{ marginTop: '10px' }} />
                  <div className="st-actions">
                    <button className="btn btn-p" onClick={() => callLegacyAction('saveSettingsPassword')} disabled={!canManageSettings}>Save Security</button>
                    <button className="btn btn-s" onClick={() => callLegacyAction('lockWorkspaceNow')} disabled={!canManageSettings}>Lock Now</button>
                    <button className="btn btn-s" style={{ color: 'var(--red)' }} onClick={() => callLegacyAction('clearWorkspacePassword')} disabled={!canManageSettings}>Disable Password</button>
                  </div>
                </div>
              </section>

              <WorkspaceMembersPane auth={auth} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
