from flask import Flask, request, jsonify
from flask_cors import CORS
from detector import detector

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'OK', 'message': 'AI service running'})

@app.route('/detect', methods=['POST'])
def detect_anomalies():
    try:
        data = request.get_json()
        tender_id = data.get('tenderId')
        bids = data.get('bids', [])
        
        if not tender_id or not bids:
            return jsonify({'error': 'Missing tenderId or bids'}), 400
        
        result = detector.detect_anomalies(tender_id, bids)
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print('🤖 AI Anomaly Detection Service starting...')
    print('📊 Isolation Forest model initialized')
    print('🔍 Rule-based detection enabled')
    app.run(host='0.0.0.0', port=5001, debug=True)
