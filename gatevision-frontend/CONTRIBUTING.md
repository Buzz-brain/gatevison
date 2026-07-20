# Contributing to GateVision

## Development Setup

1. Fork the repository
2. Clone your fork
3. Set up frontend and backend as described in README.md
4. Create a feature branch: `git checkout -b feature/your-feature`

## Code Style

### TypeScript

- Strict mode enabled (`strict: true`, `noUncheckedIndexedAccess: true`)
- No `any` types
- Use `useRef<T | null>(null)` pattern (React 19)
- All array accesses require `!` assertion

### Naming Conventions

- **Components**: PascalCase
- **Hooks**: camelCase with `use` prefix
- **Functions**: camelCase
- **Types/Interfaces**: PascalCase
- **Files**: kebab-case

### Import Order

1. React/hooks
2. Third-party libraries
3. Internal modules (sorted by depth)
4. CSS/styles

## Adding a New Feature

1. Create feature module in `src/features/{feature-name}/`
2. Define API types in `api/types.ts` (backend-mirror)
3. Create mapper in `api/mapper.ts`
4. Create API service in `src/services/api/{feature}.api.ts`
5. Add endpoints to `src/lib/api/endpoints.ts`
6. Add query keys to `src/lib/api/query-client.ts`
7. Create React Query hooks in `hooks/use-{feature}-api.ts`
8. Create composite hook in `hooks/use-{feature}.ts`
9. Create components in `components/`
10. Create route in `src/routes/{feature}.tsx`
11. Lazy-load the route in `src/router.ts`

## Build Verification

Before submitting a PR:

```bash
npx tsc --noEmit       # Must pass with 0 errors
npx vite build          # Must succeed (chunk-size warnings OK)
```

## Commit Guidelines

- Use imperative mood ("Add feature" not "Added feature")
- Keep commits focused and atomic
- Reference issues where applicable
