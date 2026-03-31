# Agent System

This repository uses a single portable agent layer in `.agents/*.json` for routing and delegation.

## Quick usage

List all agents:

```sh
npm run agents:list
```

Match an agent from a task description:

```sh
npm run agents:match-task -- --task "fix comscore beacon on Astro page transitions"
```

Match an agent from a file path:

```sh
npm run agents:match-path -- --path src/components/Modal.astro
```

Explain the best owner using both task and path:

```sh
npm run agents:explain -- --task "fix takeover close behavior" --path src/components/Modal.astro
```

Prepare a handoff packet for another AI or subagent:

```sh
npm run agents:prepare-task -- --task "fix takeover close behavior" --path src/components/Modal.astro
```

## Universal structure

The contract is intentionally simple so other AI tools can consume it:

- `.agents/registry.json` is the main index
- `.agents/specs/*.json` contains one normalized spec per agent
- each spec declares:
  - `owned_paths`
  - `preferred_paths`
  - `avoid_paths`
  - `keywords`
  - `allowed_globs`
  - `validation_commands`
  - `prompt_template`
  - `working_notes`
  - `handoff_to`
  - `references`

## Recommended delegation pattern

1. Resolve the likely owner from path first.
2. Refine with task keywords.
3. Generate a task packet when delegating work.
4. Use `handoff_to` when the task crosses boundaries.
5. Use the selected spec as the source of truth before editing.

## Current agent map

- `frontend`: components, layouts, styles, presentation
- `streaming`: player, Triton SDK, now playing, transitions
- `analytics`: GTM, comScore, Hotjar, Metricool, beacons
- `content`: WordPress API, routes, SEO, feeds
- `ads`: GPT, AdSense fallback, slots, monetization surfaces
