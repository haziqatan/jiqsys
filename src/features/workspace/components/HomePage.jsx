import { useLayoutEffect, useRef } from 'react';
import { callLegacyAction } from '../../../lib/callLegacyAction.js';
import { hasWorkspacePermission } from '../../../lib/workspacePermissions.js';
import useLegacyHome from '../hooks/useLegacyHome.js';

function getEditableText(target) {
  return String(target?.textContent || '').replace(/\u00a0/g, ' ').replace(/\r?\n+/g, ' ').trim();
}

function HomeQuickNote({ note }) {
  const pendingFocusRef = useRef(null);
  const editorRefs = useRef(new Map());

  useLayoutEffect(() => {
    const pendingFocus = pendingFocusRef.current;
    if (!pendingFocus?.id) return;

    const element = editorRefs.current.get(pendingFocus.id);
    if (!element) return;

    element.focus();
    const range = document.createRange();
    range.selectNodeContents(element);
    range.collapse(!!pendingFocus.toStart);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    pendingFocusRef.current = null;
  }, [note.blocks]);

  function setEditorRef(id, element) {
    if (element) editorRefs.current.set(id, element);
    else editorRefs.current.delete(id);
  }

  function handleKeyDown(event, block) {
    const currentText = getEditableText(event.currentTarget);

    if (event.key === ' ' && block.type === 'text' && currentText === '[]') {
      event.preventDefault();
      pendingFocusRef.current = { id: block.id, toStart: true };
      callLegacyAction('convertHomeQuickNoteBlockToCheck', block.id);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const nextId = callLegacyAction('insertHomeQuickNoteBlockAfter', block.id, block.type === 'check' ? 'check' : 'text');
      if (nextId) pendingFocusRef.current = { id: nextId, toStart: true };
      return;
    }

    if (event.key === 'Backspace' && !currentText) {
      if (block.type === 'check' || note.blocks.length > 1) {
        event.preventDefault();
        const nextId = callLegacyAction('removeHomeQuickNoteBlock', block.id);
        if (nextId) pendingFocusRef.current = { id: nextId, toStart: true };
      }
    }
  }

  return (
    <>
      <div className="home-note-head">
        <p className="home-note-label">Quick Note</p>
        <span className="home-note-count" id="home-note-count" data-react-managed="true">{note.count}/180</span>
      </div>
      <div className="home-note-editor" id="home-note-editor" data-react-managed="true">
        {note.blocks.map((block, index) => (
          block.type === 'check' ? (
            <div className={`home-note-check-row${block.checked ? ' checked' : ''}`} id={`home-note-row-${block.id}`} key={block.id}>
              <button
                className="home-note-check-toggle"
                type="button"
                contentEditable={false}
                onClick={() => callLegacyAction('toggleHomeQuickNoteCheck', block.id)}
                aria-label="Toggle checklist item"
              >
                <svg viewBox="0 0 12 12"><polyline points="2 6.5 4.6 9 10 3.5" /></svg>
              </button>
              <div
                ref={(element) => setEditorRef(block.id, element)}
                className="home-note-check-text"
                contentEditable
                suppressContentEditableWarning
                spellCheck={false}
                data-home-note-edit={block.id}
                data-placeholder="Checklist item"
                onInput={(event) => callLegacyAction('setHomeQuickNoteBlockText', block.id, getEditableText(event.currentTarget))}
                onKeyDown={(event) => handleKeyDown(event, block)}
              >
                {block.text}
              </div>
            </div>
          ) : (
            <div
              ref={(element) => setEditorRef(block.id, element)}
              className="home-note-line"
              contentEditable
              suppressContentEditableWarning
              spellCheck={false}
              data-home-note-edit={block.id}
              data-placeholder={index === 0 ? 'Write a short note for today, a reminder, or a quick focus point...' : 'Add another note...'}
              onInput={(event) => callLegacyAction('setHomeQuickNoteBlockText', block.id, getEditableText(event.currentTarget))}
              onKeyDown={(event) => handleKeyDown(event, block)}
              key={block.id}
            >
              {block.text}
            </div>
          )
        ))}
      </div>
    </>
  );
}

export default function HomePage({ auth }) {
  const home = useLegacyHome();
  const canCreateTickets = hasWorkspacePermission(auth?.access, 'can_create_tickets');

  return (
    <div className="page active" id="page-home">
      <div style={{ width: '100%' }}>
        <div className="home-hero">
          <div className="home-welcome">
            <p className="home-welcome-kicker">Jiqsys Workspace</p>
            <h1 className="home-welcome-title">Good morning, Haziq.</h1>
            <p className="home-welcome-copy">
              Your integrated workflow hub for tickets, feature planning, testing, and system flow in one calmer workspace.
            </p>
          </div>
          <div className="home-note-card">
            <HomeQuickNote note={home.note} />
          </div>
        </div>

        <div className="home-grid" style={{ marginBottom: '26px' }}>
          <div className="card home-focus" id="home-focus-card" data-react-managed="true">
            {!home.top ? (
              <>
                <div className="home-focus-label">Top Priority Right Now</div>
                <div className="home-focus-title">No active tickets yet</div>
                <div className="home-focus-desc">Create your first ticket to surface the most important task here and start tracking workload by status.</div>
                <div style={{ marginTop: '18px' }}>
                  <button className="btn btn-s btn-sm" onClick={() => callLegacyAction('openNt', null)} disabled={!canCreateTickets}>New Ticket</button>
                </div>
              </>
            ) : (
              <>
                <div className="home-focus-label">Top Priority Right Now</div>
                <div className="home-focus-title">{home.top.title}</div>
                <div className="home-focus-meta">
                  <span dangerouslySetInnerHTML={{ __html: home.top.priorityHtml }} />
                  <span dangerouslySetInnerHTML={{ __html: home.top.statusHtml }} />
                  <span className="bdg bg">Due {home.top.due}</span>
                  <span className="bdg bg">{home.top.id}</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '14px' }}>
                  <span dangerouslySetInnerHTML={{ __html: home.top.modulesHtml }} />
                </div>
                <div className="home-focus-desc">{home.top.desc || 'No description added yet.'}</div>
                <div style={{ marginTop: '18px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button className="btn btn-s btn-sm" onClick={() => callLegacyAction('nav', 'tickets')}>View Tickets</button>
                </div>
              </>
            )}
          </div>
          <div className="card home-status-card">
            <div className="slb">Tickets By Status</div>
            <div className="home-chart" id="home-status-chart" data-react-managed="true">
              {home.chart.map((status) => (
                <div className="home-chart-row" key={status.id}>
                  <div className="home-chart-label">{status.name}</div>
                  <div className="home-chart-track">
                    <div className="home-chart-fill" style={{ width: `${status.width}%`, background: status.color }} />
                  </div>
                  <div className="home-chart-val">{status.count}</div>
                </div>
              ))}
              <div style={{ fontSize: '12px', color: 'var(--tm)', paddingTop: '2px' }}>
                {home.totalTickets} total ticket{home.totalTickets !== 1 ? 's' : ''}
              </div>
            </div>
            <div className="home-status-foot">
              <button className="btn btn-s btn-sm" onClick={() => callLegacyAction('nav', 'tickets')}>
                Open Tickets
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
