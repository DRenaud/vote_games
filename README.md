# Vote festival

Petite appli Express pour choisir les jeux à emporter au festival.
Chacun saisit son prénom, coche jusqu'à 30 jeux et enregistre.

## Lancer

```bash
npm install
npm start          # http://localhost:3000
```

Variables d'environnement :
- `PORT` : port d'écoute (défaut 3000)
- `DATA_FILE` : chemin du fichier de votes (défaut `data/votes.json`)

## Fonctionnement

- `GET /api/games` : liste des jeux et maximum autorisé (30)
- `GET /api/votes` : tous les votes
- `PUT /api/votes/:prenom` : enregistre le vote d'une personne (`{ name, games }`)

La liste des jeux est dans `games.js`, la limite aussi (`MAX_PICKS`).
Le serveur refuse tout vote au-delà de 30 jeux, même si le front est contourné.

Les votes sont stockés dans un fichier JSON : l'hébergeur doit fournir un disque
persistant, sinon les votes disparaissent à chaque redéploiement.

## Docker

```bash
docker build -t vote-games .
docker run -d -p 3000:3000 -v vote-games-data:/app/data vote-games
```

Les votes sont dans `/app/data` : monter un volume dessus pour les garder entre deux redémarrages.
