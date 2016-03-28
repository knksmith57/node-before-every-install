before-every-install
====================

> resolve npm dependencies and examine package metadata _before_ zero-day scripts are downloaded onto your machine

```sh
$ npm install before-every-install
```

```js
var beforeEveryInstall = require('before-every-install')

beforeEveryInstall(function logPackageVersion(pkg) {
  console.log(pkg.version)

  // pkg is an object containing package metadata returned by the registry
  // eg: for this package v1.0.0
  // http://registry.npmjs.org/before-every-install/1.0.0
})
```

## why
Sometimes it's useful to know exactly what packages and tarballs `npm` is going to witchcraft onto your machine.

Now you can do that _before_ the files are downloaded and extracted.


## how
By abusing the internal `npm install` API and enabling the `dry-run` flag, we can resolve _all_ dependencies and
retrieve package metadata without actually downloading the package contents.

Since the npm CLI [isn't intended to be used programmatically][1] we lock into an exact version (currently, `3.8.3`) to
ensure the [private API][2] we are taking advantage of doesn't mysteriously change. We also use a [worker process][3]
when invoking the install command because I burned an hour trying to figure out how to silence logging without success.

> Mo processes less problems


## __note__
Remember, there isn't any _guarantee_ that the packages resolved by this module are the ones you'll get on a
subsequent `npm install`. This is a serial operation and things could change in between operations.


## ?
Questions / comments / concerns? --> [@knksmith57][4]


[1]: https://github.com/npm/npm/issues/8283#issuecomment-103751107
[2]: https://github.com/npm/npm/blob/v3.8.5/lib/install.js#L163
[3]: ./worker.js
[4]: https://twitter.com/knksmith57
