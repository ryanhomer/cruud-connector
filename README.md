# CRUUD Connector

A Javascript library for a layered approach to accessing REST API endpoints.

![publish workflow status badge](https://github.com/ryanhomer/cruud-connector/workflows/publish/badge.svg?branch=master) ![codecov](https://codecov.io/gh/ryanhomer/cruud-connector/branch/master/graph/badge.svg?token=BN7T3PAMXF)

- No external package dependencies
- Total size of distribution JS files about 50K
- Fully typed with TypeScript&trade;
- Extensible with custom middleware

**Why CRUUD (and not CRUD)?**

This library emphasizes the use of both UPDATE methods, PATCH and PUT, hence the two U's. They are surfaced as `modify` and `replace` respectively. To remove ambiguity, `update` is not used at all.

**Layered**

You create a connector and your app communicates with this layer to perform CRUD operations. Requests then pass through zero or more middleware layers. The last layer is the network adapter.

Each middleware layer has a specific purpose independent of the others and allows you to add custom functionality, for example, handling authentication headers and token refreshing.

The last layer is the network layer which is specific to the network API or library you want to use. The default implementation uses `fetch`. You can create custom network adapters if you'd rather use something else such as `XMLHttpRequest` or `axios`. You may even need special adapters for certain types of requests such as handling blobs, for example.

## Usage

### Installation

```bash
npm install @techrah/cruud-connector
```

### Create a Connector

```typescript
import {
  applyMiddleware,
  createConnector,
  defaultNetworkAdapter,
  middleware,
} from "cruud-connector";

const { extractData, url } = middleware;

const baseURL = "http://api.example.com";

const connector = (urlPath: string) => {
  const networkAdapter = defaultNetworkAdapter(baseURL);
  return createConnector(
    networkAdapter,
    applyMiddleware(url(urlPath), extractData),
  );
};
```

We can now create connectors for specific paths and use them to make CRUD requests.

```typescript
const movies = connector("/movies/");
movies.read();
```

```json
[
  {
    "id": 1,
    "title": "Toy Story"
  },
  {
    "id": 2,
    "title": "Jumanji"
  }
]
```

```typescript
movies.create({ data: { title: "Star Wars" } });
```

```json
{
  "id": 3,
  "title": "Star Wars"
}
```

### Middleware

You can create custom middleware to alter the outgoing request and incoming response. For example, you could write middleware to add authentication headers on outgoing requests or transform incoming data into the shape your app needs. Here are the ones that are already available.

#### url

This helps you to build your URL using parameter substitution. For example, to send a GET request for movie with ID #4 in the form `http://api.example.com/movies/4/`,

```typescript
const movie = connector("/movies/:id/");
movie(4).read();
```

```json
{
  "id": 4,
  "title": "Waiting to Exhale"
}
```

Note: The `url` middleware module does not handle query parameters such as `/movies/?id=4&format=json`. If you need to handle query parameters, you can copy and extend the existing `url` module. However, it is easier to let a library such as `axios` handle this automatically in the network adapter. See later example.

#### extractData

This simply extracts the `data` object from the network response. If you want access to the entire response, (like access to the headers, for example) just leave this out, or create a custom data extractor to suit your specific needs.

## CRUUD mappings

Here are the CRUD methods that are available when you create a connector and what HTTP methods they invoke. Note that if your network adapter doesn't implement a specific method and you try to use it, the connector will throw an exception.

| CRUD method | HTTP method |
| ----------- | ----------- |
| create      | POST        |
| read        | GET         |
| modify      | PATCH       |
| replace     | PUT         |
| delete      | DELETE      |

## The Network Adapter

The default network adapter uses `fetch` but you can create your own network adapters and use any library you want, such as `axios`.

The only requirement is that you implement a function that returns a `CRUUDFns` (or `Partial<CRUUDFns>`) object. This object has the CRUD methods you want to implement for this adapter. Each entry returns a `CRUUDConnectorFn` of the form `(req?: CRUUDRequest) => Promise<any>`. An example of a `CRUUDFns` object that implements the `read` method is:

```js
{
  "read": (req) => Promise.resolve({ "data": {} })
}
```

Here's how you could implement an axios network adapter.

```typescript
import axios from "axios";
import {
  createCruudFns,
  CRUUDFns,
  CRUUDRequest,
  CRUUDResponse,
  verifyRequest,
} from "cruud-connector";

function createNetworkConnector(axiosConfig: object = {}): CRUUDFns {
  function doRequest(req: CRUUDRequest = {}): Promise<CRUUDResponse> {
    // Do some sanity checks.
    verifyRequest(req);

    // Return a promise.
    return axios({
      ...axiosConfig,
      url: req.url,
      method: req.httpMethod,
      headers: req.headers,
      params: req.query,
      data: req.data,
    }).catch((e) => {
      // The response may have useful data from the server that you need
      // to act upon but feel free to throw anything you want.
      throw e.response;
    });
  }

  // Create CRUUD functions that do the requests.
  // Here, they all all identical since axios handles the actual HTTP method
  // which is specified in the request header.
  //
  // The method name is available in case you need to call different
  // request function based on this. Here, we ignore it.
  // If you don't need it, feel free to just use `() => ...` instead.
  return createCruudFns((methodName: string) => doRequest);
}
```

The `createCruudFns` function simplifies creating the `CRUUDFns` object. Essentially, for the example given above, it's replacing this:

```typescript
return {
  create: doRequest,
  read: doRequest,
  modify: doRequest,
  replace: doRequest,
  delete: doRequest,
};
```

### Query Parameters

Query parameters are not handled in the `url` module, though you could write a custom module that does.

You may instead choose to pass query parameters into the network adapter since the network library it wraps can usually deal with this already. Notice the line `params: req.query` in the axios adapter that converts an array of query parameters that was passed in the request.

Using the axios adapter, we can now do a GET request and pass in some parameters.

```typescript
const userApi = connector("/users/");
userApi.read({ query: { page: 2, pagesize: 20 } });
```

This would perform a `GET` request to: `http://api.example.com/users/?page=2&pagesize=20`.

## Custom Middleware

A middleware module is a function with the following signature:

```
function (next: CRUUDFns): CRUUDFns
```

The framework will pass you `next` which are the CRUD functions in the next layer. You must call all of these functions to keep the chain intact.

Suppose you want to implement a middleware layer that adds an authentication token, here's a trivial implementation.

```typescript
import {
  createCruudFns,
  CRUUDConnectorFn,
  CRUUDFns,
  CRUUDMethod,
  CRUUDMiddleWareFn,
  CRUUDRequest,
} from "cruud-connector";

/**
 * Adds access token to request headers
 */
const withAccessToken = (req: CRUUDRequest = {}) => {
  // Your custom logic to get the auth token goes here
  const authToken = "a63b-22f9136-004c";

  // Return modified headers that include the auth header.
  return {
    ...req,
    headers: {
      ...req.headers,
      Authorization: `Bearer ${authToken}`,
    },
  };
};

/**
 * Middleware entry point
 */
export default function mwAccessToken(next: CRUUDFns): CRUUDFns {
  // Return object with supported CRUD functions.
  // Each entry accepts a `CRUUDRequest` object, modifies it,
  // and then inserts it back into the stream via `next`.
  return {
    create: (req: CRUUDRequest) => next.create(withAccessToken(req)),
    read: (req: CRUUDRequest) => next.read(withAccessToken(req)),
    // etc.
    // etc.
    // etc.
  };
}
```

Alternatively, you can use the `createCruudFns` helper function to generate the `CRUUDFns` object.

```typescript
export default function mwAccessToken(next: CRUUDFns): CRUUDFns {
  // This function is a factory function which supplies the method name
  const createConnFn = (methodName: CRUUDMethod):
    // Note the similarity to the functions we generated above
    => (req: CRUUDRequest = {})
      // We create the CRUD function using `next[methodName]`
      => next[methodName](withAccessToken(req));

  // The factory function can then be used
  // with `createCruudFns` to generate all the CRUD functions.
  return createCruudFns(createConnFn);
}
```

---

### Accreditation

This library was inspired by the project @crudlio/crudl-connectors-base which is no longer available for general public consumption. It has therefore been completely re-written from the ground up. Note that there are some differences in usage.
