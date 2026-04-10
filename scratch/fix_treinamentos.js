const fs = require('fs');
const path = require('path');

const filePath = 'c:\\Users\\User\\OneDrive\\Documentos\\GitHub\\Portaldoalunoadm\\src\\app\\pages\\Treinamentos.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace all \" with "
content = content.replace(/\\\"/g, '"');

// Fix the logic for testInfo.id_teste and training.id_treinamento in the map
// We look for handleOpenTesteExtra(testInfo.id_teste, training.id) and replace with training.id_treinamento
content = content.replace(/handleOpenTesteExtra\(testInfo\.id_teste, training\.id\)/g, 'handleOpenTesteExtra(testInfo.id_teste, training.id_treinamento)');

fs.writeFileSync(filePath, content);
console.log('Successfully cleaned up escaped quotes and fixed training property in Treinamentos.tsx');
