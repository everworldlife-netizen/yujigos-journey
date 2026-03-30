const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/index.html',
      inject: 'body'
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'public', 'assets'),
          to: path.resolve(__dirname, 'dist', 'assets')
        }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist')
    },
    port: 8080,
    open: false
  }
};
