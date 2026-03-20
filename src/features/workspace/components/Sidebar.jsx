import { callLegacyAction } from '../../../lib/callLegacyAction.js';
import { getUserDisplayName, getUserInitials, isWorkspaceOwner } from '../../../lib/workspacePermissions.js';
import useLegacyActivePage from '../hooks/useLegacyActivePage.js';
import FeatureNavSection from './FeatureNavSection.jsx';

function SidebarItem({ page, title, children, active = false, badgeId = null }) {
  return (
    <div
      className={`ni${active ? ' active' : ''}`}
      data-page={page}
      onClick={() => callLegacyAction('nav', page)}
      title={title}
      aria-label={title}
    >
      {children}
      {badgeId ? (
        <span
          id={badgeId}
          style={{
            display: 'none',
            marginLeft: 'auto',
            fontSize: '10px',
            fontWeight: 600,
            background: '#d94f3d',
            color: '#fff',
            borderRadius: '10px',
            padding: '1px 6px',
            minWidth: '18px',
            textAlign: 'center',
          }}
        />
      ) : null}
    </div>
  );
}

export default function Sidebar({ auth }) {
  const activePage = useLegacyActivePage();
  const displayName = getUserDisplayName(auth?.user);
  const initials = getUserInitials(auth?.user);
  const roleLabel = isWorkspaceOwner(auth?.access) ? 'Owner' : 'Member';

  return (
    <nav className="sidebar" id="app-sidebar">
      <div className="sidebar-head">
        <div className="s-logo">
          <div className="s-brand">
            <div className="lm">
              <img src="/asset/ziqlogo.png" alt="Jiqsys logo" />
            </div>
            <span className="ln">Jiqsys</span>
          </div>
          <button
            className="sidebar-toggle"
            id="sidebar-toggle"
            type="button"
            onClick={() => callLegacyAction('toggleSidebar')}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <svg viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <line x1="9" y1="4" x2="9" y2="20" />
              <polyline points="14 9 11 12 14 15" />
            </svg>
          </button>
        </div>
      </div>

      <div className="sidebar-scroll" id="app-sidebar-scroll">
        <div className="ss">
          <SidebarItem page="home" title="Home" active={activePage === 'home'}>
            <svg viewBox="0 0 24 24">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Home</span>
          </SidebarItem>
          <SidebarItem page="tickets" title="Tickets" active={activePage === 'tickets'}>
            <svg viewBox="0 0 24 24">
              <path d="M20 12v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1h7" />
              <polyline points="16 3 21 3 21 8" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            <span>Tickets</span>
          </SidebarItem>
        </div>

        <div className="sdiv" style={{ margin: '10px 0 4px' }} />
        <FeatureNavSection auth={auth} />

        <div className="ssp" />
        <div className="sdiv" />
        <div className="ss">
          <SidebarItem page="team" title="Team" active={activePage === 'team'}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 00-3-3.87" />
              <path d="M16 3.13a4 4 0 010 7.75" />
            </svg>
            <span>Team</span>
          </SidebarItem>
          <div
            className={`ni${activePage === 'trash' ? ' active' : ''}`}
            id="ni-trash"
            data-page="trash"
            onClick={() => callLegacyAction('nav', 'trash')}
            title="Trash"
            aria-label="Trash"
          >
            <svg viewBox="0 0 24 24">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14H6L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4h6v2" />
            </svg>
            <span>Trash</span>
            <span
              id="trash-badge"
              style={{
                display: 'none',
                marginLeft: 'auto',
                fontSize: '10px',
                fontWeight: 600,
                background: '#d94f3d',
                color: '#fff',
                borderRadius: '10px',
                padding: '1px 6px',
                minWidth: '18px',
                textAlign: 'center',
              }}
            />
          </div>
        </div>
      </div>

      <div className="sbot">
        <div
          className="ubl ubl-settings"
          onClick={() => callLegacyAction('openSettingsModal', 'general')}
          aria-label="Settings"
        >
          <div className="uav">{initials}</div>
          <div className="ubl-meta" style={{ flex: 1, minWidth: 0 }}>
            <div className="unm">{displayName}</div>
            <div className="url">{roleLabel}</div>
          </div>
          <span className="ubl-dots" style={{ color: 'var(--tm)', fontSize: '16px' }}>···</span>
        </div>
      </div>
    </nav>
  );
}
