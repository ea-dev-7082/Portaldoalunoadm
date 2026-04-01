Prompt 1: Global Layout, Header & Sidebar

Context: Update the B2B SaaS Dashboard for the auto parts school. All UI text must be strictly in Portuguese.

Global Header (Sticky): The header must remain fixed at the top. On the far left, place the static company name: "Escola de Autopeças". On the far right, place a Theme Toggle (Sun/Moon icon) and a Hamburger Menu icon. The Hamburger icon must transform into an 'X' when active.

Sidebar (Mini-variant Collapsible): Create a sidebar on the left. When collapsed, it should display only a vertical column of icons for the menu items. When the user clicks the Hamburger menu, it expands to show the icons + text labels: "Dashboard", "Empresas", "Treinamentos", "Alunos".

Prompt 2: Dashboard Updates

Context: Update the Dashboard main view. All UI text in Portuguese. Remove the "Adicionar Empresa" button from this screen.

Left Column (Trainings): Keep the horizontal carousels for "Treinamentos Futuros" and "Treinamentos Fechados". Lock the container heights to prevent layout shifts when navigating the carousel. Add a Segmented Control (Toggle) at the top of this section with options: "Treinamento" and "Módulo".

Right Column (Metrics):

Students Container: Merge the student metrics into a single container. Add a Segmented Control in the top-right corner with options: "Todos", "Pagantes", "Filiados", "Cortesia". Logic note: These numbers dynamically update based on the currently focused training in the left carousel.

Parcerias Container: Rename the formation program container to "Parcerias". Include a Segmented Control with "Programa Aluno Formação" and "Rede Ancora". Show respective charts for the selected option. Add an "Expandir" button that opens a modal listing the participating companies for the selected partnership.

Empresas sem alunos: Keep the simple design, but make the entire container clickable. When clicked, it opens a modal listing these companies and displaying their current assigned trainings (if any).

Prompt 3: Empresas, Grupos Econômicos & Contatos

Context: Update the "Empresas" screen. All UI text in Portuguese.

New Structure: The page now has three main Data Tables: "Empresas", "Grupos Econômicos" (new), and "Contatos".

Table Features: All tables must have Sortable Headers (Ascending/Descending arrow icons) for columns like Nome, CPF, CNPJ, etc.

Add/Edit Modals (For Empresas & Grupos Econômicos):

Include Toggle Chips for partnerships: "Programa Aluno Formação" and "Rede Ancora". These chips should change color and display an active icon when selected. Clicking again deselects them.

UX Rule: Before saving, the modal must show a "Review Data" layout asking for confirmation.

Strict Modal Behavior: Modals cannot be dismissed by clicking outside. Clicking "Cancelar" must trigger a secondary confirmation dialog: "Descartar alterações? (Sim/Continuar editando)".

Prompt 4: Treinamentos & Materiais

Context: Update the "Treinamentos" screen. All UI text in Portuguese.

Add/Edit Training Modal:

Fields: "Nome do Treinamento" and "Descrição".

Dynamic Modules: Include a "+" button to add modules. Use a Tab Navigation system to switch between editing different modules without leaving the modal. Each module tab contains "Nome do Módulo" and "Descrição".

Strict Modal Behavior: Prevent outside click dismissal. Clicking "Cancelar" triggers a "Descartar alterações?" warning. Always show a confirmation step before clicking "Salvar".

Trainings List (Accordion UI):

Make each row in the trainings table an Accordion. Clicking a row expands it downwards to reveal quick stats: "Alunos cadastrados", "Empresas participantes", "Grupos econômicos", and "Alunos sem empresa".

Make these stats clickable. Clicking one opens a modal with a filtered data table (e.g., clicking "Alunos cadastrados" opens a list of students specifically in that training).

Prompt 5: Alunos & System Instructions

Context: Update the "Alunos" screen. All UI text in Portuguese.

Data Table Updates: Add new columns and filters for "Treinamento Atual" (can be blank) and "Treinamentos Concluídos" (display only the most recent one in the simple view, but make it searchable).

Student Details Modal (Triggered by clicking a student row):

Display the student's info. Show "Treinamento Atual" and "Treinamentos Concluídos" as stylish Tag/Chip UI components.

Footer Layout: Place the "Excluir" button on the far left. Place "Cancelar" and "Editar" buttons together on the far right.

Strict Modal Behavior: Prevent outside click dismissal. "Cancelar" triggers "Descartar alterações?" if inputs were changed.

Final AI Instruction (Do this after generating the UI):
Please generate a text response acting as a Changelog and Project Summary.

Changelog: List everything you Added, Modified, and Removed in this iteration.

Project Summary: Provide a brief overview of the "Escola de Autopeças" B2B Dashboard architecture, explaining the relationship between Trainings, Companies, Economic Groups, and Students based on these prompts. Maintain the UI component names in Portuguese within your English explanation.