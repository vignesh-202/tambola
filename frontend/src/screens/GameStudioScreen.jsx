export default function GameStudioScreen({
  games,
  status,
  pendingDeleteGame,
  onBack,
  onAddGame,
  onOpenAggregate,
  onResumeGame,
  onOpenGameScorecard,
  onDeleteGame,
  onCancelDeleteGame,
  onConfirmDeleteGame
}) {
  return (
    <>
      <main className="shell">
        <section className="page-bar">
          <div>
            <div className="eyebrow">Studio</div>
            <h1 className="page-title">Game Studio</h1>
            <p className="page-copy">Start a new game or revisit saved settlement runs.</p>
          </div>
          <div className="actions">
            <button className="button-secondary" type="button" onClick={onBack}>Back</button>
            <button className="button-ghost" type="button" onClick={onOpenAggregate}>Aggregate Transactions</button>
            <button className="button-primary" type="button" onClick={onAddGame}>Add Game</button>
          </div>
        </section>

        <section className="panel">
          <h2>Saved Games</h2>
          <p>{status}</p>

          <div className="studio-grid">
            {games.length ? games.map((game) => (
              <article className="studio-card" key={game.id}>
                <div className="studio-card-head">
                  <strong>Game #{game.id}</strong>
                  <span>{new Date(game.createdAt).toLocaleString()}</span>
                </div>
                <div className="studio-card-meta">
                  <span>Ticket price: Rs. {game.ticketPrice || 0}</span>
                  <span>Players: {(game.players || []).length || (game.result?.scoreboard || []).length}</span>
                  <span>Transfers: {(game.result?.transactions || []).length}</span>
                  <span>Status: {game.status === "completed" ? "Completed" : "In progress"}</span>
                </div>
                <div className="actions">
                  {game.status === "completed" ? (
                    <button className="button-ghost" type="button" onClick={() => onOpenGameScorecard(game)}>
                      Open Score Card
                    </button>
                  ) : (
                    <button className="button-primary" type="button" onClick={() => onResumeGame(game)}>
                      Resume Game
                    </button>
                  )}
                  <button className="button-secondary" type="button" onClick={() => onDeleteGame(game)}>
                    Delete Game
                  </button>
                </div>
              </article>
            )) : (
              <div className="empty-card">
                <strong>No saved games yet.</strong>
                <span>Create your first game from the Add Game button.</span>
              </div>
            )}
          </div>
        </section>
      </main>

      {pendingDeleteGame ? (
        <div className="backdrop">
          <div className="backdrop-card">
            <h3>Delete Game #{pendingDeleteGame.id}</h3>
            <p>Is all the transactions is done for this game?</p>
            <div className="actions">
              <button className="button-secondary" type="button" onClick={onCancelDeleteGame}>
                Not Yet
              </button>
              <button className="button-primary" type="button" onClick={onConfirmDeleteGame}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
