import { useEffect, useState, useCallback } from 'react';
import { adminApi } from '@/api/admin';
import type { IslandStatus, IslandSummary } from '@/api/types';
import { strings } from '@/theme/strings';
import { Button } from '@/ui/Button';
import { Badge, statusTone } from '@/ui/Badge';
import { Skeleton } from '@/ui/Skeleton';
import { useToast } from '@/ui/Toast';
import { ApiError } from '@/api/client';
import { IslandModal } from './IslandModal';

export function IslandsTable(): JSX.Element {
  const toast = useToast();
  const [rows, setRows] = useState<IslandSummary[] | null>(null);
  const [editing, setEditing] = useState<IslandSummary | null>(null);
  const [creating, setCreating] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await adminApi.listIslands();
      setRows(data);
    } catch (e) {
      toast.push({
        message: e instanceof ApiError ? e.message : strings.common.error(),
        variant: 'error',
        durationMs: 5000,
      });
      setRows([]);
    }
  }, [toast]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onStatusChange = async (row: IslandSummary, status: IslandStatus): Promise<void> => {
    try {
      await adminApi.setStatus(row.id, status);
      toast.push({ message: strings.toast.saved, variant: 'success', durationMs: 2500 });
      await reload();
    } catch (e) {
      toast.push({
        message: e instanceof ApiError ? e.message : strings.toast.failed,
        variant: 'error',
        durationMs: 4000,
      });
    }
  };

  const onRebuildSandbox = async (row: IslandSummary): Promise<void> => {
    try {
      await adminApi.rebuildSandbox(row.id);
      toast.push({ message: strings.toast.saved, variant: 'success', durationMs: 2500 });
    } catch (e) {
      toast.push({
        message: e instanceof ApiError ? e.message : strings.toast.failed,
        variant: 'error',
        durationMs: 4000,
      });
    }
  };

  const onDelete = async (row: IslandSummary): Promise<void> => {
    if (!window.confirm(strings.admin.islands.confirmDelete)) return;
    try {
      await adminApi.deleteIsland(row.id);
      toast.push({ message: strings.toast.saved, variant: 'success', durationMs: 2500 });
      await reload();
    } catch (e) {
      toast.push({
        message: e instanceof ApiError ? e.message : strings.toast.failed,
        variant: 'error',
        durationMs: 4000,
      });
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0 }}>{strings.admin.islands.heading}</h2>
        <Button variant="primary" onClick={() => setCreating(true)}>
          {strings.admin.islands.newIsland}
        </Button>
      </div>

      {rows === null ? (
        <Skeleton height={240} />
      ) : (
        <table className="pc-admin__table">
          <thead>
            <tr>
              <th>{strings.admin.islands.title}</th>
              <th>{strings.admin.islands.category}</th>
              <th>{strings.admin.islands.difficulty}</th>
              <th>{strings.admin.islands.basePoints}</th>
              <th>{strings.admin.islands.status}</th>
              <th aria-label={strings.aria.actionsColumn} />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.title}</td>
                <td>{strings.voyage.categoryNames[r.category] ?? r.category}</td>
                <td>{strings.voyage.difficultyLabels[r.difficulty] ?? r.difficulty}</td>
                <td>{r.base_points}</td>
                <td>
                  <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                    <Badge tone={statusTone(r.status)}>{r.status}</Badge>
                    <select
                      value={r.status}
                      aria-label={strings.admin.islands.status}
                      onChange={(e) => onStatusChange(r, e.target.value as IslandStatus)}
                    >
                      <option value="draft">{strings.admin.islands.statusDraft}</option>
                      <option value="published">{strings.admin.islands.statusPublished}</option>
                      <option value="archived">{strings.admin.islands.statusArchived}</option>
                    </select>
                  </label>
                </td>
                <td>
                  <div className="pc-admin__row-actions">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>
                      {strings.admin.islands.editIsland}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onRebuildSandbox(r)}>
                      {strings.admin.islands.rebuildSandbox}
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => onDelete(r)}>
                      {strings.admin.islands.delete}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {creating || editing ? (
        <IslandModal
          mode={creating ? 'create' : 'edit'}
          summary={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={async () => {
            setCreating(false);
            setEditing(null);
            await reload();
          }}
        />
      ) : null}
    </div>
  );
}
