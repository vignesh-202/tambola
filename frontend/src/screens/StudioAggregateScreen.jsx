import StudioAggregatePanel from "../components/StudioAggregatePanel.jsx";
import TransactionsPanel from "../components/TransactionsPanel.jsx";

export default function StudioAggregateScreen({ aggregate, onBack }) {
  return (
    <main className="shell">
      <section className="page-bar">
        <div>
          <div className="eyebrow">Aggregate</div>
          <h1 className="page-title">Completed Games Aggregate</h1>
          <p className="page-copy">Review the combined balances and final settlement flow across all completed, non-deleted games.</p>
        </div>
        <div className="actions">
          <button className="button-secondary" type="button" onClick={onBack}>Back to Studio</button>
        </div>
      </section>

      <StudioAggregatePanel aggregate={aggregate} />
      <TransactionsPanel transactions={aggregate.transactions} />
    </main>
  );
}
