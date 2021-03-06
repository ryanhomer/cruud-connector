import { CRUUDMethod } from "./types";
import { createCruudFns, verifyRequest } from "./util";

test("that createCruudFns return full suite of working function", () => {
  const METHOD_NAMES = ["create", "read", "modify", "replace", "delete"];
  const createTestFn = (method: CRUUDMethod) => () => Promise.resolve(method);
  const cruudFns = createCruudFns(createTestFn);
  expect(Object.keys(cruudFns)).toEqual(METHOD_NAMES);
  Object.keys(cruudFns).forEach((method) => {
    expect(cruudFns[method as CRUUDMethod]()).resolves.toBe(method);
  });
});

describe("verifyRequest", () => {
  it("should pass verification", () => {
    expect(
      verifyRequest({
        httpMethod: "GET",
        url: "http://localhost",
      }),
    ).toBeUndefined();
  });
  it("should throw missing URL error", () => {
    return expect(() =>
      verifyRequest({
        httpMethod: "GET",
        url: undefined,
      }),
    ).toThrow("missing");
  });
  it("should throw URL type error", () => {
    return expect(() =>
      verifyRequest({
        httpMethod: "GET",
        // @ts-ignore
        url: 23,
      }),
    ).toThrow("must be a string");
  });
  it("should throw missing httpMethod error", () => {
    return expect(() =>
      verifyRequest({
        url: "http://localhost",
      }),
    ).toThrow("missing");
  });
  it("should throw invalid httpMethod error", () => {
    return expect(() =>
      verifyRequest({
        // @ts-ignore
        httpMethod: "LIST",
        url: "http://localhost",
      }),
    ).toThrow("Invalid");
  });
});
