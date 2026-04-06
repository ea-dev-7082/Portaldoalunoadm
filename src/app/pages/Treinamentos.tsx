import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../lib/supabase";
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
import { publicAnonKey } from "../../../utils/supabase/info";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  BarChart,
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Plus,
  ChevronUp,
  Pencil,
  Copy,
  FileText,
  Video,
  Calendar,
  Clock,
  Users,
  Building2,
  Building,
  UserMinus,
  X,
} from "lucide-react";
import { SearchInput } from "../components/ui/search-input";
import { MultiSelectFilter } from "../components/MultiSelectFilter";
import { cn } from "../components/ui/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../components/ui/accordion";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { ScrollArea } from "../components/ui/scroll-area";

import React from "react";

interface Training {
  id: string;
  title: string;
  date: string;
  time: string;
  status: string;
  participants: number;
  modulo: string;
  stats: {
    empresas: number;
    gruposEconomicos: number;
    alunosSemEmpresa: number;
  };
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
  const [trainings, setTrainings] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [dbCompanies, setDbCompanies] = useState<any[]>([]);
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchTrainings = useCallback(async () => {
    try {
      const headers = { 
        "apikey": publicAnonKey || ""
      };
      const response = await fetch("https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud", { headers });
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro API Treinamentos: ${response.status} - ${text}`);
      }

      const trData = await response.json();
      const trArray = Array.isArray(trData) ? trData : [];
      
      const mapped = trArray.map((t: any) => ({
        id: t.id_treinamento,
        title: t.nome,
        description: t.descricao,
        date: t.data_inicio ? new Date(t.data_inicio).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "Não definida",
        time: t.data_inicio ? `${new Date(t.data_inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Não definido",
        status: t.status || "Agendado",
        participants: t.students ? t.students.length : 0, 
        modulo: t.modules && t.modules.length > 0 ? `Modulo ${t.modules[0].ordem + 1}` : "N/A",
        stats: { 
          empresas: t.companies ? t.companies.length : 0, 
          gruposEconomicos: 0, 
          alunosSemEmpresa: 0 
        },
        raw: t 
      }));
      setTrainings(mapped);
    } catch (err: any) {
      console.error("fetchTrainings error:", err);
      const msg = err?.message || String(err);
      setFetchError(prev => prev ? `${prev} | ${msg}` : msg);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const headers = { 
        "apikey": publicAnonKey || ""
      };
      const resComp = await fetch("https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/empresas-crud", { headers });
      
      if (!resComp.ok) {
        const errText = await resComp.text();
        throw new Error(`Erro API Empresas: ${resComp.status} - ${errText}`);
      }

      const compData = await resComp.json();
      setDbCompanies(Array.isArray(compData) ? compData : []);
    } catch (err: any) {
      console.error("fetchCompanies error:", err);
      const msg = err?.message || String(err);
      setFetchError(prev => prev ? `${prev} | ${msg}` : msg);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const headers = { 
        "apikey": publicAnonKey || ""
      };
      const resAlu = await fetch("https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/alunos-crud", { headers });

      if (!resAlu.ok) {
        const errText = await resAlu.text();
        throw new Error(`Erro API Alunos: ${resAlu.status} - ${errText}`);
      }

      const aluData = await resAlu.json();
      setDbStudents(Array.isArray(aluData) ? aluData : []);
    } catch (err: any) {
      console.error("fetchStudents error:", err);
      const msg = err?.message || String(err);
      setFetchError(prev => prev ? `${prev} | ${msg}` : msg);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // Procedemos diretamente sem aguardar sessão, usando publicAnonKey nos headers
      await Promise.all([
        fetchTrainings(),
        fetchCompanies(),
        fetchStudents()
      ]);
      
      setMaterials([]); 
    } catch (err: any) {
      console.error("Erro em fetchData:", err);
      const msg = err?.message || String(err);
      setFetchError(prev => prev ? `${prev} | ${msg}` : msg);
    } finally {
      setIsLoading(false);
    }
  }, [fetchTrainings, fetchCompanies, fetchStudents]);

  const formatForDateTimeLocal = (dateStr: string) => {
    if (!dateStr) return "";
    let d = new Date(dateStr);
    
    // Fallback for some SQL formats if needed
    if (isNaN(d.getTime()) && typeof dateStr === 'string') {
      d = new Date(dateStr.replace(' ', 'T'));
    }
    
    if (isNaN(d.getTime())) return "";
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [trainingSearchTerm, setTrainingSearchTerm] = useState("");
  const [selectedTrainingStatuses, setSelectedTrainingStatuses] = useState<string[]>([]);
  const [trainingSort, setTrainingSort] = useState<{key: string, direction: "asc" | "desc"}>({ key: "date", direction: "desc" });
  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [selectedMaterialTags, setSelectedMaterialTags] = useState<string[]>([]);
  const [materialSort, setMaterialSort] = useState<{key: string, direction: "asc" | "desc"}>({ key: "dataEnvio", direction: "desc" });
  
  const [addMaterialData, setAddMaterialData] = useState({
    name: "",
    trainingId: "",
    moduleId: "",
    type: "conteudo",
    tag: "",
    content: "",
    dateEnvio: "",
    dateTraining: ""
  });
  
  const [addMaterialOpen, setAddMaterialOpen] = useState(false);
  const [materialType, setMaterialType] = useState<"conteudo" | "reuniao">("conteudo");
  const [expandedMaterial, setExpandedMaterial] = useState<string | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);
  const [deleteMaterialOpen, setDeleteMaterialOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);

  // New Training States
  const [addTrainingOpen, setAddTrainingOpen] = useState(false);
  const [editingTrainingId, setEditingTrainingId] = useState<string | null>(null);
  const [isTrainingDirty, setIsTrainingDirty] = useState(false);
  const [discardTrainingOpen, setDiscardTrainingOpen] = useState(false);
  const [saveTrainingConfirmOpen, setSaveTrainingConfirmOpen] = useState(false);
  const [trainingData, setTrainingData] = useState({
    name: "",
    description: "",
    status: "Agendado",
    startDate: "",
    endDate: "",
    partnership: "venda-direta",
    partnershipCompany: "",
    students: [] as string[],
    companies: [] as string[]
  });
  const [trainingModules, setTrainingModules] = useState([{ id: "1", name: "Módulo 1", description: "" }]);
  const [activeTab, setActiveTab] = useState("1");
  const [studentModalCompanyFilter, setStudentModalCompanyFilter] = useState("todas");
  
  // Stats Modal State
  const [statsModalOpen, setStatsModalOpen] = useState<{type: string, title: string, count: number, trainingId: string} | null>(null);
  const [statsSearch, setStatsSearch] = useState("");
  const [selectedStatsStatuses, setSelectedStatsStatuses] = useState<string[]>([]);
  const [statsSort, setStatsSort] = useState<{key: string, direction: "asc" | "desc"}>({ key: "nome", direction: "asc" });

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
      let aVal = (a as any)[config.key || "nome"];
      let bVal = (b as any)[config.key || "nome"];
      
      // Special case for date sorting
      if (config.key === "date") {
        aVal = a.raw?.data_inicio || "";
        bVal = b.raw?.data_inicio || "";
      } else {
        aVal = String(aVal || "").toLowerCase();
        bVal = String(bVal || "").toLowerCase();
      }

      if (aVal < bVal) return config.direction === "asc" ? -1 : 1;
      if (aVal > bVal) return config.direction === "asc" ? 1 : -1;
      return 0;
    });
  };

  const allStudents = useMemo(() => (dbStudents || []).map(s => ({
    id: s.id_aluno,
    nome: s.nome,
    empresa: s.empresa?.nome || "Sem Empresa",
    cargo: s.cargo || "N/A"
  })), [dbStudents]);

  const allCompanies = useMemo(() => (dbCompanies || []).map(c => ({
    id: c.id_empresa,
    nome: c.nome,
    cnpj: c.cnpj
  })), [dbCompanies]);

  const filteredTrainings = genericSort(
    trainings.filter((training) => {
      const matchesSearch = (training.title || "").toLowerCase().includes(trainingSearchTerm.toLowerCase());
      const matchesStatus = selectedTrainingStatuses.length === 0 || selectedTrainingStatuses.includes(training.status);
      return matchesSearch && matchesStatus;
    }),
    trainingSort
  );

  const filteredMaterials = genericSort(
    materials.filter((material) => {
      const matchesSearch =
        material.nome.toLowerCase().includes(materialSearchTerm.toLowerCase()) ||
        material.treinamento.toLowerCase().includes(materialSearchTerm.toLowerCase());
      const matchesType = selectedMaterialTypes.length === 0 || selectedMaterialTypes.includes(material.tipo);
      const matchesTag = selectedMaterialTags.length === 0 || selectedMaterialTags.includes(material.tag);
      return matchesSearch && matchesType && matchesTag;
    }),
    materialSort
  );

  const availableModulesForSelectedTraining = useMemo(() => {
    const selectedTr = trainings.find(t => t.id === addMaterialData.trainingId);
    if (selectedTr?.raw?.modules) {
      return selectedTr.raw.modules.map((m: any) => m.modulo.nome);
    }
    return ["Módulo 1"];
  }, [addMaterialData.trainingId, trainings]);

  const handleExpandMaterial = (materialId: string) => {
    setExpandedMaterial(expandedMaterial === materialId ? null : materialId);
    setEditingMaterial(null);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material.id);
  };

  const handleEditTraining = async (training: any) => {
    // Refresh background data without blocking
    fetchStudents();
    fetchCompanies();

    setEditingTrainingId(training.id);
    const raw = training.raw;
    setTrainingData({
      name: raw.nome,
      description: raw.descricao || "",
      status: raw.status || "Agendado",
      startDate: formatForDateTimeLocal(raw.data_inicio),
      endDate: formatForDateTimeLocal(raw.data_fim),
      partnership: "venda-direta", 
      partnershipCompany: "",
      students: raw.students ? raw.students.map((s: any) => s.id_aluno) : [],
      companies: raw.companies ? raw.companies.map((c: any) => c.id_empresa) : []
    });

    if (raw.modules && raw.modules.length > 0) {
      setTrainingModules(raw.modules.map((m: any) => ({
        id: m.id_treinamento_modulo,
        name: m.modulo?.nome || "Módulo",
        description: m.conteudo || ""
      })));
    } else {
      setTrainingModules([{ id: "1", name: "Módulo 1", description: "" }]);
    }
    
    setAddTrainingOpen(true);
    setIsTrainingDirty(false);
  };

  const handleAddNewTraining = async () => {
    // Refresh background data
    fetchStudents();
    fetchCompanies();

    setEditingTrainingId(null);
    setTrainingData({
      name: "",
      description: "",
      status: "Agendado",
      startDate: "",
      endDate: "",
      partnership: "venda-direta",
      partnershipCompany: "",
      students: [],
      companies: []
    });
    setTrainingModules([{ id: "1", name: "Módulo 1", description: "" }]);
    setAddTrainingOpen(true);
    setIsTrainingDirty(false);
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

  const handleAddModule = () => {
    const newId = `temp-${Date.now()}`;
    const newCount = trainingModules.length + 1;
    setTrainingModules([...trainingModules, { id: newId, name: `Módulo ${newCount}`, description: "" }]);
    setActiveTab(newId);
    setIsTrainingDirty(true);
  };
  
  const handleRemoveModule = (id: string) => {
    if (trainingModules.length <= 1) return;
    const filtered = trainingModules.filter(m => m.id !== id);
    setTrainingModules(filtered);
    if (activeTab === id) {
      setActiveTab(filtered[0].id);
    }
    setIsTrainingDirty(true);
  };

  const handleCancelTraining = () => {
    if (isTrainingDirty) {
      setDiscardTrainingOpen(true);
    } else {
      setAddTrainingOpen(false);
      resetTrainingForm();
    }
  };

  const resetTrainingForm = () => {
    setTrainingData({ 
      name: "", 
      description: "", 
      status: "Agendado",
      startDate: "",
      endDate: "",
      partnership: "venda-direta",
      partnershipCompany: "",
      students: [],
      companies: []
    });
    setEditingTrainingId(null);
    setTrainingModules([{ id: "1", name: "Módulo 1", description: "" }]);
    setIsTrainingDirty(false);
    setActiveTab("1");
    setStudentModalCompanyFilter("todas");
  };

  const confirmDiscardTraining = () => {
    setDiscardTrainingOpen(false);
    setAddTrainingOpen(false);
    resetTrainingForm();
  };

  const handleSaveTraining = () => {
    setSaveTrainingConfirmOpen(true);
  };

  const confirmSaveTraining = async () => {
    setIsLoading(true);
    try {
      const payload = {
        nome: trainingData.name,
        descricao: trainingData.description,
        status: trainingData.status,
        data_inicio: trainingData.startDate || null,
        data_fim: trainingData.endDate || null,
        modules: trainingModules.map((m, index) => ({
          id_modulo: (m.id && m.id.length > 10) ? m.id : null, 
          nome: m.name,
          descricao: m.description,
          ordem: index
        })),
        companies: trainingData.companies,
        students: trainingData.students
      };

      const method = editingTrainingId ? "PUT" : "POST";
      const url = `https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud${editingTrainingId ? `?id=${editingTrainingId}` : ""}`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "apikey": publicAnonKey || "",
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao salvar treinamento");
      }

      setSaveTrainingConfirmOpen(false);
      setAddTrainingOpen(false);
      resetTrainingForm();
      // Optimization: refresh data without full page reload
      await fetchData(); 
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao salvar treinamento");
    } finally {
      setIsLoading(false);
    }
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
        <Button className="gap-2" onClick={() => setAddTrainingOpen(true)}>
          <Plus className="w-4 h-4" />
          Adicionar Treinamento
        </Button>
      </div>

      {/* Trainings Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Treinamentos</h2>
        
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <SearchInput
                placeholder="Buscar treinamentos..."
                value={trainingSearchTerm}
                onChange={(e) => setTrainingSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <MultiSelectFilter
                label="Status"
                options={["Em andamento", "Agendado", "Concluído"]}
                selectedValues={selectedTrainingStatuses}
                onSelect={setSelectedTrainingStatuses}
              />
              <Select 
                value={`${trainingSort.key}-${trainingSort.direction}`}
                onValueChange={(val) => {
                  const [key, direction] = val.split("-");
                  setTrainingSort({ key, direction: direction as "asc" | "desc" });
                }}
              >
                <SelectTrigger className="w-[180px] h-8 text-xs">
                  <SelectValue placeholder="Ordenar por..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title-asc">Nome (A-Z)</SelectItem>
                  <SelectItem value="title-desc">Nome (Z-A)</SelectItem>
                  <SelectItem value="date-desc">Data (Mais recente)</SelectItem>
                  <SelectItem value="date-asc">Data (Mais antigo)</SelectItem>
                  <SelectItem value="participants-desc">Mais participantes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Trainings List */}
        <div className="space-y-4">
          <Accordion type="single" collapsible className="w-full space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="text-muted-foreground animate-pulse">Carregando treinamentos...</div>
              </div>
            ) : (fetchError !== null) ? (
              <div className="text-center py-8 text-destructive border border-destructive/20 bg-destructive/5 rounded-lg">
                <p>Erro ao carregar treinamentos: {fetchError}</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={fetchData}>Tentar novamente</Button>
              </div>
            ) : filteredTrainings.length > 0 ? (
              filteredTrainings.map((training) => (
                <AccordionItem key={training.id} value={training.id} className="bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                  <AccordionTrigger className="px-6 py-4 hover:no-underline [&[data-state=open]]:bg-muted/30">
                    <div className="flex items-center justify-between w-full pr-4 text-left">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold text-foreground">{training.title}</h3>
                          <Badge className={getStatusColor(training.status)}>
                            {training.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mt-2">
                          <div className="flex items-center gap-2 text-muted-foreground pt-1">
                            <Calendar className="w-4 h-4" />
                            {training.date}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground pt-1">
                            <Clock className="w-4 h-4" />
                            {training.time}
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground pt-1">
                            <Badge variant="outline">{training.modulo}</Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                      <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatsModalOpen({type: 'alunos', title: 'Alunos Cadastrados', count: training.participants, trainingId: training.id})}>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-sm font-medium">Alunos</span>
                            <Users className="w-4 h-4" />
                          </div>
                          <span className="text-2xl font-bold">{training.participants}</span>
                        </div>
                      </Card>
                      <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatsModalOpen({type: 'empresas', title: 'Empresas Participantes', count: training.stats?.empresas || 0, trainingId: training.id})}>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-sm font-medium">Empresas</span>
                            <Building className="w-4 h-4" />
                          </div>
                          <span className="text-2xl font-bold">{training.stats?.empresas || 0}</span>
                        </div>
                      </Card>
                      <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatsModalOpen({type: 'grupos', title: 'Grupos Econômicos', count: training.stats?.gruposEconomicos || 0, trainingId: training.id})}>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-sm font-medium">Grupos</span>
                            <Building2 className="w-4 h-4" />
                          </div>
                          <span className="text-2xl font-bold">{training.stats?.gruposEconomicos || 0}</span>
                        </div>
                      </Card>
                      <Card className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatsModalOpen({type: 'sem-empresa', title: 'Alunos Sem Empresa', count: training.stats?.alunosSemEmpresa || 0, trainingId: training.id})}>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span className="text-sm font-medium">Sem Empresa</span>
                            <UserMinus className="w-4 h-4" />
                          </div>
                          <span className="text-2xl font-bold">{training.stats?.alunosSemEmpresa || 0}</span>
                        </div>
                      </Card>
                      <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditTraining(training); }}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Editar Treinamento
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Relatório
                        </Button>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))
            ) : (
              <div className="text-center py-12 border rounded-lg bg-card">
                <p className="text-muted-foreground opacity-60 italic">Nenhum treinamento encontrado.</p>
              </div>
            )}
          </Accordion>
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

        <Card className="p-4">
          <div className="flex flex-col gap-4">
            <SearchInput
              placeholder="Buscar materiais..."
              value={materialSearchTerm}
              onChange={(e) => setMaterialSearchTerm(e.target.value)}
            />
          </div>
        </Card>

        {/* Materials Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort(setMaterialSort, materialSort, "nome")}
                  >
                    <div className="flex items-center">
                      Nome {getSortIcon(materialSort, "nome")}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                    onClick={() => handleSort(setMaterialSort, materialSort, "treinamento")}
                  >
                    <div className="flex items-center">
                      Treinamento {getSortIcon(materialSort, "treinamento")}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-1">
                      <MultiSelectFilter
                        label="Tipo"
                        options={["Conteúdo", "Reunião"]}
                        selectedValues={selectedMaterialTypes}
                        onSelect={setSelectedMaterialTypes}
                      />
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer select-none hover:bg-muted/50 transition-colors font-normal text-xs"
                    onClick={() => handleSort(setMaterialSort, materialSort, "dataEnvio")}
                  >
                    <div className="flex items-center whitespace-nowrap">
                      Data envio {getSortIcon(materialSort, "dataEnvio")}
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-1">
                      <MultiSelectFilter
                        label="Tag"
                        options={["PDF", "Zoom", "Vídeo", "Slide"]}
                        selectedValues={selectedMaterialTags}
                        onSelect={setSelectedMaterialTags}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="w-[40px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">Carregando materiais...</TableCell>
                  </TableRow>
                ) : filteredMaterials.length > 0 ? (
                  filteredMaterials.map((material) => (
                    <React.Fragment key={material.id}>
                      <TableRow
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
                    </React.Fragment>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <p className="text-muted-foreground opacity-60 italic">Nenhum material de apoio cadastrado.</p>
                    </TableCell>
                  </TableRow>
                )}
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
                <Label>Nome do {addMaterialData.type === "conteudo" ? "Material" : "Reunião"}</Label>
                <Input 
                  placeholder={addMaterialData.type === "conteudo" ? "Ex: Apostila de Finanças" : "Ex: Reunião de Kick-off"} 
                  value={addMaterialData.name}
                  onChange={(e) => setAddMaterialData({ ...addMaterialData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Treinamento</Label>
                <Select 
                  value={addMaterialData.trainingId} 
                  onValueChange={(val) => setAddMaterialData({ ...addMaterialData, trainingId: val, moduleId: "" })}
                >
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
                <Select 
                  value={addMaterialData.moduleId} 
                  onValueChange={(val) => setAddMaterialData({ ...addMaterialData, moduleId: val })}
                  disabled={!addMaterialData.trainingId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={addMaterialData.trainingId ? "Selecione o módulo" : "Selecione um treinamento primeiro"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModulesForSelectedTraining.map((mod) => (
                      <SelectItem key={mod} value={mod}>
                        {mod}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Envio</Label>
                <Input 
                  type="date" 
                  value={addMaterialData.dateEnvio}
                  onChange={(e) => setAddMaterialData({ ...addMaterialData, dateEnvio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Data do Treinamento</Label>
                <Input 
                  type="date" 
                  value={addMaterialData.dateTraining}
                  onChange={(e) => setAddMaterialData({ ...addMaterialData, dateTraining: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Tag</Label>
                <Input 
                  placeholder={addMaterialData.type === "conteudo" ? "Ex: PDF, Vídeo, Slide" : "Ex: Zoom, Teams, Meet"} 
                  value={addMaterialData.tag}
                  onChange={(e) => setAddMaterialData({ ...addMaterialData, tag: e.target.value })}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Conteúdo</Label>
                <Textarea
                  placeholder={
                    addMaterialData.type === "conteudo"
                      ? "Digite o conteúdo do material ou cole links de arquivos..."
                      : "Digite o link da reunião e instruções..."
                  }
                  value={addMaterialData.content}
                  onChange={(e) => setAddMaterialData({ ...addMaterialData, content: e.target.value })}
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

      {/* Add Training Modal */}
      <Dialog open={addTrainingOpen} onOpenChange={(open) => {
        if (!open) handleCancelTraining();
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Treinamento</DialogTitle>
            <DialogDescription>
              Preencha os dados básicos do treinamento e adicione os módulos necessários.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 lg:col-span-1">
                <Label>Nome do Treinamento *</Label>
                <Input
                  placeholder="Ex: Formação Estoquista"
                  value={trainingData.name}
                  onChange={(e) => {
                    setTrainingData({ ...trainingData, name: e.target.value });
                    setIsTrainingDirty(true);
                  }}
                />
              </div>
              <div className="space-y-2 col-span-2 lg:col-span-1">
                <Label>Vínculo</Label>
                <Select 
                  value={trainingData.status} 
                  onValueChange={(v) => {
                    setTrainingData({ ...trainingData, status: v });
                    setIsTrainingDirty(true);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status do Treinamento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Agendado">Agendado</SelectItem>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2 lg:col-span-1">
                <Label>Data de Início *</Label>
                <Input
                  type="datetime-local"
                  value={trainingData.startDate}
                  onChange={(e) => {
                    setTrainingData({ ...trainingData, startDate: e.target.value });
                    setIsTrainingDirty(true);
                  }}
                />
              </div>
              <div className="space-y-2 col-span-2 lg:col-span-1">
                <Label>Data de Término</Label>
                <Input
                  type="datetime-local"
                  value={trainingData.endDate}
                  onChange={(e) => {
                    setTrainingData({ ...trainingData, endDate: e.target.value });
                    setIsTrainingDirty(true);
                  }}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Descrição</Label>
                <Textarea
                  placeholder="Descreva o propósito e os objetivos deste treinamento..."
                  value={trainingData.description}
                  onChange={(e) => {
                    setTrainingData({ ...trainingData, description: e.target.value });
                    setIsTrainingDirty(true);
                  }}
                  className="min-h-[80px]"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <Tabs defaultValue="modulos" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="modulos">Módulos</TabsTrigger>
                  <TabsTrigger value="participantes">Participantes ({trainingData.students.length + trainingData.companies.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="modulos" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Estrutura de Módulos</h3>
                    <Button variant="outline" size="sm" onClick={handleAddModule} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar Módulo
                    </Button>
                  </div>
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <ScrollArea className="w-full" orientation="horizontal">
                      <TabsList className="w-full flex justify-start mb-4 h-auto p-1 bg-muted/50 rounded-lg">
                        {trainingModules.map((mod, index) => (
                          <TabsTrigger
                            key={mod.id}
                            value={mod.id}
                            className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-background"
                          >
                            Módulo {index + 1}
                            {trainingModules.length > 1 && (
                              <span
                                role="button"
                                tabIndex={0}
                                className="ml-1 p-0.5 rounded-full hover:bg-destructive/10 hover:text-destructive group/remove cursor-pointer inline-flex items-center justify-center"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleRemoveModule(mod.id);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    handleRemoveModule(mod.id);
                                  }
                                }}
                              >
                                <X className="w-3 h-3 opacity-60 group-hover/remove:opacity-100" />
                              </span>
                            )}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </ScrollArea>
                    
                    {trainingModules.map((mod, index) => (
                      <TabsContent key={mod.id} value={mod.id} className="space-y-4">
                        <Card className="p-4 border shadow-sm">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2 col-span-2">
                              <Label>Nome do Módulo</Label>
                              <Input
                                placeholder={`Ex: Introdução ao Módulo ${mod.id}`}
                                value={mod.name}
                                onChange={(e) => {
                                  const newModules = [...trainingModules];
                                  newModules[index].name = e.target.value;
                                  setTrainingModules(newModules);
                                  setIsTrainingDirty(true);
                                }}
                              />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label>Descrição do Módulo</Label>
                              <Textarea
                                placeholder="Descreva o tema deste módulo específico..."
                                value={mod.description}
                                onChange={(e) => {
                                  const newModules = [...trainingModules];
                                  newModules[index].description = e.target.value;
                                  setTrainingModules(newModules);
                                  setIsTrainingDirty(true);
                                }}
                                className="min-h-[100px]"
                              />
                            </div>
                          </div>
                        </Card>
                      </TabsContent>
                    ))}
                  </Tabs>
                </TabsContent>

                <TabsContent value="participantes" className="space-y-8">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        Alunos ({trainingData.students.length})
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Filtrar por Empresa</Label>
                        <Select value={studentModalCompanyFilter} onValueChange={setStudentModalCompanyFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Todas as empresas" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todas">Todas as empresas</SelectItem>
                            {Array.from(new Set(allStudents.map(s => s.empresa))).map(emp => (
                              <SelectItem key={emp} value={emp}>{emp}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Adicionar Aluno</Label>
                        <Select onValueChange={(val) => {
                          if (!trainingData.students.includes(val)) {
                            setTrainingData({
                              ...trainingData,
                              students: [...trainingData.students, val]
                            });
                            setIsTrainingDirty(true);
                          }
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Busque um aluno..." />
                          </SelectTrigger>
                          <SelectContent>
                            {allStudents
                              .filter(s => (studentModalCompanyFilter === "todas" || s.empresa === studentModalCompanyFilter))
                              .filter(s => !trainingData.students.includes(s.id))
                              .sort((a, b) => a.nome.localeCompare(b.nome))
                              .map(s => (
                                <SelectItem key={s.id} value={s.id}>
                                  {s.nome} - {s.cargo} ({s.empresa})
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="border rounded-md max-h-[250px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead>Nome</TableHead>
                            <TableHead>Cargo / Empresa</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trainingData.students.length > 0 ? (
                            trainingData.students.map(studentId => {
                              const student = allStudents.find(s => s.id === studentId);
                              return (
                                <TableRow key={studentId}>
                                  <TableCell className="font-medium">{student?.nome}</TableCell>
                                  <TableCell className="text-muted-foreground text-xs">
                                    {student?.cargo} em {student?.empresa}
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-destructive hover:bg-red-50"
                                      onClick={() => {
                                        setTrainingData({
                                          ...trainingData,
                                          students: trainingData.students.filter(id => id !== studentId)
                                        });
                                        setIsTrainingDirty(true);
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-4 text-muted-foreground text-sm italic">
                                Nenhum aluno matriculado.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="border-t pt-8"></div>

                  {/* SEÇÃO DE EMPRESAS PARTICIPANTES */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Empresas Participantes ({trainingData.companies.length})
                      </h3>
                    </div>

                    <div className="space-y-2">
                      <Label>Adicionar Empresa ao Treinamento</Label>
                      <Select onValueChange={(val) => {
                        if (!trainingData.companies.includes(val)) {
                          setTrainingData({
                            ...trainingData,
                            companies: [...trainingData.companies, val]
                          });
                          setIsTrainingDirty(true);
                        }
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma empresa corporativa..." />
                        </SelectTrigger>
                        <SelectContent>
                          {allCompanies
                            .filter(c => !trainingData.companies.includes(c.id))
                            .sort((a, b) => a.nome.localeCompare(b.nome))
                            .map(c => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.nome} ({c.cnpj})
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="border rounded-md max-h-[250px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead>Nome da Empresa</TableHead>
                            <TableHead>CNPJ</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {trainingData.companies.length > 0 ? (
                            trainingData.companies.map(companyId => {
                              const company = allCompanies.find(c => c.id === companyId);
                              return (
                                <TableRow key={companyId}>
                                  <TableCell className="font-medium">{company?.nome}</TableCell>
                                  <TableCell className="text-muted-foreground text-xs">{company?.cnpj}</TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-8 w-8 text-destructive hover:bg-red-50"
                                      onClick={() => {
                                        setTrainingData({
                                          ...trainingData,
                                          companies: trainingData.companies.filter(id => id !== companyId)
                                        });
                                        setIsTrainingDirty(true);
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={3} className="text-center py-4 text-muted-foreground text-sm italic">
                                Nenhuma empresa participante adicionada.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancelTraining}>
              Cancelar
            </Button>
            <Button onClick={handleSaveTraining}>{editingTrainingId ? 'Salvar Alterações' : 'Criar Treinamento'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Discard Training Confirmation */}
      <AlertDialog open={discardTrainingOpen} onOpenChange={setDiscardTrainingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você possui alterações não salvas. Se prosseguir, todos os dados preenchidos serão perdidos. Deseja realmente descartar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscardTraining} className="bg-destructive hover:bg-destructive/90">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Training Confirmation */}
      <AlertDialog open={saveTrainingConfirmOpen} onOpenChange={setSaveTrainingConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revisar Dados</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a criar o treinamento "{trainingData.name || 'Sem nome'}" com {trainingModules.length} módulo(s). Confirma as informações originais?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar form</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveTraining}>
              Confirmar e Criar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Detail Modal */}
      <Dialog open={statsModalOpen !== null} onOpenChange={(open) => {
        if (!open) {
          setStatsModalOpen(null);
          setStatsSearch("");
          setSelectedStatsStatuses([]);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{statsModalOpen?.title}</DialogTitle>
            <DialogDescription>
              Listagem consolidada para o treinamento selecionado. ({statsModalOpen?.count} registros encontrados)
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="flex gap-4">
              <div className="flex-1">
                <SearchInput
                  placeholder="Buscar..."
                  value={statsSearch}
                  onChange={(e) => setStatsSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort(setStatsSort, statsSort, "nome")}
                    >
                      <div className="flex items-center">
                        Nome {getSortIcon(statsSort, "nome")}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort(setStatsSort, statsSort, "info")}
                    >
                      <div className="flex items-center">
                        {statsModalOpen?.type === 'alunos' || statsModalOpen?.type === 'sem-empresa' ? 'Empresa' : 'CNPJ'} {getSortIcon(statsSort, "info")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-1">
                        <MultiSelectFilter
                          label="Status"
                          options={["Ativo", "Pendente", "Concluído", "Suspenso"]}
                          selectedValues={selectedStatsStatuses}
                          onSelect={setSelectedStatsStatuses}
                        />
                        <span onClick={() => handleSort(setStatsSort, statsSort, "status")}>
                          {getSortIcon(statsSort, "status")}
                        </span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Generic mock data generation focusing on the display for search and sort demo */}
                  {genericSort(
                    Array.from({ length: statsModalOpen?.count || 10 }).map((_, i) => ({
                      id: String(i),
                      nome: statsModalOpen?.type === 'empresas' || statsModalOpen?.type === 'grupos' 
                        ? ['AutoBrasil SA', 'Peças Plus', 'Moto Parts', 'TurboPeças', 'Premium Auto'][i % 5]
                        : ['João Silva', 'Maria Santos', 'Carlos Lima', 'Ana Costa', 'Roberto Mendes'][i % 5],
                      info: statsModalOpen?.type === 'empresas' || statsModalOpen?.type === 'grupos' 
                        ? `00.000.000/0001-${i < 10 ? '0' + i : i}`
                        : ['AutoBrasil SA', 'Moto Parts', 'Peças Plus', 'Nacional Autopeças'][i % 4],
                      status: ["Ativo", "Pendente", "Concluído", "Suspenso"][i % 4]
                    })).filter(item => {
                      const matchesSearch = item.nome.toLowerCase().includes(statsSearch.toLowerCase()) ||
                                          item.info.toLowerCase().includes(statsSearch.toLowerCase());
                      const matchesStatus = selectedStatsStatuses.length === 0 || selectedStatsStatuses.includes(item.status);
                      return matchesSearch && matchesStatus;
                    }),
                    statsSort
                  ).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{item.info}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "outline-none",
                            item.status === "Ativo" ? "bg-green-50 text-green-700 border-green-200" :
                            item.status === "Pendente" ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                            item.status === "Concluído" ? "bg-blue-50 text-blue-700 border-blue-200" :
                            "bg-red-50 text-red-700 border-red-200"
                          )}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {statsModalOpen?.count === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Nenhum dado encontrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setStatsModalOpen(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}