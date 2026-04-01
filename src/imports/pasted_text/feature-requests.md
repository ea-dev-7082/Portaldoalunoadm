Algumas correções para você::

Funcionalidades:
- tente deixar a Sidebar um pouco mais elegante. E grude o botão hamburguer na lateral direita. E quando eu clico nele, ele se transformar em x. O nome da empresa: "Escola de Autopeças" fica do lado esquerdo da sidebar. Onde atualmente está a aba escrita menu. Ela não deve se mover com o movimento da sidebar. Deve ficar estática e sempre visível, assim como o botão.
- Crie ícones para as opções para as opções do menu. E em caso da sidebar estar recolhida, os ícones ficam a amostra numa pequena coluna na lateral. Ou seja, essa coluna que será a sidebar. E ao clicar no botão do menu, ela expande e mostra os ícones com seus respectivos nomes.

Dashboard:
- O container de alunos será unificado, mas com um botão radio no espaço superior direito dele. Onde mostra 4 opções: Todos, Pagantes, Filiados e Cortesia.
- Teremos uma mudança de visualização dos treinamentos. também adicionaremos um botão visualização nele. Duas opções de visualização: treinamento ou módulo. Um ou outro.
- A amostragem dos alunos são mudadas conforme o treinamento mostrado no carrossel.
- Página não mudar tanto na troca do carrossel dos treinamentos. Ao diminuir o tamanho do container, pois o container dos treinamentos futuros são menores, o botão de passar para o próximo sobe e sai do lugar.
- O programa aluno formação na verdade será um container chamado "Parcerias" E nele terá um gráfico igual esses aí, dos participantes totais e etc. Mas com as seguintes alterações: Botão Ratio com duas opções, "Programa Aluno Formação" e "Rede Ancora". cada um mostrando seus próprios dados.
Nesse container poderei ver esses gráficos simples e expandir para um overlay. Onde poderei ver as empresas participantes de cada um das parcerias também.
- Remova o botão "Adicionar Empresa" do dashboard inicial.
- O container de Empresas Sem Alunos deve seguir nesse design simples. Mas ao ser clicado, abrirá um overlay onde mostra uma lista das empresas sem alunos. E se elas tiverem cadastradas em algum treinamento, em qual elas ficam.

Empresas:
- Dentro das opções de edição e adição de empresa, eu posso cadastrar/remove-la de alguma das duas parcerias "Programa Aluno Formação" ou "Rede Ancora". Deixe como se fosse um botão de seleção com os nomes de cada um. Ou algo que seja eles brancos ou pretos, a depender do tema. Mas que troque de cor e fiquem com algum ícone que reforce que fora opões selecionadas.
- O mesmo para remover. Que o usuário apenas clique em cima e veja o design retornando para o "padrão", dando a entender que as parcerias não estão selecionadas.
- Ao clicar em cadastrar empresa, ele deve criar um layout mostrando os dados cadastrados e pedindo para confirmar.
- Crie um filtro de setinhas de ordenação pra os itens do topo das tabelas. Pra filtrar por ordem crescente ou decrescente dos nomes, cpf, e etc. tanto para empresa quanto para os contatos.
- Criaremos uma nova tabela ali entre empresas e contatos chamada Grupos Econômicos. Será tipo uma matriz que pode agrupar várias empresas. Uma empresa não precisa necessariamente estar em um grupo  econômico. Ela pode ser uma empresa que não faz parte de nenhum grupo.
- crie um botão para cadastrar grupo econômico. Como ele tem um comportamento de empresa, só replique o mesmos overlays de criação e edição.


Treinamentos:
- Faça o botão de Adicionar treinamento funcionar e crie um overlay para isso.
- A caixa de criação de treinamento vai ter como botar o nome dele, descrição, um botão de incrementar o módulos que vão abrindo umas caixinhas para editar cada um. Mas essas caixas vão ser tipo abas do chorme, ou botão ratio. ou seja, abrirá conforme eu aperto no "+", mas só  estarei vendo a caixa de edição do módulo que está selecionado.
- Nos módulos teremos o nome do módulo e descrição dele.
- Sempre antes de salvar ou criar, mostre a caixa de confirmação. Nessa tela o overlay não  pode fechar se eu clicar fora dele. pois em caso de clique acidental, o usuário perde todo o formulário de cadastro. Ele só vai sair se apertar em cancelar. E quando apertar em cancelar, vai perguntar se ele quer continuar editando ou descartas as alterações. Isso também vale pra tela de editar treinamentos existentes.
- Adicione a opção de editar os treinamentos existentes.
- Ao eu clicar em um treinamento, ele expande como se fosse um dropdown para eu ver algumas informações dele. Como a quantidade de alunos cadastrados (se eu clicar em conferir alunos, me mostra uma lista com os detalhes dos alunos e empresas que eles trabalha. Tipo a visualização do aluno, só que já filtrada por treinamento), empresas participantes (mesma coisa, lista de empresas já filtradas pelo treinamento, caso eu clique em ver), grupos econômicos (mesma mecânica da lista ao clicar em mostrar), e alunos sem empresas (mesma coisa da lista, mas com alunos sem empresas).

Alunos:
- Adicionar um filtro e um novo campo do treinamento atual da pessoal (pode ser nenhum no momento também) e quais treinamentos ela já fez. No caso da lista simples, mostre só o último. Mas quero que seja possível pesquisar os que não estão mostrando na tela, mas caso a pessoa tenha feito, ela apareça e mostrando que ela fez o curso.
- Quero  poder clicar nas pessoas e aparecer um overlay das informações dela e do treinamento atual e/ou treinamentos feitos. Quero os treinamentos feitos como se fosse uma junção de tags, pra ficar estiloso. E deixe o botão de excluir e editar nessa tela, ambos em extremos diferentes e o cancelar mais próximo do editar, para melhorar a navegabilidade e a pessoa não precisar sair do overlay para editar ou excluir.
- Em caso de edição ou adição de alunos, clicar fora do overlay não tira ele da tela. Ele só sai apertando o botão cancelar. E em caso de algum conteúdo ter sido preenchido, perguntar se o usuário realmente quer descartar as alterações ou continuar editando.

Ao fim disso tudo, me falar tudo que adicionou, modificou e removeu. Para eu ter um histórico de todas as alterações do projeto.