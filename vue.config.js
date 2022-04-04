module.exports = {
  chainWebpack: (config) => {
    config.plugin("html").tap((args) => {
      args[0].filename = "index.html";
      args[0].template = "./src/index.ejs";
      return args;
    });
  },
  configureWebpack: {
    devtool: "source-map"
  },
  pluginOptions: {
    electronBuilder: {
      customFileProtocol: "./",
      builderOptions: {
        productName: "WeakAuras Companion",
        appId: "wtf.weakauras.companion",
        dmg: {
          contents: [
            {
              x: 410,
              y: 150,
              type: "link",
              path: "/Applications",
            },
            {
              x: 130,
              y: 150,
              type: "file",
            },
          ],
        },
        mac: {
          icon: "public/icon.icns",
          category: "Utility",
          extendInfo: {
            LSUIElement: 1,
          },
          target: {
            target: "dmg",
            arch: ["x64", "arm64"],
          },
          artifactName: "${productName}-${version}-${os}-${arch}.${ext}",
        },
        win: {
          icon: "public/icon.ico",
          publish: {
            provider: "github",
          },
          extraResources: ["node_modules/regedit/vbs/*"],
        },
        nsis: {
          deleteAppDataOnUninstall: true,
        },
        linux: {
          target: ["AppImage", "snap", "deb", "rpm"],
          icon: "public/bigicon.png",
          category: "Utility",
        },
        protocols: [
          {
            name: "weakauras-companion",
            role: "Viewer",
            schemes: ["weakauras-companion"]
          }
        ]
      },
      nodeIntegration: true,
      experimentalNativeDepCheck: true,
    },
  },
  productionSourceMap: false,
};
