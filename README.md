# Remix conform RPC

Supercharge your remix loaders and actions with conform and zod.

## Credits

The API and design are heavily inspired by remix-easy-mode by [Samuel Cook](https://github.com/sjc5). You can find
his repo here: https://github.com/sjc5/remix-easy-mode

Special thanks to Kiliman for providing the utilities for param and query
parsing: [remix-params-helper by kiliman](https://github.com/kiliman/remix-params-helper)

Form data parsing is done using [conform by edmundhung](https://github.com/edmundhung/conform)

## Installation

Install the package and required peer dependencies

#### npm

```bash
npm install remix-conform-rpc zod remix-params-helper @conform-to/react @conform-to/zod @conform-to/dom
```

#### yarn

```bash
yarn add remix-conform-rpc zod remix-params-helper @conform-to/react @conform-to/zod @conform-to/dom
```

## Defining loaders

### Defining a simple loader

You can define a loader by calling the `setupLoader` function and passing an object with a `load` function.

```typescript
import { setupLoader } from "remix-conform-rpc/server/loader";

export const loader = setupLoader({
  load: async ({ context, request }) => {
    return { message: "hello world" };
  }
});

```

### Parsing params and path queries

You can add type-safe query and param parsing by using the `paramSchema` and/or `querySchema` props.
Once you define a param or query schema, the object becomes available in the `params` and `query` object in the load
function.

```typescript
import { setupLoader } from "remix-conform-rpc/server/loader";
import { z } from "zod";

export const loader = setupLoader({
  querySchema: z.object({
    page: z.coerce.number().optional()
  }),
  paramSchema: z.object({
    id: z.string()
  }),
  load: async ({ context, request, params, query }) => {
    params.id; // string - typesafe
    query.page; // number | undefined - typesafe

    return { message: "hello world", };
  }
});
```

### Running middleware

You can run middleware before your loader. Anything you return from your middleware will be available in the `load`
functions arguments.

```typescript
import { setupLoader } from "remix-conform-rpc/server/loader";
import { z } from "zod";

export const loader = setupLoader({
  middleware: async ({ context, request }) => {
    const user = await getUserFromSession(request);
    return { user };
  },
  load: async ({ context, request, user }) => {
    user; // user object returned from middleware
    return { message: "hello world" };
  }
});
```

## Defining actions

### Defining a simple action with a zod schema

Define a loader with a zod schema to parse and validate the form data body.

```typescript
import { setupAction } from "remix-conform-rpc/server/action";
import { z } from "zod";

export const action = setupAction({
  schema: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  mutation: async ({ request, submission }) => {
    //Already validated and parsed
    const { email, password } = submission.value;
  }
});
```

> [!NOTE]
> If the submission validation fails, the following object will be returned from your action (with http status 400):

```json5
{
  "error": "invalid_submission",
  "status": "error",
  "code": 400,
  "result": {}
  //conform submission reply with errors
}
```

### Params, Query and Middleware

The same way you can define loaders, you can define actions with params, query and middleware.

```typescript
import { setupAction } from "remix-conform-rpc/server/action";
import { z } from "zod";

export const action = setupAction({
  schema: z.object({
    email: z.string().email(),
    password: z.string().min(8)
  }),
  querySchema: z.object({
    page: z.coerce.number().optional()
  }),
  paramSchema: z.object({
    id: z.string()
  }),
  middleware: async ({ context, request, params }) => {
    const user = await getUserFromSession(request);
    await checkUserPermissions(user, params.id);
    return { user };
  },
  mutation: async ({ request, submission, user, query, params }) => {
    return { message: "hello world" };
  }
});
```

## Consuming client-side

While you can use standard html forms to submit data, you can also enhance your users experience with the `useAction`
hook.

```tsx
import { useAction } from "remix-conform-rpc/hooks/action";
import { z } from "zod";


const formSchema = z.object({
  name: z.string(),
  description: z.string().optional()
});

const { submit, fetcher } = useAction<typeof action, typeof formSchema>({
  //all options are optional
  path: "/api/products",
  method: "post",
  onSuccess: (actionResult) => {
    //do something with the result
  },
  onError: (errorResult) => {
    const data = errorResult.result; //Return from the server
    const status = errorResult.status; //"error"
    const statusCode = errorResult.code; // http status code
    const errorMessage = errorResult.error; // error message from the server
  }
});

//Parameters and types are automatically inferred
submit({
  name: "Product name",
  description: "Product description"
});
```

### Auto-creating form data with conform

You can also leverage typesafe form creating using the `useActionForm` hook.

```tsx
import { useActionForm } from "remix-conform-rpc/hooks/action";
import { z } from "zod";

const formSchema = z.object({
  name: z.string(),
  description: z.string().optional()
});

const { form, fields, submit, fetcher } = useActionForm<typeof action, typeof formSchema>({
  //All options are optional
  onSuccess: (actionResult) => {
    //do something with the result
  },
  onError: (errorResult) => {
    const data = errorResult.result; //Return from the server
    const status = errorResult.status; //"error"
    const statusCode = errorResult.code; // http status code
    const errorMessage = errorResult.error; // error message from the server
  },
  onSubmit: (event, { name, description }) => {
    event.preventDefault();
    submit({ name, description });
  },
  defaultValue: {
    name: "My product",
    description: "My product description"
  }
});
```

See the [conform documentation](https://conform.guide) for more information on how to use the `form` and
`fields` objects
