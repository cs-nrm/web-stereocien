#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const cwd = process.cwd();
const registryPath = path.join(cwd, '.agents', 'registry.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizePath(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\.\//, '');
}

function loadRegistry() {
  if (!fs.existsSync(registryPath)) {
    throw new Error(`Missing registry at ${registryPath}`);
  }

  const registry = readJson(registryPath);
  const agents = registry.agents.map((entry) => {
    const specPath = path.join(cwd, entry.spec);
    return readJson(specPath);
  });

  return { registry, agents };
}

function scoreText(text, agent) {
  const haystack = normalize(text);
  let score = 0;
  const reasons = [];

  for (const keyword of agent.keywords || []) {
    if (haystack.includes(normalize(keyword))) {
      score += 3;
      reasons.push(`keyword:${keyword}`);
    }
  }

  return { score, reasons };
}

function scorePath(inputPath, agent) {
  const candidate = normalizePath(inputPath);
  let score = 0;
  const reasons = [];

  for (const ownedPath of agent.owned_paths || []) {
    const normalizedOwnedPath = normalizePath(ownedPath);
    if (candidate === normalizedOwnedPath) {
      score += 12;
      reasons.push(`owned_path_exact:${ownedPath}`);
      continue;
    }

    if (candidate.startsWith(normalizedOwnedPath)) {
      score += 10;
      reasons.push(`owned_path:${ownedPath}`);
    }
  }

  for (const preferredPath of agent.preferred_paths || []) {
    const normalizedPreferredPath = normalizePath(preferredPath);
    if (candidate === normalizedPreferredPath) {
      score += 7;
      reasons.push(`preferred_path_exact:${preferredPath}`);
      continue;
    }

    if (candidate.startsWith(normalizedPreferredPath)) {
      score += 5;
      reasons.push(`preferred_path:${preferredPath}`);
    }
  }

  for (const avoidPath of agent.avoid_paths || []) {
    const normalizedAvoidPath = normalizePath(avoidPath);
    if (candidate === normalizedAvoidPath) {
      score -= 10;
      reasons.push(`avoid_path_exact:${avoidPath}`);
      continue;
    }

    if (candidate.startsWith(normalizedAvoidPath)) {
      score -= 8;
      reasons.push(`avoid_path:${avoidPath}`);
    }
  }

  return { score, reasons };
}

function rankAgents({ agents, text = '', filePath = '' }) {
  const ranked = agents.map((agent) => {
    const textScore = scoreText(text, agent);
    const pathScore = scorePath(filePath, agent);
    const score = textScore.score + pathScore.score;
    const reasons = [...pathScore.reasons, ...textScore.reasons];

    return {
      id: agent.id,
      name: agent.name,
      description: agent.description,
      score,
      reasons,
      handoff_to: agent.handoff_to || [],
      references: agent.references || [],
      allowed_globs: agent.allowed_globs || [],
      validation_commands: agent.validation_commands || [],
      prompt_template: agent.prompt_template || [],
      working_notes: agent.working_notes || []
    };
  });

  return ranked.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = { command, args: [] };

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];

    if (token === '--task') {
      options.task = rest[i + 1];
      i += 1;
      continue;
    }

    if (token === '--path') {
      options.path = rest[i + 1];
      i += 1;
      continue;
    }

    if (token === '--json') {
      options.json = true;
      continue;
    }

    options.args.push(token);
  }

  return options;
}

function printUsage() {
  console.log(`Usage:
  node scripts/agent-orchestrator.mjs list [--json]
  node scripts/agent-orchestrator.mjs show-spec frontend [--json]
  node scripts/agent-orchestrator.mjs match-task --task "fix comscore beacon" [--json]
  node scripts/agent-orchestrator.mjs match-path --path src/components/Modal.astro [--json]
  node scripts/agent-orchestrator.mjs explain --task "..." --path src/js/streaming.js [--json]
  node scripts/agent-orchestrator.mjs prepare-task --task "..." --path src/js/streaming.js [--json]`);
}

function toOutput(data, asJson) {
  if (asJson) {
    console.log(JSON.stringify(data, null, 2));
    return;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      const score = item.score ?? 'n/a';
      const reasons = item.reasons || [];
      const handoffTo = item.handoff_to || [];
      console.log(`${item.id} (${score})`);
      console.log(`  ${item.description}`);
      if (reasons.length > 0) {
        console.log(`  reasons: ${reasons.join(', ')}`);
      }
      if (handoffTo.length > 0) {
        console.log(`  handoff_to: ${handoffTo.join(', ')}`);
      }
    }
    return;
  }

  if (data.agent) {
    console.log(`agent: ${data.agent}`);
    console.log(`task: ${data.task || 'n/a'}`);
    console.log(`path: ${data.path || 'n/a'}`);
    console.log(`reasons: ${data.reasons.join(', ') || 'none'}`);
    if (data.allowed_globs.length > 0) {
      console.log(`allowed_globs: ${data.allowed_globs.join(', ')}`);
    }
    if (data.validation_commands.length > 0) {
      console.log(`validation_commands: ${data.validation_commands.join(', ')}`);
    }
    if (data.handoff_to.length > 0) {
      console.log(`handoff_to: ${data.handoff_to.join(', ')}`);
    }
    console.log('prompt:');
    console.log(data.prompt);
    return;
  }

  console.log(`${data.primary.id} (${data.primary.score})`);
  console.log(data.primary.description);
  console.log(`reasons: ${data.primary.reasons.join(', ') || 'none'}`);
  console.log(`alternates: ${data.alternates.map((item) => item.id).join(', ') || 'none'}`);
}

function buildTaskPacket(agent, task, filePath) {
  return {
    agent: agent.id,
    description: agent.description,
    task: task || '',
    path: filePath || '',
    reasons: agent.reasons || [],
    allowed_globs: agent.allowed_globs || [],
    validation_commands: agent.validation_commands || [],
    handoff_to: agent.handoff_to || [],
    working_notes: agent.working_notes || [],
    prompt: [...(agent.prompt_template || []), task ? `Task: ${task}` : '', filePath ? `Primary path: ${filePath}` : '']
      .filter(Boolean)
      .join('\n')
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const { registry, agents } = loadRegistry();

  if (!options.command || options.command === 'help' || options.command === '--help') {
    printUsage();
    return;
  }

  if (options.command === 'list') {
    const data = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      description: agent.description,
      owned_paths: agent.owned_paths,
      handoff_to: agent.handoff_to
    }));
    toOutput(data, options.json);
    return;
  }

  if (options.command === 'show-spec') {
    const agentId = options.args[0];
    const agent = agents.find((item) => item.id === agentId);

    if (!agent) {
      console.error(`Unknown agent: ${agentId}`);
      process.exitCode = 1;
      return;
    }

    toOutput([agent], options.json);
    return;
  }

  if (options.command === 'match-task') {
    const ranked = rankAgents({ agents, text: options.task || '' });
    toOutput(ranked, options.json);
    return;
  }

  if (options.command === 'match-path') {
    const ranked = rankAgents({ agents, filePath: options.path || '' });
    toOutput(ranked, options.json);
    return;
  }

  if (options.command === 'explain') {
    const ranked = rankAgents({
      agents,
      text: options.task || '',
      filePath: options.path || ''
    });
    const [primary, ...alternates] = ranked;
    const data = {
      project: registry.project,
      primary,
      alternates: alternates.filter((item) => item.score > 0).slice(0, 3)
    };
    toOutput(data, options.json);
    return;
  }

  if (options.command === 'prepare-task') {
    const ranked = rankAgents({
      agents,
      text: options.task || '',
      filePath: options.path || ''
    });
    const packet = buildTaskPacket(ranked[0], options.task || '', options.path || '');
    toOutput(packet, options.json);
    return;
  }

  printUsage();
  process.exitCode = 1;
}

main();
