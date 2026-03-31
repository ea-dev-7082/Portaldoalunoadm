import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { Empresas } from "./pages/Empresas";
import { Treinamentos } from "./pages/Treinamentos";
import { Alunos } from "./pages/Alunos";
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
    ],
  },
]);
