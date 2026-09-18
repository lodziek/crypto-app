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
  {
    // next.config.js est chargé en CommonJS par Next, et `next/constants` n'est
    // pas exposé à la résolution ESM : la forme `require` est la seule qui
    // fonctionne, et c'est celle que documente Next pour l'API de phases.
    files: ['next.config.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
]

export default eslintConfig
