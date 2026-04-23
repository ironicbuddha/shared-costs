const stylelintConfig = {
  extends: ["stylelint-config-standard"],
  ignoreFiles: [
    "node_modules/**/*",
    "dist/**/*",
    "build/**/*",
    "coverage/**/*",
    ".next/**/*",
    "out/**/*",
  ],
  rules: {
    "import-notation": null,
    "at-rule-no-unknown": [
      true,
      {
        ignoreAtRules: [
          "tailwind",
          "apply",
          "layer",
          "config",
          "theme",
          "utility",
          "variant",
          "responsive",
          "screen",
        ],
      },
    ],
  },
};

export default stylelintConfig;
