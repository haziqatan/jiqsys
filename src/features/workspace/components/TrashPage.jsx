import { useEffect, useRef } from 'react';
import { callLegacyAction } from '../../../lib/callLegacyAction.js';
import useLegacyTrash from '../hooks/useLegacyTrash.js';

function TrashTicketRow({ ticket }) {
  return (
    <tr className={ticket.selected ? 'row-sel' : ''}>
      <td>
        <input
          type="checkbox"
          className="tkchk"
          checked={ticket.selected}
          onChange={(event) => callLegacyAction('toggleTrashRow', ticket.id, event.currentTarget)}
        />
      </td>
      <td><div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--t2)' }}>{ticket.title}</div></td>
      <td><span dangerouslySetInnerHTML={{ __html: ticket.statusHtml }} /></td>
      <td><span dangerouslySetInnerHTML={{ __html: ticket.priorityHtml }} /></td>
      <td style={{ fontSize: '13px', color: 'var(--t2)' }}>{ticket.assignee}</td>
      <td style={{ fontSize: '12px', color: 'var(--tm)', whiteSpace: 'nowrap' }}>{ticket.deletedAt}</td>
      <td>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="trash-restore-btn" onClick={() => callLegacyAction('restoreTicket', ticket.id)}>
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" /></svg>
            Restore
          </button>
          <button className="trash-del-btn" onClick={() => callLegacyAction('permanentDelete', ticket.id)}>
            <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function TrashPage() {
  const trash = useLegacyTrash();
  const selectAllRef = useRef(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = trash.partiallySelected;
    }
  }, [trash.partiallySelected]);

  return (
    <div className="page" id="page-trash">
      <div style={{ maxWidth: '880px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '16px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '.07em', textTransform: 'uppercase', color: 'var(--tm)', marginBottom: '6px' }}>System</div>
            <div style={{ fontSize: '26px', fontWeight: 600, letterSpacing: '-.5px' }}>Trash</div>
            <div style={{ fontSize: '13.5px', color: 'var(--t2)', marginTop: '5px' }}>Deleted tickets and features are kept here. Restore them when needed.</div>
          </div>
          <button className="btn btn-s" id="empty-trash-btn" onClick={() => callLegacyAction('emptyTrash')} style={{ flexShrink: 0, borderColor: '#fcd4d0', color: 'var(--red)', marginTop: '4px', display: trash.hasTrashTickets ? 'inline-flex' : 'none' }}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
            Empty Trash
          </button>
        </div>

        <div id="trash-empty-state" data-react-managed="true" style={{ display: trash.isEmpty ? 'block' : 'none', textAlign: 'center', padding: '64px 0' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--bg)', border: '1px solid var(--bdr)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tm)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
          </div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--t2)' }}>Trash is empty</div>
          <div style={{ fontSize: '12.5px', color: 'var(--tm)', marginTop: '4px' }}>Deleted tickets and features will appear here</div>
        </div>

        <div id="trash-bulk-bar" data-react-managed="true" style={{ display: trash.selectedIds.length ? 'flex' : 'none', alignItems: 'center', gap: '10px', padding: '8px 14px', background: 'var(--t1)', borderRadius: '9px', marginBottom: '10px' }}>
          <span id="trash-bulk-cnt" style={{ fontSize: '13px', fontWeight: 500, color: '#fff' }}>{trash.selectedIds.length} selected</span>
          <span style={{ flex: 1 }} />
          <button className="bulk-btn" onClick={() => callLegacyAction('bulkRestore')}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" /></svg>
            Restore
          </button>
          <button className="bulk-btn" style={{ color: 'var(--red)', background: '#fff' }} onClick={() => callLegacyAction('bulkPermanentDelete')}>
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /></svg>
            Delete forever
          </button>
          <button className="bulk-btn bulk-btn-ghost" onClick={() => callLegacyAction('clearTrashSelection')}>Cancel</button>
        </div>

        <div id="trash-table-wrap" data-react-managed="true" className="card" style={{ padding: 0, overflow: 'hidden', display: trash.hasTrashTickets ? 'block' : 'none' }}>
          <table className="tkt" id="trash-tkt">
            <thead>
              <tr>
                <th><input ref={selectAllRef} type="checkbox" className="tkchk" id="trash-chk-all" checked={trash.allSelected} onChange={(e) => callLegacyAction('toggleTrashSelectAll', e.currentTarget)} /></th>
                <th>Title</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Deleted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="trash-body" data-react-managed="true">
              {trash.tickets.map((ticket) => <TrashTicketRow key={ticket.id} ticket={ticket} />)}
            </tbody>
          </table>
        </div>

        <div id="feature-trash-wrap" data-react-managed="true" className="card" style={{ display: trash.hasDeletedFeatures ? 'block' : 'none', padding: '18px', marginTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>Deleted Features</div>
              <div style={{ fontSize: '12px', color: 'var(--tm)', marginTop: '2px' }}>Soft-deleted features are hidden from the sidebar until restored.</div>
            </div>
            <div id="feature-trash-count" style={{ fontSize: '12px', color: 'var(--tm)' }}>
              {trash.features.length} feature{trash.features.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div id="feature-trash-list" data-react-managed="true">
            {trash.features.map((feature, index) => (
              <div key={feature.key} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 2px', borderTop: index ? '1px solid #f0eeea' : 'none' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'var(--sb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--t2)', flexShrink: 0 }}>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" dangerouslySetInnerHTML={{ __html: feature.iconSvg }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--t1)' }}>{feature.name}</div>
                  <div style={{ fontSize: '12px', color: 'var(--tm)', marginTop: '2px' }}>{feature.description}</div>
                </div>
                <button className="trash-restore-btn" onClick={() => callLegacyAction('restoreFeature', feature.key)}>
                  <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.5" /></svg>
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
