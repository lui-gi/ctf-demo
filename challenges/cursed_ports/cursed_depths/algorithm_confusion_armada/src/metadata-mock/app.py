"""metadata-mock — pretends to be the AWS instance-metadata service at
169.254.169.254. Serves the dispatcher's IAM credentials at the canonical
path. The credentials it returns are the SAME ones minio is configured with
so the player can sign valid SigV4 requests.

Run inside docker compose; the network alias 169.254.169.254 is provided
by the compose IPAM block (see docker-compose.yml).
"""
from __future__ import annotations

import json
import os
from datetime import datetime, timedelta, timezone

from flask import Flask, jsonify

ACCESS_KEY = os.environ.get("ARMADA_AKID", "AKIADISPATCHERVERY01")
SECRET_KEY = os.environ.get("ARMADA_SECRET", "DISPATCHERSECRET00ABCDEFGHIJKLMNOPQRSTUVW")
SESSION_TOKEN = os.environ.get("ARMADA_TOKEN", "FwoGZXIvYXdzELMARMADASESSION")

app = Flask(__name__)


@app.route("/latest/meta-data/iam/security-credentials/")
def list_role():
    # Standard AWS endpoint: returns just the role name.
    return "dispatcher\n", 200, {"Content-Type": "text/plain"}


@app.route("/latest/meta-data/iam/security-credentials/dispatcher")
def get_creds():
    expiration = (datetime.now(tz=timezone.utc) + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
    return jsonify(
        {
            "Code": "Success",
            "LastUpdated": datetime.now(tz=timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "Type": "AWS-HMAC",
            "AccessKeyId": ACCESS_KEY,
            "SecretAccessKey": SECRET_KEY,
            "Token": SESSION_TOKEN,
            "Expiration": expiration,
        }
    )


@app.route("/healthz")
def health():
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=80)
