# Clockify Local

A personal dark timesheet app built with Vite, React, TypeScript and Formik. An Express API stores data in a portable SQLite file using Node's built-in SQLite module.

## Run

Requires Node.js 24 or later.

```sh
npm install
npm run dev
```

Open http://localhost:9999. The API listens only on 127.0.0.1:3001.

For production locally:

```sh
npm run build
npm start
```

Open http://127.0.0.1:9999. Run `npm test` for API/export checks.

## Workflow

- Add an activity with a description, client, project, one project-specific tag, date and decimal hours. Defaults: REVO, OVERX Vendite, Ioan Negru. Hours accept a comma or a dot.
- Edit or delete activities from the history. Search and review totals under Report.
- Add clients, projects and tags in Directories. Choices are seeded from the supplied workbook, including INTERNO / ALTRO.
- Export a date range with the agreed opening password. The exported file uses the supplied three-sheet template, replaces its example with your entries, and refreshes mapping sheets with all current choices. Dates and hours are numeric cells; Excel's locale controls decimal separators.
- File naming: `Timesheet v1.0 - IN - DD-MM-YYYY.xlsx`, using the selected range's end date.
- Exports are encrypted with an Excel opening password. The password is not persisted. Send the file yourself by Friday 17:00 and agree on the password separately.

## Local data and backup

All records and choices are in `data/clockify.sqlite`, excluded from Git. Stop the server before copying this file as a backup or moving it to another computer. Keep the `server/template.xlsx` file with the project. No cloud account is required. The app loads an optional Google Font; system fonts are used offline. Dependencies need internet access only for installation.

This is a local manual time tracker, not a hosted multi-user service. Keep descriptions technical/professional; do not enter personal or sensitive notes. Updated templates are not automatically imported; add new choices through Directories.

## Frontend structure

- `src/main.tsx`: React bootstrap only.
- `src/App.tsx`: page navigation, notifications and dialog coordination.
- `src/pages/`: TimeTracker, Report and Directories pages with their CSS.
- `src/components/`: Sidebar, activity form/history, summary cards and export/delete dialogs with their CSS.
- `src/hooks/`: workspace fetching and Formik activity state.
- `src/lib/`: API requests and English date/number formatting.
- `src/styles/global.css`: shared theme, controls and form layout.
- `src/types.ts`: shared data types.

The interface is English; client/project/tag names and the Italian Excel template retain their business values.

## PM2

```sh
npm run start-pm2
```

Builds the frontend and starts (or restarts) `clockify` at http://127.0.0.1:9999. PM2 runs `server/index.js`, which serves both the built website and API. PM2 is installed locally; no global install is needed. Build errors prevent restarting the app.

```sh
npm run pm2:logs
npm run pm2:stop
npx pm2 status
```

For restoring managed processes after restarting PM2, run `npx pm2 save`. To enable launch at system startup, run `npx pm2 startup` and follow its platform-specific instructions, then `npx pm2 save`.

Development also uses port 9999 for Vite, with its API on port 3001. Stop the production PM2 app before starting development since they share website port 9999. Standalone `npm start` defaults to 9999; set `PORT` to override it.
