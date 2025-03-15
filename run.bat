gcc -o main backend/src/main.c backend/src/client_manager.c backend/src/contact_manager.c backend/src/employee_manager.c backend/src/communication_manager.c backend/src/file_manager.c -I include

python backend/server.py

pause
