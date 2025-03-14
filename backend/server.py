from flask import Flask, request, jsonify
import subprocess

app = Flask(__name__, static_folder='../frontend', static_url_path='')

@app.route('/')
def index():
    return app.send_static_file('index.html')

@app.route('/api/add_client', methods=['POST'])
def add_client():
    data = request.json
    input_data = (
        f"{data['id']}\n"
        f"{data['name']}\n"
        f"{data['region']}\n"
        f"{data['address']}\n"
        f"{data['legal_person']}\n"
        f"{data['size']}\n"
        f"{data['contact_level']}\n"
        f"{data['email']}\n"
        f"{data['phones']}\n"
        f"\n"
    )
    process = subprocess.Popen(["./main", "add"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    output, error = process.communicate(input=input_data)
    return jsonify({"output": output, "error": error})

@app.route('/api/list_clients', methods=['GET'])
def list_clients():
    process = subprocess.Popen(["./main", "list"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    output, error = process.communicate()
    return jsonify({"output": output, "error": error})

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)