import { useEffect, useState } from 'react';
import { Modal } from '@/ui/Modal';
import { Input, Textarea } from '@/ui/Input';
import { Button } from '@/ui/Button';
import { Card } from '@/ui/Card';
import { useToast } from '@/ui/Toast';
import { adminApi } from '@/api/admin';
import { ApiError } from '@/api/client';
import type { IslandSummary, IslandStatus } from '@/api/types';
import { strings } from '@/theme/strings';
import { Markdown } from '@/lib/markdown';

interface Props {
  mode: 'create' | 'edit';
  summary: IslandSummary | null;
  onClose: () => void;
  onSaved: () => void | Promise<void>;
}

interface WhisperDraft {
  ordinal: 1 | 2 | 3;
  body_md: string;
  cost_points: number;
}

const CATEGORIES = [
  'cursed_ports',
  'cipher_cove',
  'shipwrights_forge',
  'lighthouse',
  'crows_nest',
  'hidden_cargo',
  'keymaster',
] as const;

const DIFFICULTIES = ['port', 'open_sea', 'cursed_depths'] as const;

export function IslandModal({ mode, summary, onClose, onSaved }: Props): JSX.Element {
  const toast = useToast();
  const [title, setTitle] = useState(summary?.title ?? '');
  const [slug, setSlug] = useState(summary?.slug ?? '');
  const [category, setCategory] = useState<string>(summary?.category ?? CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState<string>(summary?.difficulty ?? DIFFICULTIES[0]);
  const [basePoints, setBasePoints] = useState<number>(summary?.base_points ?? 100);
  const [description, setDescription] = useState('');
  const [flag, setFlag] = useState('');
  const [sandboxImage, setSandboxImage] = useState<string>('');
  const [status, setStatus] = useState<IslandStatus>(summary?.status ?? 'draft');
  const [whispers, setWhispers] = useState<WhisperDraft[]>([]);
  const [files, setFiles] = useState<FileList | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // For "edit" mode we'd fetch the full IslandDetail; the simple summary
    // doesn't include description / whispers. Bosun's GET /api/islands/:slug
    // returns those fields. Skipped here to keep this scaffold lean — the
    // form is fully usable for create; edit pre-fills summary fields.
  }, [summary?.id]);

  const onSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        slug,
        title,
        category,
        difficulty,
        base_points: Number(basePoints),
        description_md: description,
        sandbox_image: sandboxImage || undefined,
        status,
        whispers,
        ...(mode === 'create' ? { flag } : {}),
      };
      const created =
        mode === 'create'
          ? await adminApi.createIsland(payload)
          : summary
            ? await adminApi.updateIsland(summary.id, payload)
            : null;
      if (created && files && files.length > 0) {
        await adminApi.uploadFiles(created.id, Array.from(files));
      }
      toast.push({ message: strings.toast.saved, variant: 'success', durationMs: 2500 });
      await onSaved();
    } catch (err) {
      toast.push({
        message: err instanceof ApiError ? err.message : strings.toast.failed,
        variant: 'error',
        durationMs: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  const addWhisper = (): void => {
    if (whispers.length >= 3) return;
    setWhispers((prev) => [
      ...prev,
      { ordinal: (prev.length + 1) as 1 | 2 | 3, body_md: '', cost_points: 10 },
    ]);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={mode === 'create' ? strings.admin.islands.newIsland : strings.admin.islands.editIsland}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {strings.admin.islands.cancel}
          </Button>
          <Button variant="primary" onClick={onSubmit} loading={saving}>
            {strings.admin.islands.saveIsland}
          </Button>
        </>
      }
    >
      <div className="surface-parchment" style={{ borderRadius: 8, padding: 12 }}>
        <form onSubmit={onSubmit} noValidate>
          <Input
            label={strings.admin.islands.title}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Input
            label={strings.admin.islands.slug}
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            required
            pattern="[a-z0-9-]+"
            hint={strings.admin.islands.slugHint}
          />
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr' }}>
            <label className="pc-field">
              <span className="pc-field__label">{strings.admin.islands.category}</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="pc-field__input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {strings.voyage.categoryNames[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="pc-field">
              <span className="pc-field__label">{strings.admin.islands.difficulty}</span>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="pc-field__input"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {strings.voyage.difficultyLabels[d]}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label={strings.admin.islands.basePoints}
              type="number"
              min={50}
              max={900}
              value={basePoints}
              onChange={(e) => setBasePoints(Number(e.target.value))}
            />
          </div>

          <Textarea
            label={strings.admin.islands.description}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
          />
          <details>
            <summary>{strings.admin.islands.preview}</summary>
            <Card variant="parchment">
              <Markdown source={description} />
            </Card>
          </details>

          {mode === 'create' ? (
            <Input
              label={strings.admin.islands.canonicalFlag}
              value={flag}
              onChange={(e) => setFlag(e.target.value)}
              placeholder={strings.island.submitPlaceholder}
              required
              autoComplete="off"
            />
          ) : null}

          <Input
            label={strings.admin.islands.sandboxImage}
            value={sandboxImage}
            onChange={(e) => setSandboxImage(e.target.value)}
            placeholder={strings.admin.islands.sandboxImagePlaceholder}
          />

          <label className="pc-field">
            <span className="pc-field__label">{strings.admin.islands.status}</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IslandStatus)}
              className="pc-field__input"
            >
              <option value="draft">{strings.admin.islands.statusDraft}</option>
              <option value="published">{strings.admin.islands.statusPublished}</option>
              <option value="archived">{strings.admin.islands.statusArchived}</option>
            </select>
          </label>

          <label className="pc-field">
            <span className="pc-field__label">{strings.admin.islands.files}</span>
            <input
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
              className="pc-field__input"
            />
          </label>

          <fieldset style={{ border: '1px solid var(--color-parchment-edge)', borderRadius: 6, padding: 8 }}>
            <legend>{strings.admin.islands.whispers}</legend>
            {whispers.map((w, i) => (
              <div key={i} style={{ display: 'grid', gap: 6, gridTemplateColumns: '1fr 100px auto', alignItems: 'end' }}>
                <Textarea
                  label={`${strings.admin.islands.whisperBody} #${w.ordinal}`}
                  value={w.body_md}
                  onChange={(e) => {
                    const v = e.target.value;
                    setWhispers((prev) => prev.map((x, j) => (j === i ? { ...x, body_md: v } : x)));
                  }}
                />
                <Input
                  label={strings.admin.islands.whisperCost}
                  type="number"
                  min={0}
                  value={w.cost_points}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setWhispers((prev) => prev.map((x, j) => (j === i ? { ...x, cost_points: v } : x)));
                  }}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setWhispers((prev) =>
                      prev
                        .filter((_, j) => j !== i)
                        .map((x, j) => ({ ...x, ordinal: (j + 1) as 1 | 2 | 3 })),
                    )
                  }
                >
                  {strings.admin.islands.removeWhisper}
                </Button>
              </div>
            ))}
            {whispers.length < 3 ? (
              <Button variant="secondary" size="sm" onClick={addWhisper}>
                {strings.admin.islands.addWhisper}
              </Button>
            ) : null}
          </fieldset>
        </form>
      </div>
    </Modal>
  );
}
