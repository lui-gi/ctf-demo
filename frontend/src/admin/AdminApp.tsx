import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import { strings } from '@/theme/strings';
import { IslandsTable } from './IslandsTable';
import { SubmissionsLog } from './SubmissionsLog';
import { ModerationPanel } from './ModerationPanel';
import { VoyageControls } from './VoyageControls';
import './admin.css';

export default function AdminApp(): JSX.Element {
  return (
    <section className="pc-admin" aria-labelledby="admin-heading">
      <header style={{ marginBottom: '1.5rem' }}>
        <h1 id="admin-heading" className="display">
          {strings.admin.heading}
        </h1>
        <p style={{ color: 'var(--color-ink-on-dark-dim)' }}>{strings.admin.subtitle}</p>
      </header>

      <nav className="pc-admin__tabs" aria-label={strings.aria.adminTabs}>
        <NavLink to="islands">{strings.admin.tabs.islands}</NavLink>
        <NavLink to="submissions">{strings.admin.tabs.submissions}</NavLink>
        <NavLink to="moderation">{strings.admin.tabs.moderation}</NavLink>
        <NavLink to="voyage">{strings.admin.tabs.voyage}</NavLink>
      </nav>

      <Routes>
        <Route index element={<Navigate to="islands" replace />} />
        <Route path="islands" element={<IslandsTable />} />
        <Route path="submissions" element={<SubmissionsLog />} />
        <Route path="moderation" element={<ModerationPanel />} />
        <Route path="voyage" element={<VoyageControls />} />
      </Routes>
    </section>
  );
}
