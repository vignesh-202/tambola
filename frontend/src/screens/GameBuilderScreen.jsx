import HeroSection from "../components/HeroSection.jsx";
import PlayersPanel from "../components/PlayersPanel.jsx";
import SetupPanel from "../components/SetupPanel.jsx";
import PrizeSetupPanel from "../components/PrizeSetupPanel.jsx";

export default function GameBuilderScreen({
  calculation,
  currentGame,
  players,
  selectedPlayerIds,
  bulkGroupName,
  playerForm,
  statusMessage,
  ticketPrice,
  settlementName,
  prizes,
  onBack,
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
  onPlayerTicketBlur,
  onTicketPriceChange,
  onSettlementNameChange,
  onPrizeChange,
  onPrizeAmountBlur,
  onAutoFillPrizes,
  onSavePrizeSetup,
  prizeAmountsEdited,
  prizeSetupStatus,
  totalCollection,
  onViewScoreCard,
  onSaveDraft
}) {
  return (
    <main className="shell">
      <section className="page-bar">
        <div>
          <div className="eyebrow">Editor</div>
          <h1 className="page-title">Game Builder</h1>
          <p className="page-copy">Prepare the players, prizes, and pool details before opening the final score card.</p>
        </div>
        <div className="actions">
          <button className="button-secondary" type="button" onClick={onBack}>Back to Studio</button>
          <button className="button-ghost" type="button" onClick={onSaveDraft}>
            {currentGame ? "Update Draft" : "Save Draft"}
          </button>
          <button className="button-primary" type="button" onClick={onViewScoreCard}>Open Score Card</button>
        </div>
      </section>

      <HeroSection calculation={calculation} playerCount={players.length} />

      <div className="grid">
        <PlayersPanel
          players={players}
          selectedPlayerIds={selectedPlayerIds}
          bulkGroupName={bulkGroupName}
          statusMessage={statusMessage}
          playerForm={playerForm}
          onPlayerFormChange={onPlayerFormChange}
          onBulkGroupNameChange={onBulkGroupNameChange}
          onTogglePlayerSelection={onTogglePlayerSelection}
          onToggleAllPlayers={onToggleAllPlayers}
          onApplyBulkGroup={onApplyBulkGroup}
          onClearBulkGroup={onClearBulkGroup}
          onAddPlayer={onAddPlayer}
          onRemovePlayer={onRemovePlayer}
          onClearPlayers={onClearPlayers}
          onPlayerTicketChange={onPlayerTicketChange}
          onPlayerTicketBlur={onPlayerTicketBlur}
        />

        <div className="stack">
          <SetupPanel
            ticketPrice={ticketPrice}
            settlementName={settlementName}
            onTicketPriceChange={onTicketPriceChange}
            onSettlementNameChange={onSettlementNameChange}
            calculation={calculation}
          />
          <PrizeSetupPanel
            prizes={prizes}
            players={players}
            onPrizeChange={onPrizeChange}
            onPrizeAmountBlur={onPrizeAmountBlur}
            onAutoFillPrizes={onAutoFillPrizes}
            onSavePrizeSetup={onSavePrizeSetup}
            prizeAmountsEdited={prizeAmountsEdited}
            prizeSetupStatus={prizeSetupStatus}
            totalCollection={totalCollection}
          />
        </div>
      </div>
    </main>
  );
}
