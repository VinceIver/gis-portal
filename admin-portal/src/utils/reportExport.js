// src/utils/reportExport.js

export function toCSV(rows, columns) {
  const esc = (v) => {
    const s = String(v ?? "");
    if (s.includes('"') || s.includes(",") || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };

  const header = columns.map((c) => esc(c.label)).join(",");
  const body = (rows || [])
    .map((r) => columns.map((c) => esc(typeof c.get === "function" ? c.get(r) : r[c.key])).join(","))
    .join("\n");

  return `${header}\n${body}\n`;
}

export function downloadText(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function printPage() {
  window.print();
}