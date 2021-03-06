import {
  CRUUDConnectorFn,
  CRUUDFns,
  CRUUDMethod,
  CRUUDMiddleWareFn,
  CRUUDResponse,
} from "../types";
import { createCruudFns } from "../util";

const getData: (res: Partial<CRUUDResponse>) => object = (res) =>
  res.data ?? {};

/**
 * A middleware module that extracts the `data` object
 * out of the HTTP response from the network adapter.
 *
 * ```javascript
 * const connector = createConnector(...)
 * const api = connector("/movies/")
 * api.read()
 *
 * {
 *   headers: {...},
 *   data: [{ ... }, { ... }],
 *   ...
 * }
 *
 * const newConnector = connector.apply(extractData)
 * const api = newConnector("/movies/")
 * api.read()
 *
 * [
 *   { ... },
 *   { ... }
 * ]
 * ```
 */
export function extractData(next: CRUUDFns): CRUUDFns {
  const createConnFn = (methodName: CRUUDMethod): CRUUDConnectorFn => (req) =>
    next[methodName](req).then(getData);
  return createCruudFns(createConnFn);
}
