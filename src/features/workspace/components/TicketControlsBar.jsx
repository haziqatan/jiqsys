import { callLegacyAction } from '../../../lib/callLegacyAction.js';
import useLegacyTicketControls from '../hooks/useLegacyTicketControls.js';

const PRIORITY_OPTIONS = ['To Do ASAP', 'Critical', 'High', 'Normal', 'Low'];
const SORT_OPTIONS = [
  { value: 'id', label: 'ID' },
  { value: 'title', label: 'Title' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'assignee', label: 'Assignee' },
  { value: 'due', label: 'Due Date' },
];

function SortDirectionIcon({ direction }) {
  return direction === 'asc' ? (
    <svg id="srt-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="5 12 12 5 19 12" />
    </svg>
  ) : (
    <svg id="srt-icon" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <polyline points="19 12 12 19 5 12" />
    </svg>
  );
}

export default function TicketControlsBar({ count }) {
  const controls = useLegacyTicketControls();
  const { filters, sort, statuses, assignees, tags, anyActive } = controls;

  return (
    <>
      <div className="tv-bar" data-react-managed="true">
        <div className="tv-srch">
          <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          <input
            placeholder="Search tickets…"
            id="tv-q"
            value={filters.q}
            onChange={(event) => callLegacyAction('setTicketSearch', event.currentTarget.value)}
          />
        </div>

        <div className="tv-flt">
          <select
            className={`flt-sel${filters.status ? ' active-flt' : ''}`}
            id="flt-status"
            value={filters.status}
            onChange={(event) => callLegacyAction('setTicketFilter', 'status', event.currentTarget.value)}
          >
            <option value="">All Statuses</option>
            {statuses.map((status) => (
              <option value={status.id} key={status.id}>{status.name}</option>
            ))}
          </select>

          <select
            className={`flt-sel${filters.priority ? ' active-flt' : ''}`}
            id="flt-priority"
            value={filters.priority}
            onChange={(event) => callLegacyAction('setTicketFilter', 'priority', event.currentTarget.value)}
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map((priority) => (
              <option key={priority} value={priority}>{priority}</option>
            ))}
          </select>

          <select
            className={`flt-sel${filters.assignee ? ' active-flt' : ''}`}
            id="flt-assignee"
            value={filters.assignee}
            onChange={(event) => callLegacyAction('setTicketFilter', 'assignee', event.currentTarget.value)}
          >
            <option value="">All Assignees</option>
            {assignees.map((assignee) => (
              <option value={assignee.id} key={assignee.id}>{assignee.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto', flexShrink: 0 }}>
          <span style={{ fontSize: '12px', color: 'var(--tm)', whiteSpace: 'nowrap' }}>Sort by</span>
          <select className="flt-sel" id="srt-col" value={sort.col} onChange={(event) => callLegacyAction('setTicketSortCol', event.currentTarget.value)}>
            {SORT_OPTIONS.map((option) => (
              <option value={option.value} key={option.value}>{option.label}</option>
            ))}
          </select>
          <button className="srt-dir-btn" id="srt-dir" onClick={() => callLegacyAction('toggleSortDir')} title={sort.dir === 'asc' ? 'Ascending' : 'Descending'}>
            <SortDirectionIcon direction={sort.dir} />
          </button>
          {anyActive ? (
            <button className="flt-clr" id="flt-clr-btn" onClick={() => callLegacyAction('clearFilters')} title="Clear all filters">
              <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
              Clear
            </button>
          ) : null}
          <span id="tv-cnt" data-react-managed="true" style={{ fontSize: '12px', color: 'var(--tm)', whiteSpace: 'nowrap' }}>
            {count} ticket{count !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div
        id="flt-tags-row"
        data-react-managed="true"
        style={{
          display: tags.length ? 'flex' : 'none',
          gap: '6px',
          flexWrap: 'wrap',
          padding: '0 0 10px 0',
        }}
      >
        {tags.map((tag) => (
          <div className="flt-tag" key={tag.key}>
            {tag.label}
            <button className="flt-tag-rm" onClick={() => callLegacyAction('clearOneFilter', tag.key)}>×</button>
          </div>
        ))}
      </div>
    </>
  );
}
