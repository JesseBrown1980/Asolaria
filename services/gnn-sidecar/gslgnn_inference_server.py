#!/usr/bin/env python3
# gslgnn_inference_server.py — :4793 endpoint serving the W9-3 GSLGNN v2 checkpoint.
# Mirrors acer-side server. Loads gslgnn-trained-2026-04-29.pt + serves /infer.
import json
import sys
from pathlib import Path
from http.server import BaseHTTPRequestHandler, HTTPServer

import torch

SIDECAR_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SIDECAR_DIR))
from models.gsl_gnn import GSLGNN

CHECKPOINT_PATH = SIDECAR_DIR / "gslgnn-trained-2026-04-29.pt"
EXPECTED_SHA = "9e50723b10c9de5c27baa5bc9386340bf72f76bcae2877064a47e4627a86602c"

MODEL = GSLGNN(node_input_dim=6, hidden_dim=64)
state_dict = torch.load(str(CHECKPOINT_PATH), map_location="cpu")
MODEL.load_state_dict(state_dict)
MODEL.eval()

DISCLOSURE = "label_rule_learnability_not_unseen_pattern_generalization"


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *_): pass

    def do_POST(self):
        try:
            if self.path != "/infer":
                raise ValueError("POST /infer only")
            payload = json.loads(self.rfile.read(int(self.headers.get("Content-Length", "0"))))
            nodes = payload["nodes"]
            edges = payload["edges"]
            if any(len(x) != 6 for x in nodes) or any(len(x) != 2 for x in edges):
                raise ValueError("expected nodes[*]=6, edges[*]=2")
            node_features = torch.tensor(nodes, dtype=torch.float32)
            edge_index = torch.tensor(edges, dtype=torch.long).t().contiguous()
            with torch.no_grad():
                scores = MODEL(node_features, edge_index)
            scores_list = scores.reshape(-1).tolist()
            body = {
                "scores": [float(v) for v in scores_list],
                "ok": True,
                "model_class": "GSLGNN",
                "checkpoint_sha256_expected": EXPECTED_SHA,
                "disclosure": DISCLOSURE,
            }
            code = 200
        except Exception as ex:
            body = {"ok": False, "reason": str(ex)}
            code = 400
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(body).encode())


if __name__ == "__main__":
    print(f"liris GSLGNN sidecar :4793 — loaded {CHECKPOINT_PATH.name}")
    HTTPServer(("0.0.0.0", 4793), Handler).serve_forever()
