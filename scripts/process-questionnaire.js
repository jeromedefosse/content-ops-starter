const fs = require('fs');
const path = require('path');

function loadJson(file) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function calculateScore(questionnaire, responses) {
    return responses.answers.reduce((acc, ans) => {
        const question = questionnaire.questions.find((q) => q.id === ans.questionId);
        if (!question) return acc;
        if (question.type === 'scale') {
            return acc + Number(ans.value);
        }
        if (question.type === 'boolean') {
            return acc + (ans.value ? 1 : 0);
        }
        return acc;
    }, 0);
}

function generatePdf(result, filePath) {
    const text = `Score: ${result.score}`;
    const header = '%PDF-1.1\n';
    const objects = [];
    objects.push('1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n');
    objects.push('2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n');
    objects.push('3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 300 144]\n/Contents 4 0 R\n/Resources << /Font << /F1 5 0 R >> >>\n>>\nendobj\n');
    const stream = `BT\n/F1 24 Tf\n50 100 Td\n(${text}) Tj\nET`;
    objects.push(`4 0 obj\n<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream\nendobj\n`);
    objects.push('5 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n');

    const offsets = [];
    let content = header;
    for (const obj of objects) {
        offsets.push(Buffer.byteLength(content, 'utf8'));
        content += obj;
    }

    const xrefStart = Buffer.byteLength(content, 'utf8');
    let xref = 'xref\n0 6\n0000000000 65535 f \n';
    for (const off of offsets) {
        xref += off.toString().padStart(10, '0') + ' 00000 n \n';
    }
    content += xref;
    content += 'trailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n' + xrefStart + '\n%%EOF';

    fs.writeFileSync(filePath, content);
}

function main() {
    const [patientId, questionnairePath, responsesPath] = process.argv.slice(2);
    if (!patientId || !questionnairePath || !responsesPath) {
        console.error('Usage: node scripts/process-questionnaire.js <patientId> <questionnaire.json> <responses.json>');
        process.exit(1);
    }

    const questionnaire = loadJson(path.resolve(questionnairePath));
    const responses = loadJson(path.resolve(responsesPath));
    const score = calculateScore(questionnaire, responses);
    const timestamp = new Date().toISOString();
    const result = {
        questionnaire: path.basename(questionnairePath),
        score,
        timestamp
    };

    const patientDir = path.join(__dirname, '..', 'content', 'data', 'patients', patientId);
    const questionnairesDir = path.join(patientDir, 'questionnaires');
    const documentsDir = path.join(patientDir, 'documents');
    fs.mkdirSync(questionnairesDir, { recursive: true });
    fs.mkdirSync(documentsDir, { recursive: true });

    const historyFile = path.join(questionnairesDir, 'history.json');
    let history = [];
    if (fs.existsSync(historyFile)) {
        history = loadJson(historyFile);
    }

    if (history.length > 0) {
        const prev = history[history.length - 1];
        const diff = result.score - prev.score;
        console.log(`Différence de score avec le questionnaire précédent: ${diff >= 0 ? '+' : ''}${diff}`);
    } else {
        console.log('Premier questionnaire pour ce patient.');
    }

    history.push(result);
    fs.writeFileSync(historyFile, JSON.stringify(history, null, 2) + '\n');

    const resultJson = path.join(questionnairesDir, 'result.json');
    fs.writeFileSync(resultJson, JSON.stringify(result, null, 2) + '\n');

    const resultPdf = path.join(questionnairesDir, 'result.pdf');
    generatePdf(result, resultPdf);

    const archiveDir = path.join(questionnairesDir, 'archive');
    fs.mkdirSync(archiveDir, { recursive: true });
    const safeTimestamp = timestamp.replace(/[:.]/g, '-');
    fs.writeFileSync(path.join(archiveDir, `result-${safeTimestamp}.json`), JSON.stringify(result, null, 2) + '\n');
    fs.copyFileSync(resultPdf, path.join(archiveDir, `result-${safeTimestamp}.pdf`));

    console.log(`Résultat enregistré pour le patient ${patientId}.`);
}

main();
