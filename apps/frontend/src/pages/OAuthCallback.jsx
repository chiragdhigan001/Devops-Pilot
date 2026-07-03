import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { setUserFromToken } = useAuth();
  const [error, setError] = useState('');

  const handleAuth = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const refreshToken = params.get('refreshToken');

    if (!token) {
      setError('OAuth authentication failed. No token received.');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
      return;
    }

    try {
      await setUserFromToken(token, refreshToken);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('OAuth authentication failed.');
      setTimeout(() => navigate('/login', { replace: true }), 3000);
    }
  }, [navigate, setUserFromToken]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void handleAuth();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, [handleAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-container to-primary-container flex items-center justify-center mx-auto mb-4 neon-glow">
          <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>rocket_launch</span>
        </div>
        {error ? (
          <>
            <p className="text-error font-mono text-sm">{error}</p>
            <p className="text-on-surface-variant font-mono text-xs mt-2">Redirecting to login...</p>
          </>
        ) : (
          <>
            <p className="text-on-surface font-headline text-lg">Authenticating...</p>
            <p className="text-on-surface-variant font-mono text-xs mt-2">Completing OAuth handshake</p>
          </>
        )}
      </div>
    </div>
  );
}
