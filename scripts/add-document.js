const fs = require('fs');
const path = require('path');

function main() {
    const [patientId, source, extArg] = process.argv.slice(2);
    if (!patientId || !source) {
        console.error('Usage: node scripts/add-document.js <patientId> <fileOrBase64> [extension]');
        process.exit(1);
    }

    const patientDocs = path.join(__dirname, '..', 'content', 'data', 'patients', patientId, 'documents');
    fs.mkdirSync(patientDocs, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    if (fs.existsSync(source)) {
        const ext = path.extname(source);
        const dest = path.join(patientDocs, `doc-${timestamp}${ext}`);
        fs.copyFileSync(source, dest);
        console.log(`Document copié pour le patient ${patientId}: ${dest}`);
    } else {
        if (!extArg) {
            console.error('Extension requise pour les données base64.');
            process.exit(1);
        }
        const buffer = Buffer.from(source, 'base64');
        const dest = path.join(patientDocs, `doc-${timestamp}.${extArg}`);
        fs.writeFileSync(dest, buffer);
        console.log(`Document enregistré depuis base64 pour le patient ${patientId}: ${dest}`);
    }
}

main();
