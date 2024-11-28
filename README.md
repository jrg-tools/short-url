# SHORT URL Toolset

> [!WARNING]
> Set up the repository with the proper hooks. Run `pre-commit install` in the root directory of the repository.

## API

| Method | Endpoint | Description | Response | isPublic |
| --- | --- | --- | --- | --- |
| GET | `/{id}` | Redirects to the original URL | Redirect | :o: |
| POST | `/` *Body:* `{ "original": "string" }` | Creates a new short URL | `{ "short": "string", "original": "string" }` | :x: |
| DELETE | `/{id}` | Deletes the short URL | `{ "message": "string" }` | :x: |
| GET | `/search?q={string}` | Returns all short URLs matching the query | `[{ "short": "string", "original": "string", "hits": "number" }]` | :x: |

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

```
bun install
bun dev
```

## :rocket: Deploy

```
bun run deploy
```
