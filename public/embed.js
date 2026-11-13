(function () {
  "use strict";

  var script = document.currentScript;
  if (!script || !script.src) return;

  var origin;
  try {
    origin = new URL(script.src, window.location.href).origin;
  } catch {
    return;
  }

  // Values may already be percent-encoded by the snippet; decode once, then encode for the URL.
  function read(name, fallback) {
    var value = script.getAttribute("data-" + name);
    if (value === null || value === "") return fallback;
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  var slug = read("space", "");
  if (!slug) return;

  var params = [];
  var style = read("style", "");
  var dark = read("dark", "");
  var animation = read("animation", "");
  var bg = read("bg", "").replace(/^#/, "");
  if (style) params.push("style=" + encodeURIComponent(style));
  if (dark) params.push("dark=" + encodeURIComponent(dark));
  if (animation) params.push("animation=" + encodeURIComponent(animation));
  if (bg) params.push("bg=" + encodeURIComponent(bg));

  var iframe = document.createElement("iframe");
  iframe.src = origin + "/embed/" + encodeURIComponent(slug) + (params.length ? "?" + params.join("&") : "");
  iframe.title = "Testimonials";
  iframe.setAttribute("loading", "lazy");
  iframe.style.border = "0";
  iframe.style.width = "100%";
  iframe.style.display = "block";
  iframe.style.height = "300px";
  iframe.setAttribute("scrolling", "no");

  window.addEventListener("message", function (event) {
    // Only trust our own iframe, from our own origin, with the expected message shape.
    if (event.origin !== origin) return;
    if (event.source !== iframe.contentWindow) return;
    var data = event.data;
    if (!data || data.type !== "tc-embed-height") return;
    var height = Number(data.height);
    if (!isFinite(height) || height < 0 || height > 100000) return;
    iframe.style.height = Math.ceil(height) + "px";
  });

  script.parentNode.insertBefore(iframe, script.nextSibling);
})();
