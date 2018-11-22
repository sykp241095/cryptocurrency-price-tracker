const kit = require('nokit')
const webpack = require('webpack')
const autoprefixer = require('autoprefixer')
const CleanupPlugin = require('webpack-cleanup-plugin')
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const {
  join
} = kit.path

const BUILD_PATH = join(__dirname, 'ext', 'build')
const NPM_PATH = join(__dirname, 'node_modules')
const SRC_PATH = join(__dirname, 'src')

const fileLoaderCompiledName = '[name].[ext]'

const cssExtractor = new ExtractTextPlugin({
  filename: '[name].css',
  allChunks: true,
});

const postcssLoader = {
  loader: 'postcss-loader',
  options: {
    plugins: [
      autoprefixer({
        browsers: ['last 3 versions'],
      }),
    ],
  },
};

const plugins = [
  new webpack.ProvidePlugin({
    $: 'jquery',
  }),

  // new webpack.optimize.ModuleConcatenationPlugin(),

  new webpack.HashedModuleIdsPlugin(),

  cssExtractor,
];

if (kit.isProduction()) {
  plugins.push(
    new CleanupPlugin(BUILD_PATH),
    new UglifyJsPlugin({
      sourceMap: true,
      uglifyOptions: {
        ecma: 8,
        compress: {
          warnings: false
        }
      }
    })
  );
}

module.exports = {
  entry: {
    popup: 'js/popup.js',
    cs: 'js/cs.js'
  },

  output: {
    path: BUILD_PATH,
    publicPath: '',
    filename: '[name].js',
  },

  resolve: {
    modules: [__dirname, NPM_PATH, SRC_PATH],
    alias: {
      vue$: 'vue/dist/vue.runtime.js',
    },
  },

  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
    }, {
      test: /\.vue$/,
      loader: 'vue-loader',
      options: {
        extractCSS: true,
      },
    }, {
      test: /\.css$/,
      loader: cssExtractor.extract({
        fallback: 'style-loader',
        use: [{
            loader: 'css-loader',
          },
          postcssLoader,
        ],
      }),
    }, {
      test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: `file-loader?name=${fileLoaderCompiledName}`,
    }, {
      test: /\.(jpe?g|png)$/,
      loader: `file-loader?name=${fileLoaderCompiledName}`,
    }, {
      test: /\.html$/,
      loaders: [{
        loader: `file-loader?name=${fileLoaderCompiledName}`,
      }, {
        loader: 'extract-loader',
      }, {
        loader: 'html-loader',
        options: {
          minimize: true,
        },
      }, ],
    }, ],
  },

  stats: {
    hash: false,
    chunks: false,
    chunkModules: false,
    children: false,
  },

  plugins,
};
