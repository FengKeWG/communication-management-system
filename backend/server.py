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
        [
            "./main",
            "login",
            data["username"],
            data["password"],
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()
    print(f"--- C Program Output ---")
    print(f"STDOUT raw: '{output}' (length: {len(output)})")
    print(f"STDERR raw: '{error}' (length: {len(error)})")
    print(f"------------------------")
    if error:
        return jsonify({"error": error.strip()}), 400
    parts = output.strip().split()
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
    if error:
        return jsonify({"error": error.strip()}), 400
    return jsonify({"output": output.strip()})


@app.route("/api/delete_client/<client_id>", methods=["DELETE"])
def delete_client(client_id):
    process = subprocess.Popen(
        [
            "./main",
            "delete_client",
            str(client_id),
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()
    # print(f"后端报错：{error}")
    # print(f"后端输出：{output}")
    if error:
        return jsonify({"error": error.strip()}), 400
    return jsonify({"output": output.strip()})


@app.route("/api/update_client", methods=["PUT"])
def update_client():
    data = request.get_json()
    process = subprocess.Popen(
        [
            "./main",
            "update_client",
            data["clientData"],
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()
    if error:
        return jsonify({"error": error.strip()}), 400
    return jsonify({"output": output.strip()})


@app.route("/api/add_client", methods=["POST"])
def add_client():
    data = request.json
    process = subprocess.Popen(
        [
            "./main",
            "add_client",
            data["clientData"],
        ],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()
    # print(f"后端报错：{error}")
    # print(f"后端输出：{output}")
    if error:
        return jsonify({"error": error.strip()}), 400
    return jsonify({"output": output.strip()})


@app.route("/api/fetch_clients", methods=["GET"])
def get_clients():
    search_term = request.args.get("query", "").strip()
    sort_param_string = request.args.get("sort", "")
    command = [
        "./main",
        "get_clients",
    ]
    command.append(search_term if search_term else "")
    if sort_param_string:
        sort_args = sort_param_string.split(",")
        command.extend(sort_args)
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    output, error = process.communicate()
    print(f"后端报错：{error}")
    print(f"后端输出：{output}")
    if error:
        return jsonify({"error": error.strip()}), 400
    return jsonify({"output": output.strip()})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
