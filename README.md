[![npm version](https://badge.fury.io/js/electron-lets-move.svg)](https://badge.fury.io/js/electron-lets-move)

# Electron LetsMove

A module that offers to automatically move your Electron app to the Applications
folder if opened from another location. Inspired by [LetsMove](https://github.com/potionfactory/LetsMove) for MacOS.

![Electron LetsMove](https://cloud.githubusercontent.com/assets/380914/21082066/31881d30-bf88-11e6-8110-9526168eb95b.png)

## Requirements

This module is designed to be used within Electron on OSX.


## Installation

`npm install --save electron-lets-move`


## Usage

You should call the `moveToApplications` method as soon as possible after the app
ready event in the main process. Ideally before the user has any chance to interact
with the application.

`moveToApplications` returns a promise that will resolve when the application is
in the correct location or an error occurred. You can also provide an optional
node-style callback as the only parameter.


### ES5
```javascript
const {app} = require('electron');
const {moveToApplications} = require('electron-lets-move');

app.on('ready', function() {
  moveToApplications(function(err) {
    if (err) {
      // log error, something went wrong whilst moving the app.
    }

    // do the rest of your application startup
  });
});
```

### ES6
```javascript
import {app} from 'electron';
import {moveToApplications} from 'electron-lets-move';

app.on('ready', async () => {
  try {
    await moveToApplications();
    // do the rest of your application startup
  } catch (error) {
    // log error, something went wrong whilst moving the app.
  }
});
```

## License

Electron LetsMove is released under the MIT license. It is simple and easy to understand and places almost no restrictions on what you can do with it.
[More Information](http://en.wikipedia.org/wiki/MIT_License)
