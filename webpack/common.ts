import { Configuration } from 'webpack';
import { resolve } from 'path';
import * as webpackNodeExternals from 'webpack-node-externals';

const basePath = resolve(__dirname, '..');
const sourcePath = resolve(basePath, 'src');

const common: Configuration = {
    target: 'node',
    externals: [
        webpackNodeExternals()
    ],
    entry: {
        typeormStore: resolve(sourcePath, 'index.ts')
    },
    output: {
        path: resolve(basePath, 'lib'),
        libraryTarget: 'commonjs2',
        filename: '[name].js'
    },
    resolve: {
        extensions: ['.ts']
    },
    module: {
        rules: [
            {
                enforce: 'pre',
                test: /\.ts$/,
                use: [
                    {
                        loader: 'tslint-loader',
                        options: {
                            emitErrors: true,
                            failOnHint: true,
                            typeCheck: true
                        }
                    }
                ],
                exclude: /node_modules/
            },
            {
                test: /\.ts$/,
                use: 'awesome-typescript-loader',
                exclude: /node_modules/
            }
        ]
    }
};

export default common;
