# Saludablex — setting up PocketBase with Docker

Saludablex has two parts:

| Folder        | What it is                                                                                  |
| ------------- | ------------------------------------------------------------------------------------------- |
| `pocketbase/` | Backend: PocketBase in Docker. It handles accounts, the database, photo storage and food recognition |
| `frontend/`   | React + Vite web app, built to static files                                                 |

```
pocketbase/
├── Dockerfile              # Alpine image with the PocketBase binary
├── docker-compose.yml
├── .env.example            # ANTHROPIC_API_KEY lives here (copy to .env)
├── pb_migrations/          # Database schema, applied automatically on start
│   ├── 1762860000_init_saludablex.js
│   ├── 1762870000_food_references.js
│   └── 1762880000_users_gender.js
└── pb_hooks/               # Server-side JavaScript
    ├── food.pb.js          # POST /api/saludablex/analyze and /api/saludablex/read-label (auth required)
    ├── request.js          # Shared request validation
    └── claude.js           # Sends photos to the Claude API and returns nutrition facts
```

The migration creates these:

- **users** (built in): adds `calorie_goal`, `carbs_goal`, `fat_goal`, `protein_goal` and an optional `gender` (`male` / `female`, used for the micronutrient goals).
- **food_entries**: name, portion, grams, calories, carbs, fat, protein, `micros` (JSON), `eaten_at` and an optional `photo`.
- **weight_logs**: `weight_kg` and `logged_at`.
- **food_references**: nutrition facts from a package label, per 100 g: name, brand, `serving_grams`, calories, carbs, fat, protein, `micros` and an optional `photo`. When the user picks references while adding food, `/api/saludablex/analyze` loads them and tells Claude to use the label values.

Users can only read or change their own records, because the API rules check `user = @request.auth.id`.

---

## 1. Prerequisites

- Docker with the Compose plugin (`docker compose version` should work)
- A Claude API key from <https://platform.claude.com/settings/keys>, used for photo recognition
- Node.js 20+ for the frontend

## 2. Configure the environment

```bash
cd pocketbase
cp .env.example .env
```

Open `.env` and set your key:

```
ANTHROPIC_API_KEY=sk-ant-...
```

The key stays on the server. The browser never sees it, because the frontend only calls PocketBase's `/api/saludablex/analyze` route.

## 3. Build and start PocketBase

```bash
docker compose up -d --build
docker compose logs -f pocketbase
```

On the first start PocketBase does the following:

1. creates `pocketbase/pb_data/`, which holds the SQLite database and uploaded photos
2. runs everything in `pb_migrations/`, which creates the collections above
3. loads `pb_hooks/`

The API is now available at <http://localhost:8092/api/> and the admin dashboard at <http://localhost:8092/_/>.

To use a different PocketBase version, change `PB_VERSION` in the `Dockerfile` and run `docker compose up -d --build` again.

## 4. Create the admin (superuser) account

You can do this in one of two ways:

- **Option A (CLI):**

  ```bash
  docker compose exec pocketbase /pb/pocketbase superuser upsert admin@example.com 'a-long-password'
  ```

- **Option B (browser):** the first-start logs print a one-time installer link (`http://0.0.0.0:8090/_/#/pbinstal/...`). That is the port *inside* the container: open it with `0.0.0.0:8090` replaced by `localhost:8092` (or your server address and port 8092).

Log in at <http://localhost:8092/_/> and check that `food_entries` and `weight_logs` exist.

## 5. Recommended dashboard settings

In **Settings** in the dashboard:

- **Application**: set *Application name* to `Saludablex` and *Application URL* to the URL your frontend runs on. PocketBase uses this URL in its emails.
- **Mail settings**: add SMTP details if you want email verification and password reset. Without SMTP, registration and login still work.
- **Rate limits**: turn these on. Every call to `/api/saludablex/analyze` costs Claude API credits, so add a rule such as label `/api/saludablex/analyze`, 10 requests per 60 seconds, audience *Authenticated*. Add the same rule for `/api/saludablex/read-label`.

## 6. Test the food-recognition endpoint (optional)

```bash
# 1. Register a user and log in to get a token
curl -s -X POST http://localhost:8092/api/collections/users/records \
  -H 'Content-Type: application/json' \
  -d '{"email":"test@example.com","password":"test12345","passwordConfirm":"test12345"}'

TOKEN=$(curl -s -X POST http://localhost:8092/api/collections/users/auth-with-password \
  -H 'Content-Type: application/json' \
  -d '{"identity":"test@example.com","password":"test12345"}' | jq -r .token)

# 2. Send a food photo
jq -n --arg img "$(base64 -w0 some-food-photo.jpg)" '{image: $img, mediaType: "image/jpeg"}' \
  | curl -s -X POST http://localhost:8092/api/saludablex/analyze \
      -H "Authorization: $TOKEN" -H 'Content-Type: application/json' -d @- | jq
```

You should get back `{ "recognized": true, "items": [ { "name": ..., "calories": ..., ... } ], "notes": ... }`. If something goes wrong, check `docker compose logs pocketbase`. A missing API key shows up as *"Food recognition is not configured"*.

## 7. Run the frontend

```bash
cd frontend
cp .env.example .env.local      # VITE_PB_URL=http://127.0.0.1:8092
npm install
npm run dev
```

Open the URL Vite prints, create an account, and tap the camera button to log a meal.

To test the camera on a phone during development, run `npm run dev -- --host` and set `VITE_PB_URL` to your computer's LAN IP, for example `http://192.168.1.20:8092`. Mobile browsers only open the camera picker from a secure (HTTPS) page or `localhost`; on other pages they fall back to the file picker.

---

## Production on a VPS

### PocketBase

Copy the `pocketbase/` folder to the server, create `.env` and run `docker compose up -d --build`. PocketBase listens on port 8090 inside the container; `docker-compose.yml` publishes it on port **8092** of the VPS. To keep it off the public internet, change the port mapping to `"127.0.0.1:8092:8090"` and put a reverse proxy in front of it, for example on `api.saludablex.example.com`.

Nginx example:

```nginx
server {
    server_name api.saludablex.example.com;

    client_max_body_size 20M;          # photo uploads

    location / {
        proxy_pass http://127.0.0.1:8092;
        proxy_http_version 1.1;
        proxy_set_header Connection '';  # needed for realtime (SSE)
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 180s;         # food recognition can take a while
    }
}
```

Then set **Settings → Application → Trusted proxy** to use `X-Forwarded-For`, so that rate limits and logs see the real client IP.

Caddy needs much less configuration:

```
api.saludablex.example.com {
    reverse_proxy 127.0.0.1:8092
}
```

### Frontend (static)

```bash
cd frontend
VITE_PB_URL=https://api.saludablex.example.com npm run build
```

Upload `frontend/dist/` to the web root of your app subdomain. The app uses client-side routing, so every unknown path must fall back to `index.html`:

```nginx
server {
    server_name saludablex.example.com;
    root /var/www/saludablex;
    location / {
        try_files $uri /index.html;
    }
}
```

PocketBase accepts requests from any origin by default. To only allow your frontend, change the `CMD` in the `Dockerfile` to:
`["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--origins=https://saludablex.example.com"]`.

### Backups

All data is in `pocketbase/pb_data/`. You can either:

- back that folder up, or
- use **Settings → Backups** in the dashboard, which can also send backups to S3 on a schedule.

### Updating hooks and schema

`pb_hooks/` and `pb_migrations/` are mounted into the container. PocketBase restarts by itself when a hook file changes. Run `docker compose restart pocketbase` after adding a migration.

If you change the schema in the dashboard, PocketBase writes a new migration file into `pb_migrations/` for you. Commit it so other environments stay in sync.
