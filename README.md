# Instructions

- Docker - [Installation Guide Docker for Linux Ubuntu](https://www.digitalocean.com/community/tutorials/docker-ubuntu-16-04-ru)

- Node.js - [Get latest version](https://nodejs.org/en/)

- Yarn - [Installation Guide](https://yarnpkg.com/en/docs/getting-started)

## Clone project

```
git clone git@github.com:andrey51095/capital.git
cd capital
```

It's strongly recommended to use only yarn for the project, because every time when you install dependencies we need to have updated `yarn.lock` file. Since we use lerna you can bootstrap project by:

## Install dependencies

```
cd packages/client
yarn
cd ../server
yarn
cd ../backup
yarn
cd ../..
```

## Create environment variables

```
touch .env
```
specify following env variables in the shell(.env):
```
API_HOST="http://localhost:3000"
APP_CLIENT_PORT=3000
APP_SERVER_PORT=8000
DATABASE_PORT=27017
```

## Backup service

Add credentials.json file to the packages/backup folder to work with google drive API

## Running the project

When you specify environment variables run script from root folder:
```
./start.sh
```

## Browsing

- Project - [http://localhost:3000/](http://localhost:3000/) - PORT specify by 'APP_CLIENT_PORT' parameter

- GraphQL playground - [http://localhost:8000/](http://localhost:8000/) - PORT specify by 'APP_SERVER_PORT' parameter
