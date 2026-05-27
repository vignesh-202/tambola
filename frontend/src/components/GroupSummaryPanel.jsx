import Panel from "./Panel.jsx";
import { toMoney } from "../utils/formatters.js";

export default function GroupSummaryPanel({ groups }) {
  return (
    <Panel
      title="Group Settlement"
      description="Members with the same group name are combined into one settlement party before final transactions are generated."
    >
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Group / Party</th>
              <th>Members</th>
              <th>Tickets</th>
              <th>Contribution</th>
              <th>Winnings</th>
              <th>Net Balance</th>
            </tr>
          </thead>
          <tbody>
            {groups.length ? groups.map((group) => (
              <tr key={group.name}>
                <td>{group.name}</td>
                <td>{group.members}</td>
                <td>{group.tickets}</td>
                <td>{toMoney(group.contribution)}</td>
                <td>{toMoney(group.winnings)}</td>
                <td className={group.net >= 0 ? "money-positive" : "money-negative"}>
                  {toMoney(group.net)}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="empty">Groups will appear once players are added.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
