import { CRUUD_METHODS, HTTP_METHODS } from "./constants";
import { CRUUDConnectorFn, CRUUDFns, CRUUDMethod, CRUUDRequest } from "./types";

type CRUUDConnectorFnCreator = (methodName: CRUUDMethod) => CRUUDConnectorFn;

/**
 * A helper function to generate CRUUD functions that are returned
 * from middleware modules or network adapters.
 *
 * See middleware and network adapter code for usage.
 *
 * @param createConnFn A factory function that accepts a CRUUD method name
 * and returns a `CRUUDConnectorFn`.
 *
 */
export function createCruudFns(
  createConnFn: CRUUDConnectorFnCreator,
): CRUUDFns {
  const crudFns = CRUUD_METHODS.reduce((conn, methodName) => {
    return {
      ...conn,
      [methodName]: createConnFn(methodName as CRUUDMethod),
    };
  }, {});
  return crudFns as CRUUDFns;
}

export function verifyRequest(req: CRUUDRequest): void {
  if (req.url) {
    const type = typeof req.url;
    if (type !== "string") {
      throw new Error("Request `url` must be a string");
    }
  } else {
    throw new Error("Request missing `url`");
  }

  if (req.httpMethod) {
    if (!HTTP_METHODS.includes(req.httpMethod)) {
      throw new Error(`Invalid request method: ${req.httpMethod}`);
    }
  } else {
    throw new Error("Request missing `httpMethod`");
  }
}
