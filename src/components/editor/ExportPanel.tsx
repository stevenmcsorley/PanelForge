/**
 * ExportPanel
 * Export PNG and JSON, Import JSON
 */

import React, { useRef } from 'react';
import Konva from 'konva';
import { exportCanvasToPng, exportPanelConfig, importPanelConfig } from '@/utils';
import { Button } from '@/components/ui';

interface ExportPanelProps {
  stageRef: React.RefObject<Konva.Stage>;
}

export const ExportPanel: React.FC<ExportPanelProps> = ({ stageRef }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = React.useState<string | null>(null);

  const handleExportPng = () => {
    if (stageRef.current) {
      exportCanvasToPng(stageRef.current);
    }
  };

  const handleExportJson = () => {
    exportPanelConfig();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const json = event.target?.result as string;
      const success = importPanelConfig(json);
      setImportStatus(success ? 'Config imported successfully!' : 'Failed to import config');
      setTimeout(() => setImportStatus(null), 3000);
    };
    reader.readAsText(file);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="panel">
      <div className="panel-header">Export / Import</div>

      <div className="button-row">
        <Button variant="primary" onClick={handleExportPng}>
          Export PNG
        </Button>
        <Button variant="primary" onClick={handleExportJson}>
          Export JSON
        </Button>
      </div>

      <div style={{ marginTop: 12 }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImportJson}
          style={{ display: 'none' }}
        />
        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          fullWidth
        >
          Import JSON Config
        </Button>
      </div>

      {importStatus && (
        <div
          style={{
            marginTop: 8,
            padding: 8,
            background: importStatus.includes('success') ? '#1a4a1a' : '#4a1a1a',
            borderRadius: 4,
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          {importStatus}
        </div>
      )}
    </div>
  );
};
