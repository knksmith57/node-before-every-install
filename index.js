#!/usr/bin/env node
'use strict'

var debug = require('debug')
var fork = require('child_process').fork
var path = require('path')
var Promise = require('bluebird')
var workerScript = path.resolve(path.join(__dirname, 'worker.js'))

var log = debug('before-every-install')

var beforeEveryInstall = Promise.promisify(function beforeEveryInstall (fn, cb) {
  resolveDependencies()
    .then(function (deps) {
      if (typeof fn === 'function') {
        var pkgNames = Object.keys(deps)
        for (var i = 0; i < pkgNames.length; ++i) {
          var pkgVersions = Object.keys(deps[pkgNames[i]])
          for (var j = 0; j < pkgVersions.length; j++) {
            var pkg = deps[pkgNames[i]][pkgVersions[j]]
            fn(pkg)
          }
        }
      }
      cb(null, deps)
    })
    .catch(function (err) {
      cb(err, null)
    })
})

var resolveDependencies = Promise.promisify(function resolveDependencies (cb) {
  // npm is impossible to silence programmatically. l33t hacks
  log('starting worker to build install manifest')
  var working = true
  var worker = fork(workerScript, { silent: true })

  worker.on('close', function (code) {
    if (working) {
      working = false
      if (code !== 0) {
        var err = new Error('failed to resolve dependencies requested by `npm install`')
        log(err)
        cb(err, null)
      }
    }
  })

  worker.on('message', function (message) {
    if (message.status === 'SUCCESS') {
      working = false
      log('successfully resolved dependencies requested by `npm install`')
      log(message.data)
      cb(null, message.data)
    } else if (message.status === 'DEBUG') {
      log(message.data)
    } else if (message.status === 'ERROR') {
      if (working) {
        working = false
        log(message.data)
        cb(message.data, null)
      }
    }
  })

  process.on('SIGINT', function () {
    if (working) {
      worker.kill()
    }

    process.exit()
  })
})

module.exports = beforeEveryInstall
module.exports.resolveDependencies = resolveDependencies
