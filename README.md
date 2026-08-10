# rpcraft

A platform-agnostic, type-safe RPC toolkit that crafts end-to-end types — a first-class API for command definitions, link composition, and streaming. Inspired by [tRPC](https://trpc.io).

## Highlights

- 🌐 **Platform Agnostic:** one definition, independent of platform and transport.
- 🛡️ **Type Safe:** fully typed inputs, outputs, and errors, shared between client and server.
- 🧅 **Links:** composable middleware, covering transport, logging, validation, mocking, and more.
- 🌊 **Streaming:** unified streams, powered by AsyncIterator, with Server-Sent Events over standard fetch streams.
- 📜 **Standard Schema:** built on the [Standard Schema spec](https://standardschema.dev), working with validators such as Zod, Valibot, and ArkType.
- 🪶 **Lightweight:** minimal core, with tree-shakeable ESM for importing only what you need.

## Documentation

Documentation coming soon. For now, refer to the examples below and the source code.

## Installation

```bash
npm install rpcraft
# or
pnpm add rpcraft
# or
yarn add rpcraft
```

## Modules

- [rpcraft](./src/index.ts): Type-safe RPC primitives for command definitions, link composition, command routing, and operation execution, with async iterator utilities
- [rpcraft/http-link](./src/links/http-link/index.ts): HTTP transport for standard APIs, works with any backend framework
- [rpcraft/validate-link](./src/links/validate-link/index.ts): Schema validation for inputs, outputs, and errors with flexible configuration
- [rpcraft/log-link](./src/links/log-link/index.ts): Execution logging for observability and debugging
- [rpcraft/mock-link](./src/links/mock-link/index.ts): Mock command responses for development and isolated testing without backend dependencies
- [rpcraft/rpc](./src/rpc/index.ts): JSON-RPC 2.0 compatible protocol implementation with client and server for inter-process and remote communication, minimal and extensible to any environment
- [rpcraft/template](./src/template/index.ts): Lightweight template engine for fast variable substitution (`{name}`, `{name ?? fallback}`, `{name:raw}`)

## Overview

Let's build a **Todo List application** to demonstrate rpcraft's core features.

### 1. Command Definitions

Create type-safe commands with valibot schemas compatible with HTTPLink structures.

```typescript
import type { HTTPLinkMeta } from "rpcraft/http-link";

import { builder } from "rpcraft";
import * as v from "valibot";

// Create builder with HTTPLinkMeta support
const HTTP_BUILDER = builder.create<HTTPLinkMeta>();

// Define data types with valibot
const TodoSchema = v.object({ id: v.string(), title: v.string(), completed: v.boolean() });

// Infer TypeScript type from the schema for type-safe usage
type Todo = v.InferOutput<typeof TodoSchema>;

// Define operation types for subscription events
const OperationSchema = v.picklist(["created", "updated", "removed"]);

// Infer operation type for type-safe event handling
type Operation = v.InferOutput<typeof OperationSchema>;

// Define common error schema for the application
const ErrorSchema = v.object({ message: v.string() });

// Query: Get all todos
const GetTodos = HTTP_BUILDER.query("todo.GetTodos", {
  endpoint: "todo",
  path: "/todos",
  method: "GET",
} as const)
  .schema({
    // Compatible with HTTPLinkOutput structure
    output: v.object({
      data: v.object({ todos: v.array(TodoSchema) }),
    }),
    // Compatible with HTTPLinkError structure
    error: v.object({
      data: ErrorSchema,
    }),
  })
  .build();

// Query: Get a single todo
const GetTodo = HTTP_BUILDER.query("todo.GetTodo", {
  endpoint: "todo",
  path: "/todos/{id}",
  method: "GET",
} as const)
  .schema({
    // Compatible with HTTPLinkInput structure
    input: v.object({
      variables: v.object({ id: v.string() }),
    }),
    // Compatible with HTTPLinkOutput structure
    output: v.object({
      data: v.object({ todo: TodoSchema }),
    }),
    // Compatible with HTTPLinkError structure
    error: v.object({
      data: ErrorSchema,
    }),
  })
  .build();

// Mutation: Create a new todo
const CreateTodo = HTTP_BUILDER.mutation("todo.CreateTodo", {
  endpoint: "todo",
  path: "/todos",
  method: "POST",
} as const)
  .schema({
    // Compatible with HTTPLinkInput structure
    input: v.object({
      data: v.object({ title: v.string() }),
    }),
    // Compatible with HTTPLinkOutput structure
    output: v.object({
      data: v.object({ todo: TodoSchema }),
    }),
    // Compatible with HTTPLinkError structure
    error: v.object({
      data: ErrorSchema,
    }),
  })
  .build();

// Mutation: Update a todo
const UpdateTodo = HTTP_BUILDER.mutation("todo.UpdateTodo", {
  endpoint: "todo",
  path: "/todos/{id}",
  method: "PATCH",
} as const)
  .schema({
    // Compatible with HTTPLinkInput structure
    input: v.object({
      variables: v.object({ id: v.string() }),
      data: v.object({ title: v.optional(v.string()), completed: v.optional(v.boolean()) }),
    }),
    // Compatible with HTTPLinkError structure
    error: v.object({
      data: ErrorSchema,
    }),
  })
  .build();

// Mutation: Remove a todo
const RemoveTodo = HTTP_BUILDER.mutation("todo.RemoveTodo", {
  endpoint: "todo",
  path: "/todos/{id}",
  method: "DELETE",
} as const)
  .schema({
    // Compatible with HTTPLinkInput structure
    input: v.object({
      variables: v.object({ id: v.string() }),
    }),
    // Compatible with HTTPLinkError structure
    error: v.object({
      data: ErrorSchema,
    }),
  })
  .build();

// Subscription: Subscribe to todo changes
const SubscribeTodoChanges = HTTP_BUILDER.subscription("todo.SubscribeTodoChanges", {
  endpoint: "todo",
  path: "/todos/events",
  method: "GET",
  responseType: "event-stream-json",
} as const)
  .schema({
    // Compatible with HTTPLinkOutput structure
    output: v.object({
      // Compatible with event-stream format
      data: v.object({ data: v.object({ operation: OperationSchema, todo: TodoSchema }) }),
    }),
    // Compatible with HTTPLinkError structure
    error: v.object({
      data: ErrorSchema,
    }),
  })
  .build();
```

### 2. Command Handlers

Implement command handlers with in-memory store and real-time event subscriptions.

```typescript
import { router, promise, event, CommandError } from "rpcraft";

// Event data type for todo changes
type TodoChange = { operation: Operation; todo: Todo };

// Event emitter for subscriptions
const todoChanges = event<TodoChange>();

// In-memory todo store
const todos = new Map<string, Todo>();

// Create the todo application router with all command handlers
const appRouter = router
  .create()
  .handle(GetTodos, () => {
    // Produces async iterator with cleanup support
    return promise(async () => {
      return {
        data: { todos: Array.from(todos.values()) },
      };
    });
  })
  .handle(GetTodo, (operation) => {
    // Produces async iterator with cleanup support
    return promise(async () => {
      const {
        command: {
          input: {
            variables: { id },
          },
        },
      } = operation;

      const todo = todos.get(id);

      if (!todo) {
        throw CommandError.from("NOT_FOUND", {
          // Compatible with HTTPLinkError structure
          data: { data: { message: "Todo not found" } },
        });
      }

      return {
        data: { todo },
      };
    });
  })
  .handle(CreateTodo, (operation) => {
    // Produces async iterator with cleanup support
    return promise(async () => {
      const {
        command: {
          input: {
            data: { title },
          },
        },
      } = operation;

      const todo: Todo = {
        id: crypto.randomUUID(),
        title,
        completed: false,
      };

      todos.set(todo.id, todo);

      todoChanges.next({ operation: "created", todo });

      return {
        data: { todo },
      };
    });
  })
  .handle(UpdateTodo, (operation) => {
    // Produces async iterator with cleanup support
    return promise(async () => {
      const {
        command: {
          input: {
            variables: { id },
            data: { title, completed },
          },
        },
      } = operation;

      const todo = todos.get(id);

      if (!todo) {
        throw CommandError.from("NOT_FOUND", {
          // Compatible with HTTPLinkError structure
          data: { data: { message: "Todo not found" } },
        });
      }

      if (title !== undefined) {
        todo.title = title;
      }

      if (completed !== undefined) {
        todo.completed = completed;
      }

      todoChanges.next({ operation: "updated", todo });

      return {
        data: { todo },
      };
    });
  })
  .handle(RemoveTodo, (operation) => {
    // Produces async iterator with cleanup support
    return promise(async () => {
      const {
        command: {
          input: {
            variables: { id },
          },
        },
      } = operation;

      const todo = todos.get(id);

      if (!todo) {
        throw CommandError.from("NOT_FOUND", {
          // Compatible with HTTPLinkError structure
          data: { data: { message: "Todo not found" } },
        });
      }

      todos.delete(id);

      todoChanges.next({ operation: "removed", todo });
    });
  })
  .handle(SubscribeTodoChanges, async function* () {
    // Produces async iterator for streaming events dynamically
    for await (const value of todoChanges.stream()) {
      yield {
        data: {
          data: value,
        },
      };
    }
  });
```

### 3. Link Composition

Compose the link chain with logging, validation, mocking, and HTTP transport.

```typescript
import type { HTTPLinkContext } from "rpcraft/http-link";

import { createExecute, pipe, isCommandError, subscribe } from "rpcraft";
import { HTTPLink } from "rpcraft/http-link";
import { LogLink } from "rpcraft/log-link";
import { MockLink } from "rpcraft/mock-link";
import { ValidateLink } from "rpcraft/validate-link";

// Replace with your real token
const token = "your-access-token";

// HTTP transport with authorization
const http = HTTPLink({
  endpoint: {
    // Routes the "todo" command endpoint (meta.endpoint) to this base URL
    todo: "https://api.example.com",
  },
  headers: () => {
    return {
      Authorization: `Bearer ${token}`,
    };
  },
});

// Mock responses for development and testing
const mock = MockLink(appRouter);

// Schema validation
const validate = ValidateLink();

// Request logging
const log = LogLink({
  start(operation) {
    const {
      command: { type, name },
    } = operation;

    console.debug(`Command "%s %s" start`, type, name);
  },
  next(operation, duration, value) {
    const {
      command: { type, name },
    } = operation;

    console.debug(`Command "%s %s" next in %sms:`, type, name, duration, value);
  },
  error(operation, duration, error) {
    const {
      command: { type, name },
    } = operation;

    console.error(`Command "%s %s" error after %sms:`, type, name, duration, error);
  },
  complete(operation, duration) {
    const {
      command: { type, name },
    } = operation;

    console.debug(`Command "%s %s" complete in %sms`, type, name, duration);
  },
  dispose(operation, duration) {
    const {
      command: { type, name },
    } = operation;

    console.debug(`Command "%s %s" dispose in %sms`, type, name, duration);
  },
});

// Compose execute function with HTTPLink context
const execute = createExecute<HTTPLinkContext>({
  // Composes links from left to right: log -> validate -> mock -> http
  link: pipe(log, validate, mock, http),
});
```

### 4. Usage Examples

List, create, update, and remove todos with real-time change subscriptions.

```typescript
// List all todos
const {
  data: { todos },
} = await execute(GetTodos.create());

console.log("initial todos:", todos);

// Subscribe to real-time todo changes
subscribe(execute(SubscribeTodoChanges.create()), {
  next(value) {
    const {
      data: {
        data: { operation, todo },
      },
    } = value;

    switch (operation) {
      case "created": {
        todos.push(todo);

        break;
      }
      case "updated": {
        const index = todos.findIndex(($todo) => $todo.id === todo.id);

        if (index > -1) {
          todos[index] = todo;
        }

        break;
      }
      case "removed": {
        const index = todos.findIndex(($todo) => $todo.id === todo.id);

        if (index > -1) {
          todos.splice(index, 1);
        }

        break;
      }
    }

    console.log(`todo "%s" %s -> todos:`, todo.id, operation, todos);
  },
});

// Create a new todo
const {
  data: { todo },
} = await execute(CreateTodo.create({ data: { title: "Learn rpcraft" } }));

// Update the todo
await execute(UpdateTodo.create({ variables: { id: todo.id }, data: { completed: true } }));

// Get the todo by id
await execute(GetTodo.create({ variables: { id: todo.id } }));

// Remove the todo
await execute(RemoveTodo.create({ variables: { id: todo.id } }));

// Handle not found error
try {
  await execute(GetTodo.create({ variables: { id: todo.id } }));
} catch (error) {
  if (isCommandError(error, GetTodo)) {
    console.error("error:", error);
  }
}
```

## License

MIT
