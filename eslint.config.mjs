// Configuration plate ESLint 9. `next lint` a été retiré dans Next 16 : le lint
// passe désormais par l'exécutable eslint (voir le script "lint").
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  {
    ignores: ['.next/**', 'node_modules/**'],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
]

export default eslintConfig
