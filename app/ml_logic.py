import pandas as pd
import numpy as np
import os
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score

class WebhookMLSystem:
    def __init__(self, data_dir='data', model_dir='models'):
        self.data_dir = data_dir
        self.model_dir = model_dir
        os.makedirs(model_dir, exist_ok=True)
        
        self.le_event_type = LabelEncoder()
        self.le_priority = LabelEncoder()
        self.le_http_status = LabelEncoder()
        self.le_response_category = LabelEncoder()
        
        self.clf_replay = RandomForestClassifier(n_estimators=100, random_state=42)
        self.clf_reason = RandomForestClassifier(n_estimators=100, random_state=42)
        self.clf_action = RandomForestClassifier(n_estimators=100, random_state=42)
        
        self.endpoint_stats = {}
        self.loaded = False
        
    def _prepare_features(self, events_df, attempts_df, endpoints_df, is_training=False):
        attempts_agg = attempts_df.groupby('event_id').agg({
            'attempt_number': 'max',
            'http_status': lambda x: list(x)[-1] if len(x) > 0 else 0,
            'response_time_ms': 'mean',
            'response_body_category': lambda x: list(x)[-1] if len(x) > 0 else 'none',
            'timeout': 'sum',
            'signature_valid': 'all'
        }).reset_index()
        
        df = events_df.merge(attempts_agg, on='event_id', how='left')
        
        event_endpoint_map = attempts_df[['event_id', 'endpoint_id']].drop_duplicates()
        df = df.merge(event_endpoint_map, on='event_id', how='left')
        df = df.merge(endpoints_df, on='endpoint_id', how='left')
        
        df['payload_size_kb'] = df['payload_size_kb'].fillna(0)
        df['response_time_ms'] = df['response_time_ms'].fillna(0)
        df['attempt_number'] = df['attempt_number'].fillna(0)
        df['http_status'] = df['http_status'].fillna(0)
        df['response_body_category'] = df['response_body_category'].fillna('none')
        df['timeout'] = df['timeout'].fillna(0)
        df['signature_valid'] = df['signature_valid'].fillna(True)
        
        if is_training:
            df['event_type_encoded'] = self.le_event_type.fit_transform(df['event_type'].astype(str))
            df['priority_encoded'] = self.le_priority.fit_transform(df['priority'].astype(str))
            df['http_status_encoded'] = self.le_http_status.fit_transform(df['http_status'].astype(str))
            df['response_category_encoded'] = self.le_response_category.fit_transform(df['response_body_category'].astype(str))
        else:
            def safe_transform(le, series):
                classes = list(le.classes_)
                return series.apply(lambda x: le.transform([x])[0] if x in classes else 0)
                
            df['event_type_encoded'] = safe_transform(self.le_event_type, df['event_type'].astype(str))
            df['priority_encoded'] = safe_transform(self.le_priority, df['priority'].astype(str))
            df['http_status_encoded'] = safe_transform(self.le_http_status, df['http_status'].astype(str))
            df['response_category_encoded'] = safe_transform(self.le_response_category, df['response_body_category'].astype(str))
        
        feature_cols = [
            'payload_size_kb', 'attempt_number', 'response_time_ms', 'timeout',
            'signature_valid', 'event_type_encoded', 'priority_encoded',
            'http_status_encoded', 'response_category_encoded',
            'avg_success_rate', 'rate_limit_per_minute'
        ]
        
        for col in ['avg_success_rate', 'rate_limit_per_minute']:
            if col in df.columns:
                df[col] = df[col].fillna(df[col].mean() if df[col].mean() is not np.nan else 0)
            else:
                df[col] = 0
                
        return df, feature_cols
        
    def train(self):
        print("Loading datasets...")
        events_df = pd.read_csv(f"{self.data_dir}/webhook_events.csv")
        attempts_df = pd.read_csv(f"{self.data_dir}/delivery_attempts.csv")
        endpoints_df = pd.read_csv(f"{self.data_dir}/endpoints.csv")
        labels_df = pd.read_csv(f"{self.data_dir}/labels_train.csv")
        
        print("Preparing features...")
        df, feature_cols = self.prepare_training_data(events_df, attempts_df, endpoints_df, labels_df)
        
        X = df[feature_cols]
        
        y_replay = df['safe_to_replay'].astype(int)
        print("Training Replay Confidence Model...")
        self.clf_replay.fit(X, y_replay)
        preds = self.clf_replay.predict(X)
        print(f"Replay Accuracy: {accuracy_score(y_replay, preds):.4f}")
        
        y_reason = df['failure_reason']
        print("Training Failure Reason Model...")
        self.clf_reason.fit(X, y_reason)
        preds_reason = self.clf_reason.predict(X)
        print(f"Reason Accuracy: {accuracy_score(y_reason, preds_reason):.4f}")
        
        y_action = df['recommended_action']
        print("Training Recommendation Model...")
        self.clf_action.fit(X, y_action)
        preds_action = self.clf_action.predict(X)
        print(f"Action Accuracy: {accuracy_score(y_action, preds_action):.4f}")
        
        self.compute_endpoint_health(attempts_df)
        
        self.save_models()
        print("Models saved successfully.")
        
    def prepare_training_data(self, events_df, attempts_df, endpoints_df, labels_df):
        train_events = events_df[events_df['event_id'].isin(labels_df['event_id'])]
        df, feature_cols = self._prepare_features(train_events, attempts_df, endpoints_df, is_training=True)
        
        df = df.merge(labels_df, on='event_id', how='inner')
        return df, feature_cols

    def compute_endpoint_health(self, attempts_df):
        """
        Calculate health score (0-100) based on recent attempts.
        A healthy endpoint has a high success rate, low timeouts, and low server errors.
        """
        print("Computing Endpoint Health Scores...")
        stats = attempts_df.groupby('endpoint_id').apply(
            lambda x: pd.Series({
                'total_attempts': len(x),
                'success_rate': (x['http_status'] == 200).mean(),
                'timeout_rate': x['timeout'].mean(),
                'error_rate': (x['http_status'] >= 500).mean(),
                'rate_limit_rate': (x['http_status'] == 429).mean()
            })
        ).reset_index()
        
        stats['health_score'] = 100 - (stats['timeout_rate'] * 40) - (stats['error_rate'] * 50) - (stats['rate_limit_rate'] * 20)
        stats['health_score'] = stats['health_score'] * (0.5 + 0.5 * stats['success_rate'])
        stats['health_score'] = stats['health_score'].clip(0, 100).round(2)
        
        self.endpoint_stats = dict(zip(stats['endpoint_id'], stats['health_score']))
        return self.endpoint_stats

    def save_models(self):
        joblib.dump(self.clf_replay, f"{self.model_dir}/clf_replay.pkl")
        joblib.dump(self.clf_reason, f"{self.model_dir}/clf_reason.pkl")
        joblib.dump(self.clf_action, f"{self.model_dir}/clf_action.pkl")
        joblib.dump(self.endpoint_stats, f"{self.model_dir}/endpoint_health.pkl")
        
        joblib.dump(self.le_event_type, f"{self.model_dir}/le_event_type.pkl")
        joblib.dump(self.le_priority, f"{self.model_dir}/le_priority.pkl")
        joblib.dump(self.le_http_status, f"{self.model_dir}/le_http_status.pkl")
        joblib.dump(self.le_response_category, f"{self.model_dir}/le_response_category.pkl")
        
    def load_models(self):
        self.clf_replay = joblib.load(f"{self.model_dir}/clf_replay.pkl")
        self.clf_reason = joblib.load(f"{self.model_dir}/clf_reason.pkl")
        self.clf_action = joblib.load(f"{self.model_dir}/clf_action.pkl")
        self.endpoint_stats = joblib.load(f"{self.model_dir}/endpoint_health.pkl")
        
        self.le_event_type = joblib.load(f"{self.model_dir}/le_event_type.pkl")
        self.le_priority = joblib.load(f"{self.model_dir}/le_priority.pkl")
        self.le_http_status = joblib.load(f"{self.model_dir}/le_http_status.pkl")
        self.le_response_category = joblib.load(f"{self.model_dir}/le_response_category.pkl")
        self.loaded = True

    def predict(self, events_df, attempts_df, endpoints_df):
        """Predict outcomes for new events"""
        if not self.loaded:
            self.load_models()

        df, feature_cols = self._prepare_features(events_df, attempts_df, endpoints_df, is_training=False)
        X = df[feature_cols]
        
        replay_probs = self.clf_replay.predict_proba(X)
        safe_class_index = list(self.clf_replay.classes_).index(1)
        confidence_scores = replay_probs[:, safe_class_index] * 100
        
        reasons = self.clf_reason.predict(X)
        actions = self.clf_action.predict(X)
        
        results = []
        for i, row in df.iterrows():
            endpoint_id = row['endpoint_id']
            if endpoint_id in self.endpoint_stats:
                health = self.endpoint_stats[endpoint_id]
            else:
                ep_attempts = attempts_df[attempts_df['endpoint_id'] == endpoint_id]
                if len(ep_attempts) > 0:
                    success_rate = (ep_attempts['http_status'] == 200).mean()
                    timeout_rate = ep_attempts['timeout'].mean()
                    error_rate = (ep_attempts['http_status'] >= 500).mean()
                    rate_limit_rate = (ep_attempts['http_status'] == 429).mean()
                    
                    health = 100 - (timeout_rate * 40) - (error_rate * 50) - (rate_limit_rate * 20)
                    health = health * (0.5 + 0.5 * success_rate)
                    health = float(np.clip(round(health, 2), 0, 100))
                else:
                    health = 50.0
            
            results.append({
                'event_id': row['event_id'],
                'endpoint_id': endpoint_id,
                'endpoint_health_score': health,
                'replay_confidence_score': round(confidence_scores[i], 2),
                'safe_to_replay': bool(self.clf_replay.predict(X.iloc[[i]])[0]),
                'failure_reason': reasons[i],
                'recommended_action': actions[i]
            })
            
        return results

    def optimize_retry_policy(self, endpoint_id, failure_reason):
        """
        Optional RL-based retry optimization heuristic.
        Instead of a full RL environment here, we act as a policy network
        that recommends the optimal delay or action based on the state.
        """
        health = self.endpoint_stats.get(endpoint_id, 50.0)
        
        if failure_reason == 'rate_limited':
            delay = 300 if health < 60 else 60
            return {"strategy": "exponential_backoff", "initial_delay_seconds": delay, "max_retries": 3}
        elif failure_reason == 'customer_endpoint_down' or failure_reason == 'timeout':
            return {"strategy": "linear_backoff", "initial_delay_seconds": 120, "max_retries": 5}
        elif failure_reason == 'invalid_signature' or failure_reason == 'endpoint_deleted':
            return {"strategy": "halt", "initial_delay_seconds": 0, "max_retries": 0, "reason": "Requires manual configuration change."}
        else:
            return {"strategy": "immediate_retry", "initial_delay_seconds": 10, "max_retries": 3}

if __name__ == "__main__":
    system = WebhookMLSystem()
    system.train()
    
    print("\nRunning inference on test data...")
    events_df = pd.read_csv("data/events_test.csv")
    attempts_df = pd.read_csv("data/delivery_attempts.csv")
    endpoints_df = pd.read_csv("data/endpoints.csv")
    
    system.load_models()
    sample_events = events_df.head(10)
    results = system.predict(sample_events, attempts_df, endpoints_df)
    
    for r in results:
        print(r)
