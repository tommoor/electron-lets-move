const { app, dialog, shell } = require('electron');
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

function moveToTrash(directory) {
  if (!fs.existsSync(directory)) return true;
  return shell.moveItemToTrash(directory);
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

function shellQuotedString(string) {
  return `'${string.replace("'", "'\\''")}'`;
}

function relaunch(execPath) {
  const quotedDestinationPath = shellQuotedString(execPath);

  // Before we launch the new app, clear xattr:com.apple.quarantine to avoid
  // duplicate "scary file from the internet" dialog.
  // see: https://github.com/tommoor/electron-lets-move/issues/1
  const preOpenCmd = `/usr/bin/xattr -d -r com.apple.quarantine ${quotedDestinationPath}`;

  // The shell script waits until the original app process terminates.
  // This is done so that the relaunched app opens as the front-most app.
  const script = `(while /bin/kill -0 ${process.pid} >&/dev/null; do /bin/sleep 0.1; done; ${preOpenCmd}; /usr/bin/open ${quotedDestinationPath})`;

  const child = cp.spawn(script, {
    shell: true,
    detached: true,
    stdio: 'ignore',
  });
  child.unref();

  // quit the app immediately
  app.exit();
}

function moveToApplications(callback) {
  let resolve;
  let reject;
  const bundlePath = getBundlePath();
  const fileName = path.basename(bundlePath);
  const installLocation = path.join(preferredInstallLocation(), fileName);

  // We return a promise so that the parent application can await the result.
  // Also support an optional callback for those that prefer a callback style.
  const deferred = new Promise((res, rej) => {
    resolve = (response) => {
      if (callback) callback(null, response);
      res(response);
    };
    reject = (error) => {
      if (callback) callback(error);
      rej(error);
    };
  });

  // If we're not on MacOS then we're done here.
  if (os.platform() !== 'darwin') {
    resolve(true);
    return deferred;
  }

  // Skip if the application is already in some Applications folder
  if (isInApplicationsFolder()) {
    resolve(true);
    return deferred;
  }

  // Check if the install location needs administrator permissions
  canWrite(installLocation, (err, isWritable) => {
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
    if (chosen !== 0) {
      resolve(false);
      return;
    }

    // move any existing application bundle to the trash
    if (!moveToTrash(installLocation)) {
      reject(new Error('Failed to move existing application to Trash, it may be in use.'));
      return;
    }

    const moved = (error) => {
      if (error) {
        reject(error);
        return;
      }

      // open the moved app
      const execName = path.basename(process.execPath);
      const execPath = path.join(installLocation, 'Contents', 'MacOS', execName);
      relaunch(execPath);
    };

    // move the application bundle
    const command = `mv ${bundlePath} ${installLocation}`;
    if (needsAuthorization) {
      sudo.exec(command, { name: app.getName() }, moved);
    } else {
      cp.exec(command, moved);
    }
  });

  return deferred;
}

module.exports = {
  moveToApplications,
};
