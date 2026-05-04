# TP1 — Stack microservices avec Docker Compose

Petit exemple de stack à 3 services orchestrée avec Docker Compose, en local.

## Architecture

- **`quotes`** — service Python/Flask, sert des citations aléatoires (port interne `5000`, non exposé).
- **`api`** — API Gateway Node.js/Express, expose les endpoints publics et appelle `quotes` (port `3000`).
- **`frontend`** — page statique servie par nginx, build webpack inclus dans l'image (port `8080`).

Les 3 services tournent sur un réseau Docker interne (`backend`) et ont chacun un healthcheck.

## Lancer la stack

Pré-requis : Docker Desktop démarré.

```bash
docker-compose up --build
```

C'est tout. Pas besoin de builder le frontend à la main : le Dockerfile du frontend embarque l'étape `yarn build` (multi-stage).

Pour arrêter :
```bash
docker-compose down
```

## URLs disponibles

| URL | Description |
|---|---|
| http://localhost:8080 | Page web (clique sur *Get quote*) |
| http://localhost:3000/api/status | Statut de l'API Gateway |
| http://localhost:3000/api/randomquote | Récupère une citation via la chaîne complète api → quotes |

### Endpoints d'observabilité

Chaque service expose `/health` et `/metrics` (format texte Prometheus) :

| Service | Health | Metrics |
|---|---|---|
| API Gateway | http://localhost:3000/health | http://localhost:3000/metrics |
| Frontend | http://localhost:8080/health | http://localhost:8080/metrics |
| Quotes | interne (`http://quotes:5000/health`) | interne (`http://quotes:5000/metrics`) |

Le service `quotes` n'est volontairement pas exposé sur l'hôte, il n'est joignable que depuis les autres conteneurs.

## Vérifier rapidement que tout est en bonne santé

```bash
docker ps
# Les 3 conteneurs doivent être en (healthy)

curl http://localhost:3000/health
curl http://localhost:3000/api/randomquote
curl http://localhost:8080/health
```

## Configurer l'API Gateway pour le frontend

Par défaut, le frontend appelle `http://localhost:3000`. Si tu hébergeais ailleurs, il faut passer l'URL au build du frontend via l'argument `API_GATEWAY` dans `docker-compose.yml` :

```yaml
frontend:
  build:
    args:
      API_GATEWAY: http://mon-host:3000
```

Puis `docker-compose up --build`.

## Dépannage

- **Port 8080 ou 3000 déjà pris** → `lsof -i :8080` puis tuer le process, ou changer le mapping de port dans `docker-compose.yml`.
- **`Not Found` quand on clique sur "Get quote"** → l'URL `API_GATEWAY` n'a pas été figée dans le bundle. Rebuild avec `docker-compose up --build --force-recreate` et hard refresh du navigateur (`Cmd+Shift+R`).
- **Healthcheck en échec** → `docker logs <nom-du-conteneur>` pour voir ce qui se passe.

![image](https://user-images.githubusercontent.com/13379595/42726706-82eb0ae6-87b6-11e8-8456-d933b9dfa73b.png)
