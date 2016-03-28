#!/usr/bin/env node
'use strict'

var npm = require('npm')
var dependencies = {}

npm.load({ 'dry-run': true }, function () {
  npm.install(function (err, _, topNode) {
    if (err) {
      report('ERROR', err)
    } else {
      recursivelyParseDependencies(topNode)
      report('SUCCESS', dependencies)
    }
  })
})

function addDependencyVersion (name, version, pkg) {
  if (dependencies[name]) {
    dependencies[name][version] = pkg
  } else {
    var val = {}
    val[version] = pkg
    dependencies[name] = val
  }
}

function parseThenAddDependencyVersion (node) {
  if (node && node.package) {
    try {
      var id = node.package._id
      var parts = id.split('@')
      var version = parts.pop()
      var name = parts.join('@')
      report('DEBUG', 'dep: ' + name + ' - ' + version)
      addDependencyVersion(name, version, node.package)
    } catch (e) {
      var msg = new Error([e, 'failed parsing dependency', JSON.stringify(node.package)].join('\n'))
      report('ERROR', msg)
    }
  }
}

function recursivelyParseDependencies (node) {
  if (node && node.children) {
    for (var i = node.children.length; i > 0; i--) {
      parseThenAddDependencyVersion(node.children[i])
    }

    for (var j = node.children.length; j > 0; j--) {
      recursivelyParseDependencies(node.children[j])
    }
  }
}

function report (type, data) {
  if (process.send) {
    process.send({ status: type, data: data })
  } else {
    var method = type === 'ERROR' ? 'error' : type === 'SUCCESS' ? 'log' : 'debug'
    console[method](data)
  }
}
