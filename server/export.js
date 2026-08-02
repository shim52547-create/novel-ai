const Epub = require('epub-gen');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// ====== EXPORT TXT ======
function exportTXT(book, chapters) {
  let text = '';
  text += `${'='.repeat(60)}\n`;
  text += `  ${book.title}\n`;
  text += `  Thể loại: ${book.genre || 'Chưa phân loại'}\n`;
  text += `  ${'='.repeat(60)}\n\n`;

  if (book.synopsis) {
    text += `TÓM TẮT:\n${book.synopsis}\n\n`;
    text += `${'─'.repeat(60)}\n\n`;
  }

  chapters.forEach(ch => {
    text += `${'─'.repeat(40)}\n`;
    text += `  CHƯƠNG ${ch.chapter_number}: ${ch.title}\n`;
    text += `${'─'.repeat(40)}\n\n`;
    text += `${ch.content}\n\n\n`;
  });

  text += `${'='.repeat(60)}\n`;
  text += `  HẾT\n`;
  text += `  Tạo bởi Novel AI Studio\n`;
  text += `${'='.repeat(60)}\n`;

  return text;
}

// ====== EXPORT EPUB ======
async function exportEPUB(book, chapters, outputPath) {
  const content = chapters.map(ch => ({
    title: `Chương ${ch.chapter_number}: ${ch.title}`,
    data: ch.content
      .split('\n')
      .filter(line => line.trim())
      .map(line => `<p style="text-indent: 2em; margin-bottom: 0.8em; line-height: 1.8;">${line}</p>`)
      .join(''),
  }));

  const options = {
    title: book.title,
    author: 'Novel AI Studio',
    publisher: 'Novel AI Studio',
    cover: null,
    lang: 'vi',
    css: `
      body { font-family: Georgia, serif; line-height: 1.8; color: #222; }
      h1 { font-size: 1.6em; margin-bottom: 0.5em; text-align: center; }
      p { text-indent: 2em; margin-bottom: 0.8em; }
    `,
    content,
  };

  await new Epub(options, outputPath).promise;
  return outputPath;
}

// ====== EXPORT PDF ======
function exportPDF(book, chapters, outputPath) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A5',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: book.title,
        Author: 'Novel AI Studio',
        Subject: book.genre || '',
      },
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // ===== TRANG BÌA =====
    doc.moveDown(8);
    doc.fontSize(28).font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text(book.title, { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(12).font('Helvetica')
      .fillColor('#666')
      .text(book.genre || '', { align: 'center' });

    doc.moveDown(2);
    doc.fontSize(9).font('Helvetica')
      .fillColor('#999')
      .text('Tạo bởi Novel AI Studio', { align: 'center' });
    doc.text(new Date().toLocaleDateString('vi-VN'), { align: 'center' });

    // ===== TRANG MỤC LỤC =====
    doc.addPage();
    doc.fontSize(18).font('Helvetica-Bold')
      .fillColor('#1a1a1a')
      .text('MỤC LỤC', { align: 'center' });
    doc.moveDown(1);

    chapters.forEach(ch => {
      doc.fontSize(10).font('Helvetica')
        .fillColor('#333')
        .text(`Chương ${ch.chapter_number}: ${ch.title}`, {
          align: 'left',
          link: null,
        });
      doc.moveDown(0.3);
    });

    // ===== CÁC CHƯƠNG =====
    chapters.forEach(ch => {
      doc.addPage();

      // Tiêu đề chương
      doc.moveDown(2);
      doc.fontSize(16).font('Helvetica-Bold')
        .fillColor('#1a1a1a')
        .text(`Chương ${ch.chapter_number}`, { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(12).font('Helvetica-Bold')
        .text(ch.title, { align: 'center' });

      doc.moveDown(1.5);

      // Nội dung
      const paragraphs = ch.content.split('\n').filter(p => p.trim());
      paragraphs.forEach(paragraph => {
        doc.fontSize(10).font('Helvetica')
          .fillColor('#222')
          .text(paragraph.trim(), {
            align: 'justify',
            indent: 20,
            lineGap: 4,
          });
        doc.moveDown(0.5);
      });
    });

    // ===== TRANG CUỐI =====
    doc.addPage();
    doc.moveDown(10);
    doc.fontSize(10).font('Helvetica')
      .fillColor('#999')
      .text('— HẾT —', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(8)
      .text('Tạo bởi Novel AI Studio', { align: 'center' });

    doc.end();

    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

// ====== TẠO MARKDOWN ======
function exportMarkdown(book, chapters) {
  let md = '';

  md += `# ${book.title}\n\n`;
  if (book.genre) md += `**Thể loại:** ${book.genre}\n\n`;
  if (book.synopsis) md += `> ${book.synopsis}\n\n`;
  md += `---\n\n`;
  md += `## Mục lục\n\n`;

  chapters.forEach(ch => {
    md += `- [Chương ${ch.chapter_number}: ${ch.title}](#chương-${ch.chapter_number})\n`;
  });

  md += `\n---\n\n`;

  chapters.forEach(ch => {
    md += `## Chương ${ch.chapter_number}: ${ch.title}\n\n`;
    const paragraphs = ch.content.split('\n').filter(p => p.trim());
    paragraphs.forEach(p => {
      md += `${p.trim()}\n\n`;
    });
    md += `---\n\n`;
  });

  md += `*Tạo bởi Novel AI Studio*\n`;
  return md;
}

module.exports = { exportTXT, exportEPUB, exportPDF, exportMarkdown };