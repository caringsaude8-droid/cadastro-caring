# Caring Flow - Arquitetura do Projeto

## Estrutura de Pastas (Angular Best Practices)

```
src/app/
├── core/                     # Módulo singleton com serviços globais
│   ├── guards/              # Guards de rota (auth, roles, etc.)
│   │   └── auth-guard.ts    # Proteção de rotas autenticadas
│   ├── interceptors/        # HTTP interceptors
│   └── services/           # Serviços singleton da aplicação
│       ├── auth.ts         # Serviço de autenticação
│       └── http.ts         # Serviço HTTP base
│
├── shared/                  # Componentes, pipes e diretivas reutilizáveis
│   ├── components/         # Componentes UI compartilhados
│   │   ├── header/         # Cabeçalho da aplicação
│   │   ├── footer/         # Rodapé da aplicação
│   │   └── sidebar/        # Menu lateral
│   ├── directives/         # Diretivas customizadas
│   ├── pipes/             # Pipes customizados
│   └── models/            # Interfaces e tipos TypeScript
│
├── features/              # Módulos de funcionalidades (lazy-loaded)
│   ├── auth/             # Módulo de autenticação
│   │   └── login/        # Componente de login
│   └── dashboard/        # Módulo do dashboard
│       └── dashboard.ts  # Página principal
│
├── layouts/              # Layouts da aplicação
│   ├── default/          # Layout padrão (header + sidebar + footer)
│   └── auth/            # Layout para páginas de autenticação
│
└── app.ts               # Componente raiz
```

## Convenções Arquiteturais

### 1. **Core Module** (Singleton)
- Serviços globais que devem ter apenas uma instância
- Guards, interceptors e configurações globais
- Importado apenas no AppModule

### 2. **Shared Module** 
- Componentes, pipes e diretivas reutilizáveis
- Importado em múltiplos feature modules
- Não deve depender de feature modules

### 3. **Feature Modules**
- Funcionalidades específicas da aplicação
- Lazy loading para melhor performance
- Cada feature é independente

### 4. **Layouts**
- Estruturas de página reutilizáveis
- Composição de componentes shared

## Próximos Passos de Desenvolvimento

1. **Configurar Roteamento**
   - Lazy loading para features
   - Guards de proteção

2. **Implementar Layouts**
   - Layout default com header/sidebar/footer
   - Layout auth minimalista

3. **Desenvolver Features**
   - Sistema de autenticação completo
   - Dashboard com widgets

4. **Estilização**
   - Sistema de design consistente
   - Responsividade mobile-first

## Comandos Úteis

```bash
# Gerar novo componente
ng generate component features/nova-feature/componente

# Gerar serviço
ng generate service core/services/nome-servico

# Gerar módulo com routing
ng generate module features/nova-feature --routing

# Iniciar servidor de desenvolvimento
npm start
```

## Tecnologias Utilizadas

- **Angular 18** - Framework principal
- **TypeScript** - Linguagem de programação
- **RxJS** - Programação reativa
- **Angular CLI** - Ferramenta de desenvolvimento