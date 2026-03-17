/**
 * MaintainAI Frontend Logger
 * Add to your site: <script src="https://your-app.com/maintainai-logger.js" data-client-id="YOUR_CLIENT_SLUG_OR_UUID"></script>
 * Captures: console errors, unhandled rejections, 404s, slow responses (fetch).
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;

  var src = script.getAttribute("src");
  var clientId = (script.getAttribute("data-client-id") || "").trim();
  if (!clientId) return;

  var baseUrl = src ? new URL(src, location.href).origin : location.origin;
  var endpoint = baseUrl + "/api/webhook/logs";
  var SLOW_MS = 3000;

  function send(level, heading, message, metadata) {
    try {
      var payload = {
        type: "ui_log",
        clientId: clientId,
        message: "[" + heading + "] " + message,
        level: level,
        source: location.href,
        metadata: (function () {
          var base = metadata || {};
          base.heading = heading;
          return base;
        })(),
      };
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(function () {});
    } catch (e) {}
  }

  function safeStringify(v) {
    try {
      if (typeof v === "string") return v;
      if (v instanceof Error) return v.message || String(v);
      return JSON.stringify(v);
    } catch (e) {
      try {
        return String(v);
      } catch (e2) {
        return "[unserializable]";
      }
    }
  }

  function joinConsoleArgs(args) {
    try {
      return Array.prototype.slice
        .call(args)
        .map(safeStringify)
        .join(" ");
    } catch (e) {
      return "Console event";
    }
  }

  // Capture console.error / console.warn calls
  try {
    var origConsoleError = console.error;
    console.error = function () {
      send("error", "Console Error", joinConsoleArgs(arguments), {
        kind: "console.error",
        userAgent: navigator.userAgent,
      });
      return origConsoleError.apply(console, arguments);
    };

    var origConsoleWarn = console.warn;
    console.warn = function () {
      send("warning", "Console Warning", joinConsoleArgs(arguments), {
        kind: "console.warn",
        userAgent: navigator.userAgent,
      });
      return origConsoleWarn.apply(console, arguments);
    };
  } catch (e) {}

  // Runtime errors
  window.onerror = function (msg, url, line, col, error) {
    send("error", "Runtime Error", msg || "Unknown error", {
      filename: url,
      lineno: line,
      colno: col,
      stack: error && error.stack,
      userAgent: navigator.userAgent,
      kind: "window.onerror",
    });
    return false;
  };

  // Unhandled promise rejections
  window.addEventListener("unhandledrejection", function (e) {
    var reason = e.reason;
    var msg =
      (reason && (reason.message || String(reason))) || "Unhandled rejection";
    var stack = reason && reason.stack;
    send("error", "Unhandled Rejection", msg, {
      stack: stack,
      userAgent: navigator.userAgent,
      kind: "unhandledrejection",
    });
  });

  // Fetch: 404 and slow responses
  var origFetch = window.fetch;
  window.fetch = function () {
    var start = Date.now();
    var args = arguments;
    var input = args[0];
    var url =
      typeof input === "string"
        ? input
        : input && input.url
          ? input.url
          : "";
    return origFetch.apply(this, args).then(
      function (res) {
        var duration = Date.now() - start;
        if (res.status === 404) {
          send("error", "Fetch 404", "404: " + res.url, {
            url: res.url,
            statusCode: 404,
            responseTime: duration,
            userAgent: navigator.userAgent,
            kind: "fetch",
          });
        } else if (duration > SLOW_MS) {
          send("warning", "Fetch Slow", "Slow response: " + res.url, {
            url: res.url,
            statusCode: res.status,
            responseTime: duration,
            userAgent: navigator.userAgent,
            kind: "fetch",
          });
        }
        return res;
      },
      function (err) {
        var duration = Date.now() - start;
        send("error", "Fetch Failed", "Network request failed: " + url, {
          url: url,
          responseTime: duration,
          userAgent: navigator.userAgent,
          kind: "fetch",
        });
        throw err;
      }
    );
  };
})();
