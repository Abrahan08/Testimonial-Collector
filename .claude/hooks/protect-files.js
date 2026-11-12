#!/usr/bin/env node
// PreToolUse hook: blocks Edit/Write and shell commands that touch .env files
// (except .env.example) or prisma/migrations/.
let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (c) => (raw += c));
process.stdin.on("end", () => {
  let input;
  try {
    input = JSON.parse(raw).tool_input || {};
  } catch {
    process.exit(0);
  }

  const norm = (s) => s.split(String.fromCharCode(92)).join("/");
  const isProtectedBase = (base) =>
    (base === ".env" || base.startsWith(".env.")) && base !== ".env.example";
  const isMigrations = (p) => /(^|[\s"'\/])prisma\/migrations\//.test(p);

  // File-based tools (Edit, Write, MultiEdit, NotebookEdit).
  const filePath = input.file_path || input.notebook_path;
  if (typeof filePath === "string" && filePath) {
    const p = norm(filePath);
    if (isProtectedBase(p.split("/").pop())) {
      process.stderr.write(`Blocked: ${p.split("/").pop()} is protected; edit .env files manually.\n`);
      process.exit(2);
    }
    if (isMigrations(p)) {
      process.stderr.write("Blocked: prisma/migrations/ is protected; create a new migration instead.\n");
      process.exit(2);
    }
  }

  // Shell tools (Bash, PowerShell): conservative scan of the command text.
  if (typeof input.command === "string") {
    const cmd = norm(input.command);
    const envRef = /(^|[\s"'=\/])\.env(\.[A-Za-z0-9_-]+)?(?=$|[\s"'`;|&)])/g;
    for (const m of cmd.matchAll(envRef)) {
      if (m[0].trim().replace(/^["'=\/]/, "") !== ".env.example") {
        process.stderr.write("Blocked: shell commands touching .env files are not allowed; edit them manually.\n");
        process.exit(2);
      }
    }
    if (isMigrations(cmd) && !/prisma migrate/.test(cmd)) {
      process.stderr.write("Blocked: prisma/migrations/ is protected; create a new migration instead.\n");
      process.exit(2);
    }
  }
  process.exit(0);
});
