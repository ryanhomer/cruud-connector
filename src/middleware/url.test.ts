import {
  CRUUDConnectorFn,
  CRUUDFns,
  CRUUDRequest,
  CRUUDResponse,
} from "../types";
import { createCruudFns } from "../util";
import { url } from "./url";

describe("getParams", () => {
  const dummyReq: CRUUDConnectorFn = (req?: CRUUDRequest) =>
    Promise.resolve({ data: req });

  it("should accept URL with no params", () => {
    const mwFn = url("http://example.com:8080/customers/");
    const cruudFns = mwFn(createCruudFns(() => dummyReq)) as CRUUDFns;
    return expect(cruudFns.read()).resolves.toBeTruthy();
  });
  it("should accept path with no params", () => {
    const mwFn = url("/customers/");
    const cruudFns = mwFn(createCruudFns(() => dummyReq)) as CRUUDFns;
    return expect(cruudFns.read()).resolves.toBeTruthy();
  });
  it("should replace URL param placeholds with request params", () => {
    const mwFn = url("/customers/:1/:2/");
    const cruudFns = mwFn(createCruudFns(() => dummyReq)) as CRUUDFns;
    const res: Promise<CRUUDResponse> = cruudFns.read({ params: ["vip", 234] });
    return expect(res).resolves.toMatchObject({
      data: { url: "/customers/vip/234/" },
    });
  });
  it("should throw mismatch error", () => {
    const mwFn = url("/customers/");
    const cruudFns = mwFn(createCruudFns(() => dummyReq)) as CRUUDFns;
    return expect(() => cruudFns.read({ params: ["vip", 234] })).toThrowError(
      "doesn't match",
    );
  });
  it("should throw no-params error", () => {
    const mwFn = url("/customers/:1/:2/");
    const cruudFns = mwFn(createCruudFns(() => dummyReq)) as CRUUDFns;
    const res = () => cruudFns.read();
    return expect(res).toThrowError("no request params");
  });
});
