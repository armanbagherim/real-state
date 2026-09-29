# Ashian Chrome Extension

Manifest V3 extension for importing AmlakPlus and Divar property listings into the existing Ashian API.

## Load locally

1. Run Ashian with `npm run dev`.
2. Open `chrome://extensions`, enable Developer mode, and choose **Load unpacked**.
3. Select this `extension` directory.
4. Open AmlakPlus or Divar, open the extension popup, and sign in with an Ashian account.

The popup defaults to `http://localhost:3000`; the API base can be changed for another Ashian deployment.

## Architecture

`content/content.js` is the site-independent import UI. `sites/amlakplus/adapter.js` and `sites/divar/adapter.js` own site selectors, metadata parsing, gallery traversal, and phone interaction. `background.js` owns the bearer session and API calls. Future adapters can follow the same interface without changing the core.

The server endpoint uses Ashian's existing session table, property service, validation, office context, and image storage. Set `CHROME_EXTENSION_ID` in production to restrict CORS to the installed extension ID.
