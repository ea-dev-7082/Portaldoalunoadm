import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Search,
  Handshake,
  Building2,
  X,
  Percent,
  CalendarDays,
} from "lucide-react";
import { SearchInput } from "../components/ui/search-input";
import { ProgramaFormacaoSection } from "../components/programa-formacao/ProgramaFormacaoSection";

const SUPABASE_URL = "https://wytbbtlxrhkvqvlwjivc.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5dGJidGx4cmhrdnF2bHdqaXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTYwMTIsImV4cCI6MjA4ODM5MjAxMn0.7iFjBVva_7nsNlvmfZ_8ddQuTmvCrCx9NTP1sKRzRB0";

const headers = {
  "Content-Type": "application/json",
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Empresa {
  id_empresa: string;
  nome: string;
  cnpj: string;
  is_matriz: boolean;
  id_matriz: string | null;
}

interface Parceria {
  id_parceria: string;
  nome: string;
  desconto: number;
  data_criacao: string;
  empresas: Empresa[];
  total_alunos?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return "-";
  }
}

function formatDiscount(v: number) {
  return `${Number(v).toFixed(0)}%`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function Parcerias() {
  // ---- List state ----
  const [parcerias, setParcerias] = useState<Parceria[]>([]);
  const [allEmpresas, setAllEmpresas] = useState<Empresa[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // ---- Overlay state ----
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---- Delete dialog ----
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ---- Form state ----
  const emptyForm = {
    nome: "",
    desconto: "",
    data_criacao: new Date().toISOString().split("T")[0],
  };
  const [formData, setFormData] = useState(emptyForm);

  // ---- Company search inside overlay ----
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [showEmpresaDropdown, setShowEmpresaDropdown] = useState(false);
  const [selectedEmpresas, setSelectedEmpresas] = useState<Empresa[]>([]);
  const empresaSearchRef = useRef<HTMLDivElement>(null);

  // ─── Data fetching ────────────────────────────────────────────────────────
  const fetchAllEmpresas = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/empresas-crud`, {
        headers,
      });
      if (res.ok) setAllEmpresas(await res.json());
    } catch (e) {
      console.error("Erro ao buscar empresas:", e);
    }
  }, []);

  const fetchParcerias = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Fetch parcerias
      const { data: parceriasData, error: pErr } = await (async () => {
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/parceria?select=*&order=data_criacao.desc`,
          { headers }
        );
        if (!r.ok) return { data: null, error: await r.text() };
        return { data: (await r.json()) as Parceria[], error: null };
      })();

      if (pErr || !parceriasData) {
        console.error("Erro ao buscar parcerias:", pErr);
        setIsLoading(false);
        return;
      }

      // 2. Fetch empresa_parceria relations
      const { data: relData } = await (async () => {
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/empresa_parceria?select=id_parceria,id_empresa`,
          { headers }
        );
        if (!r.ok) return { data: [] };
        return { data: (await r.json()) as { id_parceria: string; id_empresa: string }[] };
      })();

      // 3. Fetch aluno counts per parceria via aluno_parceria
      const { data: alunoRel } = await (async () => {
        const r = await fetch(
          `${SUPABASE_URL}/rest/v1/aluno_parceria?select=id_parceria,id_aluno`,
          { headers }
        );
        if (!r.ok) return { data: [] };
        return { data: (await r.json()) as { id_parceria: string; id_aluno: string }[] };
      })();

      // 4. Fetch latest empresa list (needed for names)
      const empRes = await fetch(`${SUPABASE_URL}/functions/v1/empresas-crud`, {
        headers,
      });
      const allEmp: Empresa[] = empRes.ok ? await empRes.json() : [];
      setAllEmpresas(allEmp);

      // 5. Build enriched parcerias
      const enriched: Parceria[] = parceriasData.map((p) => {
        const empIds = (relData || [])
          .filter((r) => r.id_parceria === p.id_parceria)
          .map((r) => r.id_empresa);

        const empresas = allEmp.filter((e) => empIds.includes(e.id_empresa));

        // Also include filials of any matriz in this parceria
        const allEmpIds = new Set(empIds);
        allEmp.forEach((e) => {
          if (e.id_matriz && allEmpIds.has(e.id_matriz)) {
            allEmpIds.add(e.id_empresa);
          }
        });

        // Count alunos (direct + inherited via empresa)
        const alunoCount = (alunoRel || []).filter(
          (a) => a.id_parceria === p.id_parceria
        ).length;

        return { ...p, empresas, total_alunos: alunoCount };
      });

      setParcerias(enriched);
    } catch (e) {
      console.error("Erro ao buscar parcerias:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParcerias();
  }, [fetchParcerias]);

  // ─── Close dropdown on outside click ─────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        empresaSearchRef.current &&
        !empresaSearchRef.current.contains(e.target as Node)
      ) {
        setShowEmpresaDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── Overlay open/close ───────────────────────────────────────────────────
  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(emptyForm);
    setSelectedEmpresas([]);
    setEmpresaSearch("");
    setOverlayOpen(true);
  };

  const openEdit = (p: Parceria) => {
    setIsEditing(true);
    setEditingId(p.id_parceria);
    setFormData({
      nome: p.nome,
      desconto: String(p.desconto),
      data_criacao: p.data_criacao
        ? p.data_criacao.split("T")[0]
        : new Date().toISOString().split("T")[0],
    });
    setSelectedEmpresas(p.empresas || []);
    setEmpresaSearch("");
    setOverlayOpen(true);
  };

  // ─── Company search helpers ───────────────────────────────────────────────
  const filteredEmpresaSearch = allEmpresas.filter((e) => {
    const q = empresaSearch.toLowerCase();
    return (
      !selectedEmpresas.some((s) => s.id_empresa === e.id_empresa) &&
      (e.nome.toLowerCase().includes(q) || e.cnpj.includes(q))
    );
  });

  const addEmpresaToSelection = (emp: Empresa) => {
    setSelectedEmpresas((prev) => {
      if (prev.some((e) => e.id_empresa === emp.id_empresa)) return prev;
      return [...prev, emp];
    });
    setEmpresaSearch("");
    setShowEmpresaDropdown(false);
  };

  const removeEmpresaFromSelection = (id: string) => {
    setSelectedEmpresas((prev) => prev.filter((e) => e.id_empresa !== id));
  };

  // ─── Save (create / edit) ─────────────────────────────────────────────────
  const handleSave = async () => {
    if (!formData.nome.trim()) return alert("O nome da parceria é obrigatório.");
    const descNum = parseFloat(formData.desconto);
    if (isNaN(descNum) || descNum < 0 || descNum > 100)
      return alert("O desconto deve ser um número entre 0 e 100.");

    setIsSubmitting(true);
    try {
      let parceiaId = editingId;

      if (isEditing && editingId) {
        // UPDATE parceria record
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/parceria?id_parceria=eq.${editingId}`,
          {
            method: "PATCH",
            headers,
            body: JSON.stringify({
              nome: formData.nome,
              desconto: descNum,
              data_criacao: formData.data_criacao
                ? new Date(formData.data_criacao).toISOString()
                : undefined,
            }),
          }
        );
        if (!res.ok) throw new Error("Erro ao atualizar parceria.");

        // Remove existing empresa relations then re-add
        await fetch(
          `${SUPABASE_URL}/rest/v1/empresa_parceria?id_parceria=eq.${editingId}`,
          { method: "DELETE", headers }
        );
      } else {
        // INSERT new parceria
        const res = await fetch(`${SUPABASE_URL}/rest/v1/parceria`, {
          method: "POST",
          headers: { ...headers, Prefer: "return=representation" },
          body: JSON.stringify({
            nome: formData.nome,
            desconto: descNum,
            data_criacao: formData.data_criacao
              ? new Date(formData.data_criacao).toISOString()
              : new Date().toISOString(),
          }),
        });
        if (!res.ok) throw new Error("Erro ao criar parceria.");
        const created = await res.json();
        parceiaId = created[0]?.id_parceria;
      }

      // Insert empresa relations
      if (selectedEmpresas.length > 0 && parceiaId) {
        const relPayload = selectedEmpresas.map((e) => ({
          id_parceria: parceiaId,
          id_empresa: e.id_empresa,
        }));
        const relRes = await fetch(`${SUPABASE_URL}/rest/v1/empresa_parceria`, {
          method: "POST",
          headers,
          body: JSON.stringify(relPayload),
        });
        if (!relRes.ok) {
          const errText = await relRes.text();
          console.error("Erro ao salvar relações empresa-parceria:", errText);
        }
      }

      setOverlayOpen(false);
      fetchParcerias();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao salvar parceria.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const openDelete = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    setIsSubmitting(true);
    try {
      // Relations cascade via FK, but explicit cleanup for safety
      await fetch(
        `${SUPABASE_URL}/rest/v1/empresa_parceria?id_parceria=eq.${deletingId}`,
        { method: "DELETE", headers }
      );
      await fetch(
        `${SUPABASE_URL}/rest/v1/aluno_parceria?id_parceria=eq.${deletingId}`,
        { method: "DELETE", headers }
      );
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/parceria?id_parceria=eq.${deletingId}`,
        { method: "DELETE", headers }
      );
      if (!res.ok) throw new Error("Erro ao excluir parceria.");
      setDeleteDialogOpen(false);
      fetchParcerias();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erro ao excluir parceria.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Filtered list ───────────────────────────────────────────────────────
  const filtered = parcerias.filter((p) =>
    p.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* ── PROGRAMA FORMAÇÃO (VIP) ── */}
      <ProgramaFormacaoSection />

      {/* ── PARCERIAS (Standard) ── */}
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>

          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Handshake className="w-8 h-8 text-blue-600" />
            Parcerias
          </h1>
          <p className="text-muted-foreground mt-1">
            Convênios e descontos entre empresas e o sistema de treinamentos.
          </p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nova Parceria
        </Button>
      </div>

      {/* List */}
      <div className="space-y-4">
        <Card className="p-4">
          <SearchInput
            placeholder="Buscar parceria por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Card>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Parceria</TableHead>
                  <TableHead className="text-center">Desconto</TableHead>
                  <TableHead>Empresas Vinculadas</TableHead>
                  <TableHead className="text-center">Alunos Beneficiados</TableHead>
                  <TableHead>Data da Parceria</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground"
                    >
                      Carregando parcerias...
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center py-12 text-muted-foreground"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Handshake className="w-10 h-10 text-muted-foreground/40" />
                        <p>Nenhuma parceria cadastrada ainda.</p>
                        <Button variant="outline" size="sm" onClick={openCreate}>
                          <Plus className="w-4 h-4 mr-2" />
                          Criar primeira parceria
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id_parceria}>
                      <TableCell className="font-semibold">{p.nome}</TableCell>
                      <TableCell className="text-center">
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold gap-1">
                          <Percent className="w-3 h-3" />
                          {formatDiscount(p.desconto)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {p.empresas.length === 0 ? (
                            <span className="text-muted-foreground text-sm">—</span>
                          ) : (
                            p.empresas.slice(0, 3).map((emp) => (
                              <Badge
                                key={emp.id_empresa}
                                variant="secondary"
                                className="text-xs"
                              >
                                <Building2 className="w-3 h-3 mr-1" />
                                {emp.nome}
                              </Badge>
                            ))
                          )}
                          {p.empresas.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{p.empresas.length - 3} mais
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{p.total_alunos ?? 0}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3.5 h-3.5" />
                          {formatDate(p.data_criacao)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(p)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openDelete(p.id_parceria)}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* ─── Create / Edit Overlay ─────────────────────────────────────────── */}
      <Dialog open={overlayOpen} onOpenChange={setOverlayOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Editar Parceria" : "Nova Parceria"}
            </DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Altere os dados e as empresas vinculadas a esta parceria."
                : "Preencha os dados e vincule as empresas participantes."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Nome da parceria */}
            <div className="space-y-2">
              <Label htmlFor="parceria-nome">Nome da Parceria *</Label>
              <Input
                id="parceria-nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, nome: e.target.value }))
                }
                placeholder="Ex: Convênio Escola de Autopeças 2025"
              />
            </div>

            {/* Desconto + Data */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="parceria-desconto">
                  Desconto (%) *
                </Label>
                <div className="relative">
                  <Input
                    id="parceria-desconto"
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={formData.desconto}
                    onChange={(e) =>
                      setFormData((p) => ({ ...p, desconto: e.target.value }))
                    }
                    placeholder="Ex: 15"
                    className="pr-8"
                  />
                  <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Em caso de múltiplas parcerias, prevalece o maior desconto.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="parceria-data">Data da Parceria</Label>
                <Input
                  id="parceria-data"
                  type="date"
                  value={formData.data_criacao}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, data_criacao: e.target.value }))
                  }
                />
              </div>
            </div>

            {/* Empresa search & tags */}
            <div className="space-y-3">
              <Label>Empresas Participantes</Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Filiais de matrizes vinculadas herdam os benefícios automaticamente.
              </p>

              {/* Search box */}
              <div className="relative" ref={empresaSearchRef}>
                <div className="flex items-center border border-input rounded-md bg-background px-3 gap-2">
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    className="flex-1 py-2 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                    placeholder="Pesquisar empresa por nome ou CNPJ..."
                    value={empresaSearch}
                    onChange={(e) => {
                      setEmpresaSearch(e.target.value);
                      setShowEmpresaDropdown(true);
                    }}
                    onFocus={() => setShowEmpresaDropdown(true)}
                  />
                </div>

                {/* Dropdown results */}
                {showEmpresaDropdown && empresaSearch.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-52 overflow-y-auto">
                    {filteredEmpresaSearch.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3">
                        Nenhuma empresa encontrada.
                      </p>
                    ) : (
                      filteredEmpresaSearch.map((emp) => (
                        <button
                          key={emp.id_empresa}
                          type="button"
                          className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors flex items-center gap-3"
                          onClick={() => addEmpresaToSelection(emp)}
                        >
                          <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium">{emp.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {emp.cnpj}
                              {emp.is_matriz && (
                                <span className="ml-2 text-blue-600 dark:text-blue-400 font-semibold">
                                  MATRIZ
                                </span>
                              )}
                              {emp.id_matriz && (
                                <span className="ml-2 text-amber-600 dark:text-amber-400">
                                  Filial
                                </span>
                              )}
                            </p>
                          </div>
                          <Plus className="w-4 h-4 ml-auto text-primary" />
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Selected empresa tags */}
              {selectedEmpresas.length > 0 ? (
                <div className="flex flex-wrap gap-2 border border-dashed border-border rounded-lg p-3 min-h-[60px]">
                  {selectedEmpresas.map((emp) => (
                    <Badge
                      key={emp.id_empresa}
                      variant="secondary"
                      className="gap-1.5 pr-1.5 text-sm font-medium h-7"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      {emp.nome}
                      {emp.is_matriz && (
                        <span className="text-xs opacity-60">(M)</span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeEmpresaFromSelection(emp.id_empresa)}
                        className="ml-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-lg p-4 text-center text-sm text-muted-foreground">
                  Nenhuma empresa vinculada ainda. Use a busca acima para adicionar.
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOverlayOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting
                ? isEditing
                  ? "Salvando..."
                  : "Criando..."
                : isEditing
                ? "Salvar Alterações"
                : "Criar Parceria"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation ───────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta parceria? Todos os vínculos
              com empresas e alunos serão removidos. Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isSubmitting ? "Excluindo..." : "Excluir Definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
