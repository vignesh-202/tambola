async function readResponsePayload(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return { rawText: text };
}

function getApiErrorMessage(response, payload, fallbackMessage) {
  if (payload?.message) {
    return payload.message;
  }

  if (response.status === 404 && typeof payload?.rawText === "string" && payload.rawText.includes("<!DOCTYPE")) {
    return "The backend delete route is not available yet. Restart the backend server on port 5000 and try again.";
  }

  if (response.status === 404) {
    return "The requested game was not found. Refresh the studio and try again.";
  }

  return fallbackMessage;
}

export async function fetchPlayers() {
  const response = await fetch("/players");
  if (!response.ok) {
    throw new Error("Could not load players from the backend.");
  }
  return response.json();
}

export async function createPlayer(payload) {
  const response = await fetch("/players", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Could not save the player.");
  }

  return data;
}

export async function deletePlayer(playerId) {
  const response = await fetch(`/players/${playerId}`, { method: "DELETE" });
  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Could not remove the player.");
  }

  return data;
}

export async function deleteAllPlayers() {
  const response = await fetch("/players", { method: "DELETE" });
  let data = {};

  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Could not clear players.");
  }

  return data;
}

export async function fetchGames() {
  const response = await fetch("/games");
  if (!response.ok) {
    throw new Error("Could not load games from the backend.");
  }
  return response.json();
}

export async function createGame(payload) {
  const response = await fetch("/games", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Could not save the game.");
  }

  return data;
}

export async function updateGame(gameId, payload) {
  const response = await fetch(`/games/${gameId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Could not update the game.");
  }

  return data;
}

export async function deleteGame(gameId) {
  const response = await fetch(`/games/${gameId}`, { method: "DELETE" });
  const data = await readResponsePayload(response);

  if (!response.ok) {
    throw new Error(getApiErrorMessage(response, data, "Could not delete the game."));
  }

  return data;
}

export async function replacePlayers(players) {
  const response = await fetch("/players", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ players })
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Could not replace players.");
  }

  return data;
}
