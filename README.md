# @ns84/gretchen

Makes `fetch` happen.

Gretchen is a drop-in replacement for `fetch` that adds options that make it
easier to send and receive JSON, throw on unsuccessful HTTP requests, and retry
on `429 Too Many Requests` responses.

## Installation

```bash
npm install @ns84/gretchen
```

## Usage

```js
import { gretchen } from "@ns84/gretchen";

// Gretchen is a drop-in replacement for fetch.

const res = await gretchen("https://example.com/", {
  method: "POST",
  headers: { accept: "application/json", "content-type": "application/json" },
  body: JSON.stringify('{ "Wednesday": "pink" }'),
});

const value = await res.json();
```

```js
// With Gretchen, JSON over HTTP is much easier.

const value = await gretchen("https://example.com/", {
  // Sets the method to POST, sets a JSON Content-Type, and converts the
  // request body to JSON. All init fields can still be overwritten.
  sendJSON: true,

  // Sets a JSON Accept header, and parses the response body as JSON and
  // returns it instead of a response object. The Accept header can be
  // overwritten.
  returnJSON: true,

  // No need to convert the request body to JSON with sendJSON enabled.
  body: { Wednesday: "pink" },
});
```

```js
// Gretchen comes with other options too.

const res = await gretchen("https://example.com/", {
  // Throws on HTTP error status codes.
  throwOnError: true,

  // Retries the request if the server responds with a 429 Too Many Requests
  // status code and includes a Retry-After header.
  retryOnTooManyRequests: true,

  // Sets a JSON Accept header. Useful if you want to request a JSON response
  // but still want Gretchen to return a Response.
  requestJSON: true,
});
```

```js
// Create your own Gretchen function with default options.

import { createGretchen } from "@ns84/gretchen";

const gretchen = createGretchen({
  sendJSON: true,
  returnJSON: true,
  throwOnError: true,
  retryOnTooManyRequests: true,
});

// Gretchen has all the defaults set above.
const value = await gretchen("https://example.com/", {
  body: { Wednesday: "pink" },
});

// The defaults can still be overwritten.
const res = await gretchen("https://example.com/", {
  body: { Wednesday: "pink" },
  returnJSON: false,
});

const value = await res.json();
```

```ts
// Using TypeScript? Gretchen has you covered.

// Pass in a type parameter of string[].
const res = await gretchen<string[]>("https://example.com/");

// Now Gretchen knows res.json() will return a Promise<string[]>.
const values = await res.json();

// This also works with returnJSON enabled.
const values = await gretchen<string[]>("https://example.com/", {
  returnJSON: true,
});
```

```ts
// Typing also work with createGretchen.

const gretchen = createGretchen({
  sendJSON: true,
  returnJSON: true,
  throwOnError: true,
  retryOnTooManyRequests: true,
});

// values is typed as a string[] without needing to set returnJSON.
const values = await gretchen<string[]>("https://example.com/");
```

```ts
// You can even set a default type parameter with createGretchen.
const gretchen = createGretchen<string[]>();

// No need to specify a type parameter since it defaults to string[] now.
const values = gretchen("https://example.com/");

// But you can still overwrite the type parameter if needed.
const values = gretchen<boolean[]>("https://example.com/");
```
