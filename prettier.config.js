/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
const config = {
    plugins: ["prettier-plugin-tailwindcss"],
    useTabs: false,
    tabWidth: 4,
    printWidth: 120,
    singleQuote: true,
};

export default config;
