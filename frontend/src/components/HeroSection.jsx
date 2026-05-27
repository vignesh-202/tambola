import MetricCard from "./MetricCard.jsx";
import { toMoney } from "../utils/formatters.js";

export default function HeroSection({ calculation, playerCount }) {
  return (
    <section className="hero">
      <div className="hero-copy">
        <div className="eyebrow">Tambola Cashflow Studio</div>
        <h1>Track winners fast and settle the whole game in one pass.</h1>
        <p>
          Add each player with the number of physical tickets they bought, enter the ticket price,
          optionally assign family members to a shared group, capture the winners for Early 5, Top Line,
          Middle Line, Bottom Line, and Housie, and the app will calculate contributions, winnings,
          balances, and the final money transfers automatically.
        </p>
      </div>

      <div className="hero-metrics">
        <MetricCard label="Players" value={playerCount} />
        <MetricCard label="Tickets in play" value={calculation.totalTickets} />
        <MetricCard label="Collection" value={toMoney(calculation.totalAmount)} />
        <MetricCard label="Transfers" value={calculation.transactions.length} />
      </div>
    </section>
  );
}
