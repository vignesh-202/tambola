import Panel from "./Panel.jsx";
import MetricCard from "./MetricCard.jsx";
import { toMoney } from "../utils/formatters.js";

export default function StudioAggregatePanel({ aggregate }) {
  return (
    <Panel
      title="Completed Games Aggregate"
      description="This summary combines all completed, non-deleted games so you can review the overall scorecard across finished sessions."
      style={{ marginTop: 18 }}
    >
      <div className="metric-grid">
        <MetricCard label="Completed games" value={aggregate.completedGamesCount} />
        <MetricCard label="Total collection" value={toMoney(aggregate.totalCollection)} />
        <MetricCard label="Prize payout" value={toMoney(aggregate.totalDistributedPrize)} />
        <MetricCard label="Transfers logged" value={aggregate.totalTransfers} />
      </div>

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              <th>Party</th>
              <th>Games</th>
              <th>Members</th>
              <th>Tickets</th>
              <th>Contribution</th>
              <th>Winnings</th>
              <th>Net Balance</th>
            </tr>
          </thead>
          <tbody>
            {aggregate.parties.length ? aggregate.parties.map((party) => (
              <tr key={party.name}>
                <td>{party.name}</td>
                <td>{party.games}</td>
                <td>{party.members}</td>
                <td>{party.tickets}</td>
                <td>{toMoney(party.contribution)}</td>
                <td>{toMoney(party.winnings)}</td>
                <td className={party.net >= 0 ? "money-positive" : "money-negative"}>
                  {toMoney(party.net)}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="empty">Complete a game to see the aggregate studio score card.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
