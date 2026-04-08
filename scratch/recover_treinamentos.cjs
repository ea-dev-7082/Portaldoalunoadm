const fs = require('fs');
const path = 'c:/Users/User/OneDrive/Documentos/GitHub/Portaldoalunoadm/src/app/pages/Treinamentos.tsx';
let content = fs.readFileSync(path, 'utf8');

// We need to restore the logic from around line 1600 to 1750
// I'll look for the beginning of the module content and replace the whole block.

const moduleContentRegex = /\{trainingModules\.map\(\(mod, index\) => \([\s\S]+?<\/TabsContent>\s+\)\)\}/;

// But that might match too much. Let's be more specific.
// Finding the part inside the Card where the inputs are.

const internalBlockRegex = /<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">[\s\S]+?Seção de Aulas/;

// Actually, I'll just rewrite the whole component return if I have to, but that's risky.
// I'll try to find the malformed part around 1619-1630.

const malformedPart = `                                   onChange={(e) => {
                                     const m = [...trainingModules];
                                     m[index] = { ...m[index], hora_fim: e.target.value };
                                     setTrainingModules(m);
                                     setIsTrainingDirty(true);
                                 <Label className="text-base font-semibold">Aulas do Módulo</Label>`;

// Restoration:
const fixedPart = `                                   onChange={(e) => {
                                     const m = [...trainingModules];
                                     m[index] = { ...m[index], hora_fim: e.target.value };
                                     setTrainingModules(m);
                                     setIsTrainingDirty(true);
                                   }}
                                 />
                               </div>
                             </div>
                           )}

                           {/* Seção de Aulas */}
                           <div className="border-t pt-4 space-y-3">
                             <div className="flex items-center justify-between">
                               <div>
                                 <Label className="text-base font-semibold">Aulas do Módulo</Label>`;

const newContent = content.replace(malformedPart, fixedPart);

if (content !== newContent) {
    fs.writeFileSync(path, newContent, 'utf8');
    console.log("File recovered and fixed successfully!");
} else {
    console.log("Could not find the malformed part exactly.");
}
