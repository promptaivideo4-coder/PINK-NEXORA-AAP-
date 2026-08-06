import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './contexts/LanguageContext.tsx';
import { LocationProvider } from './contexts/LocationContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <LanguageProvider>
        <LocationProvider>
          <App />
        </LocationProvider>
      </LanguageProvider>
    </ErrorBoundary>
  </StrictMode>,
);

