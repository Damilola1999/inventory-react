import { useState } from 'react';
import type { User } from '../model';
import Login from './Login';
import Register from './Register';
import './Auth.css';

interface Props {
  onAuthenticated?: (user: User) => void;
}

export default function AuthPage({ onAuthenticated }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');

  const handleSuccess = (user: User) => {
    // Replace with your router redirect, e.g. navigate(user.role === 'customer' ? '/shop' : '/dashboard')
    onAuthenticated?.(user);
  };

  return (
    <main className="auth-page">
      {mode === 'login' ? (
        <Login onSuccess={handleSuccess} onSwitch={() => setMode('register')} />
      ) : (
        <Register onSuccess={handleSuccess} onSwitch={() => setMode('login')} />
      )}
    </main>
  );
}