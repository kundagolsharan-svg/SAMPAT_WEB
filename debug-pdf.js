const pdf = require('pdf-parse');
console.log('PDF-PARSE MODULE TYPE:', typeof pdf);
console.log('PDF-PARSE MODULE KEYS:', Object.keys(pdf));

if (typeof pdf === 'function') {
  console.log('Detected as function (standard usage)');
} else if (pdf.PDFParse && typeof pdf.PDFParse === 'function') {
  console.log('Detected PDFParse as function (class usage)');
} else if (pdf.default && typeof pdf.default === 'function') {
  console.log('Detected default as function (ESM/CJS interop usage)');
} else {
  console.log('NO PARSE FUNCTION FOUND');
}
