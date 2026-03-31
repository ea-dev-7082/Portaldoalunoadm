import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Pencil,
  Trash2,
  Copy,
  FileText,
  Video,
  Calendar,
  Clock,
} from "lucide-react";

interface Training {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  participants: number;
  modulo: string;
}

interface Material {
  id: string;
  nome: string;
  tipo: "Conteúdo" | "Reunião";
  treinamento: string;
  modulo: string;
  dataEnvio: string;
  dataTreinamento: string;
  tag: string;
  conteudo: string;
}

export function Treinamentos() {
  const [trainingSearchTerm, setTrainingSearchTerm] = useState("");
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [materialFilter, setMaterialFilter] = useState("todos");
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [materialType, setMaterialType] = useState<"conteudo" | "reuniao">("conteudo");
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [deleteMaterialOpen, setDeleteMaterialOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // Mock data for trainings
  const trainings: Training[] = [
    {
      id: "1",
      title: "Eu Sou Financeiro - Módulo 1",
      date: "31 de Março, 2026",
      time: "14:00 - 18:00",
      status: "Em andamento",
      participants: 45,
      modulo: "Módulo 1",
    },
    {
      id: "2",
      title: "Gestão de Estoque",
      date: "5 de Abril, 2026",
      time: "09:00 - 13:00",
      status: "Agendado",
      participants: 32,
      modulo: "Módulo 2",
    },
    {
      id: "3",
      title: "Atendimento ao Cliente",
      date: "8 de Abril, 2026",
      time: "14:00 - 17:00",
      status: "Agendado",
      participants: 28,
      modulo: "Módulo 1",
    },
  ];

  // Mock data for materials
  const materials: Material[] = [
    {
      id: "1",
      nome: "Introdução ao Controle Financeiro",
      tipo: "Conteúdo",
      treinamento: "Eu Sou Financeiro",
      modulo: "Módulo 1",
      dataEnvio: "20/03/2026",
      dataTreinamento: "31/03/2026",
      tag: "PDF",
      conteudo: "Este material aborda os fundamentos do controle financeiro empresarial, incluindo fluxo de caixa, DRE e balanço patrimonial. Os tópicos incluem:\n\n1. Conceitos básicos de contabilidade\n2. Controle de contas a pagar e receber\n3. Análise de indicadores financeiros\n4. Planejamento orçamentário\n\nÉ essencial que todos os participantes leiam este material antes da aula.",
    },
    {
      id: "2",
      nome: "Reunião Kick-off - Gestão de Estoque",
      tipo: "Reunião",
      treinamento: "Gestão de Estoque",
      modulo: "Módulo 2",
      dataEnvio: "25/03/2026",
      dataTreinamento: "05/04/2026",
      tag: "Zoom",
      conteudo: "Link da reunião: https://zoom.us/j/123456789\n\nSenha: autoescola2026\n\nAgenda:\n- Apresentação dos objetivos do treinamento\n- Dinâmica de integração\n- Introdução aos conceitos de gestão de estoque\n- Alinhamento de expectativas",
    },
    {
      id: "3",
      nome: "Apostila de Atendimento ao Cliente",
      tipo: "Conteúdo",
      treinamento: "Atendimento ao Cliente",
      modulo: "Módulo 1",
      dataEnvio: "28/03/2026",
      dataTreinamento: "08/04/2026",
      tag: "PDF",
      conteudo: "Material completo sobre técnicas de atendimento ao cliente no setor automotivo.\n\nConteúdo programático:\n- Psicologia do consumidor\n- Técnicas de comunicação efetiva\n- Resolução de conflitos\n- Fidelização de clientes\n- Cases de sucesso no setor",
    },
    {
      id: "4",
      nome: "Videoaula: Técnicas de Vendas",
      tipo: "Conteúdo",
      treinamento: "Atendimento ao Cliente",
      modulo: "Módulo 1",
      dataEnvio: "29/03/2026",
      dataTreinamento: "08/04/2026",
      tag: "Vídeo",
      conteudo: "Link do vídeo: https://youtube.com/watch?v=example\n\nDuração: 45 minutos\n\nEste vídeo apresenta técnicas práticas de vendas consultivas aplicadas ao setor de autopeças. Inclui exemplos reais e role-playing.",
    },
  ];

  const filteredTrainings = trainings.filter((training) =>
    training.title.toLowerCase().includes(trainingSearchTerm.toLowerCase())
  );

  const filteredMaterials = materials.filter((material) => {
    const matchesSearch =
      material.nome.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
      material.treinamento.toLowerCase().includes(materialSearchTerm.toLowerCase());
    const matchesFilter =
      materialFilter === "todos" ||
      (materialFilter === "conteudo" && material.tipo === "Conteúdo") ||
      (materialFilter === "reuniao" && material.tipo === "Reunião");
    return matchesSearch && matchesFilter;
  });

  const handleExpandMaterial = (materialId: string) => {
    setExpandedMaterial(expandedMaterial === materialId ? null : materialId);
    setEditingMaterial(null);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material.id);
  };

  const handleDeleteMaterial = (material: Material) => {
    setSelectedMaterial(material);
    setDeleteMaterialOpen(true);
  };

  const handleSaveMaterial = () => {
    setSaveConfirmOpen(true);
  };

  const confirmSave = () => {
    setEditingMaterial(null);
    setSaveConfirmOpen(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Em andamento":
        return "bg-green-500 hover:bg-green-600";
      case "Agendado":
        return "bg-blue-500 hover:bg-blue-600";
      case "Concluído":
        return "bg-gray-500 hover:bg-gray-600";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Treinamentos e Materiais</h1>
          <p className="text-muted-foreground mt-1">Gerencie treinamentos, materiais e recursos</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Adicionar Treinamento
        </Button>
      </div>

      {/* Trainings Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Treinamentos</h2>
        
        {/* Training Search */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar treinamentos..."
              value={trainingSearchTerm}
              onChange={(e) => setTrainingSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Trainings List */}
        <div className="space-y-3">
          {filteredTrainings.map((training) => (
            <Card key={training.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold text-foreground">{training.title}</h3>
                      <Badge className={getStatusColor(training.status)}>
                        {training.status}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {training.date}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {training.time}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">{training.participants} participantes</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Badge variant="outline">{training.modulo}</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Materials Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Materiais</h2>
          <Button className="gap-2" onClick={() => setAddMaterialOpen(true)}>
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>

        {/* Material Search and Filter */}
        <Card className="p-4">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar materiais..."
                value={materialSearchTerm}
                onChange={(e) => setMaterialSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <RadioGroup value={materialFilter} onValueChange={setMaterialFilter} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="todos" id="todos" />
                  <Label htmlFor="todos" className="cursor-pointer">Todos</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="conteudo" id="conteudo" />
                  <Label htmlFor="conteudo" className="cursor-pointer">Conteúdo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reuniao" id="reuniao" />
                  <Label htmlFor="reuniao" className="cursor-pointer">Reunião</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        </Card>

        {/* Materials Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Treinamento</TableHead>
                  <TableHead>Módulo</TableHead>
                  <TableHead>Data de envio</TableHead>
                  <TableHead>Data do treinamento</TableHead>
                  <TableHead>Tag</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMaterials.map((material) => (
                  <>
                    <TableRow
                      key={material.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleExpandMaterial(material.id)}
                    >
                      <TableCell>
                        {expandedMaterial === material.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {material.tipo === "Conteúdo" ? (
                            <FileText className="w-4 h-4 text-blue-500" />
                          ) : (
                            <Video className="w-4 h-4 text-purple-500" />
                          )}
                          {material.nome}
                        </div>
                      </TableCell>
                      <TableCell>{material.treinamento}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{material.modulo}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{material.dataEnvio}</TableCell>
                      <TableCell className="text-muted-foreground">{material.dataTreinamento}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{material.tag}</Badge>
                      </TableCell>
                    </TableRow>
                    {expandedMaterial === material.id && (
                      <TableRow>
                        <TableCell colSpan={7} className="bg-muted/30">
                          <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">Conteúdo</h4>
                              <div className="flex gap-2">
                                {editingMaterial !== material.id ? (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => navigator.clipboard.writeText(material.conteudo)}
                                    >
                                      <Copy className="w-4 h-4 mr-2" />
                                      Copiar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEditMaterial(material)}
                                    >
                                      <Pencil className="w-4 h-4 mr-2" />
                                      Alterar
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDeleteMaterial(material)}
                                      className="text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="w-4 h-4 mr-2" />
                                      Excluir
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingMaterial(null)}
                                    >
                                      Cancelar
                                    </Button>
                                    <Button size="sm" onClick={handleSaveMaterial}>
                                      Salvar
                                    </Button>
                                  </>
                                )}
                              </div>
                            </div>
                            {editingMaterial === material.id ? (
                              <Textarea
                                defaultValue={material.conteudo}
                                className="min-h-[200px] font-mono text-sm"
                              />
                            ) : (
                              <div className="p-4 bg-card border rounded-lg whitespace-pre-wrap text-sm font-mono">
                                {material.conteudo}
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* Add Material Modal */}
      <Dialog open={addMaterialOpen} onOpenChange={setAddMaterialOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Material</DialogTitle>
            <DialogDescription>
              Adicione um novo material ou reunião para os treinamentos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Type Toggle */}
            <div className="space-y-2">
              <Label>Tipo</Label>
              <RadioGroup value={materialType} onValueChange={(v) => setMaterialType(v as any)} className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="conteudo" id="type-conteudo" />
                  <Label htmlFor="type-conteudo" className="cursor-pointer">Conteúdo</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reuniao" id="type-reuniao" />
                  <Label htmlFor="type-reuniao" className="cursor-pointer">Reunião</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome do {materialType === "conteudo" ? "Material" : "Reunião"}</Label>
                <Input placeholder={materialType === "conteudo" ? "Ex: Apostila de Finanças" : "Ex: Reunião de Kick-off"} />
              </div>
              <div className="space-y-2">
                <Label>Treinamento</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o treinamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainings.map((training) => (
                      <SelectItem key={training.id} value={training.id}>
                        {training.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Módulo</Label>
                <Input placeholder="Ex: Módulo 1" />
              </div>
              <div className="space-y-2">
                <Label>Data de Envio</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Data do Treinamento</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Tag</Label>
                <Input placeholder={materialType === "conteudo" ? "Ex: PDF, Vídeo, Slide" : "Ex: Zoom, Teams, Meet"} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Conteúdo</Label>
                <Textarea
                  placeholder={
                    materialType === "conteudo"
                      ? "Digite o conteúdo do material ou cole links de arquivos..."
                      : "Digite o link da reunião e instruções..."
                  }
                  className="min-h-[200px]"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMaterialOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setAddMaterialOpen(false)}>Salvar {materialType === "conteudo" ? "Material" : "Reunião"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente salvar as alterações realizadas no material?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>Sim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteMaterialOpen} onOpenChange={setDeleteMaterialOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Material</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o material "{selectedMaterial?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setDeleteMaterialOpen(false)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir Material
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
