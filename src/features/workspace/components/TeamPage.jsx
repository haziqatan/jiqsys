import { callLegacyAction } from '../../../lib/callLegacyAction.js';
import { hasWorkspacePermission } from '../../../lib/workspacePermissions.js';
import useLegacyTeam from '../hooks/useLegacyTeam.js';

function teamInitials(name) {
  return String(name || '')
    .trim()
    .split(/\s+/)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?';
}

export default function TeamPage({ auth }) {
  const team = useLegacyTeam();
  const canManageTeam = hasWorkspacePermission(auth?.access, 'can_manage_team');

  return (
    <div className="page" id="page-team">
      <div style={{ maxWidth: '720px' }}>
        <div className="page-head">
          <div>
            <div className="page-kicker">Platform</div>
            <div className="page-title">Team</div>
            <div className="page-copy">Manage team members who can be assigned to tickets.</div>
          </div>
          <button className="btn btn-p" onClick={() => callLegacyAction('openAddMember')} disabled={!canManageTeam} title={canManageTeam ? 'Add member' : 'You do not have permission to manage team members'}>
            + Add Member
          </button>
        </div>
        <div id="team-list" data-react-managed="true">
          {!team.length ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--tm)', fontSize: '13.5px' }}>
              No team members yet. Click <strong>+ Add Member</strong> to get started.
            </div>
          ) : (
            team.map((member) => (
              <div className="tm-card" key={member.id}>
                <div className="tm-av">{teamInitials(member.name)}</div>
                <div className="tm-info">
                  <div className="tm-name">{member.name}</div>
                  <div className="tm-meta">
                    {member.role ? member.role : <span style={{ color: 'var(--tm)' }}>No role set</span>}
                    {member.email ? ` · ${member.email}` : ''}
                  </div>
                </div>
                <div className="tm-actions">
                  <button className="tm-btn" onClick={() => callLegacyAction('openEditMember', member.id)} disabled={!canManageTeam}>Edit</button>
                  <button className="tm-btn del" onClick={() => callLegacyAction('deleteMember', member.id)} disabled={!canManageTeam}>Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
