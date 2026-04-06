import { useState, useEffect, useCallback } from "react";
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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
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
import { Plus, MoreVertical, Pencil, Trash2, Search, Building2 } from "lucide-react";
import { SearchInput } from "../components/ui/search-input";

export function Empresas() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [matrizSearchTerm, setMatrizSearchTerm] = useState("");

  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [confirmCompanyOpen, setConfirmCompanyOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isLoadingCnpj, setIsLoadingCnpj] = useState(false);

  const [formData, setFormData] = useState({
    nome: "",
    cnpj: "",
    isMatriz: false,
    id_matriz: "null",
    cep: "",
    logradouro: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: ""
  });

  const fetchData = useCallback(async () => {
    try {
      // Fetch Empresas
      const resEmp = await fetch("https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/empresas-crud", {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (resEmp.ok) {
        setEmpresas(await resEmp.json());
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFormData = (field: string, value: any) => {
    setFormData(prev => {
        const next = { ...prev, [field]: value };
        if (field === 'isMatriz' && value === true) {
            next.id_matriz = "null"; // resetar o id_matriz
        }
        return next;
    });
  };

  const handleBuscarCnpj = async () => {
      const limpo = formData.cnpj.replace(/\D/g, "");
      if (limpo.length !== 14) return alert("O CNPJ deve ter 14 dígitos.");
      setIsLoadingCnpj(true);
      try {
          // Usando a Edge Function como proxy para evitar erros de CORS (ReceitaWS via Backend)
          const { publicAnonKey } = await import("../../../utils/supabase/info");
          const resp = await fetch(`https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/empresas-crud?cnpj=${limpo}`, {
            headers: {
              "apikey": publicAnonKey || ""
            }
          });
          
          if (resp.ok) {
             const data = await resp.json();
             
             if (data.status === "ERROR") {
               return alert(data.message || "CNPJ não encontrado ou erro na consulta.");
             }

             setFormData(prev => ({
                 ...prev,
                 nome: data.fantasia || data.nome || prev.nome,
                 cep: data.cep ? data.cep.replace(/\D/g, "") : prev.cep,
                 logradouro: data.logradouro || prev.logradouro,
                 numero: data.numero || prev.numero,
                 complemento: data.complemento || prev.complemento,
                 bairro: data.bairro || prev.bairro,
                 cidade: data.municipio || prev.cidade,
                 estado: data.uf || prev.estado
             }));
          } else {
             alert("Erro ao consultar CNPJ através do servidor.");
          }
      } catch (e) {
          console.error("Erro ao buscar CNPJ", e);
          alert("Ocorreu um erro ao consultar o CNPJ.");
      } finally {
          setIsLoadingCnpj(false);
      }
  };

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
          estado: data.uf
        }));
      }
    } catch (e) {
      console.error("Erro ao buscar CEP", e);
    } finally {
      setIsLoadingCep(false);
    }
  };

  const openAddCompany = () => {
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      nome: "", cnpj: "", isMatriz: false, id_matriz: "null",
      cep: "", logradouro: "", numero: "", complemento: "", bairro: "", cidade: "", estado: ""
    });
    setAddCompanyOpen(true);
  };

  const handleEdit = (company: any) => {
    setIsEditing(true);
    setEditingId(company.id_empresa);
    setFormData({
      nome: company.nome || "",
      cnpj: company.cnpj || "",
      isMatriz: company.is_matriz || false,
      id_matriz: company.id_matriz || "null",
      cep: company.endereco?.cep || "",
      logradouro: company.endereco?.logradouro || "",
      numero: company.endereco?.numero || "",
      complemento: company.endereco?.complemento || "",
      bairro: company.endereco?.bairro || "",
      cidade: company.endereco?.cidade || "",
      estado: company.endereco?.estado || ""
    });
    setAddCompanyOpen(true);
  };

  const handleDelete = (id: string) => {
    setEditingId(id);
    setDeleteDialogOpen(true);
  };

  const confirmSaveCompany = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        id_empresa: editingId,
        nome: formData.nome,
        cnpj: formData.cnpj,
        is_matriz: formData.isMatriz,
        id_matriz: formData.isMatriz === false && formData.id_matriz !== "null" ? formData.id_matriz : null,
        cep: formData.cep,
        logradouro: formData.logradouro,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        dono_id: null,
        dono_nome: null,
        dono_cpf: null,
        dono_cargo: null,
      };

      const res = await fetch("https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/empresas-crud", {
        method: isEditing ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Erro ao ${isEditing ? 'atualizar' : 'criar'} empresa`);

      alert(`Empresa ${isEditing ? 'atualizada' : 'cadastrada'} com sucesso!`);
      setConfirmCompanyOpen(false);
      setAddCompanyOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erro ao salvar empresa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteCompany = async () => {
    if (!editingId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/empresas-crud", {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id_empresa: editingId })
      });

      if (!res.ok) throw new Error("Erro ao excluir empresa");

      alert("Empresa excluída com sucesso!");
      setDeleteDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert("Erro ao excluir empresa.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const matrizesList = empresas.filter(e => e.is_matriz);
  const filiaisEIndependentes = empresas.filter(e => !e.is_matriz);

  const filteredEmpresas = filiaisEIndependentes.filter(e => 
    e.nome?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.cnpj?.includes(searchTerm)
  );

  const filteredMatrizes = matrizesList.filter(e => 
    e.nome?.toLowerCase().includes(matrizSearchTerm.toLowerCase()) || 
    e.cnpj?.includes(matrizSearchTerm)
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Empresas e Matrizes</h1>
          <p className="text-muted-foreground mt-1">Gerencie seu cadastro único de empresas e colaborações</p>
        </div>
        <div className="flex gap-3">
          <Button className="gap-2" onClick={openAddCompany}>
            <Plus className="w-4 h-4" />
            Adicionar Empresa
          </Button>
        </div>
      </div>

      {/* Empresas List */}
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
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmpresas.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Não há empresas filiais ou independentes cadastradas.</TableCell>
                    </TableRow>
                ) : filteredEmpresas.map((company) => (
                  <TableRow key={company.id_empresa}>
                    <TableCell className="font-medium">{company.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{company.cnpj}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {company.id_matriz ? "Filial" : "Independente"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        {company.id_matriz ? matrizesList.find(m => m.id_empresa === company.id_matriz)?.nome || 'Sim' : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(company)}><Pencil className="w-4 h-4 mr-2" /> Alterar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(company.id_empresa)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
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

      {/* Matrizes List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground flex items-center gap-2"><Building2 className="w-5 h-5"/> Matrizes (Sedes)</h2>
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
                  <TableHead className="text-center">Qtd. Filiais Vinculadas</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatrizes.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Nenhuma matriz cadastrada ainda.</TableCell>
                    </TableRow>
                ) : filteredMatrizes.map((matriz) => (
                  <TableRow key={matriz.id_empresa}>
                    <TableCell className="font-medium text-primary">{matriz.nome}</TableCell>
                    <TableCell>{matriz.cnpj}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant="outline">{empresas.filter(e => e.id_matriz === matriz.id_empresa).length}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="w-4 h-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(matriz)}><Pencil className="w-4 h-4 mr-2" /> Alterar</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(matriz.id_empresa)} className="text-destructive"><Trash2 className="w-4 h-4 mr-2" /> Excluir</DropdownMenuItem>
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

      {/* Add Company Modal Form */}
      <Dialog open={addCompanyOpen} onOpenChange={setAddCompanyOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Empresa" : "Adicionar Empresa"}</DialogTitle>
            <DialogDescription>{isEditing ? "Altere as informações da Empresa e Endereço" : "Cadastre as informações da Nova Empresa e Endereço"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            
            {/* Bloco 1: Dados Base e Tipo */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <div className="flex gap-2">
                    <Input value={formData.cnpj} onChange={(e) => handleFormData('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
                    <Button variant="secondary" onClick={handleBuscarCnpj} disabled={isLoadingCnpj}>
                        {isLoadingCnpj ? "Consultando..." : <Search className="w-4 h-4"/>}
                    </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Nome ou Razão Social</Label>
                <Input value={formData.nome} onChange={(e) => handleFormData('nome', e.target.value)} placeholder="Organização / Empresa" />
              </div>
            </div>

            {/* Configuração Estrutural da Empresa */}
            <div className="bg-muted p-4 rounded-lg border space-y-4">
               <h3 className="text-lg font-medium">Classificação Corporativa</h3>
               <div className="flex items-center gap-2 mb-4">
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
                   <Select value={formData.id_matriz} onValueChange={(val) => handleFormData('id_matriz', val)}>
                     <SelectTrigger><SelectValue placeholder="Sem vińculo (Empresa Independente)" /></SelectTrigger>
                     <SelectContent>
                       <SelectItem value="null">Sem vínculo (Empresa Independente)</SelectItem>
                       {matrizesList.map(m => (
                         <SelectItem key={m.id_empresa} value={m.id_empresa}>{m.nome} (CNPJ: {m.cnpj})</SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               )}
            </div>

            {/* Bloco 3: Endereço (ViaCEP) */}
            <div className="grid grid-cols-2 gap-4 bg-background">
                <div className="col-span-2">
                     <h3 className="text-lg font-medium border-b pb-2">Endereço Comercial</h3>
                </div>
                <div className="space-y-2">
                    <Label>CEP</Label>
                    <div className="flex gap-2">
                        <Input value={formData.cep} onChange={(e) => handleFormData('cep', e.target.value)} placeholder="00000-000" />
                        <Button variant="secondary" onClick={handleBuscarCep} disabled={isLoadingCep}>
                            {isLoadingCep ? "Buscando..." : <Search className="w-4 h-4"/>}
                        </Button>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Logradouro</Label>
                    <Input value={formData.logradouro} onChange={(e) => handleFormData('logradouro', e.target.value)} placeholder="Rua, Avenida..." />
                </div>
                <div className="space-y-2">
                    <Label>Número</Label>
                    <Input value={formData.numero} onChange={(e) => handleFormData('numero', e.target.value)} placeholder="123" />
                </div>
                <div className="space-y-2">
                    <Label>Complemento</Label>
                    <Input value={formData.complemento} onChange={(e) => handleFormData('complemento', e.target.value)} placeholder="Sala 1, Galpão A" />
                </div>
                <div className="space-y-2">
                    <Label>Bairro</Label>
                    <Input value={formData.bairro} onChange={(e) => handleFormData('bairro', e.target.value)} placeholder="Centro" />
                </div>
                <div className="grid grid-cols-[2fr_1fr] gap-2">
                     <div className="space-y-2">
                        <Label>Cidade</Label>
                        <Input value={formData.cidade} onChange={(e) => handleFormData('cidade', e.target.value)} placeholder="São Paulo" />
                    </div>
                    <div className="space-y-2">
                        <Label>Estd.</Label>
                        <Input value={formData.estado} onChange={(e) => handleFormData('estado', e.target.value)} placeholder="SP" />
                    </div>
                </div>
            </div>

          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCompanyOpen(false)}>Cancelar</Button>
            <Button onClick={() => setConfirmCompanyOpen(true)}>Salvar Empresa</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmCompanyOpen} onOpenChange={setConfirmCompanyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmação de {isEditing ? "Alteração" : "Cadastro"}</AlertDialogTitle>
            <AlertDialogDescription>
              As informações inseridas irão {isEditing ? "atualizar o registro" : "salvar um novo registro"} na sua base central de Dados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Voltar e Editar</AlertDialogCancel>
            <AlertDialogAction disabled={isSubmitting} onClick={confirmSaveCompany}>
              {isSubmitting ? (isEditing ? "Salvando..." : "Cadastrando...") : "Confirmar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta empresa? Esta ação não pode ser desfeita e removerá os vínculos de endereço.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction disabled={isSubmitting} onClick={confirmDeleteCompany} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              {isSubmitting ? "Excluindo..." : "Excluir Definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
