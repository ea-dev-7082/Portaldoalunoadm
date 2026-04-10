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
  Settings,
  Check,
  CheckSquare,
  Square,
  UserCheck,
  GraduationCap,
  Eye,
  Save,
  Undo2,
  Table as TableIcon,
  BookOpen,
  CircleDot,
  ClipboardList
} from "lucide-react";
import { Checkbox } from "../components/ui/checkbox";
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
import { ScrollArea, ScrollBar } from "../components/ui/scroll-area";
import { toast } from "sonner"; // Assuming sonner is used, or replace with alert if not available

import React from "react";

// Converte ISO UTC string para formato datetime-local (horário local)
function isoToLocalDatetime(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}

// Converte número para algarismo romano (1→I, 2→II, etc.)
function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) { result += syms[i]; n -= vals[i]; }
  }
  return result;
}

// Label de exibição de um módulo
function moduloLabel(index: number, nome?: string): string {
  const base = `Módulo ${toRoman(index + 1)}`;
  return nome?.trim() ? `${base} — ${nome.trim()}` : base;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getAuthHeader() {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || publicAnonKey;

  const headers: Record<string, string> = {
    "apikey": publicAnonKey || "",
    "Authorization": `Bearer ${token}`
  };

  return headers;
}

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
  derivedCompanies: any[];
  raw: any;
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

  // Global Settings State removed

  // Attendance Tracker States
  const [attendanceModalOpen, setAttendanceModalOpen] = useState<{ trainingId: string, trainingTitle: string } | null>(null);
  const [isEditingAttendance, setIsEditingAttendance] = useState(false);
  const [attendanceData, setAttendanceData] = useState<{ presence: any[], grades: any[] }>({ presence: [], grades: [] });
  const [isSavingAttendance, setIsSavingAttendance] = useState(false);
  const [attendanceSearch, setAttendanceSearch] = useState("");

  const fetchAttendance = async (trainingId: string) => {
    try {
      const headers = await getAuthHeader();
      const baseUrl = (supabase as any).supabaseUrl;
      const res = await fetch(`${baseUrl}/functions/v1/treinamentos-crud?view=attendance&trainingId=${trainingId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setAttendanceData(data);
      }
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  const handleOpenAttendance = (training: any) => {
    setAttendanceModalOpen({ trainingId: training.id, trainingTitle: training.title });
    fetchAttendance(training.id);
  };

  const handleSaveAttendance = async () => {
    if (!attendanceModalOpen) return;
    setIsSavingAttendance(true);
    try {
      const headers = await getAuthHeader();
      const baseUrl = (supabase as any).supabaseUrl;
      
      // Basic validation: ensure absences have null times
      const sanitizedPresence = attendanceData.presence.map(p => {
        if (!p.presenca) {
          return { ...p, hora_entrada: null, participacao: false, camera_ligada: false };
        }
        return p;
      });

      const res = await fetch(`${baseUrl}/functions/v1/treinamentos-crud?view=attendance&trainingId=${attendanceModalOpen.trainingId}`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ presence: sanitizedPresence, grades: attendanceData.grades })
      });
      
      if (res.ok) {
        toast.success("Diário de classe sincronizado com sucesso.");
        setIsEditingAttendance(false);
        fetchAttendance(attendanceModalOpen.trainingId);
      } else {
        throw new Error("Erro ao salvar acompanhamento.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro de conexão.");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  const [trainingSearchTerm, setTrainingSearchTerm] = useState("");
  const [selectedTrainingStatuses, setSelectedTrainingStatuses] = useState<string[]>([]);
  const [trainingSort, setTrainingSort] = useState<{ key: string, direction: "asc" | "desc" }>({ key: "title", direction: "asc" });

  const [studentModalCompanySearch, setStudentModalCompanySearch] = useState("");
  const [studentModalStudentSearch, setStudentModalStudentSearch] = useState("");
  const [studentModalCurrentSelect, setStudentModalCurrentSelect] = useState("");
  const [showValidationErrors, setShowValidationErrors] = useState(false);
  const [viewMode, setViewMode] = useState<"gestao" | "frequencia">("gestao");
  
  // States for Frequencia View
  const [freqSearchTraining, setFreqSearchTraining] = useState("");
  const [freqSelectedTrainingId, setFreqSelectedTrainingId] = useState("");
  const [freqFilters, setFreqFilters] = useState({
    year: new Date().getFullYear().toString(),
    month: (new Date().getMonth() + 1).toString(),
    dateType: "inicio" as "inicio" | "fim"
  });



  // handleSaveConfig removed

  const fetchTrainings = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch("https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud", { headers });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Erro API Treinamentos: ${response.status} - ${text}`);
      }

      const trData = await response.json();
      const trArray = Array.isArray(trData) ? trData : [];
      
      // Log for diagnostic purposes
      console.log("Treinamentos data from API:", trData);

      const mapped = trArray.map((t: any) => {
        const uniqueCompaniesMap = new Map();
        const studentsList = t.students || t.alunos || t.treinamentos_alunos || [];
        
        studentsList.forEach((s: any) => {
          const al = s.aluno || s.alunos || s;
          const emp = al.empresa || al.empresas;
          if (emp) {
            if (!uniqueCompaniesMap.has(emp.id_empresa)) {
              uniqueCompaniesMap.set(emp.id_empresa, {
                id: emp.id_empresa,
                nome: emp.nome,
                cnpj: emp.cnpj,
                matriz: emp.matriz?.nome || "-",
                parceria: (emp.formacao?.some((f: any) => f.status === 'Ativo') || emp.treinamentos_planos?.some((f: any) => f.status === 'Ativo')) ? 'Programa Formação' : 'Venda Direta',
                alunos: 0,
                id_matriz: emp.id_matriz,
                is_matriz: emp.is_matriz
              });
            }
            uniqueCompaniesMap.get(emp.id_empresa).alunos++;
          }
        });
        const derivedCompanies = Array.from(uniqueCompaniesMap.values());

        return {
          id: t.id_treinamento,
          title: t.nome,
          date: t.data_inicio ? new Date(t.data_inicio).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) : "Não definida",
          time: t.data_inicio ? `${new Date(t.data_inicio).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Não definido",
          status: t.status || "Agendado",
          participants: studentsList.length,
          students: studentsList.map((s: any) => {
            // New API structure: s = { id_aluno, aluno: { nome, empresa: { nome } } }
            // Old API structure fallback: s = { id_aluno, nome, ... }
            const al = s.aluno || s.alunos || s;
            const emp = al.empresa || al.empresas;
            
            // Partnership/Voucher Detection
            let parceria = "Avulso";
            if (emp) {
              const hasFormacao = emp.formacao?.some((f: any) => f.status === 'Ativo') || 
                                  emp.treinamentos_planos?.some((f: any) => f.status === 'Ativo');
              if (hasFormacao) {
                // If company has formacao, check if it's a voucher seat or discount
                const isVoucher = s.tipo_vaga === 'voucher' || s.is_voucher === true || s.vaga_gratuita === true;
                parceria = isVoucher ? "Voucher (Gratuito)" : "Desconto Formação";
              } else if (emp.parceria || (emp.parcerias && emp.parcerias.length > 0)) {
                parceria = "Convênio / Parceria";
              }
            }

            return {
              id: al.id_aluno || al.id || s.id_aluno || s.id,
              nome: al.nome || "Desconhecido",
              empresa: emp?.nome || "Sem Empresa",
              cargo: al.cargo || "-",
              parceria: parceria,
              raw: s
            };
          }),
          modulo: (() => {
            const mods = t.modules || t.treinamentos_modulos || [];
            if (mods.length === 0) return "N/A";
            // Sort by order to ensure first module label is correct
            const sorted = [...mods].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
            return moduloLabel(0, sorted[0].modulo?.nome || sorted[0].nome);
          })(),
          stats: {
            empresas: derivedCompanies.length,
            gruposEconomicos: new Set(derivedCompanies.filter(c => c.id_matriz || c.is_matriz).map(c => c.id_matriz || c.id)).size,
            alunosSemEmpresa: t.students?.filter((s: any) => !s.aluno?.id_empresa).length || 0
          },
          derivedCompanies,
          raw: t
        };
      });
      setTrainings(mapped);
    } catch (err: any) {
      console.error("fetchTrainings error:", err);
      const msg = err?.message || String(err);
      setFetchError(prev => prev ? `${prev} | ${msg}` : msg);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
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
      const headers = await getAuthHeader();
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
      await Promise.all([fetchTrainings(), fetchStudents(), fetchCompanies()]);
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
    if (isNaN(d.getTime()) && typeof dateStr === 'string') {
      d = new Date(dateStr.replace(' ', 'T'));
    }
    if (isNaN(d.getTime())) return "";

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const [materialSearchTerm, setMaterialSearchTerm] = useState("");
  const [selectedMaterialTypes, setSelectedMaterialTypes] = useState<string[]>([]);
  const [selectedMaterialTags, setSelectedMaterialTags] = useState<string[]>([]);
  const [materialSort, setMaterialSort] = useState<{ key: string, direction: "asc" | "desc" }>({ key: "dataEnvio", direction: "desc" });

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
  const [confirmDeleteTrainingOpen, setConfirmDeleteTrainingOpen] = useState(false);
  
  const [trainingData, setTrainingData] = useState({
    name: "",
    status: "Agendado",
    carga_horaria: "" as number | "",
    startDate: "",
    endDate: "",
    partnership: "venda-direta",
    partnershipCompany: "",
    students: [] as string[]
  });

  interface ModuloParte {
    id_parte?: string;
    ordem: number;
    data_aula: string;
    hora_inicio: string;
    hora_fim: string;
    duracao_minutos?: number;
  }
  interface TrainingModule {
    id: string;
    name: string;
    aulas: ModuloParte[];
  }
  
  const emptyModule = (n: number): TrainingModule => ({
    id: `new-mod-${Date.now()}-${n}`,
    name: "",
    aulas: [{ ordem: 0, data_aula: "", hora_inicio: "09:00", hora_fim: "10:00" }],
  });

  const [trainingModules, setTrainingModules] = useState<TrainingModule[]>([emptyModule(0)]);

  // Automated Status and Dates Logic
  useEffect(() => {
    let allAulas: { data: string; hora: string }[] = [];
    trainingModules.forEach((m) => {
      m.aulas.forEach((a) => {
        if (a.data_aula) allAulas.push({ data: a.data_aula, hora: a.hora_inicio || "09:00" });
      });
    });

    if (allAulas.length > 0) {
      allAulas.sort((a, b) => {
        const d1 = new Date(`${a.data}T${a.hora}`);
        const d2 = new Date(`${b.data}T${b.hora}`);
        return d1.getTime() - d2.getTime();
      });

      const first = allAulas[0].data;
      const last = allAulas[allAulas.length - 1].data;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(first + "T00:00:00");
      const end = new Date(last + "T23:59:59");

      let autoStatus = "Agendado";
      if (today >= start && today <= end) autoStatus = "Em andamento";
      else if (today > end) autoStatus = "Concluído";

      setTrainingData((prev) => ({
        ...prev,
        startDate: first,
        endDate: last,
        status: autoStatus,
      }));
    }
  }, [trainingModules]);

  // Helper for Minimum Date/Time Logic (Treating Date+Time as composite)
  const getPrevEndPoint = (modIdx: number, aulaIdx: number | null, currentModules: TrainingModule[]) => {
    let prevDate = "";
    let prevTime = "";

    if (aulaIdx !== null && aulaIdx > 0) {
      const prev = currentModules[modIdx].aulas[aulaIdx - 1];
      prevDate = prev.data_aula;
      prevTime = prev.hora_fim;
    } else if (modIdx > 0) {
      const prevMod = currentModules[modIdx - 1];
      const lastAula = prevMod.aulas[prevMod.aulas.length - 1];
      prevDate = lastAula?.data_aula || "";
      prevTime = lastAula?.hora_fim || "";
    }

    if (!prevDate || !prevTime) return null;
    return { date: prevDate, time: prevTime };
  };

  const validateAndReset = (modIdx: number, aulaIdx: number | null) => {
    const prev = getPrevEndPoint(modIdx, aulaIdx, trainingModules);
    if (!prev) return;

    const m = [...trainingModules];
    const mod = m[modIdx];
    const aula = aulaIdx !== null ? mod.aulas[aulaIdx] : null;

    if (!aula) return;

    const currDate = aula.data_aula;
    const currTime = aula.hora_inicio;

    if (!currDate || !currTime) return;

    // Use a fixed hour (12:00) for cross-date calculations if time is missing, 
    // but here we have both. We use T because it's ISO literal.
    const prevDT = new Date(`${prev.date}T${prev.time}`);
    const currDT = new Date(`${currDate}T${currTime}`);

    if (currDT <= prevDT) {
      // Invalid sequence. Set to prev + 1 minute.
      const minDT = new Date(prevDT.getTime() + 60000);
      const newDate = minDT.toISOString().split("T")[0];
      const newTime = minDT.toTimeString().slice(0, 5);

      if (aula) {
        mod.aulas[aulaIdx!] = { ...aula, data_aula: newDate, hora_inicio: newTime };
        // Check if end time also became invalid
        const endDT = new Date(`${newDate}T${aula.hora_fim || "00:00"}`);
        if (endDT <= minDT) {
          const nextH = new Date(minDT.getTime() + 3600000); // Default +1 hour
          mod.aulas[aulaIdx!].hora_fim = nextH.toTimeString().slice(0, 5);
        }
      }
      setTrainingModules(m);
    }
  };

  const [activeTab, setActiveTab] = useState("1");
  const [studentModalCompanyFilter, setStudentModalCompanyFilter] = useState("todas");

  // Stats Modal State
  const [statsModalOpen, setStatsModalOpen] = useState<{ type: string, title: string, count: number, trainingId: string } | null>(null);
  const [statsSearch, setStatsSearch] = useState("");
  const [selectedStatsStatuses, setSelectedStatsStatuses] = useState<string[]>([]);
  const [statsSort, setStatsSort] = useState<{ key: string, direction: "asc" | "desc" }>({ key: "nome", direction: "asc" });

  // Module Detail Overlay States
  const [moduleDetailOpen, setModuleDetailOpen] = useState(false);
  const [selectedModule, setSelectedModule] = useState<any>(null);
  const [selectedModuleTraining, setSelectedModuleTraining] = useState<any>(null);

  // Test Editor States
  const [testeEditorOpen, setTesteEditorOpen] = useState(false);
  const [testeData, setTesteData] = useState<any>(null);
  const [testePerguntas, setTestePerguntas] = useState<any[]>([]);
  const [isLoadingTeste, setIsLoadingTeste] = useState(false);
  const [isSavingTeste, setIsSavingTeste] = useState(false);
  const [confirmDeleteTesteOpen, setConfirmDeleteTesteOpen] = useState(false);

  // Test scheduling & status states
  const [testeDataAbertura, setTesteDataAbertura] = useState("");
  const [testeDataFechamento, setTesteDataFechamento] = useState("");
  const [confirmInativarOpen, setConfirmInativarOpen] = useState(false);
  const [motivoInatividade, setMotivoInatividade] = useState("");
  const [confirmReativarOpen, setConfirmReativarOpen] = useState(false);
  
  // Teste Extra Participant Management States
  const [isTesteExtraOpen, setIsTesteExtraOpen] = useState(false);
  const [testeExtraAlunos, setTesteExtraAlunos] = useState<any[]>([]);
  const [isLoadingTesteExtra, setIsLoadingTesteExtra] = useState(false);
  const [testeExtraSearch, setTesteExtraSearch] = useState("");


  const handleOpenModuleDetail = (modData: any, training: any) => {
    setSelectedModule(modData);
    setSelectedModuleTraining(training);
    setModuleDetailOpen(true);
  };

  const handleOpenTesteEditor = async (modulo: any) => {
    setTesteEditorOpen(true);
    setIsLoadingTeste(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(
        `https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud?view=teste&id_modulo=${modulo.id_modulo}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setTesteData(data);
          setTestePerguntas(data.perguntas || []);
          setTesteDataAbertura(isoToLocalDatetime(data.data_abertura));
          setTesteDataFechamento(isoToLocalDatetime(data.data_fechamento));
        } else {
          setTesteData(null);
          // Pré-popular com modelo de 10 perguntas padrão
          const template = Array.from({ length: 10 }, (_, i) => ({
            id_pergunta: `new-${Date.now()}-${i}`,
            enunciado: `Esta é a pergunta número ${i + 1}`,
            ordem: i + 1,
            valor_nota: 1.0,
            alternativas: [
              { id_alternativa: `new-a-${Date.now()}-${i}-0`, texto: "Esta é a resposta certa", is_correta: true, ordem: 1 },
              { id_alternativa: `new-a-${Date.now()}-${i}-1`, texto: "Esta é a resposta errada 1", is_correta: false, ordem: 2 },
              { id_alternativa: `new-a-${Date.now()}-${i}-2`, texto: "Esta é a resposta errada 2", is_correta: false, ordem: 3 },
              { id_alternativa: `new-a-${Date.now()}-${i}-3`, texto: "Esta é a resposta errada 3", is_correta: false, ordem: 4 },
            ]
          }));
          setTestePerguntas(template);
          setTesteDataAbertura("");
          setTesteDataFechamento("");
        }
      }
    } catch (err) {
      console.error("Erro ao buscar teste:", err);
    } finally {
      setIsLoadingTeste(false);
    }
  };

  const handleAddPergunta = () => {
    setTestePerguntas(prev => [
      ...prev,
      {
        id_pergunta: `new-${Date.now()}`,
        enunciado: "",
        ordem: prev.length + 1,
        valor_nota: 1.0,
        alternativas: [
          { id_alternativa: `new-a-${Date.now()}-1`, texto: "", is_correta: true, ordem: 1 },
          { id_alternativa: `new-a-${Date.now()}-2`, texto: "", is_correta: false, ordem: 2 },
        ]
      }
    ]);
  };

  const handleAddAlternativa = (perguntaIdx: number) => {
    setTestePerguntas(prev => {
      const updated = [...prev];
      const p = { ...updated[perguntaIdx] };
      p.alternativas = [
        ...(p.alternativas || []),
        { id_alternativa: `new-a-${Date.now()}`, texto: "", is_correta: false, ordem: (p.alternativas?.length || 0) + 1 }
      ];
      updated[perguntaIdx] = p;
      return updated;
    });
  };

  const handleRemovePergunta = (perguntaIdx: number) => {
    setTestePerguntas(prev => prev.filter((_, i) => i !== perguntaIdx));
  };

  const handleRemoveAlternativa = (perguntaIdx: number, altIdx: number) => {
    setTestePerguntas(prev => {
      const updated = [...prev];
      const p = { ...updated[perguntaIdx] };
      p.alternativas = (p.alternativas || []).filter((_: any, i: number) => i !== altIdx);
      updated[perguntaIdx] = p;
      return updated;
    });
  };

  const handleSetCorreta = (perguntaIdx: number, altIdx: number) => {
    setTestePerguntas(prev => {
      const updated = [...prev];
      const p = { ...updated[perguntaIdx] };
      p.alternativas = (p.alternativas || []).map((a: any, i: number) => ({
        ...a,
        is_correta: i === altIdx
      }));
      updated[perguntaIdx] = p;
      return updated;
    });
  };

  // ═══════════════════════════════════════════════════════════════════
  // TESTE EXTRA MANAGEMENT HANDLERS
  // ═══════════════════════════════════════════════════════════════════
  const handleOpenTesteExtra = async (id_teste: string, id_treinamento: string) => {
    setIsLoadingTesteExtra(true);
    setIsTesteExtraOpen(true);
    try {
      const headers = await getAuthHeader();
      const resp = await fetch(`https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud?view=teste-extra&id_teste=${id_teste}&id_treinamento=${id_treinamento}`, {
        headers: { ...headers }
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      setTesteExtraAlunos(data || []);
    } catch (err: any) {
      console.error("Erro ao carregar alunos do teste extra:", err);
      toast.error("Falha ao carregar lista de alunos.");
    } finally {
      setIsLoadingTesteExtra(false);
    }
  };

  const handleToggleTesteExtra = async (id_aluno: string, currentStatus: boolean) => {
    if (!testeData?.id_teste || !selectedModuleTraining?.id_treinamento) return;
    
    // Optimistic update
    setTesteExtraAlunos(prev => prev.map(a => a.id_aluno === id_aluno ? { ...a, tem_permissao: !currentStatus } : a));

    try {
      const headers = await getAuthHeader();
      const resp = await fetch(`https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud?view=teste-extra&id_teste=${testeData.id_teste}&id_treinamento=${selectedModuleTraining.id_treinamento}`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_aluno, conceder: !currentStatus })
      });
      const data = await resp.json();
      if (data.error) throw new Error(data.error);
    } catch (err: any) {
      console.error("Erro ao alternar permissão de teste extra:", err);
      toast.error("Erro ao salvar mudança.");
      // Rollback
      setTesteExtraAlunos(prev => prev.map(a => a.id_aluno === id_aluno ? { ...a, tem_permissao: currentStatus } : a));
    }
  };

  const filteredExtraAlunos = useMemo(() => {
    if (!testeExtraSearch) return testeExtraAlunos;
    const s = testeExtraSearch.toLowerCase();
    return testeExtraAlunos.filter(a => 
      a.nome?.toLowerCase().includes(s) || 
      a.cpf?.includes(s)
    );
  }, [testeExtraAlunos, testeExtraSearch]);

  const handleSaveTeste = async () => {

    if (!selectedModule) return;
    setIsSavingTeste(true);
    try {
      const headers = await getAuthHeader();

      let abertura: string | null = null;
      let fechamento: string | null = null;
      try { if (testeDataAbertura) abertura = new Date(testeDataAbertura).toISOString(); } catch { /* invalid date */ }
      try { if (testeDataFechamento) fechamento = new Date(testeDataFechamento).toISOString(); } catch { /* invalid date */ }

      const res = await fetch(
        `https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud?view=teste`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            id_modulo: selectedModule.id_modulo,
            titulo: testeData?.titulo || "Teste de Conhecimento",
            perguntas: testePerguntas,
            data_abertura: abertura,
            data_fechamento: fechamento
          })
        }
      );
      if (res.ok) {
        const saved = await res.json();
        setTesteData(saved);
        setTestePerguntas(saved.perguntas || []);
        setTesteDataAbertura(isoToLocalDatetime(saved.data_abertura));
        setTesteDataFechamento(isoToLocalDatetime(saved.data_fechamento));
        toast.success("Teste de conhecimento salvo com sucesso!");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erro ao salvar teste");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro de conexão");
    }
    setIsSavingTeste(false);
  };

  const handleDeleteTeste = async () => {
    if (!testeData?.id_teste) return;
    try {
      const headers = await getAuthHeader();
      const res = await fetch(
        `https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud?view=teste&id_teste=${testeData.id_teste}`,
        { method: "DELETE", headers }
      );
      if (res.ok) {
        setTesteData(null);
        setTestePerguntas([]);
        setConfirmDeleteTesteOpen(false);
        toast.success("Teste excluído com sucesso.");
      }
    } catch (err: any) {
      toast.error(err.message || "Erro ao excluir teste");
    }
  };

  const totalNotaTeste = testePerguntas.reduce((acc: number, p: any) => acc + (Number(p.valor_nota) || 0), 0);

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
    const mods = selectedTr?.raw?.modules || selectedTr?.raw?.treinamentos_modulos || [];
    if (mods.length > 0) {
      return mods.map((m: any) => m.modulo?.nome || m.nome || `Módulo ${toRoman((m.ordem ?? 0) + 1)}`);
    }
    return ["Módulo I"];
  }, [addMaterialData.trainingId, trainings]);

  const handleExpandMaterial = (materialId: string) => {
    setExpandedMaterial(expandedMaterial === materialId ? null : materialId);
    setEditingMaterial(null);
  };

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material.id);
  };

  const handleEditTraining = async (training: any) => {
    fetchStudents();
    fetchCompanies();

    setEditingTrainingId(training.id);
    const raw = training.raw;
    setTrainingData({
      name: raw.nome,
      status: raw.status || "Agendado",
      carga_horaria: raw.carga_horaria || "",
      startDate: formatForDateTimeLocal(raw.data_inicio),
      endDate: formatForDateTimeLocal(raw.data_fim),
      partnership: "venda-direta",
      partnershipCompany: "",
      students: raw.students ? raw.students.map((s: any) => s.id_aluno) : []
    });

    if (raw.modules && raw.modules.length > 0) {
      setTrainingModules(raw.modules.map((m: any) => ({
        id: m.id_modulo || `mod-temp-${Date.now()}-${m.ordem}`,
        name: m.nome || "", // Module name is now direct
        aulas: (m.aulas || []).map((p: any) => ({
          id_parte: p.id_parte,
          ordem: p.ordem,
          data_aula: p.data_aula || "",
          hora_inicio: p.hora_inicio || "",
          hora_fim: p.hora_fim || "",
          duracao_minutos: p.duracao_minutos || 0
        })),
      })));
      setActiveTab(raw.modules[0].id_modulo || (raw.modules.length > 0 ? `mod-temp-${Date.now()}-0` : ""));
    } else {
      setTrainingModules([emptyModule(0)]);
      setActiveTab("");
    }

    setAddTrainingOpen(true);
    setIsTrainingDirty(false);
  };

  const handleAddNewTraining = async () => {
    fetchStudents();

    setEditingTrainingId(null);
    setTrainingData({
      name: "",
      status: "Agendado",
      carga_horaria: "",
      startDate: "",
      endDate: "",
      partnership: "venda-direta",
      partnershipCompany: "",
      students: []
    });
    setTrainingModules([emptyModule(0)]);
    setAddTrainingOpen(true);
    setIsTrainingDirty(false);
    setActiveTab(trainingModules[0]?.id || "1");
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
    const m = emptyModule(trainingModules.length + 1);
    setTrainingModules([...trainingModules, m]);
    setActiveTab(m.id);
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
      status: "Agendado",
      carga_horaria: "",
      startDate: "",
      endDate: "",
      partnership: "venda-direta",
      partnershipCompany: "",
      students: []
    });
    setEditingTrainingId(null);
    const m1 = emptyModule(0);
    setTrainingModules([m1]);
    setIsTrainingDirty(false);
    setActiveTab(m1.id); // Reset to first tab when opening
    setStudentModalCompanyFilter("todas");
    setStudentModalCompanySearch("");
    setStudentModalStudentSearch("");
    setStudentModalCurrentSelect("");
    setShowValidationErrors(false);
  };

  const confirmDiscardTraining = () => {
    setDiscardTrainingOpen(false);
    setAddTrainingOpen(false);
    resetTrainingForm();
  };

  const handleSaveTraining = () => {
    setSaveTrainingConfirmOpen(true);
  };

  const handleConfirmDeleteTraining = () => {
    setConfirmDeleteTrainingOpen(true);
  };

  const confirmDeleteTraining = async () => {
    if (!editingTrainingId) return;

    setIsLoading(true);
    try {
      const authHdrs = await getAuthHeader();
      const res = await fetch(`https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud?id=${editingTrainingId}`, {
        method: "DELETE",
        headers: authHdrs,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Erro ao excluir treinamento");
      }

      setConfirmDeleteTrainingOpen(false);
      setAddTrainingOpen(false);
      resetTrainingForm();
      await fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao excluir treinamento");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmSaveTraining = async () => {
    // 1. Verificação de campos obrigatórios do cabeçalho
    if (!trainingData.name.trim() || !trainingData.carga_horaria) {
      setShowValidationErrors(true);
      toast.error("Por favor, preencha o nome do treinamento e a carga horária.");
      return;
    }

    // 2. Validar ordem cronológica e campos obrigatórios de módulos/aulas
    const sortedAulas: { data: string; inicio: string; fim: string; name: string }[] = [];
    
    for (let i = 0; i < trainingModules.length; i++) {
        const m = trainingModules[i];
        const mName = m.name || `Módulo ${toRoman(i + 1)}`;
        
        if (m.aulas.length === 0) {
            toast.error(`O módulo ${mName} deve ter pelo menos uma aula.`);
            return;
        }

        for (let j = 0; j < m.aulas.length; j++) {
            const a = m.aulas[j];
            const aName = `${mName} - Aula ${toRoman(j + 1)}`;
            if (!a.data_aula || !a.hora_inicio || !a.hora_fim) {
                toast.error(`Preencha todos os campos de data e hora em: ${aName}`);
                return;
            }
            sortedAulas.push({ data: a.data_aula, inicio: a.hora_inicio, fim: a.hora_fim, name: aName });
        }
    }

    // Verificação secundária de segurança (embora o auto-reset cuide disso)
    let lastDate: Date | null = null;
    for (const a of sortedAulas) {
      const start = new Date(`${a.data}T${a.inicio}`);
      const end = new Date(`${a.data}T${a.fim}`);
      
      if (end <= start) {
        toast.error(`O horário de término deve ser após o início em ${a.name}`);
        return;
      }

      if (lastDate && start < lastDate) {
        toast.error(`Conflito: ${a.name} começa antes da aula anterior terminar.`);
        return;
      }
      lastDate = end;
    }

    setSaveTrainingConfirmOpen(false);
    setIsLoading(true);
    try {
      const payload = {
        id_treinamento: editingTrainingId, // Payload explicit id
        nome: trainingData.name,
        status: trainingData.status,
        carga_horaria: trainingData.carga_horaria || null,
        data_inicio: trainingData.startDate || null,
        data_fim: trainingData.endDate || null,
        modules: trainingModules.map((m, index) => {
          return {
            id_modulo: (m.id && !String(m.id).startsWith("new-mod")) ? m.id : null,
            nome: m.name ? m.name.trim() : null,
            ordem: index + 1,
            aulas: m.aulas.map((aula, aIdx) => ({
                id_parte: (aula.id_parte && !String(aula.id_parte).startsWith("new-") && !String(aula.id_parte).startsWith("v-")) ? aula.id_parte : null,
                ordem: aIdx + 1,
                data_aula: aula.data_aula,
                hora_inicio: aula.hora_inicio,
                hora_fim: aula.hora_fim,
                duracao_minutos: aula.duracao_minutos || 0
            })),
          };
        }),
        students: trainingData.students
      };

      const method = editingTrainingId ? "PUT" : "POST";
      const url = `https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud${editingTrainingId ? `?id=${editingTrainingId}` : ""}`;

      const authHdrs = await getAuthHeader();
      console.log("Saving training payload:", JSON.stringify(payload, null, 2));
      const res = await fetch(url, {
        method,
        headers: {
          ...authHdrs,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("Save failure details:", errorData);
        throw new Error(errorData.error || "Erro ao salvar treinamento");
      }

      const responseData = await res.json();
      if (responseData.associationErrors && responseData.associationErrors.length > 0) {
        console.error("Association errors:", responseData.associationErrors);
        toast.warning("Treinamento salvo, mas houve erros ao vincular alunos/empresas. Verifique o console.");
      }

      toast.success(editingTrainingId ? "Treinamento atualizado com sucesso!" : "Treinamento criado com sucesso!");
      setAddTrainingOpen(false);
      resetTrainingForm();
      // Pequeno delay para garantir processamento no backend antes do refresh
      setTimeout(() => fetchData(), 500);
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Erro ao salvar treinamento");
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Treinamentos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o catálogo de cursos e treinamentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2" onClick={handleAddNewTraining}>
            <Plus className="w-4 h-4" />
            Adicionar Treinamento
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Buscar treinamentos..."
              value={trainingSearchTerm}
              onChange={(e) => setTrainingSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <MultiSelectFilter
              label="Status"
              options={["Agendado", "Em andamento", "Concluído"]}
              selectedValues={selectedTrainingStatuses}
              onSelect={setSelectedTrainingStatuses}
            />
            <Select 
              value={`${trainingSort.key}-${trainingSort.direction}`}
              onValueChange={(value) => {
                const [key, direction] = value.split("-");
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
                  <AccordionContent className="px-6 pb-6 pt-2 border-t">
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <FileText className="w-5 h-5 text-blue-500" />
                          Estrutura de Módulos
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(() => {
                          const mods = training.raw?.modules || training.raw?.treinamentos_modulos || [];
                          if (mods.length > 0) {
                            return [...mods]
                              .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
                              .map((m: any, idx: number) => {
                                const modAulas = m.modulo?.aulas || m.aulas || [];
                                return (
                                  <Card
                                    key={m.id_modulo || m.id || idx}
                                    className="p-4 border-l-4 border-l-blue-500 flex flex-col gap-2 cursor-pointer hover:shadow-md hover:border-l-blue-400 transition-all group"
                                    onClick={() => handleOpenModuleDetail(m, training)}
                                  >
                                     <div className="flex items-center justify-between">
                                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-500">
                                        {moduloLabel((m.ordem ?? idx + 1) - 1, m.modulo?.nome || m.nome)}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {(m.data_aula || m.modulo?.data_aula) && (
                                          <Badge variant="outline" className="text-[10px]">
                                            {new Date((m.data_aula || m.modulo?.data_aula) + "T12:00:00").toLocaleDateString("pt-BR")}
                                          </Badge>
                                        )}
                                        <Eye className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-auto pt-2 border-t text-[10px] text-muted-foreground">
                                      {(m.hora_inicio || m.modulo?.hora_inicio) && (
                                        <span className="flex items-center gap-1">
                                          <Clock className="w-3 h-3" /> {(m.hora_inicio || m.modulo?.hora_inicio).slice(0, 5)} - {(m.hora_fim || m.modulo?.hora_fim)?.slice(0, 5)}
                                        </span>
                                      )}
                                      {modAulas.length > 0 && (
                                        <span className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                                          {modAulas.length} aula(s)
                                        </span>
                                      )}
                                    </div>
                                  </Card>
                                );
                              });
                          }
                          return (
                            <div className="col-span-2 text-center py-6 bg-muted/20 rounded-lg border border-dashed text-sm text-muted-foreground italic">
                              Nenhum módulo configurado para este treinamento.
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="mt-10 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg flex items-center gap-2">
                          <Users className="w-5 h-5 text-green-500" />
                          Lista Completa de Alunos
                        </h4>
                          <Badge variant="outline">{training.participants} Aluno(s)</Badge>

                      </div>
                      <div className="rounded-lg border overflow-hidden">
                        <Table>
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead>Nome</TableHead>
                              <TableHead>Empresa / Cargo</TableHead>
                              <TableHead>Vínculo / Parceria</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {training.students && training.students.length > 0 ? (
                              training.students.map((student: any) => {
                                const resolved = allStudents.find(s => s.id === student.id) || student;
                                return (
                                  <TableRow key={student.id}>
                                    <TableCell className="font-medium">{resolved.nome}</TableCell>
                                    <TableCell>
                                      <div className="flex flex-col">
                                        <span className="text-sm">{resolved.empresa}</span>
                                        <span className="text-[10px] text-muted-foreground">{resolved.cargo}</span>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge 
                                        variant="outline" 
                                        className={cn(
                                          "text-[10px] border-none px-0 font-bold",
                                          student.parceria?.includes("Voucher") ? "text-emerald-600" :
                                          student.parceria?.includes("Desconto") ? "text-blue-600" : "text-muted-foreground"
                                        )}
                                      >
                                        {student.parceria || "Avulso"}
                                      </Badge>
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            ) : (
                              <TableRow>
                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground italic text-sm">
                                  Nenhum aluno matriculado neste treinamento.
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-8 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditTraining(training); }}>
                        <Pencil className="w-4 h-4 mr-2" />
                        Editar Treinamento
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Relatório
                      </Button>
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
                        <TableCell>
                          <Badge variant="secondary">{material.tag}</Badge>
                        </TableCell>
                        <TableCell></TableCell>
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
                    {availableModulesForSelectedTraining.map((mod: any) => (
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
            <DialogTitle>{editingTrainingId ? 'Editar Treinamento' : 'Adicionar Novo Treinamento'}</DialogTitle>
            <DialogDescription>
              Preencha os dados básicos do treinamento e adicione os módulos necessários.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 lg:col-span-1">
                <Label className={cn(showValidationErrors && !trainingData.name.trim() && "text-destructive")}>
                  Nome do Treinamento * {showValidationErrors && !trainingData.name.trim() && "(Obrigatório)"}
                </Label>
                <Input
                  placeholder="Ex: Formação Estoquista"
                  value={trainingData.name}
                  onChange={(e) => {
                    setTrainingData({ ...trainingData, name: e.target.value });
                    setIsTrainingDirty(true);
                  }}
                  className={cn(showValidationErrors && !trainingData.name.trim() && "border-destructive focus-visible:ring-destructive")}
                />
              </div>
              <div className="space-y-2 col-span-2 lg:col-span-1">
                <Label>Status (Automatizado)</Label>
                <div className={cn(
                  "h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm flex items-center font-medium",
                  trainingData.status === "Em andamento" ? "text-green-600" :
                  trainingData.status === "Agendado" ? "text-blue-600" : "text-muted-foreground"
                )}>
                  {trainingData.status}
                </div>
              </div>
              <div className="space-y-2 col-span-2 lg:col-span-1">
                <Label>Data de Início (Automático)</Label>
                <Input
                  type="date"
                  value={trainingData.startDate}
                  readOnly
                  disabled
                  className="bg-muted cursor-default"
                />
              </div>
              <div className="space-y-2 col-span-2 lg:col-span-1">
                <Label>Data de Término (Automático)</Label>
                <Input
                  type="date"
                  value={trainingData.endDate}
                  readOnly
                  disabled
                  className="bg-muted cursor-default"
                />
              </div>
              <div className="space-y-2 col-span-2 lg:col-span-1">
                <Label className={cn(showValidationErrors && !trainingData.carga_horaria && "text-destructive")}>
                  Carga Horária (h) * {showValidationErrors && !trainingData.carga_horaria && "(Obrigatório)"}
                </Label>
                <Input
                  type="number"
                  placeholder="Ex: 40"
                  value={trainingData.carga_horaria}
                  onChange={(e) => {
                    setTrainingData({ ...trainingData, carga_horaria: e.target.value ? Number(e.target.value) : "" });
                    setIsTrainingDirty(true);
                  }}
                  className={cn(showValidationErrors && !trainingData.carga_horaria && "border-destructive focus-visible:ring-destructive")}
                />
              </div>
              {/* Descrição do curso removida */}
            </div>

            <div className="border-t pt-4">
              <Tabs defaultValue="modulos" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="modulos">Módulos</TabsTrigger>
                  <TabsTrigger value="participantes">Alunos ({trainingData.students.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="modulos" className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold">Estrutura de Módulos</h3>
                    <Button variant="outline" size="sm" onClick={handleAddModule} className="gap-2">
                      <Plus className="w-4 h-4" />
                      Adicionar Módulo
                    </Button>
                  </div>
                  
                  <Tabs value={activeTab || (trainingModules.length > 0 ? trainingModules[0].id : "")} onValueChange={setActiveTab} className="w-full">
                    <ScrollArea className="w-full">
                      <TabsList className="w-full flex justify-start mb-4 h-auto p-1 bg-muted/50 rounded-lg min-w-max">
                        {trainingModules.map((mod, index) => (
                          <TabsTrigger
                            key={mod.id}
                            value={mod.id}
                            className="flex items-center gap-2 py-2 px-6 data-[state=active]:bg-background font-bold"
                          >
                            Módulo {toRoman(index + 1)}
                            {trainingModules.length > 1 && (
                              <X
                                className="w-3 h-3 ml-1 text-muted-foreground hover:text-destructive cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveModule(mod.id);
                                }}
                              />
                            )}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                        <ScrollBar orientation="horizontal" />
                      </ScrollArea>

                    {trainingModules.map((mod, index) => (
                      <TabsContent key={mod.id} value={mod.id} className="space-y-4 pt-1 mt-0 focus-visible:ring-0">
                        <Card className="p-5 border shadow-sm space-y-5">
                          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                            <span className="text-xs text-muted-foreground">Label exibido:</span>
                            <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                              {moduloLabel(index, mod.name)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label>Nome do Módulo <span className="text-muted-foreground font-normal text-xs">(opcional)</span></Label>
                              <Input
                                placeholder={`Ex: Introdução, Avançado... (se vazio, exibe apenas "Módulo ${toRoman(index+1)}")`}
                                value={mod.name}
                                onChange={(e) => {
                                  const m = [...trainingModules];
                                  m[index] = { ...m[index], name: e.target.value };
                                  setTrainingModules(m);
                                  setIsTrainingDirty(true);
                                }}
                              />
                            </div>
                          </div>

                          <div className="border-t pt-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-base font-semibold">Aulas do Módulo</Label>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {mod.aulas.length} aula(s) — cada uma com data e horário próprios
                                </p>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5"
                                onClick={() => {
                                  const prev = getPrevEndPoint(index, mod.aulas.length, trainingModules);
                                  let defaultStart = "09:00";
                                  let defaultDate = mod.aulas[0]?.data_aula || "";
                                  
                                  if (prev) {
                                    const min = new Date(new Date(`${prev.date}T${prev.time}`).getTime() + 60000);
                                    defaultDate = min.toISOString().split("T")[0];
                                    defaultStart = min.toTimeString().slice(0, 5);
                                  }

                                  const [h, m_val] = defaultStart.split(":").map(Number);
                                  const defaultEnd = `${String((h + 1) % 24).padStart(2, '0')}:${String(m_val).padStart(2, '0')}`;

                                  const m = [...trainingModules];
                                  m[index] = {
                                    ...m[index],
                                    aulas: [
                                      ...m[index].aulas,
                                      { id_parte: undefined, ordem: m[index].aulas.length, data_aula: defaultDate, hora_inicio: defaultStart, hora_fim: defaultEnd },
                                    ],
                                  };
                                  setTrainingModules(m);
                                  setIsTrainingDirty(true);
                                }}
                              >
                                <Plus className="w-3.5 h-3.5" />
                                Adicionar Aula
                              </Button>
                            </div>

                            {mod.aulas.length > 0 && (
                              <div className="space-y-2">
                                {mod.aulas.map((aula, pi) => (
                                  <div
                                    key={pi}
                                    className="flex items-end gap-3 bg-muted/30 rounded-lg px-3 py-3 border flex-wrap"
                                  >
                                    <span className="text-sm font-semibold text-muted-foreground w-16 shrink-0 pb-1">
                                      Aula {toRoman(pi + 1)}
                                    </span>
                                    <div className="flex-1 min-w-[120px] space-y-1">
                                      <Label className="text-xs">Data</Label>
                                      <Input
                                        type="date"
                                        value={aula.data_aula}
                                        onChange={(e) => {
                                          const m = [...trainingModules];
                                          const aulas = [...m[index].aulas];
                                          aulas[pi] = { ...aulas[pi], data_aula: e.target.value };
                                          m[index] = { ...m[index], aulas };
                                          setTrainingModules(m);
                                          setIsTrainingDirty(true);
                                        }}
                                        onBlur={() => validateAndReset(index, pi)}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-[120px] space-y-1">
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
                                        onBlur={() => validateAndReset(index, pi)}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-[120px] space-y-1">
                                      <Label className="text-xs">Fim</Label>
                                      <Input
                                        type="time"
                                        value={aula.hora_fim}
                                        onChange={(e) => {
                                          const m = [...trainingModules];
                                          const aulas = [...m[index].aulas];
                                          aulas[pi] = { ...aulas[pi], hora_fim: e.target.value };
                                          m[index] = { ...m[index], aulas };
                                          setTrainingModules(m);
                                          setIsTrainingDirty(true);
                                        }}
                                         onBlur={() => {
                                            const start = new Date(`${aula.data_aula}T${aula.hora_inicio}`);
                                            const end = new Date(`${aula.data_aula}T${aula.hora_fim}`);
                                            if (end <= start) {
                                                const m = [...trainingModules];
                                                const aulas = [...m[index].aulas];
                                                const [h, min_val] = aula.hora_inicio.split(":").map(Number);
                                                aulas[pi].hora_fim = `${String((h+1)%24).padStart(2, '0')}:${String(min_val).padStart(2, '0')}`;
                                                m[index].aulas = aulas;
                                                setTrainingModules(m);
                                            }
                                         }}
                                        className="h-8 text-sm"
                                      />
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0"
                                      onClick={() => {
                                        const m = [...trainingModules];
                                        const aulas = m[index].aulas.filter((_, i) => i !== pi)
                                          .map((p, i) => ({ ...p, ordem: i }));
                                        m[index] = { ...m[index], aulas };
                                        setTrainingModules(m);
                                        setIsTrainingDirty(true);
                                      }}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold tracking-wider opacity-60">1. Filtrar por Empresa</Label>
                        <div className="space-y-2">
                          <SearchInput 
                            placeholder="Pesquisar por nome da empresa..." 
                            value={studentModalCompanySearch} 
                            onChange={(e) => setStudentModalCompanySearch(e.target.value)}
                            className="h-9"
                          />
                          <Select value={studentModalCompanyFilter} onValueChange={setStudentModalCompanyFilter}>
                            <SelectTrigger>
                              <SelectValue placeholder="Todas as empresas" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="todas">Todas as empresas</SelectItem>
                              {allCompanies
                                .filter(c => c.nome.toLowerCase().includes(studentModalCompanySearch.toLowerCase()))
                                .map(emp => (
                                  <SelectItem key={emp.id} value={emp.nome}>{emp.nome}</SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs uppercase font-bold tracking-wider opacity-60">2. Adicionar Aluno</Label>
                        <div className="space-y-2">
                          <SearchInput 
                            placeholder="Nome do aluno..." 
                            value={studentModalStudentSearch} 
                            onChange={(e) => setStudentModalStudentSearch(e.target.value)}
                            className="h-9"
                          />
                          <Select 
                            value={studentModalCurrentSelect}
                            onValueChange={(val) => {
                              if (!trainingData.students.includes(val)) {
                                setTrainingData({
                                  ...trainingData,
                                  students: [...trainingData.students, val]
                                });
                                setIsTrainingDirty(true);
                                setStudentModalCurrentSelect(""); // Reset select after adding
                                setStudentModalStudentSearch(""); // Clear search after adding
                                toast.success("Aluno adicionado à lista!");
                              } else {
                                toast.warning("Este aluno já está na lista.");
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Busque um aluno..." />
                            </SelectTrigger>
                            <SelectContent>
                              {allStudents
                                .filter(s => (studentModalCompanyFilter === "todas" || s.empresa === studentModalCompanyFilter))
                                .filter(s => s.nome.toLowerCase().includes(studentModalStudentSearch.toLowerCase()))
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

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        Empresas Participantes
                      </h3>
                    </div>

                    <div className="border rounded-md max-h-[250px] overflow-auto">
                      <Table>
                        <TableHeader className="sticky top-0 bg-background z-10">
                          <TableRow>
                            <TableHead>Nome da Empresa</TableHead>
                            <TableHead>CNPJ</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Array.from(new Set(trainingData.students.map(sid => allStudents.find(s => s.id === sid)?.empresa).filter(Boolean))).length > 0 ? (
                            Array.from(new Set(trainingData.students.map(sid => allStudents.find(s => s.id === sid)?.empresa).filter(Boolean))).map(empName => {
                              const company = allCompanies.find((c: any) => c.nome === empName);
                              return (
                                <TableRow key={empName}>
                                  <TableCell className="font-medium">{empName}</TableCell>
                                  <TableCell className="text-muted-foreground text-xs">{company?.cnpj || "N/A"}</TableCell>
                                </TableRow>
                              );
                            })
                          ) : (
                            <TableRow>
                              <TableCell colSpan={2} className="text-center py-4 text-muted-foreground text-sm italic">
                                Nenhuma empresa identificada através dos alunos.
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
          <DialogFooter className="flex flex-row items-center justify-between">
            <div className="flex-1 text-left">
              {editingTrainingId && (
                <Button
                  variant="ghost"
                  onClick={handleConfirmDeleteTraining}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2 p-0 px-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir treinamento
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleCancelTraining}>
                Cancelar
              </Button>
              <Button onClick={handleSaveTraining}>{editingTrainingId ? 'Salvar Alterações' : 'Criar Treinamento'}</Button>
            </div>
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
              Você está prestes a criar o treinamento "{trainingData.name || 'Sem nome'}" com {trainingModules.length} módulo(s). Confirma as informações?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar form</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveTraining}>
              Confirmar e Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Delete Training */}
      <AlertDialog open={confirmDeleteTrainingOpen} onOpenChange={setConfirmDeleteTrainingOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Excluir Treinamento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a excluir permanentemente o treinamento "{trainingData.name}".
              Esta ação removerá todos os dados de presença, notas e vículos de alunos associados.
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteTraining}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sim, excluir treinamento
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
                        {statsModalOpen?.type === 'empresas' ? 'Status / Parceria' : 'Vínculo / Parceria'}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {genericSort(
                    (statsModalOpen?.type === 'empresas' || statsModalOpen?.type === 'grupos'
                      ? (trainings.find(t => t.id === statsModalOpen?.trainingId)?.derivedCompanies || []).map((c: any) => ({
                        id: c.id,
                        nome: c.nome,
                        info: c.cnpj,
                        extra: c.matriz,
                        parceria: c.parceria,
                        alunos: c.alunos,
                        status: "Ativo"
                      }))
                      : (() => {
                        const tr = trainings.find(t => t.id === statsModalOpen?.trainingId);
                        return (tr?.students || []).map((s: any) => {
                          const resolved = allStudents.find(x => x.id === s.id) || s;
                          return {
                            id: s.id,
                            nome: resolved.nome,
                            info: resolved.empresa,
                            extra: resolved.cargo,
                            parceria: s.parceria || "Avulso",
                            status: "Ativo"
                          };
                        });
                      })()
                    ).filter((item: any) => {
                      const matchesSearch = item.nome.toLowerCase().includes(statsSearch.toLowerCase()) ||
                        item.info.toLowerCase().includes(statsSearch.toLowerCase());
                      const matchesStatus = selectedStatsStatuses.length === 0 || selectedStatsStatuses.includes(item.status);
                      return matchesSearch && matchesStatus;
                    }),
                    statsSort
                  ).map((item: any) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{item.nome}</span>
                          {item.extra && item.extra !== "-" && (
                            <span className="text-[10px] text-muted-foreground">{item.extra}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {item.info}
                      </TableCell>
                      <TableCell>
                        {statsModalOpen?.type === 'empresas' ? (
                          <Badge variant="outline" className="gap-1">
                            <Users className="w-3 h-3" /> {item.alunos} Alunos
                          </Badge>
                        ) : (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[10px] border-none px-0 font-bold",
                              item.parceria?.includes("Voucher") ? "text-emerald-600" :
                              item.parceria?.includes("Desconto") ? "text-blue-600" : "text-muted-foreground"
                            )}
                          >
                            {item.parceria}
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!trainings.find(t => t.id === statsModalOpen?.trainingId)) && (
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

      {filteredTrainings.length === 0 && (
        <Card className="p-12 text-center border-dashed">
          <div className="flex flex-col items-center gap-2 opacity-50">
            <Building className="w-12 h-12 mb-2" />
            <p className="text-lg font-medium">Nenhum treinamento encontrado</p>
            <p className="text-sm">Tente mudar os termos da busca ou cadastre um novo treinamento.</p>
          </div>
        </Card>
      )}

      {/* ══════════ MODULE DETAIL OVERLAY ══════════ */}
      <Dialog open={moduleDetailOpen} onOpenChange={setModuleDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <BookOpen className="w-5 h-5" />
              {selectedModule && moduloLabel(
                ((selectedModule.ordem ?? 1) - 1),
                selectedModule.modulo?.nome || selectedModule.nome
              )}
            </DialogTitle>
            <DialogDescription>
              Detalhes do módulo e cronograma de aulas
            </DialogDescription>
          </DialogHeader>

          {selectedModule && (() => {
            const aulas = (selectedModule.modulo?.aulas || selectedModule.aulas || [])
              .sort((a: any, b: any) => (a.ordem || 0) - (b.ordem || 0));

            // Calcular datas início e fim
            const datasAulas = aulas
              .filter((a: any) => a.data_aula)
              .map((a: any) => a.data_aula)
              .sort();
            const dataInicio = datasAulas[0];
            const dataFim = datasAulas[datasAulas.length - 1];

            const diasSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

            return (
              <div className="space-y-6 py-2">
                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3 border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Data Início</p>
                    <p className="text-sm font-semibold text-foreground">
                      {dataInicio ? new Date(dataInicio + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Não definida'}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3 border">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Data Fim</p>
                    <p className="text-sm font-semibold text-foreground">
                      {dataFim ? new Date(dataFim + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Não definida'}
                    </p>
                  </div>
                </div>

                {/* Aula Calendar List */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Cronograma de Aulas ({aulas.length})
                  </h4>
                  {aulas.length > 0 ? (
                    <div className="space-y-2">
                      {aulas.map((aula: any, i: number) => {
                        const dataObj = aula.data_aula ? new Date(aula.data_aula + 'T12:00:00') : null;
                        const diaSemana = dataObj ? diasSemana[dataObj.getDay()] : '';
                        const dataFormatada = dataObj ? dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : 'Sem data';

                        return (
                          <div key={aula.id_parte || i} className="flex items-center gap-3 bg-background border rounded-lg p-3 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-bold shrink-0">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">Aula {toRoman(i + 1)}</span>
                                {diaSemana && (
                                  <Badge variant="outline" className="text-[9px] font-normal">{diaSemana}</Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {dataFormatada}
                                </span>
                                {aula.hora_inicio && (
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
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
                    <div className="text-center py-6 bg-muted/10 rounded-lg border border-dashed text-sm text-muted-foreground italic">
                      Nenhuma aula cadastrada para este módulo.
                    </div>
                  )}
                </div>

                {/* Teste de Conhecimento Buttons */}
                <div className="border-t pt-4 space-y-2">
                  <Button
                    className="w-full gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-md"
                    onClick={() => handleOpenTesteEditor(selectedModule)}
                  >
                    <ClipboardList className="w-4 h-4" />
                    Editar Teste de Conhecimento
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800 hover:bg-violet-50 dark:hover:bg-violet-950/30"
                    onClick={async () => {
                      try {
                        const headers = await getAuthHeader();
                        const res = await fetch(
                          `https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud?view=teste&id_modulo=${selectedModule.id_modulo}`,
                          { headers }
                        );
                        if (res.ok) {
                          const data = await res.json();
                          if (data?.id_teste) {
                            const link = `${window.location.origin}/teste/${data.id_teste}`;
                            await navigator.clipboard.writeText(link);
                            toast.success("Link copiado para a área de transferência!");
                          } else {
                            toast.error("Crie um teste primeiro antes de gerar o link.");
                          }
                        }
                      } catch {
                        toast.error("Erro ao gerar link do teste.");
                      }
                    }}
                  >
                    <Copy className="w-4 h-4" />
                    Copiar Link do Teste
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ══════════ TEST EDITOR OVERLAY ══════════ */}
      <Dialog open={testeEditorOpen} onOpenChange={setTesteEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-violet-500" />
              Teste de Conhecimento
              {selectedModule && (
                <Badge variant="outline" className="ml-2 font-normal">
                  {moduloLabel((selectedModule.ordem ?? 1) - 1, selectedModule.modulo?.nome || selectedModule.nome)}
                </Badge>
              )}
              {/* Status indicator */}
              {testeData && (
                <div className="ml-auto flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${testeData.ativo !== false ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30 animate-pulse' : 'bg-red-500 shadow-lg shadow-red-500/30'}`} />
                  <span className={`text-xs font-medium ${testeData.ativo !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {testeData.ativo !== false ? 'No ar' : 'Inativo'}
                  </span>
                  {testeData.ativo !== false ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      onClick={() => { setMotivoInatividade(""); setConfirmInativarOpen(true); }}
                    >Inativar</Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px] text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                      onClick={() => setConfirmReativarOpen(true)}
                    >Reativar</Button>
                  )}
                  {/* Teste Extra Button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5 text-[10px] ml-1 bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800"
                    onClick={() => handleOpenTesteExtra(testeData.id_teste, selectedModuleTraining.id_treinamento)}
                  >
                    <UserCheck className="w-3 h-3" />
                    Teste Extra
                  </Button>
                </div>
              )}

            </DialogTitle>
            <DialogDescription>
              Crie perguntas objetivas com alternativas. A nota total é calculada automaticamente.
            </DialogDescription>
          </DialogHeader>

          {isLoadingTeste ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent animate-spin rounded-full" />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
              {/* Agendamento */}
              <div className="bg-muted/20 rounded-lg p-4 border space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Agendamento
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Data/Hora Abertura</Label>
                    <Input
                      type="datetime-local"
                      value={testeDataAbertura}
                      onChange={(e) => setTesteDataAbertura(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Data/Hora Fechamento</Label>
                    <Input
                      type="datetime-local"
                      value={testeDataFechamento}
                      onChange={(e) => setTesteDataFechamento(e.target.value)}
                      className="h-9 text-xs"
                    />
                  </div>
                </div>
                {testeData?.motivo_inatividade && testeData?.ativo === false && (
                  <div className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 rounded-lg p-2.5 border border-red-200 dark:border-red-800">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span><strong>Motivo da inatividade:</strong> {testeData.motivo_inatividade}</span>
                  </div>
                )}
              </div>

              {/* Nota Total */}
              <div className="flex items-center justify-between bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 border border-violet-200 dark:border-violet-800 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                  <span className="text-sm font-semibold text-violet-700 dark:text-violet-300">Nota Total do Teste</span>
                </div>
                <span className="text-2xl font-bold text-violet-600 dark:text-violet-400">
                  {totalNotaTeste.toFixed(1)}
                </span>
              </div>

              {/* Perguntas */}
              {testePerguntas.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <ClipboardList className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                  <p className="text-muted-foreground text-sm">Nenhuma pergunta cadastrada.</p>
                  <p className="text-muted-foreground text-xs mt-1">Clique em "Adicionar Pergunta" para começar.</p>
                </div>
              ) : (
                testePerguntas.map((pergunta: any, pIdx: number) => (
                  <Card key={pergunta.id_pergunta} className="border shadow-sm overflow-hidden">
                    <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Pergunta {pIdx + 1}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5">
                          <Label className="text-[10px] text-muted-foreground">Valor:</Label>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            value={pergunta.valor_nota}
                            onChange={(e) => {
                              const updated = [...testePerguntas];
                              updated[pIdx] = { ...updated[pIdx], valor_nota: parseFloat(e.target.value) || 0 };
                              setTestePerguntas(updated);
                            }}
                            className="w-16 h-7 text-xs text-center font-bold text-violet-600 dark:text-violet-400"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleRemovePergunta(pIdx)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-4 space-y-3">
                      <Textarea
                        placeholder="Digite o enunciado da pergunta..."
                        value={pergunta.enunciado}
                        onChange={(e) => {
                          const updated = [...testePerguntas];
                          updated[pIdx] = { ...updated[pIdx], enunciado: e.target.value };
                          setTestePerguntas(updated);
                        }}
                        className="min-h-[60px] text-sm resize-none"
                      />

                      {/* Alternativas */}
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                          Alternativas
                          <span className="text-[9px] font-normal">(clique no círculo para definir a correta)</span>
                        </Label>
                        {(pergunta.alternativas || []).map((alt: any, aIdx: number) => (
                          <div key={alt.id_alternativa} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSetCorreta(pIdx, aIdx)}
                              className={cn(
                                "w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                                alt.is_correta
                                  ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/30"
                                  : "border-muted-foreground/30 hover:border-muted-foreground/60"
                              )}
                              title={alt.is_correta ? "Resposta correta" : "Marcar como correta"}
                            >
                              {alt.is_correta && <Check className="w-3.5 h-3.5" />}
                            </button>
                            <Input
                              placeholder={`Alternativa ${String.fromCharCode(65 + aIdx)}...`}
                              value={alt.texto}
                              onChange={(e) => {
                                const updated = [...testePerguntas];
                                const p = { ...updated[pIdx] };
                                const alts = [...(p.alternativas || [])];
                                alts[aIdx] = { ...alts[aIdx], texto: e.target.value };
                                p.alternativas = alts;
                                updated[pIdx] = p;
                                setTestePerguntas(updated);
                              }}
                              className={cn(
                                "flex-1 h-9 text-sm",
                                alt.is_correta && "border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20"
                              )}
                            />
                            {(pergunta.alternativas?.length || 0) > 2 && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => handleRemoveAlternativa(pIdx, aIdx)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        ))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-muted-foreground hover:text-foreground gap-1 h-7"
                          onClick={() => handleAddAlternativa(pIdx)}
                        >
                          <Plus className="w-3 h-3" />
                          Alternativa
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Add Question Button */}
              <Button
                variant="outline"
                className="w-full gap-2 border-dashed border-2 text-muted-foreground hover:text-foreground hover:border-violet-300"
                onClick={handleAddPergunta}
              >
                <Plus className="w-4 h-4" />
                Adicionar Pergunta
              </Button>
            </div>
          )}

          <DialogFooter className="flex flex-row items-center justify-between border-t pt-4">
            <div className="flex-1 text-left">
              {testeData?.id_teste && (
                <Button
                  variant="ghost"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 px-2 text-xs"
                  onClick={() => setConfirmDeleteTesteOpen(true)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir Teste
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setTesteEditorOpen(false)}>Fechar</Button>
              <Button
                onClick={handleSaveTeste}
                disabled={isSavingTeste || testePerguntas.length === 0}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-1"
              >
                <Save className="w-4 h-4" />
                {isSavingTeste ? 'Salvando...' : 'Salvar Teste'}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Delete Teste */}
      <AlertDialog open={confirmDeleteTesteOpen} onOpenChange={setConfirmDeleteTesteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Excluir Teste de Conhecimento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente o teste e todas as suas perguntas e alternativas. Não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTeste} className="bg-destructive hover:bg-destructive/90">
              Excluir teste
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════ INATIVAR TESTE DIALOG ══════════ */}
      <AlertDialog open={confirmInativarOpen} onOpenChange={setConfirmInativarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Inativar Teste de Conhecimento
            </AlertDialogTitle>
            <AlertDialogDescription>
              O teste ficará offline e não aceitará novas respostas. Informe o motivo da inativação:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Motivo da inatividade (obrigatório)..."
              value={motivoInatividade}
              onChange={(e) => setMotivoInatividade(e.target.value)}
              className="min-h-[80px] text-sm resize-none"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={!motivoInatividade.trim()}
              onClick={async () => {
                if (!testeData?.id_teste || !motivoInatividade.trim()) return;
                try {
                  const headers = await getAuthHeader();
                  const res = await fetch(
                    `https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud?view=teste&id_teste=${testeData.id_teste}`,
                    {
                      method: "PATCH",
                      headers: { ...headers, "Content-Type": "application/json" },
                      body: JSON.stringify({ ativo: false, motivo_inatividade: motivoInatividade.trim() })
                    }
                  );
                  if (res.ok) {
                    const updated = await res.json();
                    setTesteData((prev: any) => ({ ...prev, ativo: false, motivo_inatividade: motivoInatividade.trim() }));
                    setConfirmInativarOpen(false);
                    toast.success("Teste inativado com sucesso.");
                  }
                } catch (err: any) {
                  toast.error(err.message || "Erro ao inativar teste.");
                }
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Confirmar Inativação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════ REATIVAR TESTE DIALOG ══════════ */}
      <AlertDialog open={confirmReativarOpen} onOpenChange={setConfirmReativarOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-emerald-600 flex items-center gap-2">
              <Check className="w-5 h-5" />
              Reativar Teste de Conhecimento
            </AlertDialogTitle>
            <AlertDialogDescription>
              O teste voltará a ficar disponível para os alunos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {testeData?.motivo_inatividade && (
            <div className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 border border-amber-200 dark:border-amber-800">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold text-xs mb-0.5">Motivo da inativação anterior:</p>
                <p>{testeData.motivo_inatividade}</p>
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!testeData?.id_teste) return;
                try {
                  const headers = await getAuthHeader();
                  const res = await fetch(
                    `https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/treinamentos-crud?view=teste&id_teste=${testeData.id_teste}`,
                    {
                      method: "PATCH",
                      headers: { ...headers, "Content-Type": "application/json" },
                      body: JSON.stringify({ ativo: true, motivo_inatividade: null })
                    }
                  );
                  if (res.ok) {
                    setTesteData((prev: any) => ({ ...prev, ativo: true, motivo_inatividade: null }));
                    setConfirmReativarOpen(false);
                    toast.success("Teste reativado com sucesso!");
                  }
                } catch (err: any) {
                  toast.error(err.message || "Erro ao reativar teste.");
                }
              }}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Confirmar Reativação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════ TESTE EXTRA PARTICIPANTS DIALOG ══════════ */}
      <Dialog open={isTesteExtraOpen} onOpenChange={setIsTesteExtraOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-violet-500" />
              Participantes - Teste Extra
            </DialogTitle>
            <DialogDescription>
              Conceda permissão para alunos específicos realizarem o teste mesmo excedendo tentativas ou se o teste estiver expirado.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4 flex-1 flex flex-col overflow-hidden">
            <SearchInput
              placeholder="Buscar por nome ou CPF..."
              value={testeExtraSearch}
              onChange={(e) => setTesteExtraSearch(e.target.value)}
              className="h-9"
            />

            {isLoadingTesteExtra ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent animate-spin rounded-full" />
              </div>
            ) : (
              <ScrollArea className="flex-1 pr-3">
                <div className="space-y-2">
                  {filteredExtraAlunos.length > 0 ? (
                    filteredExtraAlunos.map((aluno) => (
                      <div 
                        key={aluno.id_aluno}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium leading-none">{aluno.nome}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">{aluno.cpf}</span>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <Badge 
                            variant={aluno.tem_permissao ? "default" : "secondary"}
                            className={`text-[10px] py-0 h-4 ${aluno.tem_permissao ? 'bg-violet-500 hover:bg-violet-600' : ''}`}
                          >
                            {aluno.tem_permissao ? 'Permitido' : 'Padrão'}
                          </Badge>
                          
                          <Button
                            variant={aluno.tem_permissao ? "destructive" : "outline"}
                            size="sm"
                            className="h-7 px-2 text-[10px]"
                            onClick={() => handleToggleTesteExtra(aluno.id_aluno, aluno.tem_permissao)}
                          >
                            {aluno.tem_permissao ? 'Revogar' : 'Conceder'}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-10 text-muted-foreground">
                      <Users className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Nenhum aluno encontrado.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button className="w-full sm:w-auto" onClick={() => setIsTesteExtraOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}