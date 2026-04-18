import tsParser from "@typescript-eslint/parser";
import stylistic from "@stylistic/eslint-plugin";

const stylisticRules = stylistic.configs.recommended.rules;

export default [
  {
    files: ["source/**/*.{js,ts,mjs,cts,mts,jsx,tsx}"],
    ignores: ["**/*.min.js", "build/**"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "@stylistic": stylistic
    },
    rules: {
      ...stylisticRules
    }
  }
];
