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
import { Search, Plus, MoreVertical, Pencil, Trash2, X } from "lucide-react";

interface Company {
  id: string;
  nome: string;
  cnpj: string;
  plano: string;
  vagas: number;
  valor: string;
  desconto: string;
  associado: string;
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

export function Empresas() {
  const [searchTerm, setSearchTerm] = useState("");
  const [contactSearchTerm, setContactSearchTerm] = useState("");
  const [filterCompany, setFilterCompany] = useState("all");
  
  // Modal states
  const [addCompanyOpen, setAddCompanyOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [deleteCompanyOpen, setDeleteCompanyOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [editContactOpen, setEditContactOpen] = useState(false);
  const [deleteContactOpen, setDeleteContactOpen] = useState(false);
  
  // Selected items
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  
  // New company contacts
  const [newCompanyContacts, setNewCompanyContacts] = useState<Array<{nome: string, area: string, telefone: string, email: string, setor: string}>>([]);

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

  const filteredCompanies = companies.filter((company) =>
    company.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.cnpj.includes(searchTerm)
  );

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.nome.toLowerCase().includes(contactSearchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(contactSearchTerm.toLowerCase());
    const matchesCompany = filterCompany === "all" || contact.empresa === filterCompany;
    return matchesSearch && matchesCompany;
  });

  const addNewCompanyContact = () => {
    setNewCompanyContacts([...newCompanyContacts, { nome: "", area: "", telefone: "", email: "", setor: "" }]);
  };

  const removeNewCompanyContact = (index: number) => {
    setNewCompanyContacts(newCompanyContacts.filter((_, i) => i !== index));
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setEditCompanyOpen(true);
  };

  const handleDeleteCompany = (company: Company) => {
    setSelectedCompany(company);
    setDeleteConfirmText("");
    setDeleteCompanyOpen(true);
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

  const handleSaveEdit = () => {
    setSaveConfirmOpen(true);
  };

  const confirmSave = () => {
    // Save logic here
    setSaveConfirmOpen(false);
    setEditCompanyOpen(false);
    setEditContactOpen(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Empresas e Contatos</h1>
          <p className="text-muted-foreground mt-1">Gerencie as empresas parceiras e seus contatos</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2" onClick={() => setAddContactOpen(true)}>
            <Plus className="w-4 h-4" />
            Adicionar Contato
          </Button>
          <Button className="gap-2" onClick={() => setAddCompanyOpen(true)}>
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
                  <TableHead>Nome</TableHead>
                  <TableHead>CNPJ</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Vagas</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Associado</TableHead>
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
                      <Badge variant={company.associado === "Sim" ? "default" : "outline"}>
                        {company.associado}
                      </Badge>
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
      <Dialog open={addCompanyOpen} onOpenChange={setAddCompanyOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Adicionar Empresa</DialogTitle>
            <DialogDescription>
              Preencha os dados da nova empresa e adicione contatos opcionalmente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Company Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input placeholder="Nome completo da empresa" />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select>
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
                <Input type="number" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input placeholder="R$ 0,00" />
              </div>
              <div className="space-y-2">
                <Label>Desconto</Label>
                <Input placeholder="0%" />
              </div>
            </div>

            {/* Contacts Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Contatos</h3>
                <Button type="button" variant="outline" size="sm" onClick={addNewCompanyContact}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Contato
                </Button>
              </div>
              {newCompanyContacts.map((_, index) => (
                <Card key={index} className="p-4">
                  <div className="flex gap-4">
                    <div className="flex-1 grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input placeholder="Nome completo" />
                      </div>
                      <div className="space-y-2">
                        <Label>Área</Label>
                        <Input placeholder="Ex: RH, Financeiro" />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input placeholder="(00) 00000-0000" />
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail</Label>
                        <Input placeholder="email@empresa.com" />
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>Setor</Label>
                        <Input placeholder="Descrição do setor" />
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeNewCompanyContact(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddCompanyOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setAddCompanyOpen(false)}>Salvar Empresa</Button>
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

      {/* Edit Company Modal */}
      <Dialog open={editCompanyOpen} onOpenChange={setEditCompanyOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Alterar Empresa</DialogTitle>
            <DialogDescription>Edite os dados da empresa</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Empresa</Label>
                <Input defaultValue={selectedCompany?.nome} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input defaultValue={selectedCompany?.cnpj} />
              </div>
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select defaultValue={selectedCompany?.plano.toLowerCase()}>
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
                <Input type="number" defaultValue={selectedCompany?.vagas} />
              </div>
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input defaultValue={selectedCompany?.valor} />
              </div>
              <div className="space-y-2">
                <Label>Desconto</Label>
                <Input defaultValue={selectedCompany?.desconto} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCompanyOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit}>Salvar</Button>
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

      {/* Delete Company Confirmation Dialog */}
      <AlertDialog open={deleteCompanyOpen} onOpenChange={setDeleteCompanyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Empresa</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Para confirmar a exclusão, digite o nome da empresa abaixo:
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
            </AlertDialogDescription>
          </AlertDialogHeader>
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

      {/* Delete Contact Confirmation Dialog */}
      <AlertDialog open={deleteContactOpen} onOpenChange={setDeleteContactOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contato</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Para confirmar a exclusão, digite o nome do contato abaixo:
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
            </AlertDialogDescription>
          </AlertDialogHeader>
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
