10 Minute Mail - Simple Static SPA

This repository contains a minimal single-page app that uses the Mail.gw API (https://docs.mail.gw/) to create a temporary email account and poll for incoming messages.

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
- Uses the Mail.gw API at https://api.mail.gw. The app creates an account (POST /accounts) and exchanges credentials for a token (POST /token) before listing messages (GET /messages).
- Notes: the API requires a Bearer token for most endpoints. The SPA requests domains, registers an account under a random username, obtains a token, and then polls /messages.
- If you see CORS errors in the browser, run via a local server as shown above.

Improvements you can ask for
- Persist generated address across refreshes
- Add message deletion
- Automatically expand inline attachments or extract links
- Improve styling and UX
