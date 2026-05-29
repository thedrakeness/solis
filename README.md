# Solis

A weather app with a dynamic sky background that shifts by time of day and weather condition. Powered by [Open-Meteo](https://open-meteo.com/) — free, no API key required.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS (utility layer)
- Open-Meteo (forecast, geocoding, air quality, historical archive)

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment variables

Copy `.env.example` to `.env` and adjust if needed. All variables have working defaults — no changes required for local development.

```bash
cp .env.example .env
```

| Variable | Default | Purpose |
|---|---|---|
| `VITE_FORECAST_URL` | `https://api.open-meteo.com/v1` | Current + hourly + daily forecast |
| `VITE_GEOCODING_URL` | `https://geocoding-api.open-meteo.com/v1` | Location search |
| `VITE_AQI_URL` | `https://air-quality-api.open-meteo.com/v1` | Air quality index |
| `VITE_ARCHIVE_URL` | `https://archive-api.open-meteo.com/v1` | Historical trends data |

## Build & deploy

```bash
npm run build   # outputs to dist/
npm run preview # preview the production build locally
```

Deploys cleanly to Vercel or Netlify with no additional configuration. Set `Build Command` to `npm run build` and `Publish Directory` to `dist`.
