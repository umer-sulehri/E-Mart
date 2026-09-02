function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map((h) => escapeCsv(h)).join(","),
    ...rows.map((row) => headers.map((h) => escapeCsv(row[h])).join(",")),
  ];
  return "\uFEFF" + lines.join("\r\n");
}

export function downloadCsvResponse(
  csv: string,
  filename: string
): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

/**
 * Parse CSV text into an array of string rows (no header handling, no object
 * mapping). Handles quoted fields, embedded commas, escaped quotes and CRLF.
 * Empty rows are omitted.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(current);
      current = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(current);
      current = "";
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
    } else {
      current += ch;
    }
  }
  row.push(current);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);
  return rows;
}

/**
 * Normalize a header row to snake_case keys and map each data row to an object.
 * Returns { rows, headers } where rows are header-keyed objects.
 */
export function parseCsvToObjects(
  text: string
): {
  rows: Record<string, string>[];
  headers: string[];
} {
  const parsed = parseCsv(text);
  if (parsed.length === 0) {
    return { rows: [], headers: [] };
  }
  const headers = parsed[0].map((h) =>
    h.trim().toLowerCase().replace(/\s+/g, "_")
  );
  const dataRows = parsed.slice(1);
  const rows = dataRows.map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((name, index) => {
      obj[name] = (row[index] || "").trim();
    });
    return obj;
  });
  return { rows, headers };
}
