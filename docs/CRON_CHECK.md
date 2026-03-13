# Monitoring cron (uptime + SSL)

The route `GET /api/cron/check` pings each client URL, checks SSL expiry, and updates `clients` (last_check_at, last_status, uptime_pct_24h, ssl_expiry_date, status).

## Local testing

1. Start the app: `npm run dev`.
2. Call the route:
   - **If `CRON_SECRET` is not set in `.env`:** no secret needed.
     - Browser: `http://localhost:3000/api/cron/check`
     - Or: `curl http://localhost:3000/api/cron/check`
   - **If `CRON_SECRET` is set in `.env`:** you must pass it or you get `Unauthorized`.
     - Browser: `http://localhost:3000/api/cron/check?secret=YOUR_CRON_SECRET`
     - Or: `curl "http://localhost:3000/api/cron/check?secret=YOUR_CRON_SECRET"`
     - Or: `curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3000/api/cron/check`
3. Refresh the Clients list to see updated Health, Uptime %, and SSL Expiry.

## Vercel

1. In Vercel project **Settings → Environment Variables**, add `CRON_SECRET` (e.g. a long random string).
2. In the project root, add `vercel.json` with a cron schedule, for example:

```json
{
  "crons": [
    {
      "path": "/api/cron/check",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

`*/15 * * * *` = every 15 minutes. Use [cron syntax](https://vercel.com/docs/cron-jobs).

3. Vercel will call your app with the cron secret; ensure your route validates it (it does when `CRON_SECRET` is set).
