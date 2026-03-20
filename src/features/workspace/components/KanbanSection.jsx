import { callLegacyAction } from '../../../lib/callLegacyAction.js';
import useLegacyKanban from '../hooks/useLegacyKanban.js';

function KanbanCard({ card }) {
  return (
    <div className="kcard" data-tid={card.id} id={`kc-${card.id}`} onClick={() => callLegacyAction('openDw', card.id)}>
      <div className="kcard-ttl">{card.title}</div>
      <div className="kcard-meta">
        <span className="kcard-id">{card.id}</span>
        <span dangerouslySetInnerHTML={{ __html: card.priorityHtml }} />
        <span style={{ marginLeft: 'auto', fontSize: '11.5px', color: 'var(--tm)' }}>{card.assignee}</span>
      </div>
      {(card.modulesHtml || card.refsHtml) ? (
        <div className="kcard-modules">
          <span dangerouslySetInnerHTML={{ __html: `${card.modulesHtml}${card.refsHtml}` }} />
        </div>
      ) : null}
      {card.dueText ? <div className="kcard-due">{card.dueText}</div> : null}
    </div>
  );
}

export default function KanbanSection() {
  const columns = useLegacyKanban();

  return (
    <div className="kvw" id="kv-board" data-react-managed="true">
      {columns.map((column) => (
        <div className="kvc" data-sid={column.id} key={column.id}>
          <div className="kvch">
            <span className="sdot" style={{ background: column.color, width: '8px', height: '8px' }} />
            <span className="kvct">{column.name}</span>
            <span className="kvcc">{column.cards.length}</span>
          </div>
          <div className="kvcb" id={`kvb-${column.id}`}>
            {column.cards.map((card) => <KanbanCard key={card.id} card={card} />)}
          </div>
          <div className="kvadd" onClick={() => callLegacyAction('openNt', column.id)}>
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add ticket
          </div>
        </div>
      ))}
    </div>
  );
}
