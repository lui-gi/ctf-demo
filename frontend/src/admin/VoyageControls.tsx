import { useState } from 'react';
import { adminApi } from '@/api/admin';
import { strings } from '@/theme/strings';
import { Button } from '@/ui/Button';
import { Modal } from '@/ui/Modal';
import { useToast } from '@/ui/Toast';
import { ApiError } from '@/api/client';

type Action = 'freeze' | 'unfreeze' | 'recalc' | 'rebuild';

export function VoyageControls(): JSX.Element {
  const toast = useToast();
  const [pending, setPending] = useState<Action | null>(null);
  const [busy, setBusy] = useState<Action | null>(null);

  const run = async (action: Action): Promise<void> => {
    setBusy(action);
    try {
      if (action === 'freeze') await adminApi.freezeVoyage();
      if (action === 'unfreeze') await adminApi.unfreezeVoyage();
      if (action === 'recalc') await adminApi.recalcCharts();
      // rebuild-all is a future endpoint; for now no-op + notify
      if (action === 'rebuild') {
        toast.push({
          message: strings.toast.failed,
          variant: 'warning',
          durationMs: 4000,
        });
        return;
      }
      toast.push({ message: strings.toast.saved, variant: 'success', durationMs: 2500 });
    } catch (e) {
      toast.push({
        message: e instanceof ApiError ? e.message : strings.toast.failed,
        variant: 'error',
        durationMs: 4000,
      });
    } finally {
      setBusy(null);
      setPending(null);
    }
  };

  const confirmText = (a: Action): string => {
    switch (a) {
      case 'freeze': return strings.admin.voyage.freezeConfirm;
      case 'unfreeze': return strings.admin.voyage.freezeConfirm;
      case 'recalc': return strings.admin.voyage.recalcConfirm;
      case 'rebuild': return strings.admin.voyage.sandboxConfirm;
    }
  };

  return (
    <div>
      <h2>{strings.admin.voyage.heading}</h2>
      <div className="pc-admin__danger-zone">
        <Button
          variant="danger"
          size="lg"
          onClick={() => setPending('freeze')}
          loading={busy === 'freeze'}
        >
          {strings.admin.voyage.freezeButton}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setPending('unfreeze')}
          loading={busy === 'unfreeze'}
        >
          {strings.admin.voyage.unfreezeButton}
        </Button>
        <Button
          variant="secondary"
          onClick={() => setPending('recalc')}
          loading={busy === 'recalc'}
        >
          {strings.admin.voyage.recalcButton}
        </Button>
        <Button
          variant="ghost"
          onClick={() => setPending('rebuild')}
          loading={busy === 'rebuild'}
        >
          {strings.admin.voyage.sandboxRebuildAll}
        </Button>
      </div>

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        closeOnBackdrop={false}
        title={strings.common.confirm}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              {strings.common.cancel}
            </Button>
            <Button
              variant="danger"
              loading={busy !== null}
              onClick={() => pending && run(pending)}
            >
              {strings.common.confirm}
            </Button>
          </>
        }
      >
        <p>{pending ? confirmText(pending) : ''}</p>
      </Modal>
    </div>
  );
}
