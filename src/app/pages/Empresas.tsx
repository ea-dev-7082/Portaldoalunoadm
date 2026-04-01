import { useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { Search, Plus, MoreVertical, Pencil, Trash2, X, ArrowUpDown, Check } from "lucide-react";

interface Company {
  id: string;
  nome: string;
  cnpj: string;
  plano: string;
  vagas: number;
  valor: string;
  desconto: string;
  associado: string;
  parcerias: string[];
}

interface EconomicGroup {
  id: string;
  nome: string;
  empresas: string[];
  totalVagas: number;
  parcerias: string[];
}

interface Contact {
  id: string;
  nome: string;
  empresa: string;
  area: string;
  telefone: string;
  email: string;
  setor: string;
}

type SortField = "nome" | "cnpj" | "plano" | "vagas";
type SortDirection = "asc" | "desc";

export function Empresas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [groupSearchTerm, setGroupSearchTerm] = useState("");
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  
  // Sorting states
  const [companySortField, setCompanySortField] = useState<SortField>("nome");
  const [companySortDirection, setCompanySortDirection] = useState<SortDirection>("asc");
  
  // Modal states
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [editGroupOpen, setEditGroupOpen] = useState(false);
  const [deleteCompanyOpen, setDeleteCompanyOpen] = useState(false);
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [confirmCompanyOpen, setConfirmCompanyOpen] = useState(false);
  const [confirmGroupOpen, setConfirmGroupOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [cancelWarningOpen, setCancelWarningOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);
  
  // Selected items
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<EconomicGroup | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  // Form states
  const [companyParcerias, setCompanyParcerias] = useState<string[]>([]);
  const [groupParcerias, setGroupParcerias] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Mock data for companies
  const companies: Company[] = [
    {
      id: "1",
      nome: "AutoBrasil SA",
      cnpj: "12.345.678/0001-90",
      plano: "Premium",
      vagas: 50,
      valor: "R$ 15.000,00",
      desconto: "10%",
      associado: "Sim",
      parcerias: ["Programa Aluno Formação"],
    },
    {
      id: "2",
      nome: "Peças Plus Ltda",
      cnpj: "23.456.789/0001-01",
      plano: "Básico",
      vagas: 20,
      valor: "R$ 6.000,00",
      desconto: "5%",
      associado: "Sim",
      parcerias: ["Rede Ancora"],
    },
    {
      id: "3",
      nome: "Moto Parts Express",
      cnpj: "34.567.890/0001-12",
      plano: "Premium",
      vagas: 35,
      valor: "R$ 12.000,00",
      desconto: "15%",
      associado: "Não",
      parcerias: ["Programa Aluno Formação", "Rede Ancora"],
    },
    {
      id: "4",
      nome: "AutoServ Comercial",
      cnpj: "45.678.901/0001-23",
      plano: "Básico",
      vagas: 15,
      valor: "R$ 4.500,00",
      desconto: "0%",
      associado: "Sim",
      parcerias: [],
    },
    {
      id: "5",
      nome: "TurboPeças Nacional",
      cnpj: "56.789.012/0001-34",
      plano: "Premium",
      vagas: 60,
      valor: "R$ 18.000,00",
      desconto: "20%",
      associado: "Sim",
      parcerias: ["Programa Aluno Formação"],
    },
  ];

  // Mock data for economic groups
  const economicGroups: EconomicGroup[] = [
    {
      id: "1",
      nome: "Grupo AutoBrasil",
      empresas: ["AutoBrasil SA", "TurboPeças Nacional"],
      totalVagas: 110,
      parcerias: ["Programa Aluno Formação"],
    },
    {
      id: "2",
      nome: "Grupo Moto Parts",
      empresas: ["Moto Parts Express", "AutoServ Comercial"],
      totalVagas: 50,
      parcerias: ["Rede Ancora"],
    },
  ];

  // Mock data for contacts
  const contacts: Contact[] = [
    { id: "1", nome: "Maria Silva", empresa: "AutoBrasil SA", area: "RH", telefone: "(11) 98765-4321", email: "maria@autobrasil.com", setor: "Recursos Humanos" },
    { id: "2", nome: "João Santos", empresa: "AutoBrasil SA", area: "Financeiro", telefone: "(11) 98765-4322", email: "joao@autobrasil.com", setor: "Financeiro" },
    { id: "3", nome: "Ana Costa", empresa: "Peças Plus Ltda", area: "Gerente", telefone: "(11) 97654-3210", email: "ana@pecasplus.com", setor: "Gerência" },
    { id: "4", nome: "Carlos Oliveira", empresa: "Moto Parts Express", area: "Dono", telefone: "(11) 96543-2109", email: "carlos@motoparts.com", setor: "Diretoria" },
    { id: "5", nome: "Paula Mendes", empresa: "Moto Parts Express", area: "RH", telefone: "(11) 96543-2110", email: "paula@motoparts.com", setor: "Recursos Humanos" },
    { id: "6", nome: "Roberto Lima", empresa: "AutoServ Comercial", area: "Financeiro", telefone: "(11) 95432-1098", email: "roberto@autoserv.com", setor: "Financeiro" },
    { id: "7", nome: "Fernanda Souza", empresa: "TurboPeças Nacional", area: "RH", telefone: "(11) 94321-0987", email: "fernanda@turbopecas.com", setor: "Recursos Humanos" },
    { id: "8", nome: "Lucas Alves", empresa: "TurboPeças Nacional", area: "Gerente", telefone: "(11) 94321-0988", email: "lucas@turbopecas.com", setor: "Gerência" },
  ];

  // Sort companies
  const sortedCompanies = [...companies].sort((a, b) => {
    let compareA: any = a[companySortField];
    let compareB: any = b[companySortField];
    
    if (typeof compareA === "string") {
      compareA = compareA.toLowerCase();
      compareB = compareB.toLowerCase();
    }
    
    if (companySortDirection === "asc") {
      return compareA > compareB ? 1 : -1;
    } else {
      return compareA < compareB ? 1 : -1;
    }
  });

  const filteredCompanies = sortedCompanies.filter((company) =>
    company.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj.includes(searchTerm)
  );

  const filteredGroups = economicGroups.filter((group) =>
    group.nome.toLowerCase().includes(groupSearchTerm.toLowerCase())
  );

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.nome.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(contactSearchTerm.toLowerCase());
    const matchesCompany = filterCompany === "all" || contact.empresa === filterCompany;
    return matchesSearch && matchesCompany;
  });

  const handleSort = (field: SortField) => {
    if (companySortField === field) {
      setCompanySortDirection(companySortDirection === "asc" ? "desc" : "asc");
    } else {
      setCompanySortField(field);
      setCompanySortDirection("asc");
    }
  };

  const togglePartnership = (partnership: string, isCompany: boolean = true) => {
    if (isCompany) {
      if (companyParcerias.includes(partnership)) {
        setCompanyParcerias(companyParcerias.filter(p => p !== partnership));
      } else {
        setCompanyParcerias([...companyParcerias, partnership]);
      }
    } else {
      if (groupParcerias.includes(partnership)) {
        setGroupParcerias(groupParcerias.filter(p => p !== partnership));
      } else {
        setGroupParcerias([...groupParcerias, partnership]);
      }
    }
    setHasChanges(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setCompanyParcerias(company.parcerias);
    setHasChanges(false);
    setEditCompanyOpen(true);
  };

  const handleEditGroup = (group: EconomicGroup) => {
    setSelectedGroup(group);
    setGroupParcerias(group.parcerias);
    setHasChanges(false);
    setEditGroupOpen(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setSelectedCompany(company);
    setDeleteConfirmText("");
    setDeleteCompanyOpen(true);
  };

  const handleDeleteGroup = (group: EconomicGroup) => {
    setSelectedGroup(group);
    setDeleteConfirmText("");
    setDeleteGroupOpen(true);
  };

  const handleEditContact = (contact: Contact) => {
    setSelectedContact(contact);
    setEditContactOpen(true);
  };

  const handleDeleteContact = (contact: Contact) => {
    setSelectedContact(contact);
    setDeleteConfirmText("");
    setDeleteContactOpen(true);
  };

  const openAddCompany = () => {
    setCompanyParcerias([]);
    setHasChanges(false);
    setAddCompanyOpen(true);
  };

  const openAddGroup = () => {
    setGroupParcerias([]);
    setHasChanges(false);
    setAddGroupOpen(true);
  };

  const handleCloseModal = (modalSetter: (value: boolean) => void) => {
    if (hasChanges) {
      setCancelWarningOpen(true);
    } else {
      modalSetter(false);
    }
  };

  const handleConfirmDiscard = () => {
    setCancelWarningOpen(false);
    setAddCompanyOpen(false);
    setAddGroupOpen(false);
    setEditCompanyOpen(false);
    setEditGroupOpen(false);
    setHasChanges(false);
  };

  const handleSaveCompany = () => {
    setConfirmCompanyOpen(true);
  };

  const handleSaveGroup = () => {
    setConfirmGroupOpen(true);
  };

  const confirmSaveCompany = () => {
    setConfirmCompanyOpen(false);
    setAddCompanyOpen(false);
    setEditCompanyOpen(false);
    setHasChanges(false);
  };

  const confirmSaveGroup = () => {
    setConfirmGroupOpen(false);
    setAddGroupOpen(false);
    setEditGroupOpen(false);
    setHasChanges(false);
  };

  const handleSaveEdit = () => {
    setSaveConfirmOpen(true);
  };

  const confirmSave = () => {
    setSaveConfirmOpen(false);
    setEditCompanyOpen(false);
    setEditContactOpen(false);
    setEditGroupOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Empresas, Grupos e Contatos</h1>
          <p className="text-muted-foreground mt-1">Gerencie as empresas parceiras, grupos econômicos e contatos</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setAddContactOpen(true)}>
            <Plus className="w-4 h-4" />
            Adicionar Contato
          </Button>
          <Button variant="outline" className="gap-2" onClick={openAddGroup}>
            <Plus className="w-4 h-4" />
            Adicionar Grupo
          </Button>
          <Button className="gap-2" onClick={openAddCompany}>
            <Plus className="w-4 h-4" />
            Adicionar Empresa
          </Button>
        </div>
      </div>

      {/* Companies Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Empresas</h2>
        </div>

        {/* Search Bar */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Companies Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("nome")}>
                    <div className="flex items-center gap-1">
                      Nome
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("cnpj")}>
                    <div className="flex items-center gap-1">
                      CNPJ
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("plano")}>
                    <div className="flex items-center gap-1">
                      Plano
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => handleSort("vagas")}>
                    <div className="flex items-center gap-1">
                      Vagas
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Parcerias</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="group">
                    <TableCell className="font-medium">{company.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{company.cnpj}</TableCell>
                    <TableCell>
                      <Badge variant={company.plano === "Premium" ? "default" : "secondary"}>
                        {company.plano}
                      </Badge>
                    </TableCell>
                    <TableCell>{company.vagas}</TableCell>
                    <TableCell>{company.valor}</TableCell>
                    <TableCell>{company.desconto}</TableCell>
                    <TableCell>
                      {company.parcerias.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Nenhuma</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {company.parcerias.map((p, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditCompany(company)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Alterar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteCompany(company)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
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

      {/* Economic Groups Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Grupos Econômicos</h2>
        </div>

        {/* Search Bar */}
        <Card className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar grupos..."
              value={groupSearchTerm}
              onChange={(e) => setGroupSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </Card>

        {/* Groups Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Grupo</TableHead>
                  <TableHead>Empresas</TableHead>
                  <TableHead>Total de Vagas</TableHead>
                  <TableHead>Parcerias</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGroups.map((group) => (
                  <TableRow key={group.id} className="group">
                    <TableCell className="font-medium">{group.nome}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {group.empresas.map((empresa, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {empresa}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{group.totalVagas}</TableCell>
                    <TableCell>
                      {group.parcerias.length === 0 ? (
                        <span className="text-sm text-muted-foreground">Nenhuma</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {group.parcerias.map((p, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {p}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Alterar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteGroup(group)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
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

      {/* Contacts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Contatos</h2>
        </div>

        {/* Search and Filter Bar */}
        <Card className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={contactSearchTerm}
                onChange={(e) => setContactSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCompany} onValueChange={setFilterCompany}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filtrar por empresa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as empresas</SelectItem>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.nome}>
                    {company.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Contacts Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome / Setor</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Área</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContacts.map((contact) => (
                  <TableRow key={contact.id} className="group">
                    <TableCell>
                      <div>
                        <div className="font-medium">{contact.nome}</div>
                        <div className="text-sm text-muted-foreground">{contact.setor}</div>
                      </div>
                    </TableCell>
                    <TableCell>{contact.empresa}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{contact.area}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">{contact.telefone}</div>
                        <div className="text-sm text-muted-foreground">{contact.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Alterar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteContact(contact)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
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

      {/* Add Company Modal */}
      <Dialog open={addCompanyOpen} onOpenChange={(open) => !open && handleCloseModal(setAddCompanyOpen)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Adicionar Empresa</DialogTitle>
            <DialogDescription>
              Preencha os dados da nova empresa
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Company Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input placeholder="Nome completo da empresa" onChange={() => setHasChanges(true)} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input placeholder="00.000.000/0000-00" onChange={() => setHasChanges(true)} />
              </div>
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select onValueChange={() => setHasChanges(true)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vagas</Label>
                <Input type="number" placeholder="0" onChange={() => setHasChanges(true)} />
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input placeholder="R$ 0,00" onChange={() => setHasChanges(true)} />
              </div>
              <div className="space-y-2">
                <Label>Desconto</Label>
                <Input placeholder="0%" onChange={() => setHasChanges(true)} />
              </div>
            </div>

            {/* Partnerships */}
            <div className="space-y-3">
              <Label>Parcerias</Label>
              <div className="flex gap-3">
                <button
                  onClick={() => togglePartnership("Programa Aluno Formação")}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    companyParcerias.includes("Programa Aluno Formação")
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Programa Aluno Formação</span>
                    {companyParcerias.includes("Programa Aluno Formação") && (
                      <Check className="w-5 h-5" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => togglePartnership("Rede Ancora")}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    companyParcerias.includes("Rede Ancora")
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Rede Ancora</span>
                    {companyParcerias.includes("Rede Ancora") && (
                      <Check className="w-5 h-5" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseModal(setAddCompanyOpen)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCompany}>Revisar e Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Group Modal */}
      <Dialog open={addGroupOpen} onOpenChange={(open) => !open && handleCloseModal(setAddGroupOpen)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Adicionar Grupo Econômico</DialogTitle>
            <DialogDescription>
              Preencha os dados do novo grupo econômico
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome do Grupo</Label>
                <Input placeholder="Nome do grupo econômico" onChange={() => setHasChanges(true)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Empresas do Grupo</Label>
                <Select onValueChange={() => setHasChanges(true)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione as empresas" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Partnerships */}
            <div className="space-y-3">
              <Label>Parcerias</Label>
              <div className="flex gap-3">
                <button
                  onClick={() => togglePartnership("Programa Aluno Formação", false)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    groupParcerias.includes("Programa Aluno Formação")
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Programa Aluno Formação</span>
                    {groupParcerias.includes("Programa Aluno Formação") && (
                      <Check className="w-5 h-5" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => togglePartnership("Rede Ancora", false)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    groupParcerias.includes("Rede Ancora")
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Rede Ancora</span>
                    {groupParcerias.includes("Rede Ancora") && (
                      <Check className="w-5 h-5" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseModal(setAddGroupOpen)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGroup}>Revisar e Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Company Modal */}
      <Dialog open={editCompanyOpen} onOpenChange={(open) => !open && handleCloseModal(setEditCompanyOpen)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Alterar Empresa</DialogTitle>
            <DialogDescription>Edite os dados da empresa</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input defaultValue={selectedCompany?.nome} onChange={() => setHasChanges(true)} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input defaultValue={selectedCompany?.cnpj} onChange={() => setHasChanges(true)} />
              </div>
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select defaultValue={selectedCompany?.plano.toLowerCase()} onValueChange={() => setHasChanges(true)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basico">Básico</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vagas</Label>
                <Input type="number" defaultValue={selectedCompany?.vagas} onChange={() => setHasChanges(true)} />
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input defaultValue={selectedCompany?.valor} onChange={() => setHasChanges(true)} />
              </div>
              <div className="space-y-2">
                <Label>Desconto</Label>
                <Input defaultValue={selectedCompany?.desconto} onChange={() => setHasChanges(true)} />
              </div>
            </div>

            {/* Partnerships */}
            <div className="space-y-3">
              <Label>Parcerias</Label>
              <div className="flex gap-3">
                <button
                  onClick={() => togglePartnership("Programa Aluno Formação")}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    companyParcerias.includes("Programa Aluno Formação")
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Programa Aluno Formação</span>
                    {companyParcerias.includes("Programa Aluno Formação") && (
                      <Check className="w-5 h-5" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => togglePartnership("Rede Ancora")}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    companyParcerias.includes("Rede Ancora")
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Rede Ancora</span>
                    {companyParcerias.includes("Rede Ancora") && (
                      <Check className="w-5 h-5" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseModal(setEditCompanyOpen)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveCompany}>Revisar e Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Group Modal */}
      <Dialog open={editGroupOpen} onOpenChange={(open) => !open && handleCloseModal(setEditGroupOpen)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>Alterar Grupo Econômico</DialogTitle>
            <DialogDescription>Edite os dados do grupo econômico</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label>Nome do Grupo</Label>
                <Input defaultValue={selectedGroup?.nome} onChange={() => setHasChanges(true)} />
              </div>
            </div>

            {/* Partnerships */}
            <div className="space-y-3">
              <Label>Parcerias</Label>
              <div className="flex gap-3">
                <button
                  onClick={() => togglePartnership("Programa Aluno Formação", false)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    groupParcerias.includes("Programa Aluno Formação")
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Programa Aluno Formação</span>
                    {groupParcerias.includes("Programa Aluno Formação") && (
                      <Check className="w-5 h-5" />
                    )}
                  </div>
                </button>
                <button
                  onClick={() => togglePartnership("Rede Ancora", false)}
                  className={`flex-1 px-4 py-3 rounded-lg border-2 transition-all ${
                    groupParcerias.includes("Rede Ancora")
                      ? "border-purple-500 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300"
                      : "border-border bg-background hover:bg-accent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">Rede Ancora</span>
                    {groupParcerias.includes("Rede Ancora") && (
                      <Check className="w-5 h-5" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => handleCloseModal(setEditGroupOpen)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveGroup}>Revisar e Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar Contato</DialogTitle>
            <DialogDescription>Preencha os dados do novo contato</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input placeholder="Nome completo" />
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Área</Label>
                <Input placeholder="Ex: RH, Financeiro" />
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Input placeholder="Descrição do setor" />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input placeholder="email@empresa.com" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddContactOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setAddContactOpen(false)}>Salvar Contato</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Modal */}
      <Dialog open={editContactOpen} onOpenChange={setEditContactOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alterar Contato</DialogTitle>
            <DialogDescription>Edite os dados do contato</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input defaultValue={selectedContact?.nome} />
              </div>
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Select defaultValue={selectedContact?.empresa}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.nome}>
                        {company.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Área</Label>
                <Input defaultValue={selectedContact?.area} />
              </div>
              <div className="space-y-2">
                <Label>Setor</Label>
                <Input defaultValue={selectedContact?.setor} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input defaultValue={selectedContact?.telefone} />
              </div>
              <div className="space-y-2">
                <Label>E-mail</Label>
                <Input defaultValue={selectedContact?.email} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditContactOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Company Confirmation Dialog */}
      <AlertDialog open={confirmCompanyOpen} onOpenChange={setConfirmCompanyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revisar Dados da Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Confirme os dados antes de salvar. Você poderá editar posteriormente se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm"><strong>Parcerias selecionadas:</strong></p>
            {companyParcerias.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma parceria selecionada</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {companyParcerias.map((p, i) => (
                  <Badge key={i}>{p}</Badge>
                ))}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar Editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveCompany}>Confirmar e Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Group Confirmation Dialog */}
      <AlertDialog open={confirmGroupOpen} onOpenChange={setConfirmGroupOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revisar Dados do Grupo</AlertDialogTitle>
            <AlertDialogDescription>
              Confirme os dados antes de salvar. Você poderá editar posteriormente se necessário.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <p className="text-sm"><strong>Parcerias selecionadas:</strong></p>
            {groupParcerias.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma parceria selecionada</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {groupParcerias.map((p, i) => (
                  <Badge key={i}>{p}</Badge>
                ))}
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Continuar Editando</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSaveGroup}>Confirmar e Salvar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Confirmation Dialog */}
      <AlertDialog open={saveConfirmOpen} onOpenChange={setSaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja realmente salvar as alterações realizadas?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Não</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSave}>Sim</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Warning Dialog */}
      <AlertDialog open={cancelWarningOpen} onOpenChange={setCancelWarningOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Descartar alterações?</AlertDialogTitle>
            <AlertDialogDescription>
              Você realizou alterações que não foram salvas. Deseja descartar essas alterações ou continuar editando?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setCancelWarningOpen(false)}>
              Continuar Editando
            </AlertDialogAction>
            <AlertDialogCancel onClick={handleConfirmDiscard}>
              Descartar Alterações
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Company Confirmation Dialog */}
      <AlertDialog open={deleteCompanyOpen} onOpenChange={setDeleteCompanyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Para confirmar a exclusão, digite o nome da empresa abaixo:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-muted rounded-md">
              <code className="text-sm font-semibold">{selectedCompany?.nome}</code>
            </div>
            <Input
              placeholder="Digite o nome da empresa"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== selectedCompany?.nome}
              onClick={() => {
                setDeleteCompanyOpen(false);
                setDeleteConfirmText("");
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir Empresa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Group Confirmation Dialog */}
      <AlertDialog open={deleteGroupOpen} onOpenChange={setDeleteGroupOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Grupo Econômico</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Para confirmar a exclusão, digite o nome do grupo abaixo:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-muted rounded-md">
              <code className="text-sm font-semibold">{selectedGroup?.nome}</code>
            </div>
            <Input
              placeholder="Digite o nome do grupo"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== selectedGroup?.nome}
              onClick={() => {
                setDeleteGroupOpen(false);
                setDeleteConfirmText("");
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir Grupo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Contact Confirmation Dialog */}
      <AlertDialog open={deleteContactOpen} onOpenChange={setDeleteContactOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contato</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Para confirmar a exclusão, digite o nome do contato abaixo:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="mt-4 space-y-2">
            <div className="p-3 bg-muted rounded-md">
              <code className="text-sm font-semibold">{selectedContact?.nome}</code>
            </div>
            <Input
              placeholder="Digite o nome do contato"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== selectedContact?.nome}
              onClick={() => {
                setDeleteContactOpen(false);
                setDeleteConfirmText("");
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir Contato
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
