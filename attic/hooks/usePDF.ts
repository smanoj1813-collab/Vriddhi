// hooks/usePDF.ts — Lazy load html2pdf only when needed
export async function generatePDF(element: HTMLElement, filename: string) {
  const html2pdf = (await import('html2pdf.js')).default

  const opt = {
    margin: 10,
    filename: filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
  }

  await html2pdf().set(opt).from(element).save()
}