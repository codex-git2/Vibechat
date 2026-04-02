const inputJsonEl = document.getElementById('inputJson');
const outputScriptEl = document.getElementById('outputScript');
const statusEl = document.getElementById('status');
const fileInputEl = document.getElementById('fileInput');
const convertBtn = document.getElementById('convertBtn');
const copyBtn = document.getElementById('copyBtn');
const animationTypeEl = document.getElementById('animationType');
const addonIdEl = document.getElementById('addonId');
const animationIdEl = document.getElementById('animationId');

const SAMPLE = {
  format_version: '1.8.0',
  animations: {
    'animation.sample.walk': {
      loop: true,
      animation_length: 1.5,
      bones: {
        body: {
          rotation: {
            '0.0': [0, 0, 0],
            '0.75': [10, 0, 0],
            '1.5': [0, 0, 0]
          }
        }
      }
    }
  }
};

inputJsonEl.value = JSON.stringify(SAMPLE, null, 2);

function setStatus(message, type = 'ok') {
  statusEl.classList.remove('status-ok', 'status-warn', 'status-error');
  statusEl.classList.add(type === 'error' ? 'status-error' : type === 'warn' ? 'status-warn' : 'status-ok');
  statusEl.textContent = message;
}

function parseInput(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`Invalid JSON: ${err.message}`);
  }

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Expected a JSON object as input.');
  }

  if (parsed.animations && typeof parsed.animations === 'object') {
    return parsed.animations;
  }

  if (parsed.bones || parsed.animation_length || parsed.loop) {
    return { [animationIdEl.value.trim() || 'animation.generated']: parsed };
  }

  throw new Error('Could not find animation data. Expected top-level `animations` or an animation object.');
}

function normalizeVector(value) {
  if (Array.isArray(value)) {
    const [x = 0, y = 0, z = 0] = value;
    return [Number(x) || 0, Number(y) || 0, Number(z) || 0];
  }

  if (value && typeof value === 'object') {
    if (Array.isArray(value.vector)) return normalizeVector(value.vector);
    const x = Number(value.x) || 0;
    const y = Number(value.y) || 0;
    const z = Number(value.z) || 0;
    return [x, y, z];
  }

  return [0, 0, 0];
}

function toKeyframeArray(channel) {
  if (!channel) return [];

  if (Array.isArray(channel)) {
    return channel.map((entry, index) => {
      const t = Number(entry.time ?? entry.timestamp ?? index) || 0;
      return {
        time: t,
        value: normalizeVector(entry.value ?? entry.vector ?? entry)
      };
    });
  }

  if (typeof channel === 'object') {
    return Object.entries(channel)
      .map(([time, value]) => ({
        time: Number(time) || 0,
        value: normalizeVector(value)
      }))
      .sort((a, b) => a.time - b.time);
  }

  return [];
}

function buildScript(animations, opts) {
  const lines = [];
  lines.push('// Generated with Blockbench ➜ KubeJS converter');
  lines.push('// Review and adjust API calls to your Palladium/KubeJS version if needed.');
  lines.push("StartupEvents.registry('palladium:animation', event => {");

  for (const [rawName, animation] of Object.entries(animations)) {
    const animationName = (rawName || opts.fallbackId || 'generated').toString();
    const safeId = `${opts.addonId}:${animationName.replace(/^animation\./, '').replace(/[^a-zA-Z0-9_:.\/-]/g, '_')}`;
    const loop = Boolean(animation.loop);
    const length = Number(animation.animation_length ?? animation.length ?? 0);

    lines.push(`  // ===== ${animationName} =====`);
    lines.push(`  event.create('${safeId}', '${opts.type}')`);
    lines.push(`    .loop(${loop})`);
    lines.push(`    .length(${Number.isFinite(length) ? length : 0})`);

    const bones = animation.bones && typeof animation.bones === 'object' ? animation.bones : {};
    for (const [boneName, transforms] of Object.entries(bones)) {
      const rotation = toKeyframeArray(transforms.rotation);
      const position = toKeyframeArray(transforms.position);
      const scale = toKeyframeArray(transforms.scale);

      const emit = (channelName, frames) => {
        for (const frame of frames) {
          const [x, y, z] = frame.value;
          lines.push(
            `    .keyframe('${boneName}', '${channelName}', ${frame.time}, [${x.toFixed(4)}, ${y.toFixed(4)}, ${z.toFixed(4)}])`
          );
        }
      };

      emit('rotation', rotation);
      emit('position', position);
      emit('scale', scale);
    }

    lines.push('    .build();');
    lines.push('');
  }

  lines.push('});');
  return lines.join('\n');
}

function handleConvert() {
  const raw = inputJsonEl.value.trim();
  if (!raw) {
    setStatus('Input is empty. Paste animation JSON first.', 'warn');
    return;
  }

  const addonId = addonIdEl.value.trim();
  if (!addonId) {
    setStatus('Addon namespace / id is required.', 'warn');
    return;
  }

  try {
    const animations = parseInput(raw);
    const script = buildScript(animations, {
      type: animationTypeEl.value,
      addonId,
      fallbackId: animationIdEl.value.trim()
    });

    outputScriptEl.value = script;
    setStatus(`Converted ${Object.keys(animations).length} animation(s) successfully.`, 'ok');
  } catch (err) {
    setStatus(err.message, 'error');
  }
}

fileInputEl.addEventListener('change', async event => {
  const file = event.target.files?.[0];
  if (!file) return;

  const text = await file.text();
  inputJsonEl.value = text;
  setStatus(`Loaded ${file.name}. Click Convert.`, 'ok');
});

convertBtn.addEventListener('click', handleConvert);

copyBtn.addEventListener('click', async () => {
  if (!outputScriptEl.value) {
    setStatus('Nothing to copy yet. Convert first.', 'warn');
    return;
  }

  try {
    await navigator.clipboard.writeText(outputScriptEl.value);
    setStatus('Output copied to clipboard.', 'ok');
  } catch {
    outputScriptEl.select();
    document.execCommand('copy');
    setStatus('Output copied with fallback clipboard method.', 'warn');
  }
});
