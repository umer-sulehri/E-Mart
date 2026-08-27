'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';

interface ExportCsvButtonProps {
  url: string;
  label?: string;
}

export default function ExportCsvButton({
  url,
  label = 'Export CSV',
}: ExportCsvButtonProps) {
  const [downloading, setDownloading] = useState(false);

  const handleExport = async () => {
    setDownloading(true);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || 'Export failed');
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match ? match[1] : `export-${Date.now()}.csv`;

      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success('Export downloaded');
    } catch {
      toast.error('Failed to export');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={downloading}
      className="inline-flex items-center gap-2 rounded-lg border border-muted-200 bg-white px-3 py-2 text-sm font-medium text-secondary-800 transition-colors hover:bg-muted-50 disabled:opacity-50"
    >
      <Download className="h-4 w-4" />
      {downloading ? 'Exporting...' : label}
    </button>
  );
}
