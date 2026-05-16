const fs = require('fs');
const html = fs.readFileSync('public/jogos.html', 'utf8');

const paragraphs = [];
const regex = /<p[^>]*>(.*?)<\/p>/gs;
let match;
while ((match = regex.exec(html)) !== null) {
  let text = match[1].replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim();
  if (text.length > 0) paragraphs.push(text);
}

// Write the extracted text to a temp file to read
fs.writeFileSync('public/extracted_text.txt', paragraphs.join('\n'));
console.log('Done extracting.');
