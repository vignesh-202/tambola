import { useState } from "react";
import Panel from "./Panel.jsx";

export default function PlayersPanel({
  players,
  selectedPlayerIds = [],
  bulkGroupName = "",
  statusMessage,
  playerForm,
  onPlayerFormChange,
  onBulkGroupNameChange,
  onTogglePlayerSelection,
  onToggleAllPlayers,
  onApplyBulkGroup,
  onClearBulkGroup,
  onAddPlayer,
  onRemovePlayer,
  onClearPlayers,
  onPlayerTicketChange,
  onPlayerTicketBlur
}) {
  const allSelected = players.length > 0 && selectedPlayerIds.length === players.length;
  const [showClearGroupPrompt, setShowClearGroupPrompt] = useState(false);

  return (
    <>
      <Panel
        title="Players"
        description="Each player's contribution is derived from their ticket count and the total pool amount. You can also select multiple players below and assign them to the same family group."
      >
        <form onSubmit={onAddPlayer}>
          <div className="form-grid">
            <label>
              Player name
              <input
                type="text"
                placeholder="e.g. Priya"
                value={playerForm.name}
                onChange={(event) => onPlayerFormChange("name", event.target.value)}
                required
              />
            </label>
            <label>
              Group name
              <input
                type="text"
                placeholder="e.g. Sharma Family"
                value={playerForm.group}
                onChange={(event) => onPlayerFormChange("group", event.target.value)}
              />
            </label>
            <label>
              Tickets bought
              <input
                type="number"
                min="1"
                step="1"
                value={playerForm.tickets}
                onChange={(event) => onPlayerFormChange("tickets", event.target.value)}
                required
              />
            </label>
          </div>

          <div className="actions">
            <button className="button-primary" type="submit">Add Player</button>
            <button className="button-secondary" type="button" onClick={onClearPlayers}>Clear All Players</button>
          </div>
        </form>

        <div className="tiny" style={{ marginTop: 12 }}>{statusMessage}</div>

        <div className="form-grid" style={{ marginTop: 16, marginBottom: 0 }}>
          <label>
            Selected family group
            <input
              type="text"
              placeholder="e.g. Sharma Family"
              value={bulkGroupName}
              onChange={(event) => onBulkGroupNameChange(event.target.value)}
            />
          </label>
        </div>

        <div className="actions" style={{ marginTop: 12 }}>
          <button className="button-secondary" type="button" onClick={onApplyBulkGroup}>
            Apply Group To Selected
          </button>
          <button className="button-ghost" type="button" onClick={() => setShowClearGroupPrompt(true)}>
            Clear Group From Selected
          </button>
        </div>

        <div className="table-wrap" style={{ marginTop: 16 }}>
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(event) => onToggleAllPlayers(event.target.checked)}
                    aria-label="Select all players"
                  />
                </th>
                <th>Player</th>
                <th>Group</th>
                <th>Tickets</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {players.length ? players.map((player) => (
                <tr key={player.id}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedPlayerIds.includes(player.id)}
                      onChange={() => onTogglePlayerSelection(player.id)}
                      aria-label={`Select ${player.name}`}
                    />
                  </td>
                  <td>{player.name}</td>
                  <td>{player.group || "-"}</td>
                  <td>
                    <input
                      className="inline-input"
                      type="number"
                      min="1"
                      step="1"
                      value={player.tickets}
                      onChange={(event) => onPlayerTicketChange(player.id, event.target.value)}
                      onBlur={() => onPlayerTicketBlur(player.id)}
                      aria-label={`Tickets for ${player.name}`}
                    />
                  </td>
                  <td>
                    <button
                      className="button-ghost"
                      type="button"
                      onClick={() => onRemovePlayer(player.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="5" className="empty">No players added yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Panel>

      {showClearGroupPrompt ? (
        <div className="backdrop">
          <div className="backdrop-card">
            <h3>Clear Group From Selected</h3>
            <p>Have all transactions for this group already been completed?</p>
            <div className="actions">
              <button className="button-secondary" type="button" onClick={() => setShowClearGroupPrompt(false)}>
                Not Yet
              </button>
              <button
                className="button-primary"
                type="button"
                onClick={() => {
                  onClearBulkGroup();
                  setShowClearGroupPrompt(false);
                }}
              >
                Yes, Clear Group
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
