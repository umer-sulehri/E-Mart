import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier/flat";

export default defineConfig([
  ...nextVitals,
  prettier,
  {
    rules: {
      "no-console": ["warn", { allow: ["warn", "error"] }],
      // These React Compiler-era rules arrived with eslint-plugin-react-hooks v7.
      // Enabling them now would require a broad refactor unrelated to this
      // security release. Keep the existing hooks rules enforced and revisit
      // the newer rules separately.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/immutability": "off",
      "react-hooks/purity": "off",
      "react-hooks/incompatible-library": "off",
      "@next/next/no-location-assign-relative-destination": "off",
    },
  },
  {
    files: ["scripts/**/*.{js,mjs,cjs}"],
    rules: {
      "no-console": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "android/**",
    "web/**",
    "next-env.d.ts",
  ]),
]);
