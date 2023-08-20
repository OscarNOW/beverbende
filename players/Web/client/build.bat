@echo off

cd ../../..

if not exist node_modules/socket.io-client/dist (
    echo node_modules/socket.io-client/dist not exist
    goto :end_1
)
cd node_modules/socket.io-client/dist

copy socket.io.esm.min.js ../../../dist/players/web/client/socket.io-client.js

cd ../../..

:end_1
cd players/web/client
