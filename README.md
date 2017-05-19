# koa-starter  <img src="https://s-media-cache-ak0.pinimg.com/originals/8e/00/2f/8e002f2f46190b78f2dbc7683b225759.gif" width="110" align="left">
Our Koa starter kit

&nbsp;

## Setup

You must have Postgres installed. I recommend http://postgresapp.com/ for OSX.
```
git clone git@github.com:themostaza/koa-starter.git
cd koa-starter
touch .env
yarn install
yarn run start-dev

> Server is listening on http://localhost:3000...
```

Create a `.env` file in the root directory which will let you set environment variables. `yarn run start-dev` will read from it.

Example `.env`:
```
DATABASE_URL=postgres://username:password@localhost:5432/my-database
```

## Blabla
Thanks to [koa-skeleton](https://github.com/danneu/koa-skeleton) for many useful hints.
