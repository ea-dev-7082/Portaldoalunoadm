import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  TrendingUp,
  Building2,
  UserRound,
  Pencil,
  Plus,
  Trash2,
  Percent,
  AlertTriangle,
  Network,
  Save
} from "lucide-react";
import { SearchInput } from "../ui/search-input";
import { Switch } from "../ui/switch";

const SUPABASE_URL = "https://wytbbtlxrhkvqvlwjivc.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind5dGJidGx4cmhrdnF2bHdqaXZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MTYwMTIsImV4cCI6MjA4ODM5MjAxMn0.7iFjBVva_7nsNlvmfZ_8ddQuTmvCrCx9NTP1sKRzRB0";

const headers = {
  "Content-Type": "application/json",
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

export function ProgramaFormacaoSection() {
  const [planos, setPlanos] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [assinaturas, setAssinaturas] = useState<any[]>([]);
  const [beneficios, setBeneficios] = useState<any[]>([]);
  
  const [parceriasReais, setParceriasReais] = useState<any[]>([]);
  const [empresaParcerias, setEmpresaParcerias] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  // Overlays
  const [planosOverlayOpen, setPlanosOverlayOpen] = useState(false);
  const [empresasOverlayOpen, setEmpresasOverlayOpen] = useState(false);
  const [alunosOverlayOpen, setAlunosOverlayOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        resPlanos, resEmpresas, resAlunos, resAssinaturas, resBeneficios, resParc, resEmpParc
      ] = await Promise.all([
        fetch(`${SUPABASE_URL}/rest/v1/formacao_planos?select=*&order=vagas_gratuitas.asc`, { headers }),
        fetch(`${SUPABASE_URL}/functions/v1/empresas-crud`, { headers }),
        fetch(`${SUPABASE_URL}/functions/v1/alunos-crud`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/empresa_formacao?select=*`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/aluno_beneficio_formacao?select=*`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/parceria?select=id_parceria,desconto`, { headers }),
        fetch(`${SUPABASE_URL}/rest/v1/empresa_parceria?select=id_empresa,id_parceria`, { headers })
      ]);

      if (resPlanos.ok) setPlanos(await resPlanos.json());
      if (resEmpresas.ok) {
        const d = await resEmpresas.json();
        setEmpresas(Array.isArray(d) ? d : []);
      }
      if (resAlunos.ok) {
        const d = await resAlunos.json();
        setAlunos(Array.isArray(d) ? d : []);
      }
      if (resAssinaturas.ok) setAssinaturas(await resAssinaturas.json());
      if (resBeneficios.ok) setBeneficios(await resBeneficios.json());
      if (resParc.ok) setParceriasReais(await resParc.json());
      if (resEmpParc.ok) setEmpresaParcerias(await resEmpParc.json());
      
    } catch (e) {
      console.error("Erro ao buscar dados do programa:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived computations for Max External Discounts (taking Matriz bounds into account)
  const maxExternalDiscountByEmpresa = useMemo(() => {
    const map: Record<string, number> = {};
    for (const ep of empresaParcerias) {
      const parc = parceriasReais.find(p => p.id_parceria === ep.id_parceria);
      if (parc) {
        if (!map[ep.id_empresa] || parc.desconto > map[ep.id_empresa]) {
          map[ep.id_empresa] = parc.desconto;
        }
      }
    }
    // Propagate to filiais
    for (const emp of empresas) {
      if (emp.id_matriz && map[emp.id_matriz]) {
        if (!map[emp.id_empresa] || map[emp.id_matriz] > map[emp.id_empresa]) {
          map[emp.id_empresa] = map[emp.id_matriz];
        }
      }
    }
    return map;
  }, [empresaParcerias, parceriasReais, empresas]);

  const stats = useMemo(() => {
    return {
      vagasDisponibilizadas: assinaturas.reduce((acc, ass) => {
        const pl = planos.find(p => p.id_plano === ass.id_plano);
        return acc + (pl?.vagas_gratuitas || 0);
      }, 0),
      vagasUsadas: beneficios.filter(b => b.tipo_beneficio === 'GRATUIDADE').length,
      alunosComDesconto: beneficios.filter(b => b.tipo_beneficio === 'DESCONTO').length,
    };
  }, [assinaturas, beneficios, planos]);

  // ========== GERENCIAR PLANOS LOGIC ==========
  const [editingPlanoId, setEditingPlanoId] = useState<string | "NEW" | null>(null);
  const [planoForm, setPlanoForm] = useState({ nome: "", vagas_gratuitas: 0, desconto_adicional: 0, ativo: true });
  const [isSavingPlano, setIsSavingPlano] = useState(false);

  const handleEditPlano = (p: any) => {
    setPlanoForm({ nome: p.nome, vagas_gratuitas: p.vagas_gratuitas, desconto_adicional: p.desconto_adicional, ativo: p.ativo });
    setEditingPlanoId(p.id_plano);
  };
  const handleNewPlano = () => {
    setPlanoForm({ nome: "", vagas_gratuitas: 0, desconto_adicional: 0, ativo: true });
    setEditingPlanoId("NEW");
  };
  const handleSavePlano = async () => {
    if(!planoForm.nome.trim()) return alert("O nome do plano é obrigatório.");
    setIsSavingPlano(true);
    try {
      if (editingPlanoId === "NEW") {
        await fetch(`${SUPABASE_URL}/rest/v1/formacao_planos`, {
          method: "POST", headers, body: JSON.stringify(planoForm)
        });
      } else {
        await fetch(`${SUPABASE_URL}/rest/v1/formacao_planos?id_plano=eq.${editingPlanoId}`, {
          method: "PATCH", headers, body: JSON.stringify(planoForm)
        });
      }
      setEditingPlanoId(null);
      await fetchData();
    } catch(err) {
      console.error(err);
      alert("Erro ao salvar o plano.");
    } finally {
      setIsSavingPlano(false);
    }
  };
  const handleDeletePlano = async (id: string) => {
    if(!confirm("Atenção: Excluir um plano afetará empresas que o assinam. Recomendamos APENAS inativar o plano, a menos que ele nunca tenha sido atribuído. Continuar com a exclusão?")) return;
    setIsSavingPlano(true);
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/formacao_planos?id_plano=eq.${id}`, { method: "DELETE", headers });
      await fetchData();
    } catch(err) {
      console.error(err);
    } finally {
      setIsSavingPlano(false);
    }
  };


  // ========== EMPRESAS OVERLAY LOGIC ==========
  const [empSearch, setEmpSearch] = useState("");
  const [empFilter, setEmpFilter] = useState<"todos" | "participantes" | "nao_participantes">("todos");
  const [savingEmp, setSavingEmp] = useState<string | null>(null);

  const enrichedEmpresas = useMemo(() => {
    return empresas.map(emp => {
      const isFilial = !!emp.id_matriz && !emp.is_matriz;
      const ownAssinatura = assinaturas.find(a => a.id_empresa === emp.id_empresa);
      const matrizAssinatura = emp.id_matriz ? assinaturas.find(a => a.id_empresa === emp.id_matriz) : null;
      
      const assinatura = isFilial ? (matrizAssinatura || ownAssinatura) : ownAssinatura;
      const plano = assinatura ? planos.find(p => p.id_plano === assinatura.id_plano) : null;
      const inherited = isFilial && !!matrizAssinatura;
      
      // Calculate students. For Matriz, grab all from Matriz + Filiais
      const economicGroupIds = [emp.id_empresa];
      if (emp.is_matriz) {
        empresas.filter(e => e.id_matriz === emp.id_empresa).forEach(e => economicGroupIds.push(e.id_empresa));
      }
      
      const alunosDaEmpresa = alunos.filter(a => {
         const aEmpId = a.id_empresa || a.empresa?.id_empresa;
         // If we are looking at Matriz row, count whole group. If looking at Filial row, count only filial's students.
         if (emp.is_matriz) return economicGroupIds.includes(aEmpId);
         else return aEmpId === emp.id_empresa;
      });

      // Group consumption: The signature itself inherently bounds all students in the group!
      const benAssinatura = assinatura ? beneficios.filter(b => b.id_assinatura === assinatura.id_assinatura) : [];
      
      return {
        ...emp,
        isFilial,
        inherited,
        assinatura,
        plano,
        totAlunos: alunosDaEmpresa.length,
        // totVaga and totDesconto reflect the group usage if it's inherited, 
        // which perfectly describes the shared group pool:
        totVaga: benAssinatura.filter(b => b.tipo_beneficio === 'GRATUIDADE').length,
        totDesconto: benAssinatura.filter(b => b.tipo_beneficio === 'DESCONTO').length,
        totProg: benAssinatura.length
      };
    });
  }, [empresas, assinaturas, planos, alunos, beneficios]);

  const filteredEmpresas = enrichedEmpresas
    .filter(e => e.nome?.toLowerCase().includes(empSearch.toLowerCase()) || e.cnpj?.includes(empSearch))
    .filter(e => {
      if (empFilter === "participantes") return !!e.assinatura;
      if (empFilter === "nao_participantes") return !e.assinatura;
      return true;
    });

  const handleToggleEmpresaAssinatura = async (id_empresa: string, p_id_plano: string | null) => {
    setSavingEmp(id_empresa);
    try {
      const ass = assinaturas.find(a => a.id_empresa === id_empresa);
      if (p_id_plano === null || p_id_plano === "none") {
        if (ass) await fetch(`${SUPABASE_URL}/rest/v1/empresa_formacao?id_assinatura=eq.${ass.id_assinatura}`, { method: "DELETE", headers });
      } else {
        if (ass) {
          await fetch(`${SUPABASE_URL}/rest/v1/empresa_formacao?id_assinatura=eq.${ass.id_assinatura}`, {
            method: "PATCH", headers, body: JSON.stringify({ id_plano: p_id_plano })
          });
        } else {
          await fetch(`${SUPABASE_URL}/rest/v1/empresa_formacao`, {
            method: "POST", headers, body: JSON.stringify({ id_empresa, id_plano: p_id_plano, status: 'Ativo' })
          });
        }
      }
      await fetchData();
    } catch(err) {
      console.error(err);
    } finally {
      setSavingEmp(null);
    }
  };


  // ========== ALUNOS OVERLAY LOGIC ==========
  const [alSearch, setAlSearch] = useState("");
  const [alFilter, setAlFilter] = useState<"todos" | "participantes" | "nao_participantes">("todos");
  const [savingAl, setSavingAl] = useState<string | null>(null);

  const enrichedAlunos = useMemo(() => {
    return alunos.map(al => {
      const empId = al.id_empresa || al.empresa?.id_empresa;
      const empresa = empresas.find(e => e.id_empresa === empId) || null;
      
      // Determine the Group Signature for this student
      let assinatura = null;
      let isInherited = false;
      let matrizEmpresa = null;

      if (empresa) {
         assinatura = assinaturas.find(a => a.id_empresa === empresa.id_empresa) || null;
         if (!assinatura && empresa.id_matriz) {
             assinatura = assinaturas.find(a => a.id_empresa === empresa.id_matriz) || null;
             isInherited = !!assinatura;
             if (isInherited) matrizEmpresa = empresas.find(e => e.id_empresa === empresa.id_matriz);
         }
      }

      const plano = assinatura ? planos.find(p => p.id_plano === assinatura.id_plano) : null;
      const beneficio = beneficios.find(b => b.id_aluno === al.id_aluno);

      let vagasEsgotadas = false;
      let vagasUsadas = 0;
      let externalDiscount = 0;

      if (assinatura && plano) {
        vagasUsadas = beneficios.filter(b => b.id_assinatura === assinatura.id_assinatura && b.tipo_beneficio === 'GRATUIDADE').length;
        const isAlreadyVaga = beneficio?.tipo_beneficio === 'GRATUIDADE';
        if (!isAlreadyVaga && vagasUsadas >= plano.vagas_gratuitas) {
          vagasEsgotadas = true;
        }
        externalDiscount = empId ? (maxExternalDiscountByEmpresa[empId] || 0) : 0;
      }

      return {
        ...al,
        empresa,
        matrizEmpresa,
        isInherited,
        assinatura,
        plano,
        beneficio,
        vagasEsgotadas,
        vagasUsadas,
        externalDiscount
      };
    });
  }, [alunos, empresas, assinaturas, planos, beneficios, maxExternalDiscountByEmpresa]);

  const filteredAlunos = enrichedAlunos
    .filter(a => a.nome?.toLowerCase().includes(alSearch.toLowerCase()) || a.cpf?.includes(alSearch))
    .filter(a => {
      if (alFilter === "participantes") return !!a.beneficio;
      if (alFilter === "nao_participantes") return !a.beneficio;
      return true;
    });

  const handleSetAlunoBeneficio = async (al: any, tipo: 'GRATUIDADE' | 'DESCONTO' | 'NONE') => {
    if (!al.assinatura) return alert("Empresa do aluno (ou sua matriz) não está no programa formacão.");
    
    setSavingAl(al.id_aluno);
    try {
      if (tipo === 'NONE') {
        if (al.beneficio) {
          await fetch(`${SUPABASE_URL}/rest/v1/aluno_beneficio_formacao?id_beneficio=eq.${al.beneficio.id_beneficio}`, { method: "DELETE", headers });
        }
      } else {
        if (tipo === 'GRATUIDADE' && al.vagasEsgotadas) {
           throw new Error(`Não há mais vagas gratuitas na cota global do Grupo Econômico. (Usado: ${al.vagasUsadas} / ${al.plano.vagas_gratuitas})`);
        }

        if (al.beneficio) {
          await fetch(`${SUPABASE_URL}/rest/v1/aluno_beneficio_formacao?id_beneficio=eq.${al.beneficio.id_beneficio}`, {
            method: "PATCH", headers, body: JSON.stringify({ tipo_beneficio: tipo, id_assinatura: al.assinatura.id_assinatura })
          });
        } else {
          await fetch(`${SUPABASE_URL}/rest/v1/aluno_beneficio_formacao`, {
            method: "POST", headers, body: JSON.stringify({
              id_aluno: al.id_aluno,
              id_assinatura: al.assinatura.id_assinatura,
              tipo_beneficio: tipo
            })
          });
        }
      }
      await fetchData();
    } catch(err: any) {
      alert(err.message || "Erro ao alocar benefício");
    } finally {
      setSavingAl(null);
    }
  };

  return (
    <div className="space-y-6 mb-12">
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-border pb-4 gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-primary">
            <TrendingUp className="w-6 h-6" /> Programa Formação
            <Badge className="ml-2 font-mono" variant="secondary">Exclusivo</Badge>
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Assinaturas especiais para Grupos Econômicos (Matriz & Filial) com distribuição de cotas e descontos em lote.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5" onClick={() => setEmpresasOverlayOpen(true)}>
            <Building2 className="w-4 h-4 text-primary" /> Matrícula Corporativa
          </Button>
          <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5" onClick={() => setAlunosOverlayOpen(true)}>
            <UserRound className="w-4 h-4 text-primary" /> Distribuir Benefícios
          </Button>
          <Button className="gap-2 bg-primary" onClick={() => setPlanosOverlayOpen(true)}>
            <Pencil className="w-4 h-4" /> Editar Planos
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-muted-foreground">Sincronizando contratos e cotas da rede corporativa...</div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3 mb-6">
            <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-1.5 border-card">
               📈 Grupos Assinantes: {assinaturas.length}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-1.5 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20">
               🎁 Vagas Utilizadas: {stats.vagasUsadas} / {stats.vagasDisponibilizadas} 
            </Badge>
            <Badge variant="secondary" className="px-3 py-1.5 text-sm gap-1.5 border-blue-500/20 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20">
               📉 Alunos c/ Desconto: {stats.alunosComDesconto}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {planos.map(plano => (
              <Card key={plano.id_plano} className={`p-6 relative overflow-hidden group transition-all ${plano.ativo ? 'hover:border-primary/50' : 'opacity-60 grayscale'}`}>
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold">{plano.nome}</h3>
                  {!plano.ativo && <Badge variant="secondary" className="rounded-sm">Desativado</Badge>}
                </div>
                
                <div className="space-y-4">
                  <div className="bg-secondary/30 p-3 rounded-md flex items-center justify-between border border-border/50">
                    <span className="text-sm font-medium text-muted-foreground">Pacote de Vagas Grátis</span>
                    <Badge variant="outline" className="bg-background font-bold text-sm border-2 px-2.5 shadow-sm">{plano.vagas_gratuitas}</Badge>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 p-3 rounded-md flex items-center justify-between border border-emerald-200 dark:border-emerald-800/60 shadow-sm">
                    <span className="text-sm font-medium">Alunos Excedentes</span>
                    <Badge className="bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-200 gap-1 font-bold text-sm shadow-sm border border-emerald-300 dark:border-emerald-700">
                      <Percent className="w-3.5 h-3.5" /> {Number(plano.desconto_adicional).toFixed(0)}%
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* OVERLAY: EDITAR PLANOS */}
      <Dialog open={planosOverlayOpen} onOpenChange={setPlanosOverlayOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Gerenciador de Planos Corporativos</DialogTitle>
            <DialogDescription>Crie, edite as condições comerciais ou ative/inative os pacotes do Programa Formação.</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto min-h-0 space-y-6 mt-2">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_250px] gap-6 items-start">
               
               {/* Lista / Tabela */}
               <div className="border rounded-md">
                 <Table>
                   <TableHeader className="bg-muted">
                     <TableRow>
                       <TableHead>Nome</TableHead>
                       <TableHead className="text-center">Vagas</TableHead>
                       <TableHead className="text-center">Desconto Extra</TableHead>
                       <TableHead className="text-center">Status</TableHead>
                       <TableHead className="w-24 text-right">Ações</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {planos.map(p => (
                       <TableRow key={p.id_plano} className={!p.ativo ? 'opacity-50' : ''}>
                         <TableCell className="font-semibold">{p.nome}</TableCell>
                         <TableCell className="text-center font-mono">{p.vagas_gratuitas}</TableCell>
                         <TableCell className="text-center text-emerald-600 font-bold">{Number(p.desconto_adicional).toFixed(0)}%</TableCell>
                         <TableCell className="text-center">
                           {p.ativo ? <Badge variant="outline" className="text-emerald-600 bg-emerald-50">Ativo</Badge> : <Badge variant="secondary">Inativo</Badge>}
                         </TableCell>
                         <TableCell className="text-right">
                           <div className="flex justify-end gap-1">
                             <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditPlano(p)}>
                               <Pencil className="w-3.5 h-3.5" />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeletePlano(p.id_plano)}>
                               <Trash2 className="w-3.5 h-3.5" />
                             </Button>
                           </div>
                         </TableCell>
                       </TableRow>
                     ))}
                     {planos.length === 0 && (
                       <TableRow><TableCell colSpan={5} className="text-center py-4 text-muted-foreground">Nenhum plano cadastrado.</TableCell></TableRow>
                     )}
                   </TableBody>
                 </Table>
               </div>

               {/* Painel Editar/Novo */}
               <Card className="p-4 border-dashed bg-muted/20">
                 <div className="flex items-center justify-between mb-4 border-b pb-2">
                   <h3 className="font-bold text-sm tracking-tight">{editingPlanoId ? (editingPlanoId === "NEW" ? 'Novo Plano' : 'Editando Plano') : 'Formulário Requer Seleção'}</h3>
                   {editingPlanoId && (
                     <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingPlanoId(null)}>
                       <X className="w-3 h-3" />
                     </Button>
                   )}
                 </div>
                 
                 {editingPlanoId ? (
                   <div className="space-y-4">
                     <div className="space-y-1.5">
                       <Label className="text-xs">Nome do pacote</Label>
                       <Input value={planoForm.nome} onChange={e => setPlanoForm(p => ({...p, nome: e.target.value}))} placeholder="Ex: Black" className="h-8 text-sm" />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div className="space-y-1.5">
                         <Label className="text-xs leading-tight">Cota de Vagas</Label>
                         <Input type="number" min={0} value={planoForm.vagas_gratuitas} onChange={e => setPlanoForm(p => ({...p, vagas_gratuitas: parseInt(e.target.value)||0}))} className="h-8 text-sm font-mono" />
                       </div>
                       <div className="space-y-1.5">
                         <Label className="text-xs leading-tight">Desconto Excedente %</Label>
                         <Input type="number" min={0} max={100} value={planoForm.desconto_adicional} onChange={e => setPlanoForm(p => ({...p, desconto_adicional: parseFloat(e.target.value)||0}))} className="h-8 text-sm font-mono text-emerald-600" />
                       </div>
                     </div>
                     <div className="flex items-center justify-between pt-2">
                       <Label className="text-sm cursor-pointer" htmlFor="plano-ativo">Pacote Ativo?</Label>
                       <Switch id="plano-ativo" checked={planoForm.ativo} onCheckedChange={v => setPlanoForm(p => ({...p, ativo: v}))} />
                     </div>
                     <Button className="w-full h-8 mt-2" onClick={handleSavePlano} disabled={isSavingPlano}>
                       {isSavingPlano ? 'Salvando...' : <><Save className="w-3.5 h-3.5 mr-2" /> Salvar Condições</>}
                     </Button>
                   </div>
                 ) : (
                   <div className="py-6 flex flex-col items-center justify-center text-center">
                     <TrendingUp className="w-8 h-8 text-muted-foreground/30 mb-2" />
                     <p className="text-xs text-muted-foreground mb-4">Selecione um plano na lista ou crie um novo para definir sua regra de cota & descontos.</p>
                     <Button variant="outline" size="sm" onClick={handleNewPlano}>
                       <Plus className="w-3.5 h-3.5 mr-1" /> Criar Novo Pacote
                     </Button>
                   </div>
                 )}
               </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* OVERLAY: EMPRESAS */}
      <Dialog open={empresasOverlayOpen} onOpenChange={setEmpresasOverlayOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Adesão das Redes Corporativas (Matrizes)</DialogTitle>
            <DialogDescription>Somente matrizes ou empresas independentes fecham contrato no programa. Todas as filiais inerentes herdarão a cota global do Grupo Econômico.</DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-4 py-4 w-full flex-shrink-0">
            <div className="flex-1">
              <SearchInput value={empSearch} onChange={e => setEmpSearch(e.target.value)} placeholder="Busque grupo ou filial por cnpj..." />
            </div>
            <div className="w-64">
              <Select value={empFilter} onValueChange={(v: any) => setEmpFilter(v)}>
                <SelectTrigger><SelectValue placeholder="Filtro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos (Geral)</SelectItem>
                  <SelectItem value="participantes">Apenas Integrados ao Prog.</SelectItem>
                  <SelectItem value="nao_participantes">Grupos Não Integrados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 border rounded-md">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead>Identificação da Empresa</TableHead>
                  <TableHead className="w-[300px]">Contrato Matriz (Plano)</TableHead>
                  <TableHead className="text-center w-[120px]">Colab. Rede</TableHead>
                  <TableHead className="text-center w-[250px]">Cotas Utilizadas pelo Grupo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpresas.map(emp => (
                  <TableRow key={emp.id_empresa} className={emp.isFilial ? 'bg-muted/10' : ''}>
                    <TableCell>
                      <div className="flex items-start gap-2">
                         {emp.isFilial ? <Network className="w-4 h-4 text-muted-foreground mt-0.5" /> : <Building2 className="w-4 h-4 text-primary mt-0.5" />}
                         <div>
                            <div className="font-semibold text-sm flex items-center gap-2">
                               {emp.nome}
                               {emp.is_matriz && <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4 border-blue-500/30 text-blue-700 bg-blue-50">MATRIZ</Badge>}
                               {emp.isFilial && <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 uppercase">Filial</Badge>}
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                               {emp.cnpj}
                               {emp.isFilial && <span className="italic text-muted-foreground/60">(Grupo vinculado automaticamente)</span>}
                            </div>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {emp.isFilial ? (
                        emp.inherited ? (
                          <div className="flex flex-col text-sm border-l-2 pl-3 border-emerald-500/50 py-1 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-r-md">
                            <span className="font-medium text-emerald-700 dark:text-emerald-400">Pacote {emp.plano?.nome}</span>
                            <span className="text-xs text-muted-foreground italic">Herdado da matriz</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic opacity-60">Matriz independente, sem contrato.</span>
                        )
                      ) : (
                        <Select 
                          disabled={savingEmp === emp.id_empresa}
                          value={emp.plano?.id_plano || "none"}
                          onValueChange={(val) => handleToggleEmpresaAssinatura(emp.id_empresa, val === "none" ? null : val)}
                        >
                          <SelectTrigger className={`w-full ${emp.plano ? 'border-primary shadow-sm bg-primary/5' : 'bg-card'}`}>
                            <SelectValue placeholder="Sem Assinatura..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Desvincular (Cancelar Contrato)</SelectItem>
                            {planos.filter(p => p.ativo || p.id_plano === emp.plano?.id_plano).map(p => (
                               <SelectItem key={p.id_plano} value={p.id_plano}>
                                 <span className="font-semibold">{p.nome}</span> <span className="text-muted-foreground text-xs ml-2">({p.vagas_gratuitas} vagas + {Number(p.desconto_adicional).toFixed(0)}%)</span>
                               </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </TableCell>
                    <TableCell className="text-center font-mono text-muted-foreground font-semibold">{emp.totAlunos}</TableCell>
                    <TableCell>
                      {emp.assinatura ? (
                        <div className="flex justify-center items-center gap-1.5">
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-400 text-xs font-medium">
                              <span className="font-bold">{emp.totVaga} / {emp.plano?.vagas_gratuitas}</span> Vagas
                            </div>
                            <div className="flex items-center gap-1 px-2 py-1 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-400 text-xs font-medium">
                               <span className="font-bold">{emp.totDesconto}</span> Desc
                            </div>
                        </div>
                      ) : (
                        <div className="text-center text-xs opacity-40">-</div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      {/* OVERLAY: ALUNOS */}
      <Dialog open={alunosOverlayOpen} onOpenChange={setAlunosOverlayOpen}>
        <DialogContent className="max-w-7xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Distribuição de Cotas do Grupo Econômico (Alunos)</DialogTitle>
            <DialogDescription>A matriz que possuir o pacote distribuirá suas N vagas internamente entre quaisquer alunos das filiais.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 py-4 w-full flex-shrink-0">
            <div className="flex-1">
              <SearchInput value={alSearch} onChange={e => setAlSearch(e.target.value)} placeholder="Busque aluno por nome..." />
            </div>
            <div className="w-64">
              <Select value={alFilter} onValueChange={(v: any) => setAlFilter(v)}>
                <SelectTrigger><SelectValue placeholder="Filtro" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos (Geral)</SelectItem>
                  <SelectItem value="participantes">Já Recebem Benefícios</SelectItem>
                  <SelectItem value="nao_participantes">Aguardando Distribuição</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto min-h-0 border rounded-md">
            <Table>
              <TableHeader className="bg-muted sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead>Identidade Colaborador</TableHead>
                  <TableHead className="w-[350px]">Vínculo de Rede (Origem Cotas)</TableHead>
                  <TableHead className="w-[300px]">Atribuição do Pacote Administrativo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlunos.map(a => (
                  <TableRow key={a.id_aluno}>
                    <TableCell>
                      <div className="font-semibold text-sm">{a.nome}</div>
                      <div className="text-xs text-muted-foreground">{a.cpf}</div>
                    </TableCell>
                    <TableCell>
                       {a.empresa ? (
                         <div className="flex flex-col border-l-2 pl-3 border-border">
                           <span className="text-sm font-medium flex items-center gap-1.5">
                             {a.empresa.nome}
                             {a.isInherited ? <Badge variant="outline" className="text-[10px] h-4 px-1 p-0 rounded-sm italic uppercase text-muted-foreground/80 font-normal">Filial</Badge> : <Badge variant="secondary" className="text-[10px] h-4 px-1 p-0 rounded-sm font-bold bg-blue-50 text-blue-600 border-blue-500/20">MATRIZ</Badge>}
                           </span>
                           {a.isInherited && a.matrizEmpresa && (
                              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                                <Network className="w-3 h-3" /> Pacote fornecido via: {a.matrizEmpresa.nome}
                              </span>
                           )}
                           {a.assinatura && <div className="mt-1"><Badge variant="default" className="text-[10px] font-bold bg-primary/90 text-primary-foreground">{a.plano?.nome}</Badge></div>}
                         </div>
                       ) : <span className="text-xs text-muted-foreground">Sem Contrato Empregatício (Avulso)</span>}
                       
                       {/* Aviso de Conflito de Descontos Comuns GERAL */}
                       {a.externalDiscount > 0 && (
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-950/30 w-max px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900 overflow-hidden shadow-sm">
                            <AlertTriangle className="w-3 h-3 flex-shrink-0" /> Restrição: O sistema reconhece desconto comum atípico de {a.externalDiscount}% que será priorizado em pagamentos.
                          </div>
                        )}
                    </TableCell>
                    <TableCell>
                       {!a.assinatura ? (
                          <span className="text-xs text-muted-foreground italic opacity-60">Rede corporativa inativa no formacão</span>
                       ) : (
                         <div className="flex flex-col gap-2">
                            <Select
                              disabled={savingAl === a.id_aluno}
                              value={a.beneficio?.tipo_beneficio || "NONE"}
                              onValueChange={(v: any) => handleSetAlunoBeneficio(a, v)}
                            >
                              <SelectTrigger className={`w-full max-w-[280px] font-semibold text-xs ${a.beneficio ? 'border-primary bg-primary/5 text-primary' : ''}`}>
                                <SelectValue placeholder="Sem Cota Local (Configurar)" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NONE" className="font-semibold text-muted-foreground">Remover Benefício</SelectItem>
                                <SelectItem 
                                  value="GRATUIDADE" 
                                  disabled={a.vagasEsgotadas && a.beneficio?.tipo_beneficio !== 'GRATUIDADE'}
                                  className="font-bold text-emerald-600 focus:text-emerald-700"
                                >
                                  Absorver: 1 Vaga Gratuita {a.vagasEsgotadas && a.beneficio?.tipo_beneficio !== 'GRATUIDADE' ? `(Esgotou as ${a.plano?.vagas_gratuitas} do Grupo)` : ""}
                                </SelectItem>
                                <SelectItem value="DESCONTO" className="font-bold text-blue-600 focus:text-blue-700">
                                  Absorver: Desconto {Number(a.plano?.desconto_adicional).toFixed(0)}% (Excedente)
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {/* Warnings Check internal overlap logic */}
                            {a.beneficio?.tipo_beneficio === 'DESCONTO' && a.plano && a.externalDiscount > (a.plano.desconto_adicional || 0) && (
                               <span className="text-[10px] text-amber-600 dark:text-amber-400 max-w-[250px] leading-tight font-medium bg-amber-500/10 p-1.5 rounded-sm border border-amber-500/20">
                                  Atenção: A rede possuí um acordo externo ({a.externalDiscount}%) que cobre o desconto deste plano ({Number(a.plano.desconto_adicional).toFixed(0)}%). O sistema aplicará a melhor condição ({a.externalDiscount}%).
                               </span>
                            )}
                         </div>
                       )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
