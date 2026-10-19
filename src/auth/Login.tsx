import { useState, type FormEvent } from 'react';
import { authService } from '../service';
import { ApiError } from '../model';
import type { User } from '../model';
import PasswordField from './Password';
import Logo from './Logo';

interface Props {
  onSuccess: (user: User) => void;
  onSwitch: () => void;
}

export default function Login({ onSuccess, onSwitch }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { user } = await authService.login({ email: email.trim(), password });
      onSuccess(user);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-card" onSubmit={handleSubmit} noValidate>
      <Logo />
      <h1>Welcome back</h1>
      <p className="auth-sub">Login to your account</p>

      <div className="field">
        <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email address"
          autoComplete="email"
          disabled={loading}
          required
        />
      </div>

      <PasswordField
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        disabled={loading}
      />

      <button type="button" className="link-btn align-right">
        Forgot password?
      </button>

      <button type="submit" className="btn-primary" disabled={loading || !email || !password}>
        {loading ? 'Logging in…' : 'Login'}
      </button>

      <div className="divider">or</div>

      <button type="button" className="btn-secondary" onClick={onSwitch} disabled={loading}>
        Create account
      </button>

      <p className="auth-footer">
        Don't have an account?{' '}
        <button type="button" className="link-btn" onClick={onSwitch}>
          Create account
        </button>
      </p>

      {error && (
        <div className="alert" role="alert">
          <strong>{error}</strong>
          {error === 'Invalid credentials' && <span>The email or password you entered is incorrect.</span>}
        </div>
      )}
    </form>
  );
}