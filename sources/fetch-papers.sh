#!/bin/sh
# Downloads the example papers from arXiv for local use (not redistributed in this repo).
cd "$(dirname "$0")"
curl -L -o vaswani-2017-attention-is-all-you-need.pdf https://arxiv.org/pdf/1706.03762
curl -L -o bahdanau-2014-align-and-translate.pdf https://arxiv.org/pdf/1409.0473
