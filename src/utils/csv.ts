/**
 * csv.ts — utilitaires CSV *monofichier* sans dépendance
 *
 * - Corrige l'ancienne RegExp non terminée dans csvEscape.
 * - Corrige la concaténation + point-virgule manquant dans toCsv.
 * - Gère valeurs null/undefined, Date, booléens, nombres, tableaux.
 * - Entête facultatif, BOM et séparateur configurables.
 * - Inclut un petit jeu de tests auto-exécutés (node/ts-node).
 */

export type Row = Record<string, unknown>;

export interface Column {
    /** clé dans l'objet (supporte "a.b.c" pour lecture profonde) */
    key: string;
    /** libellé d'entête (par défaut = key) */
    header?: string;
    /** formatage facultatif */
    formatter?: (value: unknown, row: Row) => string;
}

export interface ToCsvOptions {
    /** Séparateur de colonnes (par défaut ",") — pour Excel FR, utilisez ";" */
    delimiter?: string;
    /** Fin de ligne (par défaut "\r\n" conforme RFC4180) */
    eol?: string;
    /** Ajoute un BOM UTF-8 en tête (améliore compatibilité Excel) */
    bom?: boolean;
    /** Inclure la ligne d'entête (par défaut true) */
    includeHeaders?: boolean;
}

/** Échappe une valeur pour CSV selon le séparateur choisi. */
export function csvEscape(value: unknown, delimiter = ','): string {
    if (value == null) return '';

    // Normalisation en string
    const s = Array.isArray(value)
        ? value.map((v) => (v == null ? '' : String(v))).join('|')
        : value instanceof Date
          ? value.toISOString()
          : typeof value === 'object'
            ? JSON.stringify(value)
            : String(value);

    // Construire une RegExp qui déclenche la quotation si nécessaire
    const rx = new RegExp(`["\n${escapeForCharClass(delimiter)}]`);
    if (rx.test(s)) {
        // Échapper les guillemets en doublant le caractère, puis entourer de guillemets
        const doubled = s.replace(/"/g, '""');
        return `"${doubled}"`;
    }
    return s;
}

/** Génère un CSV à partir d'un tableau d'objets. */
export function toCsv(rows: Row[], columns?: Column[], opts: ToCsvOptions = {}): string {
    const delimiter = opts.delimiter ?? ',';
    const eol = opts.eol ?? '\r\n';
    const includeHeaders = opts.includeHeaders ?? true;

    // Détection automatique des colonnes si non fournies (ordre stable)
    const cols: Column[] = columns && columns.length ? columns.map((c) => ({ ...c })) : inferColumnsFromRows(rows);

    // Construire l'entête
    const headerLine = includeHeaders ? cols.map((c) => csvEscape(c.header ?? c.key, delimiter)).join(delimiter) : '';

    // Lignes de données
    const dataLines = rows.map((row) => {
        const cells = cols.map((col) => {
            const raw = pick(row, col.key);
            const formatted = col.formatter ? col.formatter(raw, row) : raw;
            return csvEscape(formatted, delimiter);
        });
        return cells.join(delimiter);
    });

    // Concaténation sûre, avec point-virgule pour terminer chaque instruction (évite les erreurs de parsing)
    const lines: string[] = [];
    if (includeHeaders) lines.push(headerLine);
    lines.push(...dataLines);

    let csv = lines.join(eol) + (lines.length ? eol : '');
    if (opts.bom) csv = '\uFEFF' + csv; // BOM UTF-8

    return csv;
}

/* --------------------------------- Helpers -------------------------------- */

function escapeForCharClass(ch: string): string {
    // Échappe les caractères spéciaux d'une char class RegExp
    // Note: on échappe aussi l'espace au cas où un séparateur exotique serait utilisé.
    return ch.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&').replace(/ /g, '\\s');
}

/** Récupère une valeur par chemin "a.b.c" (lecture profonde sécurisée). */
function pick(obj: unknown, path: string): unknown {
    if (obj == null) return undefined;
    if (!path.includes('.')) return (obj as any)[path];
    return path.split('.').reduce<any>((acc, key) => (acc ? acc[key] : undefined), obj as any);
}

/** Infère une liste de colonnes unique et ordonnée à partir des lignes. */
function inferColumnsFromRows(rows: Row[]): Column[] {
    const seen = new Set<string>();
    const keys: string[] = [];
    for (const r of rows) {
        for (const k of Object.keys(r)) {
            if (!seen.has(k)) {
                seen.add(k);
                keys.push(k);
            }
        }
    }
    return keys.map((k) => ({ key: k, header: k }));
}

/* ---------------------------------- Tests ---------------------------------- */
/**
 * Exécuter avec:
 *   ts-node csv.ts
 * ou
 *   node --loader ts-node/esm csv.ts   (si projet ESM)
 */
declare const require: any | undefined;
declare const module: any | undefined;

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    runTests();
}

function runTests(): void {
    const assert = (cond: any, msg: string) => {
        if (!cond) throw new Error('Test failed: ' + msg);
    };

    // Jeu de données
    const rows: Row[] = [
        { id: 1, nom: 'Dupont', note: 12.5, ok: true },
        { id: 2, nom: 'Alice "A"', note: 9, ok: false },
        { id: 3, nom: 'Bob, Jr', note: 15, ok: null },
        { id: 4, nom: 'Line\nBreak', note: 10.25, tags: ['a', 'b'] },
        { id: 5, nom: null, date: new Date('2024-01-02T03:04:05Z') }
    ];

    // 1) Basique avec entête + virgule
    {
        const csv = toCsv(rows);
        assert(csv.startsWith('id,nom,note,ok'), 'Entête par défaut attendu');
        assert(csv.includes('"Alice ""A"""'), 'Guillemets internes doivent être doublés + quotés');
        assert(csv.includes('"Bob, Jr"'), 'Virgule interne doit forcer la quotation');
        assert(csv.includes('"Line\nBreak"'), 'Saut de ligne doit forcer la quotation');
        assert(csv.endsWith('\r\n'), 'Doit se terminer par EOL');
    }

    // 2) Délimiteur point-virgule (compat Excel FR)
    {
        const csv = toCsv(rows, undefined, { delimiter: ';' });
        assert(csv.startsWith('id;nom;note;ok'), "Entête avec ';'");
        assert(csv.includes('"Bob, Jr"'), "Virgule interne ne change rien avec ';' mais reste quotée car charclass");
    }

    // 3) Colonnes explicitement ordonnées et formatteur
    {
        const csv = toCsv(
            rows,
            [
                { key: 'id' },
                { key: 'nom', header: 'Nom complet' },
                { key: 'note', formatter: (v) => (v == null ? '' : Number(v).toFixed(2)) },
                { key: 'tags' },
                { key: 'date' }
            ],
            { delimiter: ',', includeHeaders: true, bom: true }
        );

        assert(csv.charCodeAt(0) === 0xfeff, 'BOM présent');
        const lines = csv.slice(1).trim().split('\r\n'); // enlever BOM pour lire la 1ère ligne
        assert(lines[0] === 'id,Nom complet,note,tags,date', 'Entête custom + ordre');
        assert(lines[1].split(',')[2] === '12.50', 'Formatteur sur note (2 décimales)');
        assert(lines[3].includes('"a|b"'), 'Tableaux joints par | et quotés');
        assert(/2024-01-02T03:04:05\.000Z/.test(csv), 'Date en ISO');
    }

    // 4) Clés profondes
    {
        const rows2 = [{ a: { b: { c: 'x,y' } } }, { a: { b: { c: 'z"z' } } }];
        const csv = toCsv(rows2, [{ key: 'a.b.c', header: 'deep' }]);
        const ls = csv.trim().split('\r\n');
        assert(ls[0] === 'deep', 'Entête simple');
        assert(ls[1] === '"x,y"', 'Virgule -> quoté');
        assert(ls[2] === '"z""z"', 'Guillemets doublés');
    }

    // 5) Ligne vide / options
    {
        const csv = toCsv([], undefined, { includeHeaders: false });
        assert(csv === '', "Pas de lignes => string vide si pas d'entête");
    }

    // 6) Vérifie la RegExp dynamique: aucun crash, pas de syntax error
    {
        const weird = toCsv([{ x: 'ok' }], undefined, { delimiter: '|' });
        assert(weird.includes('x'), "Fonctionne avec '|' comme séparateur");
    }

    // 7) Nulls & undefined
    {
        const csv = toCsv([{ a: null, b: undefined }]);
        const data = csv.trim().split('\r\n')[1];
        assert(data === ',', 'Null/undefined => vide');
    }

    console.log('✔ Tous les tests CSV ont réussi.');
}
