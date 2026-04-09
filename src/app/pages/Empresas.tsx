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
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "../components/ui/tabs";
import { Checkbox } from "../components/ui/checkbox";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import {
  Plus, MoreVertical, Pencil, Trash2, Search, Building2,
  MapPin, Phone, Mail, UserRound, CheckCircle2, Handshake, X, Percent,
} from "lucide-react";
import { SearchInput } from "../components/ui/search-input";
import { cn } from "../components/ui/utils";

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
  desconto_adicional?: number;
  vagas_gratuitas?: number;
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
  const [contactSectorFilter, setContactSectorFilter] = useState("all");
  const [contactFormEmpresaSearch, setContactFormEmpresaSearch] = useState("");

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
  const [allParcerias, setAllParcerias] = useState<Parceria[]>([]); // Formação plans
  const [regularParcerias, setRegularParcerias] = useState<any[]>([]); // Regular partnerships
  const [selectedParcerias, setSelectedParcerias] = useState<Parceria[]>([]); // Selected Formação plan
  const [selectedRegularParcerias, setSelectedRegularParcerias] = useState<any[]>([]); // Selected regular partnerships
  const [showFormacao, setShowFormacao] = useState(false);

  const [parceriaSearch, setParceriaSearch] = useState("");
  const [showParceriaDropdown, setShowParceriaDropdown] = useState(false);
  const parceriaSearchRef = useRef<HTMLDivElement>(null);

  // -- Inline contact slots in form
  const [contactSlots, setContactSlots] = useState<ContactSlot[]>([]);

  // -- View Tabs
  const [activeTab, setActiveTab] = useState("geral");
  const [alunosEmpresa, setAlunosEmpresa] = useState<any[]>([]);
  const [isLoadingAlunosEmpresa, setIsLoadingAlunosEmpresa] = useState(false);
  const [alunosSearch, setAlunosSearch] = useState("");
  const [contatosSearch, setContatosSearch] = useState("");

  const formatCPF = (cpf: string) => {
    const raw = (cpf || "").replace(/\D/g, "");
    if (raw.length !== 11) return cpf;
    return `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9, 11)}`;
  };

  const formatPhone = (val: string) => {
    const raw = (val || "").replace(/\D/g, "");
    if (raw.length <= 10) {
      return raw.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3").trim();
    }
    return raw.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3").trim();
  };

  const onlyDigits = (val: string) => (val || "").replace(/\D/g, "");

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
      // 1. Formation plans
      const resPlans = await fetch(
        `${SUPABASE_URL}/rest/v1/formacao_planos?select=*&ativo=eq.true&order=nome`,
        { headers: restHeaders }
      );
      if (resPlans.ok) {
        const plans = await resPlans.json();
        const orderMap: Record<string, number> = { "PLUS": 1, "PREMIUM": 2, "BLACK": 3 };
        const sortedPlans = plans.sort((a: any, b: any) => {
          const nameA = (a.nome || "").toUpperCase();
          const nameB = (b.nome || "").toUpperCase();
          return (orderMap[nameA] || 99) - (orderMap[nameB] || 99);
        });
        setAllParcerias(sortedPlans.map((p: any) => ({ ...p, id_parceria: p.id_plano || p.id_parceria || "" })));
      }

      // 2. Regular partnerships
      const resReg = await fetch(
        `${SUPABASE_URL}/rest/v1/parceria?select=*&order=nome`,
        { headers: restHeaders }
      );
      if (resReg.ok) setRegularParcerias(await resReg.json());
    } catch (e) { console.error("Erro ao carregar dados de parcerias:", e); }
  }, []);

  const fetchAlunosEmpresa = async (empresaId: string) => {
    setIsLoadingAlunosEmpresa(true);
    try {
      const [resColab, resAlunos] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/colaborador?id_empresa=eq.${empresaId}&select=*`, { headers: restHeaders }),
        fetch(`${SUPABASE_URL}/rest/v1/aluno?id_empresa=eq.${empresaId}&select=*`, { headers: restHeaders })
      ]);

      let all: any[] = [];
      if (resColab.ok) all = [...all, ...(await resColab.json())];
      if (resAlunos.ok) all = [...all, ...(await resAlunos.json())];

      setAlunosEmpresa(all);
    } catch (e) { console.error("Erro ao buscar alunos da empresa:", e); }
    finally { setIsLoadingAlunosEmpresa(false); }
  };

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

      console.log("CNPJ Lookup Result:", data); // Verifique no console do navegador (F12) o objeto bruto

      const filled: string[] = [];
      const updates: Partial<typeof emptyCompanyForm> = {};

      const set = (key: keyof typeof emptyCompanyForm, val: any) => {
        let finalVal = val ? val.toString() : "";
        if (key === "cep") finalVal = maskCEP(finalVal);

        // Padronização para maiúsculas em campos de texto de endereço
        if (["logradouro", "bairro", "cidade", "estado"].includes(key)) {
          finalVal = finalVal.toUpperCase();
        }

        (updates as any)[key] = finalVal;
        if (finalVal) filled.push(key);
      };

      // Prioriza Nome Fantasia, se não existir usa a Razão Social (nome/razao_social)
      let rawNome = (
        (data.fantasia && data.fantasia.trim() !== "") ? data.fantasia :
          (data.nome || data.razao_social || "")
      ).toString();

      rawNome = rawNome.replace(/^\d+[\s.-]*/, "").trim().toUpperCase();

      // ReceitaWS traz o logradouro completo no campo 'logradouro'
      // No entanto, BrasilAPI e outros trazem separado em fields como 'descricao_tipo_de_logradouro'
      let rawLogradouro = (data.logradouro || data.street || "").toString().trim();
      const tipo = (
        data.descricao_tipo_de_logradouro ||
        data.tipo_logradouro ||
        data.tipo ||
        data.type ||
        ""
      ).toString().trim();

      if (tipo && !rawLogradouro.toUpperCase().startsWith(tipo.toUpperCase())) {
        rawLogradouro = `${tipo} ${rawLogradouro}`.trim();
      }

      set("nome", rawNome);
      set("cep", (data.cep || "").replace(/\D/g, ""));
      set("logradouro", rawLogradouro);
      set("numero", (data.numero || "").toString());
      set("complemento", (data.complemento || "").toString());
      set("bairro", (data.bairro || "").toString());
      set("cidade", (data.municipio || data.localidade || "").toString());
      set("estado", (data.uf || "").toString());

      setFormData(prev => ({ ...prev, ...updates }));

      // Adicione um contato padrão se a API trouxer telefone/email
      const apiPhone = (data.telefone || data.ddd_telefone_1 || "").toString();
      const apiEmail = (data.email || "").toString();
      if (apiPhone || apiEmail) {
        setContactSlots([{
          nome: "CONTATO COMERCIAL",
          setor: "COMERCIAL",
          telefone: formatPhone(apiPhone),
          email: apiEmail.toLowerCase()
        }]);
      }
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
          logradouro: data.logradouro || "",
          bairro: (data.bairro || "").toUpperCase(),
          cidade: (data.localidade || "").toUpperCase(),
          estado: (data.uf || "").toUpperCase(),
        }));
      }
    } catch (e) { console.error(e); }
    finally { setIsLoadingCep(false); }
  };

  // ─── Empresa overlay helpers ─────────────────────────────────────────────────
  const openView = async (company: any) => {
    setSelectedEmpresa(company);
    setActiveTab("geral");
    fetchAlunosEmpresa(company.id_empresa);

    // Load REGULAR partnerships for view
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/empresa_parceria?id_empresa=eq.${company.id_empresa}&select=id_parceria`, { headers: restHeaders });
      if (res.ok) {
        const rels = await res.json();
        const ids = rels.map((r: any) => r.id_parceria);
        setSelectedRegularParcerias(regularParcerias.filter(p => ids.includes(p.id_parceria)));
      }
    } catch { setSelectedRegularParcerias([]); }

    setViewOverlayOpen(true);
  };

  const openCreate = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData(emptyCompanyForm);
    setFilledByCnpj([]);
    setSelectedParcerias([]);
    setSelectedRegularParcerias([]);
    setShowFormacao(false);
    setContactSlots([]);
    setParceriaSearch("");
    setFormOverlayOpen(true);
  };

  const openEdit = async (company: any) => {
    setIsEditing(true);
    setEditingId(company.id_empresa);
    setFormData({
      nome: company.nome || "", cnpj: maskCNPJ(company.cnpj || ""),
      isMatriz: company.is_matriz || false, id_matriz: company.id_matriz || "null",
      cep: maskCEP(company.endereco?.cep || ""), logradouro: company.endereco?.logradouro || "",
      numero: company.endereco?.numero || "", complemento: company.endereco?.complemento || "",
      bairro: company.endereco?.bairro || "", cidade: company.endereco?.cidade || "",
      estado: company.endereco?.estado || "",
    });
    setFilledByCnpj([]);
    setContactSlots([]);
    setParceriaSearch("");

    // Load FORMACAO partnership
    const partnership = company.formacao;
    if (partnership && partnership.id_plano) {
      const plano = allParcerias.find(p => p.id_parceria === partnership.id_plano);
      if (plano) {
        setSelectedParcerias([plano]);
        setShowFormacao(true);
      } else {
        setSelectedParcerias([{ id_parceria: partnership.id_plano, nome: "Plano Vinculado", desconto: 0 }]);
        setShowFormacao(true);
      }
    } else {
      setSelectedParcerias([]);
      setShowFormacao(false);
    }

    // Load REGULAR partnerships
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/empresa_parceria?id_empresa=eq.${company.id_empresa}&select=id_parceria`, { headers: restHeaders });
      if (res.ok) {
        const rels = await res.json();
        const ids = rels.map((r: any) => r.id_parceria);
        setSelectedRegularParcerias(regularParcerias.filter(p => ids.includes(p.id_parceria)));
      }
    } catch { setSelectedRegularParcerias([]); }

    setViewOverlayOpen(false);
    setFormOverlayOpen(true);
  };

  const openDelete = (id: string) => {
    setDeletingId(id);
    setViewOverlayOpen(false);
    setDeleteDialogOpen(true);
  };

  const maskCNPJ = (val: string) => {
    return val
      .replace(/\D/g, "")
      .replace(/^(\d{2})(\d)/, "$1.$2")
      .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1/$2")
      .replace(/(\d{4})(\d)/, "$1-$2")
      .substring(0, 18);
  };
  const maskCEP = (val: string) => {
    return val
      .replace(/\D/g, "")
      .replace(/^(\d{5})(\d)/, "$1-$2")
      .substring(0, 9);
  };

  const handleFormData = (field: string, value: any) => {
    setFormData(prev => {
      let finalValue = value;
      if (field === "cep") {
        finalValue = maskCEP(value);
      } else if (field === "cnpj") {
        finalValue = maskCNPJ(value);
      } else if (field === "nome" || field === "cidade" || field === "bairro") {
        finalValue = value.toString().toUpperCase();
      }
      const next = { ...prev, [field]: finalValue };
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
        nome: formData.nome,
        cnpj: formData.cnpj.replace(/\D/g, ""),
        is_matriz: formData.isMatriz,
        id_matriz: !formData.isMatriz && formData.id_matriz !== "null" ? formData.id_matriz : null,
        cep: formData.cep.replace(/\D/g, ""),
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento || "",
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        dono_id: null, dono_nome: null, dono_cpf: null, dono_cargo: null,
      };
      const res = await fetch(`${SUPABASE_URL}/functions/v1/empresas-crud`, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || "Erro ao salvar empresa.");
      }

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
                telefone: onlyDigits(s.telefone),
                email: s.email || null,
              }))
            ),
          });
        }

        // 2. Sync partnership relations (empresa_formacao)
        await fetch(
          `${SUPABASE_URL}/rest/v1/empresa_formacao?id_empresa=eq.${empresaId}`,
          { method: "DELETE", headers: restHeaders }
        );
        if (showFormacao && selectedParcerias.length > 0) {
          await fetch(`${SUPABASE_URL}/rest/v1/empresa_formacao`, {
            method: "POST",
            headers: restHeaders,
            body: JSON.stringify({
              id_empresa: empresaId,
              id_plano: selectedParcerias[0].id_parceria,
              status: 'Ativo'
            }),
          });
        }

        // 3. Sync regular parcerias
        await fetch(
          `${SUPABASE_URL}/rest/v1/empresa_parceria?id_empresa=eq.${empresaId}`,
          { method: "DELETE", headers: restHeaders }
        );
        if (selectedRegularParcerias.length > 0) {
          await fetch(`${SUPABASE_URL}/rest/v1/empresa_parceria`, {
            method: "POST",
            headers: restHeaders,
            body: JSON.stringify(
              selectedRegularParcerias.map(p => ({ id_empresa: empresaId, id_parceria: p.id_parceria }))
            )
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
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${ANON_KEY}`, "apikey": ANON_KEY },
        body: JSON.stringify({ id_empresa: deletingId }),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.error || "Erro ao excluir empresa do banco de dados (pode haver vínculos ativos como alunos ou treinamentos).");
      }

      setDeleteDialogOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Erro na exclusão:", err);
      alert(err.message || "Erro ao excluir empresa.");
    }
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
        telefone: onlyDigits(contactForm.telefone),
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
      (c.email?.toLowerCase().includes(q)) ||
      (c.telefone?.includes(q));
    const matchEmpresa = contactEmpresaFilter === "all" || c.id_empresa === contactEmpresaFilter;
    const matchSector = contactSectorFilter === "all" || c.setor?.toUpperCase() === contactSectorFilter;
    return matchSearch && matchEmpresa && matchSector;
  });

  const allSectors = Array.from(new Set(contacts.map(c => c.setor).filter(Boolean).map(s => s!.toUpperCase()))).sort();

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
            <Select value={contactSectorFilter} onValueChange={setContactSectorFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por setor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os setores</SelectItem>
                {allSectors.map(s => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
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
        <DialogContent className="max-w-3xl h-[85vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Detalhes da Empresa</DialogTitle>
            <DialogDescription>
              Visualize informações completas, contatos, alunos e parcerias desta empresa.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-primary/5 p-6 border-b border-border flex items-start justify-between">
            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="text-2xl font-bold flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                <span className="truncate">{selectedEmpresa?.nome}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs bg-background/50 text-muted-foreground">{selectedEmpresa?.cnpj}</Badge>
                <Badge variant={selectedEmpresa?.is_matriz ? "default" : "secondary"} className="uppercase text-[10px] tracking-wider font-bold">
                  {selectedEmpresa?.is_matriz ? "Matriz (Sede)" : selectedEmpresa?.id_matriz ? "Filial" : "Independente"}
                </Badge>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0 ml-4 pt-1">
              <Button size="sm" variant="outline" className="h-8 gap-1.5 bg-background hover:bg-accent border-border" onClick={() => openEdit(selectedEmpresa)}>
                <Pencil className="w-3.5 h-3.5" /> Editar
              </Button>
              <Button size="sm" variant="destructive" className="h-8 gap-1.5 bg-destructive/10 hover:bg-destructive text-destructive hover:text-destructive-foreground border-none shadow-none" onClick={() => openDelete(selectedEmpresa?.id_empresa)}>
                <Trash2 className="w-3.5 h-3.5" /> Excluir
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-2 border-b bg-muted/30">
              <TabsList className="grid grid-cols-4 w-full h-10 bg-muted/20 gap-1 p-1 rounded-lg">
                <TabsTrigger value="geral" className="text-[10px] uppercase font-bold tracking-tight h-8 data-[state=active]:bg-background data-[state=active]:text-primary">Geral</TabsTrigger>
                <TabsTrigger value="parcerias" className="text-[10px] uppercase font-bold tracking-tight h-8 data-[state=active]:bg-background data-[state=active]:text-primary">Parcerias</TabsTrigger>
                <TabsTrigger value="alunos" className="text-[10px] uppercase font-bold tracking-tight h-8 data-[state=active]:bg-background data-[state=active]:text-primary">Alunos</TabsTrigger>
                <TabsTrigger value="contatos" className="text-[10px] uppercase font-bold tracking-tight h-8 data-[state=active]:bg-background data-[state=active]:text-primary">Contatos</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-card/5 custom-scrollbar">
              <TabsContent value="geral" className="mt-0 space-y-6 focus-visible:ring-0 outline-none">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                      <MapPin className="w-3 h-3" /> Endereço Comercial
                    </h4>
                    {selectedEmpresa?.endereco?.logradouro ? (
                      <div className="bg-background border border-border/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                        <p className="text-sm font-semibold text-foreground leading-relaxed">
                          {selectedEmpresa.endereco.logradouro}, {selectedEmpresa.endereco.numero}
                        </p>
                        {selectedEmpresa.endereco.complemento && (
                          <p className="text-xs text-muted-foreground mt-1.5 italic bg-muted/30 px-2 py-1 rounded inline-block">{selectedEmpresa.endereco.complemento}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-3 font-medium">
                          {selectedEmpresa.endereco.bairro}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedEmpresa.endereco.cidade} — {selectedEmpresa.endereco.estado}
                        </p>
                        <div className="mt-4 pt-4 border-t flex items-center justify-between">
                          <span className="text-[10px] font-mono text-primary/60 font-bold uppercase">CEP: {selectedEmpresa.endereco.cep}</span>
                          <Badge variant="outline" className="text-[9px] uppercase tracking-tighter opacity-50">Local principal</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-muted/40 border-dashed border border-border rounded-xl p-8 text-center text-xs text-muted-foreground italic flex flex-col items-center gap-2">
                        <span className="opacity-50 underline decoration-dotted">Endereço não informado.</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                      <Building2 className="w-3 h-3" /> Hierarquia & Estrutura
                    </h4>
                    <div className="bg-background border border-border/60 rounded-xl p-5 space-y-4 shadow-sm">
                      <div>
                        <Label className="text-[9px] uppercase font-black opacity-40 leading-none">Status Corporativo</Label>
                        <p className="text-sm font-bold mt-1 text-primary">{selectedEmpresa?.is_matriz ? "Matriz Central / Sede" : "Filial / Unidade de Apoio"}</p>
                      </div>
                      {!selectedEmpresa?.is_matriz && selectedEmpresa?.id_matriz && (
                        <div className="pt-3 border-t">
                          <Label className="text-[9px] uppercase font-black opacity-40 leading-none">Vinculada à Matriz</Label>
                          <div
                            className="flex items-center gap-2 mt-2 p-2 rounded-lg hover:bg-primary/5 cursor-pointer border border-transparent hover:border-primary/20 transition-all group"
                            onClick={() => openView(matrizesList.find(m => m.id_empresa === selectedEmpresa.id_matriz))}
                          >
                            <div className="bg-primary/10 p-1.5 rounded"><Building2 className="w-4 h-4 text-primary" /></div>
                            <span className="text-sm font-semibold group-hover:text-primary transition-colors truncate">
                              {matrizesList.find(m => m.id_empresa === selectedEmpresa.id_matriz)?.nome}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="parcerias" className="mt-0 space-y-8 focus-visible:ring-0 outline-none">
                <div className="space-y-4">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <Handshake className="w-3 h-3" /> Programa Formação
                  </h4>
                  {selectedEmpresa?.formacao?.plano ? (
                    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 relative overflow-hidden group shadow-sm hover:shadow-lg transition-all duration-300">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Handshake className="w-24 h-24 text-primary -rotate-12" />
                      </div>
                      <div className="relative space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <Badge className="bg-primary hover:bg-primary/90 shadow-md mb-2 px-3 h-6 uppercase tracking-widest text-[11px] font-black">{selectedEmpresa.formacao.plano.nome}</Badge>
                            <p className="text-xs text-muted-foreground">Inscrito no programa de apoio corporativo</p>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 uppercase text-[10px] font-black h-7 px-4 shadow-sm">{selectedEmpresa.formacao.status}</Badge>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-border shadow-sm group-hover:border-primary/30 transition-colors">
                            <p className="text-[9px] uppercase font-black opacity-50 mb-1">Desconto p/ Grupo</p>
                            <div className="flex items-end gap-1.5">
                              <span className="text-3xl font-black text-primary leading-none">{Number(selectedEmpresa.formacao.plano.desconto_adicional).toFixed(0)}%</span>
                              <span className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-tighter">Adicional</span>
                            </div>
                          </div>
                          <div className="bg-background/80 backdrop-blur-sm rounded-xl p-4 border border-border shadow-sm group-hover:border-primary/30 transition-colors">
                            <p className="text-[9px] uppercase font-black opacity-50 mb-1">Vagas do Grupo</p>
                            <div className="flex items-end gap-1.5">
                              <span className="text-3xl font-black text-primary leading-none">{selectedEmpresa.formacao.plano.vagas_gratuitas}</span>
                              <span className="text-[10px] font-bold text-muted-foreground mb-1 uppercase tracking-tighter">Gratuitas</span>
                            </div>
                            <p className="text-[8px] text-primary/60 mt-1.5 font-bold uppercase tracking-tighter leading-[1.2]">Cota única compartilhada entre Matriz e Filiais</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/30 border border-dashed border-border rounded-xl p-10 text-center group cursor-pointer hover:bg-muted/50 transition-colors">
                      <Handshake className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                      <h5 className="text-sm font-bold text-muted-foreground">Sem Plano de Formação</h5>
                      <p className="text-xs text-muted-foreground/60 mt-1 max-w-[240px] mx-auto">Vincule esta empresa ao Programa Formação para liberar descontos progressivos.</p>
                    </div>
                  )}

                  <div className="pt-4 space-y-4">
                    <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                      <Percent className="w-3 h-3" /> Convênios e Parcerias Ativas
                    </h4>
                    {selectedRegularParcerias.length === 0 ? (
                      <div className="bg-background border border-border/60 rounded-xl p-5 shadow-sm min-h-[80px] flex flex-col items-center justify-center border-dashed">
                        <Handshake className="w-6 h-6 text-muted-foreground/20 mb-2" />
                        <p className="text-xs text-muted-foreground italic">Nenhum convênio adicional.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {selectedRegularParcerias.map(p => (
                          <div key={p.id_parceria} className="bg-background border border-border/60 rounded-xl p-3 flex items-center gap-3 shadow-sm">
                            <div className="bg-primary/5 p-2 rounded-lg text-primary"><Percent className="w-4 h-4" /></div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold truncate leading-tight">{p.nome}</p>
                              <p className="text-[10px] text-muted-foreground uppercase font-black">{p.desconto}% de benefício</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="pt-2 flex justify-center">
                      <Button variant="link" className="h-6 text-[10px] uppercase font-black text-primary opacity-60 hover:opacity-100" onClick={() => openEdit(selectedEmpresa)}>Gerenciar Parcerias</Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="alunos" className="mt-0 space-y-5 focus-visible:ring-0 outline-none">
                <div className="flex items-center justify-between sticky top-0 bg-transparent z-10 py-1">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <UserRound className="w-3 h-3" /> Quadro de Alunos
                  </h4>
                  <Badge variant="outline" className="h-5 text-[10px] font-black uppercase bg-primary/10 text-primary border-none">
                    {alunosEmpresa.filter(a => a.nome.toLowerCase().includes(alunosSearch.toLowerCase())).length} Resultados
                  </Badge>
                </div>

                <div className="relative">
                  <SearchInput
                    placeholder="Pesquisar aluno nesta empresa..."
                    value={alunosSearch}
                    onChange={(e) => setAlunosSearch(e.target.value)}
                    className="bg-muted/30 border-none h-10 text-xs px-10"
                  />
                </div>

                {isLoadingAlunosEmpresa ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest animate-pulse">Sincronizando Alunos...</p>
                  </div>
                ) : alunosEmpresa.length === 0 ? (
                  <div className="bg-muted/20 border border-dashed border-border rounded-2xl p-12 text-center">
                    <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/60">
                      <UserRound className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">Nenhum aluno encontrado.</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">Os alunos vinculados a esta empresa aparecem aqui automaticamente.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {alunosEmpresa
                      .filter(a => a.nome.toLowerCase().includes(alunosSearch.toLowerCase()) || (a.cpf && a.cpf.includes(alunosSearch)))
                      .map(aluno => (
                        <div key={aluno.id_aluno || aluno.id_colaborador} className="bg-background border border-border/80 rounded-xl p-4 hover:shadow-md hover:border-primary/50 transition-all flex items-center gap-4 group">
                          <div className="bg-primary/10 p-2.5 rounded-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <UserRound className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 pr-2">
                            <p className="text-sm font-bold truncate text-foreground group-hover:text-primary transition-colors">{aluno.nome}</p>
                            <div className="flex flex-col">
                              <p className="text-[10px] text-muted-foreground uppercase font-black truncate tracking-tighter opacity-70 mb-0.5">{aluno.cargo || "Dono / Gestor"}</p>
                              <p className="text-[9px] font-mono text-muted-foreground/60">{formatCPF(aluno.cpf)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="contatos" className="mt-0 space-y-5 focus-visible:ring-0 outline-none">
                <div className="flex items-center justify-between sticky top-0 bg-transparent z-10 py-1">
                  <h4 className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Gestores e Responsáveis
                  </h4>
                  <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs font-bold bg-primary/5 hover:bg-primary hover:text-primary-foreground transition-all" onClick={() => openCreateContact(selectedEmpresa.id_empresa, true)}>
                    <Plus className="w-3.5 h-3.5" /> Vincular Novo
                  </Button>
                </div>

                <div className="relative">
                  <SearchInput
                    placeholder="Pesquisar por nome ou setor..."
                    value={contatosSearch}
                    onChange={(e) => setContatosSearch(e.target.value)}
                    className="bg-muted/30 border-none h-10 text-xs px-10"
                  />
                </div>

                {selectedEmpresaContacts.length === 0 ? (
                  <div
                    className="bg-muted/20 border border-dashed border-border rounded-2xl p-12 text-center group cursor-pointer hover:bg-muted/40 transition-colors"
                    onClick={() => openCreateContact(selectedEmpresa.id_empresa, true)}
                  >
                    <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-border/60 group-hover:scale-110 transition-transform">
                      <UserRound className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm font-bold text-muted-foreground">O Quadro de Contatos está vazio</p>
                    <p className="text-xs text-primary font-black uppercase mt-2 group-hover:underline">Adicionar Primeiro Responsável</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedEmpresaContacts
                      .filter(c => c.nome.toLowerCase().includes(contatosSearch.toLowerCase()) || (c.setor && c.setor.toLowerCase().includes(contatosSearch.toLowerCase())))
                      .map(c => (
                        <div key={c.id_contato} className="bg-background border border-border/80 rounded-2xl p-5 flex items-center justify-between group hover:shadow-lg hover:border-primary/40 transition-all duration-300">
                          <div className="flex items-center gap-5">
                            <div className="bg-primary/5 p-3 rounded-full group-hover:bg-primary/10 transition-colors">
                              <Mail className="w-6 h-6 text-primary/60" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-black text-sm text-foreground">{c.nome}</p>
                                <Badge variant="secondary" className="h-4 text-[9px] font-black uppercase items-center px-1.5">{c.setor || "Diretoria"}</Badge>
                              </div>
                              <div className="flex items-center gap-5 mt-1.5">
                                {c.telefone && <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary/40" /> {c.telefone}</p>}
                                {c.email && <p className="text-xs text-primary/70 font-bold flex items-center gap-1.5 hover:underline cursor-pointer"><Mail className="w-3.5 h-3.5" /> {c.email}</p>}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary" onClick={() => openEditContact(c)}>
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-9 w-9 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => openDeleteContact(c.id_contato)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          <div className="bg-muted/30 px-6 py-4 border-t flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setViewOverlayOpen(false)} className="h-9 font-bold text-xs uppercase tracking-tight text-muted-foreground hover:bg-background">Fechar Visualização</Button>
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
                    disabled={isEditing}
                    className={isEditing ? "bg-muted cursor-not-allowed font-mono opacity-80" : ""}
                  />
                  <Button variant="secondary" onClick={handleBuscarCnpj} disabled={isLoadingCnpj || isEditing}>
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

            {/* ── Parcerias e Convênios ────────────────────────────────────────── */}
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Handshake className="w-4 h-4 text-primary" /> Parcerias e Convênios
                  </h3>
                </div>

                {/* Programa Formação Toggle & Selection */}
                {(() => {
                  const mId = formData.id_matriz;
                  const targetMatriz = matrizesList.find(m => m.id_empresa === mId);
                  const isHerdeira = !formData.isMatriz && mId !== "null" && !!targetMatriz?.formacao?.id_plano;

                  return (
                    <div className="bg-primary/5 rounded-xl border border-primary/10 overflow-hidden shadow-sm">
                      <div className="p-4 flex items-center justify-between bg-primary/10 border-b border-primary/10">
                        <div className="flex items-center gap-3">
                          {!isHerdeira ? (
                            <Checkbox
                              id="formacao_toggle"
                              checked={showFormacao}
                              onCheckedChange={(val) => setShowFormacao(val === true)}
                            />
                          ) : (
                            <div className="bg-primary/20 p-1.5 rounded-full">
                              <CheckCircle2 className="w-4 h-4 text-primary" />
                            </div>
                          )}
                          <div>
                            <Label htmlFor="formacao_toggle" className="font-bold text-primary cursor-pointer">Programa Formação</Label>
                            <p className="text-[10px] text-primary/70 uppercase font-black tracking-widest mt-0.5">
                              {isHerdeira ? "Benefício Herdado da Matriz" : "Benefícios Exclusivos"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {(showFormacao || isHerdeira) && (
                        <div className="p-4 bg-background/50">
                          {isHerdeira ? (
                            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3">
                              <div className="flex items-start gap-3">
                                <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
                                <div>
                                  <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-tight">Vínculo Automático</p>
                                  <p className="text-[11px] text-amber-700/80 dark:text-amber-400/60 mt-1">
                                    Esta filial herda o plano da matriz:
                                    <Badge variant="outline" className="ml-1.5 h-5 bg-amber-100/50 dark:bg-amber-900/30 border-amber-200 text-amber-900 dark:text-amber-300 font-black uppercase text-[9px]">
                                      {targetMatriz?.formacao?.plano?.nome || "Plano Ativo"}
                                    </Badge>
                                  </p>
                                  <p className="text-[10px] text-amber-600/60 mt-2 italic font-medium">As vagas bônus são compartilhadas entre todas as empresas deste grupo.</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-2">
                              {allParcerias.map((plano) => {
                                const isSelected = selectedParcerias[0]?.id_parceria === plano.id_parceria;
                                return (
                                  <button
                                    key={plano.id_parceria}
                                    type="button"
                                    onClick={() => setSelectedParcerias([plano])}
                                    className={cn(
                                      "relative flex flex-col text-left p-3 rounded-lg border transition-all duration-200",
                                      isSelected
                                        ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm"
                                        : "border-border/60 bg-card hover:border-primary/40 hover:bg-muted/30"
                                    )}
                                  >
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-[11px] font-black uppercase tracking-tight">{plano.nome}</span>
                                      {isSelected && <CheckCircle2 className="w-3 h-3 text-primary" />}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-bold opacity-80">
                                        <Percent className="w-2.5 h-2.5" /> {Number(plano.desconto_adicional || 0).toFixed(0)}% Off
                                      </div>
                                      <div className="flex items-center gap-1 text-[9px] text-muted-foreground font-bold opacity-80">
                                        <Plus className="w-2.5 h-2.5" /> {plano.vagas_gratuitas || 0} Vagas
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Regular Partnerships */ }
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Outras Parcerias / Convênios</Label>
                      <Badge variant="outline" className="text-[10px] opacity-60">{selectedRegularParcerias.length} Selecionados</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {regularParcerias.map(p => {
                        const isSelected = selectedRegularParcerias.some(s => s.id_parceria === p.id_parceria);
                        return (
                          <div
                            key={p.id_parceria}
                            className={cn(
                              "flex items-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors",
                              isSelected ? "border-primary/40 bg-primary/5" : "border-border bg-muted/20 hover:bg-muted/40"
                            )}
                            onClick={() => {
                              if (isSelected) setSelectedRegularParcerias(prev => prev.filter(s => s.id_parceria !== p.id_parceria));
                              else setSelectedRegularParcerias(prev => [...prev, p]);
                            }}
                          >
                            <Checkbox checked={isSelected} />
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate">{p.nome}</p>
                              <p className="text-[9px] text-muted-foreground">{p.desconto}% desc.</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
              </div>
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
                      <Input value={slot.telefone} onChange={(e) => updateContactSlot(idx, "telefone", formatPhone(e.target.value))} placeholder="(11) 99999-9999" />
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
            {/* Empresa search/select */}
            {!contactFormLocked ? (
              <div className="space-y-2">
                <Label>Empresa *</Label>
                <div className="space-y-2">
                  <SearchInput 
                    placeholder="Pesquisar empresa..." 
                    value={contactFormEmpresaSearch} 
                    onChange={(e) => setContactFormEmpresaSearch(e.target.value)}
                    className="h-9"
                  />
                  <Select value={contactFormEmpresaId} onValueChange={setContactFormEmpresaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione na lista..." />
                    </SelectTrigger>
                    <SelectContent>
                      {empresas
                        .filter(e => e.nome.toLowerCase().includes(contactFormEmpresaSearch.toLowerCase()))
                        .map(e => (
                          <SelectItem key={e.id_empresa} value={e.id_empresa}>{e.nome}</SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  onChange={(e) => setContactForm(p => ({ ...p, telefone: formatPhone(e.target.value) }))}
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
