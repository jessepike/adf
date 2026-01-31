"""External Review MCP Server — calls external LLMs for Phase 2 reviews."""

import os
import sys
from pathlib import Path

from mcp.server.fastmcp import FastMCP

from config import load_models_config, resolve_api_key

# Resolve config paths
SKILL_DIR = Path(__file__).parent.parent
SERVER_DIR = Path(__file__).parent
MODELS_YAML = Path.home() / ".claude" / "models.yaml"

# Load models config at startup
_models_config = load_models_config(MODELS_YAML)

mcp = FastMCP("external-review")


@mcp.tool()
def list_models() -> dict:
    """List available external review models from ~/.claude/models.yaml."""
    models = []
    for model_id, model_cfg in _models_config["models"].items():
        api_key = resolve_api_key(model_cfg)
        models.append({
            "id": model_id,
            "provider": model_cfg["provider"],
            "model": model_cfg["model"],
            "available": api_key is not None,
        })
    return {"models": models}


def main():
    mcp.run(transport="stdio")


if __name__ == "__main__":
    main()
