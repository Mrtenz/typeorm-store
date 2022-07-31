# typeorm-store
A TypeORM-based store for [express-session](https://github.com/expressjs/session).

## Installation
```bash
$ yarn add typeorm-store
```

## Usage
First, make a new `Session` entity. Make sure to synchronize the entity to the database. `typeorm-store` will not to this for you.
```typescript
import { BaseEntity, Column, Entity, PrimaryColumn } from 'typeorm';
import { SessionEntity } from 'typeorm-store';

@Entity()
export class Session extends BaseEntity implements SessionEntity {
    @PrimaryColumn()
    id: string;

    @Column()
    expiresAt: number;

    @Column()
    data: string;
}
```

Use `TypeormStore` as store in `express-session`, specifying the repository of the new `Session` entity.
```typescript
import * as express from 'express';
import * as session from 'express-session';
import { getConnection } from 'typeorm';
import { TypeormStore } from 'typeorm-store';
import { Session } from './entities/session';

const app = express();

// Make sure the connection is ready before doing this
const repository = getConnection().getRepository(Session);

app.use(session({
   secret: 'secret',
   resave: false,
   saveUninitialized: false,
   store: new TypeormStore({ repository })
}))
```

# API
`new TypeormStore(options)`

## Options
* `repository` (required) - The repository of the session entity.
* `ttl` (optional) - The time to live for the session in seconds. Defaults to 86400 (1 day).
* `expirationInterval` (optional) - The interval in seconds to check for expired sessions.
   Defaults to 86400 (1 minute).
