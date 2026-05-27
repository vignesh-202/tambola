const express = require("express");
const router = express.Router();
const { readPlayers, writePlayers } = require("../store/jsonStore");

router.get("/", async (req,res)=>{
  try {
    const players = await readPlayers();
    res.send(players.sort((a, b) => a.id - b.id));
  } catch (error) {
    res.status(500).send({ message: "Could not read players.", error: error.message });
  }
});

router.post("/", async (req,res)=>{
  const {name,tickets,group}=req.body;
  const cleanName = String(name || "").trim();
  const cleanTickets = Number.parseInt(tickets, 10);
  const cleanGroup = String(group || "").trim();

  if(!cleanName){
    return res.status(400).send({message:"Player name is required."});
  }

  if(!Number.isInteger(cleanTickets) || cleanTickets < 1){
    return res.status(400).send({message:"Tickets must be a whole number greater than 0."});
  }

  try {
    const players = await readPlayers();
    const nextId = players.reduce((maxId, player) => Math.max(maxId, Number(player.id) || 0), 0) + 1;
    const newPlayer = {
      id: nextId,
      name: cleanName,
      tickets: cleanTickets,
      group_name: cleanGroup || "",
      group: cleanGroup || ""
    };

    players.push(newPlayer);
    await writePlayers(players);
    res.send(newPlayer);
  } catch (error) {
    res.status(500).send({ message: "Could not save player.", error: error.message });
  }
});

router.delete("/:id", async (req,res)=>{
  try {
    const players = await readPlayers();
    const targetId = Number(req.params.id);
    const filteredPlayers = players.filter((player) => Number(player.id) !== targetId);

    if(filteredPlayers.length === players.length){
      return res.status(404).send({message:"Player not found."});
    }

    await writePlayers(filteredPlayers);
    res.send({message:"Player deleted."});
  } catch (error) {
    res.status(500).send({ message: "Could not delete player.", error: error.message });
  }
});

router.delete("/", async (req,res)=>{
  try {
    await writePlayers([]);
    res.send({message:"All players deleted."});
  } catch (error) {
    res.status(500).send({ message: "Could not clear players.", error: error.message });
  }
});

router.put("/", async (req,res)=>{
  const incomingPlayers = Array.isArray(req.body?.players) ? req.body.players : [];

  try {
    const normalizedPlayers = incomingPlayers.map((player, index) => ({
      id: Number(player.id) || index + 1,
      name: String(player.name || "").trim(),
      tickets: Number.parseInt(player.tickets, 10) || 1,
      group_name: String(player.group_name || player.group || "").trim(),
      group: String(player.group || player.group_name || "").trim()
    }));

    await writePlayers(normalizedPlayers);
    res.send({ message: "Players replaced.", players: normalizedPlayers });
  } catch (error) {
    res.status(500).send({ message: "Could not replace players.", error: error.message });
  }
});

module.exports = router;
