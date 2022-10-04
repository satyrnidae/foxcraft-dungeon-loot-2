npm i mc-build
while ($true) {
    node ./node_modules/mc-build/lib/core/check_for_lang_updates.js
    Write-Output "MCB closed, restarting in five seconds..."

    Start-Sleep -Seconds 5
}
