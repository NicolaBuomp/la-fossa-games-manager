import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExportService {
  downloadCsv<T extends Record<string, unknown>>(filename: string, rows: T[]): void {
    if (!rows.length) {
      this.download(filename, '');
      return;
    }

    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map((row) => headers.map((key) => this.escape(row[key])).join(','))
    ].join('\n');

    this.download(filename, csv);
  }

  private escape(value: unknown): string {
    const text = value === null || value === undefined ? '' : String(value);
    return `"${text.replace(/"/g, '""')}"`;
  }

  private download(filename: string, contents: string): void {
    const blob = new Blob([contents], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
