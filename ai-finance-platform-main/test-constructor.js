const { PDFParse } = require('pdf-parse');
const fs = require('fs');

async function test() {
  try {
    console.log('Testing PDFParse constructor...');
    // Create a dummy buffer or read a small file if exists
    const buffer = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] >>\nendobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n178\n%%EOF');
    
    if (PDFParse.setWorker) {
      console.log('Calling setWorker()...');
      PDFParse.setWorker();
    }
    
    console.log('Instantiating PDFParse...');
    const parser = new PDFParse({ data: buffer });
    console.log('Calling getText()...');
    const data = await parser.getText();
    console.log('Success! Text length:', data.text.length);
  } catch (err) {
    console.error('TEST FAILED:', err.message);
  }
}

test();
