const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  { ignores: ["coverage/**", "reports/**", ".cache/**", "trivy/**"] },
  {
    files: ["**/*.js", "**/*.cjs"],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "commonjs",
      globals: globals.node
    },
    rules: {
      ...js.configs.recommended.rules,
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error"
    }
  }
];
