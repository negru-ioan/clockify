# Clockify Local

A personal dark timesheet app built with Vite, React, TypeScript and Formik. An Express API stores data in a portable SQLite file using Node's built-in SQLite module.

## Run

Requires Node.js 24 or later.

```sh
npm install
npm run dev
```

Open http://localhost:9999. The development API runs on port 3001.

For production locally:

```sh
npm run build
npm start
```

Open http://127.0.0.1:9999. Run `npm test` for API/export checks.

## Workflow

- Add an activity with a description, client, project, one project-specific tag, date and decimal hours. Defaults: REVO and OVERX Vendite. Your name is saved once in Directories → Your profile and used for exports. Hours accept a comma or a dot.
- Edit or delete activities from the history. Search and review totals under Report.
- Add clients, projects and tags in Directories. Choices are seeded from the supplied workbook, including INTERNO / ALTRO.
- Export a date range with the agreed opening password, or uncheck password protection for an unencrypted export. Matching tasks on the same date are grouped by description (ignoring case and outer whitespace), client, project, tag and user; their hours are summed. The exported file uses the supplied Report template, replaces its example with your entries, and exports only the Report sheet with consistent 11-point Calibri formatting. Dates and hours are numeric cells; Excel's locale controls decimal separators.
- File naming: `Timesheet v1.0 - IN - DD-MM-YYYY.xlsx`, using the selected range's end date.
- Exports are encrypted with an Excel opening password by default. The password is not persisted. Send the file yourself by Friday 17:00 and agree on the password separately.

## Local data and backup

All records and choices are in `data/clockify.sqlite`, excluded from Git. Stop the server before copying this file as a backup or moving it to another computer. Keep the `server/template.xlsx` file with the project. No cloud account is required. The app loads an optional Google Font; system fonts are used offline. Dependencies need internet access only for installation.

This is a personal manual time tracker, not a hosted multi-user service. Keep descriptions technical/professional; do not enter personal or sensitive notes. Updated templates are not automatically imported; add new choices through Directories.

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

## Duration entry

Hours spent accepts decimal hours (`2,5` or `2.5`) or hours/minutes (`2:30`). Minutes must be 00–59. Valid start/end times always recalculate duration when edited. Whole hours such as `19` normalize to `19:00`. An earlier end time means the next day; equal times are invalid. The optional times are stored locally but are not added to the required Excel template. Exports continue to store numeric decimal hours.

Profile names are stored once in SQLite settings. New activities do not duplicate the name; exported rows use the current profile name, and filenames use its initials. Existing activity records remain intact.
