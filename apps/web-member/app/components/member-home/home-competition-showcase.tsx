'use client';

import { MemberRuntimeImage } from '../member-runtime-image';
import { buildCompetitionShowcase } from './home-competition-model';

export function HomeCompetitionShowcase() {
  const showcase = buildCompetitionShowcase();

  return (
    <section className="member-competition-showcase" aria-label="ทัวร์นาเมนต์และอันดับสมาชิก">
      <a className="member-competition-showcase__hero" href="/games">
        <MemberRuntimeImage src={showcase.heroImageUrl} alt={showcase.title} />
        <div>
          <span>{showcase.eyebrow}</span>
          <strong>{showcase.title}</strong>
          <small>{showcase.subtitle}</small>
        </div>
      </a>

      <div className="member-competition-showcase__grid">
        <article className="member-jackpot-card">
          <span>JACKPOT</span>
          <strong>{showcase.jackpotLabel}</strong>
          <small>{showcase.jackpotCaption}</small>
        </article>

        <article className="member-leaderboard-card">
          <header><strong>อันดับล่าสุด</strong><a href="/games">ดูทั้งหมด</a></header>
          <ol>
            {showcase.leaderboard.map((entry) => (
              <li key={`${entry.rank}-${entry.user}`} data-rank={entry.rank}>
                <span>{entry.rank}</span>
                <strong>{entry.user}</strong>
                <em>{entry.score}</em>
              </li>
            ))}
          </ol>
        </article>
      </div>
    </section>
  );
}
