const express = require("express");
const fs = require("fs/promises");
const path = require("path");
const { games, slug, MAX_PICKS } = require("./games");

const PORT = process.env.PORT || 3000;
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "votes.json");
const GAME_IDS = new Set(games.map((g) => g.id));

// ---- Stockage : un fichier JSON, écrit de façon atomique ----
let votes = {};
let writeChain = Promise.resolve();

async function load() {
  try {
    votes = JSON.parse(await fs.readFile(DATA_FILE, "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
    votes = {};
  }
}

function persist() {
  // Les écritures passent une par une : jamais deux writeFile simultanés sur le même fichier.
  writeChain = writeChain.then(async () => {
    const tmp = DATA_FILE + ".tmp";
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(tmp, JSON.stringify(votes, null, 2));
    await fs.rename(tmp, DATA_FILE); // rename = remplacement atomique
  });
  return writeChain;
}

// ---- API ----
const app = express();
app.use(express.json({ limit: "10kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/games", (req, res) => res.json({ games, max: MAX_PICKS }));

app.get("/api/votes", (req, res) => res.json({ votes }));

app.put("/api/votes/:key", async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim().slice(0, 40) : "";
  const key = slug(name);
  if (!key || key !== req.params.key) {
    return res.status(400).json({ error: "Prénom invalide." });
  }
  const picks = req.body?.games;
  if (!Array.isArray(picks) || !picks.every((id) => GAME_IDS.has(id))) {
    return res.status(400).json({ error: "Liste de jeux invalide." });
  }
  const unique = [...new Set(picks)];
  if (unique.length > MAX_PICKS) {
    return res.status(400).json({ error: `Maximum ${MAX_PICKS} jeux.` });
  }

  votes[key] = { name, games: unique, updatedAt: Date.now() };
  try {
    await persist();
    res.json({ ok: true, vote: votes[key] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Enregistrement impossible côté serveur." });
  }
});

load().then(() => {
  const server = app.listen(PORT, () => console.log(`Vote festival sur http://localhost:${PORT}`));

  // En PID 1 (Docker), Node n'a pas de gestionnaire SIGTERM par défaut :
  // on ferme proprement après la dernière écriture en cours.
  const shutdown = () => {
    server.close();
    writeChain.finally(() => process.exit(0));
  };
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
});
