@echo off
REM 进入 backend 目录
cd backend

REM 检查是否成功进入 backend 目录
if errorlevel 1 (
    echo 无法进入 backend 目录，请检查路径是否正确。
    pause
    exit /b 1
)

REM 使用 gcc 编译源代码
echo 正在编译项目...
gcc -o main src/main.c src/client_manager.c src/user_manager.c src/sales_manager.c src/communication_manager.c src/file_manager.c -I include

REM 检查编译是否成功
if errorlevel 1 (
    echo 编译失败，请检查代码和依赖项。
    pause
    exit /b 1
)

echo 编译成功！

REM 启动 Python 服务器
echo 正在启动服务器...
start python server.py

REM 检查服务器是否成功启动
if errorlevel 1 (
    echo 服务器启动失败，请检查 server.py 文件和 Python 环境。
    pause
    exit /b 1
)

echo 服务器已启动！

REM 等待服务器启动完成（可选）
timeout /t 3 >nul

REM 自动打开浏览器访问 http://127.0.0.1:5000
echo 正在打开浏览器访问 http://127.0.0.1:5000 ...
start http://127.0.0.1:5000

echo 完成！