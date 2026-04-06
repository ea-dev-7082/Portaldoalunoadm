import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Users, Building2, Maximize2, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, AlertCircle, Calendar } from "lucide-react";
import { Button } from "../components/ui/button";
import { SearchInput } from "../components/ui/search-input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { TrainingCarousel } from "../components/TrainingCarousel";
import { MultiSelectFilter } from "../components/MultiSelectFilter";
export function Dashboard() {
  const [allTrainingsOpen, setAllTrainingsOpen] = useState(false);
  const [trainingView, setTrainingView] = useState<"treinamento" | "modulo">("treinamento");
  const [studentFilter, setStudentFilter] = useState<"todos" | "pagantes" | "filiados" | "cortesia">("todos");
  const [partnershipType, setPartnershipType] = useState<"programa" | "rede">("programa");
  const [currentTrainingIndex, setCurrentTrainingIndex] = useState(0);
  const [partnershipsOpen, setPartnershipsOpen] = useState(false);
  const [companiesWithoutStudentsOpen, setCompaniesWithoutStudentsOpen] = useState(false);
  const [studentsModalOpen, setStudentsModalOpen] = useState(false);

  const [allTrainingsSearch, setAllTrainingsSearch] = useState("");
  const [partnershipSearch, setPartnershipSearch] = useState("");
  const [companiesSearch, setCompaniesSearch] = useState("");
  const [enrolledStudentsSearch, setEnrolledStudentsSearch] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const [futureTrainings, setFutureTrainings] = useState<any[]>([]);
  const [pastTrainings, setPastTrainings] = useState<any[]>([]);
  const [partnershipData, setPartnershipData] = useState<any>({ programa: { total: 0, empresas: [] }, rede: { total: 0, empresas: [] } });
  const [companiesWithoutStudents, setCompaniesWithoutStudents] = useState<any[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
  const [futureModules, setFutureModules] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        // Fetch future trainings (date >= now)
        const { data: future } = await supabase
          .from('treinamento')
          .select('*')
          .or(`data_inicio.gte.${new Date().toISOString()},status.eq.Em andamento`)
          .order('data_inicio', { ascending: true });
        
        const mappedFuture = (future || []).map(t => ({
          title: t.nome,
          status: t.status || (new Date(t.data_inicio) <= new Date() ? "Em andamento" : "Agendado"),
          date: t.data_inicio ? new Date(t.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : "Data não definida",
          time: t.data_inicio ? new Date(t.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "--:--",
          participants: 0,
          progress: t.status === "Em andamento" ? 50 : 0
        }));
        setFutureTrainings(mappedFuture);

        // Fetch past trainings (date < now and not in progress)
        const { data: past } = await supabase
          .from('treinamento')
          .select('*')
          .lt('data_inicio', new Date().toISOString())
          .neq('status', 'Em andamento')
          .order('data_inicio', { ascending: false });
          
        const mappedPast = (past || []).map(t => ({
          title: t.nome,
          status: t.status || "Concluído",
          date: t.data_inicio ? new Date(t.data_inicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : "N/A",
          time: t.data_inicio ? new Date(t.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : "--:--",
          participants: 0,
          completed: true
        }));
        setPastTrainings(mappedPast);

        // Fetch company counts for partnerships
        const { data: companies } = await supabase.from('empresa').select('id_empresa, nome');
        
        // Count students per company to make partnership data real
        const { data: studentCounts } = await supabase.from('aluno').select('id_empresa');
        const countMap: Record<string, number> = {};
        (studentCounts || []).forEach(s => {
          if (s.id_empresa) countMap[s.id_empresa] = (countMap[s.id_empresa] || 0) + 1;
        });

        setPartnershipData({
          programa: { 
            total: companies?.length || 0, 
            empresas: companies?.map(c => ({ 
              nome: c.nome, 
              alunos: countMap[c.id_empresa] || 0 
            })) || [] 
          },
          rede: { total: 0, empresas: [] }
        });

        // Companies without students
        const uniqueEmpIdsInStudents = new Set(Object.keys(countMap));
        const without = companies?.filter(c => !uniqueEmpIdsInStudents.has(c.id_empresa)) || [];
        setCompaniesWithoutStudents(without.map(c => ({ nome: c.nome, treinamentos: [] })));

        // Enrolled students (real list)
        const { data: students } = await supabase
          .from('aluno')
          .select('nome, cargo, id_empresa, empresa(nome)')
          .order('data_cadastro', { ascending: false })
          .limit(10);

        setEnrolledStudents(students?.map(s => ({ 
          nome: s.nome, 
          empresa: (s.empresa as any)?.nome || 'Independente', 
          status: 'Ativo', 
          nota: 0 
        })) || []);

      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const [sortPartnerships, setSortPartnerships] = useState<{key: string, direction: "asc" | "desc"}>({ key: "alunos", direction: "desc" });
  const [sortCompanies, setSortCompanies] = useState<{key: string, direction: "asc" | "desc"}>({ key: "nome", direction: "asc" });
  const [sortStudents, setSortStudents] = useState<{key: string, direction: "asc" | "desc"}>({ key: "nome", direction: "asc" });

  const getSortIcon = (config: any, key: string) => {
    if (config.key !== key) return <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground inline" />;
    return config.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1 text-blue-600 dark:text-blue-400 inline" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 text-blue-600 dark:text-blue-400 inline" />
    );
  };

  const handleSort = (setter: any, currentConfig: any, key: string) => {
    setter({ key, direction: currentConfig.key === key && currentConfig.direction === "asc" ? "desc" : "asc" });
  };

  const genericSort = (array: any[], config: any) => {
    return [...array].sort((a, b) => {
      const aVal = (a as any)[config.key];
      const bVal = (b as any)[config.key];
      if (aVal < bVal) return config.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return config.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const filteredPartnerships = genericSort(
    (partnershipData[partnershipType]?.empresas || []).filter(emp => 
      emp.nome.toLowerCase().includes(partnershipSearch.toLowerCase())
    ),
    sortPartnerships
  );
  
  const sortedCompaniesWithoutStudents = genericSort(
    (companiesWithoutStudents || []).filter(c => c.nome.toLowerCase().includes(companiesSearch.toLowerCase())),
    sortCompanies
  );
  
  const sortedEnrolledStudents = genericSort(
    (enrolledStudents || []).filter(s => {
      const matchesSearch = s.nome.toLowerCase().includes(enrolledStudentsSearch.toLowerCase()) ||
                           s.empresa.toLowerCase().includes(enrolledStudentsSearch.toLowerCase());
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(s.status);
      return matchesSearch && matchesStatus;
    }), 
    sortStudents
  );

  const filteredAllFutureTrainings = futureTrainings.filter(t => (t.title || "").toLowerCase().includes(allTrainingsSearch.toLowerCase()));
  const filteredAllPastTrainings = pastTrainings.filter(t => (t.title || "").toLowerCase().includes(allTrainingsSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema de treinamentos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Visualização:</Label>
              <RadioGroup value={trainingView} onValueChange={(v) => setTrainingView(v as any)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="treinamento" id="view-treinamento" />
                  <Label htmlFor="view-treinamento" className="cursor-pointer">Treinamento</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="modulo" id="view-modulo" />
                  <Label htmlFor="view-modulo" className="cursor-pointer">Módulo</Label>
                </div>
              </RadioGroup>
            </div>
          </Card>

          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {trainingView === "treinamento" ? "Agenda de Treinamentos" : "Próximo Módulo"}
                </h2>
                {trainingView === "treinamento" && (
                  <Button variant="ghost" size="sm" onClick={() => setAllTrainingsOpen(true)}>
                    Ver cronograma
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
              
              <div className="min-h-[320px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground italic">Carregando agenda...</div>
                ) : trainingView === "treinamento" ? (
                  futureTrainings.length > 0 ? (
                    <TrainingCarousel 
                      trainings={futureTrainings.map(t => ({ ...t, title: t.nome || t.title }))} 
                      type="future" 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg text-muted-foreground opacity-60 italic">
                      Nenhum treinamento agendado.
                    </div>
                  )
                ) : (
                  futureModules.length > 0 ? (
                    <Card className="shadow-lg border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 overflow-hidden relative group">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-blue-600">Mais recente</Badge>
                        </div>
                        <CardTitle className="text-2xl font-bold">{futureModules[0].title}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Data e Horário</p>
                            <p className="font-medium">{futureModules[0].date} • {futureModules[0].time}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-muted-foreground">Local</p>
                            <p className="font-medium text-blue-700 dark:text-blue-300">
                              {futureModules[0].location || "Link enviado por e-mail"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Calendar className="w-24 h-24 rotate-12" />
                      </div>
                    </Card>
                  ) : (
                    <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg text-muted-foreground opacity-60 italic">
                      Nenhum módulo agendado para o momento.
                    </div>
                  )
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Treinamentos Fechados</h2>
              <div className="min-h-[280px]">
                {isLoading ? (
                  <div className="flex items-center justify-center h-48 text-muted-foreground italic">Carregando histórico...</div>
                ) : pastTrainings.length > 0 ? (
                  <TrainingCarousel trainings={pastTrainings.map(t => ({ ...t, title: t.nome || t.title }))} type="past" />
                ) : (
                  <div className="flex items-center justify-center h-48 border-2 border-dashed rounded-lg text-muted-foreground opacity-60 italic">
                    Nenhum treinamento finalizado.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Métricas e KPIs</h2>
          </div>
          
          <div className="space-y-4">
            <Card 
              className="hover:shadow-lg transition-all cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 relative overflow-hidden group"
              onClick={() => setStudentsModalOpen(true)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Alunos</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{isLoading ? "..." : (enrolledStudents.length || 0)}</div>
                    <p className="text-xs text-muted-foreground">
                      Alunos cadastrados recentemente
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-20 group-hover:opacity-50 transition-opacity" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-all cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 relative overflow-hidden group"
              onClick={() => setPartnershipsOpen(true)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Parcerias</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{isLoading ? "..." : (partnershipData[partnershipType]?.total || 0)}</div>
                    <p className="text-xs text-muted-foreground">Empresas parceiras ativas</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-20 group-hover:opacity-50 transition-opacity" />
                </div>
              </CardContent>
            </Card>

            <Card 
              className="hover:shadow-lg transition-all cursor-pointer hover:border-blue-400 dark:hover:border-blue-600 relative overflow-hidden group border-destructive/20"
              onClick={() => setCompaniesWithoutStudentsOpen(true)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-destructive dark:text-red-400">
                  Alunos não cadastrados
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive dark:text-red-400" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-destructive dark:text-red-400">{companiesWithoutStudents.length}</div>
                    <p className="text-xs text-muted-foreground">Requer atenção imediata</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-20 group-hover:opacity-50 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={allTrainingsOpen} onOpenChange={setAllTrainingsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Todos os Treinamentos</DialogTitle>
            <DialogDescription>
              Visualização completa de todos os treinamentos futuros e passados
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <SearchInput
              placeholder="Buscar por nome do treinamento..."
              value={allTrainingsSearch}
              onChange={(e) => setAllTrainingsSearch(e.target.value)}
            />
            <div>
              <h3 className="font-semibold text-lg mb-3">Treinamentos Futuros</h3>
              <div className="space-y-3">
                {filteredAllFutureTrainings.map((training, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{training.title}</h4>
                            {training.status && (
                              <Badge className={training.status === "Em andamento" ? "bg-green-500" : "bg-blue-500"}>
                                {training.status}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{training.date} • {training.time}</p>
                        </div>
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {training.participants}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Treinamentos Fechados</h3>
              <div className="space-y-3">
                {filteredAllPastTrainings.map((training, index) => (
                  <Card key={index} className="bg-muted">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium">{training.title}</h4>
                            <Badge variant="secondary">Concluído</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{training.date} • {training.time}</p>
                        </div>
                        <Badge variant="outline">
                          <Users className="w-3 h-3 mr-1" />
                          {training.participants}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={partnershipsOpen} onOpenChange={setPartnershipsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {partnershipType === "programa" ? "Programa Aluno Formação" : "Rede Ancora"}
            </DialogTitle>
            <DialogDescription>
              Empresas participantes da parceria
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <SearchInput
              placeholder="Buscar por empresa, região ou grupo..."
              value={partnershipSearch}
              onChange={(e) => setPartnershipSearch(e.target.value)}
            />
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort(setSortPartnerships, sortPartnerships, "nome")}>
                      <div className="flex items-center">Empresa {getSortIcon(sortPartnerships, "nome")}</div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort(setSortPartnerships, sortPartnerships, "alunos")}>
                      <div className="flex items-center justify-end">Alunos Ativos {getSortIcon(sortPartnerships, "alunos")}</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartnerships.length > 0 ? (
                    filteredPartnerships.map((empresa, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{empresa.nome}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline">{empresa.alunos}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                        Nenhuma empresa encontrada na busca.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={companiesWithoutStudentsOpen} onOpenChange={setCompaniesWithoutStudentsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Empresas sem Alunos</DialogTitle>
            <DialogDescription>
              Lista de empresas cadastradas que não possuem alunos matriculados no momento
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <SearchInput
              placeholder="Buscar empresas sem alunos..."
              value={companiesSearch}
              onChange={(e) => setCompaniesSearch(e.target.value)}
            />
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort(setSortCompanies, sortCompanies, "nome")}>
                      <div className="flex items-center">Empresa {getSortIcon(sortCompanies, "nome")}</div>
                    </TableHead>
                    <TableHead>Treinamentos Cadastrados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCompaniesWithoutStudents.length > 0 ? (
                    sortedCompaniesWithoutStudents.map((company, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{company.nome}</TableCell>
                        <TableCell>
                          {company.treinamentos.length === 0 ? (
                            <span className="text-sm text-muted-foreground italic">Nenhum treinamento</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {(company.treinamentos as string[]).map((t: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                        Nenhuma empresa encontrada.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={studentsModalOpen} onOpenChange={setStudentsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lista Completa de Alunos</DialogTitle>
            <DialogDescription>
              Acompanhamento e situação dos alunos inscritos no treinamento.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <SearchInput
              placeholder="Buscar por nome ou empresa..."
              value={enrolledStudentsSearch}
              onChange={(e) => setEnrolledStudentsSearch(e.target.value)}
            />
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort(setSortStudents, sortStudents, "nome")}>
                      <div className="flex items-center">Nome do Aluno {getSortIcon(sortStudents, "nome")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort(setSortStudents, sortStudents, "empresa")}>
                      <div className="flex items-center">Empresa {getSortIcon(sortStudents, "empresa")}</div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-1">
                        <MultiSelectFilter
                          label="Status"
                          options={["Concluído", "Em andamento", "Ausente"]}
                          selectedValues={selectedStatuses}
                          onSelect={setSelectedStatuses}
                        />
                        <span onClick={() => handleSort(setSortStudents, sortStudents, "status")}>
                          {getSortIcon(sortStudents, "status")}
                        </span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort(setSortStudents, sortStudents, "nota")}>
                      <div className="flex items-center justify-end">Nota {getSortIcon(sortStudents, "nota")}</div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedEnrolledStudents.length > 0 ? (
                    sortedEnrolledStudents.map((aluno, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{aluno.nome}</TableCell>
                        <TableCell><Badge variant="outline">{aluno.empresa}</Badge></TableCell>
                        <TableCell>
                          <Badge className={
                            aluno.status === "Concluído" ? "bg-green-500 hover:bg-green-600 outline-none" : 
                            aluno.status === "Ausente" ? "bg-red-500 hover:bg-red-600 outline-none" : "bg-blue-500 hover:bg-blue-600 outline-none"
                          }>
                            {aluno.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{aluno.nota.toFixed(1)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        Nenhum aluno encontrado na busca.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
