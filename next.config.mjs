/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // Adiciona a pasta ai ao array de ignorados do watchOptions
        config.watchOptions.ignored = ["**/.git/**", "**/.next/**", "**/node_modules/**", "**/src/ai/**"];

        return config;
    },
};

export default nextConfig;
