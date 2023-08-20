@echo off

cd ../../..

if not exist node_modules/socket.io-client/dist (
    echo node_modules/socket.io-client/dist not exist
    goto :end
)
cd node_modules/socket.io-client/dist

copy "socket.io.esm.min.js" "../../../dist/players/web/client/files/socket.io-client.js"

cd ../../..


cd dist/players/web/client/files/
powershell -Command "(gc ws.js) -replace 'socket.io-client', '/files/socket.io-client.js' | Out-File -encoding ASCII ws.js"
cd ../../../../..

:end
cd players/Web/client
