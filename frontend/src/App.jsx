import React, { Suspense, lazy } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { CallProvider, useCall } from './context/CallContext';
import { UploadProvider, useUpload } from './context/UploadContext';
import AppRoutes from './routes/AppRoutes';
import ErrorBoundary from './components/common/ErrorBoundary';

const IncomingCallModal = lazy(() => import('./components/call/IncomingCallModal'));
const ActiveCallModal = lazy(() => import('./components/call/ActiveCallModal'));
const BackgroundUploadWidget = lazy(() => import('./components/common/BackgroundUploadWidget'));

const LazyCallOverlays = () => {
  const { incomingCall, activeCall } = useCall();
  if (!incomingCall && !activeCall) return null;
  return (
    <Suspense fallback={null}>
      {incomingCall && <IncomingCallModal />}
      {activeCall && <ActiveCallModal />}
    </Suspense>
  );
};

const LazyUploadOverlay = () => {
  const uploadCtx = useUpload();
  if (!uploadCtx?.uploads?.length) return null;
  return (
    <Suspense fallback={null}>
      <BackgroundUploadWidget />
    </Suspense>
  );
};

function App() {
  React.useEffect(() => {
    const preventDrag = (e) => {
      if (e.type === 'dragstart') {
        const tag = e.target?.tagName?.toUpperCase();
        if (tag === 'IMG' || tag === 'VIDEO' || tag === 'CANVAS') {
          e.preventDefault();
        }
      } else if (e.type === 'dragover' || e.type === 'drop') {
        e.preventDefault();
      }
    };

    window.addEventListener('dragstart', preventDrag);
    window.addEventListener('dragover', preventDrag);
    window.addEventListener('drop', preventDrag);

    return () => {
      window.removeEventListener('dragstart', preventDrag);
      window.removeEventListener('dragover', preventDrag);
      window.removeEventListener('drop', preventDrag);
    };
  }, []);

  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <CallProvider>
            <UploadProvider>
              <ErrorBoundary>
                <AppRoutes />
                <LazyCallOverlays />
                <LazyUploadOverlay />
              </ErrorBoundary>
            </UploadProvider>
          </CallProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
