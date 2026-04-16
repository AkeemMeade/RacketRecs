from flask import Flask, jsonify, request
from flask_cors import CORS
from MachineLearning import get_rec
app= Flask(__name__)
CORS(app, origins=["http://localhost:3000"])

#routes the data to react
@app.route('/api/recommend', methods = ['POST'])
def recommend():
    user_ans = request.get_json()
    rec = get_rec(user_ans)
    return jsonify(rec)

@app.route('/')
def message():
    return jsonify({"text": "Flask setup"})

if __name__=='__main__':
    app.run(debug = True, port=3001)