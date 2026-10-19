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

const MIN_PASSWORD = 8;

export default function Register({ onSuccess, onSwitch }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`);
      return;
    }

    setLoading(true);
    try {
      const { user } = await authService.register({
        name: name.trim(),
        email: email.trim(),
        password,
      });
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
      <h1>Create your account</h1>
      <p className="auth-sub">Join us and start shopping</p>

      <div className="field">
        <svg className="field-icon" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
        </svg>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          autoComplete="name"
          disabled={loading}
          required
        />
      </div>

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
        placeholder={`Password (min ${MIN_PASSWORD} characters)`}
        autoComplete="new-password"
        disabled={loading}
      />

      <button
        type="submit"
        className="btn-primary"
        disabled={loading || !name || !email || !password}
      >
        {loading ? 'Creating account…' : 'Create account'}
      </button>

      <p className="auth-footer">
        Already have an account?{' '}
        <button type="button" className="link-btn" onClick={onSwitch}>
          Login
        </button>
      </p>

      {(tooShort || error) && (
        <div className={error ? 'alert' : 'hint'} role={error ? 'alert' : undefined}>
          {error || `Password must be at least ${MIN_PASSWORD} characters.`}
        </div>
      )}
    </form>
  );
}