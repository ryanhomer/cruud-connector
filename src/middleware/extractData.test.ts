import { CRUUD_METHODS } from "../constants";
import { CRUUDFns } from "../types";
import { createCruudFns } from "../util";
import { extractData } from "./extractData";

it("should extract data object from request", () => {
  const responseData = { test: true };
  const dummyReq = () => Promise.resolve({ data: responseData });
  const cruudFns = extractData(createCruudFns(() => dummyReq)) as CRUUDFns;
  CRUUD_METHODS.forEach((method) => {
    expect((cruudFns as any)[method]()).resolves.toEqual(responseData);
  });
});
