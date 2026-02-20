export interface GretchenRequestInit extends RequestInit {
  /**
   * The body of the request. If `sendJSON` is `true`, then `body` will be
   * converted to JSON. */
  body?: any;
  /**
   * Whether to set the `Accept` HTTP header to `application/json`.
   */
  requestJSON?: boolean;
  /**
   * Whether to continually try the request if the server responds with a 429
   * Too Many Requests HTTP status and includes a `Retry-After` header.
   */
  retryOnTooManyRequests?: boolean;
  /**
   * Whether to return a Promise that resolves to the body of the response
   * parsed as JSON instead of returning a Promise that resolves to the response
   * itself.
   */
  returnJSON?: boolean;
  /**
   * Whether to set the `Content-Type` HTTP header to `application/json` and
   * convert `body` to JSON.
   */
  sendJSON?: boolean;
  /**
   * Whether to throw an `HTTPError` when the server responds with an
   * unsuccessful HTTP status code.
   */
  throwOnError?: boolean;
}

/**
 * A response from a gretchen request.
 * @template T The type of the body when parsed as JSON.
 */
export interface GretchenResponse<T = unknown> extends Response {
  /**
   * Returns a Promise that resolves to the body parsed as JSON.
   * @template T The type of the body when parsed as JSON.
   */
  json(): Promise<T>;
}

/**
 * Represents an HTTP error response.
 */
export class HTTPError extends Error {
  /**
   * The `Response` object returned from the fetch request.
   */
  response: Response;

  /**
   * Creates a new instance of an error.
   * @param message The HTTP status code and status text.
   * @param response The `Response` object returned from the fetch request.
   */
  constructor(message: string, response: Response) {
    super(message);
    this.name = "HTTPError";
    this.response = response;
  }
}

/**
 * Performs an HTTP request and returns a Promise that resolves to the response.
 * @template T The type of the response body when parsed as JSON.
 * @param input The URL of resource to fetch or an existing request.
 * @returns A Promise that resolves to the response.
 */
export async function gretchen<T = unknown>(
  input: string | URL | Request,
): Promise<GretchenResponse<T>>;
/**
 * Performs an HTTP request and returns a Promise that resolves to the response
 * body parsed as JSON.
 * @template T The type of the response body when parsed as JSON.
 * @param input The URL of resource to fetch or an existing request.
 * @param init An object containing settings to apply to the request.
 * @returns A Promise that resolves to the response body parsed as JSON.
 */
export async function gretchen<T = unknown>(
  input: string | URL | Request,
  init: GretchenRequestInit & { returnJSON: true },
): Promise<T>;
/**
 * Performs an HTTP request and returns a Promise that resolves to the response.
 * @template T The type of the response body when parsed as JSON.
 * @param input The URL of resource to fetch or an existing request.
 * @param init An object containing settings to apply to the request.
 * @returns A Promise that resolves to the response.
 */
export async function gretchen<T = unknown>(
  input: string | URL | Request,
  init: GretchenRequestInit & { returnJSON?: false },
): Promise<GretchenResponse<T>>;
/**
 * Performs an HTTP request and returns a Promise that resolves to either the
 * response or the response body parsed as JSON.
 * @template T The type of the response body when parsed as JSON.
 * @param input The URL of resource to fetch or an existing request.
 * @param init An object containing settings to apply to the request.
 * @returns A Promise that resolves to either the response or the response body
 * parsed as JSON.
 */
export async function gretchen<T = unknown>(
  input: string | URL | Request,
  init: GretchenRequestInit,
): Promise<T | GretchenResponse<T>>;
export async function gretchen<T = unknown>(
  input: string | URL | Request,
  gretchenInit: GretchenRequestInit = {},
) {
  const {
    body,
    requestJSON,
    retryOnTooManyRequests,
    returnJSON,
    sendJSON,
    throwOnError,
    ...rest
  } = {
    ...gretchenInit,
  };
  const init: RequestInit = rest;
  if (!(input instanceof Request)) {
    if (requestJSON || returnJSON) {
      init.headers = new Headers(init.headers);
      if (init.headers.get("accept") == null) {
        init.headers.set("accept", "application/json");
      }
    }
    if (sendJSON && body !== undefined) {
      if (init.method == null) {
        init.method = "POST";
      }
      init.headers = new Headers(init.headers);
      if (init.headers.get("content-type") == null) {
        init.headers.set("content-type", "application/json");
      }
      init.body = JSON.stringify(body);
    } else {
      init.body = body;
    }
  }
  for (;;) {
    const nowEpoch = Date.now();
    const response = await fetch(input, init);
    if (retryOnTooManyRequests && response.status === 429) {
      const retryAfter = response.headers.get("retry-after");
      if (retryAfter != null) {
        if (retryAfter.match(/^\d+$/)) {
          const retryAfterSeconds = Number(retryAfter);
          const delay = retryAfterSeconds * 1000;
          await new Promise((resolve) => {
            setTimeout(resolve, delay);
          });
          continue;
        } else {
          const retryAfterEpoch = Number(new Date(retryAfter));
          if (!isNaN(retryAfterEpoch)) {
            const delay = Math.max(0, retryAfterEpoch - nowEpoch);
            await new Promise((resolve) => {
              setTimeout(resolve, delay);
            });
            continue;
          }
        }
      }
    }
    if (throwOnError && !response.ok) {
      throw new HTTPError(
        `${response.status} ${response.statusText}`,
        response,
      );
    }
    return returnJSON
      ? (response.json() as Promise<T>)
      : (response as GretchenResponse<T>);
  }
}

/**
 * Performs an HTTP request and returns a Promise that resolves to either the
 * response or the response body parsed as JSON.
 * @template TDefault The default type of the response body when parsed as JSON.
 * @param input The URL of resource to fetch or an existing request.
 * @param init An object containing settings to apply to the request.
 * @returns A Promise that resolves to either the response or the response body
 * parsed as JSON.
 */
export interface GretchenFunction<TDefault = unknown> {
  /**
   * Performs an HTTP request and returns a Promise that resolves to the response.
   * @template T The type of the response body when parsed as JSON.
   * @param input The URL of resource to fetch or an existing request.
   * @returns A Promise that resolves to the response.
   */
  <T = TDefault>(input: string | URL | Request): Promise<GretchenResponse<T>>;
  /**
   * Performs an HTTP request and returns a Promise that resolves to the response
   * body parsed as JSON.
   * @template T The type of the response body when parsed as JSON.
   * @param input The URL of resource to fetch or an existing request.
   * @param init An object containing settings to apply to the request.
   * @returns A Promise that resolves to the response body parsed as JSON.
   */
  <T = TDefault>(
    input: string | URL | Request,
    init: GretchenRequestInit & { returnJSON: true },
  ): Promise<T>;
  /**
   * Performs an HTTP request and returns a Promise that resolves to the response.
   * @template T The type of the response body when parsed as JSON.
   * @param input The URL of resource to fetch or an existing request.
   * @param init An object containing settings to apply to the request.
   * @returns A Promise that resolves to the response.
   */
  <T = TDefault>(
    input: string | URL | Request,
    init?: GretchenRequestInit & { returnJSON?: false },
  ): Promise<GretchenResponse<T>>;
  /**
   * Performs an HTTP request and returns a Promise that resolves to either the
   * response or the response body parsed as JSON.
   * @template T The type of the response body when parsed as JSON.
   * @param input The URL of resource to fetch or an existing request.
   * @param init An object containing settings to apply to the request.
   * @returns A Promise that resolves to either the response or the response body
   * parsed as JSON.
   */
  <T = TDefault>(
    input: string | URL | Request,
    init: GretchenRequestInit,
  ): Promise<T | GretchenResponse<T>>;
}

/**
 * Performs an HTTP request and returns a Promise that resolves to either the
 * response or the response body parsed as JSON.
 * @template TDefault The default type of the response body when parsed as JSON.
 * @param input The URL of resource to fetch or an existing request.
 * @param init An object containing settings to apply to the request.
 * @returns A Promise that resolves to either the response or the response body
 * parsed as JSON.
 */
export interface GretchenFunctionWithReturnJSON<TDefault = unknown> {
  /**
   * Performs an HTTP request and returns a Promise that resolves to the response
   * body parsed as JSON.
   * @template T The type of the response body when parsed as JSON.
   * @param input The URL of resource to fetch or an existing request.
   * @returns A Promise that resolves to the response body parsed as JSON.
   */
  <T = TDefault>(input: string | URL | Request): Promise<T>;
  /**
   * Performs an HTTP request and returns a Promise that resolves to the response.
   * @template T The type of the response body when parsed as JSON.
   * @param input The URL of resource to fetch or an existing request.
   * @param init An object containing settings to apply to the request.
   * @returns A Promise that resolves to the response.
   */
  <T = TDefault>(
    input: string | URL | Request,
    init: GretchenRequestInit & { returnJSON: false },
  ): Promise<GretchenResponse<T>>;
  /**
   * Performs an HTTP request and returns a Promise that resolves to the response
   * body parsed as JSON.
   * @template T The type of the response body when parsed as JSON.
   * @param input The URL of resource to fetch or an existing request.
   * @param init An object containing settings to apply to the request.
   * @returns A Promise that resolves to the response body parsed as JSON.
   */
  <T = TDefault>(
    input: string | URL | Request,
    init?: GretchenRequestInit & { returnJSON?: true },
  ): Promise<T>;
  /**
   * Performs an HTTP request and returns a Promise that resolves to either the
   * response or the response body parsed as JSON.
   * @template T The type of the response body when parsed as JSON.
   * @param input The URL of resource to fetch or an existing request.
   * @param init An object containing settings to apply to the request.
   * @returns A Promise that resolves to either the response or the response body
   * parsed as JSON.
   */
  <T = TDefault>(
    input: string | URL | Request,
    init: GretchenRequestInit,
  ): Promise<T | GretchenResponse<T>>;
}

/**
 * Creates an instance of `gretchen` with default options.
 * @template T The default type of the response body when parsed as JSON.
 * @param init The default options to apply to the instance of `gretchen`.
 * @returns An instance of `gretchen` with the default options.
 */
export function createGretchen<T = unknown>(
  init: GretchenRequestInit & { returnJSON: true },
): GretchenFunctionWithReturnJSON<T>;
/**
 * Creates an instance of `gretchen` with default options.
 * @template T The default type of the response body when parsed as JSON.
 * @param init The default options to apply to the instance of `gretchen`.
 * @returns An instance of `gretchen` with the default options.
 */
export function createGretchen<T = unknown>(
  init?: GretchenRequestInit & { returnJSON?: false },
): GretchenFunction<T>;
/**
 * Creates an instance of `gretchen` with default options.
 * @template T The default type of the response body when parsed as JSON.
 * @param init The default options to apply to the instance of `gretchen`.
 * @returns An instance of `gretchen` with the default options.
 */
export function createGretchen<T = unknown>(
  init: GretchenRequestInit,
): GretchenFunction<T> | GretchenFunctionWithReturnJSON<T>;
export function createGretchen<TDefault = unknown>(init?: GretchenRequestInit) {
  const initDefaults = init;
  return <T = TDefault>(
    input: string | URL | Request,
    init?: GretchenRequestInit,
  ) => gretchen<T>(input, { ...initDefaults, ...init });
}
