const express = require("express");
const cors = require("cors");

const players = require("./routes/players");
const games = require("./routes/games");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/players", players);
app.use("/games", games);
app.get("/", (req, res) => {
  res.send({ message: "Tambola backend API is running on port 5000." });
});

app.listen(5000, () => console.log("Server running on 5000"));
