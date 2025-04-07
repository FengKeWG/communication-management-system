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
        return (
            jsonify({"error": f"认证失败: {error}"}),
            400,
        )
    elif output:
        parts = output.strip().split()
        if len(parts) == 2:
            username, role = parts
            access_token = f"token_for_{username}_{role}"
            return jsonify(
                {
                    "access_token": access_token,
                    "role": role,
                    "username": username,
                }
            )
        else:
            return (
                jsonify({"error": "后端返回格式错误"}),
                500,
            )
    else:
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
    command = ["./main", "get_clients"]
    command.append(search_term)
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        command.extend(sort_args)
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


# --- 新增: 获取客户 ID 和名称的 API ---
@app.route("/api/display_client_ids_names", methods=["GET"])
def display_client_ids_names():
    command = ["./main", "display_client_ids_names"]
    output, error = run_c_backend(command)

    if error:
        return jsonify({"error": f"获取客户ID和名称列表失败: {error}"}), 500
    else:
        # C 程序直接打印 "id1,name1;id2,name2"，前端 JS 会处理
        return jsonify({"output": output})


if __name__ == "__main__":
    # if not os.path.exists("./main"):
    #     print(f"错误：后端 '{"./main"}' 未找到")
    #     exit(1)
    print("Flask 服务器在 http://0.0.0.0:5000 开启")
    app.run(debug=True, host="0.0.0.0", port=5000)
