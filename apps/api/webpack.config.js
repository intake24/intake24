const path = require('node:path');
const CircularDependencyPlugin = require('circular-dependency-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const NodemonPlugin = require('nodemon-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const WebpackBar = require('webpackbar');
const { onlySequelizeDecoratorImports, isSubpath } = require('./circular-dependency-utils');

module.exports = (env) => {
  const { NODE_ENV = 'development', NODE_INSPECT_BREAK } = env;
  const isDev = NODE_ENV === 'development';
  const inspectBreak = !!NODE_INSPECT_BREAK;
  const mode = NODE_ENV === 'test' ? 'none' : NODE_ENV;

  const plugins = [
    new ForkTsCheckerWebpackPlugin({ typescript: { memoryLimit: 3072 } }),
    new WebpackBar({ name: 'Server' }),
  ];

  if (isDev) {
    plugins.push(
      new NodemonPlugin({
        script: './dist/server.js',
        watch: ['./dist', '.env'],
        nodeArgs: ['--trace-warnings', inspectBreak ? '--inspect-brk=9229' : '--inspect=5959'],
      }),
    );

    plugins.push(
      new CircularDependencyPlugin({
        failOnError: false,
        exclude: /node_modules/,
        allowAsyncCycles: false,

        onDetected({ paths, compilation }) {
          let ignore = false;
          if (isSubpath('../../packages/db/src/models', paths[0])) {
            const absPaths = paths.map(p => path.resolve(compilation.options.context || process.cwd(), p));
            ignore = absPaths.slice(0, -1).every((_, i) =>
              onlySequelizeDecoratorImports(absPaths[i], absPaths[i + 1]),
            );
          }
          if (!ignore)
            compilation.warnings.push(new Error(`${paths[0]}: circular import: ${paths.slice(1).join(' -> ')}`));
        },
      }),
    );
  }

  return {
    context: __dirname,
    entry: {
      server: path.resolve('./src/index.ts'),
      foodIndexBuilder: path.resolve('./src/food-index/workers/index-builder.ts'),
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].js',
    },
    mode,
    target: 'node',
    watch: isDev,
    watchOptions: { ignored: ['node_modules/**', 'public/**'] },
    devtool: isDev ? 'source-map' : undefined,
    optimization: {
      minimize: false,
    },
    externals: [nodeExternals(), { sharp: 'commonjs sharp' }],
    externalsPresets: { node: true },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.json'],
      plugins: [
        new TsconfigPathsPlugin({
          configFile: './tsconfig.json',
          logLevel: 'info',
          logInfoToStdOut: true,
          extensions: ['.ts'],
        }),
      ],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
          options: {
            transpileOnly: true,
          },
        },
      ],
    },
    plugins,
  };
};
