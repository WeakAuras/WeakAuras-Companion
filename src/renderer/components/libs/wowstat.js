const path = require("path");
const fs = require("fs");

module.exports = {
  isOpen: wowpath => {
    const logfile = path.join(wowpath, "_retail_", "Logs", "Client.log");
    const renametest = path.join(
      wowpath,
      "_retail_",
      "Logs",
      "Client.log.test"
    );
    try {
      fs.renameSync(logfile, renametest);
    } catch (err) {
      return true;
    }
    fs.renameSync(renametest, logfile);
    return false;
  }
};
