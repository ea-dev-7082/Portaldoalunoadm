import React, { useState, useEffect, useCallback } from "react";
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
import { publicAnonKey } from "../../../utils/supabase/info";
import { cn } from "../components/ui/utils";

function toRoman(n: number): string {
  const vals = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const syms = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"];
  let r = "";
  for (let i = 0; i < vals.length; i++) {
    while (n >= vals[i]) {
      r += syms[i];
      n -= vals[i];
    }
  }
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
  empresa_nome?: string;
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
  nome: string;
  hora_inicio: string | null;
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
  email: string | null;
  data_nascimento: string | null;
  empresa: string;
  telefone: string;
  presencas: Presenca[];
  notas: Array<{ id_modulo: string; nota: number | null }>;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getAuthHeader() {
  const session = await supabase.auth.getSession();
  return {
    Authorization: `Bearer ${session.data.session?.access_token}`,
    apikey: publicAnonKey,
  };
}

// ─── Utilities ─────────────────────────────────────────────────────────────

const formatCPF = (v: string) => {
  if (!v) return "";
  const digits = v.replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
};

const formatPhone = (v: string) => {
  if (!v) return "";
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

const onlyDigits = (v: string) => v ? v.replace(/\D/g, "") : "";


// ─── Components ────────────────────────────────────────────────────────────────

export function Alunos() {
  // ── Filtros Globais ──────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"simples" | "completa">("simples");
  const [selectedTreinamento, setSelectedTreinamento] = useState<string>("none");
  const [treinamentos, setTreinamentos] = useState<Treinamento[]>([]);

  // ── Visualização Simples ──────────────────────────────────────────────────
  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = useCallback(async (idTr?: string) => {
    setIsLoading(true);
    try {
      const headers = await getAuthHeader();
      const url = idTr && idTr !== "none" ? `${API_BASE}?id_treinamento=${idTr}` : API_BASE;
      const response = await fetch(url, { headers });
      if (response.ok) {
        const data = await response.json();
        const alArray = Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []);
        const mapped = alArray.map((s: any) => ({
          ...s,
          empresa_nome: s.empresa?.nome || "Independente",
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
    fetchStudents(selectedTreinamento);
    fetchCompanies();
    fetchTreinamentos();
  }, [fetchStudents, fetchCompanies, fetchTreinamentos, selectedTreinamento]);

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
        (s.empresa_nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // ── Visualização Completa ──────────────────────────────────────────────────

  
  const [modulos, setModulos] = useState<ModuloTreinamento[]>([]);
  const [alunosCompletos, setAlunosCompletos] = useState<AlunoCompleto[]>([]);
  const [isLoadingCompleta, setIsLoadingCompleta] = useState(false);

  // Modo edição da planilha
  const [isEditingPlanilha, setIsEditingPlanilha] = useState(false);
  const [editedPresencas, setEditedPresencas] = useState<Record<string, Presenca>>({});
  const [cancelPlanilhaConfirmOpen, setCancelPlanilhaConfirmOpen] = useState(false);
  const [savePlanilhaConfirmOpen, setSavePlanilhaConfirmOpen] = useState(false);
  const [isSavingPlanilha, setIsSavingPlanilha] = useState(false);

  const fetchCompleta = useCallback(async (idTreinamento: string) => {
    if (!idTreinamento || idTreinamento === "none") return;
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
    if (viewMode === "completa" && selectedTreinamento !== "none") {
      fetchCompleta(selectedTreinamento);
    }
  }, [selectedTreinamento, viewMode, fetchCompleta]);

  const getPresenca = (idAluno: string, idModulo: string, idAula: string): Presenca | undefined => {
    const key = `${idAluno}__${idModulo}__${idAula}`;
    if (editedPresencas[key]) return editedPresencas[key];
    const aluno = alunosCompletos.find((a) => a.id_aluno === idAluno);
    return aluno?.presencas.find((p) => p.id_aula === idAula);
  };

  const getModuloNota = (idAluno: string, idModulo: string): number | null => {
    const key = `${idAluno}__${idModulo}__NOTA`;
    if (editedPresencas[key]) return editedPresencas[key].nota;
    const aluno = alunosCompletos.find((a) => a.id_aluno === idAluno);
    return aluno?.notas?.find((n) => n.id_modulo === idModulo)?.nota ?? null;
  };

  const updatePresenca = (idAluno: string, idModulo: string, idAula: string | undefined, field: string, value: any) => {
    const key = idAula ? `${idAluno}__${idModulo}__${idAula}` : `${idAluno}__${idModulo}__NOTA`;
    
    if (idAula) {
      // Caso 1: Atualizando dados de Aula
      const existing = getPresenca(idAluno, idModulo, idAula);
      let newObj: Presenca = existing ? { ...existing } : {
        id_aluno: idAluno,
        id_treinamento: selectedTreinamento,
        id_modulo: idModulo,
        id_aula: idAula,
        presenca: false,
        pontualidade: null,
        camera_aberta: true,
        participacao: false,
        justificativa_falta: false,
        nota: null
      };

      (newObj as any)[field] = value;

      // Regra: Justificativa só existe se não houver presença
      if (field === "presenca" && value === true) {
        newObj.justificativa_falta = false;
      }
      setEditedPresencas(prev => ({ ...prev, [key]: newObj }));

    } else {
      // Caso 2: Atualizando Nota do Módulo
      const newObj = {
          id_aluno: idAluno,
          id_treinamento: selectedTreinamento,
          id_modulo: idModulo,
          nota: value as number | null
      };
      setEditedPresencas(prev => ({ ...prev, [key]: newObj as any }));
    }
  };


  const handleEnterEditPlanilha = () => {
    setEditedPresencas({});
    setIsEditingPlanilha(true);
  };

  const handleCancelPlanilha = () => setCancelPlanilhaConfirmOpen(true);

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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingPlanilha(false);
    }
  };

  const filteredAlunosCompletos = alunosCompletos.filter(
    (a) =>
      a.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.telefone || "").includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
          <p className="text-muted-foreground mt-1">Gerencie o cadastro e informações dos alunos</p>
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
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 space-y-1.5">
            <Label className="text-sm font-semibold flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-blue-500" />
              Selecione o Treinamento
            </Label>
            <Select value={selectedTreinamento} onValueChange={setSelectedTreinamento}>
              <SelectTrigger className="w-full bg-background border-blue-100 focus:ring-blue-500">
                <SelectValue placeholder="Selecione um treinamento..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos os Alunos (Base Geral)</SelectItem>
                {treinamentos.map((t) => (
                  <SelectItem key={t.id_treinamento} value={t.id_treinamento}>
                    {t.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 space-y-1.5">
            <Label className="text-sm font-semibold">Busca Rápida</Label>
            <SearchInput
              placeholder="Nome, CPF ou Empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label className="text-sm font-semibold">Modo de Exibição</Label>
            <div className="flex items-center bg-muted/50 p-1 rounded-md h-10">
              <Button
                variant={viewMode === "simples" ? "secondary" : "ghost"}
                size="sm"
                className={cn("flex-1 gap-2", viewMode === "simples" && "bg-background shadow-sm")}
                onClick={() => setViewMode("simples")}
              >
                Simples
              </Button>
              <Button
                variant={viewMode === "completa" ? "secondary" : "ghost"}
                size="sm"
                className={cn("flex-1 gap-2", viewMode === "completa" && "bg-background shadow-sm")}
                onClick={() => setViewMode("completa")}
              >
                Completa
              </Button>
            </div>
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
                      ["empresa_nome", "Empresa"],
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
                      onClick={() => handleSort(key as keyof Student)}
                    >
                      <div className="flex items-center whitespace-nowrap">
                        {label} {getSortIcon(key as keyof Student)}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-muted-foreground">Carregando alunos...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <p className="text-muted-foreground opacity-60 italic">Nenhum aluno encontrado.</p>
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
                        <Badge variant="outline">{student.empresa_nome}</Badge>
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
                        {student.data_cadastro ? new Date(student.data_cadastro).toLocaleDateString("pt-BR") : "-"}
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
          {!selectedTreinamento || selectedTreinamento === "none" ? (
            <Card className="p-12 text-center border-dashed">
              <div className="flex flex-col items-center gap-3 opacity-50">
                <GraduationCap className="w-12 h-12 mb-2" />
                <p className="text-lg font-medium">Seleção Obrigatória</p>
                <p className="text-sm">Selecione um treinamento no filtro acima para visualizar os dados completos.</p>
              </div>
            </Card>
          ) : (
            <>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-4 bg-muted/30 p-3 rounded-lg border border-border/50">
                <div className="flex items-center gap-2">
                  {isEditingPlanilha ? (
                    <>
                      <Button variant="ghost" size="sm" onClick={handleCancelPlanilha} disabled={isSavingPlanilha}>
                        <X className="w-4 h-4 mr-1" /> Descartar
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSavePlanilha} disabled={isSavingPlanilha}>
                        <Save className="w-4 h-4 mr-1" /> {isSavingPlanilha ? "Salvando..." : "Salvar"}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-500/30" onClick={handleEnterEditPlanilha}>
                      <Pencil className="w-4 h-4 mr-1" /> Editar Planilha
                    </Button>
                  )}
                </div>
              </div>

              {isLoadingCompleta ? (
                <Card className="p-8 text-center border-border/50">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                    <p className="text-sm text-muted-foreground">Carregando dados da planilha...</p>
                  </div>
                </Card>
              ) : (
                <Card className={`overflow-hidden border border-border shadow-xl transition-all ${isEditingPlanilha ? "ring-2 ring-primary/50" : ""}`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse bg-background">
                      <thead>
                        {/* Nível 1: Grupos Principais */}
                        <tr className="bg-muted text-muted-foreground uppercase tracking-wider text-[10px] font-bold">
                          <th colSpan={7} className="border border-border px-3 py-2 text-left sticky left-0 z-20 bg-muted">Dados do Aluno</th>
                          <th colSpan={modulos.reduce((acc, m) => acc + ((m.aulas?.length || 1) * 5) + 1, 0) + 2} className="border border-border px-3 py-2 text-center">Dados do Treinamento</th>
                        </tr>
                        {/* Nível 2: Campos do Aluno e Módulos */}
                        <tr className="bg-muted/30 text-foreground">
                          <th rowSpan={3} className="border border-border px-3 py-2 text-left sticky left-0 z-20 bg-muted/30 min-w-[200px]">Nome Completo</th>
                          <th rowSpan={3} className="border border-border px-2 py-2 text-center min-w-[100px]">CPF</th>
                          <th rowSpan={3} className="border border-border px-2 py-2 text-center min-w-[120px]">Empresa</th>
                          <th rowSpan={3} className="border border-border px-2 py-2 text-center min-w-[100px]">Cargo</th>
                          <th rowSpan={3} className="border border-border px-2 py-2 text-center min-w-[100px]">Telefone</th>
                          <th rowSpan={3} className="border border-border px-2 py-2 text-center min-w-[150px]">Email</th>
                          <th rowSpan={3} className="border border-border px-2 py-2 text-center min-w-[80px]">Nascimento</th>
                          {modulos.map((m, idx) => {
                            const nomeModulo = m.nome || (m as any).modulo?.nome || "Módulo sem título";
                            return (
                              <th key={m.id_modulo} colSpan={(m.aulas?.length || 1) * 5 + 1} className="border border-border bg-blue-500/10 dark:bg-blue-400/10 px-3 py-2 text-center text-blue-600 dark:text-blue-400 font-bold uppercase whitespace-nowrap">
                                {toRoman(idx + 1)} — {nomeModulo}
                              </th>
                            );
                          })}
                          <th rowSpan={3} className="border border-border bg-muted/50 px-2 py-2 text-center min-w-[60px]">Média Geral</th>
                          <th rowSpan={3} className="border border-border bg-muted/50 px-2 py-2 text-center min-w-[60px]">Pres. %</th>
                        </tr>
                        {/* Nível 3: Aulas e Coluna de Nota do Módulo */}
                        <tr className="bg-background">
                          {modulos.map((m) => {
                            const aulas = (m.aulas || []).sort((a,b) => (a.ordem||0)-(b.ordem||0));
                            return (
                              <React.Fragment key={m.id_modulo}>
                                {aulas.length > 0 ? (
                                  aulas.map((a, i) => (
                                    <th key={a.id_aula} colSpan={5} className="border border-border bg-muted/20 px-1 py-1 text-center font-semibold text-muted-foreground">
                                      Aula {i + 1}
                                    </th>
                                  ))
                                ) : (
                                  <th colSpan={5} className="border border-border bg-muted/20 px-1 py-1 text-center font-semibold text-muted-foreground/50 italic">Sem aulas</th>
                                )}
                                <th rowSpan={2} className="border border-border bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 px-2 py-1 text-center min-w-[50px]">Nota</th>
                              </React.Fragment>
                            );
                          })}
                        </tr>
                        {/* Nível 4: Atributos das Aulas */}
                        <tr className="bg-muted/10 text-[9px] uppercase font-bold text-muted-foreground/70">
                          {modulos.map((m) => (
                            <React.Fragment key={m.id_modulo}>
                              {(m.aulas || []).map((a) => (
                                <React.Fragment key={a.id_aula}>
                                  <th className="border border-border px-0.5 py-1 text-center min-w-[35px]">Pres.</th>
                                  <th className="border border-border px-0.5 py-1 text-center min-w-[45px]">Pont.</th>
                                  <th className="border border-border px-0.5 py-1 text-center min-w-[35px]">Câm.</th>
                                  <th className="border border-border px-0.5 py-1 text-center min-w-[35px]">Part.</th>
                                  <th className="border border-border px-0.5 py-1 text-center min-w-[35px]">Just.</th>
                                </React.Fragment>
                              ))}
                            </React.Fragment>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAlunosCompletos.map((aluno, rIdx) => {
                          // Cálculos de Linha
                          const totalAulas = modulos.reduce((acc, m) => acc + (m.aulas?.length || 0), 0);
                          const presencasCalculadas = modulos.reduce((acc, m) => {
                            return acc + (m.aulas || []).filter(a => getPresenca(aluno.id_aluno, m.id_modulo, a.id_aula)?.presenca).length;
                          }, 0);
                          const freqPerc = totalAulas > 0 ? (presencasCalculadas / totalAulas) * 100 : 0;

                          const totalModulos = modulos.length;
                          let todosComNota = true;
                          const somaNotas = modulos.reduce((acc, m) => {
                             const n = getModuloNota(aluno.id_aluno, m.id_modulo);
                             if (n === null || n === undefined) todosComNota = false;
                             return acc + (n || 0);
                          }, 0);
                          const mediaGeral = (todosComNota && totalModulos > 0) ? somaNotas / totalModulos : null;

                          return (
                            <tr key={aluno.id_aluno} className={`hover:bg-muted/40 transition-colors ${rIdx % 2 === 0 ? "bg-background" : "bg-muted/10"}`}>
                              {/* Dados do Aluno (APENAS LEITURA) */}
                              <td className="border border-border px-3 py-2 font-medium sticky left-0 z-10 bg-inherit shadow-[2px_0_5px_rgba(0,0,0,0.05)] text-foreground">{aluno.nome}</td>
                              <td className="border border-border px-2 py-2 text-center whitespace-nowrap opacity-80 text-foreground">{formatCPF(aluno.cpf)}</td>
                              <td className="border border-border px-2 py-2 text-center whitespace-nowrap"><Badge variant="outline" className="text-[10px] font-normal border-border/50 text-foreground">{aluno.empresa}</Badge></td>
                              <td className="border border-border px-2 py-2 text-center whitespace-nowrap truncate max-w-[100px] opacity-70 text-foreground">{aluno.cargo || "-"}</td>
                              <td className="border border-border px-2 py-2 text-center whitespace-nowrap opacity-80 text-foreground">{formatPhone(aluno.telefone) || "-"}</td>
                              <td className="border border-border px-2 py-2 text-center truncate max-w-[150px] opacity-80 text-foreground">{aluno.email || "-"}</td>
                              <td className="border border-border px-2 py-2 text-center whitespace-nowrap opacity-70 text-foreground">{aluno.data_nascimento ? new Date(aluno.data_nascimento).toLocaleDateString('pt-BR') : "-"}</td>

                              {/* Colunas Dinâmicas de Treinamento */}
                              {modulos.map((m) => {
                                const aulas = (m.aulas || []).sort((a,b) => (a.ordem||0)-(b.ordem||0));
                                const notaModulo = getModuloNota(aluno.id_aluno, m.id_modulo);

                                return (
                                  <React.Fragment key={m.id_modulo}>
                                    {aulas.map((a) => {
                                      const pres = getPresenca(aluno.id_aluno, m.id_modulo, a.id_aula);
                                      const isAbsent = !(pres?.presenca);

                                      return (
                                        <React.Fragment key={a.id_aula}>
                                          {/* Presença */}
                                          <td className="border border-border text-center p-1">
                                            <input 
                                              type="checkbox" 
                                              checked={pres?.presenca ?? false}
                                              onChange={(e) => isEditingPlanilha && updatePresenca(aluno.id_aluno, m.id_modulo, a.id_aula, "presenca", e.target.checked)}
                                              disabled={!isEditingPlanilha}
                                              className="w-3.5 h-3.5 cursor-pointer accent-blue-600 dark:accent-blue-500"
                                            />
                                          </td>
                                          {/* Pontualidade */}
                                          <td className="border border-border p-0.5">
                                            {isEditingPlanilha ? (
                                              <input 
                                                type="time" 
                                                value={pres?.pontualidade?.slice(0,5) ?? ""} 
                                                onChange={(e) => updatePresenca(aluno.id_aluno, m.id_modulo, a.id_aula, "pontualidade", e.target.value)}
                                                className="w-full bg-transparent border-0 text-[10px] p-0 text-center focus:ring-1 focus:ring-blue-400 text-foreground" 
                                              />
                                            ) : (
                                              <span className="text-[10px] block text-center opacity-70 text-foreground">{pres?.pontualidade?.slice(0,5) || "-"}</span>
                                            )}
                                          </td>
                                          {/* Câmera */}
                                          <td className="border border-border text-center p-1">
                                             <input 
                                              type="checkbox" 
                                              checked={pres?.camera_aberta ?? true}
                                              onChange={(e) => isEditingPlanilha && updatePresenca(aluno.id_aluno, m.id_modulo, a.id_aula, "camera_aberta", e.target.checked)}
                                              disabled={!isEditingPlanilha}
                                              className="w-3.5 h-3.5 cursor-pointer accent-indigo-600 dark:accent-indigo-400"
                                            />
                                          </td>
                                          {/* Participação */}
                                          <td className="border border-border text-center p-1">
                                            <input 
                                              type="checkbox" 
                                              checked={pres?.participacao ?? false}
                                              onChange={(e) => isEditingPlanilha && updatePresenca(aluno.id_aluno, m.id_modulo, a.id_aula, "participacao", e.target.checked)}
                                              disabled={!isEditingPlanilha}
                                              className="w-3.5 h-3.5 cursor-pointer accent-emerald-600 dark:accent-emerald-400"
                                            />
                                          </td>
                                          {/* Justificativa */}
                                          <td className="border border-border text-center p-1 bg-muted/5">
                                            <input 
                                              type="checkbox" 
                                              checked={pres?.justificativa_falta ?? false}
                                              onChange={(e) => isEditingPlanilha && updatePresenca(aluno.id_aluno, m.id_modulo, a.id_aula, "justificativa_falta", e.target.checked)}
                                              disabled={!isEditingPlanilha || !isAbsent}
                                              className={`w-3.5 h-3.5 accent-amber-600 dark:accent-amber-500 ${!isAbsent ? 'opacity-20 cursor-not-allowed' : 'cursor-pointer'}`}
                                            />
                                          </td>
                                        </React.Fragment>
                                      );
                                    })}
                                    {/* Nota do Módulo */}
                                    <td className="border border-border bg-emerald-500/5 dark:bg-emerald-400/5 text-center p-1">
                                      {isEditingPlanilha ? (
                                        <input 
                                          type="number" 
                                          step="0.1" 
                                          min="0" 
                                          max="10"
                                          value={notaModulo ?? ""} 
                                          onChange={(e) => updatePresenca(aluno.id_aluno, m.id_modulo, undefined, "nota", e.target.value ? parseFloat(e.target.value) : null)}
                                          className="w-full bg-transparent border-0 text-[10px] font-bold text-center text-emerald-700 dark:text-emerald-400 p-0 focus:ring-0" 
                                        />
                                      ) : (
                                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400">{notaModulo?.toFixed(1) || "-"}</span>
                                      )}
                                    </td>
                                  </React.Fragment>
                                );
                              })}

                              {/* Resumo Final da Linha */}
                              <td className="border border-border bg-muted/20 px-2 py-2 text-center font-bold text-foreground">
                                {mediaGeral !== null ? mediaGeral.toFixed(1) : "-"}
                              </td>
                              <td className={`border border-border bg-muted/20 px-2 py-2 text-center font-bold ${freqPerc < 75 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {freqPerc.toFixed(0)}%
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Modais e AlertDialogs ─────────────────────────────────────────── */}
      {selectedStudent && (
        <Dialog open={detailModalOpen} onOpenChange={(o) => !o && (isStudentDirty ? setDiscardStudentConfirmOpen(true) : setDetailModalOpen(false))}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedStudent.id_aluno ? "Detalhes do Aluno" : "Cadastrar Aluno"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
              <div className="space-y-1">
                <Label>Nome</Label>
                {isEditingStudent ? <Input value={selectedStudent.nome} onChange={e => { setSelectedStudent({...selectedStudent, nome: e.target.value}); setIsStudentDirty(true); }} /> : <p className="font-medium">{selectedStudent.nome}</p>}
              </div>
              <div className="space-y-1">
                <Label>CPF</Label>
                {isEditingStudent ? <Input value={formatCPF(selectedStudent.cpf)} onChange={e => { setSelectedStudent({...selectedStudent, cpf: formatCPF(e.target.value)}); setIsStudentDirty(true); }} /> : <p className="font-medium">{formatCPF(selectedStudent.cpf)}</p>}
              </div>
              <div className="space-y-1">
                <Label>Empresa</Label>
                {isEditingStudent ? (
                  <Select value={selectedStudent.id_empresa || "none"} onValueChange={v => { setSelectedStudent({...selectedStudent, id_empresa: v}); setIsStudentDirty(true); }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Independente</SelectItem>
                      {companies.map(c => <SelectItem key={c.id_empresa} value={c.id_empresa}>{c.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : <Badge variant="outline">{selectedStudent.empresa_nome}</Badge>}
              </div>
              <div className="space-y-1">
                <Label>Telefone</Label>
                {isEditingStudent ? <Input value={formatPhone(selectedStudent.telefone || "")} onChange={e => { setSelectedStudent({...selectedStudent, telefone: formatPhone(e.target.value)}); setIsStudentDirty(true); }} /> : <p className="font-medium">{formatPhone(selectedStudent.telefone || "")}</p>}
              </div>
              <div className="space-y-1">
                <Label>E-mail</Label>
                {isEditingStudent ? <Input value={selectedStudent.email || ""} onChange={e => { setSelectedStudent({...selectedStudent, email: e.target.value}); setIsStudentDirty(true); }} /> : <p className="font-medium">{selectedStudent.email || "-"}</p>}
              </div>
              <div className="space-y-1">
                <Label>Cargo</Label>
                {isEditingStudent ? <Input value={selectedStudent.cargo || ""} onChange={e => { setSelectedStudent({...selectedStudent, cargo: e.target.value}); setIsStudentDirty(true); }} /> : <p className="font-medium">{selectedStudent.cargo || "-"}</p>}
              </div>
            </div>
            <div className="flex justify-between border-t pt-4">
              {selectedStudent.id_aluno && <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)}>Excluir</Button> }
              <div className="flex gap-2">
                {isEditingStudent ? (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                    <Button onClick={handleSaveStudent} disabled={isSubmitting}>Salvar Alterações</Button>
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

      {/* AlertDialogs */}
      <AlertDialog open={discardStudentConfirmOpen} onOpenChange={setDiscardStudentConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Descartar alterações?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDiscardEdit} className="bg-destructive">Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={saveStudentConfirmOpen} onOpenChange={setSaveStudentConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirmar salvamento?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveStudent}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Excluir aluno?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteStudent} className="bg-destructive">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={cancelPlanilhaConfirmOpen} onOpenChange={setCancelPlanilhaConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Descartar edições da planilha?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelPlanilha} className="bg-destructive">Descartar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={savePlanilhaConfirmOpen} onOpenChange={setSavePlanilhaConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Salvar alterações?</AlertDialogTitle></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSavePlanilha} className="bg-blue-600">Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
