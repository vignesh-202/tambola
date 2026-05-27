import { prizeDefinitions } from "../constants/prizes.js";
import Panel from "./Panel.jsx";
import { splitWinnerNames, toMoney } from "../utils/formatters.js";

function normalizeWinnerList(value) {
  return Array.from(new Set(splitWinnerNames(value)));
}

export default function PrizeSetupPanel({
  prizes,
  players,
  onPrizeChange,
  onPrizeAmountBlur,
  onAutoFillPrizes,
  onSavePrizeSetup,
  prizeAmountsEdited,
  prizeSetupStatus,
  totalCollection
}) {
  return (
    <Panel
      title="Prize Setup"
      description="Prize amounts are auto-generated from the current total collection. You can edit them any time, and the app will keep all prize amounts as even rupee values, keep Early 5 above every line prize, and keep Housie above all other prizes."
    >
      <div className="actions" style={{ marginBottom: 12 }}>
        <span className="pill">
          Auto basis: {toMoney(totalCollection)}
        </span>
        <span className="pill">
          {prizeAmountsEdited ? "Manual edits active" : "Auto-sync active"}
        </span>
        <button className="button-secondary" type="button" onClick={onAutoFillPrizes}>
          Recalculate from collection
        </button>
        <button className="button-primary" type="button" onClick={onSavePrizeSetup}>
          Save Prize Setup
        </button>
      </div>

      <div className="tiny" style={{ marginBottom: 12 }}>{prizeSetupStatus}</div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Prize</th>
              <th>Amount</th>
              <th>Winners</th>
            </tr>
          </thead>
          <tbody>
            {prizeDefinitions.map((prize) => {
              const selectedWinners = normalizeWinnerList(prizes[prize.key].winners);

              function updateWinners(nextWinners) {
                onPrizeChange(prize.key, "winners", nextWinners.filter(Boolean).join(", "));
              }

              function handleWinnerChange(index, nextWinner) {
                const nextWinners = [...selectedWinners];
                nextWinners[index] = nextWinner;
                updateWinners(nextWinners);
              }

              function handleRemoveWinner(index) {
                updateWinners(selectedWinners.filter((_, winnerIndex) => winnerIndex !== index));
              }

              return (
                <tr key={prize.key}>
                  <td>{prize.label}</td>
                  <td>
                    <input
                      className="inline-input"
                      type="number"
                      min="0"
                      step="2"
                      value={prizes[prize.key].amount}
                      placeholder="0"
                      onChange={(event) => onPrizeChange(prize.key, "amount", event.target.value)}
                      onBlur={() => onPrizeAmountBlur(prize.key)}
                    />
                  </td>
                  <td>
                    <div className="winner-stack">
                      {selectedWinners.map((winner, index) => (
                        <div className="winner-row" key={`${prize.key}-${index}`}>
                          <div className="winner-chip">
                            <span>{winner}</span>
                          </div>
                          <button
                            className="button-ghost button-small"
                            type="button"
                            onClick={() => handleRemoveWinner(index)}
                          >
                            Remove
                          </button>
                        </div>
                      ))}

                      <select
                        value=""
                        onChange={(event) => {
                          if (event.target.value) {
                            updateWinners([...selectedWinners, event.target.value]);
                          }
                        }}
                        disabled={!players.length}
                      >
                        <option value="">{players.length ? "Add winner" : "Add players first"}</option>
                        {players
                          .filter((player) => !selectedWinners.includes(player.name))
                          .map((player) => (
                            <option key={`${prize.key}-add-${player.id}`} value={player.name}>
                              {player.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}
