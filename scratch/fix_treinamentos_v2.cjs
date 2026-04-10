const fs = require('fs');

const filePath = 'c:\\Users\\User\\OneDrive\\Documentos\\GitHub\\Portaldoalunoadm\\src\\app\\pages\\Treinamentos.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Clean up ALL escaped quotes
content = content.replace(/\\\"/g, '"');

// 2. Fix the structural mess in the footer
// We'll look for the duplicated footer block and remove it.
// The mess starts around: trainingId); } catch (err: any) { toast.error(err.message); } } }} > <UserCheck className="w-4 h-4" /> Teste Extra </Button>
// Actually, let's just use a large block replacement for the whole modal to be safe.

const modalStart = '<Dialog open={moduleDetailOpen}';
const modalEnd = '{/* ══════════ TEST EDITOR OVERLAY ══════════ */}';

const startIndex = content.indexOf(modalStart);
const endIndex = content.indexOf(modalEnd);

if (startIndex !== -1 && endIndex !== -1) {
    const head = content.substring(0, startIndex);
    const tail = content.substring(endIndex);
    
    const newModalContent = `
      <Dialog open={moduleDetailOpen} onOpenChange={setModuleDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white relative">
            <div className="relative z-10 space-y-2">
              <div className="flex items-center gap-2 text-blue-100/80 text-xs font-bold uppercase tracking-[0.2em]">
                <BookOpen className="w-4 h-4" />
                Detalhes do Módulo
              </div>
              <DialogTitle className="text-3xl font-black tracking-tight leading-tight">
                {selectedModule && moduloLabel(
                  ((selectedModule.ordem ?? 1) - 1),
                  selectedModule.modulo?.nome || selectedModule.nome
                )}
              </DialogTitle>
              <DialogDescription className="text-blue-100/70 text-base max-w-md">
                Acompanhe o cronograma de aulas e gerencie o teste de conhecimento deste módulo.
              </DialogDescription>
            </div>
            {/* Abstract BG Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-background">
            {selectedModule && (() => {
              const aulas = (selectedModule.modulo?.aulas || selectedModule.aulas || [])
                .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));

              return (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-900 border rounded-2xl p-5 transition-all hover:border-blue-200 dark:hover:border-blue-900 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Início</span>
                      </div>
                      <p className="text-lg font-bold">
                        {aulas[0]?.data_aula ? new Date(aulas[0].data_aula + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Não definida'}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 border rounded-2xl p-5 transition-all hover:border-indigo-200 dark:hover:border-indigo-900 shadow-sm">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600">
                          <CheckCircle2 className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Término</span>
                      </div>
                      <p className="text-lg font-bold">
                        {aulas[aulas.length-1]?.data_aula ? new Date(aulas[aulas.length-1].data_aula + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Não definida'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex items-center gap-2 px-2">
                        <Clock className="w-3.5 h-3.5" />
                        Cronograma de Aulas
                    </h4>
                    {aulas.length > 0 ? (
                      <div className="grid gap-3">
                        {aulas.map((aula: any, i: number) => {
                          const dataObj = aula.data_aula ? new Date(aula.data_aula + 'T12:00:00') : null;
                          const dataFormatada = dataObj ? dataObj.toLocaleDateString('pt-BR') : 'Sem data';

                          return (
                            <div key={aula.id_parte || i} className="group flex items-center gap-4 bg-background border rounded-2xl p-4 transition-all hover:shadow-md hover:border-blue-100 dark:hover:border-blue-900">
                              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-black shrink-0 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-bold text-foreground block">Aula {toRoman(i + 1)}</span>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1.5">
                                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                                    {dataFormatada}
                                  </span>
                                  {aula.hora_inicio && (
                                    <span className="flex items-center gap-1.5">
                                      <Clock className="w-3.5 h-3.5 opacity-60" />
                                      {aula.hora_inicio?.slice(0, 5)} — {aula.hora_fim?.slice(0, 5) || '??:??'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-sm text-muted-foreground italic">
                        Nenhuma aula cadastrada para este módulo.
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t flex flex-col gap-3">
            {(() => {
              const testData = selectedModule?.teste || selectedModule?.modulo?.teste;
              const testInfo = Array.isArray(testData) ? testData[0] : testData;
              return (
                <div className="flex flex-col gap-3">
                  <Button
                    className="w-full h-12 gap-2 text-base font-bold bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-xl shadow-violet-500/20 active:scale-[0.98] transition-all rounded-2xl"
                    onClick={() => handleOpenTesteEditor(selectedModule)}
                  >
                    <ClipboardList className="w-5 h-5" />
                    Editar Teste de Conhecimento
                  </Button>
                  
                  {testInfo && (
                    <Button
                      variant="outline"
                      className="w-full h-11 gap-2 text-sm font-bold border-2 border-violet-100 hover:bg-violet-50 hover:text-violet-700 dark:border-violet-900 rounded-xl transition-all"
                      onClick={() => {
                        const trainingId = selectedModuleTraining?.id_treinamento || selectedModuleTraining?.id;
                        handleOpenTesteExtra(testInfo.id_teste, trainingId || "");
                      }}
                    >
                      <Users className="w-5 h-5" />
                      Gerenciar Alunos do Teste Extra
                    </Button>
                  )}
                </div>
              );
            })()}
            <div className="flex gap-3 mt-1">
              <Button
                variant="outline"
                className="flex-1 h-11 gap-2 text-sm font-bold border-2 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
                onClick={async () => {
                   try {
                    const headers = await getAuthHeader();
                    const res = await fetch(\`https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud?view=teste&id_modulo=\${selectedModule.id_modulo}\`, { headers });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error || "Teste não encontrado.");
                    const url = \`\${window.location.origin}/teste/\${data.id_teste}?extra=true\`;
                    await navigator.clipboard.writeText(url);
                    toast.success("Link especial de Teste Extra copiado!");
                  } catch (err) { toast.error(err.message); }
                }}
              >
                <Link2 className="w-4 h-4" />
                Copiar Link
              </Button>

              <Button
                variant="outline"
                className="flex-1 h-11 gap-2 text-sm font-bold border-2"
                onClick={() => setModuleDetailOpen(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
`;
    content = head + newModalContent + tail;
    fs.writeFileSync(filePath, content);
    console.log('Successfully cleaned up modal and escaped quotes in Treinamentos.tsx');
} else {
    console.error('Could not find modal markers:', { startIndex, endIndex });
}
