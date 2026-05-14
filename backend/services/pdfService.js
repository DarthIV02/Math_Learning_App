const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

async function generateCredentialPdf({ classInfo, students }) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 40,
  });

  const chunks = [];

  doc.on('data', (chunk) => chunks.push(chunk));

  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc
    .fontSize(22)
    .text('Student Login Credentials', { align: 'center' });

  doc.moveDown();

  doc
    .fontSize(14)
    .text(`Class: ${classInfo.name}`)
    .text(`Grade: ${classInfo.grade}. Klasse`);

  doc.moveDown();

  for (const student of students) {
    const qrDataUrl = await QRCode.toDataURL(student.qrLoginUrl);
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    const startY = doc.y;

    doc
      .roundedRect(40, startY, 515, 150, 10)
      .stroke();

    doc
      .fontSize(16)
      .text(student.name, 60, startY + 20);

    doc
      .fontSize(11)
      .text(`Username: ${student.username}`, 60, startY + 55)
      .text(`Password: ${student.password}`, 60, startY + 75)

    doc.image(qrBuffer, 430, startY + 25, {
      width: 90,
      height: 90,
    });

    doc.y = startY + 175;

    if (doc.y > 700) {
      doc.addPage();
    }
  }

  doc.end();

  return done;
}

module.exports = {
  generateCredentialPdf,
};