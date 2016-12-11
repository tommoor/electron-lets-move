[![npm version](https://badge.fury.io/js/electron-lets-move.svg)](https://badge.fury.io/js/electron-lets-move)

# Electron LetsMove

A module that offers to automatically move your Electron app to the Applications
folder if opened from another location. Inspired by [LetsMove](https://github.com/potionfactory/LetsMove) for MacOS.

![Electron LetsMove](https://cloud.githubusercontent.com/assets/380914/21077515/323c21ca-bf03-11e6-83bb-3ffc8c7d926c.png)


## Requirements

This module is designed to be used within Electron on OSX.


## Usage

You should call the `moveToApplications` method as soon as possible after the app
ready event in the main process.

```javascript
const {app} = require('electron');
const {moveToApplications} = require('electron-lets-move');

app.on('ready', () => {
  moveToApplications();

  // do the rest of your application startup
});
```

## License

Electron LetsMove is released under the MIT license. It is simple and easy to understand and places almost no restrictions on what you can do with it.
[More Information](http://en.wikipedia.org/wiki/MIT_License)
