import { useEffect, useRef } from 'react';
import { callLegacyAction } from '../../../lib/callLegacyAction.js';
import useLegacyTicketTable from '../hooks/useLegacyTicketTable.js';

function TicketRow({ row }) {
  return (
    <tr onClick={() => callLegacyAction('openDw', row.id)} className={row.selected ? 'row-sel' : ''}>
      <td>
        <input
          type="checkbox"
          className="tkchk"
          checked={row.selected}
          onChange={(event) => callLegacyAction('toggleRow', row.id, event.currentTarget)}
          onClick={(event) => event.stopPropagation()}
        />
      </td>
      <td><div style={{ fontWeight: 500, fontSize: '13px' }}>{row.title}</div></td>
      <td><span dangerouslySetInnerHTML={{ __html: row.statusHtml }} /></td>
      <td><span dangerouslySetInnerHTML={{ __html: row.priorityHtml }} /></td>
      <td style={{ fontSize: '13px', whiteSpace: 'nowrap' }}>{row.assignee}</td>
      <td><span dangerouslySetInnerHTML={{ __html: row.linkedHtml }} /></td>
      <td style={{ fontSize: '12.5px', color: 'var(--t2)', whiteSpace: 'nowrap' }}>{row.dueText}</td>
      <td><span className="mono">{row.id}</span></td>
    </tr>
  );
}

export default function TicketTableSection() {
  const tableState = useLegacyTicketTable();
  const selectAllRef = useRef(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = tableState.partiallySelected;
    }
  }, [tableState.partiallySelected]);

  return (
    <>
      <div
        id="bulk-bar"
        data-react-managed="true"
        style={{
          display: tableState.selectedIds.length ? 'flex' : 'none',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 14px',
          background: 'var(--t1)',
          borderRadius: '9px',
          marginBottom: '10px',
        }}
      >
        <span id="bulk-cnt" style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>
          {tableState.selectedIds.length} ticket{tableState.selectedIds.length > 1 ? 's' : ''} selected
        </span>
        <span style={{ flex: 1 }} />
        <button className="bulk-btn" onClick={() => callLegacyAction('bulkDelete')}>
          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14H6L5 6" />
          </svg>
          Delete selected
        </button>
        <button className="bulk-btn bulk-btn-ghost" onClick={() => callLegacyAction('clearSelection')}>Cancel</button>
      </div>

      <table className="tkt" id="tkt">
        <thead>
          <tr>
            <th>
              <input
                ref={selectAllRef}
                type="checkbox"
                className="tkchk"
                id="chk-all"
                checked={tableState.allVisibleSelected}
                onChange={(event) => callLegacyAction('toggleSelectAll', event.currentTarget)}
              />
            </th>
            <th>Title</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Assignee</th>
            <th>Linked To</th>
            <th>Due</th>
            <th>ID</th>
          </tr>
        </thead>
        <tbody id="tkt-body" data-react-managed="true">
          {tableState.rows.length ? (
            tableState.rows.map((row) => <TicketRow key={row.id} row={row} />)
          ) : (
            <tr>
              <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--tm)', fontSize: '13px' }}>
                No tickets match the current filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  );
}
