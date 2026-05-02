import { useEffect, useState, useCallback } from 'react';
import { adminApi, type SubmissionsFilter } from '@/api/admin';
import type { AdminSubmissionRow } from '@/api/types';
import { strings } from '@/theme/strings';
import { Input } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { Badge } from '@/ui/Badge';
import { Skeleton } from '@/ui/Skeleton';
import { useToast } from '@/ui/Toast';
import { ApiError } from '@/api/client';

type CorrectFilter = 'all' | 'correct' | 'incorrect';

export function SubmissionsLog(): JSX.Element {
  const toast = useToast();
  const [rows, setRows] = useState<AdminSubmissionRow[] | null>(null);
  const [crewId, setCrewId] = useState('');
  const [islandId, setIslandId] = useState('');
  const [correct, setCorrect] = useState<CorrectFilter>('all');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const load = useCallback(async () => {
    setRows(null);
    const filter: SubmissionsFilter = {
      crew_id: crewId || undefined,
      island_id: islandId || undefined,
      from: from || undefined,
      to: to || undefined,
    };
    if (correct === 'correct') filter.is_correct = true;
    if (correct === 'incorrect') filter.is_correct = false;
    try {
      const data = await adminApi.submissions(filter);
      setRows(data);
    } catch (e) {
      toast.push({
        message: e instanceof ApiError ? e.message : strings.common.error(),
        variant: 'error',
        durationMs: 5000,
      });
      setRows([]);
    }
  }, [crewId, islandId, correct, from, to, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div>
      <h2>{strings.admin.submissions.heading}</h2>
      <div className="pc-admin__filters">
        <Input
          label={strings.admin.submissions.filterCrew}
          value={crewId}
          onChange={(e) => setCrewId(e.target.value)}
        />
        <Input
          label={strings.admin.submissions.filterIsland}
          value={islandId}
          onChange={(e) => setIslandId(e.target.value)}
        />
        <label className="pc-field">
          <span className="pc-field__label">{strings.admin.submissions.filterCorrect}</span>
          <select
            value={correct}
            onChange={(e) => setCorrect(e.target.value as CorrectFilter)}
            className="pc-field__input"
          >
            <option value="all">{strings.admin.submissions.all}</option>
            <option value="correct">{strings.admin.submissions.correctOnly}</option>
            <option value="incorrect">{strings.admin.submissions.incorrectOnly}</option>
          </select>
        </label>
        <Input
          label={strings.admin.submissions.filterDateFrom}
          type="datetime-local"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
        />
        <Input
          label={strings.admin.submissions.filterDateTo}
          type="datetime-local"
          value={to}
          onChange={(e) => setTo(e.target.value)}
        />
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <Button variant="primary" onClick={load}>
            {strings.common.retry}
          </Button>
        </div>
      </div>

      {rows === null ? (
        <Skeleton height={200} />
      ) : rows.length === 0 ? (
        <p>{strings.admin.submissions.empty}</p>
      ) : (
        <table className="pc-admin__table">
          <thead>
            <tr>
              <th>{strings.admin.submissions.column.when}</th>
              <th>{strings.admin.submissions.column.crew}</th>
              <th>{strings.admin.submissions.column.pirate}</th>
              <th>{strings.admin.submissions.column.island}</th>
              <th>{strings.admin.submissions.column.submitted}</th>
              <th>{strings.admin.submissions.column.result}</th>
              <th>{strings.admin.submissions.column.points}</th>
              <th>{strings.admin.submissions.column.ip}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td>{r.crew_name ?? '—'}</td>
                <td>{r.pirate_handle ?? '—'}</td>
                <td>{r.island_slug}</td>
                <td><code>{r.submitted}</code></td>
                <td>
                  <Badge tone={r.is_correct ? 'success' : 'danger'}>
                    {r.is_correct ? strings.island.statusSolved : strings.island.wrong}
                  </Badge>
                </td>
                <td>{r.awarded_points}</td>
                <td>{r.ip ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
