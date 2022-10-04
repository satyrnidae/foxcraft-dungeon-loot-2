npm i -g mc-build
while ($true) {
    mcb
    Write-Output "MCB closed, restarting in five seconds..."

    Start-Sleep -Seconds 5
}
