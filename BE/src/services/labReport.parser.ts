import { extractTextItems, type StructuredTextItem } from 'unpdf';

export type LabCategory = 'blood' | 'urine' | 'other';

export interface LabReportRow {
  test: string;
  result: string;
  unit: string;
  referenceRange: string;
  category: LabCategory;
}

export interface LabReportExtraction {
  source: string;
  collectedAt: string | null;
  rows: LabReportRow[];
  textLength: number;
}

interface Glyph {
  text: string;
  x: number;
  y: number;
  width: number;
}

interface Cell {
  text: string;
  x: number;
  width: number;
}

type ColumnKind = 'test' | 'result' | 'unit' | 'range';

interface Column {
  kind: ColumnKind;
  start: number;
  end: number;
}

const LINE_TOLERANCE = 3;
const CELL_GAP = 6;

const COLUMN_TERMS: Record<ColumnKind, string[]> = {
  test: [
    'test name',
    'investigation',
    'untersuchung',
    'bezeichnung',
    'parameter',
    'analyte',
    'analyse',
    'assay',
    'test',
  ],
  result: ['ergebnis', 'resultat', 'results', 'result', 'values', 'value', 'wert'],
  unit: ['einheiten', 'einheit', 'units', 'unit'],
  range: [
    'reference range',
    'referenzbereich',
    'normalbereich',
    'normbereich',
    'normalwert',
    'normal range',
    'ref range',
    'reference',
    'referenz',
    'range',
    'ref',
  ],
};

const FLAG_TERMS = new Set([
  'flag',
  'flags',
  'hinweis',
  'interpretation',
  'status',
  'bewertung',
  'comment',
  'comments',
]);

const DATE_LABELS = [
  'entnahmedatum',
  'abnahmedatum',
  'befunddatum',
  'collection date',
  'specimen date',
  'sample date',
  'report date',
  'collected',
  'entnahme',
  'abnahme',
  'probenahme',
  'datum',
  'date',
];

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
  mai: 5,
  mrz: 3,
  okt: 10,
  dez: 12,
};

const UNIT_SOURCE = [
  String.raw`(?:[x×]\s*)?10\s*(?:\^|e)\s*\d+\s*/\s*[µμu]?l`,
  String.raw`(?:µg|μg|ug|ng|pg|mg|mmol|µmol|μmol|umol|nmol|pmol|miu|iu|g|u|k)\s*/\s*(?:dl|ml|l|µl|μl|ul)`,
  String.raw`mm/h`,
  String.raw`(?<![a-z])(?:fl|pg|ratio)(?![a-z])`,
  '%',
].join('|');

const RANGE_PATTERN = /(?:[<>≤≥]=?\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?\s*[-–—]\s*\d+(?:[.,]\d+)?)/;

const RESULT_PATTERN = /^(?:[<>≤≥]=?\s*)?\d+(?:[.,]\d+)?$/;

const QUALITATIVE_PATTERN =
  /^(?:positive|negative|reactive|non-?reactive|detected|not detected|present|absent|normal|abnormal|positiv|negativ|reaktiv)$/i;

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[.:]/g, ' ')
    .replace(/[^a-z0-9/+^ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function columnKind(text: string): ColumnKind | 'flag' | null {
  const value = normalize(text);
  if (!value) return null;
  if (FLAG_TERMS.has(value)) return 'flag';

  const kinds: ColumnKind[] = ['range', 'test', 'result', 'unit'];
  for (const kind of kinds) {
    for (const term of COLUMN_TERMS[kind]) {
      if (value === term || value.startsWith(`${term} `)) return kind;
    }
  }

  return null;
}

function cleanResult(value: string): string {
  return value.replace(/(?:\s+|(?<=\d))(?:\*|↑|↓|HH|LL|H|L)$/i, '').trim();
}

function isResult(value: string): boolean {
  return RESULT_PATTERN.test(value) || QUALITATIVE_PATTERN.test(value);
}

function readRange(value: string): string {
  const match = value.match(RANGE_PATTERN);
  if (match?.[0]) return match[0].trim();
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= 40 ? trimmed : '';
}

function stripUnit(value: string): { value: string; unit: string } {
  const match = value.match(new RegExp(UNIT_SOURCE, 'i'));
  if (!match || match.index === undefined) return { value: value.trim(), unit: '' };

  const unit = match[0];
  const rest = `${value.slice(0, match.index)} ${value.slice(match.index + unit.length)}`;
  return { value: rest.replace(/\s+/g, ' ').trim(), unit: unit.trim() };
}

function cellsFrom(glyphs: Glyph[]): Cell[] {
  const sorted = [...glyphs].sort((left, right) => left.x - right.x);
  const cells: Cell[] = [];

  for (const glyph of sorted) {
    const previous = cells[cells.length - 1];
    const gap = previous ? glyph.x - (previous.x + previous.width) : Number.POSITIVE_INFINITY;
    if (previous && gap >= 0 && gap < CELL_GAP) {
      previous.text = `${previous.text} ${glyph.text}`.replace(/\s+/g, ' ').trim();
      previous.width = glyph.x + glyph.width - previous.x;
      continue;
    }

    cells.push({ text: glyph.text, x: glyph.x, width: glyph.width });
  }

  return cells;
}

function linesFrom(items: StructuredTextItem[]): Cell[][] {
  const glyphs: Glyph[] = items
    .filter((item) => item.str.trim().length > 0)
    .map((item) => ({
      text: item.str.trim(),
      x: item.x,
      y: item.y,
      width: item.width,
    }))
    .sort((left, right) => right.y - left.y || left.x - right.x);

  const groups: Glyph[][] = [];
  for (const glyph of glyphs) {
    const current = groups[groups.length - 1];
    const anchor = current?.[0];
    if (!current || !anchor || Math.abs(anchor.y - glyph.y) > LINE_TOLERANCE) {
      groups.push([glyph]);
      continue;
    }

    current.push(glyph);
  }

  return groups.map((group) => cellsFrom(group));
}

function headerColumns(cells: Cell[]): Column[] | null {
  const matched = cells.flatMap((cell) => {
    const kind = columnKind(cell.text);
    if (!kind || kind === 'flag') return [];
    return [{ kind, x: cell.x }];
  });

  const kinds = new Set(matched.map((item) => item.kind));
  if (!kinds.has('test') || !kinds.has('result')) return null;

  const unique: Array<{ kind: ColumnKind; x: number }> = [];
  for (const item of [...matched].sort((left, right) => left.x - right.x)) {
    const previous = unique[unique.length - 1];
    if (previous?.kind === item.kind) continue;
    unique.push(item);
  }

  return unique.map((item, index) => {
    const previous = unique[index - 1];
    const next = unique[index + 1];
    return {
      kind: item.kind,
      start: previous ? (previous.x + item.x) / 2 : Number.NEGATIVE_INFINITY,
      end: next ? (item.x + next.x) / 2 : Number.POSITIVE_INFINITY,
    };
  });
}

function lineText(cells: Cell[]): string {
  return cells
    .map((cell) => cell.text)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function categoryFrom(text: string): LabCategory | null {
  const value = normalize(text);
  if (/\b(?:urine|urinalysis|urin\w*)\b/.test(value)) return 'urine';
  if (
    /\b(?:blood|hematolog\w*|haematolog\w*|blutbild|blut|serum|plasma|chemistr\w*|chemie)\b/.test(
      value,
    )
  ) {
    return 'blood';
  }
  return null;
}

function isSection(cells: Cell[]): LabCategory | null {
  const text = lineText(cells);
  const category = categoryFrom(text);
  if (!category || text.split(' ').length > 6) return null;
  if (cells.some((cell) => isResult(cleanResult(cell.text)))) return null;
  return category;
}

function parseRow(cells: Cell[], columns: Column[], category: LabCategory): LabReportRow | null {
  const fields: Record<ColumnKind, string> = { test: '', result: '', unit: '', range: '' };

  for (const cell of cells) {
    const center = cell.x + cell.width / 2;
    const column = columns.find((item) => center >= item.start && center < item.end);
    if (!column) continue;
    fields[column.kind] = `${fields[column.kind]} ${cell.text}`.trim();
  }

  const resultParts = stripUnit(cleanResult(fields.result));
  const result = cleanResult(resultParts.value);
  const unit = fields.unit.trim() || resultParts.unit;
  const test = fields.test.replace(/\s+/g, ' ').trim();

  if (test.length < 2 || test.length > 80 || columnKind(test)) return null;
  if (!isResult(result)) return null;

  return {
    test,
    result,
    unit,
    referenceRange: readRange(fields.range),
    category,
  };
}

function parseLooseLine(text: string, category: LabCategory): LabReportRow | null {
  const rangeMatch = text.match(RANGE_PATTERN);
  let rest = text;
  let range = '';
  if (rangeMatch?.[0] && rangeMatch.index !== undefined) {
    range = rangeMatch[0];
    rest = `${text.slice(0, rangeMatch.index)} ${text.slice(rangeMatch.index + range.length)}`;
  }

  const unitParts = stripUnit(rest);
  const resultMatch = unitParts.value.match(
    /(?:[<>≤≥]=?\s*)?\d+(?:[.,]\d+)?|(?:positive|negative|reactive|non-?reactive|detected|not detected|present|absent|normal|abnormal|positiv|negativ|reaktiv)/i,
  );
  if (!resultMatch?.[0] || resultMatch.index === undefined) return null;

  const result = cleanResult(resultMatch[0]);
  const test =
    `${unitParts.value.slice(0, resultMatch.index)} ${unitParts.value.slice(resultMatch.index + resultMatch[0].length)}`
      .replace(/\s+/g, ' ')
      .replace(/^[:\-–—]+|[:\-–—]+$/g, '')
      .trim();

  if (!isResult(result) || test.length < 2 || test.length > 80 || columnKind(test)) return null;
  if (!unitParts.unit && !range) return null;

  return {
    test,
    result,
    unit: unitParts.unit,
    referenceRange: range,
    category,
  };
}

function monthNumber(token: string): number | null {
  const value = normalize(token).replace(/[^a-z]/g, '');
  if (value.startsWith('maerz') || value.startsWith('marz')) return 3;
  if (value.startsWith('sept')) return 9;
  const month = MONTHS[value.slice(0, 3)];
  return month ?? null;
}

function toIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null;
  const candidate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  const monthText = String(month).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');
  return `${year}-${monthText}-${dayText}`;
}

function readDate(text: string): string | null {
  const iso = text.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso?.[1] && iso[2] && iso[3]) return toIso(Number(iso[1]), Number(iso[2]), Number(iso[3]));

  const numeric = text.match(/\b(\d{1,2})[./](\d{1,2})[./](\d{4})\b/);
  if (numeric?.[1] && numeric[2] && numeric[3]) {
    return toIso(Number(numeric[3]), Number(numeric[2]), Number(numeric[1]));
  }

  const named = text.match(/\b(\d{1,2})\s+([A-Za-zäöüÄÖÜ.]+)\s+(\d{4})\b/);
  if (named?.[1] && named[2] && named[3]) {
    const month = monthNumber(named[2]);
    if (month) return toIso(Number(named[3]), month, Number(named[1]));
  }

  return null;
}

function findDate(lines: string[]): string | null {
  for (const label of DATE_LABELS) {
    for (const line of lines) {
      if (/birth|geburt|\bdob\b/i.test(line)) continue;
      if (!normalize(line).includes(label)) continue;
      const found = readDate(line);
      if (found) return found;
    }
  }

  return null;
}

function findSource(lines: string[]): string {
  for (const line of lines.slice(0, 25)) {
    const labeled = line.match(
      /^(?:laboratory|labor|institut|institute|clinic|klinik|hospital)\s*[:\-]\s*(.+)$/i,
    );
    if (labeled?.[1]?.trim()) return labeled[1].trim();
  }

  for (const line of lines.slice(0, 20)) {
    const trimmed = line.trim();
    if (trimmed.length < 4 || trimmed.length > 80) continue;
    if (/^(?:laboratory|lab)\s+report$/i.test(trimmed)) continue;
    if (/\b(?:gmbh|institut|institute|hospital|klinik|clinic|patholog)\b/i.test(trimmed)) {
      return trimmed;
    }
    if (
      /\blabor(?:atory)?\b/i.test(trimmed) &&
      !/\b(?:report|remarks?|results?)\b/i.test(trimmed)
    ) {
      return trimmed;
    }
  }

  return '';
}

function dedupe(rows: LabReportRow[]): LabReportRow[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.category}|${row.test}|${row.result}|${row.unit}|${row.referenceRange}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function parseLabReport(data: Uint8Array): Promise<LabReportExtraction> {
  const extracted = await extractTextItems(data);
  const lines = extracted.items.flatMap((items) => linesFrom(items));
  const texts = lines.map((cells) => lineText(cells)).filter((text) => text.length > 0);

  let category: LabCategory = 'other';
  let columns: Column[] | null = null;
  const rows: LabReportRow[] = [];

  for (const cells of lines) {
    const header = headerColumns(cells);
    if (header) {
      columns = header;
      continue;
    }

    const section = isSection(cells);
    if (section) {
      category = section;
      continue;
    }

    if (!columns) continue;
    const row = parseRow(cells, columns, category);
    if (row) rows.push(row);
  }

  if (rows.length === 0) {
    category = 'other';
    for (const text of texts) {
      const section = categoryFrom(text);
      if (section && text.split(' ').length <= 6 && !RANGE_PATTERN.test(text)) {
        category = section;
        continue;
      }

      const row = parseLooseLine(text, category);
      if (row) rows.push(row);
    }
  }

  return {
    source: findSource(texts),
    collectedAt: findDate(texts),
    rows: dedupe(rows),
    textLength: texts.join('').replace(/\s/g, '').length,
  };
}
