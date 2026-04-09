import os

file_path = r'c:\Users\User\OneDrive\Documentos\GitHub\Portaldoalunoadm\src\app\pages\Treinamentos.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Fix mangled onBlur block (approx lines 1813-1822)
# We look for the start = new Date line and end = new Date line
new_lines = []
skip = 0
for i, line in enumerate(lines):
    if skip > 0:
        skip -= 1
        continue
    
    # Surgical removal of orphaned module labels (line 1696 was replaced, now 1697-1714 is orphaned)
    # 1697 was <Label ... 1714 was empty
    if 'Label className="flex items-center gap-1.5 text-xs"><Clock className="w-3.5 h-3.5" />Fim</Label>' in line and i > 1650 and i < 1750:
        # Scan forward to find the matching closing logic for the old module-level fields
        # This block usually ends around the start of "Aulas do Módulo"
        j = i
        while j < len(lines) and 'Aulas do Módulo' not in lines[j]:
            j += 1
        # Backtrack a bit to keep the div/headers
        skip = j - i - 3
        continue
    
    # Fix the mangled onBlur logic
    if 'const start = new Date(`${aula.data_aula}T${aula.hora_inicio}`);' in line and 'onBlur' not in lines[i-1]:
        # We found the mangled logic. We need to wrap it.
        # Find where it ends
        j = i
        while j < len(lines) and '}}' not in lines[j]:
            j += 1
        
        # We replace the whole block with the correct onBlur
        correct_onblur = [
            '                                         onBlur={() => {\n',
            '                                            const start = new Date(`${aula.data_aula}T${aula.hora_inicio}`);\n',
            '                                            const end = new Date(`${aula.data_aula}T${aula.hora_fim}`);\n',
            '                                            if (end <= start) {\n',
            '                                                const m = [...trainingModules];\n',
            '                                                const aulas = [...m[index].aulas];\n',
            '                                                const [h, min_val] = aula.hora_inicio.split(":").map(Number);\n',
            '                                                aulas[pi].hora_fim = `${String((h+1)%24).padStart(2, \'0\')}:${String(min_val).padStart(2, \'0\')}`;\n',
            '                                                m[index].aulas = aulas;\n',
            '                                                setTrainingModules(m);\n',
            '                                            }\n',
            '                                         }}\n'
        ]
        new_lines.extend(correct_onblur)
        skip = j - i
        continue
    
    new_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)

print("File fixed successfully")
