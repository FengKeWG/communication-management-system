from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__, static_folder="../frontend", static_url_path="")


@app.route("/")
def index():
    return app.send_static_file("index.html")


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    process = subprocess.Popen(
        ["./main", "login", data["username"], data["password"]],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()

    if error:
        return jsonify({"error": "登录失败，服务器错误"}), 500

    parts = output.strip().split()
    if len(parts) != 2:
        return jsonify({"error": "登录失败，用户名或密码错误"}), 401

    username, role = parts
    access_token = f"token_{username}"

    return jsonify({"access_token": access_token, "role": role})


@app.route("/api/add_user", methods=["POST"])
def add_user():
    data = request.json
    process = subprocess.Popen(
        [
            "./main",
            "add_user",
            data["username"],
            data["password"],
            data["role"],
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()
    return jsonify({"output": output.strip(), "error": error.strip()})


@app.route("/api/delete_client/<client_id>", methods=["DELETE"])
def delete_client(client_id):
    process = subprocess.Popen(
        ["./main", "delete_client", str(client_id)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()
    if error:
        return jsonify({"error": error.strip()}), 400
    return jsonify({"output": output.strip(), "error": error.strip()})


@app.route("/api/update_client", methods=["PUT"])
def update_client():
    data = request.get_json()
    client_string = data.get("clientData")
    process = subprocess.Popen(
        [
            "./main",
            "update_client",
            client_string,
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()
    if error:
        return jsonify({"error": error.strip()}), 400  # 错误处理
    return jsonify({"output": output.strip(), "error": error.strip()})


@app.route("/api/add_client", methods=["POST"])
def add_client():
    data = request.json
    client_string = data.get("clientData")
    process = subprocess.Popen(
        [
            "./main",
            "add_client",
            client_string,
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()
    print(f"后端报错：{error}")
    print(f"后端输出：{output}")
    return jsonify({"output": output.strip(), "error": error.strip()})


@app.route("/api/fetch_clients", methods=["GET"])
def get_clients():
    # 从请求URL中获取 query 参数，如果不存在则为空字符串
    search_term = request.args.get("query", "").strip()
    # 从请求URL中获取 sort 参数，如果不存在则为空字符串
    sort_param_string = request.args.get("sort", "")

    # 构建调用 C 程序的命令，使用一个新的命令名，如 "get_clients"
    command = ["./main", "get_clients"]

    # 添加搜索词参数 (即使为空也传递，让C程序知道没有搜索词)
    command.append(
        search_term if search_term else ""
    )  # 如果 search_term 为空，传递空字符串

    # 添加排序参数 (如果存在)
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        # 校验排序参数格式 (可选但推荐)
        valid_sort_args = [
            arg
            for arg in sort_args
            if arg and (arg.isdigit() or (arg.startswith("-") and arg[1:].isdigit()))
        ]
        if valid_sort_args:
            command.extend(valid_sort_args)
    # else: # 可选项：如果没有提供排序参数，可以添加一个默认排序，例如按ID升序
    #     command.append('1')

    print("准备执行命令:", command)  # 调试信息
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()
    print("C 程序 stdout:", output.strip())  # 调试信息
    if error:
        print("C 程序 stderr:", error.strip())  # 调试信息
        # 将错误信息返回给前端
        return jsonify({"output": "", "error": error.strip()}), 500  # 或 400

    # 成功时，返回输出，错误信息为空字符串
    return jsonify({"output": output.strip(), "error": ""})


# 如果是直接运行该脚本，则启动 Flask 应用
if __name__ == "__main__":
    # 启动 Flask 开发服务器，监听所有网络接口和 5000 端口
    app.run(debug=True, host="0.0.0.0", port=5000)
