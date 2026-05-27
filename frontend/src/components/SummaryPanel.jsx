import MetricCard from "./MetricCard.jsx";
import Panel from "./Panel.jsx";
import { toMoney } from "../utils/formatters.js";

export default function SummaryPanel({ calculation }) {
  return (
    <Panel
      title="Calculation Summary"
      description="The settlement table below is built from these balances."
      style={{ marginTop: 18 }}
    >
      <div className="message-list">
        {calculation.messages.length ? calculation.messages.map((message, index) => (
          <div key={`${message.type}-${index}`} className={`message message-${message.type}`}>
            {message.text}
          </div>
        )) : (
          <div className="message message-info">
            The data is consistent. Review the scoreboard and transactions below.
          </div>
        )}
      </div>

      <div className="metric-grid">
        <MetricCard label="Total amount" value={toMoney(calculation.totalAmount)} />
        <MetricCard label="Total prizes configured" value={toMoney(calculation.configuredPrizeTotal)} />
        <MetricCard label="Prize payout distributed" value={toMoney(calculation.distributedPrizeTotal)} />
        <MetricCard label={`${calculation.settlementName} balance`} value={toMoney(calculation.houseBalance)} />
      </div>
    </Panel>
  );
}
