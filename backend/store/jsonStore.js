const fs = require("fs/promises");
const path = require("path");

const dataDirectory = path.join(__dirname, "../data");

async function ensureFile(fileName, fallbackValue) {
  await fs.mkdir(dataDirectory, { recursive: true });
  const filePath = path.join(dataDirectory, fileName);

  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(fallbackValue, null, 2));
  }

  return filePath;
}

async function readJson(fileName, fallbackValue) {
  const filePath = await ensureFile(fileName, fallbackValue);
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content || JSON.stringify(fallbackValue));
}

async function writeJson(fileName, data) {
  const filePath = await ensureFile(fileName, data);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function readPlayers() {
  return readJson("players.json", []);
}

async function writePlayers(players) {
  return writeJson("players.json", players);
}

async function readGames() {
  return readJson("games.json", []);
}

async function writeGames(games) {
  return writeJson("games.json", games);
}

module.exports = {
  readPlayers,
  writePlayers,
  readGames,
  writeGames
};
