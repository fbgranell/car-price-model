import optuna
from sklearn.model_selection import KFold
from xgboost import XGBRegressor
import numpy as np
from sklearn.metrics import r2_score
from optuna.integration.mlflow import MLflowCallback
import car_price_model.utils.utils as utils
from car_price_model.modeling.car_price_model import CarPriceModel
import os

utils.load_env()

MLFLOW_TRACKING_URI = os.environ["MLFLOW_TRACKING_URI"]


def optimize_hyperparameters(train_df):
    X_train, y_train = CarPriceModel.split_features(train_df)
    study = optuna.create_study(
        study_name="car_price_xgb_tuning",
        direction="maximize",
        sampler=optuna.samplers.TPESampler(seed=42),
        pruner=optuna.pruners.MedianPruner(),
    )
    study.optimize(
        lambda x: _r2_objective(x, X_train, y_train),
        n_trials=300,
        show_progress_bar=True,
        callbacks=[_get_mlflc()],
    )
    return study.best_params


def _select_params(trial):
    return {
        "n_estimators": trial.suggest_int("n_estimators", 300, 3000),
        "learning_rate": trial.suggest_float("learning_rate", 1e-3, 0.3, log=True),
        "max_depth": trial.suggest_int("max_depth", 3, 10),
        "min_child_weight": trial.suggest_int("min_child_weight", 1, 20),
        "subsample": trial.suggest_float("subsample", 0.5, 1.0),
        "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
        "gamma": trial.suggest_float("gamma", 1e-8, 10.0, log=True),
        "reg_alpha": trial.suggest_float("reg_alpha", 1e-8, 10.0, log=True),
        "reg_lambda": trial.suggest_float("reg_lambda", 1e-8, 10.0, log=True),
        "tree_method": "hist",
        "random_state": 42,
        "enable_categorical": True,
    }


def _r2_objective(trial, X_train, y_train):
    model = _define_optuna_model(trial)
    scores = []
    for X_tr, X_va, y_tr, y_va in _kfold_split(X_train, y_train):
        model.fit(X_tr, y_tr, eval_set=[(X_va, y_va)], verbose=False)
        scores.append(r2_score(y_va, model.predict(X_va)))
    return np.mean(scores).item()


def _kfold_split(X_train, y_train):
    cv = KFold(n_splits=5, shuffle=True, random_state=42)
    for train_idx, val_idx in cv.split(X_train):
        X_tr, X_va = X_train.iloc[train_idx], X_train.iloc[val_idx]
        y_tr, y_va = y_train.iloc[train_idx], y_train.iloc[val_idx]
        yield X_tr, X_va, y_tr, y_va


def _define_optuna_model(trial):
    return XGBRegressor(
        **_select_params(trial),
        early_stopping_rounds=50,
        eval_metric="rmse",
    )


def _get_mlflc():
    return MLflowCallback(tracking_uri=MLFLOW_TRACKING_URI, metric_name="val_r2")
