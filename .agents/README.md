# Universal Agents

This directory defines the machine-readable contract that AI tools and local scripts can consume.

## Files

- `registry.json`: source of truth for available agents
- `specs/*.json`: normalized agent definitions

## Agent spec shape

Each agent spec uses a small, dependency-free JSON contract:

```json
{
  "id": "frontend",
  "name": "Frontend",
  "description": "Short scope summary",
  "owned_paths": ["src/components/"],
  "preferred_paths": ["src/components/BaseHead.astro"],
  "avoid_paths": ["src/js/streaming.js"],
  "keywords": ["ui", "css", "layout"],
  "allowed_globs": ["src/components/**"],
  "validation_commands": ["astro check", "astro build"],
  "prompt_template": ["You are the Frontend agent..."],
  "working_notes": ["Prefer path ownership over keyword guesses."],
  "handoff_to": ["streaming", "ads"],
  "references": []
}
```

## Routing rules

The orchestrator uses three signals:

1. Path ownership: strongest signal
2. Preferred path matches: secondary signal
3. Keyword overlap in task text: fallback signal

If more than one agent matches, the highest score wins and the rest are returned as alternates.

## Execution layer

Besides routing, specs now contain execution hints:

- `allowed_globs`: safe edit scope for that agent
- `validation_commands`: checks to run after changes
- `prompt_template`: reusable execution prompt for another AI
- `working_notes`: extra local caution points

Use `prepare-task` to convert a task plus path into a ready-to-use handoff packet.

## Design goals

- Portable: plain JSON, no framework coupling
- Explainable: every suggestion includes reasons
- Extendable: easy to add new agents or keywords
- Self-contained: no dependency on a parallel human-only agent folder
