import { CRUUD_METHODS } from "./constants";
import { cruudMapper } from "./middleware/cruudMapper";
import {
  CRUUDConnectorFn,
  CRUUDConnector,
  CRUUDFns,
  CRUUDMiddleWareFn,
  CRUUDRequest,
  CRUUDMethod,
  CRUUDMiddlewareApplicator,
} from "./types";
import { createCruudFns } from "./util";

type Params = (string | number)[];

const defaultMethod = (methodName: CRUUDMethod): CRUUDConnectorFn => () =>
  Promise.reject(`Method '${methodName}' not implemented!`);

const defaultConnector: CRUUDFns = createCruudFns(defaultMethod);

function stackParams(connector: CRUUDFns, params: Params): CRUUDFns {
  const appendParams = (req: CRUUDRequest): CRUUDRequest => {
    return {
      ...req,
      params: [...params, ...(req.params ?? [])],
    };
  };

  const createReqFn = (methodName: CRUUDMethod) => (req: CRUUDRequest = {}) =>
    connector[methodName](appendParams(req));

  return createCruudFns(createReqFn);
}

export function applyMiddleware(
  ...mw: CRUUDMiddleWareFn[]
): CRUUDMiddlewareApplicator {
  return function (cruudFns: CRUUDFns): CRUUDConnector {
    const mwFns = (mw ?? []).flat();
    const first = mwFns.length && mwFns[0];
    const tail = mwFns.slice(1);
    return _createConnector(
      { ...cruudFns, ...(first && first(cruudFns)) },
      tail.length ? applyMiddleware(...tail) : undefined,
    );
  };
}

function _createConnector(
  connFns: Partial<CRUUDFns>,
  mwApplyFn?: CRUUDMiddlewareApplicator,
): CRUUDConnector {
  const cruudFns = { ...defaultConnector, ...connFns };

  // apply middleware, if any
  if (mwApplyFn) return mwApplyFn(cruudFns);

  // Create a connector function and allow miscellaneous params
  // to be passed in that can later be consumed by middleware.
  function connector(...params: Params): CRUUDConnector {
    return _createConnector(stackParams(cruudFns, params));
  }

  // Allow applying middleware on existing connector
  connector.apply = (mw: CRUUDMiddleWareFn) =>
    _createConnector({ ...cruudFns, ...mw(cruudFns) });

  // Add CRUUD functions and return base connector
  CRUUD_METHODS.forEach(
    (method) => ((connector as any)[method] = cruudFns[method as CRUUDMethod]),
  );
  return connector as CRUUDConnector;
}

export function createConnector(
  connFns: Partial<CRUUDFns>,
  mwApplyFn?: CRUUDMiddlewareApplicator,
): CRUUDConnector {
  return _createConnector(connFns, mwApplyFn).apply(cruudMapper());
}
