module.exports = {
  chainWebpack: (config) => {
    config.plugin("html").tap((args) => {
      args[0].filename = "index.html";
      args[0].template = "./src/index.ejs";
      return args;
    });
  },
  pluginOptions: {
    electronBuilder: {
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
      },
      nodeIntegration: true,
      experimentalNativeDepCheck: true,
    },
  },
  productionSourceMap: false,
};
