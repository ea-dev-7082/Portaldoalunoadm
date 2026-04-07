const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\User\\OneDrive\\Documentos\\GitHub\\Portaldoalunoadm\\src\\app\\pages\\Treinamentos.tsx', 'utf8');
const openDivs = (content.match(/<div/g) || []).length;
const closeDivs = (content.match(/<\/div>/g) || []).length;
console.log('Open divs:', openDivs);
console.log('Close divs:', closeDivs);

const openSpans = (content.match(/<span/g) || []).length;
const closeSpans = (content.match(/<\/span>/g) || []).length;
console.log('Open spans:', openSpans);
console.log('Close spans:', closeSpans);

const openButtons = (content.match(/<Button/g) || []).length;
const closeButtons = (content.match(/<\/Button>/g) || []).length;
console.log('Open buttons:', openButtons);
console.log('Close buttons:', closeButtons);

const openCards = (content.match(/<Card/g) || []).length;
const closeCards = (content.match(/<\/Card>/g) || []).length;
console.log('Open cards:', openCards);
console.log('Close cards:', closeCards);
