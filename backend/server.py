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


@app.route("/api/add_client", methods=["POST"])
def add_client():
    data = request.json
    process = subprocess.Popen(
        [
            "./main",
            "add_client",
            str(data["id"]),
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
    # 使用 subprocess 启动 C 程序，获取客户端列表
    process = subprocess.Popen(
        ["./main", "list_client"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )

    # 与 C 程序进行交互，获取输出和错误信息
    output, error = process.communicate()

    # 将 C 程序的输出和错误信息打包成 JSON 对象，并返回给前端
    return jsonify({"output": output, "error": error})


# 如果是直接运行该脚本，则启动 Flask 应用
if __name__ == "__main__":
    # 启动 Flask 开发服务器，监听所有网络接口和 5000 端口
    app.run(debug=True, host="0.0.0.0", port=5000)
