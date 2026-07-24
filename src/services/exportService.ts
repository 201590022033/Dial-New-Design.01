export interface ExportPayload {
  svgMarkup: string;
  filename: string;
}

export const exportSvg = ({ svgMarkup, filename }: ExportPayload): void => {
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
