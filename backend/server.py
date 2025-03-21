from flask import Flask, request, jsonify
import subprocess

# 创建 Flask 应用实例，指定静态文件目录
app = Flask(__name__, static_folder="../frontend", static_url_path="")


# 定义根路由，用于提供前端页面
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

    parts = output.strip().split()  # strip()去除空格，split()转换为数组
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


@app.route("/api/delete_client/<client_id>", methods=["DELETE"])  # 使用 DELETE 方法
def delete_client(client_id):  # 接收 client_id 作为参数
    # data = request.get_json()  不需要从 JSON 中获取，直接使用 URL 参数
    # client_id = data.get("id")
    process = subprocess.Popen(
        ["./main", "delete_client", str(client_id)],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()
    if error:
        return jsonify({"error": error.strip()}), 400  # 错误处理
    return jsonify({"output": output.strip(), "error": error.strip()})


@app.route("/api/update_client/<client_id>", methods=["PUT"])  # 使用 PUT 方法
def update_client(client_id):  # 接收 client_id 作为参数
    data = request.get_json()
    # 将字典转换为列表，并按C程序期望的顺序排列
    client_data = [
        data.get("name", ""),
        data.get("region", ""),
        data.get("address", ""),
        data.get("legal_person", ""),
        str(data.get("size", 0)),  # 转换为字符串，如果为空则为 "0"
        str(data.get("contact_level", 0)),  # 转换为字符串，如果为空则为 "0"
        data.get("email", ""),
        data.get("phones", ""),
    ]
    process = subprocess.Popen(
        ["./main", "update_client", str(client_id)]
        + client_data,  # 将 client_id 加到参数列表
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
    process = subprocess.Popen(
        [
            "./main",
            "add_client",
            "",
            data["name"],
            data["region"],
            data["address"],
            data["legal_person"],
            str(data["size"]),
            str(data["contact_level"]),
            data["email"],
            data["phones"],
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()
    return jsonify({"output": output.strip(), "error": error.strip()})


# 定义 /api/list_clients 路由，用于处理获取客户端列表的 GET 请求
@app.route("/api/list_clients", methods=["GET"])
def list_clients():
    process = subprocess.Popen(
        ["./main", "list_client"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()
    print("C program output:", output)  # 调试：打印 C 程序的输出
    print("C program error:", error)  # 调试：打印 C 程序的错误
    return jsonify({"output": output, "error": error})


# 如果是直接运行该脚本，则启动 Flask 应用
if __name__ == "__main__":
    # 启动 Flask 开发服务器，监听所有网络接口和 5000 端口
    app.run(debug=True, host="0.0.0.0", port=5000)
