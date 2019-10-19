module.exports = {
  presets: [
    [
      "@vue/cli-plugin-babel/preset",
      {
        modules: "commonjs"
      }
    ]
  ],
  plugins: ["@babel/transform-runtime"]
};
