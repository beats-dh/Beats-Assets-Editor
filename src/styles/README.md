# Canary Studio Editor - CSS Architecture

Este diretório contém todos os estilos da aplicação organizados de forma modular.

## 📁 Estrutura de Arquivos

### 1. Design System
- **`variables.css`** - Design tokens (cores, espaçamentos, fontes, sombras, transições)

### 2. Base
- **`base.css`** - Reset CSS, estilos globais e classes utilitárias

### 3. Layout Components
- **`loading.css`** - Tela de carregamento e configuração inicial
- **`header.css`** - Cabeçalho da aplicação e navegação
- **`categories.css`** - Cards de categorias e subcategorias

### 4. UI Components
- **`search.css`** - Barra de busca e filtros
- **`forms.css`** - Inputs, selects, radio buttons e formulários
- **`buttons.css`** - Todos os estilos de botões
- **`modals.css`** - Modais, diálogos e popups
- **`assets.css`** - Grid de assets, paginação e sprites
- **`audio.css`** - Player de áudio e controles de som

### 5. Utilities
- **`utilities.css`** - Classes utilitárias (toasts, helpers)
- **`animations.css`** - Keyframes e animações CSS

### 6. Responsive
- **`responsive.css`** - Media queries para diferentes tamanhos de tela

### 7. Main Entry Point
- **`main.css`** - Arquivo principal que importa todos os módulos na ordem correta

## 🎯 Ordem de Importação

A ordem de importação no `main.css` é crucial:

1. **Variables** - Define design tokens
2. **Base** - Reset e estilos globais
3. **Layout** - Estrutura da página
4. **Components** - Componentes reutilizáveis
5. **Utilities** - Classes auxiliares
6. **Animations** - Efeitos visuais
7. **Responsive** - Media queries (deve ser o último)

## 🔧 Como Adicionar Novos Estilos

1. Identifique o módulo apropriado para seu estilo
2. Se necessário, crie um novo arquivo CSS
3. Adicione o import no `main.css` na seção apropriada
4. Use as variáveis CSS definidas em `variables.css`

## 💡 Boas Práticas

- ✅ Use variáveis CSS para valores repetidos
- ✅ Mantenha os estilos organizados por componente
- ✅ Evite !important sempre que possível
- ✅ Use classes semânticas
- ✅ Teste em diferentes tamanhos de tela

## 🎨 Design Tokens

Todas as cores, espaçamentos e outras propriedades reutilizáveis estão definidas como variáveis CSS em `variables.css`. Exemplo:

```css
/* Use isto */
background: var(--primary-bg);
color: var(--text-primary);
padding: var(--space-md);

/* Em vez de valores fixos */
background: #0a0e1a;
color: #f8fafc;
padding: 1rem;
```

## 📱 Responsividade

Os breakpoints estão definidos em `responsive.css`:
- **1200px+** - Desktop grande
- **1024px** - Desktop
- **768px** - Tablet
- **640px** - Mobile grande
- **480px** - Mobile pequeno

## 🚀 Performance

- Todos os arquivos CSS são importados através de `@import` no `main.css`
- O Vite otimiza e agrupa os arquivos durante o build
- Uso de `will-change` e `transform` para animações otimizadas
