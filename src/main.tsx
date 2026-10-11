import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../design-system/signal.css';
import Landing from './site/Landing';
import App from './app/App';
import Catalogue from './docs/Catalogue';

type Route = 'landing' | 'app' | 'system';

// Only "#/..." hashes are routes; plain "#section" anchors scroll within the current page.
function routeFrom(hash: string, fallback: Route): Route {
  if (!hash.startsWith('#/')) return fallback;
  if (hash.startsWith('#/app')) return 'app';
  if (hash.startsWith('#/system')) return 'system';
  return 'landing';
}

function Root() {
  const [route, setRoute] = useState<Route>(() => routeFrom(window.location.hash, 'landing'));

  useEffect(() => {
    const onHash = () => setRoute(r => {
      const next = routeFrom(window.location.hash, r);
      if (next !== r) window.scrollTo(0, 0);
      return next;
    });
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  if (route === 'app') return <App />;
  if (route === 'system') return <Catalogue />;
  return <Landing />;
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>
);
