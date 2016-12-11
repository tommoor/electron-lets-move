const {app, dialog} = require('electron');
const cp = require('child_process');
const sudo = require('sudo-prompt');
const path = require('path');
const fs = require('fs');

const bundlePath = getBundlePath();
const rootApplicationPath = '/Applications';
const userApplicationPath = path.join(app.getPath('home'), 'Applications');
const fileName = path.basename(bundlePath);
const idealbundlePath = path.join(userApplicationPath, fileName);

module.exports = {
  moveToApplications: (options) => {
    // TODO: Check platform

    // Skip if the application is already in some Applications folder,
    if (bundlePath.startsWith(rootApplicationPath) || bundlePath.startsWith(userApplicationPath)) return true;

    canWrite(idealbundlePath, (err, isWritable) => {
      const needsAuthorization = !isWritable;
      console.log('needsAuthorization', needsAuthorization);

      var detail = 'I can move myself to the Applications folder if you\'d like.';

      if (needsAuthorization) {
        detail += ' Note that this will require an administrator password.';
      } else {
        detail += ' This will keep your Downloads folder uncluttered.';
      }

      // show dialog requesting to move
      const chosen = dialog.showMessageBox({
        type: 'question',
        buttons: ['Do Not Move', 'Move to Applications'],
        message: 'Move to Applications folder?',
        detail
      });

      // user chose to do nothing
      if (chosen === 0) return true;

      const moved = (err, stdout, stderr) => {
        if (err) throw err;

        // open the moved app
        const execName = path.basename(process.execPath);
        const execPath = path.join(idealbundlePath, 'Contents', 'MacOS', execName);
        console.log('execpath', execPath);

        const child = cp.spawn(execPath, [], {
          detached: true,
          stdio: 'ignore'
        });
        child.unref();

        // quit the app immediately
        app.exit();
      }

      // move the application bundle
      const command = `mv ${bundlePath} ${idealbundlePath}`;
      console.log(`command ${command}`);
      if (needsAuthorization) {
        sudo.exec(command, {name: app.getName()}, moved);
      } else {
        cp.exec(command, moved);
      }
    });
  }
}

function getBundlePath() {
  const exePath = app.getPath('exe');
  const parts = exePath.split('/');
  const bundlePath = [];

  for (var part of parts) {
    bundlePath.push(part);
    if (part.endsWith('.app')) break;
  }

  return bundlePath.join('/');
}

function canWrite(path, callback) {
  fs.access(path, fs.W_OK, function(err) {
    callback(null, !err);
  });
}
