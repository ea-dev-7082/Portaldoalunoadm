const fs = require('fs');
const path = 'c:/Users/User/OneDrive/Documentos/GitHub/Portaldoalunoadm/src/app/pages/Treinamentos.tsx';
let content = fs.readFileSync(path, 'utf8');

// The corrupted block at 1698
const badPart = `                                    <div className="flex-1 min-w-[120px] space-y-1">
                                              onChange={(e) => {
                                           const m = [...trainingModules];
                                           const aulas = [...m[index].aulas];
                                           aulas[pi] = { ...aulas[pi], hora_inicio: e.target.value };
                                           m[index] = { ...m[index], aulas };
                                           setTrainingModules(m);
                                           setIsTrainingDirty(true);
                                         }}
                                         className="h-8 text-sm"
                                       />
                                     </div>`;

// There might be variations in whitespace. Let's use a regex-based replacement for that part.
// Search for the div, followed by an incorrectly placed onChange.
const regex = /<div className="flex-1 min-w-\[120px\] space-y-1">\s+onChange=\{\(e\) => \{\s+const m = \[\.\.\.trainingModules\];[\s\S]+?setIsTrainingDirty\(true\);\s+\}\}\s+className="h-8 text-sm"\s+\/>\s+<\/div>/;

const correctPart = `                                    <div className="flex-1 min-w-[120px] space-y-1">
                                      <Label className="text-xs">Início</Label>
                                      <Input
                                        type="time"
                                        value={aula.hora_inicio}
                                        onChange={(e) => {
                                          const m = [...trainingModules];
                                          const aulas = [...m[index].aulas];
                                          aulas[pi] = { ...aulas[pi], hora_inicio: e.target.value };
                                          m[index] = { ...m[index], aulas };
                                          setTrainingModules(m);
                                          setIsTrainingDirty(true);
                                        }}
                                        className="h-8 text-sm"
                                      />
                                    </div>`;

const newContent = content.replace(regex, correctPart);

if (content !== newContent) {
    fs.writeFileSync(path, newContent, 'utf8');
    console.log("File fixed successfully!");
} else {
    console.log("Could not find the target part using regex.");
}
