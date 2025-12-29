import joblib
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.metrics import roc_auc_score, mean_absolute_error
from sklearn.model_selection import train_test_split

from features.build_features import build_features

DATASET = "datasets/sample_trips.csv"
MODEL_OUT = "../../../models/delay/model.pkl"

def train():
    X, y_cls, y_reg = build_features(DATASET)

    X_train, X_test, y_cls_train, y_cls_test, y_reg_train, y_reg_test = \
        train_test_split(X, y_cls, y_reg, test_size=0.2, random_state=42)

    clf = RandomForestClassifier(n_estimators=200, random_state=42)
    reg = RandomForestRegressor(n_estimators=200, random_state=42)

    clf.fit(X_train, y_cls_train)
    reg.fit(X_train, y_reg_train)

    cls_pred = clf.predict_proba(X_test)[:, 1]
    reg_pred = reg.predict(X_test)

    print("ROC-AUC:", roc_auc_score(y_cls_test, cls_pred))
    print("MAE (delay min):", mean_absolute_error(y_reg_test, reg_pred))

    joblib.dump(
        {"classifier": clf, "regressor": reg},
        MODEL_OUT
    )

    print("Model saved to", MODEL_OUT)

if __name__ == "__main__":
    train()
