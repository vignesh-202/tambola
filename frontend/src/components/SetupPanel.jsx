import MetricCard from "./MetricCard.jsx";
import Panel from "./Panel.jsx";
import { toMoney } from "../utils/formatters.js";

export default function SetupPanel({
  ticketPrice,
  settlementName,
  onTicketPriceChange,
  onSettlementNameChange,
  calculation
}) {
  return (
    <Panel
      title="Game Setup"
      description="Enter the ticket price once. The app multiplies it by total tickets to calculate the full pool automatically."
    >
      <div className="form-grid">
        <label>
          Ticket price
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="e.g. 5"
            value={ticketPrice}
            onChange={(event) => onTicketPriceChange(event.target.value)}
          />
        </label>
        <label>
          Pool holder name
          <input
            type="text"
            value={settlementName}
            placeholder="Organizer"
            onChange={(event) => onSettlementNameChange(event.target.value)}
          />
        </label>
      </div>

      <div className="pill-list">
        <span className="pill">Ties are supported: use comma-separated winner names.</span>
        <span className="pill">Unknown names are highlighted before settlement is generated.</span>
      </div>

      <div className="metric-grid">
        <MetricCard label="Total tickets" value={calculation.totalTickets} />
        <MetricCard label="Ticket price" value={toMoney(calculation.ticketPrice)} />
        <MetricCard label="Total collection" value={toMoney(calculation.totalAmount)} />
        <MetricCard label="Pool holder" value={calculation.settlementName} />
      </div>
    </Panel>
  );
}
