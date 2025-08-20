import { sendReminderEmails } from '../../utils/reminders';

export default async function handler(req, res) {
    try {
        const result = await sendReminderEmails();
        res.status(200).send({ result });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'failed to send reminders' });
    }
}
