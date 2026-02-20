import express from "express";
import { once } from "node:events";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import {
  afterAll,
  beforeAll,
  beforeEach,
  expect,
  expectTypeOf,
  suite,
  test,
} from "vitest";
import { createGretchen, gretchen } from "../src/index.js";

type FooBar = { foo: "bar" };

const FOO_BAR: FooBar = { foo: "bar" };

let app;
let server: Server;
let url: string;
let tries = 0;

beforeAll(async () => {
  app = express();
  app.use(express.json({ strict: false }));
  app.get("/", (req, res) => {
    res.json(FOO_BAR);
  });
  app.post("/", (req, res) => {
    res.json(req.body);
  });
  app.get("/error", (req, res) => {
    res.status(500).json(FOO_BAR);
  });
  app.get("/accept", (req, res) => {
    if (req.header("accept") === "application/json") {
      res.json(FOO_BAR);
    } else {
      res.status(500);
    }
  });
  app.get("/retry", (req, res) => {
    res.status(429).send();
  });
  app.get("/retry/seconds", (req, res) => {
    if (tries === 0) {
      tries += 1;
      res.status(429).header("retry-after", "1").send();
    } else {
      res.json(FOO_BAR);
    }
  });
  app.get("/retry/date", (req, res) => {
    if (tries === 0) {
      tries += 1;
      res.status(429).header("retry-after", new Date().toUTCString()).send();
    } else {
      res.json(FOO_BAR);
    }
  });
  app.get("/retry/invalid", (req, res) => {
    res.status(429).header("retry-after", "foo").send();
  });
  server = app.listen();
  await once(server, "listening");
  const port = (server.address() as AddressInfo).port;
  url = `http://127.0.0.1:${port}/`;
});

beforeEach(() => {
  tries = 0;
});

suite("gretchen", () => {
  test("Drop-in replacement for fetch", async () => {
    const res = await gretchen<FooBar>(url);
    expectTypeOf(res.json()).resolves.toEqualTypeOf(FOO_BAR);
  });

  test("Allows Request as input", async () => {
    const res = await gretchen<FooBar>(new Request(url));
    expectTypeOf(res.json()).resolves.toEqualTypeOf(FOO_BAR);
  });

  test("Returns JSON", async () => {
    const res = await gretchen<FooBar>(url, { returnJSON: true });
    expectTypeOf(res).toEqualTypeOf(FOO_BAR);
  });

  test("Sends JSON", async () => {
    const res = await gretchen<FooBar>(url, {
      sendJSON: true,
      body: FOO_BAR,
    });
    expectTypeOf(res.json()).resolves.toEqualTypeOf(FOO_BAR);
  });

  test("Does not overwrite content-type header", async () => {
    const res = await gretchen<FooBar>(url, {
      sendJSON: true,
      method: "POST",
      body: FOO_BAR,
      headers: {
        "content-type": "application/json; charset=utf-8",
      },
    });
    expectTypeOf(res.json()).resolves.toEqualTypeOf(FOO_BAR);
  });

  test("Sends and returns JSON", async () => {
    const res = await gretchen<FooBar>(url, {
      returnJSON: true,
      sendJSON: true,
      method: "POST",
      body: FOO_BAR,
    });
    expectTypeOf(res).toEqualTypeOf(FOO_BAR);
  });

  test("Throws", async () => {
    await expect(
      gretchen(`${url}error`, { throwOnError: true }),
    ).rejects.toThrow();
  });

  test("Requests JSON", async () => {
    const res = await gretchen<FooBar>(`${url}accept`, { requestJSON: true });
    expectTypeOf(res.json()).resolves.toEqualTypeOf(FOO_BAR);
  });

  test("Does not overwrite accept header", async () => {
    const res = await gretchen<FooBar>(url, {
      requestJSON: true,
      headers: {
        accept: "application/json; charset=utf-8",
      },
    });
    expectTypeOf(res.json()).resolves.toEqualTypeOf(FOO_BAR);
  });

  test("Retries with seconds", async () => {
    const res = await gretchen<FooBar>(`${url}retry/seconds`, {
      retryOnTooManyRequests: true,
    });
    expectTypeOf(res.json()).resolves.toEqualTypeOf(FOO_BAR);
  });

  test("Retries with date", async () => {
    const res = await gretchen<FooBar>(`${url}retry/date`, {
      retryOnTooManyRequests: true,
    });
    expectTypeOf(res.json()).resolves.toEqualTypeOf(FOO_BAR);
  });

  test("Does not retry without retry-after header", async () => {
    const res = await gretchen<FooBar>(`${url}retry`, {
      retryOnTooManyRequests: true,
    });
    expectTypeOf(res.status).toEqualTypeOf(429);
  });

  test("Does not retry with invalid retry-after header", async () => {
    const res = await gretchen<FooBar>(`${url}retry/invalid`, {
      retryOnTooManyRequests: true,
    });
    expectTypeOf(res.status).toEqualTypeOf(429);
  });
});

suite("createGretchen", () => {
  const gretchen = createGretchen({ sendJSON: true, returnJSON: true });

  test("Sends and returns JSON by default", async () => {
    const value = await gretchen<FooBar>(url, { body: FOO_BAR });
    expectTypeOf(value).toEqualTypeOf(FOO_BAR);
  });

  test("Can overwrite returnJSON", async () => {
    const res = await gretchen<FooBar>(url, { returnJSON: false });
    expectTypeOf(res.json()).resolves.toEqualTypeOf(FOO_BAR);
  });
});

afterAll(() => {
  server.close();
});
