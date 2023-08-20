@echo off

cd ../../..

if not exist node_modules/socket.io-client/dist/socket.io.esm.min.js (
    echo node_modules/socket.io-client/dist/socket.io.esm.min.js not exist
    goto :end
)
cd node_modules/socket.io-client/dist
copy "socket.io.esm.min.js" "../../../dist/players/web/client/files/socket.io-copy-client.js"
cd ../../..

cd dist/players/web/client/files/

powershell -Command "(gc ws.js) -replace 'circular-json-es6', '/files/circular-json-copy.js' | Out-File -encoding ASCII ws.js"

if exist player.js (
    if exist copy-player.js ( del copy-player.js )
    rename "player.js" "copy-player.js"
    powershell -Command "(gc ws.js) -replace './player', '/files/copy-player.js' | Out-File -encoding ASCII ws.js"
)

cd ../../../../..

:end
cd players/Web/client
