import http from "node:http";
import https from "node:https";
import { Readable } from "node:stream";

const originalHttpRequest = http.request;
const originalHttpsRequest = https.request;

let mocks = [];
export let capturedRequests = [];

function buildUrl(options, moduleName) {
  if (typeof options === "string") return options;
  const protocol =
    options.protocol || (moduleName === "http" ? "http:" : "https:");
  const host = options.hostname || options.host || "localhost";
  const port = options.port ? ":" + options.port : "";
  return `${protocol}//${host}${port}${options.path || "/"}`;
}

function createMockReq() {
  const req = new Readable({ read() {} });
  req.end = () => {};
  req.on = () => req;
  req.write = () => {};
  req.destroy = () => {};
  return req;
}

export function mockHttp() {
  mocks = [];
  capturedRequests = [];

  http.request = function (options, callback) {
    const url = buildUrl(options, "http");
    const match = mocks.find((m) => url.includes(m.pattern));
    if (match) {
      capturedRequests.push({
        method: (options.method || "GET").toUpperCase(),
        url,
      });
      const stream = new Readable({ read() {} });
      stream.statusCode = match.status;
      stream.headers = { "content-type": "application/json" };
      if (callback) callback(stream);
      process.nextTick(() => {
        if (match.data !== undefined) stream.push(JSON.stringify(match.data));
        stream.push(null);
      });
      return createMockReq();
    }
    return originalHttpRequest.call(this, options, callback);
  };

  https.request = function (options, callback) {
    const url = buildUrl(options, "https");
    const match = mocks.find((m) => url.includes(m.pattern));
    if (match) {
      capturedRequests.push({
        method: (options.method || "GET").toUpperCase(),
        url,
      });
      const stream = new Readable({ read() {} });
      stream.statusCode = match.status;
      stream.headers = { "content-type": "application/json" };
      if (callback) callback(stream);
      process.nextTick(() => {
        if (match.data !== undefined) stream.push(JSON.stringify(match.data));
        stream.push(null);
      });
      return createMockReq();
    }
    return originalHttpsRequest.call(this, options, callback);
  };
}

export function addMock(pattern, status, data) {
  mocks.push({ pattern, status, data });
}

export function clearMocks() {
  mocks = [];
  capturedRequests = [];
}

export function restoreHttp() {
  http.request = originalHttpRequest;
  https.request = originalHttpsRequest;
  mocks = [];
  capturedRequests = [];
}
