# VFR Navlog Tool

A local-first Vue 3 flight-planning worksheet for creating, calculating, saving, and printing VFR navigation logs.

## Windows quick start

1. Install Node.js 20 or newer from https://nodejs.org/
2. Open PowerShell in this folder.
3. Run:

```powershell
npm install
npm run dev
```

This project uses **npm**. Commit and keep `package-lock.json`; do not mix npm
and pnpm lock files or reuse a `node_modules` directory created by another
package manager.

4. Open the address shown by Vite (normally `http://127.0.0.1:5173`).

For a production-style local build:

```powershell
npm run build
npm run preview
```

The built static files are placed in `dist/`.

## Docker

Build and run the production container:

```powershell
docker compose up -d --build
```

The app is available at `http://localhost:8090` by default. To use another
host port, set `VFR_NAVLOG_PORT` before starting Compose.

```powershell
$env:VFR_NAVLOG_PORT = "8091"
docker compose up -d --build
```

The Compose service uses `restart: unless-stopped`, so it restarts after a
machine reboot when the Docker service starts.

## Using the app

- Edit tan cells; blue cells recalculate immediately.
- Wind direction is entered as the direction the wind is **from**.
- Magnetic variation and compass deviation use east-positive (`+`) and west-negative (`−`) signs.
- Enter a leg's GPH to calculate fuel from flight time, or leave GPH blank and enter the fixed POH value directly in Used.
- Enter taxi fuel, §91.151 reserves, and 5% contingency together in the Arrival row's Extra field; Fuel required adds this to trip fuel.
- Drag a leg by its `⠿` handle to reorder it.
- Data auto-saves to this browser. “Save JSON” creates a portable backup; “Open” restores one.
- Use “Print / PDF” and choose **Microsoft Print to PDF** to create a landscape PDF.

## Safety

This is an early-stage planning aid. Verify all calculations, aircraft performance, current weather, NOTAMs, fuel requirements, and regulatory requirements using approved sources before flight.
