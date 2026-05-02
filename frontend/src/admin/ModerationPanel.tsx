import { useState } from 'react';
import { adminApi } from '@/api/admin';
import { strings } from '@/theme/strings';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { useToast } from '@/ui/Toast';
import { ApiError } from '@/api/client';

export function ModerationPanel(): JSX.Element {
  const toast = useToast();
  const [crewId, setCrewId] = useState('');
  const [pirateId, setPirateId] = useState('');
  const [crewBusy, setCrewBusy] = useState(false);
  const [pirateBusy, setPirateBusy] = useState(false);

  const banCrew = async (): Promise<void> => {
    if (!crewId) return;
    if (!window.confirm(strings.admin.moderation.banConfirm(`Crew ${crewId}`))) return;
    setCrewBusy(true);
    try {
      await adminApi.banCrew(crewId);
      toast.push({
        message: strings.admin.moderation.bannedSuccess,
        variant: 'success',
        durationMs: 3000,
      });
      setCrewId('');
    } catch (e) {
      toast.push({
        message: e instanceof ApiError ? e.message : strings.toast.failed,
        variant: 'error',
        durationMs: 4000,
      });
    } finally {
      setCrewBusy(false);
    }
  };

  const banPirate = async (): Promise<void> => {
    if (!pirateId) return;
    if (!window.confirm(strings.admin.moderation.banConfirm(`Pirate ${pirateId}`))) return;
    setPirateBusy(true);
    try {
      await adminApi.banPirate(pirateId);
      toast.push({
        message: strings.admin.moderation.bannedSuccess,
        variant: 'success',
        durationMs: 3000,
      });
      setPirateId('');
    } catch (e) {
      toast.push({
        message: e instanceof ApiError ? e.message : strings.toast.failed,
        variant: 'error',
        durationMs: 4000,
      });
    } finally {
      setPirateBusy(false);
    }
  };

  return (
    <div>
      <h2>{strings.admin.moderation.heading}</h2>
      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <Card variant="deep" header={strings.admin.moderation.banCrew}>
          <Input
            label={strings.admin.moderation.crewIdLabel}
            value={crewId}
            onChange={(e) => setCrewId(e.target.value)}
          />
          <Button variant="danger" loading={crewBusy} onClick={banCrew} disabled={!crewId}>
            {strings.admin.moderation.banButton}
          </Button>
        </Card>
        <Card variant="deep" header={strings.admin.moderation.banPirate}>
          <Input
            label={strings.admin.moderation.pirateIdLabel}
            value={pirateId}
            onChange={(e) => setPirateId(e.target.value)}
          />
          <Button variant="danger" loading={pirateBusy} onClick={banPirate} disabled={!pirateId}>
            {strings.admin.moderation.banButton}
          </Button>
        </Card>
      </div>
    </div>
  );
}
