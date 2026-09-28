// Learning state – the single source of truth for topics, key points, status and the check log.
// Maintained by the AI agent (see AGENTS.md). Everything after "window.PROGRESS =" must stay valid JSON.
window.PROGRESS = {
  "title": "Attention & Transformers – learning from the papers",
  "goal": "Be able to explain the two papers from memory, including the key formulas.",
  "groups": [
    { "id": "1", "title": "Bahdanau et al. (2014) – Neural Machine Translation by Jointly Learning to Align and Translate", "source": "https://arxiv.org/abs/1409.0473" },
    { "id": "2", "title": "Vaswani et al. (2017) – Attention Is All You Need", "source": "https://arxiv.org/abs/1706.03762" }
  ],
  "topics": [
    { "id": "1.1", "title": "The fixed-length bottleneck of RNN encoder–decoders", "importance": 2, "page": null,
      "sources": ["Bahdanau et al., Sections 1–2"], "questions": ["Why does a single fixed-length context vector hurt translation of long sentences?"], "keypoints": [] },
    { "id": "1.2", "title": "Additive attention & soft alignment", "importance": 3, "page": null,
      "sources": ["Bahdanau et al., Section 3"], "questions": ["How are the context vector and the alignment weights computed?", "What does the alignment model learn?"], "keypoints": [] },

    { "id": "2.1", "title": "Model architecture: encoder and decoder stacks", "importance": 3, "page": "topics/2.1-model-architecture.html",
      "sources": ["Vaswani et al., Sections 1, 3.1, 3.3, 3.4, 3.5; Figure 1; Table 3"],
      "questions": [
        "Draw the Transformer and explain the purpose of every component.",
        "How does a decoder layer differ from an encoder layer?",
        "Why is masking needed in the decoder?"
      ],
      "keypoints": [
        { "id": "2.1.1", "title": "Core idea", "weight": 3, "status": "open", "checked": null, "note": "",
          "target": "The Transformer drops recurrence and convolutions entirely and relies only on attention to relate positions. Because no step depends on the previous one, computation is highly parallelisable – faster training – and any two positions are connected by a constant number of operations." },
        { "id": "2.1.2", "title": "Encoder–decoder overview", "weight": 2, "status": "open", "checked": null, "note": "",
          "target": "The encoder maps the input sequence (x1..xn) to continuous representations z = (z1..zn). Given z, the decoder generates the output (y1..ym) one symbol at a time, auto-regressively: previously generated symbols are fed back as additional input." },
        { "id": "2.1.3", "title": "Encoder layer", "weight": 3, "status": "open", "checked": null, "note": "",
          "target": "Stack of N = 6 identical layers. Each has two sub-layers: multi-head self-attention and a position-wise feed-forward network. Around each sub-layer: residual connection followed by layer normalisation, output = LayerNorm(x + Sublayer(x)). All outputs have dimension d_model = 512 so the residuals can be added." },
        { "id": "2.1.4", "title": "Decoder layer & masking", "weight": 3, "status": "open", "checked": null, "note": "",
          "target": "Also N = 6 layers, but with three sub-layers: masked multi-head self-attention, encoder–decoder attention (queries from the decoder, keys and values from the encoder output) and the feed-forward network, each with residual + LayerNorm. The mask (plus shifting the output embeddings right by one) ensures that the prediction for position i can only depend on positions < i, so training matches auto-regressive generation." },
        { "id": "2.1.5", "title": "Position-wise feed-forward network", "weight": 2, "status": "open", "checked": null, "note": "",
          "target": "FFN(x) = max(0, xW1 + b1)W2 + b2: two linear transformations with a ReLU in between, applied to each position separately and identically (parameters differ per layer). Inner dimension d_ff = 2048." },
        { "id": "2.1.6", "title": "Embeddings, linear & softmax", "weight": 2, "status": "open", "checked": null, "note": "",
          "target": "Learned embeddings map tokens to vectors of size d_model; a linear layer + softmax turns the decoder output into next-token probabilities. The two embedding layers and the pre-softmax linear layer share one weight matrix; embeddings are multiplied by √d_model." },
        { "id": "2.1.7", "title": "Where positional encodings enter", "weight": 1, "status": "open", "checked": null, "note": "",
          "target": "Since the model has no recurrence, positional encodings are added to the input embeddings at the bottom of both the encoder and the decoder stack (details: topic 2.4)." },
        { "id": "2.1.8", "title": "Base model hyperparameters", "weight": 1, "status": "open", "checked": null, "note": "",
          "target": "Base: N = 6, d_model = 512, d_ff = 2048, h = 8 heads, d_k = d_v = 64, dropout 0.1, ~65M parameters. Big: d_model = 1024, d_ff = 4096, h = 16, dropout 0.3, ~213M parameters." }
      ] },
    { "id": "2.2", "title": "Scaled dot-product attention", "importance": 3, "page": null,
      "sources": ["Vaswani et al., Section 3.2.1"], "questions": ["Write down the attention formula and explain every term.", "Why divide by √d_k?"], "keypoints": [] },
    { "id": "2.3", "title": "Multi-head attention and its three uses", "importance": 3, "page": null,
      "sources": ["Vaswani et al., Sections 3.2.2–3.2.3"], "questions": ["Why several heads instead of one?", "Name the three places attention is used in the model."], "keypoints": [] },
    { "id": "2.4", "title": "Sinusoidal positional encoding", "importance": 2, "page": null,
      "sources": ["Vaswani et al., Section 3.5"], "questions": ["Write down the formula. Why sinusoids?"], "keypoints": [] },
    { "id": "2.5", "title": "Why self-attention? Complexity & path length", "importance": 2, "page": null,
      "sources": ["Vaswani et al., Section 4, Table 1"], "questions": ["Compare self-attention, recurrent and convolutional layers."], "keypoints": [] },
    { "id": "2.6", "title": "Training setup & results", "importance": 1, "page": null,
      "sources": ["Vaswani et al., Sections 5–6"], "questions": ["What is label smoothing and the learning-rate warm-up?"], "keypoints": [] }
  ],
  "log": []
};
