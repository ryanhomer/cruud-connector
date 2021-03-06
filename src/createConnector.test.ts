import { applyMiddleware, createConnector } from "../src/createConnector";
import { CRUUDFns, CRUUDRequest, CRUUDResponse } from "../src/types";

describe("Integration tests with createConnector", () => {
  function networkAdapter(config: any = {}): Partial<CRUUDFns> {
    function doRequest(req: CRUUDRequest = {}): Promise<CRUUDResponse> {
      return Promise.resolve({ ...req, data: {} });
    }
    return {
      read: doRequest,
    };
  }

  it("should consume parameters in the correct order", () => {
    const connector = createConnector(networkAdapter());
    const res = connector(1)(2)(3).read();
    return expect(res).resolves.toMatchObject({ params: [1, 2, 3] });
  });

  test("that default create method works", () => {
    const connector = createConnector(networkAdapter());
    return expect(connector.create()).rejects.toContain("not implemented");
  });

  test("that middleware apply function works", () => {
    const mwFn = (next: CRUUDFns): Partial<CRUUDFns> => ({
      read: (req: CRUUDRequest = {}) => {
        return next.read({ headers: { test: "test" } });
      },
    });
    const connector = createConnector(networkAdapter(), applyMiddleware(mwFn));
    return expect(connector.read()).resolves.toMatchObject({
      headers: { test: "test" },
    });
  });

  test("that applying no middleware is a noop", () => {
    const connector = createConnector(networkAdapter(), applyMiddleware());
    return expect(connector.read()).resolves.toBeTruthy();
  });
});
