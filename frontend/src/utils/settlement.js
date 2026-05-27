import { prizeDefinitions } from "../constants/prizes.js";
import {
  getMoneyInput,
  getTicketCount,
  normalizeName,
  roundMoney,
  splitWinnerNames,
  toMoney
} from "./formatters.js";

export function getSettlementPartyName(player, fallbackName) {
  const groupName = String(player.group || "").trim();
  if (groupName) {
    return groupName;
  }

  return String(fallbackName || player.name || "").trim();
}

export function buildTransactions(balances) {
  const debtors = balances
    .filter((entry) => entry.net < -0.009)
    .map((entry) => ({ name: entry.name, amount: roundMoney(-entry.net) }));

  const creditors = balances
    .filter((entry) => entry.net > 0.009)
    .map((entry) => ({ name: entry.name, amount: roundMoney(entry.net) }));

  const transactions = [];
  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amount = roundMoney(Math.min(debtor.amount, creditor.amount));

    if (amount > 0) {
      transactions.push({
        from: debtor.name,
        to: creditor.name,
        amount
      });

      debtor.amount = roundMoney(debtor.amount - amount);
      creditor.amount = roundMoney(creditor.amount - amount);
    }

    if (debtor.amount <= 0.009) {
      debtorIndex += 1;
    }

    if (creditor.amount <= 0.009) {
      creditorIndex += 1;
    }
  }

  return transactions;
}

export function buildGroupSummary(scoreboard) {
  const summary = new Map();

  scoreboard.forEach((row) => {
    const key = row.settlementParty;
    const current = summary.get(key) || {
      name: key,
      members: 0,
      tickets: 0,
      contribution: 0,
      winnings: 0,
      net: 0
    };

    current.members += 1;
    current.tickets += row.tickets;
    current.contribution = roundMoney(current.contribution + row.contribution);
    current.winnings = roundMoney(current.winnings + row.winnings);
    current.net = roundMoney(current.net + row.net);
    summary.set(key, current);
  });

  return Array.from(summary.values());
}

export function buildCompletedGamesAggregate(games) {
  const completedGames = games.filter((game) => game.status === "completed" && Array.isArray(game?.result?.scoreboard));
  const aggregate = new Map();

  let totalCollection = 0;
  let totalDistributedPrize = 0;
  let totalTransfers = 0;

  completedGames.forEach((game) => {
    totalCollection = roundMoney(totalCollection + Number(game?.result?.totalAmount || 0));
    totalDistributedPrize = roundMoney(totalDistributedPrize + Number(game?.result?.distributedPrizeTotal || 0));
    totalTransfers += Array.isArray(game?.result?.transactions) ? game.result.transactions.length : 0;

    game.result.scoreboard.forEach((row) => {
      const key = row.settlementParty || row.group || row.name;
      const current = aggregate.get(key) || {
        name: key,
        games: new Set(),
        members: new Set(),
        tickets: 0,
        contribution: 0,
        winnings: 0,
        net: 0
      };

      current.games.add(game.id);
      current.members.add(row.name);
      current.tickets += Number(row.tickets || 0);
      current.contribution = roundMoney(current.contribution + Number(row.contribution || 0));
      current.winnings = roundMoney(current.winnings + Number(row.winnings || 0));
      current.net = roundMoney(current.net + Number(row.net || 0));
      aggregate.set(key, current);
    });
  });

  const parties = Array.from(aggregate.values())
    .map((entry) => ({
      name: entry.name,
      games: entry.games.size,
      members: entry.members.size,
      tickets: entry.tickets,
      contribution: entry.contribution,
      winnings: entry.winnings,
      net: entry.net
    }))
    .sort((a, b) => Math.abs(b.net) - Math.abs(a.net));

  const transactions = buildTransactions(
    parties.map((party) => ({
      name: party.name,
      net: party.net
    }))
  );

  return {
    completedGamesCount: completedGames.length,
    totalCollection,
    totalDistributedPrize,
    totalTransfers,
    parties,
    transactions
  };
}

export function calculateSettlement(players, ticketPriceValue, settlementNameValue, prizes) {
  const messages = [];
  const settlementName = settlementNameValue.trim() || "Organizer";
  const ticketPrice = getMoneyInput(ticketPriceValue);
  const totalTickets = players.reduce((sum, player) => sum + getTicketCount(player.tickets), 0);
  const perTicketAmount = ticketPrice;
  const totalAmount = roundMoney(totalTickets * ticketPrice);

  const normalizedPlayers = players.map((player) => ({
    id: player.id,
    name: String(player.name || "").trim(),
    group: String(player.group || "").trim(),
    normalizedName: normalizeName(player.name),
    tickets: getTicketCount(player.tickets)
  }));

  const duplicateNames = normalizedPlayers
    .filter((player, index, list) => player.normalizedName && list.findIndex((entry) => entry.normalizedName === player.normalizedName) !== index)
    .map((player) => player.name);

  if (duplicateNames.length) {
    messages.push({
      type: "error",
      text: `Duplicate player names found: ${Array.from(new Set(duplicateNames)).join(", ")}. Winner matching needs unique names.`
    });
  }

  const playerByName = new Map();
  normalizedPlayers.forEach((player) => {
    if (player.normalizedName && !playerByName.has(player.normalizedName)) {
      playerByName.set(player.normalizedName, player);
    }
  });

  const winningsById = new Map(normalizedPlayers.map((player) => [player.id, 0]));
  const prizeBreakdownById = new Map(normalizedPlayers.map((player) => [player.id, []]));
  let configuredPrizeTotal = 0;
  let distributedPrizeTotal = 0;

  prizeDefinitions.forEach((prize) => {
    const config = prizes[prize.key];
    const amount = getMoneyInput(config.amount);
    const winnerNames = splitWinnerNames(config.winners);
    const resolvedPlayers = [];
    const unknownNames = [];

    configuredPrizeTotal += amount;

    winnerNames.forEach((name) => {
      const player = playerByName.get(normalizeName(name));
      if (!player) {
        unknownNames.push(name);
        return;
      }

      if (!resolvedPlayers.some((entry) => entry.id === player.id)) {
        resolvedPlayers.push(player);
      }
    });

    if (unknownNames.length) {
      messages.push({
        type: "error",
        text: `${prize.label}: these names are not in the player list: ${unknownNames.join(", ")}.`
      });
    }

    if (amount > 0 && !resolvedPlayers.length) {
      messages.push({
        type: "warning",
        text: `${prize.label}: amount is set but no valid winner was matched, so it stays with ${settlementName}.`
      });
    }

    if (amount > 0 && resolvedPlayers.length) {
      const splitAmount = roundMoney(amount / resolvedPlayers.length);
      let distributedForPrize = 0;

      resolvedPlayers.forEach((player, index) => {
        const payout = index === resolvedPlayers.length - 1
          ? roundMoney(amount - distributedForPrize)
          : splitAmount;

        winningsById.set(player.id, roundMoney(winningsById.get(player.id) + payout));
        prizeBreakdownById.set(player.id, [
          ...prizeBreakdownById.get(player.id),
          {
            label: prize.label,
            amount: payout
          }
        ]);
        distributedForPrize = roundMoney(distributedForPrize + payout);
      });

      distributedPrizeTotal = roundMoney(distributedPrizeTotal + distributedForPrize);
    }
  });

  if (!players.length) {
    messages.push({ type: "warning", text: "Add players before calculating the settlement." });
  }

  if (!ticketPrice) {
    messages.push({ type: "warning", text: "Enter the ticket price to calculate the total collection and each player's contribution." });
  }

  if (!totalTickets) {
    messages.push({ type: "warning", text: "Each player needs at least one ticket to calculate the share per ticket." });
  }

  const scoreboard = normalizedPlayers.map((player) => {
    const contribution = roundMoney(player.tickets * perTicketAmount);
    const winnings = roundMoney(winningsById.get(player.id) || 0);
    const net = roundMoney(winnings - contribution);

    return {
      name: player.name,
      group: player.group,
      settlementParty: getSettlementPartyName(player, player.name),
      tickets: player.tickets,
      contribution,
      winnings,
      prizeBreakdown: prizeBreakdownById.get(player.id) || [],
      net
    };
  });

  const houseBalance = roundMoney(totalAmount - distributedPrizeTotal);

  if (configuredPrizeTotal > totalAmount && totalAmount > 0) {
    messages.push({
      type: "warning",
      text: `Configured prizes total ${toMoney(configuredPrizeTotal)}, which is more than the collected amount ${toMoney(totalAmount)}. ${settlementName} will need to pay the shortfall.`
    });
  }

  if (configuredPrizeTotal < totalAmount && totalAmount > 0) {
    messages.push({
      type: "info",
      text: `Configured prizes total ${toMoney(configuredPrizeTotal)}. The remaining ${toMoney(totalAmount - configuredPrizeTotal)} stays with ${settlementName} unless you add more prize categories.`
    });
  }

  const groupedBalances = new Map();

  scoreboard.forEach((row) => {
    const current = groupedBalances.get(row.settlementParty) || 0;
    groupedBalances.set(row.settlementParty, roundMoney(current + row.net));
  });

  const balances = Array.from(groupedBalances.entries()).map(([name, net]) => ({
    name,
    net
  }));

  if (Math.abs(houseBalance) >= 0.01) {
    balances.push({ name: settlementName, net: houseBalance });
  }

  return {
    messages,
    totalAmount,
    ticketPrice,
    totalTickets,
    perTicketAmount,
    configuredPrizeTotal,
    distributedPrizeTotal,
    houseBalance,
    settlementName,
    scoreboard,
    transactions: buildTransactions(balances)
  };
}
