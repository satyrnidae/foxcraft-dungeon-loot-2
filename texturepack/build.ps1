$BuildDir = "$PSScriptRoot/../.build"

# Check if build dir exists, create if not
if (-not (Test-Path $BuildDir)) {
    New-Item -ItemType Directory $BuildDir
}

# Read pack.mcmeta
$PackFile = "$PSScriptRoot/pack.mcmeta"

if (Test-Path $PackFile) {
    $PackData = (Get-Content $PackFile | Out-String | ConvertFrom-Json)
    if ($PackData.meta.baseArchiveName -and $PackData.meta.version) {
        $OutFile = "$BuildDir/$($PackData.meta.baseArchiveName)-$($PackData.meta.version).zip"
        $ExistingTest = 0

        while (Test-Path $OutFile) {
            $ExistingTest += 1
            $OutFile = "$BuildDir/$($PackData.meta.baseArchiveName)-$($PackData.meta.version) ($ExistingTest).zip"
        }

        7z a -tzip -i"!$PSScriptRoot/*" -xr@"$PSScriptRoot/exclude.txt" -x"!$PSScriptRoot/src/*" $OutFile
        (Get-FileHash -Algorithm SHA1 $OutFile).Hash | Out-File -Encoding UTF8 "$OutFile.sha1"
    }
}
