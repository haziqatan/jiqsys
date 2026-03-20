import { useEffect, useState } from 'react';

function getInitialFeatures() {
  return Array.isArray(window.__jiqsysFeatures) ? window.__jiqsysFeatures : [];
}

export default function useLegacyFeatures() {
  const [features, setFeatures] = useState(getInitialFeatures);

  useEffect(() => {
    setFeatures(getInitialFeatures());

    function handleFeaturesChange(event) {
      setFeatures(Array.isArray(event.detail?.active) ? event.detail.active : []);
    }

    window.addEventListener('jiqsys:features-change', handleFeaturesChange);
    return () => window.removeEventListener('jiqsys:features-change', handleFeaturesChange);
  }, []);

  return features;
}
