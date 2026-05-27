import { useEffect, useState } from "react";
import { initialPrizes, prizeDefinitions } from "./constants/prizes.js";
import { getTicketCount, roundMoney, splitWinnerNames } from "./utils/formatters.js";
import { buildCompletedGamesAggregate, calculateSettlement } from "./utils/settlement.js";
import {
  createGame,
  createPlayer,
  deleteAllPlayers,
  deleteGame,
  deletePlayer,
  fetchGames,
  fetchPlayers,
  replacePlayers,
  updateGame
} from "./services/api.js";
import LandingScreen from "./screens/LandingScreen.jsx";
import GameStudioScreen from "./screens/GameStudioScreen.jsx";
import GameBuilderScreen from "./screens/GameBuilderScreen.jsx";
import ScoreCardScreen from "./screens/ScoreCardScreen.jsx";
import StudioAggregateScreen from "./screens/StudioAggregateScreen.jsx";

const PRIZE_STEP = 1;
const linePrizeKeys = ["topLine", "middleLine", "bottomLine"];

function emptyPlayerForm() {
  return { name: "", group: "", tickets: "1" };
}

function toPrizeAmount(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
}

function formatPrizeAmount(value) {
  if (value <= 0) {
    return "";
  }

  return String(makeEvenAmount(value));
}

function makeEvenAmount(value) {
  const rounded = Math.max(0, Math.round(Number(value) || 0));

  if (!rounded) {
    return 0;
  }

  return rounded % 2 === 0 ? rounded : rounded + 1;
}

function normalizePrizeRules(prizes) {
  const nextPrizes = Object.fromEntries(
    Object.entries(prizes).map(([key, prize]) => [
      key,
      { ...prize }
    ])
  );

  const lineAmounts = linePrizeKeys.map((key) => toPrizeAmount(nextPrizes[key]?.amount));
  const sharedLineAmount = makeEvenAmount(Math.max(0, ...lineAmounts));
  const highestLineAmount = Math.max(0, ...lineAmounts);
  const rawEarly5 = nextPrizes.early5?.amount;
  const rawHousie = nextPrizes.housie?.amount;
  const hasLineAmount = lineAmounts.some((amount) => amount > 0);
  const hasEarly5Amount = String(rawEarly5 ?? "").trim() !== "";
  const hasHousieAmount = String(rawHousie ?? "").trim() !== "";

  const shouldSetEarly5 = hasLineAmount || hasEarly5Amount || hasHousieAmount;
  const early5Amount = shouldSetEarly5
    ? makeEvenAmount(Math.max(toPrizeAmount(rawEarly5), highestLineAmount + 2))
    : 0;

  const shouldSetHousie = hasLineAmount || hasEarly5Amount || hasHousieAmount;
  const housieAmount = shouldSetHousie
    ? makeEvenAmount(Math.max(toPrizeAmount(rawHousie), early5Amount + 2))
    : 0;

  linePrizeKeys.forEach((key) => {
    nextPrizes[key] = {
      ...nextPrizes[key],
      amount: formatPrizeAmount(sharedLineAmount)
    };
  });

  nextPrizes.early5 = {
    ...nextPrizes.early5,
    amount: formatPrizeAmount(early5Amount)
  };

  nextPrizes.housie = {
    ...nextPrizes.housie,
    amount: formatPrizeAmount(housieAmount)
  };

  return nextPrizes;
}

function buildAutomaticPrizeAmounts(totalAmount, prizes) {
  const nextPrizes = Object.fromEntries(
    Object.entries(prizes).map(([key, prize]) => [
      key,
      { ...prize }
    ])
  );

  if (totalAmount <= 0) {
    Object.keys(nextPrizes).forEach((key) => {
      nextPrizes[key].amount = "";
    });

    return nextPrizes;
  }

  const roundedTotal = Math.round(totalAmount);
  const lineAmount = makeEvenAmount(Math.floor(roundedTotal / 9));
  const early5Amount = makeEvenAmount(Math.max(lineAmount + 2, Math.floor((roundedTotal * 2) / 9)));
  const housieAmount = Math.max(
    early5Amount + 2,
    roundedTotal - (lineAmount * 3 + early5Amount)
  );

  linePrizeKeys.forEach((key) => {
    nextPrizes[key].amount = formatPrizeAmount(lineAmount);
  });

  nextPrizes.early5.amount = formatPrizeAmount(early5Amount);
  nextPrizes.housie.amount = formatPrizeAmount(makeEvenAmount(housieAmount));

  return normalizePrizeRules(nextPrizes);
}

function validatePrizeSetup(prizes) {
  const missingAmounts = [];
  const missingWinners = [];

  prizeDefinitions.forEach((prize) => {
    const amount = toPrizeAmount(prizes?.[prize.key]?.amount);
    const winners = splitWinnerNames(prizes?.[prize.key]?.winners);

    if (amount <= 0) {
      missingAmounts.push(prize.label);
    }

    if (!winners.length) {
      missingWinners.push(prize.label);
    }
  });

  return {
    isValid: !missingAmounts.length && !missingWinners.length,
    missingAmounts,
    missingWinners
  };
}

function normalizeGameRecord(game) {
  const scoreboardPlayers = Array.isArray(game?.result?.scoreboard)
    ? game.result.scoreboard.map((player, index) => ({
        id: Number(player.id) || index + 1,
        name: player.name || "",
        group_name: player.group || "",
        group: player.group || "",
        tickets: player.tickets || 1
      }))
    : [];

  return {
    ...game,
    status: game?.status === "finalized" ? "completed" : (game?.status || "draft"),
    settlementName: game?.settlementName || game?.result?.settlementName || "Organizer",
    ticketPrice: game?.ticketPrice ?? game?.result?.ticketPrice ?? "",
    players: Array.isArray(game?.players) && game.players.length ? game.players : scoreboardPlayers
  };
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [players, setPlayers] = useState([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [bulkGroupName, setBulkGroupName] = useState("");
  const [playerForm, setPlayerForm] = useState(emptyPlayerForm());
  const [statusMessage, setStatusMessage] = useState("Loading players...");
  const [studioStatus, setStudioStatus] = useState("Saved games will appear here.");
  const [ticketPrice, setTicketPrice] = useState("");
  const [settlementName, setSettlementName] = useState("Organizer");
  const [prizes, setPrizes] = useState(initialPrizes);
  const [games, setGames] = useState([]);
  const [savedScorecard, setSavedScorecard] = useState(null);
  const [currentGame, setCurrentGame] = useState(null);
  const [pendingDeleteGame, setPendingDeleteGame] = useState(null);
  const [prizeAmountsEdited, setPrizeAmountsEdited] = useState(false);
  const [prizeSetupStatus, setPrizeSetupStatus] = useState("Auto prize setup is ready.");

  useEffect(() => {
    loadPlayers();
  }, []);

  const totalCollection = roundMoney(
    players.reduce((sum, player) => sum + getTicketCount(player.tickets), 0) * toPrizeAmount(ticketPrice)
  );

  useEffect(() => {
    if (!prizeAmountsEdited) {
      setPrizes((currentPrizes) => buildAutomaticPrizeAmounts(totalCollection, currentPrizes));
    }
  }, [totalCollection, prizeAmountsEdited]);

  async function loadPlayers() {
    setStatusMessage("Loading players...");

    try {
      const payload = await fetchPlayers();
      setPlayers(payload.map((player) => ({
        id: player.id,
        name: player.name,
        group: player.group_name || "",
        tickets: getTicketCount(player.tickets)
      })));
      setSelectedPlayerIds([]);

      setStatusMessage(payload.length
        ? "Players loaded from local JSON."
        : "Player list is empty. Start by adding the first player.");
    } catch (error) {
      setStatusMessage(`${error.message} Make sure the backend server is running on port 5000.`);
    }
  }

  async function loadGames() {
    setStudioStatus("Loading saved games...");

    try {
      const payload = await fetchGames();
      setGames(payload.map(normalizeGameRecord));
      setStudioStatus(payload.length
        ? "Saved games loaded from local JSON."
        : "No saved games yet. Create a game to see it here.");
    } catch (error) {
      setStudioStatus(error.message);
    }
  }

  function resetGameBuilder() {
    setTicketPrice("");
    setSettlementName("Organizer");
    setPrizes(initialPrizes);
    setPrizeAmountsEdited(false);
    setPrizeSetupStatus("Auto prize setup is ready.");
    setSavedScorecard(null);
    setCurrentGame(null);
  }

  function applyGameTemplate(game) {
    const normalizedGame = normalizeGameRecord(game);
    setCurrentGame(null);
    setSavedScorecard(null);
    setTicketPrice(String(normalizedGame.ticketPrice ?? ""));
    setSettlementName(normalizedGame.settlementName || "Organizer");
    setPrizeAmountsEdited(false);
    setPrizeSetupStatus("Previous game players loaded. Prize setup has been reset for the new game.");
    setPrizes(initialPrizes);
    return normalizedGame.players || [];
  }

  async function handleOpenStudio() {
    setScreen("studio");
    await loadGames();
  }

  async function handleAddGameFlow() {
    let latestGame = games[0];

    if (!latestGame) {
      try {
        const payload = await fetchGames();
        const normalizedGames = payload.map(normalizeGameRecord);
        setGames(normalizedGames);
        latestGame = normalizedGames[0];
      } catch (error) {
        setStudioStatus(error.message);
      }
    }

    if (latestGame) {
      const templatePlayers = applyGameTemplate(latestGame);
      await replacePlayers(templatePlayers);
      await loadPlayers();
    } else {
      resetGameBuilder();
      await replacePlayers([]);
      await loadPlayers();
    }

    setScreen("builder");
  }

  function handleOpenScoreCard() {
    setSavedScorecard(null);
    setScreen("scorecard");
  }

  function handleOpenSavedGameScorecard(game) {
    const normalizedGame = normalizeGameRecord(game);
    setSavedScorecard(normalizedGame.result || null);
    setCurrentGame(normalizedGame);
    setScreen("scorecard");
  }

  async function handleResumeGame(game) {
    const normalizedGame = normalizeGameRecord(game);
    setCurrentGame(normalizedGame);
    setSavedScorecard(null);
    setTicketPrice(String(normalizedGame.ticketPrice ?? ""));
    setSettlementName(normalizedGame.settlementName || "Organizer");
    setPrizeAmountsEdited(true);
    setPrizeSetupStatus("Saved prize setup loaded.");
    setPrizes(normalizePrizeRules(normalizedGame.prizes || initialPrizes));
    await replacePlayers(normalizedGame.players || []);
    await loadPlayers();
    setScreen("builder");
  }

  function handleDeleteGame(game) {
    setPendingDeleteGame(normalizeGameRecord(game));
  }

  async function confirmDeleteGame() {
    if (!pendingDeleteGame) {
      return;
    }

    const targetGame = pendingDeleteGame;
    setStudioStatus(`Deleting Game #${targetGame.id}...`);

    try {
      await deleteGame(targetGame.id);

      if (String(currentGame?.id) === String(targetGame.id)) {
        setCurrentGame(null);
        setSavedScorecard(null);
      }

      await loadGames();
      setStudioStatus(`Game #${targetGame.id} deleted.`);
    } catch (error) {
      setStudioStatus(error.message);
    } finally {
      setPendingDeleteGame(null);
    }
  }

  async function persistGame(status) {
    const correctedPrizes = normalizePrizeRules(prizes);
    const calculation = calculateSettlement(players, ticketPrice, settlementName, correctedPrizes);
    const winners = Object.fromEntries(
      Object.entries(correctedPrizes).map(([key, value]) => [key, value.winners])
    );
    const payload = {
      ticketPrice: calculation.ticketPrice,
      settlementName,
      players: players.map((player) => ({
        id: player.id,
        name: player.name,
        group_name: player.group || "",
        group: player.group || "",
        tickets: player.tickets
      })),
      prizes: correctedPrizes,
      winners,
      result: calculation,
      status
    };

    try {
      const response = currentGame
        ? await updateGame(currentGame.id, payload)
        : await createGame(payload);

      setCurrentGame(response.game);
      setStudioStatus(`Game #${response.game.id} ${status === "completed" ? "completed" : "saved as draft"} successfully.`);
      await loadGames();
      return response.game;
    } catch (error) {
      setStatusMessage(error.message);
      return null;
    }
  }

  async function handleSaveDraft() {
    await persistGame("draft");
  }

  async function handleFinalizeSettlement() {
    const game = await persistGame("completed");
    if (game) {
      setSavedScorecard(game.result || null);
      setScreen("scorecard");
    }
  }

  async function handleAddPlayer(event) {
    event.preventDefault();

    const name = playerForm.name.trim();
    const group = playerForm.group.trim();
    const tickets = getTicketCount(playerForm.tickets);

    if (!name) {
      setStatusMessage("Enter a player name before adding.");
      return;
    }

    if (!tickets) {
      setStatusMessage("Tickets bought must be at least 1.");
      return;
    }

    setStatusMessage("Saving player...");

    try {
      const payload = await createPlayer({ name, group, tickets });
      setPlayers((currentPlayers) => currentPlayers.concat({
        id: payload.id,
        name: payload.name,
        group: payload.group_name || "",
        tickets: payload.tickets
      }));
      setPlayerForm(emptyPlayerForm());
      setStatusMessage(`${payload.name} added successfully.`);
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  async function handleRemovePlayer(playerId) {
    const targetPlayer = players.find((player) => String(player.id) === String(playerId));
    if (!targetPlayer) {
      return;
    }

    setStatusMessage(`Removing ${targetPlayer.name}...`);

    try {
      await deletePlayer(playerId);
      setPlayers((currentPlayers) => currentPlayers.filter((player) => String(player.id) !== String(playerId)));
      setSelectedPlayerIds((currentIds) => currentIds.filter((id) => String(id) !== String(playerId)));
      setStatusMessage(`${targetPlayer.name} removed.`);
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  async function handleClearPlayers() {
    if (!players.length) {
      setStatusMessage("There are no players to clear.");
      return;
    }

    setStatusMessage("Clearing all players...");

    try {
      await deleteAllPlayers();
      setPlayers([]);
      setSelectedPlayerIds([]);
      setBulkGroupName("");
      setStatusMessage("All players cleared.");
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  function handlePlayerFormChange(field, value) {
    setPlayerForm((currentForm) => ({
      ...currentForm,
      [field]: value
    }));
  }

  function handlePlayerTicketChange(playerId, value) {
    const nextTickets = Math.max(1, getTicketCount(value) || 1);
    setPlayers((currentPlayers) => currentPlayers.map((player) => (
      String(player.id) === String(playerId)
        ? { ...player, tickets: nextTickets }
        : player
    )));
    setStatusMessage("Player tickets updated locally. Tap away to save.");
  }

  async function handlePlayerTicketBlur(playerId) {
    const targetPlayer = players.find((player) => String(player.id) === String(playerId));

    if (!targetPlayer) {
      return;
    }

    setStatusMessage(`Saving ticket update for ${targetPlayer.name}...`);

    try {
      await replacePlayers(players.map((player) => ({
        id: player.id,
        name: player.name,
        tickets: player.tickets,
        group: player.group,
        group_name: player.group
      })));
      setStatusMessage(`Tickets updated for ${targetPlayer.name}.`);
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  function handleTogglePlayerSelection(playerId) {
    setSelectedPlayerIds((currentIds) => (
      currentIds.includes(playerId)
        ? currentIds.filter((id) => id !== playerId)
        : currentIds.concat(playerId)
    ));
  }

  function handleToggleAllPlayers(selected) {
    setSelectedPlayerIds(selected ? players.map((player) => player.id) : []);
  }

  async function handleApplyBulkGroup(clearGroup = false) {
    if (!selectedPlayerIds.length) {
      setStatusMessage("Select at least one player from the table first.");
      return;
    }

    const trimmedGroupName = bulkGroupName.trim();

    if (!clearGroup && !trimmedGroupName) {
      setStatusMessage("Enter a group name before applying it to selected players.");
      return;
    }

    const nextPlayers = players.map((player) => (
      selectedPlayerIds.includes(player.id)
        ? {
            ...player,
            group: clearGroup ? "" : trimmedGroupName
          }
        : player
    ));

    setStatusMessage(clearGroup ? "Clearing selected player groups..." : "Saving selected player group...");

    try {
      await replacePlayers(nextPlayers.map((player) => ({
        id: player.id,
        name: player.name,
        tickets: player.tickets,
        group: player.group,
        group_name: player.group
      })));

      setPlayers(nextPlayers);
      setSelectedPlayerIds([]);
      setBulkGroupName(clearGroup ? "" : trimmedGroupName);
      setStatusMessage(clearGroup
        ? "Selected players were removed from their group."
        : `Selected players added to ${trimmedGroupName}.`);
    } catch (error) {
      setStatusMessage(error.message);
    }
  }

  function handlePrizeChange(prizeKey, field, value) {
    if (field === "amount") {
      setPrizeAmountsEdited(true);
      setPrizeSetupStatus("Prize setup has unsaved changes.");
    }

    if (field === "winners") {
      setPrizeSetupStatus("Prize winners updated. Save when ready.");
    }

    if (field === "amount" && linePrizeKeys.includes(prizeKey)) {
      const syncedAmount = formatPrizeAmount(toPrizeAmount(value));
      setPrizes((currentPrizes) => ({
        ...currentPrizes,
        ...Object.fromEntries(
          linePrizeKeys.map((lineKey) => [
            lineKey,
            {
              ...currentPrizes[lineKey],
              amount: syncedAmount
            }
          ])
        )
      }));
      return;
    }

    setPrizes((currentPrizes) => ({
      ...currentPrizes,
      [prizeKey]: {
        ...currentPrizes[prizeKey],
        [field]: value
      }
    }));
  }

  function handlePrizeAmountBlur() {
    setPrizes((currentPrizes) => normalizePrizeRules(currentPrizes));
  }

  function handleAutoFillPrizes() {
    setPrizeAmountsEdited(false);
    setPrizeSetupStatus("Prize setup recalculated from total collection.");
    setPrizes((currentPrizes) => buildAutomaticPrizeAmounts(totalCollection, currentPrizes));
  }

  async function handleSavePrizeSetup() {
    const correctedPrizes = normalizePrizeRules(prizes);
    const validation = validatePrizeSetup(correctedPrizes);

    if (!validation.isValid) {
      const messages = [];

      if (validation.missingAmounts.length) {
        messages.push(`Add amounts for: ${validation.missingAmounts.join(", ")}`);
      }

      if (validation.missingWinners.length) {
        messages.push(`Select winners for: ${validation.missingWinners.join(", ")}`);
      }

      setPrizes(correctedPrizes);
      setPrizeSetupStatus(messages.join(". "));
      return;
    }

    setPrizes(correctedPrizes);
    setPrizeAmountsEdited(true);
    setPrizeSetupStatus("Saving prize setup...");

    const game = await persistGame("draft");

    if (game) {
      setPrizeSetupStatus(`Prize setup saved to Game #${game.id}.`);
    } else {
      setPrizeSetupStatus("Could not save prize setup.");
    }
  }

  const effectivePrizes = normalizePrizeRules(prizes);
  const liveCalculation = calculateSettlement(players, ticketPrice, settlementName, effectivePrizes);
  const visibleCalculation = savedScorecard || liveCalculation;
  const completedGamesAggregate = buildCompletedGamesAggregate(games);

  if (screen === "landing") {
    return <LandingScreen onOpenStudio={handleOpenStudio} />;
  }

  if (screen === "studio") {
    return (
      <GameStudioScreen
        games={games}
        status={studioStatus}
        pendingDeleteGame={pendingDeleteGame}
        onBack={() => setScreen("landing")}
        onOpenAggregate={() => setScreen("aggregate")}
        onAddGame={handleAddGameFlow}
        onResumeGame={handleResumeGame}
        onOpenGameScorecard={handleOpenSavedGameScorecard}
        onDeleteGame={handleDeleteGame}
        onCancelDeleteGame={() => setPendingDeleteGame(null)}
        onConfirmDeleteGame={confirmDeleteGame}
      />
    );
  }

  if (screen === "aggregate") {
    return (
      <StudioAggregateScreen
        aggregate={completedGamesAggregate}
        onBack={() => setScreen("studio")}
      />
    );
  }

  if (screen === "scorecard") {
    return (
      <ScoreCardScreen
        calculation={visibleCalculation}
        isFinalized={Boolean(currentGame?.status === "completed" || savedScorecard)}
        onBack={() => setScreen(currentGame?.status === "completed" && savedScorecard ? "studio" : "builder")}
        onFinalize={handleFinalizeSettlement}
      />
    );
  }

  return (
    <GameBuilderScreen
      calculation={liveCalculation}
      currentGame={currentGame}
      players={players}
      selectedPlayerIds={selectedPlayerIds}
      bulkGroupName={bulkGroupName}
      playerForm={playerForm}
      statusMessage={statusMessage}
      ticketPrice={ticketPrice}
      settlementName={settlementName}
      prizes={prizes}
      onBack={() => setScreen("studio")}
      onPlayerFormChange={handlePlayerFormChange}
      onBulkGroupNameChange={setBulkGroupName}
      onTogglePlayerSelection={handleTogglePlayerSelection}
      onToggleAllPlayers={handleToggleAllPlayers}
      onApplyBulkGroup={() => handleApplyBulkGroup(false)}
      onClearBulkGroup={() => handleApplyBulkGroup(true)}
      onAddPlayer={handleAddPlayer}
      onRemovePlayer={handleRemovePlayer}
      onClearPlayers={handleClearPlayers}
      onPlayerTicketChange={handlePlayerTicketChange}
      onPlayerTicketBlur={handlePlayerTicketBlur}
      onTicketPriceChange={setTicketPrice}
      onSettlementNameChange={setSettlementName}
      onPrizeChange={handlePrizeChange}
      onPrizeAmountBlur={handlePrizeAmountBlur}
      onAutoFillPrizes={handleAutoFillPrizes}
      onSavePrizeSetup={handleSavePrizeSetup}
      prizeAmountsEdited={prizeAmountsEdited}
      prizeSetupStatus={prizeSetupStatus}
      totalCollection={totalCollection}
      onViewScoreCard={handleOpenScoreCard}
      onSaveDraft={handleSaveDraft}
    />
  );
}
