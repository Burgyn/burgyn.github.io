#!/bin/bash

# Generate a code image using carbon-now-cli.
# Usage: generate.sh <code_file> <output_dir> <output_name>
#   code_file   - Path to temp file with code (use correct extension for language, e.g. .cs for C#)
#   output_dir  - Directory to save the image (e.g. assets/images/code_images/mmlib-dummyapi)
#   output_name - Filename without extension (e.g. 1 or example-snippet)

set -e

if [ $# -lt 3 ]; then
  echo "Usage: $0 <code_file> <output_dir> <output_name>"
  exit 1
fi

CODE_FILE="$1"
OUTPUT_DIR="$2"
OUTPUT_NAME="$3"

if [ ! -f "$CODE_FILE" ]; then
  echo "Error: Code file not found: $CODE_FILE"
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/../carbon-now.json"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "Error: Config not found: $CONFIG_FILE"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

npx --yes carbon-now-cli "$CODE_FILE" \
  --config "$CONFIG_FILE" \
  --preset burgyn-blog \
  --settings '{"titleBar":""}' \
  --save-to "$OUTPUT_DIR" \
  --save-as "$OUTPUT_NAME" \
  --skip-display

echo "$OUTPUT_DIR/${OUTPUT_NAME}.png"
