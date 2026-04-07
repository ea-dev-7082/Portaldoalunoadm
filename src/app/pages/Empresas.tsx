import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "../components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "../components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "../components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Plus, MoreVertical, Pencil, Trash2, Search, Building2,
  MapPin, Phone, Mail, UserRound, CheckCircle2, Handshake, X, Percent,
} from "lucide-react";
import { SearchInput } from "../components/ui/search-input";

// ─── Constants ────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://wytbbtlxrhkvqvlwjivc.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5dGJidGx4cmhrdnF2bHdqaXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTYwMTIsImV4cCI6MjA4ODM5MjAxMn0.7iFjBVva_7nsNlvmfZ_8ddQuTmvCrCx9NTP1sKRzRB0";
const restHeaders = {
  "Content-Type": "application/json",
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface Contact {
  id_contato: string;
  id_empresa: string;
  nome: string;
  setor: string | null;
  telefone: string | null;
  email: string | null;
  created_at: string;
}

interface Parceria {
  id_parceria: string;
  nome: string;
  desconto: number;
}

interface ContactSlot {
  nome: string;
  setor: string;
  telefone: string;
  email: string;
}

const emptyCompanyForm = {
  nome: "", cnpj: "", isMatriz: false, id_matriz: "null",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: "",
};

const emptyContactForm = { nome: "", setor: "", telefone: "", email: "" };

// ─── Component ────────────────────────────────────────────────────────────────
export function Empresas() {
  // -- Data
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // -- Search
  const [searchTerm, setSearchTerm] = useState("");
  const [matrizSearchTerm, setMatrizSearchTerm] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [contactEmpresaFilter, setContactEmpresaFilter] = useState("all");

  // -- View overlay (click on row)
  const [viewOverlayOpen, setViewOverlayOpen] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<any | null>(null);

  // -- Form overlay (create / edit empresa)
  const [formOverlayOpen, setFormOverlayOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyCompanyForm);
  const [filledByCnpj, setFilledByCnpj] = useState<string[]>([]);
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // -- Delete empresa
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // -- Contact form dialog
  const [contactFormOpen, setContactFormOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [contactForm, setContactForm] = useState(emptyContactForm);
  const [contactFormEmpresaId, setContactFormEmpresaId] = useState("");
  const [contactFormLocked, setContactFormLocked] = useState(false); // lock empresa select

  // -- Delete contact
  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  // -- Parcerias in form
  const [allParcerias, setAllParcerias] = useState<Parceria[]>([]);
  const [selectedParcerias, setSelectedParcerias] = useState<Parceria[]>([]);
  const [parceriaSearch, setParceriaSearch] = useState("");
  const [showParceriaDropdown, setShowParceriaDropdown] = useState(false);
  const parceriaSearchRef = useRef<HTMLDivElement>(null);

  // -- Inline contact slots in form
  const [contactSlots, setContactSlots] = useState<ContactSlot[]>([]);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  const fetchEmpresas = useCallback(async () => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/empresas-crud`, {
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) setEmpresas(await res.json());
    } catch (e) { console.error("Erro ao buscar empresas:", e); }
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/contato_empresa?select=*&order=nome`,
        { headers: restHeaders }
      );
      if (res.ok) setContacts(await res.json());
    } catch (e) { console.error("Erro ao buscar contatos:", e); }
  }, []);

  const fetchParcerias = useCallback(async () => {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/parceria?select=id_parceria,nome,desconto&order=nome`,
        { headers: restHeaders }
      );
      if (res.ok) setAllParcerias(await res.json());
    } catch (e) { console.error("Erro ao buscar parcerias:", e); }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([fetchEmpresas(), fetchContacts(), fetchParcerias()]);
    setIsLoading(false);
  }, [fetchEmpresas, fetchContacts, fetchParcerias]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Close parceria dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (parceriaSearchRef.current && !parceriaSearchRef.current.contains(e.target as Node)) {
        setShowParceriaDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ─── CNPJ lookup ────────────────────────────────────────────────────────────
  const handleBuscarCnpj = async () => {
    const limpo = formData.cnpj.replace(/\D/g, "");
    if (limpo.length !== 14) return alert("O CNPJ deve ter 14 dígitos.");
    setIsLoadingCnpj(true);
    try {
      const resp = await fetch(
        `${SUPABASE_URL}/functions/v1/empresas-crud?cnpj=${limpo}`,
        { headers: { apikey: ANON_KEY } }
      );
      if (!resp.ok) { alert("Erro ao consultar CNPJ através do servidor."); return; }
      const data = await resp.json();
      if (data.status === "ERROR") { alert(data.message || "CNPJ não encontrado."); return; }

      const filled: string[] = [];
      const updates: Partial<typeof emptyCompanyForm> = {};

      const set = (key: keyof typeof emptyCompanyForm, val: string) => {
        if (val) { (updates as any)[key] = val; filled.push(key); }
      };
      set("nome", data.fantasia || data.nome || "");
      set("cep", (data.cep || "").replace(/\D/g, ""));
      set("logradouro", data.logradouro || "");
      set("numero", data.numero || "");
      set("complemento", data.complemento || "");
      set("bairro", data.bairro || "");
      set("cidade", data.municipio || "");
      set("estado", data.uf || "");

      setFormData(prev => ({ ...prev, ...updates }));
      setFilledByCnpj(filled);
      setTimeout(() => setFilledByCnpj([]), 4000);
    } catch (e) { console.error(e); alert("Ocorreu um erro ao consultar o CNPJ."); }
    finally { setIsLoadingCnpj(false); }
  };

  // ─── CEP lookup ─────────────────────────────────────────────────────────────
  const handleBuscarCep = async () => {
    const limpo = formData.cep.replace(/\D/g, "");
    if (limpo.length !== 8) return;
    setIsLoadingCep(true);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await resp.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
        }));
      }
    } catch (e) { console.error(e); }
    finally { setIsLoadingCep(false); }
  };

  // ─── Empresa overlay helpers ─────────────────────────────────────────────────
  const openView = (company: any) => {
    setSelectedEmpresa(company);
    setViewOverlayOpen(true);
  };

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(emptyCompanyForm);
    setFilledByCnpj([]);
    setSelectedParcerias([]);
    setContactSlots([]);
    setParceriaSearch("");
    setFormOverlayOpen(true);
  };

  const openEdit = async (company: any) => {
    setIsEditing(true);
    setEditingId(company.id_empresa);
    setFormData({
      nome: company.nome || "", cnpj: company.cnpj || "",
      isMatriz: company.is_matriz || false, id_matriz: company.id_matriz || "null",
      cep: company.endereco?.cep || "", logradouro: company.endereco?.logradouro || "",
      numero: company.endereco?.numero || "", complemento: company.endereco?.complemento || "",
      bairro: company.endereco?.bairro || "", cidade: company.endereco?.cidade || "",
      estado: company.endereco?.estado || "",
    });
    setFilledByCnpj([]);
    setContactSlots([]);
    setParceriaSearch("");
    // Load current parcerias for this empresa
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/empresa_parceria?id_empresa=eq.${company.id_empresa}&select=id_parceria`,
        { headers: restHeaders }
      );
      if (res.ok) {
        const rels: { id_parceria: string }[] = await res.json();
        const ids = rels.map(r => r.id_parceria);
        setSelectedParcerias(allParcerias.filter(p => ids.includes(p.id_parceria)));
      }
    } catch { setSelectedParcerias([]); }
    setViewOverlayOpen(false);
    setFormOverlayOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setViewOverlayOpen(false);
    setDeleteDialogOpen(true);
  };

  const handleFormData = (field: string, value: any) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value };
      if (field === "isMatriz" && value === true) next.id_matriz = "null";
      return next;
    });
  };

  const handleSaveEmpresa = async () => {
    if (!formData.nome.trim()) return alert("Nome é obrigatório.");
    if (!formData.cnpj.trim()) return alert("CNPJ é obrigatório.");
    setIsSubmitting(true);
    try {
      const payload = {
        id_empresa: editingId,
        nome: formData.nome, cnpj: formData.cnpj,
        is_matriz: formData.isMatriz,
        id_matriz: !formData.isMatriz && formData.id_matriz !== "null" ? formData.id_matriz : null,
        cep: formData.cep, logradouro: formData.logradouro, numero: formData.numero,
        complemento: formData.complemento, bairro: formData.bairro,
        cidade: formData.cidade, estado: formData.estado,
        dono_id: null, dono_nome: null, dono_cpf: null, dono_cargo: null,
      };
      const res = await fetch(`${SUPABASE_URL}/functions/v1/empresas-crud`, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao salvar empresa.");

      // Resolve empresa ID
      let empresaId: string | null = editingId;
      if (!isEditing) {
        // Step 1: try to read ID directly from the edge function response
        try {
          const body = await res.clone().json();
          if (body?.id_empresa) {
            empresaId = body.id_empresa;
          } else if (Array.isArray(body) && body[0]?.id_empresa) {
            empresaId = body[0].id_empresa;
          }
        } catch { /* response might not be JSON */ }

        // Step 2: if still no ID, reload via edge function GET and match by CNPJ
        if (!empresaId) {
          try {
            const listRes = await fetch(`${SUPABASE_URL}/functions/v1/empresas-crud`, {
              headers: { "Content-Type": "application/json" },
            });
            if (listRes.ok) {
              const listData: any[] = await listRes.json();
              const cnpjNorm = formData.cnpj.replace(/\D/g, "");
              const found = listData.find(e =>
                e.cnpj === formData.cnpj ||
                (e.cnpj ?? "").replace(/\D/g, "") === cnpjNorm
              );
              empresaId = found?.id_empresa ?? null;
            }
          } catch { /* ignore */ }
        }
      }

      if (empresaId) {
        // 1. Save inline contact slots
        const validSlots = contactSlots.filter(s => s.nome.trim());
        if (validSlots.length > 0) {
          await fetch(`${SUPABASE_URL}/rest/v1/contato_empresa`, {
            method: "POST",
            headers: restHeaders,
            body: JSON.stringify(
              validSlots.map(s => ({
                id_empresa: empresaId,
                nome: s.nome,
                setor: s.setor || null,
                telefone: s.telefone || null,
                email: s.email || null,
              }))
            ),
          });
        }

        // 2. Sync parceria relations
        // Delete old relations then insert new
        await fetch(
          `${SUPABASE_URL}/rest/v1/empresa_parceria?id_empresa=eq.${empresaId}`,
          { method: "DELETE", headers: restHeaders }
        );
        if (selectedParcerias.length > 0) {
          await fetch(`${SUPABASE_URL}/rest/v1/empresa_parceria`, {
            method: "POST",
            headers: restHeaders,
            body: JSON.stringify(
              selectedParcerias.map(p => ({ id_parceria: p.id_parceria, id_empresa: empresaId }))
            ),
          });
        }
      }

      setFormOverlayOpen(false);
      fetchData();
    } catch (err: any) { alert(err.message || "Erro ao salvar empresa."); }
    finally { setIsSubmitting(false); }
  };

  const confirmDeleteEmpresa = async () => {
    if (!deletingId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/empresas-crud`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_empresa: deletingId }),
      });
      if (!res.ok) throw new Error();
      setDeleteDialogOpen(false);
      fetchData();
    } catch { alert("Erro ao excluir empresa."); }
    finally { setIsSubmitting(false); }
  };

  // ─── Contact helpers ────────────────────────────────────────────────────────
  const openCreateContact = (empresaId: string, locked = false) => {
    setEditingContact(null);
    setContactFormEmpresaId(empresaId);
    setContactFormLocked(locked);
    setContactForm(emptyContactForm);
    setContactFormOpen(true);
  };

  const openEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setContactFormEmpresaId(contact.id_empresa);
    setContactFormLocked(true);
    setContactForm({
      nome: contact.nome,
      setor: contact.setor || "",
      telefone: contact.telefone || "",
      email: contact.email || "",
    });
    setContactFormOpen(true);
  };

  const saveContact = async () => {
    if (!contactForm.nome.trim()) return alert("Nome do contato é obrigatório.");
    if (!contactFormEmpresaId) return alert("Selecione uma empresa.");
    setIsSubmitting(true);
    try {
      const payload = {
        id_empresa: contactFormEmpresaId,
        nome: contactForm.nome,
        setor: contactForm.setor || null,
        telefone: contactForm.telefone || null,
        email: contactForm.email || null,
      };
      if (editingContact) {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/contato_empresa?id_contato=eq.${editingContact.id_contato}`,
          { method: "PATCH", headers: restHeaders, body: JSON.stringify(payload) }
        );
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/contato_empresa`, {
          method: "POST", headers: restHeaders, body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error();
      }
      setContactFormOpen(false);
      fetchContacts();
    } catch { alert("Erro ao salvar contato."); }
    finally { setIsSubmitting(false); }
  };

  const openDeleteContact = (id: string) => {
    setDeletingContactId(id);
    setDeleteContactDialogOpen(true);
  };

  const confirmDeleteContact = async () => {
    if (!deletingContactId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/contato_empresa?id_contato=eq.${deletingContactId}`,
        { method: "DELETE", headers: restHeaders }
      );
      if (!res.ok) throw new Error();
      setDeleteContactDialogOpen(false);
      fetchContacts();
    } catch { alert("Erro ao excluir contato."); }
    finally { setIsSubmitting(false); }
  };
  // ─── Parceria helpers (in form) ──────────────────────────────────────────────
  const addParceriaToForm = (p: Parceria) => {
    setSelectedParcerias(prev =>
      prev.some(s => s.id_parceria === p.id_parceria) ? prev : [...prev, p]
    );
    setParceriaSearch("");
    setShowParceriaDropdown(false);
  };

  const removeParceriaFromForm = (id: string) =>
    setSelectedParcerias(prev => prev.filter(p => p.id_parceria !== id));

  // ─── Contact slot helpers ────────────────────────────────────────────────────
  const addContactSlot = () =>
    setContactSlots(prev => [...prev, { nome: "", setor: "", telefone: "", email: "" }]);

  const removeContactSlot = (idx: number) =>
    setContactSlots(prev => prev.filter((_, i) => i !== idx));

  const updateContactSlot = (idx: number, field: keyof ContactSlot, value: string) =>
    setContactSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  // ─── Derived ─────────────────────────────────────────────────────────────────
  const matrizesList = empresas.filter(e => e.is_matriz);
  const filiaisEIndependentes = empresas.filter(e => !e.is_matriz);

  const filteredEmpresas = filiaisEIndependentes.filter(e =>
    e.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || e.cnpj?.includes(searchTerm)
  );
  const filteredMatrizes = matrizesList.filter(e =>
    e.nome?.toLowerCase().includes(matrizSearchTerm.toLowerCase()) || e.cnpj?.includes(matrizSearchTerm)
  );
  const filteredContacts = contacts.filter(c => {
    const q = contactSearch.toLowerCase();
    const matchSearch = !q ||
      c.nome.toLowerCase().includes(q) ||
      (c.setor?.toLowerCase().includes(q)) ||
      (c.email?.toLowerCase().includes(q));
    const matchEmpresa = contactEmpresaFilter === "all" || c.id_empresa === contactEmpresaFilter;
    return matchSearch && matchEmpresa;
  });

  const selectedEmpresaContacts = contacts.filter(c => c.id_empresa === selectedEmpresa?.id_empresa);

  const filteredParceriaSearch = allParcerias.filter(p => {
    const q = parceriaSearch.toLowerCase();
    return (
      !selectedParcerias.some(s => s.id_parceria === p.id_parceria) &&
      (p.nome.toLowerCase().includes(q))
    );
  });

  // CSS helper: highlight fields auto-filled by CNPJ
  const autoFilled = (field: string) =>
    filledByCnpj.includes(field)
      ? "border-l-[3px] border-l-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20"
      : "";

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Empresas e Matrizes</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu cadastro único de empresas e colaborações</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Adicionar Empresa
        </Button>
      </div>

      {/* ── Empresas Cadastradas ───────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Empresas Cadastradas</h2>
        <Card className="p-4">
          <SearchInput placeholder="Buscar empresa por nome ou CNPJ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </Card>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Matriz Vinculada</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpresas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Não há empresas filiais ou independentes cadastradas.
                    </TableCell>
                  </TableRow>
                ) : filteredEmpresas.map((company) => (
                  <TableRow
                    key={company.id_empresa}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => openView(company)}
                  >
                    <TableCell className="font-medium">{company.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{company.cnpj}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {company.id_matriz ? "Filial" : "Independente"}
                      </Badge>
                    </TableCell>
                    <TableCell>{company.id_matriz ? matrizesList.find(m => m.id_empresa === company.id_matriz)?.nome || "Sim" : "—"}</TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(company)}><Pencil className="w-4 h-4 mr-2" />Alterar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDelete(company.id_empresa)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* ── Matrizes ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Building2 className="w-5 h-5" /> Matrizes (Sedes)
        </h2>
        <Card className="p-4">
          <SearchInput placeholder="Buscar matriz..." value={matrizSearchTerm} onChange={(e) => setMatrizSearchTerm(e.target.value)} />
        </Card>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Matriz</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead className="text-center">Qtd. Filiais</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatrizes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma matriz cadastrada ainda.</TableCell>
                  </TableRow>
                ) : filteredMatrizes.map((matriz) => (
                  <TableRow
                    key={matriz.id_empresa}
                    className="cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => openView(matriz)}
                  >
                    <TableCell className="font-medium text-primary">{matriz.nome}</TableCell>
                    <TableCell>{matriz.cnpj}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{empresas.filter(e => e.id_matriz === matriz.id_empresa).length}</Badge>
                    </TableCell>
                    <TableCell onClick={e => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(matriz)}><Pencil className="w-4 h-4 mr-2" />Alterar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDelete(matriz.id_empresa)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* ── Contatos ──────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <UserRound className="w-5 h-5" /> Contatos
          </h2>
          <Button variant="outline" className="gap-2" onClick={() => openCreateContact("", false)}>
            <Plus className="w-4 h-4" /> Adicionar Contato
          </Button>
        </div>
        <Card className="p-4">
          <div className="flex gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <SearchInput
                placeholder="Buscar por nome, setor ou email..."
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
              />
            </div>
            <Select value={contactEmpresaFilter} onValueChange={setContactEmpresaFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {empresas.map(e => (
                  <SelectItem key={e.id_empresa} value={e.id_empresa}>{e.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="w-[60px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum contato encontrado.
                    </TableCell>
                  </TableRow>
                ) : filteredContacts.map(contact => (
                  <TableRow key={contact.id_contato}>
                    <TableCell className="font-medium">{contact.nome}</TableCell>
                    <TableCell>
                      {contact.setor
                        ? <Badge variant="outline" className="text-xs">{contact.setor}</Badge>
                        : <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {contact.telefone
                        ? <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{contact.telefone}</span>
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {contact.email
                        ? <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{contact.email}</span>
                        : "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {empresas.find(e => e.id_empresa === contact.id_empresa)?.nome || "—"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditContact(contact)}><Pencil className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDeleteContact(contact.id_contato)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW OVERLAY — click on a company row
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={viewOverlayOpen} onOpenChange={setViewOverlayOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-2xl truncate">{selectedEmpresa?.nome}</DialogTitle>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className="font-mono text-xs">{selectedEmpresa?.cnpj}</Badge>
                  <Badge variant={selectedEmpresa?.is_matriz ? "default" : "secondary"}>
                    {selectedEmpresa?.is_matriz ? "Matriz" : selectedEmpresa?.id_matriz ? "Filial" : "Independente"}
                  </Badge>
                  {selectedEmpresa?.id_matriz && (
                    <span className="text-xs text-muted-foreground">
                      ↳ {matrizesList.find(m => m.id_empresa === selectedEmpresa.id_matriz)?.nome}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(selectedEmpresa)}>
                  <Pencil className="w-4 h-4 mr-1.5" /> Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => openDelete(selectedEmpresa?.id_empresa)}>
                  <Trash2 className="w-4 h-4 mr-1.5" /> Excluir
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Address */}
            {selectedEmpresa?.endereco?.logradouro ? (
              <div className="bg-muted rounded-lg p-4">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Endereço
                </h3>
                <p className="text-sm text-muted-foreground">
                  {selectedEmpresa.endereco.logradouro}
                  {selectedEmpresa.endereco.numero && `, ${selectedEmpresa.endereco.numero}`}
                  {selectedEmpresa.endereco.complemento && ` — ${selectedEmpresa.endereco.complemento}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {[selectedEmpresa.endereco.bairro, selectedEmpresa.endereco.cidade, selectedEmpresa.endereco.estado]
                    .filter(Boolean).join(" · ")}
                </p>
                {selectedEmpresa.endereco.cep && (
                  <p className="text-xs text-muted-foreground mt-1">CEP: {selectedEmpresa.endereco.cep}</p>
                )}
              </div>
            ) : (
              <div className="bg-muted rounded-lg p-4 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4 inline mr-1" /> Endereço não cadastrado.
              </div>
            )}

            {/* Contacts inside view */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <UserRound className="w-4 h-4" />
                  Contatos
                  {selectedEmpresaContacts.length > 0 && (
                    <Badge variant="secondary">{selectedEmpresaContacts.length}</Badge>
                  )}
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openCreateContact(selectedEmpresa?.id_empresa, true)}
                >
                  <Plus className="w-4 h-4 mr-1" /> Adicionar
                </Button>
              </div>

              {selectedEmpresaContacts.length === 0 ? (
                <div className="border border-dashed border-border rounded-lg p-6 text-center text-sm text-muted-foreground">
                  Nenhum contato cadastrado para esta empresa.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEmpresaContacts.map(contact => (
                    <div
                      key={contact.id_contato}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">{contact.nome}</p>
                          {contact.setor && (
                            <Badge variant="outline" className="text-xs">{contact.setor}</Badge>
                          )}
                        </div>
                        <div className="flex gap-4 mt-1 flex-wrap">
                          {contact.telefone && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {contact.telefone}
                            </p>
                          )}
                          {contact.email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {contact.email}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 flex-shrink-0 ml-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditContact(contact)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDeleteContact(contact.id_contato)}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          FORM OVERLAY — create / edit empresa
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={formOverlayOpen} onOpenChange={setFormOverlayOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Empresa" : "Adicionar Empresa"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Altere as informações da Empresa e Endereço"
                : "Informe o CNPJ para preenchimento automático dos dados."}
            </DialogDescription>
          </DialogHeader>

          {filledByCnpj.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-md p-3">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Campos destacados foram preenchidos automaticamente via CNPJ.
            </div>
          )}

          <div className="space-y-6 py-2">

            {/* CNPJ + Nome */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <div className="flex gap-2">
                  <Input
                    value={formData.cnpj}
                    onChange={(e) => handleFormData("cnpj", e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                  <Button variant="secondary" onClick={handleBuscarCnpj} disabled={isLoadingCnpj}>
                    {isLoadingCnpj ? "Consultando..." : <Search className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome ou Razão Social</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => handleFormData("nome", e.target.value)}
                  placeholder="Organização / Empresa"
                  className={autoFilled("nome")}
                />
              </div>
            </div>

            {/* Classificação */}
            <div className="bg-muted p-4 rounded-lg border space-y-4">
              <h3 className="text-sm font-semibold">Classificação Corporativa</h3>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_matriz_switch"
                  checked={formData.isMatriz}
                  onCheckedChange={(val) => handleFormData("isMatriz", val)}
                />
                <Label htmlFor="is_matriz_switch" className="cursor-pointer">Esta empresa é uma Matriz</Label>
              </div>
              {!formData.isMatriz && (
                <div className="space-y-2">
                  <Label className="text-primary">Vincular a uma Matriz (Opcional)</Label>
                  <Select value={formData.id_matriz} onValueChange={(val) => handleFormData("id_matriz", val)}>
                    <SelectTrigger><SelectValue placeholder="Sem vínculo (Empresa Independente)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">Sem vínculo (Empresa Independente)</SelectItem>
                      {matrizesList.map(m => (
                        <SelectItem key={m.id_empresa} value={m.id_empresa}>
                          {m.nome} (CNPJ: {m.cnpj})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Endereço */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold border-b pb-2">Endereço Comercial</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>CEP</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.cep}
                      onChange={(e) => handleFormData("cep", e.target.value)}
                      placeholder="00000-000"
                      className={autoFilled("cep")}
                    />
                    <Button variant="secondary" onClick={handleBuscarCep} disabled={isLoadingCep}>
                      {isLoadingCep ? "Buscando..." : <Search className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logradouro</Label>
                  <Input
                    value={formData.logradouro}
                    onChange={(e) => handleFormData("logradouro", e.target.value)}
                    placeholder="Rua, Avenida..."
                    className={autoFilled("logradouro")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => handleFormData("numero", e.target.value)}
                    placeholder="123"
                    className={autoFilled("numero")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Complemento</Label>
                  <Input
                    value={formData.complemento}
                    onChange={(e) => handleFormData("complemento", e.target.value)}
                    placeholder="Sala 1, Galpão A"
                    className={autoFilled("complemento")}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Bairro</Label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => handleFormData("bairro", e.target.value)}
                    placeholder="Centro"
                    className={autoFilled("bairro")}
                  />
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-2">
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      value={formData.cidade}
                      onChange={(e) => handleFormData("cidade", e.target.value)}
                      placeholder="São Paulo"
                      className={autoFilled("cidade")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Input
                      value={formData.estado}
                      onChange={(e) => handleFormData("estado", e.target.value)}
                      placeholder="SP"
                      className={autoFilled("estado")}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Parcerias ─────────────────────────────────────────────────── */}
            <div className="space-y-3">
              <div>
                <Label>Parcerias</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Vincule esta empresa às parcerias existentes. Múltiplas seleções permitidas.</p>
              </div>
              <div className="relative" ref={parceriaSearchRef}>
                <div className="flex items-center border border-input rounded-md bg-background px-3 gap-2">
                  <Handshake className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <input
                    className="flex-1 py-2 text-sm outline-none bg-transparent placeholder:text-muted-foreground"
                    placeholder="Pesquisar parceria por nome..."
                    value={parceriaSearch}
                    onChange={(e) => { setParceriaSearch(e.target.value); setShowParceriaDropdown(true); }}
                    onFocus={() => setShowParceriaDropdown(true)}
                  />
                </div>
                {showParceriaDropdown && parceriaSearch.length > 0 && (
                  <div className="absolute z-50 top-full mt-1 w-full bg-popover border border-border rounded-md shadow-lg max-h-44 overflow-y-auto">
                    {filteredParceriaSearch.length === 0 ? (
                      <p className="text-sm text-muted-foreground p-3">Nenhuma parceria encontrada.</p>
                    ) : filteredParceriaSearch.map((p) => (
                      <button
                        key={p.id_parceria}
                        type="button"
                        className="w-full text-left px-4 py-2.5 hover:bg-accent transition-colors flex items-center gap-3"
                        onClick={() => addParceriaToForm(p)}
                      >
                        <Handshake className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="flex-1 text-sm font-medium">{p.nome}</span>
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs gap-1">
                          <Percent className="w-3 h-3" />{Number(p.desconto).toFixed(0)}%
                        </Badge>
                        <Plus className="w-4 h-4 text-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedParcerias.length > 0 ? (
                <div className="flex flex-wrap gap-2 border border-dashed border-border rounded-lg p-3 min-h-[52px]">
                  {selectedParcerias.map((p) => (
                    <Badge key={p.id_parceria} variant="secondary" className="gap-1.5 pr-1.5 text-sm h-7">
                      <Handshake className="w-3.5 h-3.5" />
                      {p.nome}
                      <span className="text-xs opacity-60">{Number(p.desconto).toFixed(0)}%</span>
                      <button
                        type="button"
                        onClick={() => removeParceriaFromForm(p.id_parceria)}
                        className="ml-0.5 rounded-full hover:bg-destructive/20 hover:text-destructive p-0.5 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border rounded-lg p-3 text-center text-sm text-muted-foreground">
                  Nenhuma parceria selecionada.
                </div>
              )}
            </div>

            {/* ── Contatos Inline ───────────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Contatos da Empresa</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isEditing
                      ? "Adicione novos contatos. Para editar os existentes use o overlay de visualização."
                      : "Adicione responsáveis junto com a criação da empresa."}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addContactSlot} className="gap-1.5 flex-shrink-0">
                  <Plus className="w-4 h-4" /> Adicionar Contato
                </Button>
              </div>
              {contactSlots.map((slot, idx) => (
                <div key={idx} className="border border-border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <UserRound className="w-3.5 h-3.5" /> Contato {idx + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:text-destructive"
                      onClick={() => removeContactSlot(idx)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nome *</Label>
                      <Input value={slot.nome} onChange={(e) => updateContactSlot(idx, "nome", e.target.value)} placeholder="Nome do responsável" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Setor / Cargo</Label>
                      <Input value={slot.setor} onChange={(e) => updateContactSlot(idx, "setor", e.target.value)} placeholder="RH, Gerência, Dono..." />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1"><Phone className="w-3 h-3" />Telefone</Label>
                      <Input value={slot.telefone} onChange={(e) => updateContactSlot(idx, "telefone", e.target.value)} placeholder="(11) 99999-9999" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs flex items-center gap-1"><Mail className="w-3 h-3" />Email</Label>
                      <Input value={slot.email} onChange={(e) => updateContactSlot(idx, "email", e.target.value)} placeholder="email@empresa.com" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>{/* end space-y-6 */}

          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOverlayOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveEmpresa} disabled={isSubmitting}>
              {isSubmitting ? (isEditing ? "Salvando..." : "Cadastrando...") : (isEditing ? "Salvar Alterações" : "Cadastrar Empresa")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════════
          CONTACT FORM DIALOG
      ══════════════════════════════════════════════════════════════════════ */}
      <Dialog open={contactFormOpen} onOpenChange={setContactFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingContact ? "Editar Contato" : "Novo Contato"}</DialogTitle>
            <DialogDescription>
              {editingContact ? "Atualize as informações do responsável." : "Adicione um responsável a uma empresa."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Empresa select — only shown if not locked */}
            {!contactFormLocked ? (
              <div className="space-y-2">
                <Label>Empresa *</Label>
                <Select value={contactFormEmpresaId} onValueChange={setContactFormEmpresaId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa..." />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map(e => (
                      <SelectItem key={e.id_empresa} value={e.id_empresa}>{e.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-muted-foreground text-xs">Empresa</Label>
                <p className="text-sm font-medium">
                  {empresas.find(e => e.id_empresa === contactFormEmpresaId)?.nome || "—"}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Nome do Responsável *</Label>
              <Input
                value={contactForm.nome}
                onChange={(e) => setContactForm(p => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label>Setor / Cargo</Label>
              <Input
                value={contactForm.setor}
                onChange={(e) => setContactForm(p => ({ ...p, setor: e.target.value }))}
                placeholder="Ex: RH, Gerência, Dono, Financeiro..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input
                  value={contactForm.telefone}
                  onChange={(e) => setContactForm(p => ({ ...p, telefone: e.target.value }))}
                  placeholder="(11) 99999-9999"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  value={contactForm.email}
                  onChange={(e) => setContactForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@empresa.com"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setContactFormOpen(false)}>Cancelar</Button>
            <Button onClick={saveContact} disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : editingContact ? "Salvar Alterações" : "Adicionar Contato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Empresa ────────────────────────────────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e removerá os vínculos de endereço e contatos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={confirmDeleteEmpresa}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isSubmitting ? "Excluindo..." : "Excluir Definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Delete Contact ────────────────────────────────────────────────────── */}
      <AlertDialog open={deleteContactDialogOpen} onOpenChange={setDeleteContactDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Contato</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover este contato? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={isSubmitting}
              onClick={confirmDeleteContact}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {isSubmitting ? "Removendo..." : "Remover Contato"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
