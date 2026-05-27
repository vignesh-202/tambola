import Panel from "./Panel.jsx";
import { toMoney } from "../utils/formatters.js";

export default function ScoreboardPanel({ scoreboard }) {
  return (
    <Panel
      title="Scoreboard"
      description="Positive balance means the player should receive money. Negative balance means the player should pay."
    >
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Group</th>
              <th>Tickets</th>
              <th>Contribution</th>
              <th>Winnings</th>
              <th>Net Balance</th>
            </tr>
          </thead>
          <tbody>
            {scoreboard.length ? scoreboard.map((row) => (
              <tr key={`${row.name}-${row.group}`}>
                <td>{row.name}</td>
                <td>{row.group || "-"}</td>
                <td>{row.tickets}</td>
                <td>{toMoney(row.contribution)}</td>
                <td>
                  <div>{toMoney(row.winnings)}</div>
                  {row.prizeBreakdown?.length ? (
                    <div className="tiny" style={{ marginTop: 6 }}>
                      {row.prizeBreakdown.map((prize, index) => (
                        <div key={`${row.name}-${prize.label}-${index}`}>
                          {toMoney(prize.amount)} ({prize.label})
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="tiny" style={{ marginTop: 6 }}>No prize won</div>
                  )}
                </td>
                <td className={row.net >= 0 ? "money-positive" : "money-negative"}>
                  {toMoney(row.net)}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="empty">Add players to see the score calculation.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
