10 Minute Mail - Simple Static SPA

This repository contains a minimal single-page app that uses the public 1secmail API to generate a temporary email address and poll for incoming messages.

Files
- index.html — main HTML page
- styles.css — basic styles
- app.js — JavaScript to call 1secmail API and manage UI

How to run
1. Open `index.html` in a browser. For best results, serve it from a local static server to avoid potential CORS or file:// restrictions.

Quick start using Python 3:

```bash
# from repo root
python3 -m http.server 8000
# then open http://localhost:8000 in your browser
```

Notes & assumptions
- Uses the public 1secmail API at https://www.1secmail.com/api/v1/. This API is public and may have rate limits or availability differences.
- If you see CORS errors in the browser, run via a local server as shown above.

Improvements you can ask for
- Persist generated address across refreshes
- Add message deletion
- Automatically expand inline attachments or extract links
- Improve styling and UX
