# SHORT URL Toolset

> [!WARNING]
> Set up the repository with the proper hooks. Run `pre-commit install` in the root directory of the repository.

## API

| Method | Endpoint | Description | Response | isPublic |
| --- | --- | --- | --- | --- |
| GET | `/{id}` | Redirects to the original URL | Redirect | :o: |
| POST | `/ops/new` *Body:* `{ "original": "string" }` | Creates a new short URL | `{ "short": "string", "original": "string" }` | :x: |
| DELETE | `/ops/{id}` | Deletes the short URL | `{ "message": "string" }` | :x: |
| GET | `/ops/search?q={string}` | Returns all short URLs matching the query | `[{ "short": "string", "original": "string", "hits": "number" }]` | :x: |

## Authentication

To authenticate use a signature ssh key. The key must be added to the repository secrets.

## Folder Structure

```sh
.
├── db # SQLite3 schema for short URLs and SSH Auth
├── docs # Documentation for the DB schema
└── src # Source code
```

## Local development

```sh
$ bun install
$ bun dev
```

## Database

To work with the database locally, run `bun run db:start` to start the database locally.

If it's the first time running this script, the `.out` folder won't exist, create it beforehand. Populate the database with the following commands:

```sh
$ mkdir .out
$ touch .out/local-short-url.sqlite3

$ bun run db:dump # This will dump the production database to a SQL file
$ bun run db:start
$ bun run db:populate # This will populate the local database with production data
```

To make migrations follow this steps:

```sh
$ bun run db:start # This will start the database locally

$ bun run db:makemigration
$ bun run db:migrate

$ bun run db:push # This will push the migration to the database locally
$ bun run db:prod:push # This will push the migration to the database in production
```

## :rocket: Deploy

Automatic deploys for the main branch are set up to deploy to the production environment.
Deployed to Dokploy through Docker.
