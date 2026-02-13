# Documentação Técnica - MotoristaReal v1.0.0

## 1. Visão Geral
O **MotoristaReal** é uma plataforma de gestão financeira especializada para motoristas de aplicativo (Uber, 99, Indrive). O diferencial técnico do sistema é o foco no **Lucro Real**, descontando não apenas despesas imediatas, mas também custos fixos provisionados e reserva de manutenção.

## 2. Arquitetura do Sistema
O projeto utiliza uma arquitetura **Buildless ESM**, o que significa que o código TypeScript é interpretado diretamente pelo navegador utilizando `import maps` e o serviço `esm.sh`.

### Componentes de Infraestrutura:
- **Frontend**: React 19 (Strict Mode).
- **Estilização**: Tailwind CSS via CDN (Runtime Config).
- **Backend/Database**: Supabase (PostgreSQL + Auth).
- **Hosting**: Cloudflare Pages (Static).

---

## 3. Dependências e Vínculos
As dependências são carregadas via módulos remotos (ESM):

| Dependência | Versão | Finalidade |
| :--- | :--- | :--- |
| `react` | 19.0.0 | Core da UI |
| `supabase-js` | 2.46.1 | Comunicação com o Backend e Realtime |
| `lucide-react` | 0.460.0 | Pacote de ícones vetoriais |
| `recharts` | 2.13.0 | Visualização de dados e gráficos |
| `tailwind-css` | 3.4.x | Framework utilitário de estilização |

---

## 4. Estrutura de Dados (Supabase)

### Tabelas Principais:
1.  **`profiles`**: Extensão da tabela de usuários do Auth.
    - `monthly_goal`: Meta de lucro líquido desejado.
2.  **`vehicles`**: Cadastro de frota.
    - `ownership_type`: `OWNED`, `FINANCED`, ou `RENTED`.
3.  **`accounts`**: Carteiras virtuais (Profissional, Pessoal, Dinheiro).
4.  **`transactions`**: Registro de entradas e saídas.

### Automação de Backend (Triggers SQL):
- **`on_auth_user_created`**: Ao criar conta, gera automaticamente o perfil e as duas contas padrão (Pessoal/Profissional).
- **`on_transaction_change`**: Ao inserir/deletar uma transação, o saldo da conta vinculada é atualizado atomicamente no banco de dados.

---

## 5. Lógica de Negócio (Dashboard)

### Cálculo do Lucro Real
O sistema utiliza o regime de **Competência Proporcional**:
`Lucro = Ganhos - Gastos Variáveis - (Custos Fixos / Dias no Mês * Dia Atual) - Reserva (10%)`

### Meta Diária Inteligente
Calcula o faturamento bruto necessário para atingir o lucro líquido desejado:
1.  Calcula a margem de lucro atual baseada no histórico.
2.  Divide o valor restante da meta pelos dias úteis restantes.
3.  Aplica a margem para sugerir o faturamento bruto no aplicativo.

---

## 6. Fluxo de Desenvolvimento e Deploy
- **Ambiente Local**: Pode ser servido por qualquer servidor estático (Ex: `npx serve .`).
- **Deploy**: Cloudflare Pages vinculado ao repositório. 
- **Nota Crítica**: Devido ao uso de ESM nativo no browser, as importações de arquivos locais **devem** incluir a extensão (Ex: `./App.tsx`).

## 7. Contatos e Suporte
- **Desenvolvedor**: WT Tecnologia
- **E-mail**: contato.wttecnologia@gmail.com
