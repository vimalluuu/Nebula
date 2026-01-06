import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from datetime import datetime

class AnomalyDetector:
    def __init__(self):
        self.isolation_forest = IsolationForest(contamination=0.2, random_state=42)
        
    def detect_anomalies(self, tender_id, bids):
        """
        Detect anomalies in bid submissions using hybrid approach:
        - Rule-based detection
        - Isolation Forest ML model
        """
        if len(bids) < 2:
            return {
                'tenderId': tender_id,
                'riskScore': 0,
                'explanation': 'Insufficient bids for anomaly detection',
                'flags': [],
                'bidAnalysis': []
            }
        
        # Extract features
        amounts = [bid['amount'] for bid in bids]
        timestamps = [bid.get('submittedAt', datetime.now().isoformat()) for bid in bids]
        
        # Rule-based detection
        rule_flags = self._rule_based_detection(bids, amounts, timestamps)
        
        # ML-based detection
        ml_flags = self._ml_based_detection(bids, amounts)
        
        # Combine results
        all_flags = rule_flags + ml_flags
        risk_score = min(len(all_flags) * 25, 100)  # 25 points per flag, max 100
        
        # Generate explanation
        explanation = self._generate_explanation(all_flags, len(bids))
        
        # Analyze each bid
        bid_analysis = self._analyze_individual_bids(bids, amounts, all_flags)
        
        return {
            'tenderId': tender_id,
            'riskScore': risk_score,
            'explanation': explanation,
            'flags': all_flags,
            'bidAnalysis': bid_analysis
        }
    
    def _rule_based_detection(self, bids, amounts, timestamps):
        """Rule-based anomaly detection"""
        flags = []
        
        # Check for identical bid amounts
        unique_amounts = len(set(amounts))
        if unique_amounts < len(amounts):
            flags.append({
                'type': 'IDENTICAL_BIDS',
                'severity': 'HIGH',
                'description': 'Multiple bids with identical amounts detected - possible collusion'
            })
        
        # Check for price outliers (>2 standard deviations)
        mean_amount = np.mean(amounts)
        std_amount = np.std(amounts)
        
        for i, amount in enumerate(amounts):
            if abs(amount - mean_amount) > 2 * std_amount:
                flags.append({
                    'type': 'PRICE_OUTLIER',
                    'severity': 'MEDIUM',
                    'description': f'Bid {i+1} amount significantly deviates from average',
                    'bidId': bids[i]['id']
                })
        
        # Check for suspiciously low bids (potential underbidding)
        min_amount = min(amounts)
        if min_amount < mean_amount * 0.5:
            flags.append({
                'type': 'SUSPICIOUS_LOW_BID',
                'severity': 'MEDIUM',
                'description': 'Bid amount is suspiciously low (< 50% of average)'
            })
        
        # Check for timing patterns (bids submitted within 1 minute)
        try:
            parsed_times = [datetime.fromisoformat(ts.replace('Z', '+00:00')) for ts in timestamps]
            for i in range(len(parsed_times) - 1):
                time_diff = abs((parsed_times[i+1] - parsed_times[i]).total_seconds())
                if time_diff < 60:
                    flags.append({
                        'type': 'SUSPICIOUS_TIMING',
                        'severity': 'MEDIUM',
                        'description': 'Multiple bids submitted within 1 minute - possible coordination'
                    })
                    break
        except:
            pass  # Skip timing analysis if timestamps are invalid
        
        return flags
    
    def _ml_based_detection(self, bids, amounts):
        """ML-based anomaly detection using Isolation Forest"""
        flags = []
        
        if len(amounts) < 3:
            return flags
        
        # Prepare features
        features = np.array(amounts).reshape(-1, 1)
        
        # Train and predict
        predictions = self.isolation_forest.fit_predict(features)
        
        # Flag anomalies
        for i, pred in enumerate(predictions):
            if pred == -1:  # Anomaly detected
                flags.append({
                    'type': 'ML_ANOMALY',
                    'severity': 'MEDIUM',
                    'description': f'ML model flagged bid {i+1} as anomalous',
                    'bidId': bids[i]['id']
                })
        
        return flags
    
    def _generate_explanation(self, flags, num_bids):
        """Generate human-readable explanation"""
        if not flags:
            return f'No anomalies detected in {num_bids} bids. All submissions appear normal.'
        
        high_severity = sum(1 for f in flags if f['severity'] == 'HIGH')
        medium_severity = sum(1 for f in flags if f['severity'] == 'MEDIUM')
        
        explanation = f'Detected {len(flags)} potential irregularities in {num_bids} bids. '
        
        if high_severity > 0:
            explanation += f'{high_severity} high-severity issues require immediate investigation. '
        if medium_severity > 0:
            explanation += f'{medium_severity} medium-severity issues detected. '
        
        explanation += 'Review flagged bids carefully before awarding contract.'
        
        return explanation
    
    def _analyze_individual_bids(self, bids, amounts, flags):
        """Analyze each bid individually"""
        mean_amount = np.mean(amounts)
        
        analysis = []
        for i, bid in enumerate(bids):
            bid_flags = [f for f in flags if f.get('bidId') == bid['id']]
            deviation = ((bid['amount'] - mean_amount) / mean_amount) * 100
            
            analysis.append({
                'bidId': bid['id'],
                'vendorName': bid.get('vendorName', 'Unknown'),
                'amount': bid['amount'],
                'deviationFromMean': round(deviation, 2),
                'flagCount': len(bid_flags),
                'flags': bid_flags,
                'riskLevel': 'HIGH' if len(bid_flags) >= 2 else 'MEDIUM' if len(bid_flags) == 1 else 'LOW'
            })
        
        return analysis

detector = AnomalyDetector()
