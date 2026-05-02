import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { strings } from '@/theme/strings';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { useToast } from '@/ui/Toast';
import { ApiError } from '@/api/client';

interface LocationState {
  from?: { pathname: string };
}

export function Board(): JSX.Element {
  const { board } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      await board({ email, password });
      const dest = (location.state as LocationState | null)?.from?.pathname ?? '/voyage';
      navigate(dest);
    } catch (e2) {
      const msg = e2 instanceof ApiError ? e2.message : strings.common.error();
      setErr(msg);
      toast.push({ message: msg, variant: 'error', durationMs: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ maxWidth: 480, margin: '2rem auto' }} aria-labelledby="board-heading">
      <Card variant="deep">
        <h1 id="board-heading" className="display" style={{ marginTop: 0 }}>
          {strings.auth.boardHeading}
        </h1>
        <form onSubmit={onSubmit} noValidate>
          <Input
            label={strings.auth.emailLabel}
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label={strings.auth.passwordLabel}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={err ?? undefined}
          />
          <Button type="submit" variant="primary" fullWidth loading={submitting}>
            {strings.auth.boardSubmit}
          </Button>
        </form>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          {strings.auth.noAccount}{' '}
          <Link to="/sign-articles">{strings.nav.signLink}</Link>
        </p>
      </Card>
    </section>
  );
}
