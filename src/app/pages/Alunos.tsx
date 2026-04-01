import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Search, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { ScrollArea } from "../components/ui/scroll-area";

interface Student {
  id: string;
  nome: string;
  cpf: string;
  empresa: string;
  telefone: string;
  email: string;
  dataNascimento: string;
  cargo: string;
  dataMatricula: string;
  // Módulo 1 data
  mod1Pontualidade: string;
  mod1Camera: string;
  mod1Participacao: string;
  mod1Nota: number;
  // Módulo 2 data
  mod2Pontualidade: string;
  mod2Camera: string;
  mod2Participacao: string;
  mod2Nota: number;
  mod2Media: number;
  treinamentoAtual: string;
  treinamentosConcluidos: string[];
}

export function Alunos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"simples" | "completa">("simples");

  // Mock data for students with complete info
  const students: Student[] = [
    {
      id: "1",
      nome: "Maria Silva Santos",
      cpf: "123.456.789-00",
      empresa: "AutoBrasil SA",
      telefone: "(11) 98765-4321",
      email: "maria.silva@autobrasil.com.br",
      dataNascimento: "15/03/1992",
      cargo: "Analista Financeiro",
      dataMatricula: "10/01/2026",
      mod1Pontualidade: "100%",
      mod1Camera: "Sim",
      mod1Participacao: "Alta",
      mod1Nota: 9.5,
      mod2Pontualidade: "100%",
      mod2Camera: "Sim",
      mod2Participacao: "Alta",
      mod2Nota: 9.0,
      mod2Media: 9.25,
      treinamentoAtual: "Gestão de Estoque",
      treinamentosConcluidos: ["Eu Sou Financeiro", "Liderança Básica"],
    },
    {
      id: "2",
      nome: "João Pedro Costa",
      cpf: "234.567.890-11",
      empresa: "Peças Plus Ltda",
      telefone: "(11) 97654-3210",
      email: "joao.costa@pecasplus.com.br",
      dataNascimento: "22/07/1988",
      cargo: "Gerente de Vendas",
      dataMatricula: "15/01/2026",
      mod1Pontualidade: "90%",
      mod1Camera: "Sim",
      mod1Participacao: "Média",
      mod1Nota: 8.0,
      mod2Pontualidade: "95%",
      mod2Camera: "Não",
      mod2Participacao: "Média",
      mod2Nota: 8.5,
      mod2Media: 8.25,
      treinamentoAtual: "Eu Sou Financeiro",
      treinamentosConcluidos: ["Liderança Básica"],
    },
    {
      id: "3",
      nome: "Ana Carolina Souza",
      cpf: "345.678.901-22",
      empresa: "Moto Parts Express",
      telefone: "(11) 96543-2109",
      email: "ana.souza@motoparts.com.br",
      dataNascimento: "08/11/1995",
      cargo: "Coordenadora RH",
      dataMatricula: "20/01/2026",
      mod1Pontualidade: "100%",
      mod1Camera: "Sim",
      mod1Participacao: "Alta",
      mod1Nota: 9.8,
      mod2Pontualidade: "100%",
      mod2Camera: "Sim",
      mod2Participacao: "Alta",
      mod2Nota: 9.5,
      mod2Media: 9.65,
      treinamentoAtual: "Atendimento ao Cliente",
      treinamentosConcluidos: ["Eu Sou Financeiro", "Gestão de Estoque"],
    },
    {
      id: "4",
      nome: "Carlos Eduardo Lima",
      cpf: "456.789.012-33",
      empresa: "AutoBrasil SA",
      telefone: "(11) 95432-1098",
      email: "carlos.lima@autobrasil.com.br",
      dataNascimento: "30/05/1990",
      cargo: "Assistente Administrativo",
      dataMatricula: "22/01/2026",
      mod1Pontualidade: "80%",
      mod1Camera: "Não",
      mod1Participacao: "Baixa",
      mod1Nota: 6.5,
      mod2Pontualidade: "85%",
      mod2Camera: "Sim",
      mod2Participacao: "Média",
      mod2Nota: 7.0,
      mod2Media: 6.75,
      treinamentoAtual: "Nenhum",
      treinamentosConcluidos: [],
    },
    {
      id: "5",
      nome: "Paula Fernanda Alves",
      cpf: "567.890.123-44",
      empresa: "TurboPeças Nacional",
      telefone: "(11) 94321-0987",
      email: "paula.alves@turbopecas.com.br",
      dataNascimento: "12/09/1993",
      cargo: "Diretora Comercial",
      dataMatricula: "25/01/2026",
      mod1Pontualidade: "100%",
      mod1Camera: "Sim",
      mod1Participacao: "Alta",
      mod1Nota: 10.0,
      mod2Pontualidade: "100%",
      mod2Camera: "Sim",
      mod2Participacao: "Alta",
      mod2Nota: 9.8,
      mod2Media: 9.9,
      treinamentoAtual: "Gestão de Estoque",
      treinamentosConcluidos: ["Eu Sou Financeiro", "Liderança Básica", "Gestão Avançada"],
    },
    {
      id: "6",
      nome: "Roberto Lima Santos",
      cpf: "678.901.234-55",
      empresa: "AutoServ Comercial",
      telefone: "(11) 93210-9876",
      email: "roberto.santos@autoserv.com.br",
      dataNascimento: "18/02/1987",
      cargo: "Supervisor de Logística",
      dataMatricula: "28/01/2026",
      mod1Pontualidade: "95%",
      mod1Camera: "Sim",
      mod1Participacao: "Média",
      mod1Nota: 8.5,
      mod2Pontualidade: "90%",
      mod2Camera: "Sim",
      mod2Participacao: "Alta",
      mod2Nota: 9.0,
      mod2Media: 8.75,
      treinamentoAtual: "Eu Sou Financeiro",
      treinamentosConcluidos: ["Gestão de Estoque"],
    },
    {
      id: "7",
      nome: "Fernanda Costa Oliveira",
      cpf: "789.012.345-66",
      empresa: "Peças Plus Ltda",
      telefone: "(11) 92109-8765",
      email: "fernanda.oliveira@pecasplus.com.br",
      dataNascimento: "25/06/1991",
      cargo: "Analista de Compras",
      dataMatricula: "02/02/2026",
      mod1Pontualidade: "90%",
      mod1Camera: "Não",
      mod1Participacao: "Média",
      mod1Nota: 7.5,
      mod2Pontualidade: "95%",
      mod2Camera: "Sim",
      mod2Participacao: "Média",
      mod2Nota: 8.0,
      mod2Media: 7.75,
      treinamentoAtual: "Atendimento ao Cliente",
      treinamentosConcluidos: [],
    },
    {
      id: "8",
      nome: "Lucas Alves Mendes",
      cpf: "890.123.456-77",
      empresa: "Moto Parts Express",
      telefone: "(11) 91098-7654",
      email: "lucas.mendes@motoparts.com.br",
      dataNascimento: "03/12/1989",
      cargo: "Gerente de Operações",
      dataMatricula: "05/02/2026",
      mod1Pontualidade: "100%",
      mod1Camera: "Sim",
      mod1Participacao: "Alta",
      mod1Nota: 9.0,
      mod2Pontualidade: "100%",
      mod2Camera: "Sim",
      mod2Participacao: "Alta",
      mod2Nota: 9.2,
      mod2Media: 9.1,
      treinamentoAtual: "Eu Sou Financeiro",
      treinamentosConcluidos: ["Atendimento ao Cliente", "Técnicas de Vendas"],
    },
  ];

  const filteredStudents = students.filter(
    (student) =>
      student.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.cpf.includes(searchTerm) ||
      student.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.treinamentoAtual.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // States for UX logic and Modals
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [isStudentDirty, setIsStudentDirty] = useState(false);
  const [discardStudentConfirmOpen, setDiscardStudentConfirmOpen] = useState(false);
  const [saveStudentConfirmOpen, setSaveStudentConfirmOpen] = useState(false);

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student);
    setDetailModalOpen(true);
    setIsEditingStudent(false);
    setIsStudentDirty(false);
  };

  const handleCancelEdit = () => {
    if (isStudentDirty) {
      setDiscardStudentConfirmOpen(true);
    } else {
      setIsEditingStudent(false);
    }
  };

  const confirmDiscardEdit = () => {
    setDiscardStudentConfirmOpen(false);
    setIsEditingStudent(false);
    setIsStudentDirty(false);
  };

  const handleSaveStudent = () => {
    setSaveStudentConfirmOpen(true);
  };

  const confirmSaveStudent = () => {
    // Adicionar lógica real de salvamento aqui
    setSaveStudentConfirmOpen(false);
    setIsEditingStudent(false);
    setIsStudentDirty(false);
  };


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
          <p className="text-muted-foreground mt-1">Gerencie o cadastro e informações dos alunos</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Cadastrar Aluno
        </Button>
      </div>

      {/* Top Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF, empresa, treinamento atual..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 h-12 text-base"
            />
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium whitespace-nowrap">Visualização:</Label>
            <RadioGroup value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="simples" id="view-simples" />
                <Label htmlFor="view-simples" className="cursor-pointer whitespace-nowrap">Visualização Simples</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="completa" id="view-completa" />
                <Label htmlFor="view-completa" className="cursor-pointer whitespace-nowrap">Visualização Completa</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </Card>

      {/* Simple View Table */}
      {viewMode === "simples" && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Treinamento Atual</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Data de nascimento</TableHead>
                  <TableHead>Cargo</TableHead>
                  <TableHead>Data de matrícula</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow 
                    key={student.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(student)}
                  >
                    <TableCell className="font-medium">{student.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{student.cpf}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.empresa}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{student.telefone}</TableCell>
                    <TableCell>
                      <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 pointer-events-none">
                        {student.treinamentoAtual}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                    <TableCell className="text-muted-foreground">{student.dataNascimento}</TableCell>
                    <TableCell className="text-muted-foreground">{student.cargo}</TableCell>
                    <TableCell className="text-muted-foreground">{student.dataMatricula}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum aluno encontrado com os termos de busca.</p>
            </div>
          )}
        </Card>
      )}

      {/* Complete View Table */}
      {viewMode === "completa" && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                {/* Top-level grouped headers */}
                <TableRow className="bg-muted/50">
                  <TableHead rowSpan={2} className="border-r border-border align-middle font-semibold">
                    Nome Completo
                  </TableHead>
                  <TableHead rowSpan={2} className="border-r border-border align-middle font-semibold">
                    Empresa
                  </TableHead>
                  <TableHead rowSpan={2} className="border-r border-border align-middle font-semibold">
                    Telefone
                  </TableHead>
                  <TableHead rowSpan={2} className="border-r border-border align-middle font-semibold">
                    Data de Nascimento
                  </TableHead>
                  <TableHead rowSpan={2} className="border-r border-border align-middle font-semibold">
                    CPF
                  </TableHead>
                  <TableHead rowSpan={2} className="border-r border-border align-middle font-semibold">
                    Cargo
                  </TableHead>
                  <TableHead rowSpan={2} className="border-r border-border align-middle font-semibold">
                    Email
                  </TableHead>
                  <TableHead colSpan={4} className="border-r border-border text-center font-bold bg-blue-50 dark:bg-blue-950">
                    1º MÓDULO
                  </TableHead>
                  <TableHead colSpan={5} className="text-center font-bold bg-purple-50 dark:bg-purple-950">
                    2º MÓDULO
                  </TableHead>
                </TableRow>
                {/* Sub-headers for modules */}
                <TableRow className="bg-muted/50">
                  <TableHead className="text-center border-r border-border text-xs">Pontualidade</TableHead>
                  <TableHead className="text-center border-r border-border text-xs">Câmera aberta</TableHead>
                  <TableHead className="text-center border-r border-border text-xs">Part.</TableHead>
                  <TableHead className="text-center border-r border-border text-xs">Nota</TableHead>
                  <TableHead className="text-center border-r border-border text-xs">Pontualidade</TableHead>
                  <TableHead className="text-center border-r border-border text-xs">Câmera aberta</TableHead>
                  <TableHead className="text-center border-r border-border text-xs">Part.</TableHead>
                  <TableHead className="text-center border-r border-border text-xs">Nota</TableHead>
                  <TableHead className="text-center text-xs font-semibold">Média</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium border-r border-border">{student.nome}</TableCell>
                    <TableCell className="border-r border-border">
                      <Badge variant="outline" className="text-xs">{student.empresa}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground border-r border-border text-sm">{student.telefone}</TableCell>
                    <TableCell className="text-muted-foreground border-r border-border text-sm">{student.dataNascimento}</TableCell>
                    <TableCell className="text-muted-foreground border-r border-border text-sm">{student.cpf}</TableCell>
                    <TableCell className="text-muted-foreground border-r border-border text-sm">{student.cargo}</TableCell>
                    <TableCell className="text-muted-foreground border-r border-border text-sm">{student.email}</TableCell>
                    {/* Módulo 1 */}
                    <TableCell className="text-center border-r border-border bg-blue-50/50 dark:bg-blue-950/30">
                      <Badge variant={student.mod1Pontualidade === "100%" ? "default" : "secondary"} className="text-xs">
                        {student.mod1Pontualidade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center border-r border-border bg-blue-50/50 dark:bg-blue-950/30">
                      <Badge variant={student.mod1Camera === "Sim" ? "default" : "outline"} className="text-xs">
                        {student.mod1Camera}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center border-r border-border bg-blue-50/50 dark:bg-blue-950/30">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          student.mod1Participacao === "Alta"
                            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : student.mod1Participacao === "Média"
                            ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {student.mod1Participacao}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center border-r border-border bg-blue-50/50 dark:bg-blue-950/30 font-semibold">
                      {student.mod1Nota.toFixed(1)}
                    </TableCell>
                    {/* Módulo 2 */}
                    <TableCell className="text-center border-r border-border bg-purple-50/50 dark:bg-purple-950/30">
                      <Badge variant={student.mod2Pontualidade === "100%" ? "default" : "secondary"} className="text-xs">
                        {student.mod2Pontualidade}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center border-r border-border bg-purple-50/50 dark:bg-purple-950/30">
                      <Badge variant={student.mod2Camera === "Sim" ? "default" : "outline"} className="text-xs">
                        {student.mod2Camera}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center border-r border-border bg-purple-50/50 dark:bg-purple-950/30">
                      <Badge
                        variant="outline"
                        className={`text-xs ${
                          student.mod2Participacao === "Alta"
                            ? "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300"
                            : student.mod2Participacao === "Média"
                            ? "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                            : "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300"
                        }`}
                      >
                        {student.mod2Participacao}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center border-r border-border bg-purple-50/50 dark:bg-purple-950/30 font-semibold">
                      {student.mod2Nota.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-center bg-purple-50/50 dark:bg-purple-950/30 font-bold text-lg">
                      {student.mod2Media.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Nenhum aluno encontrado com os termos de busca.</p>
            </div>
          )}
        </Card>
      )}

      {/* Detail Modal */}
      {selectedStudent && (
        <Dialog open={detailModalOpen} onOpenChange={(open) => {
          if (!open) {
            if (isStudentDirty) setDiscardStudentConfirmOpen(true);
            else setDetailModalOpen(false);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Detalhes do Aluno</DialogTitle>
              <DialogDescription>
                Visualize ou edite as informações gerenciais e histórico de {selectedStudent.nome}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Infos Básicas */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Nome</Label>
                  {isEditingStudent ? (
                    <Input defaultValue={selectedStudent.nome} onChange={() => setIsStudentDirty(true)} />
                  ) : (
                    <p className="font-medium">{selectedStudent.nome}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">CPF</Label>
                  {isEditingStudent ? (
                    <Input defaultValue={selectedStudent.cpf} onChange={() => setIsStudentDirty(true)} />
                  ) : (
                    <p className="font-medium">{selectedStudent.cpf}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Empresa</Label>
                  {isEditingStudent ? (
                    <Input defaultValue={selectedStudent.empresa} onChange={() => setIsStudentDirty(true)} />
                  ) : (
                    <Badge variant="outline">{selectedStudent.empresa}</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Telefone</Label>
                  {isEditingStudent ? (
                    <Input defaultValue={selectedStudent.telefone} onChange={() => setIsStudentDirty(true)} />
                  ) : (
                    <p className="font-medium">{selectedStudent.telefone}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">E-mail</Label>
                  {isEditingStudent ? (
                    <Input defaultValue={selectedStudent.email} onChange={() => setIsStudentDirty(true)} type="email"/>
                  ) : (
                    <p className="font-medium">{selectedStudent.email}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Cargo</Label>
                  {isEditingStudent ? (
                    <Input defaultValue={selectedStudent.cargo} onChange={() => setIsStudentDirty(true)} />
                  ) : (
                    <p className="font-medium">{selectedStudent.cargo}</p>
                  )}
                </div>
              </div>

              {/* Status Educacional */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-lg">Histórico Escolar</h3>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">Treinamento Atual</Label>
                  <div>
                    <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none transition-colors px-3 py-1">
                      {selectedStudent.treinamentoAtual}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground text-xs uppercase">Treinamentos Concluídos</Label>
                  <div className="flex flex-wrap gap-2">
                    {selectedStudent.treinamentosConcluidos.length > 0 ? (
                      selectedStudent.treinamentosConcluidos.map((t, index) => (
                        <Badge key={index} variant="secondary" className="px-3 py-1 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 transition-colors">
                          {t}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">Nenhum treinamento concluído.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Footer com Esquerda/Direita separate */}
            <div className="flex w-full items-center justify-between border-t border-border pt-4 mt-2">
              <div>
                <Button variant="destructive">Excluir</Button>
              </div>
              
              <div className="flex gap-2">
                {isEditingStudent ? (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                    <Button onClick={handleSaveStudent}>Salvar Alterações</Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setDetailModalOpen(false)}>Fechar</Button>
                    <Button onClick={() => setIsEditingStudent(true)}>Editar</Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Discard Confirmation Dialog */}
      <AlertDialog open={discardStudentConfirmOpen} onOpenChange={setDiscardStudentConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Os dados modificados serão perdidos caso não sejam salvos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscardEdit} className="bg-destructive hover:bg-destructive/90">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={saveStudentConfirmOpen} onOpenChange={setSaveStudentConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revisar Dados</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente aplicar e salvar estas edições no perfil de {selectedStudent?.nome}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveStudent}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
