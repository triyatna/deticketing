import { getRequestHeader, getRequestURL, type H3Event } from "h3";

const toOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
};

export const resolveRequestBaseUrl = (event: H3Event) => {
  try {
    const requestUrl = getRequestURL(event, {
      xForwardedHost: true,
      xForwardedProto: true,
    });
    if (requestUrl?.origin) {
      return requestUrl.origin.replace(/\/$/, "");
    }
  } catch {
    // fallback to headers below
  }

  const originHeader = String(getRequestHeader(event, "origin") || "").trim();
  const refererHeader = String(getRequestHeader(event, "referer") || "").trim();

  const fromOrigin = toOrigin(originHeader);
  if (fromOrigin) return fromOrigin;

  const fromReferer = toOrigin(refererHeader);
  if (fromReferer) return fromReferer;

  return "";
};

