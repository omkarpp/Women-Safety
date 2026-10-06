from functools import wraps
from datetime import datetime, timezone, timedelta
import os
import secrets
import socket

from flask import Flask, render_template, redirect, url_for, flash, request, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

try:
    from flask_sqlalchemy import SQLAlchemy
except ModuleNotFoundError as exc:
    if exc.name == "flask_sqlalchemy":
        raise SystemExit(
            "Missing Flask-SQLAlchemy. Install the app dependencies with:\n"
            "  python -m pip install Flask Flask-SQLAlchemy"
        ) from exc
    raise

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:///project.db"

app.config['SECRET_KEY'] = os.environ.get('FLASK_SECRET_KEY') or secrets.token_hex(32)
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=30)

db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    mobile_number = db.Column(db.String(20), nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    emergency_contacts = db.relationship(
        "EmergencyContact", backref="user", lazy=True, cascade="all, delete-orphan"
    )


class EmergencyContact(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), nullable=False)
    mobile_number = db.Column(db.String(20), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)


class SOSHistory(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)


def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if 'user_id' not in session:
            flash('Please log in to access your account.', 'error')
            return redirect(url_for('login'))
        return view(*args, **kwargs)
    return wrapped_view


def sign_in_user(user):
    """Start a persistent, account-specific browser session."""
    session.clear()
    session.permanent = True
    session['user_id'] = user.id
    session['user_name'] = user.name


@app.route('/')
@login_required
def main_page():
    return render_template('index.html')


@app.route('/register', methods=['GET', 'POST'])
def register():
    if session.get('user_id'):
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        name = request.form.get('name', '').strip()
        email = request.form.get('email', '').strip().lower()
        mobile_number = request.form.get('mobile_number', '').strip()
        password = request.form.get('password', '')
        confirm_password = request.form.get('confirm_password', '')
        contact_names = request.form.getlist('contact_name[]')
        contact_numbers = request.form.getlist('contact_number[]')

        if not all([name, email, mobile_number, password, confirm_password]):
            flash('Please complete every required field.', 'error')
        elif password != confirm_password:
            flash('Passwords do not match.', 'error')
        elif len(password) < 8:
            flash('Password must be at least 8 characters long.', 'error')
        elif User.query.filter_by(email=email).first():
            flash('An account with that email already exists. Please log in.', 'error')
        else:
            contacts = [
                (contact_name.strip(), contact_number.strip())
                for contact_name, contact_number in zip(contact_names, contact_numbers)
                if contact_name.strip() and contact_number.strip()
            ]
            if not contacts:
                flash('Add at least one emergency contact.', 'error')
            else:
                user = User(
                    name=name,
                    email=email,
                    mobile_number=mobile_number,
                    password_hash=generate_password_hash(password),
                )
                db.session.add(user)
                db.session.flush()
                for contact_name, contact_number in contacts:
                    db.session.add(EmergencyContact(
                        name=contact_name, mobile_number=contact_number, user_id=user.id
                    ))
                db.session.commit()
                sign_in_user(user)
                flash('Registration complete. Your account is ready.', 'success')
                return redirect(url_for('dashboard'))

    return render_template('register.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if session.get('user_id'):
        return redirect(url_for('dashboard'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip().lower()
        password = request.form.get('password', '')
        user = User.query.filter_by(email=email).first()

        if user and check_password_hash(user.password_hash, password):
            sign_in_user(user)
            flash(f'Welcome back, {user.name}!', 'success')
            return redirect(url_for('main_page'))

        flash('Incorrect email or password.', 'error')

    return render_template('login.html')


@app.route('/logout')
def logout():
    session.clear()
    flash('You have been logged out.', 'success')
    return redirect(url_for('main_page'))


@app.route('/dashboard')
@login_required
def dashboard():
    user = db.session.get(User, session['user_id'])
    if user is None:
        session.clear()
        flash('Your session has expired. Please log in again.', 'error')
        return redirect(url_for('login'))
    sos_history = SOSHistory.query.filter_by(user_id=user.id).order_by(SOSHistory.created_at.desc()).all()
    return render_template('dashboard.html', user=user, sos_history=sos_history)


@app.route('/contacts', methods=['POST'])
@login_required
def add_emergency_contact():
    name = request.form.get('name', '').strip()
    mobile_number = request.form.get('mobile_number', '').strip()

    if not name or not mobile_number:
        flash('Enter both a contact name and mobile number.', 'error')
    else:
        db.session.add(EmergencyContact(
            name=name, mobile_number=mobile_number, user_id=session['user_id']
        ))
        db.session.commit()
        flash('Emergency contact saved.', 'success')
    return redirect(url_for('dashboard'))


@app.route('/contacts/<int:contact_id>/delete', methods=['POST'])
@login_required
def delete_emergency_contact(contact_id):
    contact = db.session.get(EmergencyContact, contact_id)
    if contact is None or contact.user_id != session['user_id']:
        flash('Emergency contact not found.', 'error')
    else:
        db.session.delete(contact)
        db.session.commit()
        flash('Emergency contact removed.', 'success')
    return redirect(url_for('dashboard'))


@app.route('/api/emergency-contacts')
def emergency_contacts_api():
    if 'user_id' not in session:
        return jsonify({'error': 'Login required'}), 401
    contacts = EmergencyContact.query.filter_by(user_id=session['user_id']).all()
    return jsonify([
        {'name': contact.name, 'mobile_number': contact.mobile_number}
        for contact in contacts
    ])


@app.route('/api/sos-history', methods=['POST'])
def save_sos_history():
    if 'user_id' not in session:
        return jsonify({'error': 'Login required'}), 401

    data = request.get_json(silent=True) or {}
    try:
        latitude = float(data['latitude'])
        longitude = float(data['longitude'])
    except (KeyError, TypeError, ValueError):
        return jsonify({'error': 'Valid latitude and longitude are required'}), 400

    if not -90 <= latitude <= 90 or not -180 <= longitude <= 180:
        return jsonify({'error': 'Location coordinates are out of range'}), 400

    record = SOSHistory(latitude=latitude, longitude=longitude, user_id=session['user_id'])
    db.session.add(record)
    db.session.commit()
    return jsonify({'id': record.id, 'message': 'SOS history saved'}), 201



with app.app_context():
    db.create_all()


if __name__ == "__main__":
    host = os.environ.get('FLASK_HOST', '127.0.0.1')
    requested_port = os.environ.get('PORT')
    port = int(requested_port) if requested_port else 5000

    # If the default port is occupied by an old server, start on the next
    # available local port and print the URL so the browser uses this process.
    if requested_port is None:
        while True:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
                try:
                    probe.bind((host, port))
                    break
                except OSError as exc:
                    if exc.errno not in (48, 98, 10048):
                        raise
                    port += 1

    print(f"Open http://{host}:{port}")
    app.run(
        host=host,
        port=port,
        debug=os.environ.get('FLASK_DEBUG') == '1',
    )
