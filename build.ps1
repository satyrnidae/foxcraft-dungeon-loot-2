#!/usr/bin/env pwsh

$BuildDir = "$PSScriptRoot/.build"

# Check if build dir exists, create if not
if (Test-Path $BuildDir) {
    Remove-Item -Path $BuildDir -Recurse -Force -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory $BuildDir

# Generated function and rebuild
$McBuildOutputDir = "$PSScriptRoot/data/function"
if(Test-Path $McBuildOutputDir) {
    Remove-Item -Path $McBuildOutputDir -Recurse -Force -ErrorAction SilentlyContinue
}
# The client jar goes in the test cache, for the Java checks and for measuring the vanilla fonts. It is only fetched when
# missing or when its sha1 is wrong, and tests/ is never zipped.
node "$PSScriptRoot/tests/tools/fetch_mc_jar.mjs"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Could not download the client jar to tests/.cache/mc."
    exit $LASTEXITCODE
}

npx mcb build

# Tests run on the output just built, a failure stops the build. Set SKIP_TESTS=1 when they already ran.
# A non-dev build also runs the release checks.
if (-not $env:SKIP_TESTS) {
    $TestConfig = Get-Content "$PSScriptRoot/config.json" | Out-String | ConvertFrom-Json
    $TestArgs = @("--no-build")
    if (-not $TestConfig.mc.dev) { $TestArgs += "--release" }
    node "$PSScriptRoot/tests/run_all.mjs" @TestArgs
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed, cowardly refusing to build the .zip files."
        exit $LASTEXITCODE
    }
}

# Read pack.mcmeta
$ConfigFile = "$PSScriptRoot/config.json"

if (Test-Path $ConfigFile) {
    $Config = (Get-Content $ConfigFile | Out-String | ConvertFrom-Json)
    if ($Config.mc.baseArchiveName -and $Config.mc.version) {
        $OutFile = "$BuildDir/$($Config.mc.baseArchiveName)-$($Config.mc.version)$(if($Config.mc.dev){"+dev"}).zip"
        $ExistingTest = 0

        while (Test-Path $OutFile) {
            $ExistingTest += 1
            $OutFile = "$BuildDir/$($Config.mc.baseArchiveName)-$($Config.mc.version) ($ExistingTest).zip"
        }

        7z a -tzip -i"!$PSScriptRoot/*" -xr@"$PSScriptRoot/exclude.txt" -x"!$PSScriptRoot/src/*" $OutFile
        (Get-FileHash -Algorithm SHA1 $OutFile).Hash | Out-File -Encoding UTF8 "$OutFile.sha1"
    }
}

& "$PSScriptRoot/texturepack/build.ps1"
