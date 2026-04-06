import { useState, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { supabase } from "../lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Plus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
import { ScrollArea } from "../components/ui/scroll-area";

interface Student {
  id_aluno: string;
  nome: string;
  cpf: string;
  data_nascimento?: string;
  cargo?: string;
  data_cadastro?: string;
  id_empresa?: string;
  empresa?: {
    id_empresa: string;
    nome: string;
  };
  entidade?: {
    id_entidade: string;
    contato?: Array<{
      id_contato: string;
      contato_email?: Array<{ email: string }>;
      contato_telefone?: Array<{ numero: string }>;
    }>;
  };
  // Campos extraídos para facilitar o uso no frontend
  email?: string;
  telefone?: string;
}

export function Alunos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"simples" | "completa">("simples");

  const [students, setStudents] = useState<Student[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      
      const response = await fetch("https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/alunos-crud", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const alArray = Array.isArray(data) ? data : [];
        const mappedData = alArray.map((s: any) => ({
          ...s,
          email: s.entidade?.contato?.[0]?.contato_email?.[0]?.email || "",
          telefone: s.entidade?.contato?.[0]?.contato_telefone?.[0]?.numero || ""
        }));
        setStudents(mappedData);
      }
    } catch (err) {
      console.error("Erro ao buscar alunos:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCompanies = useCallback(async () => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const response = await fetch("https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/empresas-crud", {
        headers: { "Authorization": `Bearer ${token}` }
      });
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

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [isStudentDirty, setIsStudentDirty] = useState(false);
  const [discardStudentConfirmOpen, setDiscardStudentConfirmOpen] = useState(false);
  const [saveStudentConfirmOpen, setSaveStudentConfirmOpen] = useState(false);

  const [sortConfig, setSortConfig] = useState<{ key: keyof Student | "", direction: "asc" | "desc" }>({ key: "nome", direction: "asc" });

  const handleSort = (key: keyof Student) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: keyof Student) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4 ml-1 text-muted-foreground" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 ml-1 text-blue-600 dark:text-blue-400" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 text-blue-600 dark:text-blue-400" />
    );
  };

  const filteredStudents = (students || [])
    .filter(
      (student) =>
        (student.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.cpf || "").includes(searchTerm) ||
        (student.empresa?.nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      if (aValue === undefined || bValue === undefined) return 0;
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

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
      id_empresa: ""
    });
    setIsEditingStudent(true);
    setDetailModalOpen(true);
    setIsStudentDirty(false);
  };

  const handleCancelEdit = () => {
    if (isStudentDirty) {
      setDiscardStudentConfirmOpen(true);
    } else {
      setIsEditingStudent(false);
    }
  };

  const confirmDiscardEdit = () => {
    setDiscardStudentConfirmOpen(false);
    setIsEditingStudent(false);
    setIsStudentDirty(false);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSaveStudent = async () => {
    setSaveStudentConfirmOpen(true);
  };

  const confirmSaveStudent = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      const isNew = !selectedStudent.id_aluno;
      const method = isNew ? "POST" : "PUT";
      const url = isNew 
        ? "https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/alunos-crud"
        : `https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/alunos-crud?id=${selectedStudent.id_aluno}`;

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(url, {
        method,
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...selectedStudent,
          cargo: selectedStudent.cargo || null,
          id_empresa: selectedStudent.id_empresa || null,
          email: selectedStudent.email || null,
          telefone: selectedStudent.telefone || null
        })
      });

      if (res.ok) {
        setSaveStudentConfirmOpen(false);
        setIsEditingStudent(false);
        setIsStudentDirty(false);
        setDetailModalOpen(false);
        fetchStudents();
      } else {
        const error = await res.json();
        alert(`Erro ao salvar aluno: ${error.error || "Erro desconhecido"}`);
      }
    } catch (err) {
      console.error(err);
      alert("Erro na requisição de salvamento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const confirmDeleteStudent = async () => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      const res = await fetch(`https://wytbbtlxrhkvqvlwjivc.supabase.co/functions/v1/alunos-crud?id=${selectedStudent.id_aluno}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
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


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alunos</h1>
          <p className="text-muted-foreground mt-1">Gerencie o cadastro e informações dos alunos</p>
        </div>
        <Button className="gap-2" onClick={handleAddNewStudent}>
          <Plus className="w-4 h-4" />
          Cadastrar Aluno
        </Button>
      </div>

      {/* Top Controls */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <SearchInput
              placeholder="Buscar por nome, CPF, empresa, treinamento atual..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium whitespace-nowrap">Visualização:</Label>
            <RadioGroup value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="flex gap-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="simples" id="view-simples" />
                <Label htmlFor="view-simples" className="cursor-pointer whitespace-nowrap">Visualização Simples</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="completa" id="view-completa" />
                <Label htmlFor="view-completa" className="cursor-pointer whitespace-nowrap">Visualização Completa</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      </Card>

      {/* Simple View Table */}
      {viewMode === "simples" && (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("nome")}>
                    <div className="flex items-center">Nome {getSortIcon("nome")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("cpf")}>
                    <div className="flex items-center">CPF {getSortIcon("cpf")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("id_empresa")}>
                    <div className="flex items-center">Empresa {getSortIcon("id_empresa")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("telefone")}>
                    <div className="flex items-center">Telefone {getSortIcon("telefone")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("email")}>
                    <div className="flex items-center">E-mail {getSortIcon("email")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("data_nascimento")}>
                    <div className="flex items-center">Nascimento {getSortIcon("data_nascimento")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("cargo")}>
                    <div className="flex items-center">Cargo {getSortIcon("cargo")}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer select-none hover:bg-muted/50 transition-colors" onClick={() => handleSort("data_cadastro")}>
                    <div className="flex items-center whitespace-nowrap">Matrícula {getSortIcon("data_cadastro")}</div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">Carregando alunos...</TableCell>
                  </TableRow>
                ) : filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <p className="text-muted-foreground opacity-60 italic">Nenhum aluno cadastrado no momento.</p>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.map((student) => (
                  <TableRow 
                    key={student.id_aluno} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleRowClick(student)}
                  >
                    <TableCell className="font-medium">{student.nome}</TableCell>
                    <TableCell className="text-muted-foreground">{student.cpf}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{student.empresa?.nome || "Independente"}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{student.telefone}</TableCell>
                    <TableCell className="text-muted-foreground">{student.email}</TableCell>
                    <TableCell className="text-muted-foreground">{student.data_nascimento}</TableCell>
                    <TableCell className="text-muted-foreground">{student.cargo}</TableCell>
                    <TableCell className="text-muted-foreground">{student.data_cadastro ? new Date(student.data_cadastro).toLocaleDateString() : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {/* Complete View Table */}
      {viewMode === "completa" && (
        <Card className="p-8 text-center bg-muted/20 border-dashed border-2">
            <p className="text-muted-foreground">A visualização completa está sendo integrada ao novo banco de dados.</p>
        </Card>
      )}

      {/* Detail Modal */}
      {selectedStudent && (
        <Dialog open={detailModalOpen} onOpenChange={(open) => {
          if (!open) {
            if (isStudentDirty) setDiscardStudentConfirmOpen(true);
            else setDetailModalOpen(false);
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" onPointerDownOutside={(e) => e.preventDefault()}>
            <DialogHeader>
              <DialogTitle>Detalhes do Aluno</DialogTitle>
              <DialogDescription>
                Visualize ou edite as informações gerenciais e histórico de {selectedStudent.nome}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Infos Básicas */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Nome</Label>
                  {isEditingStudent ? (
                    <Input value={selectedStudent.nome} onChange={(e) => {
                      setSelectedStudent({...selectedStudent, nome: e.target.value});
                      setIsStudentDirty(true);
                    }} />
                  ) : (
                    <p className="font-medium">{selectedStudent.nome}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">CPF</Label>
                  {isEditingStudent ? (
                    <Input value={selectedStudent.cpf} onChange={(e) => {
                      setSelectedStudent({...selectedStudent, cpf: e.target.value});
                      setIsStudentDirty(true);
                    }} />
                  ) : (
                    <p className="font-medium">{selectedStudent.cpf}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Empresa</Label>
                  {isEditingStudent ? (
                    <Select value={selectedStudent.id_empresa} onValueChange={(val) => {
                      setSelectedStudent({...selectedStudent, id_empresa: val});
                      setIsStudentDirty(true);
                    }}>
                      <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Independente</SelectItem>
                        {companies.map(c => (
                          <SelectItem key={c.id_empresa} value={c.id_empresa}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline">{selectedStudent.empresa?.nome || "Independente"}</Badge>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Telefone</Label>
                  {isEditingStudent ? (
                    <Input value={selectedStudent.telefone} onChange={(e) => {
                      setSelectedStudent({...selectedStudent, telefone: e.target.value});
                      setIsStudentDirty(true);
                    }} />
                  ) : (
                    <p className="font-medium">{selectedStudent.telefone || "-"}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">E-mail</Label>
                  {isEditingStudent ? (
                    <Input value={selectedStudent.email} onChange={(e) => {
                      setSelectedStudent({...selectedStudent, email: e.target.value});
                      setIsStudentDirty(true);
                    }} type="email"/>
                  ) : (
                    <p className="font-medium">{selectedStudent.email || "-"}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs uppercase">Cargo</Label>
                  {isEditingStudent ? (
                    <Input value={selectedStudent.cargo || ""} onChange={(e) => {
                      setSelectedStudent({...selectedStudent, cargo: e.target.value});
                      setIsStudentDirty(true);
                    }} />
                  ) : (
                    <p className="font-medium">{selectedStudent.cargo || "-"}</p>
                  )}
                </div>
              </div>

              {/* Status Educacional */}
              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold text-lg italic text-muted-foreground">Histórico Escolar (Em integração)</h3>
              </div>
            </div>

            {/* Custom Footer com Esquerda/Direita separate */}
            <div className="flex w-full items-center justify-between border-t border-border pt-4 mt-2">
              <div>
                <Button variant="destructive" onClick={() => setDeleteConfirmOpen(true)} disabled={isSubmitting}>Excluir</Button>
              </div>
              
              <div className="flex gap-2">
                {isEditingStudent ? (
                  <>
                    <Button variant="outline" onClick={handleCancelEdit}>Cancelar</Button>
                    <Button onClick={handleSaveStudent}>Salvar Alterações</Button>
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

      {/* Discard Confirmation Dialog */}
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
            <AlertDialogAction onClick={confirmDiscardEdit} className="bg-destructive hover:bg-destructive/90">
              Descartar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação removerá permanentemente o aluno {selectedStudent?.nome} e todos os seus vínculos de contato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteStudent} className="bg-destructive hover:bg-destructive/90" disabled={isSubmitting}>
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Save Confirmation Dialog */}
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
    </div>
  );
}
