# Women Safety

A Flask web application for account registration, emergency contact management, and SOS location history.

## Features

- Register and log in to a personal account
- Add and remove emergency contacts
- View SOS location history on the dashboard
- Retrieve saved emergency contacts and record SOS coordinates through JSON endpoints

## Requirements

- Python 3.10 or newer
- Flask and Flask-SQLAlchemy

## Run locally

From the project folder in PowerShell:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install Flask Flask-SQLAlchemy
python apk.py
```

No `requirements.txt` file is needed. The app uses a temporary random session key automatically for local runs, so you can start it without setting `FLASK_SECRET_KEY`. For deployment, set a stable, private `FLASK_SECRET_KEY` in the environment. Start the app with `python apk.py` and open the URL it prints. It uses port 5000 when available and automatically picks the next available port if 5000 is occupied. The app creates its SQLite database in `instance/project.db`.

## API endpoints

- `GET /api/emergency-contacts` returns the signed-in user's saved contacts.
- `POST /api/sos-history` records coordinates for the signed-in user. Send JSON with `latitude` and `longitude`, for example `{"latitude": 12.97, "longitude": 77.59}`.

Both endpoints require an authenticated session.

## Security and privacy

This app stores personal information, emergency contact phone numbers, and SOS coordinates. The local database is excluded from Git by `.gitignore`; do not publish real user data or secrets.

For deployment, set `FLASK_SECRET_KEY` to a strong, private value. The app defaults to debug mode off. Set `FLASK_DEBUG=1` only for local development. This project has not been reviewed for production deployment; add appropriate security, privacy, and operational controls before collecting real user data.

