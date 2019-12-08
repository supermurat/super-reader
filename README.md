[![Build Status](https://travis-ci.org/supermurat/super-reader.svg?branch=master)](https://travis-ci.org/supermurat/super-reader)
[![BrowserStack Status](https://automate.browserstack.com/badge.svg?badge_key=NW5WdStCU1RVVVpZOERoaGFFMnc0VWJRVlF3MVBYQ29EQWswWTJ1bmU1ST0tLTB1T3JrNmpFQWpvcDJwTGZoTHF6Snc9PQ==--d4bf8976f4d2485a4971d6606e5a72bd0559a8cb)](https://automate.browserstack.com/public-build/NW5WdStCU1RVVVpZOERoaGFFMnc0VWJRVlF3MVBYQ29EQWswWTJ1bmU1ST0tLTB1T3JrNmpFQWpvcDJwTGZoTHF6Snc9PQ==--d4bf8976f4d2485a4971d6606e5a72bd0559a8cb)
[![Coverage Status](https://coveralls.io/repos/github/supermurat/super-reader/badge.svg?branch=master)](https://coveralls.io/github/supermurat/super-reader?branch=master)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/d8bd28c7d9e4499aa0e0cee622fe2352)](https://www.codacy.com/app/supermurat/super-reader?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=supermurat/super-reader&amp;utm_campaign=Badge_Grade)
[![Angular Style Guide](https://mgechev.github.io/angular2-style-guide/images/badge.svg)](https://angular.io/styleguide)

[![Dependency Status](https://david-dm.org/supermurat/super-reader.svg)](https://david-dm.org/supermurat/super-reader)
[![devDependency Status](https://david-dm.org/supermurat/super-reader/dev-status.svg)](https://david-dm.org/supermurat/super-reader?type=dev)

[![GitHub issues](https://img.shields.io/github/issues/supermurat/super-reader.svg)](https://github.com/supermurat/super-reader/issues)
[![GitHub forks](https://img.shields.io/github/forks/supermurat/super-reader.svg)](https://github.com/supermurat/super-reader/network)
[![GitHub stars](https://img.shields.io/github/stars/supermurat/super-reader.svg)](https://github.com/supermurat/super-reader/stargazers)
[![GitHub license](https://img.shields.io/github/license/supermurat/super-reader.svg)](https://github.com/supermurat/super-reader/blob/master/LICENSE)

[![repo size](https://img.shields.io/github/repo-size/supermurat/super-reader.svg)](https://github.com/supermurat/super-reader)
[![last commit](https://img.shields.io/github/last-commit/supermurat/super-reader.svg)](https://github.com/supermurat/super-reader/commits/master)
[![commit activity](https://img.shields.io/github/commit-activity/w/supermurat/super-reader.svg)](https://github.com/supermurat/super-reader/commits/master)

# super-reader
All-In-One firebase and angular project.

## Install global dependencies
```sh
npm run install:dependencies:global
```

## Install dependencies
```sh
npm run install:dependencies
```

## Development
With "ng serve" (default i18n - en) - [`http://localhost:4200/`](http://localhost:4200/)
```sh
npm run start
```
With "firebase serve" (i18n support - en, tr) - [`http://localhost:5000/`](http://localhost:5000/)
```sh
npm run serve:i18n
```

### Extract i18n Translation File
```sh
npm run extract:i18n
```

### Check Bundle Stats
```sh
npm run stats
```

### Unit Test - Karma
```sh
npm run test
```

### Protractor Test - e2e 
```sh
npm run e2e
```

## Deployment

Build files and deploy to Firebase Hosting 
(Includes all of firebase rules, indexed etc.)
### Deploy to Prod Environment
```sh
npm run deploy:prod
```

## Angular CLI
get more info [`angular-cli/wiki`](https://github.com/angular/angular-cli/wiki)

ng generate [`angular-cli/wiki/generate`](https://github.com/angular/angular-cli/wiki/generate)

stories [`angular-cli/wiki/stories`](https://github.com/angular/angular-cli/wiki/stories)

## Contributing
- Fork this repository to your GitHub account
- Clone the forked repository
- Create your feature branch
- Commit your changes
- Push to the remote branch
- Open a Pull Request

## Licence

MIT

## Thanks to
| [![firebase](/docs/images/firebase.png "firebase")](https://firebase.google.com/)              | &nbsp;                                                                             |
| ---                                                                                            | ---                                                                                |
| [![browserstack](/docs/images/browserstack.png "browserstack")](https://www.browserstack.com/) | [![travis-ci](/docs/images/travis-ci.png "travis-ci")](https://www.travis-ci.org/) |
| [![codacy](/docs/images/codacy.png "codacy")](https://www.codacy.com/)                         | [![coveralls](/docs/images/coveralls.png "coveralls")](https://coveralls.io/)      |
