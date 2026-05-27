const express = require("express");
const router = express.Router();
const { readGames, writeGames } = require("../store/jsonStore");

router.get("/", async (req,res)=>{
  try {
    const games = await readGames();
    res.send(games.sort((a, b) => b.id - a.id));
  } catch (error) {
    res.status(500).send({ message: "Could not read games.", error: error.message });
  }
});

router.post("/", async (req,res)=>{
  const {ticketPrice,prizes,winners,result,players,settlementName,status}=req.body;

  try {
    const games = await readGames();
    const nextId = games.reduce((maxId, game) => Math.max(maxId, Number(game.id) || 0), 0) + 1;
    const gameRecord = {
      id: nextId,
      ticketPrice,
      players: players || [],
      settlementName: settlementName || "Organizer",
      prizes,
      winners,
      result,
      status: status || "draft",
      createdAt: new Date().toISOString()
    };

    games.push(gameRecord);
    await writeGames(games);
    res.send({message:"saved", game: gameRecord});
  } catch (error) {
    res.status(500).send({ message: "Could not save game.", error: error.message });
  }
});

router.put("/:id", async (req,res)=>{
  const {ticketPrice,prizes,winners,result,players,settlementName,status} = req.body;

  try {
    const games = await readGames();
    const targetId = Number(req.params.id);
    const gameIndex = games.findIndex((game) => Number(game.id) === targetId);

    if (gameIndex === -1) {
      return res.status(404).send({ message: "Game not found." });
    }

    const existingGame = games[gameIndex];
    const updatedGame = {
      ...existingGame,
      ticketPrice,
      players: players || [],
      settlementName: settlementName || "Organizer",
      prizes,
      winners,
      result,
      status: status || existingGame.status || "draft",
      updatedAt: new Date().toISOString()
    };

    games[gameIndex] = updatedGame;
    await writeGames(games);
    res.send({ message: "updated", game: updatedGame });
  } catch (error) {
    res.status(500).send({ message: "Could not update game.", error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const games = await readGames();
    const targetId = Number(req.params.id);
    const remainingGames = games.filter((game) => Number(game.id) !== targetId);

    if (remainingGames.length === games.length) {
      return res.status(404).send({ message: "Game not found." });
    }

    await writeGames(remainingGames);
    res.send({ message: "Game deleted." });
  } catch (error) {
    res.status(500).send({ message: "Could not delete game.", error: error.message });
  }
});

module.exports = router;
