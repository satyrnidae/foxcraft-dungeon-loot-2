#!/usr/bin/env python3
"""Run every check in tests/ and print a summary.

    python tests/run_all.py                run the build, the unit tests and, when a client jar is found, the Java checks
    python tests/run_all.py --no-build     skip npx mcb build and reuse the current data/.../function output
    python tests/run_all.py --no-java      skip the checks that need the 26.3 client jar and Java 25
    python tests/run_all.py --release      also run the release checks, such as mc.dev being false
    python tests/run_all.py -k chainsaw    pass a filter to the unit tests

Exit status is 1 when any step fails. A step that cannot run, such as the Java checks without a jar, is reported as
SKIPPED and does not fail the run.

Java checks need the client jar. The default is %APPDATA%/.minecraft/versions/26.3/26.3.jar, override it with MC_JAR.
Set JAVA25 to a Java 25 executable, otherwise the newest JDK found under ~/.jdks or on PATH is used.
Library jars are downloaded once into tests/.cache, which is gitignored.
"""
import argparse
import os
import platform
import shutil
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TESTS = ROOT / "tests"
CACHE = TESTS / ".cache"
MC_VERSION = "26.3"
IS_WINDOWS = platform.system() == "Windows"


def say(text=""):
    print(text, flush=True)


def run(cmd, cwd=None, env=None):
    return subprocess.run(cmd, cwd=cwd, env=env).returncode


def build():
    """Clean the generated functions, then compile src/ with mc-build."""
    shutil.rmtree(ROOT / "data" / "foxcraft_dungeon_loot" / "function", ignore_errors=True)
    for name in ("load.json", "tick.json"):
        target = ROOT / "data" / "minecraft" / "tags" / "function" / name
        if target.exists():
            target.unlink()
    npx = shutil.which("npx") or shutil.which("npx.cmd")
    if not npx:
        return None, "npx not found"
    return run([npx, "mcb", "build"], cwd=ROOT), ""


def unit_tests(extra):
    cmd = [sys.executable, "-m", "unittest", "discover", "-s", str(TESTS / "unit"), "-t", str(TESTS / "unit")]
    cmd += extra
    return run(cmd, cwd=ROOT)


def find_java():
    env = os.environ.get("JAVA25")
    if env and Path(env).exists():
        return Path(env)
    exe = "java.exe" if IS_WINDOWS else "java"
    candidates = sorted((Path.home() / ".jdks").glob("*/bin/" + exe), reverse=True)
    for candidate in candidates:
        if "25" in candidate.parent.parent.name:
            return candidate
    which = shutil.which("java")
    if which and java_major(Path(which)) == 25:
        return Path(which)
    return None


def java_major(java):
    out = subprocess.run([str(java), "-version"], capture_output=True, text=True).stderr
    try:
        return int(out.split('"')[1].split(".")[0])
    except (IndexError, ValueError):
        return 0


def find_jar():
    env = os.environ.get("MC_JAR")
    if env:
        return Path(env)
    appdata = os.environ.get("APPDATA")
    base = Path(appdata) / ".minecraft" if appdata else Path.home() / ".minecraft"
    return base / "versions" / MC_VERSION / (MC_VERSION + ".jar")


def java_checks():
    """Returns a list of (name, status) where status is PASS, FAIL or SKIPPED."""
    java = find_java()
    jar = find_jar()
    if not java:
        return [("java checks", "SKIPPED no Java 25 found, set JAVA25")]
    if not jar.exists():
        return [("java checks", "SKIPPED no client jar at %s, set MC_JAR" % jar)]
    version_json = jar.with_suffix(".json")
    if not version_json.exists():
        return [("java checks", "SKIPPED no version json next to the jar")]
    javac = java.with_name("javac.exe" if IS_WINDOWS else "javac")
    libs = CACHE / "libs"
    classes = CACHE / "classes"
    classes.mkdir(parents=True, exist_ok=True)
    fetched = subprocess.run([sys.executable, str(TESTS / "tools" / "fetch_mc_libs.py"), "--version-json", str(version_json), "--out", str(libs)],
                             capture_output=True, text=True)
    if fetched.returncode != 0:
        return [("java checks", "SKIPPED could not fetch libraries: " + fetched.stderr.strip().splitlines()[-1])]
    classpath = os.pathsep.join([str(jar), fetched.stdout.strip()])
    sources = [str(TESTS / "java" / name) for name in ("Harness.java", "Scan.java", "CmdCheck.java")]
    if run([str(javac), "-cp", classpath, "-d", str(classes)] + sources, cwd=CACHE) != 0:
        return [("java compile", "FAIL")]
    results = []
    runcp = os.pathsep.join([str(classes), classpath])
    # Run from the cache folder, the game writes a logs/ folder into the working directory.
    for label, main, arg in (("vanilla behavior (Harness)", "Harness", None),
                             ("data codecs (Scan)", "Scan", str(ROOT / "data")),
                             ("generated commands (CmdCheck)", "CmdCheck", str(ROOT / "data" / "foxcraft_dungeon_loot" / "function"))):
        if main == "CmdCheck" and not (ROOT / "data" / "foxcraft_dungeon_loot" / "function").is_dir():
            results.append((label, "SKIPPED no build output"))
            continue
        cmd = [str(java), "-cp", runcp, main] + ([arg] if arg else [])
        results.append((label, "PASS" if run(cmd, cwd=CACHE) == 0 else "FAIL"))
    return results


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--no-build", action="store_true")
    parser.add_argument("--no-java", action="store_true")
    parser.add_argument("--release", action="store_true")
    parser.add_argument("-k", dest="pattern", action="append", default=[], help="unit test name filter, repeatable")
    args = parser.parse_args()
    if args.release:
        os.environ["FDL_RELEASE"] = "1"
    summary = []

    if not args.no_build:
        say("== build ==")
        code, why = build()
        summary.append(("build (npx mcb build)", "SKIPPED " + why if code is None else "PASS" if code == 0 else "FAIL"))
    else:
        summary.append(("build (npx mcb build)", "SKIPPED --no-build"))

    say("\n== unit tests ==")
    extra = []
    for pattern in args.pattern:
        extra += ["-k", pattern]
    summary.append(("unit tests (tests/unit)", "PASS" if unit_tests(extra) == 0 else "FAIL"))

    if args.no_java:
        summary.append(("java checks", "SKIPPED --no-java"))
    else:
        say("\n== java checks ==")
        summary += java_checks()

    say("\n== summary ==")
    width = max(len(name) for name, _ in summary)
    for name, status in summary:
        say("%-*s  %s" % (width, name, status))
    failed = [name for name, status in summary if status == "FAIL"]
    say("\n%s" % ("FAILED: " + ", ".join(failed) if failed else "all runnable checks passed"))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
