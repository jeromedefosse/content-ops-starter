import dayjs from 'dayjs';
import patients from '../../content/data/patients.json';

const REMINDERS = [
    { days: 7, label: 'J+7' },
    { days: 30, label: 'J+30' },
    { days: 90, label: 'J+90' }
];

async function sendEmail({ to, cc, subject, text }) {
    const endpoint = process.env.MAIL_API_ENDPOINT;
    const apiKey = process.env.MAIL_API_KEY;
    if (!endpoint || !apiKey) {
        console.warn('Missing email API config');
        return;
    }
    await fetch(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({ from: 'flascano@pcbs.fr', to, cc, subject, text })
    });
}

function buildMessage(patient, label, opDate) {
    return `Bonjour ${patient.firstName} ${patient.lastName},\n\nNous esp\u00e9rons que votre r\u00e9tablissement se d\u00e9roule au mieux depuis l’intervention r\u00e9alis\u00e9e le ${opDate.format('DD/MM/YYYY')}. Nous sommes aujourd’hui \u00e0 ${label} et souhaitons vous rappeler les \u00e9tapes de votre parcours de suivi.\n\n1. Remplir le questionnaire ${label}\n   Merci de prendre quelques minutes pour compl\u00e9ter le questionnaire en ligne : https://espace.pcbs.fr. Ce formulaire nous aide \u00e0 suivre votre \u00e9volution et \u00e0 adapter votre prise en charge si n\u00e9cessaire.\n\n2. Prochaines communications\n   - J+7 : rappel pour poursuivre le suivi\n   - J+30 : bilan interm\u00e9diaire\n   - J+90 : \u00e9valuation finale\n   Chaque message vous guidera dans les \u00e9tapes du programme.\n\nNous vous remercions vivement pour votre participation au programme. Votre implication est essentielle pour optimiser votre r\u00e9cup\u00e9ration.\n\nN’oubliez pas que vous pouvez \u00e0 tout moment consulter votre espace personnel pour v\u00e9rifier votre \u00e9volution et retrouver l’ensemble des documents utiles \u00e0 votre prise en charge : https://espace.pcbs.fr.\n\nBien cordialement,\nL’équipe PCBS`;
}

export async function sendReminderEmails() {
    const now = dayjs();
    const results = [];
    for (const patient of patients) {
        const opDate = dayjs(patient.operationDate);
        const diff = now.diff(opDate, 'day');
        const reminder = REMINDERS.find((r) => r.days === diff);
        if (reminder) {
            const subject = `Suivi post-op\u00e9ratoire – ${reminder.label} : questionnaire et prochaines \u00e9tapes`;
            const text = buildMessage(patient, reminder.label, opDate);
            await sendEmail({
                to: patient.email,
                cc: patient.surgeonEmail,
                subject,
                text
            });
            results.push({ email: patient.email, reminder: reminder.label });
        }
    }
    return results;
}
