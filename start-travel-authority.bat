@echo off
cd /d "C:\Users\SDOCAMNORTE\Desktop\SDS-System\server"
start cmd /k node server.js

@echo off
cd /d "C:\Users\SDOCAMNORTE\Desktop\SDS-System\front-end"
start cmd /k npm run dev
