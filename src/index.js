const { app, dialog } = require('electron');
const os = require('os');
const cp = require('child_process');
const sudo = require('sudo-prompt');
const path = require('path');
const fs = require('fs');

const exePath = app.getPath('exe');
const rootApplicationPath = '/Applications';
const userApplicationPath = path.join(app.getPath('home'), 'Applications');

function getBundlePath() {
  const bundleExtension = '.app';
  const parts = exePath.split(bundleExtension);
  return `${parts[0]}${bundleExtension}`;
}

function canWrite(filePath, callback) {
  fs.access(filePath, fs.W_OK, (err) => {
    callback(null, !err);
  });
}

function isInApplicationsFolder() {
  return exePath.startsWith(rootApplicationPath) || exePath.startsWith(userApplicationPath);
}

function isInDownloadsFolder() {
  const downloadsPath = app.getPath('downloads');
  return exePath.startsWith(downloadsPath);
}

function preferredInstallLocation() {
  if (fs.existsSync(userApplicationPath)) {
    return userApplicationPath;
  }
  return rootApplicationPath;
}

function getDialogMessage(needsAuthorization) {
  let detail;

  detail = 'I can move myself to the Applications folder if you\'d like.';
  if (needsAuthorization) {
    detail += ' Note that this will require an administrator password.';
  } else if (isInDownloadsFolder()) {
    detail += ' This will keep your Downloads folder uncluttered.';
  }
  return detail;
}

function moveToApplications() {
  const bundlePath = getBundlePath();
  const fileName = path.basename(bundlePath);
  const newBundlePath = path.join(preferredInstallLocation(), fileName);

  // If we're not on MacOS then don't continue
  if (os.platform() !== 'darwin') return;

  // Skip if the application is already in some Applications folder,
  if (isInApplicationsFolder()) return;

  canWrite(newBundlePath, (err, isWritable) => {
    const needsAuthorization = !isWritable;

    // show dialog requesting to move
    const detail = getDialogMessage(needsAuthorization);
    const chosen = dialog.showMessageBox({
      type: 'question',
      buttons: ['Move to Applications', 'Do Not Move'],
      message: 'Move to Applications folder?',
      detail,
    });

    // user chose to do nothing
    if (chosen !== 0) return;

    const moved = (error) => {
      if (error) throw error;

      // open the moved app
      const execName = path.basename(process.execPath);
      const execPath = path.join(newBundlePath, 'Contents', 'MacOS', execName);
      const child = cp.spawn(execPath, [], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();

      // quit the app immediately
      app.exit();
    };

    // move the application bundle
    const command = `mv ${bundlePath} ${newBundlePath}`;
    if (needsAuthorization) {
      sudo.exec(command, { name: app.getName() }, moved);
    } else {
      cp.exec(command, moved);
    }
  });
}

module.exports = {
  moveToApplications,
};
