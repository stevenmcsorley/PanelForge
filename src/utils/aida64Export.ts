/**
 * AIDA64 Export Utilities
 *
 * Exports generated gauge frames as PNG files for use with AIDA64 SensorPanel.
 * AIDA64 requires separate image files (not base64 embedded).
 *
 * Supports:
 * - ZIP package download (recommended)
 * - Individual file downloads
 */

import JSZip from 'jszip';

export interface AIDA64ExportOptions {
    frames: string[];           // Base64 data URLs
    prefix: string;             // Filename prefix (default: "frame")
    padding: number;            // Number padding (3 = 001, 002...)
    gaugeName?: string;         // Optional gauge name for ZIP filename
}

/**
 * Convert a base64 data URL to a Blob
 */
function dataURLtoBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
    const bstr = atob(parts[1]);
    const n = bstr.length;
    const u8arr = new Uint8Array(n);

    for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
    }

    return new Blob([u8arr], { type: mime });
}

/**
 * Generate padded frame filename
 */
function getFrameFilename(prefix: string, index: number, padding: number): string {
    const paddedIndex = String(index + 1).padStart(padding, '0');
    return `${prefix}_${paddedIndex}.png`;
}

/**
 * Download a blob as a file
 */
function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

/**
 * Export frames as a ZIP file
 * Creates a ZIP containing all PNG frames numbered sequentially
 */
export async function exportFramesToZip(
    options: AIDA64ExportOptions,
    onProgress?: (progress: number) => void
): Promise<void> {
    const { frames, prefix, padding, gaugeName } = options;
    const zip = new JSZip();

    // Add each frame to the ZIP
    for (let i = 0; i < frames.length; i++) {
        const filename = getFrameFilename(prefix, i, padding);
        const blob = dataURLtoBlob(frames[i]);
        zip.file(filename, blob);

        if (onProgress) {
            onProgress((i + 1) / frames.length * 0.8); // 80% for adding files
        }
    }

    // Generate ZIP blob
    const zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (metadata) => {
            if (onProgress) {
                onProgress(0.8 + metadata.percent / 100 * 0.2); // Last 20% for compression
            }
        }
    );

    // Download the ZIP
    const zipFilename = gaugeName
        ? `${gaugeName.replace(/[^a-zA-Z0-9]/g, '_')}_frames.zip`
        : `gauge_frames.zip`;

    downloadBlob(zipBlob, zipFilename);
}

/**
 * Export frames as individual PNG files
 * Downloads each frame as a separate file with a small delay between downloads
 */
export async function exportFramesIndividually(
    options: AIDA64ExportOptions,
    onProgress?: (progress: number) => void
): Promise<void> {
    const { frames, prefix, padding } = options;

    for (let i = 0; i < frames.length; i++) {
        const filename = getFrameFilename(prefix, i, padding);
        const blob = dataURLtoBlob(frames[i]);
        downloadBlob(blob, filename);

        if (onProgress) {
            onProgress((i + 1) / frames.length);
        }

        // Small delay between downloads to prevent browser blocking
        if (i < frames.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }
}

/**
 * Estimate ZIP file size in bytes
 */
export function estimateZipSize(frames: string[]): number {
    // Rough estimate: base64 is ~33% larger than binary, plus ~10% compression
    const totalBase64 = frames.reduce((sum, frame) => sum + frame.length, 0);
    const binarySize = totalBase64 * 0.75; // Convert from base64
    const compressedSize = binarySize * 0.9; // PNG doesn't compress much more
    return Math.round(compressedSize);
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
