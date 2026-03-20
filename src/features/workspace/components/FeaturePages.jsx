import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { callLegacyAction } from '../../../lib/callLegacyAction.js';
import { hasWorkspacePermission } from '../../../lib/workspacePermissions.js';
import useLegacyActivePage from '../hooks/useLegacyActivePage.js';
import useLegacyFeatures from '../hooks/useLegacyFeatures.js';

const RTE_BUTTONS = [
  { type: 'heading', tag: 'h1', label: 'H1', title: 'Heading 1' },
  { type: 'heading', tag: 'h2', label: 'H2', title: 'Heading 2' },
  { type: 'heading', tag: 'h3', label: 'H3', title: 'Heading 3' },
  { type: 'sep' },
  { type: 'cmd', cmd: 'bold', title: 'Bold', content: <b>B</b> },
  { type: 'cmd', cmd: 'italic', title: 'Italic', content: <i>I</i> },
  { type: 'cmd', cmd: 'underline', title: 'Underline', content: <u style={{ textDecoration: 'underline' }}>U</u> },
  { type: 'sep' },
  {
    type: 'action',
    action: 'image',
    title: 'Add Image',
    content: (
      <svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="14" height="12" rx="2" />
        <circle cx="6.5" cy="7" r="1.2" />
        <path d="M16 12l-3.5-3.5L5 15" />
      </svg>
    ),
  },
  { type: 'sep' },
  {
    type: 'cmd',
    cmd: 'insertUnorderedList',
    title: 'Bullet List',
    content: (
      <svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="6" y1="5" x2="16" y2="5" />
        <line x1="6" y1="9" x2="16" y2="9" />
        <line x1="6" y1="13" x2="16" y2="13" />
        <circle cx="2.5" cy="5" r="1" fill="currentColor" stroke="none" />
        <circle cx="2.5" cy="9" r="1" fill="currentColor" stroke="none" />
        <circle cx="2.5" cy="13" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    type: 'cmd',
    cmd: 'insertOrderedList',
    title: 'Numbered List',
    content: (
      <svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <line x1="6" y1="5" x2="16" y2="5" />
        <line x1="6" y1="9" x2="16" y2="9" />
        <line x1="6" y1="13" x2="16" y2="13" />
        <text x="1" y="6" fontSize="5" fontFamily="DM Sans" fill="currentColor" stroke="none" fontWeight="700">1</text>
        <text x="1" y="10" fontSize="5" fontFamily="DM Sans" fill="currentColor" stroke="none" fontWeight="700">2</text>
        <text x="1" y="14" fontSize="5" fontFamily="DM Sans" fill="currentColor" stroke="none" fontWeight="700">3</text>
      </svg>
    ),
  },
  { type: 'sep' },
  { type: 'table', rows: 2, cols: 2, label: '2x2', title: 'Insert 2x2 Table' },
  { type: 'table', rows: 1, cols: 2, label: '1x2', title: 'Insert 1x2 Table' },
];

function autoResize(target) {
  if (!target) return;
  target.style.height = 'auto';
  target.style.height = `${target.scrollHeight}px`;
}

function FeatureSummary({ summary }) {
  const visibleStatuses = (summary?.statuses || []).slice(0, 3);
  const overflowCount = Math.max(0, (summary?.statuses || []).length - visibleStatuses.length);

  return (
    <div className="feat-top-stats" data-react-managed="true">
      <div className="feat-top-summary-col">
        <div className="feat-top-summary-row">
          <span className="feat-top-summary-label">Linked tickets</span>
          <strong>{summary?.linkedTickets || 0}</strong>
        </div>
        <div className="feat-top-summary-row">
          <span className="feat-top-summary-label">Active statuses</span>
          <strong>{summary?.activeStatuses || 0}</strong>
        </div>
      </div>
      <div className="feat-top-status-col">
        {visibleStatuses.length ? visibleStatuses.map((status) => (
          <div className="feat-top-summary-row" key={status.id}>
            <span className="feat-top-summary-dot" style={{ background: status.color }} />
            <span className="feat-top-summary-label">{status.name}</span>
            <strong>{status.count}</strong>
          </div>
        )) : (
          <div className="feat-top-summary-row feat-top-summary-muted">
            <span className="feat-top-summary-dot" />
            <span className="feat-top-summary-label">No linked ticket activity yet</span>
          </div>
        )}
        {overflowCount ? (
          <div className="feat-top-summary-row feat-top-summary-muted">
            <span className="feat-top-summary-label">+{overflowCount} more statuses</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function LinkedTicketsPanel({ feature }) {
  const linkedTickets = feature.linkedTickets || [];

  if (!linkedTickets.length) {
    return (
      <div className="feat-panel-shell" data-react-managed="true">
        <div className="feat-panel-head">
          <span className="mtl-title">Linked Tickets</span>
          <span className="mtl-count">0 tickets</span>
        </div>
        <div className="feat-panel-scroll">
          <div className="mtl-empty">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--tm)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 10px' }}>
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            No tickets linked to this module
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="feat-panel-shell" data-react-managed="true">
      <div className="feat-panel-head">
        <span className="mtl-title">Linked Tickets</span>
        <span className="mtl-count">{linkedTickets.length} ticket{linkedTickets.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="feat-panel-scroll">
        {linkedTickets.map((ticket) => (
          <div className="mtl-row" key={ticket.id} onClick={() => callLegacyAction('openDw', ticket.id)} style={{ cursor: 'pointer' }}>
            <div className="mtl-dot" style={{ background: ticket.status.color }} />
            <div className="mtl-main">
              <div className="mtl-name">{ticket.title}</div>
              <div className="mtl-meta">
                <span style={{ color: 'var(--tm)' }}>{ticket.assignee}</span>
                {ticket.dueText ? (
                  <>
                    <span style={{ color: 'var(--bdr)' }}>·</span>
                    <span style={{ color: 'var(--tm)' }}>{ticket.dueText}</span>
                  </>
                ) : null}
                {ticket.refs.length ? (
                  <>
                    <span style={{ color: 'var(--bdr)' }}>·</span>
                    {ticket.refs.map((reference) => <span className="mtl-id" key={`${ticket.id}-${reference}`}>{reference}</span>)}
                  </>
                ) : null}
              </div>
            </div>
            <div className="mtl-right">
              <span style={{ fontSize: '11.5px', fontWeight: 500, color: ticket.priorityColor }}>{ticket.priority}</span>
              <span className="spl" style={{ background: `${ticket.status.color}1a`, color: ticket.status.color, borderColor: `${ticket.status.color}40` }}>
                <span className="sdot" style={{ background: ticket.status.color }} />
                {ticket.status.name}
              </span>
              <span className="mtl-id">{ticket.id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistPanel({ feature, canEditFeatures }) {
  const groups = feature.testGroups || [];

  useEffect(() => {
    document
      .querySelectorAll(`#${feature.fk}-tab-tests .tc-label`)
      .forEach((textarea) => autoResize(textarea));
  }, [feature.fk, groups]);

  if (!groups.length) {
    return (
      <div className="feat-panel-shell" data-react-managed="true">
        <div className="feat-panel-scroll feat-panel-scroll-main">
          <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--tm)', fontSize: '13px' }}>
            No test groups yet — click <strong>+ Add Test Group</strong> to get started.
          </div>
        </div>
        <div className="feat-panel-foot">
          <button className="btn btn-s" onClick={() => callLegacyAction('addTestGroup', feature.fk)} disabled={!canEditFeatures}>+ Add Test Group</button>
        </div>
      </div>
    );
  }

  return (
    <div className="feat-panel-shell" data-react-managed="true">
      <div id={`${feature.fk}-tests`} className="feat-panel-scroll feat-panel-scroll-main" data-react-managed="true">
        {groups.map((group) => (
          <div className={`tc-group${group.open ? ' open' : ''}`} id={`tcg-${group.id}`} key={group.id}>
            <div className="tc-group-hd" onClick={() => callLegacyAction('toggleTestGroup', feature.fk, group.id)}>
              <svg className="tc-chevron" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
              <input
                className="tc-group-name-input"
                value={group.name}
                disabled={!canEditFeatures}
                onClick={(event) => event.stopPropagation()}
                onChange={(event) => callLegacyAction('renameTestGroup', feature.fk, group.id, event.currentTarget.value)}
                placeholder="Group name"
              />
              <span style={{ fontSize: '11.5px', color: 'var(--tm)', flexShrink: 0, marginRight: '6px' }}>
                {group.items.length} item{group.items.length !== 1 ? 's' : ''}
              </span>
              <button className="tc-dup-btn" onClick={(event) => { event.stopPropagation(); callLegacyAction('duplicateTestGroup', feature.fk, group.id); }} title="Duplicate checklist" disabled={!canEditFeatures}>
                <svg viewBox="0 0 24 24"><rect x="9" y="9" width="10" height="10" rx="2" /><path d="M15 9V7a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /></svg>
              </button>
              <button className="tc-del-btn" onClick={(event) => { event.stopPropagation(); callLegacyAction('deleteTestGroup', feature.fk, group.id); }} title="Delete group" disabled={!canEditFeatures}>
                <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
              </button>
            </div>
            <div className="tc-body">
              {group.items.length ? group.items.map((item) => (
                <div className="tc-item" key={item.id}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--bdr)', flexShrink: 0, marginTop: '7px' }} />
                  <textarea
                    className="tc-label"
                    id={`tci-${item.id}`}
                    rows="1"
                    value={item.label}
                    disabled={!canEditFeatures}
                    placeholder="Describe this test case…"
                    onChange={(event) => callLegacyAction('editTestItem', feature.fk, group.id, item.id, event.currentTarget.value)}
                    onInput={(event) => autoResize(event.currentTarget)}
                  />
                  <button className="tc-item-del" onClick={() => callLegacyAction('deleteTestItem', feature.fk, group.id, item.id)} title="Remove" disabled={!canEditFeatures}>
                    <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                  </button>
                </div>
              )) : (
                <div className="tc-empty">No test cases yet.</div>
              )}
              <button className="tc-add-btn" onClick={() => callLegacyAction('addTestItem', feature.fk, group.id)} disabled={!canEditFeatures}>
                <svg viewBox="0 0 24 24" style={{ width: '13px', height: '13px', stroke: 'currentColor', fill: 'none', strokeWidth: 2, strokeLinecap: 'round' }}>
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add test case
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="feat-panel-foot">
        <button className="btn btn-s" onClick={() => callLegacyAction('addTestGroup', feature.fk)} disabled={!canEditFeatures}>+ Add Test Group</button>
      </div>
    </div>
  );
}

function FeatureDetailsPanel({ feature, isActive, activeTab, canEditFeatures }) {
  const detail = feature.detail || { canvases: [], activeCanvasId: null, sidebarCollapsed: false };
  const activeCanvas = detail.canvases.find((canvas) => canvas.id === detail.activeCanvasId) || detail.canvases[0] || null;
  const editorBodyRef = useRef(null);
  const mountedCanvasIdRef = useRef(null);

  useLayoutEffect(() => {
    if (!isActive || activeTab !== 'details' || !activeCanvas || !editorBodyRef.current) return;
    if (mountedCanvasIdRef.current === activeCanvas.id) return;

    editorBodyRef.current.innerHTML = activeCanvas.content || '';
    mountedCanvasIdRef.current = activeCanvas.id;
    callLegacyAction('rteHideTableCtrl', feature.fk);
    callLegacyAction('rteHideSlashMenu', feature.fk);
    callLegacyAction('rteCheckTable', feature.fk);
    callLegacyAction('rteUpdateToolbar', feature.fk);
  }, [isActive, activeTab, activeCanvas?.id, activeCanvas?.content, feature.fk]);

  useEffect(() => {
    if (!isActive || activeTab !== 'details') return undefined;

    function handleResize() {
      callLegacyAction('rteCheckTable', feature.fk);
      callLegacyAction('rtePositionSlashMenu', feature.fk);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isActive, activeTab, feature.fk]);

  const sidebarToggleTitle = detail.sidebarCollapsed ? 'Show canvas sidebar' : 'Hide canvas sidebar';

  return (
    <div className="feat-detail-shell">
      {!detail.sidebarCollapsed ? (
        <aside className="feat-detail-side">
          <div className="feat-detail-head">
            <div className="feat-detail-copy">
              <div className="feat-detail-eyebrow">Canvas Stack</div>
              <div className="feat-detail-title">{activeCanvas?.title || 'Canvas 1'}</div>
            </div>
          </div>
          <div className="feat-detail-top">
            <button className="feat-canvas-add" type="button" onClick={() => callLegacyAction('addFeatureCanvas', feature.fk)} disabled={!canEditFeatures}>
              <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              <span>New Canvas</span>
            </button>
          </div>
          <div className="feat-canvas-list">
            {detail.canvases.map((canvas) => (
              <div
                className={`feat-canvas-item${canvas.id === detail.activeCanvasId ? ' active' : ''}`}
                key={canvas.id}
                onClick={() => callLegacyAction('selectFeatureCanvas', feature.fk, canvas.id)}
              >
                <div className="feat-canvas-top">
                  <div className="feat-canvas-dot">
                    <svg viewBox="0 0 24 24"><path d="M7 3h7l5 5v13H7z" /><polyline points="14 3 14 8 19 8" /></svg>
                  </div>
                  <input
                    className="feat-canvas-name"
                    value={canvas.title}
                    disabled={!canEditFeatures}
                    placeholder="Canvas title"
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => callLegacyAction('renameFeatureCanvas', feature.fk, canvas.id, event.currentTarget.value)}
                  />
                  <button
                    className="feat-canvas-del"
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      callLegacyAction('deleteFeatureCanvas', feature.fk, canvas.id);
                    }}
                    disabled={!canEditFeatures || detail.canvases.length === 1}
                    aria-label="Delete canvas"
                  >
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
                  </button>
                </div>
                <div className="feat-canvas-meta">
                  Canvas {canvas.index} · {canvas.preview.slice(0, 52)}{canvas.preview.length > 52 ? '...' : ''}
                </div>
              </div>
            ))}
          </div>
        </aside>
      ) : null}

      <div className="feat-detail-main">
        <div
          className="feat-notes-wrap"
          id={`${feature.fk}-rte-wrap`}
          onMouseLeave={() => callLegacyAction('rteHideTableCtrl', feature.fk)}
        >
          <div className="rte-toolbar" id={`rte-tb-${feature.fk}`}>
            <button
              className="rte-sidebar-btn"
              title={sidebarToggleTitle}
              disabled={!canEditFeatures}
              onMouseDown={(event) => {
                event.preventDefault();
                if (!canEditFeatures) return;
                callLegacyAction('toggleFeatureCanvasSidebar', feature.fk);
              }}
            >
              <svg viewBox="0 0 24 24">
                {detail.sidebarCollapsed ? (
                  <>
                    <polyline points="9 18 15 12 9 6" />
                    <line x1="4" y1="5" x2="4" y2="19" />
                  </>
                ) : (
                  <>
                    <polyline points="15 18 9 12 15 6" />
                    <line x1="20" y1="5" x2="20" y2="19" />
                  </>
                )}
              </svg>
            </button>
            <div className="rte-sep" />
            {RTE_BUTTONS.map((button, index) => {
              if (button.type === 'sep') return <div className="rte-sep" key={`sep-${index}`} />;
              if (button.type === 'heading') {
                return (
                  <button
                    className="rte-btn wide"
                    key={button.tag}
                    title={button.title}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      if (!canEditFeatures) return;
                      callLegacyAction('rteHeading', feature.fk, button.tag);
                    }}
                    disabled={!canEditFeatures}
                  >
                    {button.label}
                  </button>
                );
              }
              if (button.type === 'cmd') {
                return (
                  <button
                    className="rte-btn"
                    id={`rteb-${feature.fk}-${button.cmd}`}
                    key={button.cmd}
                    title={button.title}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      if (!canEditFeatures) return;
                      callLegacyAction('rteCmd', feature.fk, button.cmd);
                    }}
                    disabled={!canEditFeatures}
                  >
                    {button.content}
                  </button>
                );
              }
              if (button.type === 'action') {
                return (
                  <button
                    className="rte-btn"
                    key={button.action}
                    title={button.title}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      if (!canEditFeatures) return;
                      callLegacyAction('rteAction', feature.fk, button.action);
                    }}
                    disabled={!canEditFeatures}
                  >
                    {button.content}
                  </button>
                );
              }
              return (
                <button
                  className="rte-btn wide"
                  key={`${button.rows}x${button.cols}`}
                  title={button.title}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    if (!canEditFeatures) return;
                    callLegacyAction('rteInsertTable', feature.fk, button.rows, button.cols);
                  }}
                  disabled={!canEditFeatures}
                >
                  ⊞ {button.label}
                </button>
              );
            })}
          </div>

          <input type="file" id={`rte-file-${feature.fk}`} accept="image/*" style={{ display: 'none' }} onChange={(event) => callLegacyAction('rtePickImage', event, feature.fk)} />
          <div
            ref={editorBodyRef}
            className="rte-body"
            id={`rte-${feature.fk}`}
            contentEditable={canEditFeatures}
            suppressContentEditableWarning
            data-placeholder="Describe this feature — goals, scope, requirements, edge cases, open questions…"
            onInput={() => callLegacyAction('rteInput', feature.fk)}
            onKeyDown={(event) => callLegacyAction('rteKey', event, feature.fk)}
            onMouseUp={() => {
              callLegacyAction('rteRememberSelection', feature.fk);
              callLegacyAction('rteUpdateToolbar', feature.fk);
              callLegacyAction('rteUpdateSlashMenu', feature.fk);
            }}
            onKeyUp={() => {
              callLegacyAction('rteRememberSelection', feature.fk);
              callLegacyAction('rteCheckTable', feature.fk);
              callLegacyAction('rteUpdateSlashMenu', feature.fk);
              callLegacyAction('rteUpdateToolbar', feature.fk);
            }}
            onClick={(event) => {
              const link = event.target.closest('a[href]');
              if (link && editorBodyRef.current?.contains(link)) {
                const selection = window.getSelection();
                if (!(selection && selection.toString().trim())) {
                  event.preventDefault();
                  window.open(link.href, '_blank', 'noopener,noreferrer');
                }
              }
              callLegacyAction('rteRememberSelection', feature.fk);
              callLegacyAction('rteCheckTable', feature.fk);
              callLegacyAction('rteUpdateSlashMenu', feature.fk);
            }}
            onPaste={(event) => callLegacyAction('rteHandlePaste', event, feature.fk)}
            onScroll={() => {
              callLegacyAction('rteCheckTable', feature.fk);
              callLegacyAction('rtePositionSlashMenu', feature.fk);
            }}
            onMouseMove={(event) => {
              const cell = event.target.closest('td,th');
              if (cell && editorBodyRef.current?.contains(cell)) {
                callLegacyAction('rteCheckTable', feature.fk, cell);
              }
            }}
            onDragOver={(event) => {
              if ([...(event.dataTransfer?.files || [])].some((file) => file.type.startsWith('image/'))) {
                event.preventDefault();
                event.currentTarget.classList.add('drop-active');
              }
            }}
            onDragLeave={(event) => event.currentTarget.classList.remove('drop-active')}
            onDrop={(event) => {
              const files = [...(event.dataTransfer?.files || [])].filter((file) => file.type.startsWith('image/'));
              event.currentTarget.classList.remove('drop-active');
              if (!files.length) return;
              event.preventDefault();
              const range = callLegacyAction('rteRangeFromPoint', event.clientX, event.clientY, event.currentTarget);
              files.forEach((file, index) => callLegacyAction('rteInsertImageFile', feature.fk, file, index === 0 ? range : null));
            }}
          />
          <div className="rte-tbl-ctrl" id={`rte-tblctrl-${feature.fk}`} />
          <div className="rte-slash-menu" id={`rte-slash-${feature.fk}`} />
        </div>
      </div>
    </div>
  );
}

function FeaturePage({ feature, activePage, activeTab, onTabChange, access }) {
  const descriptionRef = useRef(null);
  const isActive = activePage === feature.fk;
  const canEditFeatures = hasWorkspacePermission(access, 'can_edit_features');

  useEffect(() => {
    if (descriptionRef.current) {
      callLegacyAction('autosizeFeatureDescription', descriptionRef.current);
    }
  }, [feature.description]);

  useEffect(() => {
    callLegacyAction('renderFeaturePageIconControls', feature.fk);
  }, [feature.fk, feature.iconSvg, feature.name, feature.description]);

  useEffect(() => {
    if (!isActive) return;
    if (activeTab === 'details') {
      callLegacyAction('rteUpdateToolbar', feature.fk);
      callLegacyAction('rteHideSlashMenu', feature.fk);
      callLegacyAction('rteHideTableCtrl', feature.fk);
    }
  }, [isActive, activeTab, feature.fk]);

  return (
    <div className={`page feature-page${isActive ? ' active' : ''}`} id={`page-${feature.fk}`} data-react-managed="true">
      <div className="feat-page-shell">
        <div className="feat-top">
          <div className="feat-top-main">
            <div className="feat-meta-icon-wrap">
              <button
                className="feat-meta-icon-btn"
                id={`${feature.fk}-icon-trigger`}
                type="button"
                onClick={(event) => {
                  if (!canEditFeatures) return;
                  callLegacyAction('toggleFeaturePageIconPicker', feature.fk, event);
                }}
                aria-label="Change feature icon"
                title="Change feature icon"
                disabled={!canEditFeatures}
              >
                <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: feature.iconSvg || '' }} />
              </button>
              <div className="feat-icon-picker" id={`${feature.fk}-icon-picker`}>
                <div className="feat-icon-picker-title">Choose Icon</div>
                <div className="feature-icon-grid feat-icon-picker-grid" id={`${feature.fk}-icon-grid`} />
              </div>
            </div>
            <div className="feat-top-copy">
              <input
                className="feat-meta-title"
                value={feature.name || ''}
                placeholder="Feature title"
                disabled={!canEditFeatures}
                onChange={(event) => callLegacyAction('updateFeatureMeta', feature.fk, 'name', event.currentTarget.value)}
              />
              <textarea
                ref={descriptionRef}
                className="feat-meta-desc"
                rows="1"
                maxLength="140"
                value={feature.description || ''}
                disabled={!canEditFeatures}
                placeholder="Add a short description for this feature"
                onChange={(event) => {
                  callLegacyAction('updateFeatureMeta', feature.fk, 'description', event.currentTarget.value);
                  callLegacyAction('autosizeFeatureDescription', event.currentTarget);
                }}
              />
            </div>
          </div>
          <FeatureSummary summary={feature.summary} />
        </div>

        <div className="feat-page-body">
          <div className="feat-tabs">
            <button className={`feat-tab${activeTab === 'tickets' ? ' active' : ''}`} onClick={() => onTabChange('tickets')}>Linked Tickets</button>
            <button className={`feat-tab${activeTab === 'details' ? ' active' : ''}`} onClick={() => onTabChange('details')}>Feature Details</button>
            <button className={`feat-tab${activeTab === 'tests' ? ' active' : ''}`} onClick={() => onTabChange('tests')}>Checklist</button>
          </div>

          <div id={`${feature.fk}-tab-tickets`} className={`feat-tab-panel${activeTab === 'tickets' ? ' active' : ''}`}>
            <div id={`${feature.fk}-ticket-list`} data-react-managed="true">
              <LinkedTicketsPanel feature={feature} />
            </div>
          </div>

          <div id={`${feature.fk}-tab-details`} className={`feat-tab-panel${activeTab === 'details' ? ' active' : ''}`}>
            <div id={`${feature.fk}-editor-wrap`} data-react-managed="true">
              <FeatureDetailsPanel feature={feature} isActive={isActive} activeTab={activeTab} canEditFeatures={canEditFeatures} />
            </div>
          </div>

          <div id={`${feature.fk}-tab-tests`} className={`feat-tab-panel${activeTab === 'tests' ? ' active' : ''}`}>
            <ChecklistPanel feature={feature} canEditFeatures={canEditFeatures} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FeaturePages({ auth }) {
  const features = useLegacyFeatures();
  const activePage = useLegacyActivePage();
  const [tabsByFeature, setTabsByFeature] = useState({});

  useEffect(() => {
    function handleActivePageChange(event) {
      const nextPage = typeof event.detail === 'string' ? event.detail : '';
      if (nextPage.startsWith('feature-')) {
        setTabsByFeature((current) => ({ ...current, [nextPage]: 'tickets' }));
      }
    }

    window.addEventListener('jiqsys:active-page-change', handleActivePageChange);
    return () => window.removeEventListener('jiqsys:active-page-change', handleActivePageChange);
  }, [activePage]);

  return (
    <div id="dynamic-feature-pages" data-react-managed="true">
      {features.map((feature) => (
        <FeaturePage
          key={feature.fk}
          feature={feature}
          activePage={activePage}
          activeTab={tabsByFeature[feature.fk] || 'tickets'}
          onTabChange={(tab) => setTabsByFeature((current) => ({ ...current, [feature.fk]: tab }))}
          access={auth?.access}
        />
      ))}
    </div>
  );
}
