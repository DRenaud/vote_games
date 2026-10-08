const $ = (id) => document.getElementById(id);
const slug = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

let games = [], MAX = 30, votes = {}, me = null, picks = new Set(), dirty = false, sort = "list", saving = false;

function ls(get, k, v) { try { return get ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) { return null; } }

function tally() {
  const t = {}; games.forEach((g) => (t[g.id] = []));
  Object.entries(votes).forEach(([key, v]) => {
    if (me && key === me.key) return;
    (Array.isArray(v.games) ? v.games : []).forEach((id) => { if (t[id]) t[id].push(String(v.name || key)); });
  });
  if (me) picks.forEach((id) => t[id] && t[id].push(me.name));
  return t;
}

function render() {
  const t = tally(), q = slug($("search").value);
  let rows = games.filter((g) => !q || g.id.includes(q));
  if (sort === "votes") rows.sort((a, b) => t[b.id].length - t[a.id].length || a.order - b.order);
  else if (sort === "alpha") rows.sort((a, b) => a.title.localeCompare(b.title, "fr"));
  const list = $("list"); list.textContent = "";
  if (!rows.length) { const li = document.createElement("li"); li.className = "empty"; li.textContent = games.length ? "Aucun jeu ne correspond." : "Chargement des jeux…"; list.append(li); }
  rows.forEach((g) => {
    const li = document.createElement("li");
    const lab = document.createElement("label");
    const mine = picks.has(g.id);
    lab.className = "game" + (mine ? " mine" : "") + (me ? "" : " locked");
    const cb = document.createElement("input"); cb.type = "checkbox"; cb.id = "g-" + g.id; cb.checked = mine; cb.disabled = !me;
    cb.addEventListener("change", () => { cb.checked ? picks.add(g.id) : picks.delete(g.id); dirty = true; render(); });
    const mid = document.createElement("span"); mid.className = "gtitle"; mid.append(g.title);
    const yr = document.createElement("span"); yr.className = "gyear"; yr.textContent = g.year; mid.append(yr);
    const who = document.createElement("span"); who.className = "voters";
    who.textContent = t[g.id].length ? t[g.id].join(", ") : "Personne pour l'instant"; mid.append(who);
    const c = document.createElement("span"); c.className = "count" + (t[g.id].length ? " hot" : ""); c.textContent = t[g.id].length;
    c.setAttribute("aria-label", t[g.id].length + " vote(s)");
    lab.append(cb, mid, c); li.append(lab); list.append(li);
  });
  const voters = new Set(Object.keys(votes)); if (me && picks.size) voters.add(me.key);
  const chosen = games.filter((g) => t[g.id].length).length;
  $("summary").textContent = `${chosen} jeu${chosen > 1 ? "x" : ""} sur ${games.length} demandé${chosen > 1 ? "s" : ""} · ${voters.size} votant${voters.size > 1 ? "s" : ""}`;
  const over = picks.size - MAX;
  $("barInfo").textContent = !me ? "Saisis ton prénom pour voter"
    : over > 0 ? `${picks.size} / ${MAX} · décoche ${over} jeu${over > 1 ? "x" : ""} pour enregistrer`
    : `${me.name} · ${picks.size} / ${MAX}${dirty ? " · non enregistré" : ""}`;
  $("barInfo").classList.toggle("over", over > 0);
  $("saveBtn").disabled = !me || !dirty || saving || over > 0;
}

function loadMine() {
  if (!me || dirty) return;
  const v = votes[me.key];
  picks = new Set(v && Array.isArray(v.games) ? v.games.filter((id) => games.some((g) => g.id === id)) : []);
}

async function refresh() {
  try {
    const r = await fetch("api/votes", { cache: "no-store" });
    if (!r.ok) throw new Error(r.status);
    votes = (await r.json()).votes || {};
    loadMine(); render();
  } catch (e) {
    $("status").textContent = "Impossible de récupérer les votes. Vérifie ta connexion.";
  }
}

$("whoForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const name = $("pseudo").value.trim().slice(0, 40), key = slug(name);
  if (!key) { $("status").textContent = "Écris un prénom ou un pseudo avec au moins une lettre."; return; }
  me = { name, key }; dirty = false; ls(false, "festival-pseudo", name); loadMine();
  $("status").textContent = votes[key] ? `Re-bonjour ${name}, tes choix précédents sont chargés.` : `Bienvenue ${name}, coche tes jeux puis enregistre.`;
  render();
});

$("saveBtn").addEventListener("click", async () => {
  if (!me || picks.size > MAX) return;
  saving = true; render();
  try {
    const r = await fetch("api/votes/" + encodeURIComponent(me.key), {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: me.name, games: [...picks] }),
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(body.error || "Erreur " + r.status);
    votes[me.key] = body.vote; dirty = false;
    $("status").textContent = "Enregistré. Tu peux revenir modifier quand tu veux.";
  } catch (err) {
    $("status").textContent = "L'enregistrement n'a pas abouti : " + err.message;
  }
  saving = false; render();
});

[["sortList", "list"], ["sortVotes", "votes"], ["sortAlpha", "alpha"]].forEach(([id, s]) => $(id).addEventListener("click", () => {
  sort = s; ["sortList", "sortVotes", "sortAlpha"].forEach((b) => $(b).setAttribute("aria-pressed", b === id)); render();
}));
$("search").addEventListener("input", render);

const saved = ls(true, "festival-pseudo"); if (saved) $("pseudo").value = saved;
render();

(async () => {
  try {
    const r = await fetch("api/games");
    const data = await r.json();
    games = data.games.map((g, i) => ({ ...g, order: i })); MAX = data.max;
  } catch (e) { $("status").textContent = "Impossible de charger la liste des jeux."; return; }
  $("status").textContent = saved ? "Clique sur « C'est moi » pour retrouver tes choix." : "Saisis ton prénom pour commencer.";
  await refresh();
  setInterval(() => { if (!document.hidden) refresh(); }, 10000);
})();
