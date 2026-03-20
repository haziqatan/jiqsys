import { useEffect, useMemo, useState } from 'react';
import { callLegacyAction } from '../../../lib/callLegacyAction.js';
import { hasWorkspacePermission } from '../../../lib/workspacePermissions.js';
import useLegacyFeatures from '../hooks/useLegacyFeatures.js';
import useLegacyActivePage from '../hooks/useLegacyActivePage.js';

function FeatureNavItem({ feature, active, dragKey, setDragKey, openMenu, setOpenMenu, canEditFeatures, canDeleteFeatures }) {
  const isMenuOpen = openMenu === feature.fk;

  return (
    <div
      className={`ni ni-feat${active ? ' active' : ''}${isMenuOpen ? ' menu-open' : ''}${dragKey === feature.fk ? ' drag-over' : ''}`}
      data-page={feature.fk}
      data-feature-key={feature.fk}
      title={feature.name}
      aria-label={feature.name}
      onClick={() => {
        setOpenMenu(null);
        callLegacyAction('nav', feature.fk);
      }}
      onDragOver={(event) => {
        if (!canEditFeatures) return;
        event.preventDefault();
        event.currentTarget.classList.add('drag-over');
      }}
      onDragLeave={(event) => {
        event.currentTarget.classList.remove('drag-over');
      }}
      onDrop={async (event) => {
        if (!canEditFeatures) return;
        event.preventDefault();
        event.currentTarget.classList.remove('drag-over');
        if (!dragKey || dragKey === feature.fk) return;
        await callLegacyAction('reorderFeatures', dragKey, feature.fk);
        setDragKey(null);
      }}
    >
      <svg viewBox="0 0 24 24" dangerouslySetInnerHTML={{ __html: feature.iconSvg || '' }} />
      <span>{feature.name}</span>
      <div className="ni-feat-actions">
        <button
          className="ni-feat-grip"
          type="button"
          draggable={canEditFeatures}
          disabled={!canEditFeatures}
          onClick={(event) => event.stopPropagation()}
          onDragStart={() => setDragKey(feature.fk)}
          onDragEnd={(event) => {
            setDragKey(null);
            event.currentTarget.closest('.ni-feat')?.classList.remove('drag-over');
          }}
          aria-label="Reorder feature"
          title="Drag to reorder"
        >
          <svg viewBox="0 0 24 24"><line x1="9" y1="6" x2="9.01" y2="6" /><line x1="9" y1="12" x2="9.01" y2="12" /><line x1="9" y1="18" x2="9.01" y2="18" /><line x1="15" y1="6" x2="15.01" y2="6" /><line x1="15" y1="12" x2="15.01" y2="12" /><line x1="15" y1="18" x2="15.01" y2="18" /></svg>
        </button>
        <button
          className="ni-feat-more"
          type="button"
          disabled={!canDeleteFeatures}
          onClick={(event) => {
            event.stopPropagation();
            if (!canDeleteFeatures) return;
            setOpenMenu(isMenuOpen ? null : feature.fk);
          }}
          aria-label="Feature actions"
        >
          <svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="12" cy="19" r="1.7" /></svg>
        </button>
        <div className="feat-menu">
          <button
            className="feat-menu-btn"
            type="button"
            disabled={!canDeleteFeatures}
            onClick={(event) => {
              event.stopPropagation();
              setOpenMenu(null);
              callLegacyAction('softDeleteFeature', feature.fk);
            }}
          >
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" /></svg>
            Delete Feature
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeatureNavSection({ auth }) {
  const features = useLegacyFeatures();
  const activePage = useLegacyActivePage();
  const [dragKey, setDragKey] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);
  const canCreateFeatures = hasWorkspacePermission(auth?.access, 'can_create_features');
  const canEditFeatures = hasWorkspacePermission(auth?.access, 'can_edit_features');
  const canDeleteFeatures = hasWorkspacePermission(auth?.access, 'can_delete_features');

  useEffect(() => {
    function handleDocumentClick(event) {
      if (!event.target.closest('#feature-nav .ni-feat')) {
        setOpenMenu(null);
      }
    }

    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const featureItems = useMemo(
    () =>
      features.map((feature) => (
        <FeatureNavItem
          key={feature.id || feature.fk}
          feature={feature}
          active={activePage === feature.fk}
          dragKey={dragKey}
          setDragKey={setDragKey}
          openMenu={openMenu}
          setOpenMenu={setOpenMenu}
          canEditFeatures={canEditFeatures}
          canDeleteFeatures={canDeleteFeatures}
        />
      )),
    [activePage, canDeleteFeatures, canEditFeatures, dragKey, features, openMenu],
  );

  return (
    <div id="feature-sidebar-shell">
      <div className="feature-side-head">
        <div className="slbl" style={{ padding: 0, margin: 0 }}>Features</div>
        <button
          className="feat-add-btn"
          type="button"
          onClick={() => callLegacyAction('openFeatureModal')}
          aria-label="Add feature"
          title={canCreateFeatures ? 'Add feature' : 'You do not have permission to add features'}
          disabled={!canCreateFeatures}
        >
          +
        </button>
      </div>
      <div className="ss" id="feature-nav" data-react-managed="true">
        {featureItems.length ? featureItems : <div style={{ padding: '8px 10px', fontSize: '12px', color: 'var(--tm)' }}>No features yet.</div>}
      </div>
    </div>
  );
}
