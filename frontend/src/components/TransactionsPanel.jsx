import Panel from "./Panel.jsx";
import { toMoney } from "../utils/formatters.js";

export default function TransactionsPanel({ transactions }) {
  return (
    <Panel
      title="Final Transactions"
      description="This is the smallest set of transfers needed to settle the game. If players share a group name, their balances are combined into one group transaction."
    >
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.length ? transactions.map((transaction, index) => (
              <tr key={`${transaction.from}-${transaction.to}-${index}`}>
                <td>{transaction.from}</td>
                <td>{transaction.to}</td>
                <td>{toMoney(transaction.amount)}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="3" className="empty">No transfers are needed with the current data.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
