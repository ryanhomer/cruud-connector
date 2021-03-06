import { CRUUDFns, CRUUDRequest, CRUUDResponse } from "../types";
import { createCruudFns, verifyRequest } from "../util";

const addDataToResponse = (res: Response): Promise<CRUUDResponse> =>
  new Promise<CRUUDResponse>(async (resolve) => {
    const text = await res.text();
    const data = text && JSON.parse(text);
    resolve({ ...res, data });
  });

type FetchConfig = {
  baseURL: string;
  headers?: {
    [key: string]: string;
  };
};

/**
 * A network adapter that uses `fetch` for network requests.
 *
 * @param config Configuration parameters: baseURL and headers.
 *
 * ```javascript
 * import { createConnector, defaultNetworkAdapter }
 *
 * const baseURL = "http://api.example.com"
 * const networkAdapter = defaultNetworkAdapter({ baseURL })
 * const connector = createConnector(networkAdapter)
 * connector("/movies/").read()
 * ```
 */
export function defaultNetworkAdapter(config: FetchConfig): CRUUDFns {
  function doRequest(req: CRUUDRequest = {}): Promise<CRUUDResponse> {
    verifyRequest(req);

    const url = new URL((config.baseURL ?? "") + req.url);
    url.search = new URLSearchParams(req.query).toString();

    const defaultHeaders = {
      Accept: "application/json",
      "Content-Type": "application/json; charset=UTF-8",
    };

    return fetch(url.toString(), {
      method: req.httpMethod,
      headers: {
        ...defaultHeaders,
        ...config.headers,
        ...req.headers,
      },
      body: req.data && JSON.stringify(req.data),
    }).then(addDataToResponse);
  }

  return createCruudFns(() => doRequest);
}
