module.exports = {
  entry: './graphology-builder.js',
  output: {
    filename: './app/graphology-build.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  }
};