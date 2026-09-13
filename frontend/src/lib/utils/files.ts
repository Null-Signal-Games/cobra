export function quoteCsvValue(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export function downloadBlob(fileName: string, data: Blob) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(data);
  link.download = fileName;
  link.click();
}
