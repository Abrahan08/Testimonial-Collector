"use client";

import { useEffect } from "react";

// Tells the embedding page (embed.js) how tall the widget is so it can resize the iframe.
// The message carries only a number, so the wildcard target origin leaks nothing.
export function EmbedHeightReporter() {
  useEffect(() => {
    if (window.parent === window) return;
    // Measure the widget itself: documentElement.scrollHeight never drops below the iframe's
    // current height, so the iframe could grow but never shrink.
    const target = document.querySelector<HTMLElement>(".tcw") ?? document.body;
    let last = -1;
    function post() {
      const height = Math.ceil(target.getBoundingClientRect().height);
      if (height === last) return;
      last = height;
      window.parent.postMessage({ type: "tc-embed-height", height }, "*");
    }
    post();
    const observer = new ResizeObserver(post);
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return null;
}
