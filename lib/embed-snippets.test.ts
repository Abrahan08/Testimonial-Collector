import { describe, expect, it } from "vitest";
import { buildEmbedUrl, buildIframeSnippet, buildScriptSnippet, escapeAttr } from "@/lib/embed-snippets";
import type { EmbedOptions } from "@/lib/validators/embed";

const opts: EmbedOptions = { style: "masonry", dark: false, animation: true, bg: "#ffffff" };

describe("buildScriptSnippet", () => {
  it("matches the PRD shape", () => {
    expect(buildScriptSnippet("https://app.example.com", "acme", opts)).toBe(
      '<script src="https://app.example.com/embed.js" data-space="acme" data-style="masonry" data-dark="false" data-animation="true" data-bg="#ffffff"></script>',
    );
  });

  it("drops trailing slashes from APP_URL", () => {
    expect(buildScriptSnippet("https://app.example.com//", "acme", opts)).toContain(
      'src="https://app.example.com/embed.js"',
    );
  });

  it("cannot be broken out of by a hostile slug or colour", () => {
    const html = buildScriptSnippet("https://a.test", 'x"><script>alert(1)</script>', {
      ...opts,
      bg: '#fff" onload="x',
    });
    expect(html).not.toContain("<script>alert");
    expect(html).not.toContain('" onload');
    expect(html.match(/<script/g)).toHaveLength(1);
  });
});

describe("buildIframeSnippet", () => {
  it("matches the PRD shape, with bg lacking the #", () => {
    expect(buildIframeSnippet("https://app.example.com", "acme", opts)).toBe(
      '<iframe src="https://app.example.com/embed/acme?style=masonry&dark=false&animation=true&bg=ffffff" width="100%" style="border:0"></iframe>',
    );
  });

  it("encodes the slug", () => {
    expect(buildEmbedUrl("https://a.test", "a b/c?d#e&f", opts)).toContain("/embed/a%20b%2Fc%3Fd%23e%26f?");
  });

  it("escapes quotes so the attribute cannot be closed early", () => {
    const html = buildIframeSnippet("https://a.test", 'a"b', opts);
    expect(html).toContain("/embed/a%22b?");
    expect(html.match(/"/g)).toHaveLength(6);
  });
});

describe("escapeAttr", () => {
  it("escapes the dangerous characters", () => {
    expect(escapeAttr(`<&"'>`)).toBe("&lt;&amp;&quot;&#39;&gt;");
  });
});
