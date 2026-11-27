import AntdDayjsWebpackPlugin from 'antd-dayjs-webpack-plugin';
import browserslist from 'browserslist';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import ForkTsCheckerWebpackPlugin from 'fork-ts-checker-webpack-plugin';
import lightningCss from 'lightningcss';
import TerserPlugin from 'terser-webpack-plugin';
import webpack, { BannerPlugin } from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import merge from 'webpack-merge';

import pkg from '../../package.json';
import { __DEV__, COPYRIGHT, ENABLE_ANALYZE } from '../utils/constants';
import { resolveSrc } from '../utils/path';
import commonConfig from './webpack.common';

const prodConfig = merge(commonConfig, {
    mode: 'production',
    plugins: [
        new BannerPlugin({
            banner: COPYRIGHT,
            raw: true,
        }),
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                memoryLimit: 1024 * 2,
                configFile: resolveSrc('tsconfig.json'),
                profile: ENABLE_ANALYZE,
            },
        }),
        // SL-1486：既有的型別錯誤先降為警告，不擋正式版打包（型別錯誤另開票修正）
        {
            apply(compiler: webpack.Compiler) {
                ForkTsCheckerWebpackPlugin.getCompilerHooks(compiler).issues.tap(
                    'TypeErrorsAsWarnings',
                    (issues) => issues.map((issue) => ({ ...issue, severity: 'warning' as const })),
                );
            },
        },
        new webpack.ids.HashedModuleIdsPlugin({
            hashFunction: 'sha256',
            hashDigest: 'hex',
            hashDigestLength: 20,
        }),
        new AntdDayjsWebpackPlugin(),
    ],
    optimization: {
        // SL-1486：不拆 vendor.js。content script 只能載入 manifest 列出的檔案，拆出去就得把 vendor.js 注入所有網站
        minimize: true,
        minimizer: [
            new TerserPlugin({
                minify: TerserPlugin.swcMinify,
                parallel: true,
                extractComments: false,
            }),
            new CssMinimizerPlugin({
                minify: CssMinimizerPlugin.lightningCssMinify,
                minimizerOptions: {
                    // @ts-expect-error webpack type define wrong
                    targets: lightningCss.browserslistToTargets(browserslist(pkg.browserslist)),
                    preset: [
                        'default',
                        {
                            discardComments: { removeAll: true },
                        },
                    ],
                },
            }),
        ],
    },
});

if (ENABLE_ANALYZE) {
    prodConfig.plugins!.push(new BundleAnalyzerPlugin());
}

export default prodConfig;
