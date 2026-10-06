// ======================================
// WOMEN SAFETY WEBSITE - JAVASCRIPT
// ======================================


// ======================================
// 1. SOS BUTTON
// ======================================

function sendSOS() {

    const message = document.getElementById("sos-message");

    message.innerText =
        "🚨 SOS ACTIVATED! Emergency assistance requested.";

    message.style.color = "red";
    message.style.fontWeight = "bold";

}

// Mobile navigation
const navigationToggle = document.querySelector('.nav-toggle');
const siteNavigation = document.getElementById('site-nav');
if (navigationToggle && siteNavigation) {
    navigationToggle.addEventListener('click', () => {
        const isOpen = siteNavigation.classList.toggle('nav-open');
        navigationToggle.setAttribute('aria-expanded', String(isOpen));
        navigationToggle.textContent = isOpen ? '×' : '☰';
    });
    siteNavigation.querySelectorAll('a').forEach((link) => {
        link.addEventListener('click', () => {
            siteNavigation.classList.remove('nav-open');
            navigationToggle.setAttribute('aria-expanded', 'false');
            navigationToggle.textContent = '☰';
        });
    });
}

// Voice SOS listens once for “help” or “SOS”, then starts the normal location-sharing flow.
function enhancedVoiceSOS() {
    const status = document.getElementById('voice-sos-status');
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        status.textContent = 'Voice recognition is not supported in this browser. Use the SOS button instead.';
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    status.textContent = 'Listening now. Say “help” or “SOS”.';
    recognition.start();

    recognition.onresult = (event) => {
        const spokenText = event.results[0][0].transcript.toLowerCase();
        if (spokenText.includes('help') || spokenText.includes('sos')) {
            status.textContent = 'Emergency phrase detected. Starting SOS…';
            document.getElementById('sos-heading').scrollIntoView({ behavior: 'smooth' });
            sendSOS();
        } else {
            status.textContent = `Heard “${spokenText}”. Say “help” or “SOS” to activate.`;
        }
    };
    recognition.onerror = () => {
        status.textContent = 'Could not hear you. Check microphone permission and try again.';
    };
}

// Uses the standard SOS flow so the message includes live coordinates and saved contacts.
function enhancedSendEmergencySMS() {
    document.getElementById('sos-heading').scrollIntoView({ behavior: 'smooth' });
    sendSOS();
}

async function enhancedFakeCall() {
    let callerName = 'Trusted Contact';
    try {
        const response = await fetch('/api/emergency-contacts');
        const contacts = response.ok ? await response.json() : [];
        if (contacts.length) callerName = contacts[0].name;
    } catch { /* The default caller name is still usable. */ }

    const existing = document.getElementById('fake-call-modal');
    if (existing) existing.remove();
    const modal = document.createElement('section');
    modal.id = 'fake-call-modal';
    modal.className = 'fake-call-modal';
    modal.innerHTML = `
        <div class="fake-call-card" role="dialog" aria-modal="true" aria-label="Incoming call">
            <p class="incoming-label">Incoming call</p>
            <div class="caller-avatar">☎</div>
            <h2></h2>
            <p>Mobile</p>
            <div class="fake-call-actions">
                <button class="decline-call" type="button">Decline</button>
                <button class="answer-call" type="button">Answer</button>
            </div>
        </div>`;
    modal.querySelector('h2').textContent = callerName;
    modal.querySelector('.decline-call').addEventListener('click', () => modal.remove());
    modal.querySelector('.answer-call').addEventListener('click', () => {
        modal.querySelector('.incoming-label').textContent = 'Call connected';
        modal.querySelector('.fake-call-actions').innerHTML = '<button class="decline-call" type="button">End call</button>';
        modal.querySelector('.decline-call').addEventListener('click', () => modal.remove());
    });
    document.body.appendChild(modal);
}

let safetyTimerInterval;
let safetyTimerSeconds = 60;
let safetyTimerPaused = false;

function renderSafetyTimer() {
    const minutes = Math.floor(safetyTimerSeconds / 60);
    const seconds = safetyTimerSeconds % 60;
    document.getElementById('timer').textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function enhancedStartTimer() {
    const duration = Number(document.getElementById('timerMinutes').value) * 60;
    clearInterval(safetyTimerInterval);
    safetyTimerSeconds = duration;
    safetyTimerPaused = false;
    renderSafetyTimer();
    document.getElementById('timer-status').textContent = 'Safety check-in timer is running.';
    safetyTimerInterval = setInterval(() => {
        if (safetyTimerPaused) return;
        safetyTimerSeconds -= 1;
        renderSafetyTimer();
        if (safetyTimerSeconds <= 0) {
            clearInterval(safetyTimerInterval);
            document.getElementById('timer-status').textContent = 'Time is up. Please check that you are safe.';
            if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('Women Safety', { body: 'Your safety check-in timer has finished.' });
            }
            alert('Safety timer finished. Please check that you are safe.');
        }
    }, 1000);
    if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
}

function enhancedPauseTimer() {
    if (!safetyTimerInterval) return;
    safetyTimerPaused = !safetyTimerPaused;
    document.getElementById('timer-status').textContent = safetyTimerPaused ? 'Timer paused.' : 'Timer resumed.';
}

function enhancedResetTimer() {
    clearInterval(safetyTimerInterval);
    safetyTimerInterval = undefined;
    safetyTimerPaused = false;
    safetyTimerSeconds = Number(document.getElementById('timerMinutes').value) * 60;
    renderSafetyTimer();
    document.getElementById('timer-status').textContent = 'Timer reset.';
}


// ======================================
// 2. GET LOCATION
// ======================================

function getLocation() {

    const result =
        document.getElementById("location-result");

    if (!navigator.geolocation) {

        result.innerText =
            "Geolocation is not supported by your browser.";

        return;
    }

    result.innerText =
        "📍 Getting your location...";

    navigator.geolocation.getCurrentPosition(

        function(position) {

            const latitude =
                position.coords.latitude;

            const longitude =
                position.coords.longitude;

            const mapLink =
                `https://www.google.com/maps?q=${latitude},${longitude}`;

            result.innerHTML = `
                📍 <strong>Your Location</strong><br><br>

                Latitude: ${latitude}<br>
                Longitude: ${longitude}<br><br>

                <a href="${mapLink}" target="_blank">
                    🗺️ Open Location in Google Maps
                </a>
            `;

        },

        function() {

            result.innerText =
                "❌ Unable to access your location. Please allow location permission.";

        }

    );

}


// ======================================
// 3. EMERGENCY CONTACTS
// ======================================

function showContacts() {

    alert(
        "🚨 Emergency Contacts\n\n" +
        "Police: 112\n" +
        "Women Helpline: 181\n" +
        "Trusted Person: Add your own contact"
    );

}


// ======================================
// 4. SAFETY TIPS
// ======================================

function showTips() {

    document.getElementById("tips")
        .scrollIntoView({
            behavior: "smooth"
        });

}


// ======================================
// 5. DARK MODE
// ======================================

function toggleDarkMode() {

    document.body.classList.toggle("dark-mode");

}


// ======================================
// 6. FAKE CALL
// ======================================

function fakeCall() {

    setTimeout(function() {

        alert(
            "📞 INCOMING CALL\n\n" +
            "Mom\n" +
            "Mobile"
        );

    }, 2000);

}


// ======================================
// 7. EMERGENCY SMS
// ======================================

function sendEmergencySMS() {

    const phone = "9876543210";

    const message =
        "🚨 EMERGENCY! I need help. Please contact me immediately.";

    const smsLink =
        `sms:${phone}?body=${encodeURIComponent(message)}`;

    window.location.href = smsLink;

}


// ======================================
// 8. EMERGENCY CALL
// ======================================

function callEmergency() {

    const confirmCall =
        confirm("Do you want to call emergency number 112?");

    if (confirmCall) {

        window.location.href = "tel:112";

    }

}


// ======================================
// 9. VOICE SOS
// ======================================

function voiceSOS() {

    const SpeechRecognition =
        window.SpeechRecognition ||
        window.webkitSpeechRecognition;

    if (!SpeechRecognition) {

        alert(
            "Voice recognition is not supported in this browser."
        );

        return;

    }

    const recognition =
        new SpeechRecognition();

    recognition.lang = "en-IN";

    recognition.start();

    alert("🎤 Say HELP or SOS");

    recognition.onresult =
        function(event) {

            const text =
                event.results[0][0]
                    .transcript
                    .toLowerCase();

            if (
                text.includes("help") ||
                text.includes("sos")
            ) {

                sendSOS();

            } else {

                alert("You said: " + text);

            }

        };

}


// ======================================
// 10. SAFETY TIMER
// ======================================

let timer;
let seconds = 0;

function startTimer() {

    seconds = 60;

    clearInterval(timer);

    document.getElementById("timer")
        .innerText = "01:00";

    timer = setInterval(function() {

        seconds--;

        const minutes =
            Math.floor(seconds / 60);

        const remainingSeconds =
            seconds % 60;

        document.getElementById("timer")
            .innerText =
            `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;

        if (seconds <= 0) {

            clearInterval(timer);

            alert(
                "⏰ Safety timer finished. Please check that you are safe."
            );

        }

    }, 1000);

}
// ======================================
// 11. TRUSTED CONTACTS
// ======================================

let trustedContacts =
    JSON.parse(localStorage.getItem("trustedContacts")) || [];


function addTrustedContact() {

    const name =
        document.getElementById("contactName").value.trim();

    const phone =
        document.getElementById("contactPhone").value.trim();

    if (!name || !phone) {

        alert("Please enter name and phone number.");

        return;

    }

    trustedContacts.push({
        name: name,
        phone: phone
    });

    localStorage.setItem(
        "trustedContacts",
        JSON.stringify(trustedContacts)
    );

    document.getElementById("contactName").value = "";
    document.getElementById("contactPhone").value = "";

    displayTrustedContacts();

}


function displayTrustedContacts() {

    const list =
        document.getElementById("contactList");

    list.innerHTML = "";

    trustedContacts.forEach(function(contact, index) {

        list.innerHTML += `

            <div class="contact-item">

                <strong>
                    👤 ${contact.name}
                </strong>

                <p>
                    📞 ${contact.phone}
                </p>

                <a href="tel:${contact.phone}">
                    Call
                </a>

                <button onclick="deleteContact(${index})">
                    Delete
                </button>

            </div>

        `;

    });

}


function deleteContact(index) {

    trustedContacts.splice(index, 1);

    localStorage.setItem(
        "trustedContacts",
        JSON.stringify(trustedContacts)
    );

    displayTrustedContacts();

}


displayTrustedContacts();

// SOS flow: GPS is read only after the user presses the SOS button.
// Mobile browsers open the device SMS app; the user still confirms the send.
function sendSOS() {
    const message = document.getElementById("sos-message");
    const actions = document.getElementById("sos-contact-actions");

    if (!navigator.geolocation) {
        message.textContent = "Your browser does not support location sharing.";
        return;
    }

    message.textContent = "Getting your live location…";
    actions.replaceChildren();

    navigator.geolocation.getCurrentPosition(async (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const smsText = `SOS: I need help. My live location is ${mapLink} (Latitude: ${latitude}, Longitude: ${longitude}).`;

        try {
            const historyResponse = await fetch('/api/sos-history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ latitude, longitude })
            });
            if (!historyResponse.ok) {
                message.textContent = "Please log in first so we can save this SOS event and use your contacts.";
                return;
            }

            const response = await fetch('/api/emergency-contacts');
            if (!response.ok) {
                message.textContent = "Please log in first so we can use your saved emergency contacts.";
                return;
            }

            const contacts = await response.json();
            if (!contacts.length) {
                message.textContent = "No emergency contacts found. Add one in My account first.";
                return;
            }

            message.replaceChildren(
                document.createTextNode("Location ready: "),
                Object.assign(document.createElement("a"), {
                    href: mapLink, target: "_blank", rel: "noopener", textContent: "view map"
                }),
                document.createTextNode(". Tap Send SMS for each contact.")
            );

            contacts.forEach((contact) => {
                const phone = contact.mobile_number.replace(/[^+\d]/g, "");
                const link = document.createElement("a");
                link.className = "sos-contact-button";
                link.href = `sms:${phone}?body=${encodeURIComponent(smsText)}`;
                link.textContent = `Send SOS to ${contact.name}`;
                actions.appendChild(link);
            });
        } catch {
            message.textContent = "Could not load your emergency contacts. Please try again.";
        }
    }, () => {
        message.textContent = "We could not access your location. Allow location access and try again.";
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
}
