import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Users, TrendingUp, Building2, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../components/ui/dialog";
import { TrainingCarousel } from "../components/TrainingCarousel";

export function Dashboard() {
  const [allTrainingsOpen, setAllTrainingsOpen] = useState(false);

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
    },
    {
      title: "Gestão de Estoque",
      status: "Agendado",
      date: "5 de Abril, 2026",
      time: "09:00 - 13:00",
      participants: 32,
    },
    {
      title: "Atendimento ao Cliente",
      status: "Agendado",
      date: "8 de Abril, 2026",
      time: "14:00 - 17:00",
      participants: 28,
    },
    {
      title: "Logística e Distribuição",
      status: "Agendado",
      date: "12 de Abril, 2026",
      time: "10:00 - 14:00",
      participants: 38,
    },
  ];

  const pastTrainings = [
    {
      title: "Vendas Técnicas - Módulo 2",
      date: "28 de Março, 2026",
      time: "14:00 - 18:00",
      participants: 42,
      completed: true,
    },
    {
      title: "Gestão de Qualidade",
      date: "25 de Março, 2026",
      time: "09:00 - 13:00",
      participants: 35,
      completed: true,
    },
    {
      title: "Marketing Digital",
      date: "20 de Março, 2026",
      time: "14:00 - 17:00",
      participants: 30,
      completed: true,
    },
  ];

  // Mock data for metrics
  const metrics = {
    totalStudents: 247,
    payingStudents: 189,
    programParticipants: 156,
    companiesWithoutStudents: 8,
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
          {/* Future Trainings Carousel */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Treinamentos Futuros</h2>
              <Button variant="outline" size="sm" onClick={() => setAllTrainingsOpen(true)}>
                Ver Todos
              </Button>
            </div>
            <TrainingCarousel trainings={futureTrainings} type="future" />
          </div>

          {/* Past Trainings Carousel */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">Treinamentos Fechados</h2>
            <TrainingCarousel trainings={pastTrainings} type="past" />
          </div>
        </div>

        {/* Right Column - Metrics Grid */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Métricas e KPIs</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {/* Card 1: Total de Alunos Inscritos */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Alunos Inscritos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-foreground">{metrics.totalStudents}</div>
                    <p className="text-xs text-muted-foreground mt-1">+12% este mês</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Alunos Pagantes */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Alunos Pagantes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-foreground">{metrics.payingStudents}</div>
                    <p className="text-xs text-muted-foreground mt-1">76% do total</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-300" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 3: Programa Aluno Formação */}
            <Card className="hover:shadow-lg transition-shadow col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Programa Aluno Formação
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">{metrics.programParticipants}</span>
                    <span className="text-sm text-muted-foreground">participantes ativos</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Módulo Básico</span>
                      <span className="font-medium text-foreground">89 alunos</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-blue-600 h-2 rounded-full" style={{ width: "57%" }} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Módulo Avançado</span>
                      <span className="font-medium text-foreground">67 alunos</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="bg-purple-600 h-2 rounded-full" style={{ width: "43%" }} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card 4: Empresas sem alunos */}
            <Card className="hover:shadow-lg transition-shadow col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Empresas sem alunos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold text-red-600">{metrics.companiesWithoutStudents}</div>
                    <p className="text-xs text-muted-foreground mt-1">Requer atenção</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-red-600 dark:text-red-300" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Company Button */}
          <div className="mt-6">
            <Button className="w-full gap-2" size="lg">
              <Plus className="w-5 h-5" />
              Adicionar Empresa
            </Button>
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
    </div>
  );
}