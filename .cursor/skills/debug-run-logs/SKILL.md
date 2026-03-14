---
name: debug-run-logs
description: Read and debug ShnitzelAI generation run logs. Inspects pipeline steps, prompts, curator choices, image prompts, and generated images. Use when the user mentions logs, run results, debugging a generation, reviewing what happened, checking prompts, or asking why a topic or image was chosen.
---

# Debug Run Logs

Inspect ShnitzelAI pipeline runs to understand what happened, why a topic was chosen, what prompts were sent, and how the image turned out.

## Log structure

```
logs/
  index.jsonl                          # one-line JSON per run (scan all runs)
  runs/<timestamp>_<ulid>/
    run.json                           # full summary: config, timings, result
    image.png                          # generated image
    steps/
      0_headlines.json                 # RSS headlines + recent week history
      1_curate_input.txt               # system + user prompt sent to curator
      1_curate_output.json             # curator response: theme, tagline, reasoning
      2_prompt_input.txt               # system + user prompt sent to prompt engineer
      2_prompt_output.txt              # image generation prompt (plain text)
      3_image_meta.json                # image model, quality, duration, file size
```

## Quick queries

**List all runs:**
```bash
cat logs/index.jsonl
```

**Latest run directory:**
```bash
ls -t logs/runs/ | head -1
```

**Why was this topic chosen?**
Read `steps/1_curate_output.json` — contains `theme`, `reasoning`, `tagline`, `relatedHeadlines`.

**What headlines were available?**
Read `steps/0_headlines.json` — contains all RSS headlines and the week's previous schnitzels that the curator saw.

**What prompt generated the image?**
Read `steps/2_prompt_output.txt` — the exact English prompt sent to the image model.

**What was the curator asked?**
Read `steps/1_curate_input.txt` — the full system prompt + user prompt with all headlines.

**View the image:**
Read `<run_dir>/image.png`.

**Run timing and config:**
Read `run.json` — has `timing.step1CurateMs`, `timing.step2PromptMs`, `timing.step3ImageMs`, `timing.totalMs`, and full `config` object.

## Debug workflow

1. Find the run: `ls -t logs/runs/ | head -1` or scan `logs/index.jsonl`
2. Read `run.json` for overview — check `status`, `error`, timings
3. If the topic choice was bad: read `steps/0_headlines.json` (what it saw) then `steps/1_curate_output.json` (what it chose and why)
4. If the tagline was bad: check `steps/1_curate_output.json` — the `tagline` field
5. If the image was bad: read `steps/2_prompt_output.txt` (the prompt) and `steps/3_image_meta.json` (model/quality used), then view `image.png`
6. If a step failed: `run.json` has `status: "error"` and `error` field showing which step broke

## Pipeline steps reference

| Step | Model (default) | Input | Output |
|------|----------------|-------|--------|
| Curator | gpt-5.4 | ~33 RSS headlines + week's history | theme, reasoning, tagline |
| Prompt Engineer | gpt-5.4 | theme + tagline | image prompt + essence |
| Image Gen | gpt-image-1.5 | image prompt | 1024x1024 image |
