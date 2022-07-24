$BuildDir = "$PSScriptRoot/.build"

# Check if build dir exists, create if not
if (-not (Test-Path $BuildDir)) {
    New-Item -ItemType Directory $BuildDir
}

# Read pack.mcmeta
$ConfigFile = "$PSScriptRoot/config.json"

if (Test-Path $ConfigFile) {
    $Config = (Get-Content $ConfigFile | Out-String | ConvertFrom-Json)
    if ($Config.mc.baseArchiveName -and $Config.mc.version) {
        $OutFile = "$BuildDir/$($Config.mc.baseArchiveName)-$($Config.mc.version).zip"
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
