// --- CONFIGURATION DES CLÉS ---
const SHEETDB_API_URL = 'https://sheetdb.io/api/v1/9c8d3uqh6rg6w'; // Ex: https://sheetdb.io/api/v1/xxxxxx
const EMAILJS_PUBLIC_KEY = 'e4fT85cc2y3bL9Nj2';
const EMAILJS_SERVICE_ID = 'service_pn4lbii';
const EMAILJS_TEMPLATE_ID = 'template_y2curpo';

// Initialisation EmailJS
emailjs.init(EMAILJS_PUBLIC_KEY);

// ── HEADER ──
document.getElementById('site-header').classList.add('on');

// --- 1. HORLOGE ---
function updateClock() {
    const clockElement = document.getElementById('live-clock');
    if (clockElement) {
        const now = new Date();
        clockElement.textContent = now.toLocaleTimeString('fr-FR', { timeZone: 'Europe/Paris', hour12: false });
    }
}
setInterval(updateClock, 1000);
updateClock();

// --- 2. GESTION DU FORMULAIRE ---
const form = document.getElementById('dlf-form');
const successMessage = document.getElementById('success-message');
const dossierIdSpan = document.getElementById('dossier-id');
const submitButton = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    submitButton.textContent = "TRANSMISSION EN COURS...";
    submitButton.disabled = true;

    try {
        // 1. On va lire le Google Sheet pour savoir combien il y a de dossiers au total
        const responseCount = await fetch(SHEETDB_API_URL);
        const dataExisting = await responseCount.json();
        
        // 2. On calcule le numéro N+1 basé sur le nombre total de lignes
        const totalLeads = dataExisting.length;
        const nextNumber = (totalLeads + 1).toString().padStart(4, '0'); // Ex: 0003

        // 3. On prépare la date pour l'ID (Format: AAMMJJ)
        const now = new Date();
        const year = now.getFullYear().toString().slice(-2);
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        
        // 4. On crée l'ID final : #260406-0003
        const formattedId = `#${year}${month}${day}-${nextNumber}`;

        const dateStr = now.toLocaleDateString('fr-FR');

        // Préparation des données pour l'envoi
        const formData = {
            dossier_id: formattedId,
            date: dateStr,
            artiste: document.getElementById('artiste').value,
            type_projet: document.getElementById('type_projet').value,
            email: document.getElementById('email').value,
            lien: document.getElementById('lien').value || "Aucun lien",
            description: document.getElementById('description').value,
            status: "🔴 NOUVEAU"
        };

        // 5. Envoi vers Google Sheets
        const sheetResponse = await fetch(SHEETDB_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: [formData] })
        });

        // 6. Envoi du mail via EmailJS
        const emailResponse = await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, formData);

        if (sheetResponse.ok) {
            form.style.display = 'none';
            dossierIdSpan.textContent = formattedId;
            successMessage.style.display = 'flex';
        }

    } catch (error) {
        console.error('ERREUR:', error);
        alert("Erreur de transmission.");
        submitButton.textContent = "RÉESSAYER";
        submitButton.disabled = false;
    }
});