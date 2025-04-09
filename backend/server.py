from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__, static_folder="../frontend", static_url_path="")


def run_c_backend(command_args):
    print(f"正在 C 语言后端执行命令: {' '.join(command_args)}")
    try:
        process = subprocess.Popen(
            command_args,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
        )
        output, error = process.communicate()
        stdout_content = output.strip()
        stderr_content = error.strip()
        print(f"C 语言后端 STDOUT: {stdout_content}")
        if stderr_content:
            print(f"C 语言后端 STDERR: {stderr_content}")
        if process.returncode != 0 or stderr_content:
            error_message = (
                stderr_content
                if stderr_content
                else f"C 后端进程退出，代码: {process.returncode}，但 stderr 为空。"
            )
            return None, error_message
        else:
            return stdout_content, None
    except Exception as e:
        print(f"执行 C 后端时发生 Python 异常: {e}")
        return None, f"执行后端命令时发生未知错误: {e}"


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    if not data or "username" not in data or "password" not in data:
        return (
            jsonify({"error": "请求数据无效，需要用户名和密码"}),
            400,
        )
    username = data["username"]
    password = data["password"]
    command = ["./main", "login", username, password]
    output, error = run_c_backend(command)
    if error:
        error_message = f"认证失败: {error}" if error else "用户名或密码错误"
        print(f"Login failed for {username}: {error_message}")
        return (
            jsonify({"error": error_message}),
            401,
        )
    elif output:
        parts = output.strip().split()
        if len(parts) == 3:
            username, role, sales_id_str = parts
            try:
                sales_id = int(sales_id_str)
            except ValueError:
                print(
                    f"Login successful for {username}, but failed to parse sales_id: {sales_id_str}"
                )
                sales_id = 0
                return jsonify({"error": "后端返回的 sales_id 格式错误"}), 500
            access_token = f"token_for_{username}_{role}_{sales_id}"
            print(f"Login successful: User={username}, Role={role}, SalesID={sales_id}")
            return jsonify(
                {
                    "access_token": access_token,
                    "role": role,
                    "username": username,
                    "sales_id": sales_id,
                }
            )
        else:
            print(
                f"Login successful for {username}, but backend output format error: {output}"
            )
            return (
                jsonify({"error": "后端返回格式错误"}),
                500,
            )
    else:
        print(
            f"Login attempt for {username} resulted in no output and no error from backend."
        )
        return (
            jsonify({"error": "登录时发生未知后端错误"}),
            500,
        )


@app.route("/api/add_user", methods=["POST"])
def add_user():
    data = request.json
    if not data or "userData" not in data:
        return (
            jsonify({"error": "请求数据无效，需要 userData"}),
            400,
        )
    user_data_string = data["userData"]
    command = ["./main", "add_user", user_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"添加用户失败: {error}"}), 400
    else:
        return jsonify({"output": output or "用户添加成功"})


@app.route("/api/delete_user/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    try:
        int(user_id)
    except ValueError:
        return (
            jsonify({"error": "无效的用户 ID 格式"}),
            400,
        )
    command = ["./main", "delete_user", str(user_id)]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"删除用户失败: {error}"}), 400
    else:
        return jsonify({"output": output or f"用户 {user_id} 删除成功"})


@app.route("/api/update_user", methods=["PUT"])
def update_user():
    data = request.get_json()
    if not data or "userData" not in data:
        return (
            jsonify({"error": "请求数据无效，需要 userData"}),
            400,
        )
    user_data_string = data["userData"]
    command = ["./main", "update_user", user_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"更新用户失败: {error}"}), 400
    else:
        return jsonify({"output": output or "用户信息更新成功"})


@app.route("/api/fetch_users", methods=["GET"])
def get_users():
    search_term = request.args.get("query", "").strip()
    sort_param_string = request.args.get("sort", "")
    command = ["./main", "get_users"]
    command.append(search_term)
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        command.extend(sort_args)
    output, error = run_c_backend(command)
    if error:
        return (
            jsonify({"error": f"获取用户列表失败: {error}"}),
            400,
        )
    else:
        return jsonify({"output": output or ""})


@app.route("/api/add_client", methods=["POST"])
def add_client():
    data = request.json
    if not data or "clientData" not in data:
        return (
            jsonify({"error": "请求数据无效，需要 clientData"}),
            400,
        )
    client_data_string = data["clientData"]
    command = ["./main", "add_client", client_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"添加客户失败: {error}"}), 400
    else:
        return jsonify({"output": output or "客户添加成功"})


@app.route("/api/delete_client/<client_id>", methods=["DELETE"])
def delete_client(client_id):
    try:
        int(client_id)
    except ValueError:
        return (
            jsonify({"error": "无效的客户 ID 格式"}),
            400,
        )
    command = ["./main", "delete_client", str(client_id)]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"删除客户失败: {error}"}), 400
    else:
        return jsonify({"output": output or f"客户 {client_id} 删除成功"})


@app.route("/api/update_client", methods=["PUT"])
def update_client():
    data = request.get_json()
    if not data or "clientData" not in data:
        return (
            jsonify({"error": "请求数据无效，需要 clientData"}),
            400,
        )
    client_data_string = data["clientData"]
    command = ["./main", "update_client", client_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"更新客户失败: {error}"}), 400
    else:
        return jsonify({"output": output or "客户信息更新成功"})


@app.route("/api/fetch_clients", methods=["GET"])
def get_clients():
    search_term = request.args.get("query", "").strip()
    search_name = request.args.get("name", "").strip()
    search_region = request.args.get("region", "").strip()
    search_address = request.args.get("address", "").strip()
    search_legal_person = request.args.get("legal_person", "").strip()
    search_size = request.args.get("size", "").strip()
    search_contact_level = request.args.get("contact_level", "").strip()
    search_email = request.args.get("email", "").strip()
    search_contact_count = request.args.get("contact_count", "").strip()
    sort_param_string = request.args.get("sort", "")
    filter_sales_id = request.args.get("filter_sales_id", None)
    command = ["./main", "get_clients"]
    command.append(search_term)
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        command.extend(sort_args)
    if filter_sales_id:
        command.append(f"filter_sales_id={filter_sales_id}")
    if search_name:
        command.append(f"name={search_name}")
    if search_region:
        command.append(f"region={search_region}")
    if search_address:
        command.append(f"address={search_address}")
    if search_legal_person:
        command.append(f"legal_person={search_legal_person}")
    if search_size:
        command.append(f"size={search_size}")
    if search_contact_level:
        command.append(f"contact_level={search_contact_level}")
    if search_email:
        command.append(f"email={search_email}")
    if search_contact_count:
        command.append(f"contact_count={search_contact_count}")
    print("Executing C command:", " ".join(command))
    output, error = run_c_backend(command)
    if error:
        return (
            jsonify({"error": f"获取客户列表失败: {error}"}),
            400,
        )
    else:
        table_data = []
        result_count = -1
        if output:
            lines = output.strip().split("\n")
            if lines:
                last_line = lines[-1]
                try:
                    parsed_count = int(last_line)
                    if str(parsed_count) == last_line:
                        result_count = parsed_count
                        table_data = lines[:-1]
                    else:
                        table_data = lines
                        result_count = len(table_data)
                except ValueError:
                    table_data = lines
                    result_count = len(table_data)
        if not lines and result_count == -1:
            result_count = 0
        return jsonify(
            {
                "output": "\n".join(table_data),
                "count": result_count,
            }
        )


@app.route("/api/add_sales", methods=["POST"])
def add_sales():
    data = request.json
    if not data or "salesData" not in data:
        return jsonify({"error": "请求数据无效，需要 salesData"}), 400
    sales_data_string = data["salesData"]
    command = ["./main", "add_sales", sales_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"添加业务员失败: {error}"}), 400
    else:
        return jsonify({"output": output or "业务员添加成功"})


@app.route("/api/delete_sales/<sales_id>", methods=["DELETE"])
def delete_sales(sales_id):
    if not sales_id.isdigit():
        return jsonify({"error": "无效的业务员 ID 格式"}), 400
    command = ["./main", "delete_sales", sales_id]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"删除业务员失败: {error}"}), 400
    else:
        return jsonify({"output": output or f"业务员 {sales_id} 删除成功"})


@app.route("/api/update_sales", methods=["PUT"])
def update_sales():
    data = request.get_json()
    if not data or "salesData" not in data:
        return jsonify({"error": "请求数据无效，需要 salesData"}), 400
    sales_data_string = data["salesData"]
    command = ["./main", "update_sales", sales_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"更新业务员失败: {error}"}), 400
    else:
        return jsonify({"output": output or "业务员信息更新成功"})


@app.route("/api/fetch_sales", methods=["GET"])
def get_sales():
    search_term = request.args.get("query", "").strip()
    search_name = request.args.get("name", "").strip()
    search_email = request.args.get("email", "").strip()
    search_client_count = request.args.get("client_count", "").strip()
    sort_param_string = request.args.get("sort", "")
    command = ["./main", "get_sales"]
    command.append(search_term)
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        valid_sort_args = [s for s in sort_args if s.strip("-").isdigit()]
        if valid_sort_args:
            command.extend(valid_sort_args)
        elif sort_args:
            print(f"警告: 无效的业务员排序参数 '{sort_param_string}', 已忽略。")
    if search_name:
        command.append(f"name={search_name}")
    if search_email:
        command.append(f"email={search_email}")
    if search_client_count:
        command.append(f"client_count={search_client_count}")
    print("Executing C command:", " ".join(command))
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"获取业务员列表失败: {error}"}), 500
    else:
        table_data = []
        result_count = -1
        if output:
            lines = output.strip().split("\n")
            if lines:
                last_line = lines[-1]
                try:
                    parsed_count = int(last_line)
                    if str(parsed_count) == last_line:
                        result_count = parsed_count
                        table_data = lines[:-1]
                    else:
                        table_data = lines
                        result_count = len(table_data)
                except ValueError:
                    table_data = lines
                    result_count = len(table_data)
        if not lines and result_count == -1:
            result_count = 0
        return jsonify({"output": "\n".join(table_data), "count": result_count})


@app.route("/api/display_client_ids_names", methods=["GET"])
def display_client_ids_names():
    command = ["./main", "display_client_ids_names"]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"获取客户ID和名称列表失败: {error}"}), 500
    else:
        return jsonify({"output": output})


@app.route("/api/clients/<client_id>/contacts", methods=["GET"])
def get_client_contacts(client_id):
    try:
        int(client_id)
    except ValueError:
        return jsonify({"error": "无效的客户 ID 格式"}), 400
    command = ["./main", "display_client_contacts", str(client_id)]
    output, error = run_c_backend(command)
    if error:
        return (
            jsonify({"error": f"获取客户 {client_id} 的联络人列表失败: {error}"}),
            500,
        )
    else:
        return jsonify({"output": output or ""})


@app.route("/api/fetch_sales_ids_names", methods=["GET"])
def get_sales_ids_names():
    command = ["./main", "display_sales_ids_names"]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"获取业务员ID和名称列表失败: {error}"}), 500
    else:
        return jsonify({"output": output or ""})


@app.route("/api/add_communication", methods=["POST"])
def add_communication():
    data = request.json
    if not data or "communicationData" not in data:
        return jsonify({"error": "请求数据无效，需要 communicationData"}), 400
    comm_data_string = data["communicationData"]
    command = ["./main", "add_communication", comm_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"添加通话记录失败: {error}"}), 400
    else:
        return jsonify({"output": output or "通话记录添加成功"})


@app.route("/api/update_communication", methods=["PUT"])
def update_communication():
    data = request.get_json()
    if not data or "communicationData" not in data:
        return jsonify({"error": "请求数据无效，需要 communicationData"}), 400
    comm_data_string = data["communicationData"]
    command = ["./main", "update_communication", comm_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"更新通话记录失败: {error}"}), 400
    else:
        return jsonify({"output": output or "通话记录更新成功"})


@app.route("/api/fetch_communications", methods=["GET"])
def get_communications():
    search_term = request.args.get("query", "").strip()
    search_client_id = request.args.get("client_id", "").strip()
    search_contact_id = request.args.get("contact_id", "").strip()
    search_sales_id = request.args.get("sales_id", "").strip()
    search_duration = request.args.get("duration", "").strip()
    search_content = request.args.get("content", "").strip()
    sort_param_string = request.args.get("sort", "")
    filter_sales_id = request.args.get("filter_sales_id", None)
    command = ["./main", "get_communications"]
    command.append(search_term)
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        valid_sort_args = [s for s in sort_args if s.strip("-").isdigit()]
        if valid_sort_args:
            command.extend(valid_sort_args)
    if filter_sales_id:
        command.append(f"filter_sales_id={filter_sales_id}")
    if search_client_id:
        command.append(f"client_id={search_client_id}")
    if search_contact_id:
        command.append(f"contact_id={search_contact_id}")
    if search_sales_id:
        command.append(f"sales_id={search_sales_id}")
    if search_duration:
        command.append(f"duration={search_duration}")
    if search_content:
        command.append(f"content={search_content}")
    print("Executing C command:", " ".join(command))
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"获取通话记录列表失败: {error}"}), 500
    else:
        table_data = []
        result_count = -1
        if output:
            lines = output.strip().split("\n")
            if lines:
                last_line = lines[-1]
                try:
                    parsed_count = int(last_line)
                    if str(parsed_count) == last_line:
                        result_count = parsed_count
                        table_data = lines[:-1]
                    else:
                        table_data = lines
                        result_count = len(table_data)
                except ValueError:
                    table_data = lines
                    result_count = len(table_data)
        if not lines and result_count == -1:
            result_count = 0
        return jsonify({"output": "\n".join(table_data), "count": result_count})


@app.route("/api/fetch_unlinked_sales", methods=["GET"])
def get_unlinked_sales():
    command = ["./main", "display_unlinked_sales"]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"获取未关联业务员列表失败: {error}"}), 500
    else:
        return jsonify({"output": output or ""})


@app.route("/api/change_password", methods=["POST"])
def change_password():
    data = request.json
    if (
        not data
        or "username" not in data
        or "old_password" not in data
        or "new_password" not in data
    ):
        return jsonify({"error": "请求无效，需要用户名、旧密码和新密码"}), 400
    username = data["username"]
    old_password = data["old_password"]
    new_password = data["new_password"]
    command = ["./main", "change_password", username, old_password, new_password]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output or "操作成功完成"})


@app.route("/api/add_group", methods=["POST"])
def add_group():
    data = request.json
    if not data or "groupData" not in data:
        return jsonify({"error": "请求数据无效，需要 groupData"}), 400
    group_data_string = data["groupData"]
    command = ["./main", "add_group", group_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"添加分组失败: {error}"}), 400
    else:
        return jsonify({"output": output or "分组添加成功"})


@app.route("/api/fetch_groups", methods=["GET"])
def get_groups():
    search_term = request.args.get("query", "").strip()
    search_name = request.args.get("name", "").strip()
    search_client_count = request.args.get("client_count", "").strip()
    sort_param_string = request.args.get("sort", "")
    command = ["./main", "get_groups"]
    command.append(search_term)
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        valid_sort_args = [s for s in sort_args if s.strip("-").isdigit()]
        if valid_sort_args:
            command.extend(valid_sort_args)
        elif sort_args:
            print(f"警告: 无效的分组排序参数 '{sort_param_string}', 已忽略。")
    if search_name:
        command.append(f"name={search_name}")
    if search_client_count:
        command.append(f"client_count={search_client_count}")
    print("Executing C command:", " ".join(command))
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"获取分组列表失败: {error}"}), 500
    else:
        table_data = []
        result_count = -1
        if output:
            lines = output.strip().split("\n")
            if lines:
                last_line = lines[-1]
                try:
                    parsed_count = int(last_line)
                    if str(parsed_count) == last_line:
                        result_count = parsed_count
                        table_data = lines[:-1]
                    else:
                        table_data = lines
                        result_count = len(table_data)
                except ValueError:
                    table_data = lines
                    result_count = len(table_data)
        if not lines and result_count == -1:
            result_count = 0
        return jsonify({"output": "\n".join(table_data), "count": result_count})


@app.route("/api/update_group", methods=["PUT"])
def update_group():
    data = request.get_json()
    if not data or "groupData" not in data:
        return jsonify({"error": "请求数据无效，需要 groupData"}), 400
    group_data_string = data["groupData"]
    command = ["./main", "update_group", group_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"更新分组失败: {error}"}), 400
    else:
        return jsonify({"output": output or "分组信息更新成功"})


@app.route("/api/delete_group/<group_id>", methods=["DELETE"])
def delete_group(group_id):
    if not group_id.isdigit() or int(group_id) <= 0:
        return jsonify({"error": "无效的分组 ID 格式"}), 400
    command = ["./main", "delete_group", group_id]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"删除分组失败: {error}"}), 400
    else:
        return jsonify({"output": output or f"分组 {group_id} 删除成功"})


@app.route("/api/backups", methods=["GET"])
def list_backups():
    """获取备份列表"""
    command = ["./main", "list_backups"]
    output, error = run_c_backend(command)  # run_c_backend 假设已定义

    if error:
        # 如果 C 后端 list_backups 返回非 0，run_c_backend 应该会捕获 stderr 或退出码
        print(f"Error listing backups from C backend: {error}")
        # 返回具体的错误信息给前端
        return jsonify({"error": f"获取备份列表失败: {error}"}), 500
    else:
        backup_list = []
        if output:  # 确保 output 不是 None 或空字符串
            lines = output.strip().split("\n")
            for line in lines:
                if line.strip():  # 跳过可能的空行
                    parts = line.split("|", 1)  # 按第一个 '|' 分割
                    if len(parts) == 2:
                        backup_list.append(
                            {
                                "filename": parts[0].strip(),
                                "timestamp": parts[1].strip(),  # C 后端已格式化
                            }
                        )
                    else:
                        # 如果格式不对，记录一个错误，但可能仍包含文件名
                        print(f"Warning: Unexpected format from list_backups: {line}")
                        backup_list.append(
                            {
                                "filename": line.strip(),
                                "timestamp": "格式错误",  # 或其他指示符
                            }
                        )
        # 返回包含对象列表的 JSON
        return jsonify({"backups": backup_list})


@app.route("/api/backups", methods=["POST"])
def create_backup_endpoint():
    """创建新的备份"""
    command = ["./main", "create_backup"]
    output, error = run_c_backend(command)
    if error:
        print(f"Error creating backup: {error}")
        return jsonify({"error": f"创建备份失败: {error}"}), 500
    else:
        # 成功消息由 C 后端打印到 stdout
        return jsonify({"message": output.strip() or "备份任务已启动"})


@app.route("/api/backups/<backup_name>", methods=["DELETE"])
def delete_backup_endpoint(backup_name):
    command = ["./main", "delete_backup", backup_name]
    output, error = run_c_backend(command)
    if error:
        print(f"Error deleting backup '{backup_name}': {error}")
        return (
            jsonify({"error": f"删除备份 '{backup_name}' 失败: {error}"}),
            500,  # 或者 404 如果 C 返回文件不存在的特定错误
        )
    else:
        return jsonify({"message": output.strip() or f"备份 '{backup_name}' 删除成功"})


@app.route("/api/backups/<backup_name>/restore", methods=["POST"])
def restore_backup_endpoint(backup_name):
    command = ["./main", "restore_backup", backup_name]
    output, error = run_c_backend(command)
    if error:
        print(f"Error restoring backup '{backup_name}': {error}")
        return jsonify({"error": f"恢复备份 '{backup_name}' 失败: {error}"}), 500
    else:
        return jsonify(
            {"message": output.strip() or f"从备份 '{backup_name}' 恢复任务已启动"}
        )


if __name__ == "__main__":
    print("Flask 服务器在 http://0.0.0.0:5000 开启")
    app.run(debug=True, host="0.0.0.0", port=5000)
