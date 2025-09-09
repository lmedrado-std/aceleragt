/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        // Adiciona uma regra para ignorar a pasta src/ai
        config.watchOptions.ignored.push('**/src/ai/**');

        // Regra para tratar arquivos que usam require.extensions
        config.module.rules.push({
            test: /node_modules\/handlebars\/lib\/index\.js$/,
            loader: 'string-replace-loader',
            options: {
                search: 'require.extensions',
                replace: 'null',
            }
        });

        return config;
    }
};

export default nextConfig;
