import { useState, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { supabase } from "../lib/supabase";

function toRoman(n: number): string {
  const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
  const syms=['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
  let r='';
  for(let i=0;i<vals.length;i++){while(n>=vals[i]){r+=syms[i];n-=vals[i];}}
  return r;
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Save,
  X,
  GraduationCap,
  AlertTriangle,
} from "lucide-react";
import { SearchInput } from "../components/ui/search-input";
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

const API_BASE = "https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/alunos-crud";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
  id_aluno: string;
  nome: string;
  cpf: string;
  data_nascimento?: string;
  cargo?: string;
  data_cadastro?: string;
  id_empresa?: string;
  empresa?: { id_empresa: string; nome: string };
  entidade?: {
    id_entidade: string;
    contato?: Array<{
      id_contato: string;
      contato_email?: Array<{ email: string }>;
      contato_telefone?: Array<{ numero: string }>;
    }>;
  };
  email?: string;
  telefone?: string;
}

interface Treinamento {
  id_treinamento: string;
  nome: string;
  status?: string;
  nota_minima_modulo?: number;
  nota_minima_curso?: number;
  presenca_minima_porcentagem?: number;
}

interface ModuloTreinamento {
  id_modulo: string;
  ordem: number;
  hora_inicio: string | null;
  modulo: { id_modulo: string; nome: string };
  aulas?: Array<{ id_aula: string; ordem: number; hora_inicio: string | null; hora_fim: string | null }>;
}

interface Presenca {
  id_presenca?: string;
  id_aluno: string;
  id_treinamento: string;
  id_modulo: string;
  id_aula?: string | null;
  pontualidade: string | null;
  camera_aberta: boolean;
  participacao: boolean;
  presenca: boolean;
  justificativa_falta: boolean;
  nota: number | null;
}

interface AlunoCompleto {
  id_aluno: string;
  nome: string;
  cpf: string;
  cargo: string;
  empresa: string;
  telefone: string;
  presencas: Presenca[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAuthHeader() {
  const session = await supabase.auth.getSession();
  return { Authorization: `Bearer ${session.data.session?.access_token}` };
}

function calcMediaAluno(aluno: AlunoCompleto, modulos: ModuloTreinamento[]): string {
  const notas = modulos
    .map((m) => {
      const p = aluno.presencas.find((pr) => pr.id_modulo === m.id_modulo);
      return p?.nota ?? null;
    })
    .filter((n) => n !== null) as number[];
  if (notas.length === 0) return "-";
  const avg = notas.reduce((a, b) => a + b, 0) / notas.length;
  return avg.toFixed(1);
}

// ─── Utilities ─────────────────────────────────────────────────────────────

const formatCPF = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const formatPhone = (v: string) => {
  const digits = v.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
};

const onlyDigits = (v: string) => v.replace(/\D/g, "");

// ─── Components ────────────────────────────────────────────────────────────────

export function Alunos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"simples" | "completa">("simples");

  // ── Visualização Simples ──────────────────────────────────────────────────
  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeader();
      const response = await fetch(API_BASE, { headers });
      if (response.ok) {
        const data = await response.json();
        const alArray = Array.isArray(data) ? data : [];
        const mapped = alArray.map((s: any) => ({
          ...s,
          email: s.entidade?.contato?.[0]?.contato_email?.[0]?.email || "",
          telefone: s.entidade?.contato?.[0]?.contato_telefone?.[0]?.numero || "",
        }));
        setStudents(mapped);
      }
    } catch (err) {
      console.error("Erro ao buscar alunos:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const response = await fetch(
        "https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/empresas-crud",
        { headers }
      );
      if (response.ok) {
        const data = await response.json();
        setCompanies(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Erro ao buscar empresas:", err);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
    fetchCompanies();
  }, [fetchStudents, fetchCompanies]);

  // ── Sort ─────────────────────────────────────────────────────────────────
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Student | "";
    direction: "asc" | "desc";
  }>({ key: "nome", direction: "asc" });

  const handleSort = (key: keyof Student) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key: keyof Student) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 text-blue-600 dark:text-blue-400" />
    );
  };

  const filteredStudents = (students || [])
    .filter(
      (s) =>
        (s.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.cpf || "").includes(searchTerm) ||
        (s.empresa?.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const av = a[sortConfig.key];
      const bv = b[sortConfig.key];
      if (av === undefined || bv === undefined) return 0;
      if (av < bv) return sortConfig.direction === "asc" ? -1 : 1;
      if (av > bv) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  // ── Modais aluno (CRUD simples) ────────────────────────────────────────────
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [isStudentDirty, setIsStudentDirty] = useState(false);
  const [discardStudentConfirmOpen, setDiscardStudentConfirmOpen] = useState(false);
  const [saveStudentConfirmOpen, setSaveStudentConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student);
    setDetailModalOpen(true);
    setIsEditingStudent(false);
    setIsStudentDirty(false);
  };

  const handleAddNewStudent = () => {
    setSelectedStudent({
      id_aluno: "",
      nome: "",
      cpf: "",
      cargo: "",
      email: "",
      telefone: "",
      id_empresa: "",
      data_nascimento: "",
    });
    setIsEditingStudent(true);
    setDetailModalOpen(true);
    setIsStudentDirty(false);
  };

  const handleCancelEdit = () => {
    if (isStudentDirty) setDiscardStudentConfirmOpen(true);
    else setIsEditingStudent(false);
  };

  const confirmDiscardEdit = () => {
    setDiscardStudentConfirmOpen(false);
    setIsEditingStudent(false);
    setIsStudentDirty(false);
  };

  const handleSaveStudent = () => setSaveStudentConfirmOpen(true);

  const confirmSaveStudent = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      const isNew = !selectedStudent.id_aluno;
      const method = isNew ? "POST" : "PUT";
      const url = isNew
        ? API_BASE
        : `${API_BASE}?id=${selectedStudent.id_aluno}`;
      const headers = await getAuthHeader();
      const res = await fetch(url, {
        method,
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...selectedStudent,
          cpf: onlyDigits(selectedStudent.cpf),
          cargo: selectedStudent.cargo || null,
          id_empresa: selectedStudent.id_empresa || null,
          email: selectedStudent.email || null,
          telefone: onlyDigits(selectedStudent.telefone || ""),
          data_nascimento: selectedStudent.data_nascimento || null,
        }),
      });
      if (res.ok) {
        setSaveStudentConfirmOpen(false);
        setIsEditingStudent(false);
        setIsStudentDirty(false);
        setDetailModalOpen(false);
        fetchStudents();
      } else {
        const err = await res.json();
        alert(`Erro ao salvar aluno: ${err.error || "Erro desconhecido"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro na requisição de salvamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteStudent = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}?id=${selectedStudent.id_aluno}`, {
        method: "DELETE",
        headers,
      });
      if (res.ok) {
        setDeleteConfirmOpen(false);
        setDetailModalOpen(false);
        fetchStudents();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Visualização Completa ─────────────────────────────────────────────────
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);
  const [selectedTreinamento, setSelectedTreinamento] = useState<string>("");
  const [trainingSearch, setTrainingSearch] = useState("");
  const [showTrainingDropdown, setShowTrainingDropdown] = useState(false);
  const [filterYear, setFilterYear] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState<string>("all");
  const [filterDateType, setFilterDateType] = useState<"inicio" | "fim">("inicio");
  
  const [modulos, setModulos] = useState<ModuloTreinamento[]>([]);
  const [alunosCompletos, setAlunosCompletos] = useState<AlunoCompleto[]>([]);
  const [isLoadingCompleta, setIsLoadingCompleta] = useState(false);

  // Modo edição da planilha
  const [isEditingPlanilha, setIsEditingPlanilha] = useState(false);
  const [editedPresencas, setEditedPresencas] = useState<Record<string, Presenca>>({});
  const [cancelPlanilhaConfirmOpen, setCancelPlanilhaConfirmOpen] = useState(false);
  const [savePlanilhaConfirmOpen, setSavePlanilhaConfirmOpen] = useState(false);
  const [isSavingPlanilha, setIsSavingPlanilha] = useState(false);

  const fetchTreinamentos = useCallback(async () => {
    try {
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}?view=treinamentos`, { headers });
      if (res.ok) setTreinamentos(await res.json());
    } catch (err) {
      console.error("Erro ao buscar treinamentos:", err);
    }
  }, []);

  useEffect(() => {
    if (viewMode === "completa") fetchTreinamentos();
  }, [viewMode, fetchTreinamentos]);

  const fetchCompleta = useCallback(async (idTreinamento: string) => {
    if (!idTreinamento) return;
    setIsLoadingCompleta(true);
    setIsEditingPlanilha(false);
    setEditedPresencas({});
    try {
      const headers = await getAuthHeader();
      const res = await fetch(
        `${API_BASE}?view=completa&id_treinamento=${idTreinamento}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        setModulos(data.modulos ?? []);
        setAlunosCompletos(data.alunos ?? []);
      }
    } catch (err) {
      console.error("Erro ao buscar visualização completa:", err);
    } finally {
      setIsLoadingCompleta(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTreinamento) fetchCompleta(selectedTreinamento);
  }, [selectedTreinamento, fetchCompleta]);

  // ── Funções do modo edição ────────────────────────────────────────────────

  /** Retorna a presença atual (editada ou original) de um aluno num módulo, ou numa aula específica */
  const getPresenca = (idAluno: string, idModulo: string, idAula?: string): Presenca | undefined => {
    const key = idAula ? `${idAluno}__${idModulo}__${idAula}` : `${idAluno}__${idModulo}`;
    if (editedPresencas[key]) return editedPresencas[key];
    const aluno = alunosCompletos.find((a) => a.id_aluno === idAluno);
    return aluno?.presencas.find((p) => p.id_modulo === idModulo && (idAula ? p.id_aula === idAula : true));
  };

  const updatePresenca = (
    idAluno: string,
    idModulo: string,
    idAula: string | undefined,
    field: keyof Presenca,
    value: any
  ) => {
    const key = idAula ? `${idAluno}__${idModulo}__${idAula}` : `${idAluno}__${idModulo}`;
    // Procure no array se já existe a original específica ou fallback pra a do modulo
    let original = (() => {
      const aluno = alunosCompletos.find((a) => a.id_aluno === idAluno);
      return aluno?.presencas.find((p) => p.id_modulo === idModulo && (idAula ? p.id_aula === idAula : true));
    })();
    
    // Se nem o fallback existir, é porque não tem registro da presenca no DB, criamos mockup.
    if (!original) {
      original = {
        id_aluno: idAluno,
        id_treinamento: selectedTreinamento,
        id_modulo: idModulo,
        id_aula: idAula || null,
        pontualidade: null,
        camera_aberta: true,
        participacao: false,
        presenca: false,
        justificativa_falta: false,
        nota: null,
      };
    }
    
    const current = editedPresencas[key] ?? original;
    setEditedPresencas((prev) => ({
      ...prev,
      [key]: { ...current, [field]: value },
    }));
  };

  const handleEnterEditPlanilha = () => {
    setEditedPresencas({});
    setIsEditingPlanilha(true);
  };

  const handleCancelPlanilha = () => {
    setCancelPlanilhaConfirmOpen(true);
  };

  const confirmCancelPlanilha = () => {
    setEditedPresencas({});
    setIsEditingPlanilha(false);
    setCancelPlanilhaConfirmOpen(false);
  };

  const handleSavePlanilha = () => setSavePlanilhaConfirmOpen(true);

  const confirmSavePlanilha = async () => {
    setIsSavingPlanilha(true);
    try {
      const registros = Object.values(editedPresencas);
      if (registros.length === 0) {
        setIsEditingPlanilha(false);
        setSavePlanilhaConfirmOpen(false);
        return;
      }
      const headers = await getAuthHeader();
      const res = await fetch(`${API_BASE}?view=presenca`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ registros }),
      });
      if (res.ok) {
        setSavePlanilhaConfirmOpen(false);
        setIsEditingPlanilha(false);
        setEditedPresencas({});
        await fetchCompleta(selectedTreinamento);
      } else {
        const err = await res.json();
        alert(`Erro ao salvar: ${err.error || "Erro desconhecido"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro na requisição de salvamento");
    } finally {
      setIsSavingPlanilha(false);
    }
  };

  // ── Filtro de busca na planilha ────────────────────────────────────────────
  const filteredAlunosCompletos = alunosCompletos.filter(
    (a) =>
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.telefone || "").includes(searchTerm)
  );

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o cadastro e informações dos alunos
          </p>
        </div>
        {viewMode === "simples" && (
          <Button className="gap-2" onClick={handleAddNewStudent}>
            <Plus className="w-4 h-4" />
            Cadastrar Aluno
          </Button>
        )}
      </div>

      {/* Top Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder={
                viewMode === "simples"
                  ? "Buscar por nome, CPF, empresa..."
                  : "Buscar por nome, empresa, telefone..."
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium whitespace-nowrap">Visualização:</Label>
            <RadioGroup
              value={viewMode}
              onValueChange={(v) => {
                setViewMode(v as any);
                setSearchTerm("");
              }}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="simples" id="view-simples" />
                <Label htmlFor="view-simples" className="cursor-pointer whitespace-nowrap">
                  Simples
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="completa" id="view-completa" />
                <Label htmlFor="view-completa" className="cursor-pointer whitespace-nowrap">
                  Completa
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </Card>

      {/* ── Visualização Simples ────────────────────────────────────────────── */}
      {viewMode === "simples" && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {(
                    [
                      ["nome", "Nome"],
                      ["cpf", "CPF"],
                      ["id_empresa", "Empresa"],
                      ["telefone", "Telefone"],
                      ["email", "E-mail"],
                      ["data_nascimento", "Nascimento"],
                      ["cargo", "Cargo"],
                      ["data_cadastro", "Matrícula"],
                    ] as [keyof Student, string][]
                  ).map(([key, label]) => (
                    <TableHead
                      key={key}
                      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
                      onClick={() => handleSort(key)}
                    >
                      <div className="flex items-center whitespace-nowrap">
                        {label} {getSortIcon(key)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Carregando alunos...
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <p className="text-muted-foreground opacity-60 italic">
                        Nenhum aluno encontrado.
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow
                      key={student.id_aluno}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => handleRowClick(student)}
                    >
                      <TableCell className="font-medium">{student.nome}</TableCell>
                      <TableCell className="text-muted-foreground">{formatCPF(student.cpf)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{student.empresa?.nome || "Independente"}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatPhone(student.telefone || "") || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{student.email || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.data_nascimento
                          ? new Date(student.data_nascimento + "T00:00:00").toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{student.cargo || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.data_cadastro
                          ? new Date(student.data_cadastro).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* ── Visualização Completa ────────────────────────────────────────────── */}
      {viewMode === "completa" && (
        <div className="space-y-4">
          {/* Barra de Busca e Filtros de Treinamento */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              {/* Busca de Treinamento */}
              <div className="md:col-span-2 relative">
                <Label className="text-xs mb-1.5 block">Treinamento</Label>
                <div className="relative">
                  <SearchInput
                    placeholder="Pesquisar treinamento..."
                    value={trainingSearch}
                    onChange={(e) => {
                      setTrainingSearch(e.target.value);
                      setShowTrainingDropdown(true);
                      if (!e.target.value && selectedTreinamento) {
                        setSelectedTreinamento("");
                      }
                    }}
                    onFocus={() => setShowTrainingDropdown(true)}
                  />
                  {showTrainingDropdown && trainingSearch.length > 0 && (
                    <Card className="absolute z-50 w-full mt-1 max-h-[300px] overflow-auto shadow-xl border-blue-500/20">
                      <div className="p-1">
                        {treinamentos
                          .filter(t => t.nome.toLowerCase().includes(trainingSearch.toLowerCase()))
                          .map((t) => (
                            <div
                              key={t.id_treinamento}
                              className="px-3 py-2 cursor-pointer hover:bg-blue-500/10 rounded-md text-sm flex items-center justify-between group"
                              onClick={() => {
                                setSelectedTreinamento(t.id_treinamento);
                                setTrainingSearch(t.nome);
                                setShowTrainingDropdown(false);
                              }}
                            >
                              <span>{t.nome}</span>
                              <Badge variant="outline" className="text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
                                Selecionar
                              </Badge>
                            </div>
                          ))}
                        {treinamentos.filter(t => t.nome.toLowerCase().includes(trainingSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-4 text-center text-muted-foreground italic text-sm">
                            Nenhum treinamento encontrado.
                          </div>
                        )}
                      </div>
                    </Card>
                  )}
                </div>
              </div>

              {/* Filtro Ano */}
              <div className="space-y-1">
                <Label className="text-xs">Ano</Label>
                <Select value={filterYear} onValueChange={setFilterYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os anos</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro Mês */}
              <div className="space-y-1">
                <Label className="text-xs">Mês</Label>
                <Select value={filterMonth} onValueChange={setFilterMonth}>
                  <SelectTrigger>
                    <SelectValue placeholder="Mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    <SelectItem value="01">Janeiro</SelectItem>
                    <SelectItem value="02">Fevereiro</SelectItem>
                    <SelectItem value="03">Março</SelectItem>
                    <SelectItem value="04">Abril</SelectItem>
                    <SelectItem value="05">Maio</SelectItem>
                    <SelectItem value="06">Junho</SelectItem>
                    <SelectItem value="07">Julho</SelectItem>
                    <SelectItem value="08">Agosto</SelectItem>
                    <SelectItem value="09">Setembro</SelectItem>
                    <SelectItem value="10">Outubro</SelectItem>
                    <SelectItem value="11">Novembro</SelectItem>
                    <SelectItem value="12">Dezembro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-muted/30 p-3 rounded-lg border border-border/50">
              <div className="flex items-center gap-4">
                <Label className="text-xs font-semibold uppercase opacity-70">Filtrar por data de:</Label>
                <RadioGroup
                  value={filterDateType}
                  onValueChange={(v) => setFilterDateType(v as any)}
                  className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inicio" id="dt-inicio" />
                    <Label htmlFor="dt-inicio" className="text-xs cursor-pointer">Início</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fim" id="dt-fim" />
                    <Label htmlFor="dt-fim" className="text-xs cursor-pointer">Encerramento</Label>
                  </div>
                </RadioGroup>
              </div>

              {selectedTreinamento && alunosCompletos.length > 0 && (
                <div className="flex items-center gap-2">
                  {isEditingPlanilha ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={handleCancelPlanilha}
                        disabled={isSavingPlanilha}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Descartar
                      </Button>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                        onClick={handleSavePlanilha}
                        disabled={isSavingPlanilha}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {isSavingPlanilha ? "Salvando..." : "Salvar Chamada"}
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-500/30 text-blue-600 hover:bg-blue-500/5"
                      onClick={handleEnterEditPlanilha}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Editar Chamada
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Aviso de modo edição */}
          {isEditingPlanilha && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                <strong>Modo edição ativo.</strong> As alterações só serão salvas no banco de dados
                ao confirmar em "Salvar Alterações". Fechar a aba descartará todas as mudanças.
              </span>
            </div>
          )}

          {/* Tabela planilha */}
          {!selectedTreinamento ? (
            <Card className="p-12 text-center border-dashed border-2 bg-muted/10">
              <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <p className="text-muted-foreground font-medium">
                Selecione um treinamento para visualizar a lista de chamada
              </p>
              <p className="text-muted-foreground text-sm mt-1 opacity-60">
                O filtro por treinamento é obrigatório pois um mesmo aluno pode estar em múltiplos treinamentos.
              </p>
            </Card>
          ) : isLoadingCompleta ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">Carregando dados...</p>
            </Card>
          ) : alunosCompletos.length === 0 ? (
            <Card className="p-12 text-center border-dashed border-2 bg-muted/10">
              <p className="text-muted-foreground italic">
                Nenhum aluno vinculado a este treinamento.
              </p>
            </Card>
          ) : (
            <Card className={`overflow-hidden transition-all duration-200 ${isEditingPlanilha ? "ring-2 ring-amber-500/50" : ""}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    {/* Linha 1: grupos de módulos */}
                    <tr>
                      {/* Colunas fixas */}
                      <th
                        rowSpan={2}
                        className="border border-border bg-muted/60 px-3 py-2 text-left font-semibold whitespace-nowrap sticky left-0 z-10 min-w-[180px]"
                      >
                        Nome Completo
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-border bg-muted/60 px-3 py-2 text-left font-semibold whitespace-nowrap min-w-[140px]"
                      >
                        Empresa
                      </th>
                      <th
                        rowSpan={2}
                        className="border border-border bg-muted/60 px-3 py-2 text-left font-semibold whitespace-nowrap min-w-[120px]"
                      >
                        Telefone
                      </th>
                      {/* Cabeçalhos de módulos */}
                      {modulos.map((m, idx) => {
                        const hasMultipleAulas = m.aulas && m.aulas.length > 1;
                        // Presenca, Pont, Status, Apareceu, Justif, Cam, Part = 7 colunas por aula
                        // + Nota no final do modulo
                        const colCountPerAula = 7;
                        const colSpan = hasMultipleAulas ? (m.aulas!.length * colCountPerAula) + 1 : colCountPerAula + 1;
                        
                        const label = m.modulo?.nome?.trim()
                          ? `Módulo ${toRoman(idx + 1)} — ${m.modulo.nome.trim()}`
                          : `Módulo ${toRoman(idx + 1)}`;
                          
                        return (
                          <th
                            key={m.id_modulo}
                            colSpan={colSpan}
                            className="border border-border bg-blue-600/10 dark:bg-blue-500/15 px-3 py-2 text-center font-semibold text-blue-700 dark:text-blue-400 whitespace-nowrap"
                          >
                            {label}
                            {m.hora_inicio && !hasMultipleAulas && (
                              <span className="ml-1.5 text-xs font-normal opacity-70">
                                ({m.hora_inicio.slice(0, 5)})
                              </span>
                            )}
                          </th>
                        );
                      })}
                      {/* Média */}
                      <th
                        rowSpan={2}
                        className="border border-border bg-muted/60 px-3 py-2 text-center font-semibold whitespace-nowrap min-w-[60px]"
                      >
                        Média
                      </th>
                    </tr>
                    {/* Linha 2: subcolunas */}
                    <tr>
                      {modulos.map((m) => {
                        const hasMultipleAulas = m.aulas && m.aulas.length > 1;
                        const renderCols = (id: string, labelSuffix: string = "") => (
                          <React.Fragment key={`${id}-cols`}>
                            <th className="border border-border bg-muted/40 px-1 py-1 text-center text-[10px] font-medium text-muted-foreground whitespace-nowrap min-w-[40px]">Pres.{labelSuffix}</th>
                            <th className="border border-border bg-muted/40 px-1 py-1 text-center text-[10px] font-medium text-muted-foreground whitespace-nowrap min-w-[70px]">Entrada{labelSuffix}</th>
                            <th className="border border-border bg-muted/40 px-1 py-1 text-center text-[10px] font-medium text-muted-foreground whitespace-nowrap min-w-[70px]">Status{labelSuffix}</th>
                            <th className="border border-border bg-muted/40 px-1 py-1 text-center text-[10px] font-medium text-muted-foreground whitespace-nowrap min-w-[40px]">Apar.{labelSuffix}</th>
                            <th className="border border-border bg-muted/40 px-1 py-1 text-center text-[10px] font-medium text-muted-foreground whitespace-nowrap min-w-[40px]">Just.{labelSuffix}</th>
                            <th className="border border-border bg-muted/40 px-1 py-1 text-center text-[10px] font-medium text-muted-foreground whitespace-nowrap min-w-[40px]">Câm.{labelSuffix}</th>
                            <th className="border border-border bg-muted/40 px-1 py-1 text-center text-[10px] font-medium text-muted-foreground whitespace-nowrap min-w-[40px]">Part.{labelSuffix}</th>
                          </React.Fragment>
                        );

                        if (hasMultipleAulas) {
                          return (
                            <React.Fragment key={m.id_modulo}>
                              {m.aulas!.sort((a,b) => a.ordem - b.ordem).map((aula, aIdx) => (
                                <React.Fragment key={`${m.id_modulo}-${aula.id_aula}`}>
                                  {renderCols(aula.id_aula, ` (A${aIdx+1})`)}
                                </React.Fragment>
                              ))}
                              <th className="border border-border bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1.5 text-center text-xs font-semibold text-indigo-700 dark:text-indigo-300 whitespace-nowrap min-w-[60px]">Nota</th>
                            </React.Fragment>
                          );
                        } else {
                          return (
                            <React.Fragment key={m.id_modulo}>
                              {renderCols(m.id_modulo)}
                              <th className="border border-border bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1.5 text-center text-xs font-semibold text-indigo-700 dark:text-indigo-300 whitespace-nowrap min-w-[60px]">Nota</th>
                            </React.Fragment>
                          );
                        }
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAlunosCompletos.map((aluno, rowIdx) => (
                      <tr
                        key={aluno.id_aluno}
                        className={`transition-colors ${
                          rowIdx % 2 === 0 ? "bg-background" : "bg-muted/20"
                        } hover:bg-muted/30`}
                      >
                        {/* Nome */}
                        <td className="border border-border px-3 py-2 font-medium sticky left-0 z-10 bg-inherit whitespace-nowrap">
                          {aluno.nome}
                        </td>
                        {/* Empresa */}
                        <td className="border border-border px-3 py-2">
                          <Badge variant="outline" className="text-xs">
                            {aluno.empresa}
                          </Badge>
                        </td>
                        {/* Telefone */}
                        <td className="border border-border px-3 py-2 text-muted-foreground whitespace-nowrap">
                          {formatPhone(aluno.telefone || "") || "-"}
                        </td>

                        {/* Células por módulo */}
                        {modulos.map((m) => {
                          const hasMultipleAulas = m.aulas && m.aulas.length > 1;
                          const isEditing = isEditingPlanilha;
                          
                          const renderPresencaFields = (presenca: Presenca | undefined, idAula: string | undefined, horaInicioOficial: string | null) => {
                            // PONTUALIDADE LOGIC
                            // Regras: 
                            // 1. Chegou antes ou igual ao horário = pontual
                            // 2. Chegou > inicio + atraso (5 min default) = atrasado
                            // 3. Chegou > inicio + falta (15 min default) = falta
                            
                            const toleranceAtraso = 5;
                            const toleranceFalta = 15;
                            
                            let status = "is-empty";
                            let showApareceuPosHorario = false;
                            
                            if (presenca?.pontualidade && horaInicioOficial) {
                              const [entryH, entryM] = presenca.pontualidade.split(":").map(Number);
                              const [startH, startM] = horaInicioOficial.split(":").map(Number);
                              
                              const entryTotal = entryH * 60 + entryM;
                              const startTotal = startH * 60 + startM;
                              
                              const diff = entryTotal - startTotal;
                              
                              if (diff <= 0) status = "pontual";
                              else if (diff <= toleranceAtraso) status = "atrasado";
                              else {
                                status = "falta-tardia";
                                showApareceuPosHorario = true;
                              }
                            } else if (!presenca?.presenca && presenca?.id_presenca) {
                               status = "falta";
                            }

                            return (
                              <React.Fragment key={`${aluno.id_aluno}-${m.id_modulo}-${idAula || 'single'}`}>
                                {/* Presença */}
                                <td className="border border-border px-1 py-1 text-center">
                                  <Checkbox
                                    checked={presenca?.presenca ?? false}
                                    onCheckedChange={(v) => isEditing && updatePresenca(aluno.id_aluno, m.id_modulo, idAula, "presenca", Boolean(v))}
                                    disabled={!isEditing}
                                    className="scale-90"
                                  />
                                </td>

                                {/* Entrada */}
                                <td className="border border-border px-1 py-1 text-center">
                                  {isEditing ? (
                                    <input
                                      type="time"
                                      value={presenca?.pontualidade?.slice(0, 5) ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        // Auto-mark presence/absence logic if late
                                        let updatedPresencaValue = true;
                                        if (val && horaInicioOficial) {
                                          const [eh, em] = val.split(":").map(Number);
                                          const [sh, sm] = horaInicioOficial.split(":").map(Number);
                                          if ((eh * 60 + em) > (sh * 60 + sm + toleranceFalta)) {
                                            updatedPresencaValue = false;
                                          }
                                        }

                                        updatePresenca(aluno.id_aluno, m.id_modulo, idAula, "pontualidade", val || null);
                                        updatePresenca(aluno.id_aluno, m.id_modulo, idAula, "presenca", updatedPresencaValue);
                                      }}
                                      className="w-full bg-background border border-input rounded px-0.5 py-0.5 text-[10px] text-center focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                  ) : (
                                    <span className="text-[10px] tabular-nums">{presenca?.pontualidade?.slice(0, 5) ?? "-"}</span>
                                  )}
                                </td>

                                {/* Status Pontualidade */}
                                <td className="border border-border px-1 py-1 text-center">
                                  {status === "pontual" && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[9px] h-4 py-0">Pontual</Badge>}
                                  {status === "atrasado" && <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] h-4 py-0">Atrasado</Badge>}
                                  {status === "falta-tardia" && <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[9px] h-4 py-0">Falta/Tardia</Badge>}
                                  {status === "falta" && <Badge variant="outline" className="text-[9px] h-4 py-0 text-muted-foreground">Falta</Badge>}
                                  {status === "is-empty" && <span className="text-[9px] text-muted-foreground opacity-30">—</span>}
                                </td>

                                {/* Apareceu Pós Horário */}
                                <td className="border border-border px-1 py-1 text-center">
                                  <Checkbox
                                    checked={showApareceuPosHorario}
                                    disabled={true} // Visual feature only
                                    className="scale-75 opacity-70"
                                  />
                                </td>

                                {/* Justificativa Falta */}
                                <td className="border border-border px-1 py-1 text-center">
                                  <Checkbox
                                    checked={presenca?.justificativa_falta ?? false}
                                    onCheckedChange={(v) => isEditing && updatePresenca(aluno.id_aluno, m.id_modulo, idAula, "justificativa_falta", Boolean(v))}
                                    disabled={!isEditing}
                                    className="scale-90"
                                  />
                                </td>

                                {/* Câmera */}
                                <td className="border border-border px-1 py-1 text-center">
                                  <Checkbox
                                    checked={presenca?.camera_aberta ?? true}
                                    onCheckedChange={(v) => isEditing && updatePresenca(aluno.id_aluno, m.id_modulo, idAula, "camera_aberta", Boolean(v))}
                                    disabled={!isEditing}
                                    className="scale-90"
                                  />
                                </td>

                                {/* Participação */}
                                <td className="border border-border px-1 py-1 text-center">
                                  <Checkbox
                                    checked={presenca?.participacao ?? false}
                                    onCheckedChange={(v) => isEditing && updatePresenca(aluno.id_aluno, m.id_modulo, idAula, "participacao", Boolean(v))}
                                    disabled={!isEditing}
                                    className="scale-90"
                                  />
                                </td>
                              </React.Fragment>
                            );
                          };

                          if (hasMultipleAulas) {
                             const moduloPresenca = getPresenca(aluno.id_aluno, m.id_modulo);
                             return (
                               <>
                                 {m.aulas!.sort((a,b) => a.ordem - b.ordem).map((aula) => {
                                    const presencaAula = getPresenca(aluno.id_aluno, m.id_modulo, aula.id_aula);
                                    return renderPresencaFields(presencaAula, aula.id_aula, aula.hora_inicio);
                                 })}
                                 {/* Nota do modulo */}
                                 <td key={`${aluno.id_aluno}-${m.id_modulo}-nota`} className="border border-border bg-indigo-50/30 dark:bg-indigo-900/10 px-2 py-1.5 text-center">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      min={0}
                                      max={10}
                                      step={0.1}
                                      value={moduloPresenca?.nota ?? ""}
                                      onChange={(e) =>
                                        updatePresenca(aluno.id_aluno, m.id_modulo, undefined, "nota", e.target.value !== "" ? parseFloat(e.target.value) : null)
                                      }
                                      placeholder="-"
                                      className="w-12 bg-background border border-input rounded px-0.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                  ) : (
                                    <span className="text-sm tabular-nums font-semibold">
                                      {moduloPresenca?.nota !== null && moduloPresenca?.nota !== undefined ? Number(moduloPresenca.nota).toFixed(1) : "-"}
                                    </span>
                                  )}
                                </td>
                               </>
                             );
                          } else {
                            const presenca = getPresenca(aluno.id_aluno, m.id_modulo);
                            return (
                              <>
                                {renderPresencaFields(presenca, undefined, m.hora_inicio)}
                                {/* Nota */}
                                <td key={`${aluno.id_aluno}-${m.id_modulo}-nota`} className="border border-border bg-indigo-50/30 dark:bg-indigo-900/10 px-2 py-1.5 text-center">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      min={0}
                                      max={10}
                                      step={0.1}
                                      value={presenca?.nota ?? ""}
                                      onChange={(e) =>
                                        updatePresenca(aluno.id_aluno, m.id_modulo, undefined, "nota", e.target.value !== "" ? parseFloat(e.target.value) : null)
                                      }
                                      placeholder="-"
                                      className="w-12 bg-background border border-input rounded px-0.5 py-0.5 text-xs text-center focus:outline-none focus:ring-1 focus:ring-ring"
                                    />
                                  ) : (
                                    <span className="text-sm tabular-nums font-semibold">
                                      {presenca?.nota !== null && presenca?.nota !== undefined ? Number(presenca.nota).toFixed(1) : "-"}
                                    </span>
                                  )}
                                </td>
                              </>
                            );
                          }
                        })}

                        {/* Média */}
                        <td className="border border-border px-3 py-2 text-center font-semibold tabular-nums">
                          {(() => {
                            const currentTreinamento = treinamentos.find(t => t.id_treinamento === selectedTreinamento);
                            const notaMinima = currentTreinamento?.nota_minima_curso ?? 7;
                            
                            const notas = modulos
                              .map((m) => {
                                const presenca = getPresenca(aluno.id_aluno, m.id_modulo);
                                return presenca?.nota ?? null;
                              })
                              .filter((n) => n !== null) as number[];
                            if (notas.length === 0) return <span className="text-muted-foreground font-normal">-</span>;
                            
                            const avg = notas.reduce((a, b) => a + b, 0) / notas.length;
                            const isApproved = avg >= notaMinima;
                            const isWarning = avg >= (notaMinima - 1.5) && avg < notaMinima;
                            
                            return (
                              <span className={isApproved ? "text-emerald-600 dark:text-emerald-400" : isWarning ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}>
                                {avg.toFixed(1)}
                              </span>
                            );
                          })()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Modal Detalhe Aluno (Visualização Simples) ────────────────────── */}
      {selectedStudent && (
        <Dialog
          open={detailModalOpen}
          onOpenChange={(open) => {
            if (!open) {
              if (isStudentDirty) setDiscardStudentConfirmOpen(true);
              else setDetailModalOpen(false);
            }
          }}
        >
          <DialogContent
            className="max-w-4xl max-h-[90vh] overflow-y-auto"
            onPointerDownOutside={(e) => e.preventDefault()}
          >
            <DialogHeader>
              <DialogTitle>
                {selectedStudent.id_aluno ? "Detalhes do Aluno" : "Cadastrar Aluno"}
              </DialogTitle>
              <DialogDescription>
                {selectedStudent.id_aluno
                  ? `Visualize ou edite as informações de ${selectedStudent.nome}`
                  : "Preencha os dados do novo aluno"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Nome */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Nome</Label>
                  {isEditingStudent ? (
                    <Input
                      value={selectedStudent.nome}
                      onChange={(e) => {
                        setSelectedStudent({ ...selectedStudent, nome: e.target.value });
                        setIsStudentDirty(true);
                      }}
                    />
                  ) : (
                    <p className="font-medium">{selectedStudent.nome}</p>
                  )}
                </div>

                {/* CPF */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">CPF</Label>
                  {isEditingStudent ? (
                    <Input
                      value={formatCPF(selectedStudent.cpf)}
                      onChange={(e) => {
                        setSelectedStudent({ ...selectedStudent, cpf: formatCPF(e.target.value) });
                        setIsStudentDirty(true);
                      }}
                    />
                  ) : (
                    <p className="font-medium">{formatCPF(selectedStudent.cpf)}</p>
                  )}
                </div>

                {/* Data de Nascimento */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Data de Nascimento</Label>
                  {isEditingStudent ? (
                    <Input
                      type="date"
                      value={selectedStudent.data_nascimento || ""}
                      onChange={(e) => {
                        setSelectedStudent({ ...selectedStudent, data_nascimento: e.target.value });
                        setIsStudentDirty(true);
                      }}
                    />
                  ) : (
                    <p className="font-medium">
                      {selectedStudent.data_nascimento
                        ? new Date(selectedStudent.data_nascimento + "T00:00:00").toLocaleDateString("pt-BR")
                        : "-"}
                    </p>
                  )}
                </div>

                {/* Empresa */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Empresa</Label>
                  {isEditingStudent ? (
                    <Select
                      value={selectedStudent.id_empresa || "none"}
                      onValueChange={(val) => {
                        setSelectedStudent({ ...selectedStudent, id_empresa: val });
                        setIsStudentDirty(true);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Independente</SelectItem>
                        {companies.map((c) => (
                          <SelectItem key={c.id_empresa} value={c.id_empresa}>
                            {c.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">
                      {selectedStudent.empresa?.nome || "Independente"}
                    </Badge>
                  )}
                </div>

                {/* Telefone */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Telefone</Label>
                  {isEditingStudent ? (
                    <Input
                      value={formatPhone(selectedStudent.telefone || "")}
                      onChange={(e) => {
                        setSelectedStudent({ ...selectedStudent, telefone: formatPhone(e.target.value) });
                        setIsStudentDirty(true);
                      }}
                    />
                  ) : (
                    <p className="font-medium">{formatPhone(selectedStudent.telefone || "") || "-"}</p>
                  )}
                </div>

                {/* E-mail */}
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">E-mail</Label>
                  {isEditingStudent ? (
                    <Input
                      type="email"
                      value={selectedStudent.email || ""}
                      onChange={(e) => {
                        setSelectedStudent({ ...selectedStudent, email: e.target.value });
                        setIsStudentDirty(true);
                      }}
                    />
                  ) : (
                    <p className="font-medium">{selectedStudent.email || "-"}</p>
                  )}
                </div>

                {/* Cargo */}
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-muted-foreground text-xs uppercase">Cargo</Label>
                  {isEditingStudent ? (
                    <Input
                      value={selectedStudent.cargo || ""}
                      onChange={(e) => {
                        setSelectedStudent({ ...selectedStudent, cargo: e.target.value });
                        setIsStudentDirty(true);
                      }}
                    />
                  ) : (
                    <p className="font-medium">{selectedStudent.cargo || "-"}</p>
                  )}
                </div>

                {/* Data de Cadastro (somente leitura) */}
                {selectedStudent.data_cadastro && (
                  <div className="space-y-1">
                    <Label className="text-muted-foreground text-xs uppercase">Matrícula</Label>
                    <p className="font-medium text-muted-foreground">
                      {new Date(selectedStudent.data_cadastro).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full items-center justify-between border-t border-border pt-4 mt-2">
              <div>
                {selectedStudent.id_aluno && (
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={isSubmitting}
                  >
                    Excluir
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {isEditingStudent ? (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveStudent} disabled={isSubmitting}>
                      Salvar Alterações
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={() => setDetailModalOpen(false)}>
                      Fechar
                    </Button>
                    <Button onClick={() => setIsEditingStudent(true)}>Editar</Button>
                  </>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── AlertDialogs ─────────────────────────────────────────────────── */}

      {/* Descartar edição de aluno */}
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
            <AlertDialogAction
              onClick={confirmDiscardEdit}
              className="bg-destructive hover:bg-destructive/90"
            >
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar salvar aluno */}
      <AlertDialog open={saveStudentConfirmOpen} onOpenChange={setSaveStudentConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar salvamento?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja salvar as informações deste aluno no banco de dados?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Revisar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveStudent} disabled={isSubmitting}>
              Confirmar e Salvar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar exclusão de aluno */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente o aluno{" "}
              <strong>{selectedStudent?.nome}</strong> e todos os seus vínculos de
              contato e presença.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteStudent}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isSubmitting}
            >
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancelar edição da planilha */}
      <AlertDialog open={cancelPlanilhaConfirmOpen} onOpenChange={setCancelPlanilhaConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações da planilha?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as edições feitas na lista de chamada serão perdidas. Nenhum dado foi
              salvo no banco de dados ainda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar editando</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancelPlanilha}
              className="bg-destructive hover:bg-destructive/90"
            >
              Descartar alterações
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmar salvar planilha */}
      <AlertDialog open={savePlanilhaConfirmOpen} onOpenChange={setSavePlanilhaConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Salvar lista de chamada?</AlertDialogTitle>
            <AlertDialogDescription>
              Os dados de presença, pontualidade, câmera e notas serão gravados
              permanentemente no banco de dados. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSavingPlanilha}>Revisar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmSavePlanilha}
              disabled={isSavingPlanilha}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSavingPlanilha ? "Salvando..." : "Confirmar e Salvar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
