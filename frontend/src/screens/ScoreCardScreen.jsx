import SummaryPanel from "../components/SummaryPanel.jsx";
import GroupSummaryPanel from "../components/GroupSummaryPanel.jsx";
import ScoreboardPanel from "../components/ScoreboardPanel.jsx";
import TransactionsPanel from "../components/TransactionsPanel.jsx";
import { buildGroupSummary } from "../utils/settlement.js";

export default function ScoreCardScreen({ calculation, isFinalized, onBack, onFinalize }) {
  const groupSummary = buildGroupSummary(calculation.scoreboard);

  return (
    <main className="shell">
      <section className="page-bar">
        <div>
          <div className="eyebrow">Results</div>
          <h1 className="page-title">Score Card & Final Settlement</h1>
          <p className="page-copy">Review contributions, group rollups, winners, and the final money flow.</p>
        </div>
        <div className="actions">
          <button className="button-secondary" type="button" onClick={onBack}>Back to Builder</button>
        </div>
      </section>

      {isFinalized ? (
        <div className="message message-info" style={{ marginBottom: 16 }}>
          Game marked as completed successfully.
        </div>
      ) : null}

      <SummaryPanel calculation={calculation} />
      <GroupSummaryPanel groups={groupSummary} />
      <ScoreboardPanel scoreboard={calculation.scoreboard} />
      <TransactionsPanel transactions={calculation.transactions} />

      {!isFinalized ? (
        <div className="bottom-cta">
          <button className="button-success button-bottom" type="button" onClick={onFinalize}>
            Completed
          </button>
        </div>
      ) : null}
    </main>
  );
}
