import { callLegacyAction } from '../../../lib/callLegacyAction.js';
import { hasWorkspacePermission } from '../../../lib/workspacePermissions.js';
import TicketTableSection from './TicketTableSection.jsx';
import useLegacyTicketTable from '../hooks/useLegacyTicketTable.js';
import useLegacyTicketView from '../hooks/useLegacyTicketView.js';
import KanbanSection from './KanbanSection.jsx';
import GanttSection from './GanttSection.jsx';
import useLegacyGantt from '../hooks/useLegacyGantt.js';
import TicketControlsBar from './TicketControlsBar.jsx';

const GANTT_SCALES = [
  { key: 'month', label: 'Month' },
  { key: 'quarter', label: 'Quarter' },
  { key: 'year', label: 'Year' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
];

export default function TicketsPage({ auth }) {
  const tableState = useLegacyTicketTable();
  const ticketView = useLegacyTicketView();
  const ganttState = useLegacyGantt();
  const canManageStatuses = hasWorkspacePermission(auth?.access, 'can_manage_statuses');
  const canCreateTickets = hasWorkspacePermission(auth?.access, 'can_create_tickets');

  return (
    <div className="page" id="page-tickets">
      <div className="tk-shell">
        <div className="tk-top">
          <span className="tk-ttl">Tickets</span>
          <div className="vtabs">
            <div className={`vtab${ticketView === 'table' ? ' active' : ''}`} data-view="table" onClick={() => callLegacyAction('switchView', 'table')}>
              <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
              Table
            </div>
            <div className={`vtab${ticketView === 'kanban' ? ' active' : ''}`} data-view="kanban" onClick={() => callLegacyAction('switchView', 'kanban')}>
              <svg viewBox="0 0 24 24"><rect x="2" y="3" width="5" height="18" rx="1" /><rect x="9.5" y="3" width="5" height="12" rx="1" /><rect x="17" y="3" width="5" height="15" rx="1" /></svg>
              Kanban
            </div>
            <div className={`vtab${ticketView === 'gantt' ? ' active' : ''}`} data-view="gantt" onClick={() => callLegacyAction('switchView', 'gantt')}>
              <svg viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="15" y2="12" /><line x1="3" y1="18" x2="18" y2="18" /></svg>
              Gantt
            </div>
          </div>
          <div className="tksp" />
          <button className="btn btn-g btn-sm" onClick={() => callLegacyAction('openSmgr')} disabled={!canManageStatuses} title={canManageStatuses ? 'Manage statuses' : 'You do not have permission to manage statuses'}>
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M19.07 19.07l-1.41-1.41M4.93 19.07l1.41-1.41" /></svg>
            Manage Statuses
          </button>
          <button className="btn btn-p btn-sm" onClick={() => callLegacyAction('openNt', null)} disabled={!canCreateTickets} title={canCreateTickets ? 'Create ticket' : 'You do not have permission to create tickets'}>
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            New Ticket
          </button>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div className={`tkv${ticketView === 'table' ? ' active' : ''}`} id="view-table">
            <div className="tvw">
              <TicketControlsBar count={tableState.count} />
              <TicketTableSection />
            </div>
          </div>

          <div className={`tkv${ticketView === 'kanban' ? ' active' : ''}`} id="view-kanban">
            <KanbanSection />
          </div>

          <div className={`tkv${ticketView === 'gantt' ? ' active' : ''}`} id="view-gantt">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '12px 24px 14px' }}>
              <span style={{ fontSize: '12px', color: 'var(--tm)', fontWeight: 500, marginRight: '4px' }}>Scale</span>
              {GANTT_SCALES.slice(0, 3).map((scale) => (
                <button
                  className={`gscale-btn${ganttState.scale === scale.key ? ' active' : ''}`}
                  data-scale={scale.key}
                  key={scale.key}
                  onClick={() => callLegacyAction('setGanttScale', scale.key)}
                >
                  {scale.label}
                </button>
              ))}
              <div style={{ width: '1px', height: '16px', background: 'var(--bdr)', margin: '0 4px' }} />
              {GANTT_SCALES.slice(3).map((scale) => (
                <button
                  className={`gscale-btn${ganttState.scale === scale.key ? ' active' : ''}`}
                  data-scale={scale.key}
                  key={scale.key}
                  onClick={() => callLegacyAction('setGanttScale', scale.key)}
                >
                  {scale.label}
                </button>
              ))}
            </div>
            <div className="gvo">
              <GanttSection />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
