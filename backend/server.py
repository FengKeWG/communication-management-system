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
        print(f"C 语言后端输出 STDOUT: {output.strip()}")
        if error:
            print(f"C 语言后端报错 STDERR: {error.strip()}")
        if process.returncode != 0 or error:
            error_message = (
                error.strip()
                if error
                else f"C backend process exited with code {process.returncode}"
            )
            return None, error_message
        else:
            return output.strip(), None
    except Exception as e:
        print(f"Error: {e}")
        return (
            None,
            f"执行后端命令时发生未知错误: {e}",
        )


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
        # 如果 C 后端返回非零，则认为是登录失败
        error_message = f"认证失败: {error}" if error else "用户名或密码错误"
        print(f"Login failed for {username}: {error_message}")  # 增加日志
        return (
            jsonify({"error": error_message}),
            401,  # Unauthorized 更合适
        )
    elif output:
        # 期望输出: "username role sales_id"
        parts = output.strip().split()
        if len(parts) == 3:
            username, role, sales_id_str = parts
            try:
                sales_id = int(sales_id_str)
            except ValueError:
                print(
                    f"Login successful for {username}, but failed to parse sales_id: {sales_id_str}"
                )
                sales_id = 0  # 或者返回错误
                return jsonify({"error": "后端返回的 sales_id 格式错误"}), 500

            # 生成 token (这里的 token 逻辑很简单，实际应用需要更安全的方式)
            access_token = f"token_for_{username}_{role}_{sales_id}"
            print(
                f"Login successful: User={username}, Role={role}, SalesID={sales_id}"
            )  # 增加日志
            return jsonify(
                {
                    "access_token": access_token,
                    "role": role,
                    "username": username,
                    "sales_id": sales_id,  # 返回 sales_id
                }
            )
        else:
            print(
                f"Login successful for {username}, but backend output format error: {output}"
            )  # 增加日志
            return (
                jsonify({"error": "后端返回格式错误"}),
                500,
            )
    else:
        # C 后端没有输出，也没有错误，这通常不应该发生
        print(
            f"Login attempt for {username} resulted in no output and no error from backend."
        )  # 增加日志
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
    sort_param_string = request.args.get("sort", "")
    filter_sales_id = request.args.get("filter_sales_id", None)
    command = ["./main", "get_clients"]
    command.append(search_term)
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        command.extend(sort_args)
    if filter_sales_id:  # 如果存在过滤参数
        command.append(f"filter_sales_id={filter_sales_id}")
    output, error = run_c_backend(command)
    if error:
        return (
            jsonify({"error": f"获取客户列表失败: {error}"}),
            400,
        )
    else:
        return jsonify({"output": output or ""})


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
    sort_param_string = request.args.get("sort", "")
    command = ["./main", "get_sales", search_term]
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        valid_sort_args = [s for s in sort_args if s.strip("-").isdigit()]
        if valid_sort_args:
            command.extend(valid_sort_args)
        elif sort_args:
            print(f"警告: 无效的业务员排序参数 '{sort_param_string}', 已忽略。")
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"获取业务员列表失败: {error}"}), 500
    else:
        return jsonify({"output": output})


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
    sort_param_string = request.args.get("sort", "")
    filter_sales_id = request.args.get("filter_sales_id", None)
    command = ["./main", "get_communications"]
    command.append(search_term)
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        valid_sort_args = [s for s in sort_args if s.strip("-").isdigit()]
        if valid_sort_args:
            command.extend(valid_sort_args)
    if filter_sales_id:  # 如果存在过滤参数
        command.append(f"filter_sales_id={filter_sales_id}")  # 添加到命令
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"获取通话记录列表失败: {error}"}), 500
    else:
        return jsonify({"output": output or ""})


@app.route("/api/fetch_unlinked_sales", methods=["GET"])
def get_unlinked_sales():
    command = ["./main", "display_unlinked_sales"]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"获取未关联业务员列表失败: {error}"}), 500
    else:
        # C 端输出是 "id1,name1;id2,name2"
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

    # 基本验证 (例如新密码不能为空)
    if not new_password:
        return jsonify({"error": "新密码不能为空"}), 400

    command = ["./main", "change_password", username, old_password, new_password]
    output, error = run_c_backend(command)

    if error:
        # C 后端会在 stderr 输出具体错误 (旧密码错误/用户不存在)
        error_message = error  # 使用 C 后端的错误信息
        status_code = 400  # Bad Request (e.g., old password wrong) or 404 (user not found) - 400 is safer general case
        if "旧密码不正确" in error:
            status_code = 401  # Unauthorized or 400
        elif "未找到用户" in error:
            status_code = 404
        return jsonify({"error": f"密码修改失败: {error_message}"}), status_code
    elif output:
        # 成功时 C 后端会打印确认信息到 stdout
        return jsonify({"message": output.strip() or "密码修改成功"})
    else:
        # 不应该到这里，除非 C 后端没输出也没报错
        return jsonify({"error": "修改密码时发生未知错误"}), 500


@app.route("/api/backups", methods=["GET"])
def list_backups():
    """获取备份列表 (纯转发给 C 后端)"""
    command = ["./main", "list_backups"]
    output, error = run_c_backend(command)
    if error:
        # C 后端通过 stderr 提供错误信息
        return jsonify({"error": f"获取备份列表失败: {error}"}), 500
    else:
        # C 后端通过 stdout 提供文件名列表
        return jsonify({"output": output or ""})


@app.route("/api/backups", methods=["POST"])
def create_backup_endpoint():
    """创建新的备份 (纯转发给 C 后端)"""
    command = ["./main", "create_backup"]
    output, error = run_c_backend(command)
    if error:
        # C 后端通过 stderr 提供错误信息
        return jsonify({"error": f"创建备份失败: {error}"}), 500
    else:
        # C 后端通过 stdout 提供成功信息
        return jsonify({"output": output or "备份任务已启动"})


@app.route("/api/backups/<backup_name>", methods=["DELETE"])
def delete_backup_endpoint(backup_name):
    """删除指定的备份文件 (纯转发给 C 后端)"""
    # 不在 Python 中做任何验证，C 后端负责
    command = ["./main", "delete_backup", backup_name]
    output, error = run_c_backend(command)
    if error:
        # C 后端通过 stderr 提供错误信息 (包括无效文件名或删除失败)
        return (
            jsonify({"error": f"删除备份失败: {error}"}),
            500,
        )  # 或者 400/404，取决于 C 的错误类型
    else:
        # C 后端通过 stdout 提供成功信息
        return jsonify({"output": output or f"备份 '{backup_name}' 删除成功"})


@app.route("/api/backups/<backup_name>/restore", methods=["POST"])
def restore_backup_endpoint(backup_name):
    """从指定的备份文件恢复数据 (纯转发给 C 后端)"""
    # 不在 Python 中做任何验证，C 后端负责
    command = ["./main", "restore_backup", backup_name]
    output, error = run_c_backend(command)
    if error:
        # C 后端通过 stderr 提供错误信息 (包括文件不存在或恢复失败)
        return jsonify({"error": f"恢复备份失败: {error}"}), 500  # 或者 400/404
    else:
        # C 后端通过 stdout 提供成功信息
        return jsonify({"output": output or f"从备份 '{backup_name}' 恢复任务已启动"})


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
    sort_param_string = request.args.get("sort", "")  # ** Get sort parameter **
    command = ["./main", "get_groups", search_term]

    # ** Pass sort parameters to C backend if they exist **
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        # Basic validation: ensure they look like numbers (positive or negative)
        valid_sort_args = [s for s in sort_args if s.strip("-").isdigit()]
        if valid_sort_args:
            command.extend(valid_sort_args)
        elif sort_args:  # Log if invalid args were provided but ignore them
            print(f"警告: 无效的分组排序参数 '{sort_param_string}', 已忽略。")

    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": f"获取分组列表失败: {error}"}), 500
    else:
        return jsonify({"output": output or ""})


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


if __name__ == "__main__":
    # if not os.path.exists("./main"):
    #     print(f"错误：后端 '{"./main"}' 未找到")
    #     exit(1)
    print("Flask 服务器在 http://0.0.0.0:5000 开启")
    app.run(debug=True, host="0.0.0.0", port=5000)
