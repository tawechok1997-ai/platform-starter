'use client';

import { MemberIcon } from '../member-icon';

export type HomeTab = 'highlights' | 'promotions' | 'activities';

type HomeTabItem = {
  key: HomeTab;
  label: string;
  compactLabel: string;
  icon: 'games' | 'promotion' | 'bonus';
};

const HOME_TABS: HomeTabItem[] = [
  { key: 'highlights', label: 'ไฮไลท์', compactLabel: 'ไฮไลท์', icon: 'games' },
  { key: 'promotions', label: 'โปรโมชั่นแนะนำ', compactLabel: 'โปรโมชั่น', icon: 'promotion' },
  { key: 'activities', label: 'กิจกรรม', compactLabel: 'กิจกรรม', icon: 'bonus' },
];

export function SourceHomeTabs({
  activeTab,
  onChange,
}: {
  activeTab: HomeTab;
  onChange: (tab: HomeTab) => void;
}) {
  return (
    <div className="member-source-tabs" role="tablist" aria-label="เมนูหน้า Home">
      {HOME_TABS.map((tab) => {
        const selected = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            className={`member-source-tab${selected ? ' is-active' : ''}`}
            onClick={() => onChange(tab.key)}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
          >
            <MemberIcon name={tab.icon} />
            <span className="member-source-tab__label member-source-tab__label--full">{tab.label}</span>
            <span className="member-source-tab__label member-source-tab__label--compact" aria-hidden="true">
              {tab.compactLabel}
            </span>
          </button>
        );
      })}
    </div>
  );
}
