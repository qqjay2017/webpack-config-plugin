const { VueLoaderPlugin } = require("vue-loader");

const HTMLPlugin = require('html-webpack-plugin')
const resolveRoot = require('./resolveRoot')
const VantResolver = require('@vant/auto-import-resolver').VantResolver
const VantImports = require('@vant/auto-import-resolver').VantImports
const { ProgressPlugin, DefinePlugin, BannerPlugin } = require("webpack")
const CompressionPlugin = require("compression-webpack-plugin");

const FileManagerPlugin = require('filemanager-webpack-plugin');


const dayjs = require('dayjs')

const prefixRE = /^VUE_APP_/
const prefixRE2 = /^VITE_/

function resolveClientEnv(options, raw) {
    const env = {}
    Object.keys(process.env).forEach((key) => {
        if (prefixRE.test(key) || key === 'NODE_ENV' || prefixRE2.test(key)) {
            env[key] = process.env[key]
        }
    })
    env.PUBLIC_PATH = options.publicPath || process.env.PUBLIC_PATH;

    if (raw) {
        return env
    }

    for (const key in env) {
        env[key] = JSON.stringify(env[key])
    }
    return {
        'process.env': env,
    }
}





exports = module.exports = (options) => ({
    module: {

        rules: [
            {
                test: /\.vue$/,
                loader: "vue-loader",
                options: {
                    compilerOptions: {
                        preserveWhitespace: true
                    },
                },
            },
            {
                test: /\.m?jsx?$/,
                exclude: (file) => /node_modules/.test(file) && !/\.vue\.js/.test(file),
                use: [{
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env",],
                    },
                },],
            },
            {
                test: /\.tsx?$/,
                use: [
                    {
                        loader: "babel-loader",
                        options: {
                            presets: ["@babel/preset-env",],
                        },
                    },
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                            appendTsSuffixTo: [/\.vue$/],
                            happyPackMode: true,
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        options.archiveName && new FileManagerPlugin({

            events: {
                onEnd: {
                    archive: [
                        { source: resolveRoot('./dist'), destination: `${options.archiveName}-${dayjs().format('MMDDHHmm')}.zip` }
                    ]
                }
            }


        }),
        new CompressionPlugin({
            test: /\.js$|\.html$|\.css/, // 匹配文件名
            threshold: 10240, // 超过10k进行压缩
            deleteOriginalAssets: false // 是否删除源文件
        }),

        new webpack.BannerPlugin({
            banner: `发布时间${dayjs().format('YYYY-MM-DD HH:mm:ss')}`,
            include: /app/
        }),
        new ProgressPlugin({
            activeModules: true,         // 默认false，显示活动模块计数和一个活动模块正在进行消息。
            entries: true,  			   // 默认true，显示正在进行的条目计数消息。
            modules: false,              // 默认true，显示正在进行的模块计数消息。
            modulesCount: 5000,          // 默认5000，开始时的最小模块数。PS:modules启用属性时生效。
            profile: false,         	   // 默认false，告诉ProgressPlugin为进度步骤收集配置文件数据。
            dependencies: false,         // 默认true，显示正在进行的依赖项计数消息。
            dependenciesCount: 10000,
        }),
        new DefinePlugin({
            // vue3 feature flags <http://link.vuejs.org/feature-flags>
            __VUE_OPTIONS_API__: 'true',
            __VUE_PROD_DEVTOOLS__: 'false',
            ...resolveClientEnv({}, false)
        }),
        new VueLoaderPlugin(),

        require('unplugin-auto-import/webpack').default({
            include: [
                /\.[tj]sx?$/,
                /\.vue$/,
                /\.vue\?vue/,
            ],
            dts: 'src/typings/auto-imports.d.ts',
            resolvers: [VantResolver()],
            imports: [
                'vue',
                'vue-router',
                'pinia',
                '@vueuse/core',
                VantImports(),
            ],
        }),
        require('unplugin-vue-components/webpack').default({
            dts: 'src/typings/components.d.ts',
            resolvers: [VantResolver()],
            dirs: ['src/components'],
            directoryAsNamespace: true,
            // importPathTransform: path => path.replace(/^.+\/src/g, '@')
        }),
        new HTMLPlugin({
            template: resolveRoot('public/index.html'),
            templateParameters: {
                ...resolveClientEnv(
                    {},
                    true
                ),
            },
        }),
    ].filter(Boolean),
});
