# **公司客户通信管理系统**

## **项目概述**
本系统旨在对公司的客户通讯录以及与客户的通信情况进行全面管理。通过该系统，可以高效地管理客户信息、客户联络员信息、公司业务员信息，并记录业务员与客户联络员之间的通信情况。

## **背景说明**
公司A有多个客户，每个客户也是一个公司。每个客户有多名联络员与A公司进行联络。A公司有多名业务员负责与客户进行联络，每名业务员负责联络的客户可能是不同的，比如业务员p负责与客户X、Y联络，而业务员q负责与客户Y、Z联络。

**系统管理以下信息**：
- **客户信息**：客户名称、客户所在区域（如东北、华北等）、客户地址、客户公司法人、客户规模（大、中、小，这个可以自行定义）、与本公司业务联系程度（高、中、低等，这个可以自行定义）、客户公司邮箱、客户公司联络电话等。
- **客户联络员信息**：姓名、性别、生日、电子邮箱、电话等。
- **业务员信息**：姓名、性别、生日、电子邮箱、电话等。
- **通信记录**：客户公司名称、客户联络员名称、通信时间（年、月、日、时、分、秒）、通信时长（按分钟计）、通信内容（文字记录）等。

## **项目原理**
本项目采用三层架构：前端、Web 服务器（Flask）和后端（C 程序）。

### **1. 后端（C 语言）**
- **功能**：
    - 管理客户信息（增、删、改、查）。
    - 管理客户联络员信息（增、删、改、查）。
    - 管理业务员信息（增、删、改、查）。
    - 记录和管理通信记录。
    - 数据存储在文本文件中（如 `data/client.txt`、`data/contact.txt`、`data/employee.txt`、`data/communication.txt`）。
- **实现方式**：
    - 使用链表结构在内存中管理客户、联络员、业务员和通信记录数据。
    - 通过命令行参数接收操作指令，例如 `./main add_client` 添加客户，`./main list_clients` 显示客户列表。
    - 从标准输入（stdin）读取数据，输出结果到标准输出（stdout）。
- **数据格式**：
    - 各种信息以逗号分隔的文本格式存储在文件中，例如：
    ```
    # client.txt 客户信息
    1001,张三公司,北京,朝阳区,张三,1,2,zhangsan@example.com,12345678901
    ```

### **2. Web 服务器（Flask）**
- **功能**：
    - 提供 RESTful API 接口，接收前端请求并与 C 程序交互。
    - 服务前端静态文件（如 `index.html`、`styles.css` 和 `scripts.js`）。
- **实现方式**：
    - 使用 Python 的 `subprocess` 模块调用 C 程序（`main.exe`），传递数据并接收结果。
    - 将前端的 JSON 请求转换为 C 程序所需的输入格式。
- **API 示例**：
    - 添加客户：`/api/add_client`（POST）
    - 显示客户列表：`/api/list_clients`（GET）
    - 添加联络员：`/api/add_contact`（POST）
    - 添加业务员：`/api/add_employee`（POST）
    - 记录通信：`/api/add_communication`（POST）

### **3. 前端**
- **功能**：
    - 提供用户友好的界面，用于输入和管理客户、联络员、业务员信息以及通信记录。
- **实现方式**：
    - 使用 HTML 构建表单和展示区域。
    - 使用 CSS 美化界面。
    - 使用 JavaScript 通过 AJAX 与 Flask API 通信，实现动态交互。
- **交互流程**：
    - 用户填写表单并提交，数据通过 POST 请求发送到 Flask。
    - Flask 返回操作结果，前端解析并显示。

### **项目架构图**
```
+-----------------+       +-----------------+       +-----------------+
|     前端        | <-->  |    Flask API    | <-->  |    C 后端       |
| (HTML/CSS/JS)   |       | (Python)        |       | (数据管理)      |
+-----------------+       +-----------------+       +-----------------+
```

## **连接方式**
前端、Flask 和 C 后端通过以下方式连接：

1. **前端与 Flask**：
   - 前端通过 HTTP 请求（GET 或 POST）访问 Flask 提供的 API。
   - 示例：
     - 添加客户：发送 POST 请求到 `http://127.0.0.1:5000/api/add_client`，附带 JSON 数据。
     - 查看列表：发送 GET 请求到 `http://127.0.0.1:5000/api/list_clients`。
   - 数据格式为 JSON，例如：
     ```json
     {
       "id": 1001,
       "name": "张三公司",
       "region": "北京",
       "address": "朝阳区",
       "legal_person": "张三",
       "size": 1,
       "contact_level": 2,
       "email": "zhangsan@example.com",
       "phones": "12345678901"
     }
     ```

2. **Flask 与 C 后端**：
   - Flask 使用 `subprocess.Popen` 调用 C 程序（`main.exe`），通过管道传递数据。
   - 输入：将 JSON 数据格式化为多行字符串，写入 C 程序的 stdin。
   - 输出：从 C 程序的 stdout 和 stderr 读取结果，返回给前端。
   - 示例调用：
     ```python
     process = subprocess.Popen(["./main.exe", "add_client"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
     output, error = process.communicate(input=input_data)
     ```

3. **数据流动**：
   - 用户输入 → 前端表单 → Flask API → C 程序 → 文件存储。
   - 文件数据 → C 程序 → Flask API → 前端展示。

## **安装与运行**

### **1. 环境要求**
- **操作系统**：Windows（也可适配 Linux/macOS）
- **工具**：
    - GCC（用于编译 C 代码，例如 MinGW）
    - Python 3.x
    - Flask（Python 包）

### **2. 安装步骤**
- **编译 C 代码**：
    ```cmd
    cd backend
    gcc -o main src/main.c src/client_manager.c src/contact_manager.c src/employee_manager.c src/communication_manager.c src/file_manager.c -I include
    ```
    - 生成 `main.exe`（Windows）或 `main`（Linux/macOS）。
    - 确保包含所有相关的 `.c` 文件。

- **安装 Python 依赖**：
    ```cmd
    pip install flask
    ```

- **目录结构**：
    ```
	communication_management_system/
	│── backend/                 # 后端代码
	│   ├── src/                 # 源代码
	│   │   ├── main.c           # 程序入口
	│   │   ├── client_manager.c # 客户管理功能
	│   │   ├── contact_manager.c # 客户联络员管理功能
	│   │   ├── employee_manager.c # 业务员管理功能
	│   │   ├── communication_manager.c # 通信记录管理功能
	│   │   ├── group_manager.c  # 客户分组管理功能
	│   │   ├── utils.c          # 辅助功能
	│   │   ├── file_manager.c   # 负责文件读写
	│   ├── include/             # 头文件
	│   │   ├── client.h
	│   │   ├── contact.h
	│   │   ├── employee.h
	│   │   ├── communication.h
	│   │   ├── group.h
	│   │   ├── client_manager.h
	│   │   ├── contact_manager.h
	│   │   ├── employee_manager.h
	│   │   ├── communication_manager.h
	│   │   ├── group_manager.h
	│   │   ├── utils.h
	│   │   ├── file_manager.h   # 负责文件存储
	│   ├── data/                # 数据存储
	│   │   ├── client.txt       # 客户数据文件
	│   │   ├── contact.txt      # 客户联络员数据文件
	│   │   ├── employee.txt     # 业务员数据文件
	│   │   ├── communication.txt # 通信记录数据文件
	│   │   ├── group.txt        # 客户分组数据文件
	│   ├── server.py
	│   ├── main                 # C语言编译文件
	│── frontend/                # 前端代码
	│   ├── index.html
	│   ├── css/
	│   │   ├── styles.css
	│   ├── js/
	│   │   ├── scripts.js
	│   │   ├── client.js
	│── README.md
	│── LICENSE
    ```

### **3. 运行项目**
- **启动 Flask 服务器**：
    ```cmd
    cd backend
    python server.py
    ```
    - 默认运行在 `http://127.0.0.1:5000`。

- **访问网页**：
    在浏览器中打开 `http://127.0.0.1:5000/`。

## **注意事项**
- **文件权限**：确保 `backend/data/` 目录存在且有写入权限。
- **Windows 用户**：在 Flask 中调用 C 程序时，使用 `./main.exe` 而不是 `./main`。
- **调试**：若操作失败，检查 `main.exe` 是否在 `backend` 目录下，或使用完整路径。
- **编译**：确保 C 代码中所有源文件都被正确编译。

---
