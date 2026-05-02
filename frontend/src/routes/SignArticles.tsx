import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { strings } from '@/theme/strings';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { useToast } from '@/ui/Toast';
import { ApiError } from '@/api/client';

export function SignArticles(): JSX.Element {
  const { signArticles } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [handle, setHandle] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setErr(null);
    setSubmitting(true);
    try {
      await signArticles({ email, handle, password });
      navigate('/voyage');
    } catch (e2) {
      const msg = e2 instanceof ApiError ? e2.message : strings.common.error();
      setErr(msg);
      toast.push({ message: msg, variant: 'error', durationMs: 5000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section style={{ maxWidth: 480, margin: '2rem auto' }} aria-labelledby="sa-heading">
      <Card variant="deep">
        <h1 id="sa-heading" className="display" style={{ marginTop: 0 }}>
          {strings.auth.signArticlesHeading}
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
            label={strings.auth.handleLabel}
            autoComplete="username"
            required
            minLength={2}
            maxLength={32}
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
          />
          <Input
            label={strings.auth.passwordLabel}
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={err ?? undefined}
          />
          <Button type="submit" variant="primary" fullWidth loading={submitting}>
            {strings.auth.signArticlesSubmit}
          </Button>
        </form>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
          {strings.auth.haveAccount}{' '}
          <Link to="/board">{strings.nav.boardLink}</Link>
        </p>
      </Card>
    </section>
  );
}
