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
    username = data["username"]
    password = data["password"]
    command = ["./main", "login", username, password]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        parts = output.strip().split()
        username, role, sales_id_str = parts
        sales_id = int(sales_id_str)
        access_token = f"token_for_{username}_{role}_{sales_id}"
        return jsonify(
            {
                "access_token": access_token,
                "role": role,
                "username": username,
                "sales_id": sales_id,
            }
        )


@app.route("/api/forgot_password/verify", methods=["POST"])
def handle_verification_api():
    data = request.json
    username = data.get("username")
    name = data.get("name")
    birth_year = data.get("birth_year")
    birth_month = data.get("birth_month")
    birth_day = data.get("birth_day")
    email = data.get("email")
    command = [
        "./main",
        "verify_sales_identity",
        str(username),
        str(name),
        str(birth_year),
        str(birth_month),
        str(birth_day),
        str(email),
    ]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"message": "验证成功"})


@app.route("/api/forgot_password/reset", methods=["POST"])
def handle_password_reset_api():
    data = request.json
    username = data["username"]
    new_password = data["new_password"]
    command = ["./main", "reset_password", username, new_password]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/add_user", methods=["POST"])
def add_user():
    data = request.json
    user_data_string = data["userData"]
    command = ["./main", "add_user", user_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/delete_user/<user_id>", methods=["DELETE"])
def delete_user(user_id):
    command = ["./main", "delete_user", str(user_id)]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/update_user", methods=["PUT"])
def update_user():
    data = request.get_json()
    user_data_string = data["userData"]
    command = ["./main", "update_user", user_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


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
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/add_client", methods=["POST"])
def add_client():
    data = request.json
    client_data_string = data["clientData"]
    command = ["./main", "add_client", client_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/delete_client/<client_id>", methods=["DELETE"])
def delete_client(client_id):
    command = ["./main", "delete_client", str(client_id)]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/update_client", methods=["PUT"])
def update_client():
    data = request.get_json()
    client_data_string = data["clientData"]
    command = ["./main", "update_client", client_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


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
    filter_sales_id_str = request.args.get("filter_sales_id", "").strip()
    sort_param_string = request.args.get("sort", "")
    command = ["./main", "get_clients"]
    command.append(filter_sales_id_str)
    command.append(search_term)
    command.append(search_name)
    command.append(search_region)
    command.append(search_address)
    command.append(search_legal_person)
    command.append(search_size)
    command.append(search_contact_level)
    command.append(search_email)
    command.append(search_contact_count)
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        valid_sort_args = [arg for arg in sort_args if arg.strip()]
        if valid_sort_args:
            command.extend(valid_sort_args)
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
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


@app.route("/api/add_sales", methods=["POST"])
def add_sales():
    data = request.json
    sales_data_string = data["salesData"]
    command = ["./main", "add_sales", sales_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/delete_sales/<sales_id>", methods=["DELETE"])
def delete_sales(sales_id):
    command = ["./main", "delete_sales", sales_id]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/update_sales", methods=["PUT"])
def update_sales():
    data = request.get_json()
    sales_data_string = data["salesData"]
    command = ["./main", "update_sales", sales_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/fetch_sales", methods=["GET"])
def get_sales():
    search_term = request.args.get("query", "").strip()
    search_name = request.args.get("name", "").strip()
    search_email = request.args.get("email", "").strip()
    search_client_count = request.args.get("client_count", "").strip()
    sort_param_string = request.args.get("sort", "")
    command = ["./main", "get_sales"]
    command.append(search_term)
    command.append(search_name)
    command.append(search_email)
    command.append(search_client_count)
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        valid_sort_args = [arg for arg in sort_args if arg.strip()]
        if valid_sort_args:
            command.extend(valid_sort_args)
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
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
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/clients/<client_id>/contacts", methods=["GET"])
def get_client_contacts(client_id):
    command = ["./main", "display_client_contacts", str(client_id)]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/fetch_sales_ids_names", methods=["GET"])
def get_sales_ids_names():
    command = ["./main", "display_sales_ids_names"]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/add_communication", methods=["POST"])
def add_communication():
    data = request.json
    comm_data_string = data["communicationData"]
    command = ["./main", "add_communication", comm_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/update_communication", methods=["PUT"])
def update_communication():
    data = request.get_json()
    comm_data_string = data["communicationData"]
    command = ["./main", "update_communication", comm_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/fetch_communications", methods=["GET"])
def get_communications():
    search_term = request.args.get("query", "").strip()
    search_client_id = request.args.get("client_id", "").strip()
    search_contact_id = request.args.get("contact_id", "").strip()
    search_sales_id = request.args.get("sales_id", "").strip()
    search_duration = request.args.get("duration", "").strip()
    search_content = request.args.get("content", "").strip()
    sort_param_string = request.args.get("sort", "")
    filter_sales_id_str = request.args.get("filter_sales_id", "").strip()
    command = ["./main", "get_communications"]
    command.append(filter_sales_id_str)
    command.append(search_term)
    command.append(search_client_id)
    command.append(search_contact_id)
    command.append(search_sales_id)
    command.append(search_duration)
    command.append(search_content)
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        valid_sort_args = [arg for arg in sort_args if arg.strip()]
        if valid_sort_args:
            command.extend(valid_sort_args)
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
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
        return jsonify({"error": error}), 500
    else:
        return jsonify({"output": output})


@app.route("/api/change_password", methods=["POST"])
def change_password():
    data = request.json
    username = data["username"]
    old_password = data["old_password"]
    new_password = data["new_password"]
    confirm_new_password = data.get("confirm_new_password")
    command = [
        "./main",
        "change_password",
        username,
        old_password,
        new_password,
        confirm_new_password,
    ]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/add_group", methods=["POST"])
def add_group():
    data = request.json
    group_data_string = data["groupData"]
    command = ["./main", "add_group", group_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/fetch_groups", methods=["GET"])
def get_groups():
    search_term = request.args.get("query", "").strip()
    search_name = request.args.get("name", "").strip()
    search_client_count = request.args.get("client_count", "").strip()
    sort_param_string = request.args.get("sort", "")
    command = ["./main", "get_groups"]
    command.append(search_term)
    command.append(search_name)
    command.append(search_client_count)
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        valid_sort_args = [s for s in sort_args if s.strip("-").isdigit()]
        if valid_sort_args:
            command.extend(valid_sort_args)
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
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
        return jsonify({"error": "请求无效，需要 groupData"}), 400
    group_data_string = data["groupData"]
    command = ["./main", "update_group", group_data_string]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/delete_group/<group_id>", methods=["DELETE"])
def delete_group(group_id):
    command = ["./main", "delete_group", group_id]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/backups", methods=["GET"])
def list_backups():
    command = ["./main", "list_backups"]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        backup_list = []
        if output:
            lines = output.strip().split("\n")
            for line in lines:
                if line.strip():
                    parts = line.split("|", 1)
                    if len(parts) == 2:
                        backup_list.append(
                            {
                                "filename": parts[0].strip(),
                                "timestamp": parts[1].strip(),
                            }
                        )
        return jsonify({"backups": backup_list})


@app.route("/api/backups", methods=["POST"])
def create_backup_endpoint():
    command = ["./main", "create_backup"]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/backups/<backup_name>", methods=["DELETE"])
def delete_backup_endpoint(backup_name):
    command = ["./main", "delete_backup", backup_name]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


@app.route("/api/backups/<backup_name>/restore", methods=["POST"])
def restore_backup_endpoint(backup_name):
    command = ["./main", "restore_backup", backup_name]
    output, error = run_c_backend(command)
    if error:
        return jsonify({"error": error}), 400
    else:
        return jsonify({"output": output})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
