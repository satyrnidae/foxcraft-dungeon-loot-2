// Runs every test instance headless against a fresh build. Steps: mcb build, generate the gametest pack, assemble a packs folder next to
// the server jar, run net.minecraft.gametest.Main, print each result, exit with the number of failures.
// Environment: GAMETEST_SERVER, a folder holding server.jar, default .gametest/server, see gametest/fetch-server.js.
//              GAMETEST_JAVA, a Java 25 executable or JDK folder, else JAVA25, JDK_HOME or JAVA_HOME from the repo .env, else java on the path.
//              GAMETEST_TESTS, a test filter, default fdl_test:*.
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { generate } = require("./generate.js");

const root = path.resolve(__dirname, "..");
// KEY=value lines of the gitignored .env in the repo root, a variable already set in the environment wins
function loadDotEnv() {
	const file = path.join(root, ".env");
	if (!fs.existsSync(file)) return;
	for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
		const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
		if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
	}
}
loadDotEnv();

function javaMajor(exe) {
	const r = spawnSync(exe, ["-version"], { encoding: "utf8" });
	const m = /version "(\d+)/.exec(`${r.stderr || ""}${r.stdout || ""}`);
	return m ? Number(m[1]) : 0;
}
// GAMETEST_JAVA, an executable or a JDK folder, then JAVA25, JDK_HOME and JAVA_HOME as the repo .env sets them for tests/run_all.mjs, then java on the path
function findJava() {
	const exe = process.platform === "win32" ? "java.exe" : "java";
	for (const name of ["GAMETEST_JAVA", "JAVA25", "JDK_HOME", "JAVA_HOME"]) {
		const v = process.env[name];
		if (!v) continue;
		const candidate = fs.existsSync(path.join(v, "bin", exe)) ? path.join(v, "bin", exe) : v;
		if (fs.existsSync(candidate) && javaMajor(candidate) >= 25) return candidate;
	}
	// The JDKs of the IDE, newest first, as tests/run_all.mjs does. JDK_HOME and JAVA_HOME in the environment are often an older Java
	const jdks = path.join(require("node:os").homedir(), ".jdks");
	if (fs.existsSync(jdks)) {
		const found = fs.readdirSync(jdks).sort().reverse().map((d) => path.join(jdks, d, "bin", exe)).filter((p) => fs.existsSync(p) && javaMajor(p) >= 25);
		if (found.length) return found[0];
	}
	if (javaMajor("java") >= 25) return "java";
	console.error("needs Java 25, set GAMETEST_JAVA");
	process.exit(-1);
}

const server = path.resolve(process.env.GAMETEST_SERVER || path.join(root, ".gametest", "server"));

const java = findJava();
const filter = process.env.GAMETEST_TESTS || "fdl_test:*";

function run(cmd, args, cwd) {
	const r = spawnSync(cmd, args, { cwd, stdio: "inherit" });
	if (r.error) throw r.error;
	return r.status;
}

if (!fs.existsSync(path.join(server, "server.jar"))) {
	console.error(`no server.jar in ${server}, run node gametest/fetch-server.js or set GAMETEST_SERVER`);
	process.exit(-1);
}
// mcb exits 0 on a compile error and keeps the last good output, so the build output is read for it, a stale pack would pass or fail for the wrong reasons
function build(cwd) {
	const b = spawnSync(process.execPath, [path.join(root, "node_modules", "mc-build", "dist", "mcb.js"), "build"], { cwd, encoding: "utf8" });
	process.stdout.write(b.stdout || "");
	process.stderr.write(b.stderr || "");
	if (b.status !== 0 || /(Compiler|Parser|Syntax) ?Error/i.test(`${b.stdout}${b.stderr}`)) {
		console.error(`build failed in ${cwd}, not running tests`);
		process.exit(-1);
	}
}
// Two projects, the pack itself and the test functions in gametest/mc. The test namespace never builds into the pack's data folder, a zip of
// that folder is the release. A leftover fdl_test there, from before the split or a stray build, fails the run
if (fs.existsSync(path.join(root, "data", "fdl_test"))) {
	console.error("data/fdl_test exists, the test namespace must not be built into the pack, delete it");
	process.exit(-1);
}
build(root);
build(path.join(root, "gametest", "mc"));
const gametestPack = generate(root);

const packs = path.join(server, "packs");
fs.rmSync(packs, { recursive: true, force: true });
fs.mkdirSync(path.join(packs, "foxcraft_dungeon_loot"), { recursive: true });
fs.copyFileSync(path.join(root, "pack.mcmeta"), path.join(packs, "foxcraft_dungeon_loot", "pack.mcmeta"));
fs.cpSync(path.join(root, "data"), path.join(packs, "foxcraft_dungeon_loot", "data"), { recursive: true });
fs.cpSync(gametestPack, path.join(packs, "gametest"), { recursive: true });

const report = path.join(server, "report.xml");
fs.rmSync(report, { force: true });
const result = spawnSync(java, ["-DbundlerMainClass=net.minecraft.gametest.Main", "-jar", "server.jar", "--packs", "./packs", "--universe", "./uni", "--report", "./report.xml", "--tests", filter], { cwd: server, encoding: "utf8", maxBuffer: 256 * 1024 * 1024 });
if (result.error) throw result.error;
const status = result.status;
const serverLog = `${result.stdout || ""}${result.stderr || ""}`;
fs.writeFileSync(path.join(server, "run.log"), serverLog);
// The log lines the tests write with say, the dump of a failing step and the PASS and FAIL of each step, plus anything the server complains about
for (const line of serverLog.split("\n")) if (/\bgt (dump|FAIL|PASS|shape)\b/.test(line)) console.log(line.replace(/^\[[^\]]*\] \[[^\]]*\]: (\[[^\]]*\] )*/, "  "));
// A function that fails to parse only warns and the rest of the pack carries on, so it fails the run here, a test calling it would otherwise do nothing
const loadErrors = [...serverLog.matchAll(/Failed to load function (\S+)/g)].map((m) => m[1]);
for (const name of new Set(loadErrors)) console.error(`FAIL function did not load: ${name}`);
if (/Registry loading errors/.test(serverLog)) console.error("FAIL registry loading errors, see run.log");

if (!fs.existsSync(report)) { console.error(`no report written, exit ${status}`); process.exit(status === 0 ? -1 : status); }
const xml = fs.readFileSync(report, "utf8");
const cases = [...xml.matchAll(/<testcase [^>]*name="([^"]+)"[^>]*?(?:\/>|>([\s\S]*?)<\/testcase>)/g)];
let failures = 0;
for (const [, name, body] of cases) {
	const failure = body && body.match(/<failure message="([^"]*)"/);
	if (failure) failures += 1;
	console.log(`${failure ? "FAIL" : "PASS"} ${name}${failure ? `  ${failure[1]}` : ""}`);
}
console.log(`${cases.length - failures}/${cases.length} passed`);
const broken = new Set(loadErrors).size + (/Registry loading errors/.test(serverLog) ? 1 : 0);
process.exit(failures + broken || (status === 0 ? 0 : status));
