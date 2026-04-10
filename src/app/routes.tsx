import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { Empresas } from "./pages/Empresas";
import { Treinamentos } from "./pages/Treinamentos";
import { Alunos } from "./pages/Alunos";
import { Parcerias } from "./pages/Parcerias";
import { TestePublico } from "./pages/TestePublico";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Dashboard },
      { path: "empresas", Component: Empresas },
      { path: "treinamentos", Component: Treinamentos },
      { path: "alunos", Component: Alunos },
      { path: "parcerias", Component: Parcerias },
    ],
  },
  // Rota pública (fora do Layout admin) para o teste de conhecimento
  {
    path: "/teste/:id_teste",
    Component: TestePublico,
  },
]);
