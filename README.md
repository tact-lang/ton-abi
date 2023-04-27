# TON ABI Parser

Small package for runtime parsing of messages given ABI and message data.

## Getting started

Add it to your project:

```bash
yarn add ton-abi
```

Register types and parse message:

```ts
import { TypeRegistry } from 'ton-abi';

const registry = new TypeRegistry();
registry.register(....); // Put ABI type here

const message = registry.parse(...); // Put message data here
```

## License

MIT

