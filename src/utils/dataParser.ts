import {
  ChartDataPoint,
  ComparisonRow,
  DataTableColumn,
  DataTableRow,
  ListItem,
} from '../types/studio';

export function extractNumericValue(cell: string): number | null {
  const trimmed = cell.trim();
  if (!trimmed) return null;
  // Remove currency symbols, commas, percent signs, plus signs, spaces
  const match = trimmed.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const num = parseFloat(match[0]);
  return Number.isNaN(num) ? null : num;
}

function splitCsvLine(line: string, delimiter: string): string[] {
  if (delimiter === '\t') {
    return line.split('\t').map((c) => c.trim());
  }
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r?\n/).find((l) => l.trim().length > 0) || '';
  if (firstLine.includes('\t')) return '\t';
  if (firstLine.includes('|')) return '|';
  if (firstLine.includes(';') && !firstLine.includes(',')) return ';';
  return ',';
}

export function parseDelimitedData(raw: string): {
  headers: string[];
  rows: string[][];
} {
  const trimmed = raw.trim();
  if (!trimmed) return { headers: [], rows: [] };

  // Support JSON array of objects or arrays
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (Array.isArray(parsed[0])) {
          const headers = parsed[0].map((v: unknown) => String(v));
          const rows = parsed.slice(1).map((r: unknown[]) => r.map((v) => String(v)));
          return { headers, rows };
        }
        if (typeof parsed[0] === 'object' && parsed[0] !== null) {
          const headers = Object.keys(parsed[0]);
          const rows = parsed.map((obj: Record<string, unknown>) =>
            headers.map((h) => String(obj[h] ?? ''))
          );
          return { headers, rows };
        }
      }
    } catch {
      // Fall through to delimited parser
    }
  }

  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };

  const delimiter = detectDelimiter(trimmed);
  const parsedLines = lines.map((line) => splitCsvLine(line, delimiter));

  if (parsedLines.length === 1) {
    return { headers: parsedLines[0], rows: [] };
  }

  const headers = parsedLines[0];
  const rows = parsedLines.slice(1).map((r) => {
    const padded = [...r];
    while (padded.length < headers.length) padded.push('');
    return padded.slice(0, headers.length);
  });

  return { headers, rows };
}

export function parseDataToChartPoints(raw: string): {
  points: ChartDataPoint[];
  seriesLabel?: string;
  secondarySeriesLabel?: string;
} {
  const { headers, rows } = parseDelimitedData(raw);
  if (rows.length === 0 && headers.length >= 2) {
    // Single line fallback
    const val = extractNumericValue(headers[1]) ?? 0;
    return {
      points: [{ id: `pt-${Date.now()}`, label: headers[0], value: val }],
    };
  }

  const points: ChartDataPoint[] = rows
    .filter((r) => r[0] && r[0].trim().length > 0)
    .map((r, idx) => {
      const val = extractNumericValue(r[1] ?? '') ?? 0;
      const sec = r.length > 2 ? extractNumericValue(r[2] ?? '') : null;
      return {
        id: `pt-${idx}-${Date.now().toString(36)}`,
        label: r[0],
        value: val,
        ...(sec !== null ? { secondaryValue: sec } : {}),
      };
    });

  return {
    points,
    seriesLabel: headers[1] || undefined,
    secondarySeriesLabel: headers[2] || undefined,
  };
}

export function parseDataToTable(raw: string): {
  columns: DataTableColumn[];
  rows: DataTableRow[];
} {
  const { headers, rows } = parseDelimitedData(raw);
  if (headers.length === 0) return { columns: [], rows: [] };

  const columns: DataTableColumn[] = headers.map((header, colIdx) => {
    const colValues = rows.map((r) => r[colIdx] ?? '').filter(Boolean);
    const numericCount = colValues.filter((v) => extractNumericValue(v) !== null).length;
    const isNumeric = colValues.length > 0 && numericCount >= Math.ceil(colValues.length * 0.6);
    const isLast = colIdx === headers.length - 1;
    return {
      id: `col-${colIdx}`,
      header,
      align: colIdx === 0 ? 'left' : isNumeric ? 'right' : 'left',
      isNumeric,
      showBar: isNumeric && isLast,
      isAccent: isLast,
    };
  });

  const mappedRows: DataTableRow[] = rows.map((cells, rIdx) => ({
    id: `row-${rIdx}-${Date.now().toString(36)}`,
    cells,
    highlighted: rIdx === 0,
  }));

  return { columns, rows: mappedRows };
}

export function parseDataToComparison(raw: string): {
  beforeHeader: string;
  afterHeader: string;
  rows: ComparisonRow[];
} {
  const { headers, rows } = parseDelimitedData(raw);
  const beforeHeader = headers[1] || 'TODAY';
  const afterHeader = headers[2] || 'THE GOAL';

  const mapped: ComparisonRow[] = rows.map((r, idx) => ({
    id: `cmp-${idx}-${Date.now().toString(36)}`,
    label: r[0] || `Metric ${idx + 1}`,
    beforeValue: r[1] || '—',
    afterValue: r[2] || '—',
    strikethroughBefore: true,
  }));

  return { beforeHeader, afterHeader, rows: mapped };
}

export function parseDataToList(raw: string): ListItem[] {
  const trimmed = raw.trim();
  if (!trimmed) return [];
  const { headers, rows } = parseDelimitedData(trimmed);

  // If only 1 column or plain lines without header
  if (headers.length === 1) {
    const allLines = trimmed
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    return allLines.map((line, idx) => ({
      id: `li-${idx}-${Date.now().toString(36)}`,
      indexText: String(idx + 1).padStart(2, '0'),
      title: line,
      detail: '',
      meta: '',
      highlighted: idx === 0,
    }));
  }

  // Multi-column CSV: Title, Detail, Metric/Tag
  const hasHeader =
    headers[0].toLowerCase().includes('title') ||
    headers[0].toLowerCase().includes('item') ||
    headers[0].toLowerCase().includes('name');
  const sourceRows = hasHeader ? rows : [headers, ...rows];

  return sourceRows.map((r, idx) => ({
    id: `li-${idx}-${Date.now().toString(36)}`,
    indexText: String(idx + 1).padStart(2, '0'),
    title: r[0] || `Item ${idx + 1}`,
    detail: r[1] || '',
    meta: r[2] || '',
    highlighted: idx === 0,
  }));
}

export function tableToCsv(headers: string[], rows: string[][]): string {
  const escape = (v: string) =>
    v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
  const lines = [
    headers.map(escape).join(', '),
    ...rows.map((r) => r.map(escape).join(', ')),
  ];
  return lines.join('\n');
}
