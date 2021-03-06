/**
 * CRUUD Connector
 */

export type CRUUDMethod = "create" | "read" | "modify" | "replace" | "delete";

type HttpMethod = "GET" | "DELETE" | "PATCH" | "POST" | "PUT";

export type CRUUDRequest = {
  headers?: { [key: string]: string };
  httpMethod?: HttpMethod;
  url?: string;

  // No need to add URL substitution params here; pass them as connector args.
  // See CRUDConnector.
  params?: any[];

  // You can also pass query parameters.
  query?: { [key: string]: any };

  // anything else we need to pass to network adapter
  [key: string]: any;
};

export type CRUUDResponse = {
  data: object;
};

export type CRUUDConnectorFn = (req?: CRUUDRequest) => Promise<any>;

export interface CRUUDFns {
  create: CRUUDConnectorFn;
  read: CRUUDConnectorFn;
  modify: CRUUDConnectorFn;
  replace: CRUUDConnectorFn;
  delete: CRUUDConnectorFn;
}

export type CRUUDMiddlewareApplicator = (cruudFns: CRUUDFns) => CRUUDConnector;

export interface CRUUDConnector extends CRUUDFns {
  /**
   * params are what you pass to connector for parameter substitution.
   *
   * ```
   * const conn = createConnector(...)
   * conn(param1, param2).read()
   * ```
   */
  (...params: any): CRUUDConnector;

  /**
   * Apply a single middleware module to an existing connector.
   *
   * To apply multiple middleware modules while building the connector,
   * use the `applyMiddleware` function instead.
   *
   * ```
   * import accessToken from "./myMiddleware"
   *
   * // base connector with no authentication
   * const baseConnector = createConnector(...)
   *
   * // new connector with authentication
   * const authConnector = baseConnector.apply(accessToken)
   * ```
   */
  apply: (mwFn: CRUUDMiddleWareFn) => CRUUDConnector;
}

export type CRUUDMiddleWareFn = (connector: CRUUDFns) => Partial<CRUUDFns>;
