import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Users, Building2, Maximize2, ChevronRight } from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { TrainingCarousel } from "../components/TrainingCarousel";

export function Dashboard() {
  const [allTrainingsOpen, setAllTrainingsOpen] = useState(false);
  const [trainingView, setTrainingView] = useState<"treinamento" | "modulo">("treinamento");
  const [studentFilter, setStudentFilter] = useState<"todos" | "pagantes" | "filiados" | "cortesia">("todos");
  const [partnershipType, setPartnershipType] = useState<"programa" | "rede">("programa");
  const [currentTrainingIndex, setCurrentTrainingIndex] = useState(0);
  const [partnershipsOpen, setPartnershipsOpen] = useState(false);
  const [companiesWithoutStudentsOpen, setCompaniesWithoutStudentsOpen] = useState(false);

  // Mock data for current and upcoming trainings
  const futureTrainings = [
    {
      title: "Eu Sou Financeiro - Módulo 1",
      status: "Em andamento",
      date: "31 de Março, 2026",
      time: "14:00 - 18:00",
      location: "Sala Virtual A",
      companies: ["AutoBrasil SA", "Peças Plus", "Moto Parts"],
      participants: 45,
      progress: 60,
      students: { todos: 45, pagantes: 38, filiados: 32, cortesia: 7 },
    },
    {
      title: "Gestão de Estoque",
      status: "Agendado",
      date: "5 de Abril, 2026",
      time: "09:00 - 13:00",
      participants: 32,
      students: { todos: 32, pagantes: 25, filiados: 20, cortesia: 7 },
    },
    {
      title: "Atendimento ao Cliente",
      status: "Agendado",
      date: "8 de Abril, 2026",
      time: "14:00 - 17:00",
      participants: 28,
      students: { todos: 28, pagantes: 22, filiados: 18, cortesia: 6 },
    },
    {
      title: "Logística e Distribuição",
      status: "Agendado",
      date: "12 de Abril, 2026",
      time: "10:00 - 14:00",
      participants: 38,
      students: { todos: 38, pagantes: 30, filiados: 25, cortesia: 8 },
    },
  ];

  const pastTrainings = [
    {
      title: "Vendas Técnicas - Módulo 2",
      date: "28 de Março, 2026",
      time: "14:00 - 18:00",
      participants: 42,
      completed: true,
      students: { todos: 42, pagantes: 35, filiados: 28, cortesia: 7 },
    },
    {
      title: "Gestão de Qualidade",
      date: "25 de Março, 2026",
      time: "09:00 - 13:00",
      participants: 35,
      completed: true,
      students: { todos: 35, pagantes: 28, filiados: 23, cortesia: 7 },
    },
    {
      title: "Marketing Digital",
      date: "20 de Março, 2026",
      time: "14:00 - 17:00",
      participants: 30,
      completed: true,
      students: { todos: 30, pagantes: 24, filiados: 20, cortesia: 6 },
    },
  ];

  // Mock partnership data
  const partnershipData = {
    programa: {
      total: 156,
      empresas: [
        { nome: "AutoBrasil SA", alunos: 45 },
        { nome: "Peças Plus Ltda", alunos: 32 },
        { nome: "Moto Parts Express", alunos: 38 },
        { nome: "TurboPeças Nacional", alunos: 41 },
      ],
    },
    rede: {
      total: 89,
      empresas: [
        { nome: "AutoServ Comercial", alunos: 28 },
        { nome: "Express Auto", alunos: 35 },
        { nome: "Distribuidora Nacional", alunos: 26 },
      ],
    },
  };

  // Mock companies without students
  const companiesWithoutStudents = [
    { nome: "Peças & Cia", treinamentos: ["Gestão de Estoque", "Vendas Técnicas"] },
    { nome: "Auto Parts Express", treinamentos: ["Atendimento ao Cliente"] },
    { nome: "Moto Peças Ltda", treinamentos: [] },
    { nome: "TurboMax Distribuidora", treinamentos: ["Logística e Distribuição"] },
    { nome: "AutoService Pro", treinamentos: ["Eu Sou Financeiro"] },
    { nome: "Nacional Autopeças", treinamentos: [] },
    { nome: "Speed Parts", treinamentos: ["Marketing Digital"] },
    { nome: "Premium Auto", treinamentos: [] },
  ];

  // Get student count based on current filter and training
  const getCurrentStudentCount = () => {
    const training = futureTrainings[currentTrainingIndex];
    if (!training || !training.students) return 0;
    return training.students[studentFilter];
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do sistema de treinamentos</p>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Training Schedule */}
        <div className="space-y-6">
          {/* View Toggle */}
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

          {/* Future Trainings Carousel */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Treinamentos Futuros</h2>
              <Button variant="outline" size="sm" onClick={() => setAllTrainingsOpen(true)}>
                Ver Todos
              </Button>
            </div>
            <div className="min-h-[280px]">
              <TrainingCarousel 
                trainings={futureTrainings} 
                type="future" 
                onSlideChange={(index) => setCurrentTrainingIndex(index)}
              />
            </div>
          </div>

          {/* Past Trainings Carousel */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Treinamentos Fechados</h2>
            <div className="min-h-[280px]">
              <TrainingCarousel trainings={pastTrainings} type="past" />
            </div>
          </div>
        </div>

        {/* Right Column - Metrics Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Métricas e KPIs</h2>
          </div>
          <div className="space-y-4">
            {/* Unified Students Card with Filter */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Alunos
                  </CardTitle>
                  <RadioGroup 
                    value={studentFilter} 
                    onValueChange={(v) => setStudentFilter(v as any)} 
                    className="flex gap-2"
                  >
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="todos" id="filter-todos" className="w-3 h-3" />
                      <Label htmlFor="filter-todos" className="cursor-pointer text-xs">Todos</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="pagantes" id="filter-pagantes" className="w-3 h-3" />
                      <Label htmlFor="filter-pagantes" className="cursor-pointer text-xs">Pagantes</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="filiados" id="filter-filiados" className="w-3 h-3" />
                      <Label htmlFor="filter-filiados" className="cursor-pointer text-xs">Filiados</Label>
                    </div>
                    <div className="flex items-center space-x-1">
                      <RadioGroupItem value="cortesia" id="filter-cortesia" className="w-3 h-3" />
                      <Label htmlFor="filter-cortesia" className="cursor-pointer text-xs">Cortesia</Label>
                    </div>
                  </RadioGroup>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-foreground">{getCurrentStudentCount()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {studentFilter === "todos" ? "Total de alunos" : 
                       studentFilter === "pagantes" ? "Alunos pagantes" :
                       studentFilter === "filiados" ? "Alunos filiados" : "Alunos cortesia"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Partnerships Card */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Parcerias
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => setPartnershipsOpen(true)}>
                    <Maximize2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <RadioGroup 
                    value={partnershipType} 
                    onValueChange={(v) => setPartnershipType(v as any)} 
                    className="flex gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="programa" id="partnership-programa" />
                      <Label htmlFor="partnership-programa" className="cursor-pointer text-xs">
                        Programa Aluno Formação
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="rede" id="partnership-rede" />
                      <Label htmlFor="partnership-rede" className="cursor-pointer text-xs">
                        Rede Ancora
                      </Label>
                    </div>
                  </RadioGroup>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">
                      {partnershipData[partnershipType].total}
                    </span>
                    <span className="text-sm text-muted-foreground">participantes ativos</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {partnershipData[partnershipType].empresas.length} empresas
                      </span>
                      <span className="font-medium text-foreground">
                        {partnershipData[partnershipType].empresas.reduce((sum, e) => sum + e.alunos, 0)} alunos
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${partnershipType === "programa" ? "bg-blue-600" : "bg-purple-600"}`}
                        style={{ width: `${(partnershipData[partnershipType].total / 250) * 100}%` }} 
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Companies without students - Clickable */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setCompaniesWithoutStudentsOpen(true)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Empresas sem alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-red-600">{companiesWithoutStudents.length}</div>
                    <p className="text-xs text-muted-foreground mt-1">Requer atenção</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-red-600 dark:text-red-300" />
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* All Trainings Modal */}
      <Dialog open={allTrainingsOpen} onOpenChange={setAllTrainingsOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Todos os Treinamentos</DialogTitle>
            <DialogDescription>
              Visualização completa de todos os treinamentos futuros e passados
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Future Trainings */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Treinamentos Futuros</h3>
              <div className="space-y-3">
                {futureTrainings.map((training, index) => (
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

            {/* Past Trainings */}
            <div>
              <h3 className="font-semibold text-lg mb-3">Treinamentos Fechados</h3>
              <div className="space-y-3">
                {pastTrainings.map((training, index) => (
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

      {/* Partnerships Modal */}
      <Dialog open={partnershipsOpen} onOpenChange={setPartnershipsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {partnershipType === "programa" ? "Programa Aluno Formação" : "Rede Ancora"}
            </DialogTitle>
            <DialogDescription>
              Empresas participantes da parceria
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="text-right">Alunos Ativos</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {partnershipData[partnershipType].empresas.map((empresa, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{empresa.nome}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline">{empresa.alunos}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* Companies Without Students Modal */}
      <Dialog open={companiesWithoutStudentsOpen} onOpenChange={setCompaniesWithoutStudentsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Empresas sem Alunos</DialogTitle>
            <DialogDescription>
              Lista de empresas cadastradas que não possuem alunos matriculados no momento
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Treinamentos Cadastrados</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companiesWithoutStudents.map((company, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{company.nome}</TableCell>
                    <TableCell>
                      {company.treinamentos.length === 0 ? (
                        <span className="text-sm text-muted-foreground italic">Nenhum treinamento</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {company.treinamentos.map((t, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {t}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
