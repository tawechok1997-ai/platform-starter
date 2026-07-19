'use client';

import { MemberIcon } from '../member-icon';

export type HomeTab = 'highlights' | 'promotions' | 'activities';

const HOME_TABS: Array<{ key: HomeTab; label: string; icon: 'games' | 'promotion' | 'bonus' }> = [
  { key: 'highlights', label: 'ไฮไลท์', icon: 'games' },
  { key: 'promotions', label: 'โปรโมชั่นแนะนำ', icon: 'promotion' },
  { key: 'activities', label: 'กิจกรรม', icon: 'bonus' },
];

export function SourceHomeTabs({
  activeTab,
  onChange,
}: {
  activeTab: HomeTab;
  onChange: (tab: HomeTab) => void;
}) {
  return (
    <nav className="member-source-tabs" aria-label="เมนูหน้า Home">
      {HOME_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`member-source-tab${activeTab === tab.key ? ' is-active' : ''}`}
          onClick={() => onChange(tab.key)}
          aria-pressed={activeTab === tab.key}
        >
          <MemberIcon name={tab.icon} />
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
