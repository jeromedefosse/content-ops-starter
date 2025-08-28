/**
 * csv.ts — single-file, stable CSV utilities with tests
 *
 * Fixes prior SyntaxError issues by:
 *  - Using a properly closed regular expression in csvEscape: /["\n,]/
 *  - Ensuring every statement is correctly terminated with semicolons
 *  - Simplifying string concatenation logic inside toCsv
 *
 * Features:
 *  - csvEscape: RFC4180-style escaping (quotes, commas, newlines)
 *  - toCsv: accepts rows of objects or arrays
 *  - Options for custom headers, delimiter, line ending, BOM, includeHeader
 *  - Deterministic header order
 *  - Lightweight self-test runner; does not depend on external libs
 */

export type CsvPrimitive = string | number | boolean | null | undefined | Date;
export type CsvCell = CsvPrimitive | CsvPrimitive[];
export type CsvRow = Record<string, CsvCell> | CsvCell[];

export interface ToCsvOptions {
    /** explicit header order; if omitted and rows are objects, headers are derived */
    headers?: string[];
    /** cell delimiter (default ',') */
    delimiter?: string;
    /** line ending (default '\n') */
    lineEnding?: string;
    /** prepend UTF-8 BOM (default false) */
    includeBom?: boolean;
    /** include header row (default true when headers exist) */
    includeHeader?: boolean;
}

/**
 * Convert a value into a CSV-safe string.
 * - null/undefined -> ""
 * - Date -> ISO string
 * - Array of primitives -> joined with '|'
 * - Other -> String(v)
 *
 * If the field contains a double-quote, comma or newline, the value is wrapped in quotes
 * and internal quotes are doubled per RFC4180.
 */
export function csvEscape(v: CsvCell): string {
    if (v == null) return '';
    const normalize = (x: CsvPrimitive): string => (x instanceof Date ? x.toISOString() : String(x));
    const s = Array.isArray(v) ? v.map(normalize).join('|') : normalize(v);
    // Properly closed regex: /["\n,]/
    return /["\n,]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Detect headers from object rows in a deterministic order. */
export function detectHeadersFromRows(rows: CsvRow[]): string[] {
    const seen = new Set<string>();
    const headers: string[] = [];
    for (const row of rows) {
        if (Array.isArray(row)) continue;
        for (const k of Object.keys(row)) {
            if (!seen.has(k)) {
                seen.add(k);
                headers.push(k);
            }
        }
    }
    return headers;
}

/** Convert rows (objects or arrays) to CSV string. */
export function toCsv(rows: CsvRow[], options: ToCsvOptions = {}): string {
    const delimiter = options.delimiter ?? ',';
    const lineEnding = options.lineEnding ?? '\n';
    const includeBom = options.includeBom ?? false;
    let headers = options.headers ? [...options.headers] : detectHeadersFromRows(rows);

    // Decide whether to include header line
    const headerExists = headers.length > 0;
    const includeHeader = options.includeHeader ?? headerExists;

    const lines: string[] = [];

    if (includeHeader && headerExists) {
        lines.push(headers.map((h) => csvEscape(h)).join(delimiter));
    }

    for (const row of rows) {
        if (Array.isArray(row)) {
            // Row is an array of cells
            lines.push(row.map(csvEscape).join(delimiter));
        } else {
            // Row is an object; ensure stable header order
            if (!headerExists) {
                headers = Object.keys(row);
            }
            const cells = headers.map((h) => csvEscape(row[h]));
            lines.push(cells.join(delimiter));
        }
    }

    const body = lines.join(lineEnding) + (lines.length ? lineEnding : '');
    return includeBom ? '\uFEFF' + body : body;
}

/**
 * =====================
 * Minimal Test Harness
 * =====================
 *
 * These tests run when this file is executed directly with ts-node or transpiled JS.
 * They are additive and do not replace any existing project tests.
 */
function assertEqual(actual: unknown, expected: unknown, msg?: string): void {
    if (actual !== expected) {
        throw new Error((msg ? msg + '\n' : '') + `Expected:\n${expected}\nActual:\n${actual}`);
    }
}

function runSelfTests(): void {
    const lf = '\n';

    // 1) Basic object rows, header inferred
    const rows1: CsvRow[] = [
        { id: 1, name: 'Alice', ok: true },
        { id: 2, name: 'Bob, Jr.', ok: false }
    ];
    const csv1 = toCsv(rows1);
    assertEqual(csv1, ['id,name,ok', '1,Alice,true', '2,"Bob, Jr.",false', ''].join(lf), 'Basic object rows with inferred header');

    // 2) Array rows (no header)
    const rows2: CsvRow[] = [
        ['a', 'b'],
        ['c', 'd']
    ];
    const csv2 = toCsv(rows2, { includeHeader: false });
    assertEqual(csv2, ['a,b', 'c,d', ''].join(lf), 'Array rows without header');

    // 3) Quotes and newlines
    const rows3: CsvRow[] = [{ text: 'He said "Hello"', note: 'line1\nline2' }];
    const csv3 = toCsv(rows3);
    assertEqual(csv3, ['text,note', '"He said ""Hello""","line1\nline2"', ''].join(lf), 'Escape quotes and newlines');

    // 4) Nulls, undefined, booleans, numbers
    const rows4: CsvRow[] = [{ a: null, b: undefined, c: 0, d: false }];
    const csv4 = toCsv(rows4);
    assertEqual(csv4, ['a,b,c,d', ',,0,false', ''].join(lf), 'Null/undefined handling');

    // 5) Arrays join with '|'
    const rows5: CsvRow[] = [{ tags: ['hip', 'knee'], score: 7 }];
    const csv5 = toCsv(rows5);
    assertEqual(csv5, ['tags,score', 'hip|knee,7', ''].join(lf), 'Array join with |');

    // 6) Custom headers ordering
    const rows6: CsvRow[] = [{ b: 2, a: 1 }];
    const csv6 = toCsv(rows6, { headers: ['a', 'b'] });
    assertEqual(csv6, ['a,b', '1,2', ''].join(lf), 'Custom header order');

    // 7) Custom delimiter and no final newline
    const rows7: CsvRow[] = [{ a: 'x', b: 'y' }];
    const csv7 = toCsv(rows7, { delimiter: ';', lineEnding: '\n', includeBom: false });
    assertEqual(csv7, ['a;b', 'x;y', ''].join(lf), 'Custom delimiter works');

    // 8) BOM
    const csv8 = toCsv(rows7, { includeBom: true });
    assertEqual(csv8.startsWith('\uFEFF'), true, 'Includes BOM when requested');
}

// Execute tests only if this module is the entry point
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
    try {
        runSelfTests();
        // eslint-disable-next-line no-console
        console.log('csv.ts self-tests: OK');
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error('csv.ts self-tests: FAILED');
        // eslint-disable-next-line no-console
        console.error(err);
        process.exitCode = 1;
    }
}
