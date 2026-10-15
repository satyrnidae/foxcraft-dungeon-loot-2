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
npx mcb build

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
