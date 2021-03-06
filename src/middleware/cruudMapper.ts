import {
  CRUUDConnectorFn,
  CRUUDFns,
  CRUUDMethod,
  CRUUDMiddleWareFn,
  CRUUDRequest,
} from "../types";
import { createCruudFns } from "../util";

type HttpMethod = "DELETE" | "GET" | "POST" | "PATCH" | "PUT";

interface CRUUDMapper {
  create?: HttpMethod;
  read?: HttpMethod;
  modify?: HttpMethod;
  replace?: HttpMethod;
  delete?: HttpMethod;
}

const defaultMap: Required<CRUUDMapper> = {
  create: "POST",
  read: "GET",
  modify: "PATCH",
  replace: "PUT",
  delete: "DELETE",
};

/**
 * Create a custom map of CRUD to HTTP methods.
 *
 * @param customMap Dictionary of mappings
 *
 * ```
 * const mappings = {
 *   create: "POST",
 *   read: "GET",
 *   update: "PUT",
 *   delete: "DELETE"
 * }
 *
 * const connector = createConnector(
 *   networkAdapter,
 *   applyMiddleware(crudMapper(mappings))
 * )
 * ```
 */
export function cruudMapper(customMap: CRUUDMapper = {}): CRUUDMiddleWareFn {
  const getRequest = (req: CRUUDRequest, key: CRUUDMethod): CRUUDRequest => {
    const map: CRUUDMapper = { ...defaultMap, ...customMap };
    return {
      ...req,
      httpMethod: map[key],
    };
  };

  return function mwMapper(next: CRUUDFns): CRUUDFns {
    const createConnFn = (methodName: CRUUDMethod): CRUUDConnectorFn => (
      req = {},
    ) => next[methodName](getRequest(req, methodName));
    return createCruudFns(createConnFn);
  };
}
