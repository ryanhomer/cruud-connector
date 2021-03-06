import {
  CRUUDConnectorFn,
  CRUUDFns,
  CRUUDMethod,
  CRUUDMiddleWareFn,
  CRUUDRequest,
} from "../types";
import { createCruudFns } from "../util";

type ParamsDict = {
  [key: string]: string | number;
};

function getParams(path: string, req: CRUUDRequest): ParamsDict {
  const keys = path.match(/:\w+/g) ?? [];

  // No URL params and no params in req header, OK
  if (!req.params && !keys?.length) return {};

  if (!req.params) {
    throw new Error(`There are no request params for URL: ${req.url}`);
  }

  if (keys.length !== req.params!.length) {
    throw new Error("Number of params in URL doesn't match request params");
  }

  // map keys to params
  return keys.reduce(
    (dict, key, index) => ({ ...dict, [key]: req.params![index] }),
    {},
  );
}

function substitute(path: string, paramsDict: ParamsDict) {
  return Object.keys(paramsDict).reduce((path: string, key: string) => {
    return path.replace(key, `${paramsDict[key]}`);
  }, path);
}

function resolvePath(path: string, req: CRUUDRequest = {}): string {
  try {
    // path is a full URL, e.g.: http://example.com/movies/:1/
    let parsed = new URL(path);
    const { pathname } = parsed;
    const params = getParams(pathname, req);
    parsed.pathname = substitute(pathname, params);
    return parsed.toString();
  } catch (e) {
    // we only have the path, e.g.: /movies/:1/
    const params = getParams(path, req);
    return substitute(path, params);
  }
}

export function url(path: string): CRUUDMiddleWareFn {
  return function (next: CRUUDFns) {
    const createConnFn = (methodName: CRUUDMethod): CRUUDConnectorFn => (req) =>
      next[methodName]!({ ...req, url: resolvePath(path, req) });
    return createCruudFns(createConnFn);
  };
}
