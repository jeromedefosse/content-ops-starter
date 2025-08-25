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
    const dataDir = path.join(__dirname, '..', 'content', 'data');
    const questionnaire = loadJson(path.join(dataDir, 'questionnaire.json'));
    const responses = loadJson(path.join(dataDir, 'responses.json'));
    const score = calculateScore(questionnaire, responses);
    const result = { score };

    const resultJson = path.join(dataDir, 'results.json');
    fs.writeFileSync(resultJson, JSON.stringify(result, null, 2) + '\n');

    const resultPdf = path.join(dataDir, 'results.pdf');
    generatePdf(result, resultPdf);

    const archiveDir = path.join(dataDir, 'archive');
    fs.mkdirSync(archiveDir, { recursive: true });
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.copyFileSync(resultJson, path.join(archiveDir, `results-${timestamp}.json`));
    fs.copyFileSync(resultPdf, path.join(archiveDir, `results-${timestamp}.pdf`));

    console.log('Résultats enregistrés et archivés.');
}

main();
