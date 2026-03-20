import { callLegacyAction } from '../../../lib/callLegacyAction.js';
import useLegacyGantt from '../hooks/useLegacyGantt.js';

const SCALE_LABELS = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  quarter: 'Quarter',
  year: 'Year',
};

function GanttHeader({ gantt }) {
  return (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--bdr)', position: 'sticky', top: 0, zIndex: 2 }}>
      <div
        className="glh"
        style={{
          width: `${gantt.lw}px`,
          minWidth: `${gantt.lw}px`,
          flexShrink: 0,
          height: `${gantt.headerH}px`,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        Ticket
      </div>
      <div
        style={{
          width: `${gantt.totalW}px`,
          flexShrink: 0,
          position: 'relative',
          height: `${gantt.headerH}px`,
          background: 'var(--bg)',
        }}
      >
        {gantt.headerSub.length ? (
          <>
            {gantt.headerMain.map((group) => (
              <div
                key={`${group.label}-${group.x}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: `${group.x}px`,
                  width: `${group.w}px`,
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRight: '1px solid var(--bdr)',
                  fontSize: '10.5px',
                  fontWeight: 600,
                  color: 'var(--t2)',
                  letterSpacing: '.04em',
                }}
              >
                {group.label}
              </div>
            ))}
            {gantt.headerSub.map((column) => (
              <div
                className="gsub"
                key={`${column.label}-${column.x}`}
                style={{
                  left: `${column.x}px`,
                  width: `${column.w}px`,
                  top: '32px',
                }}
              >
                {column.label}
              </div>
            ))}
          </>
        ) : (
          gantt.headerMain.map((group) => (
            <div
              className="gmon"
              key={`${group.label}-${group.x}`}
              style={{
                left: `${group.x}px`,
                width: `${group.w}px`,
              }}
            >
              {group.label}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function GanttRow({ gantt, row }) {
  return (
    <div
      style={{ display: 'flex', borderBottom: '1px solid var(--bdr)', cursor: 'pointer' }}
      onClick={() => callLegacyAction('openDw', row.id)}
    >
      <div
        className="glr"
        style={{
          width: `${gantt.lw}px`,
          minWidth: `${gantt.lw}px`,
          flexShrink: 0,
        }}
      >
        <span
          className="sdot"
          style={{
            background: row.statusColor,
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            flexShrink: 0,
          }}
        />
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: `${gantt.lw - 44}px`,
            }}
          >
            {row.title}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--tm)' }}>{row.assignee}</div>
        </div>
      </div>
      <div
        className="grr"
        style={{
          width: `${gantt.totalW}px`,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {gantt.gridLines.map((line) => (
          <div className="gdl" key={line} style={{ left: `${line}px` }} />
        ))}
        {gantt.todayOffset !== null ? <div className="gtoday" style={{ left: `${gantt.todayOffset}px` }} /> : null}
        {row.bar ? (
          <div
            className="gbar"
            style={{
              left: `${row.bar.left}px`,
              width: `${row.bar.width}px`,
              background: row.bar.background,
              color: row.bar.color,
              borderColor: row.bar.borderColor,
            }}
            title={row.bar.title}
          >
            {row.bar.label}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function GanttSection() {
  const gantt = useLegacyGantt();

  return (
    <div id="gv-inner" data-react-managed="true">
      <div className="gvc">
        <GanttHeader gantt={gantt} />

        {gantt.empty ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--tm)', fontSize: '13px' }}>
            No tickets match the current filters.
          </div>
        ) : (
          gantt.rows.map((row) => <GanttRow gantt={gantt} row={row} key={row.id} />)
        )}

        <div
          style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--bdr)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            background: 'var(--bg)',
          }}
        >
          <span style={{ fontSize: '11.5px', color: 'var(--tm)' }}>Scale: {SCALE_LABELS[gantt.scale] || 'Month'}</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: 'var(--red)' }}>
            <span style={{ width: '2px', height: '12px', background: 'var(--red)', opacity: 0.6, display: 'inline-block' }} />
            Today
          </span>
        </div>
      </div>
    </div>
  );
}
