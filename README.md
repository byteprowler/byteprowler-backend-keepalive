# byteprowler-backend-keepalive

A standalone Cloudflare Worker that sends `GET ${BACKEND_HEALTH_URL}` every
10 minutes with `User-Agent: ByteProwler-Backend-Keepalive/1.0`.
The backend is expected to return `{"status":"ok"}`. This Worker logs the HTTP
status without parsing or logging the response body. Failed requests and
60-second timeouts are caught and logged without URLs or error details.

HTTP requests to the Worker return:

```text
ByteProwler backend keepalive worker is online.
```

## Install

Use Node.js 22 or newer and pnpm:

```sh
pnpm install
```

Wrangler is the only direct dependency. All commands use the project-installed
Wrangler; no global installation is needed.
The lockfile pins resolved versions, and `pnpm-workspace.yaml` permits the
required `esbuild` and `workerd` installation scripts.

## Configure the backend URL

`BACKEND_HEALTH_URL` is a required Worker environment binding, declared in
`src/index.ts` and configured as a secret in Cloudflare.

For local development, create an ignored `.dev.vars` file in the project root:

```dotenv
BACKEND_HEALTH_URL="https://your-backend.onrender.com/health/"
```

Replace the example with your actual health endpoint, including its trailing
slash if required. Do not commit `.dev.vars` or credentials.

## Run and test locally

```sh
pnpm dev
```

Open `http://localhost:8787/` to check the online message. In another terminal,
invoke the scheduled handler manually (use `curl.exe` in Windows PowerShell):

```sh
curl "http://localhost:8787/__scheduled?cron=*/10+*+*+*+*"
```

Check the development terminal for the backend HTTP status or a safe failure
message. Local development does not automatically run the ten-minute schedule.

## Validate and deploy

Validate and bundle without publishing:

```sh
pnpm check
```

Authenticate, provision the secret binding, and deploy:

```sh
pnpm exec wrangler login
pnpm exec wrangler secret put BACKEND_HEALTH_URL
pnpm deploy
```

Paste the backend health URL when prompted for the secret. On first setup,
accept Wrangler's prompt to create the Worker if it does not exist yet, then
run `pnpm deploy` to publish the implementation and Cron Trigger.

Inspect deployed logs with `pnpm exec wrangler tail` or Cloudflare's dashboard.
There is no lint script or separate lint dependency.

## Schedule

`wrangler.jsonc` explicitly sets `main` to `src/index.ts` and declares
`triggers.crons` as `["*/10 * * * *"]`. Deployment applies this schedule:
Cloudflare invokes `scheduled` at minutes 0, 10, 20, 30, 40, and 50 of every hour
in UTC. Cron changes can take up to 15 minutes to propagate. Observability is
enabled in the same configuration.

See the [Cloudflare Cron Trigger documentation](https://developers.cloudflare.com/workers/configuration/cron-triggers/).
