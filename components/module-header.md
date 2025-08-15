# ModuleHeader Component

Um componente reutilizável para headers de módulos que mantém consistência visual e funcionalidade em toda a plataforma.

## Uso

```tsx
import { ModuleHeader } from "@/components/module-header";
import { Users, GraduationCap, BookOpen } from "lucide-react";

// Exemplo para módulo de Matrículas
<ModuleHeader
  moduleName="Matrículas"
  moduleDescription="Gestão de inscrições e monitores"
  moduleIcon={Users}
  gradientFrom="from-blue-100"
  gradientTo="to-blue-200"
  iconColor="text-blue-700"
/>

// Exemplo para módulo de Ensino
<ModuleHeader
  moduleName="Ensino"
  moduleDescription="Cursos, turmas, aulas e frequência"
  moduleIcon={GraduationCap}
  gradientFrom="from-green-100"
  gradientTo="to-green-200"
  iconColor="text-green-700"
/>

// Exemplo para um módulo hipotético de Biblioteca
<ModuleHeader
  moduleName="Biblioteca"
  moduleDescription="Gestão de livros e empréstimos"
  moduleIcon={BookOpen}
  gradientFrom="from-purple-100"
  gradientTo="to-purple-200"
  iconColor="text-purple-700"
/>
```

## Props

| Prop                | Tipo                                          | Descrição                                                      |
| ------------------- | --------------------------------------------- | -------------------------------------------------------------- |
| `moduleName`        | `string`                                      | Nome do módulo a ser exibido                                   |
| `moduleDescription` | `string`                                      | Descrição do módulo                                            |
| `moduleIcon`        | `React.ComponentType<{ className?: string }>` | Componente de ícone do Lucide React                            |
| `gradientFrom`      | `string`                                      | Classe Tailwind para início do gradiente (ex: "from-blue-100") |
| `gradientTo`        | `string`                                      | Classe Tailwind para fim do gradiente (ex: "to-blue-200")      |
| `iconColor`         | `string`                                      | Classe Tailwind para cor do ícone (ex: "text-blue-700")        |

## Funcionalidades Incluídas

- ✅ Logo da plataforma com link para o painel principal
- ✅ Nome e descrição do módulo atual
- ✅ Timer de sessão com indicação visual (verde/amarelo/vermelho)
- ✅ Menu dropdown com navegação entre módulos
- ✅ Informações do usuário logado
- ✅ Opção de logout
- ✅ Design responsivo
- ✅ Consistência visual com o painel principal

## Cores Sugeridas por Módulo

### Módulos Existentes

- **Matrículas**: Azul (`from-blue-100 to-blue-200`, `text-blue-700`)
- **Ensino**: Verde (`from-green-100 to-green-200`, `text-green-700`)

### Módulos Futuros (sugestões)

- **Biblioteca**: Roxo (`from-purple-100 to-purple-200`, `text-purple-700`)
- **Financeiro**: Amarelo (`from-yellow-100 to-yellow-200`, `text-yellow-700`)
- **Recursos Humanos**: Rosa (`from-pink-100 to-pink-200`, `text-pink-700`)
- **Relatórios**: Cinza (`from-gray-100 to-gray-200`, `text-gray-700`)
- **Configurações**: Índigo (`from-indigo-100 to-indigo-200`, `text-indigo-700`)
