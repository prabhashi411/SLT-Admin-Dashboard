import { useEffect, useRef, useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const { login } = useAuth();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Sync open prop with native <dialog> top-layer modal API
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      setError(null);
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  // Progressive enhancement fallback for light dismiss when closedby="any" is unsupported
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      if (isOpen) onClose();
    };
    dialog.addEventListener('close', handleClose);

    if (!('closedBy' in HTMLDialogElement.prototype)) {
      const outside = (e: PointerEvent) => {
        const r = dialog.getBoundingClientRect();
        return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
      };
      let pressedOutside = false;
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = outside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && outside(e)) dialog.close();
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      return () => {
        dialog.removeEventListener('close', handleClose);
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const ok = await login(username, password);
      if (ok) {
        setPassword('');
        onSuccess?.();
        onClose();
      } else {
        setError('Invalid username or password. Please try again.');
      }
    } catch {
      setError('Could not reach the backend on port 8000.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="cc-dialog cc-dialog-sm"
      aria-labelledby="login-dialog-title"
      {...({ closedby: 'any' } as Record<string, string>)}
    >
      <div className="cc-dialog-header">
        <h2 id="login-dialog-title" className="cc-dialog-title">
          <Lock size={18} style={{ color: 'var(--primary)' }} />
          Administrator Sign-In
        </h2>
        <button
          type="button"
          className="cc-dialog-close"
          onClick={onClose}
          aria-label="Close sign-in dialog"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="cc-dialog-body">
          <p style={{ fontSize: '0.84rem', color: 'var(--color-text-secondary)', margin: 0 }}>
            Sign in to view customer transcripts, manage external chatbots, or issue API keys.
          </p>

          {error && (
            <div className="cc-alert cc-alert-error">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <AlertCircle size={16} />
                {error}
              </span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="admin-username" className="form-label">
              Username
            </label>
            <input
              id="admin-username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-password" className="form-label">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              autoComplete="current-password"
              required
              autoFocus
            />
          </div>
        </div>

        <div className="cc-dialog-footer">
          <button
            type="button"
            className="cc-btn cc-btn-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="cc-btn cc-btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
