import fs from 'node:fs';
import path from 'node:path';

export const SUPPORTED_MANIFEST_SCHEMAS = new Map([
  ['0.2', /^0\.2(?:\.|$)/],
  ['0.3', /^0\.3(?:\.|$)/]
]);

export const SUPPORTED_CONTRACT_SCHEMAS = new Set(['0.1', '0.2']);

export function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

export function canonicalRelativePathError(value) {
  if (typeof value !== 'string' || value.length === 0) return 'must be a non-empty relative path';
  if (value !== value.trim()) return 'must not contain leading or trailing whitespace';
  if (value.includes('\\')) return 'must use forward slashes';
  if (path.posix.isAbsolute(value)) return 'must be relative';
  if (value.endsWith('/')) return 'must not have a trailing slash';

  const segments = value.split('/');
  if (segments.some((segment) => segment === '' || segment === '.' || segment === '..')) {
    return 'must not contain empty, dot, or parent segments';
  }
  if (path.posix.normalize(value) !== value) return 'must be normalized';
  return null;
}

export function resolveDeclaredPath(root, value) {
  return path.resolve(root, ...value.split('/'));
}

export function validateManifestShape(manifest) {
  const errors = [];
  const family = SUPPORTED_MANIFEST_SCHEMAS.get(manifest?.schema_version);

  if (!family) {
    errors.push(`unsupported project manifest schema_version: ${String(manifest?.schema_version)}`);
  } else if (typeof manifest?.tsal_version !== 'string' || !family.test(manifest.tsal_version)) {
    errors.push(`tsal_version ${String(manifest?.tsal_version)} does not match project manifest schema family ${manifest.schema_version}`);
  }

  for (const key of ['id', 'name', 'owner', 'kind']) {
    if (!manifest?.project?.[key]) errors.push(`project.${key} is required`);
  }
  if (!Array.isArray(manifest?.automations)) errors.push('automations must be an array');
  if (!Array.isArray(manifest?.integration?.adapters)) errors.push('integration.adapters must be an array');
  if (typeof manifest?.integration?.control_plane?.enabled !== 'boolean') {
    errors.push('integration.control_plane.enabled must be boolean');
  }

  return errors;
}

export function validateDeclaredArtifacts(root, manifest) {
  const errors = [];
  const specs = [
    ['evidence_directory', 'directory'],
    ['incidents_directory', 'directory'],
    ['runbook', 'file'],
    ['architecture', 'file']
  ];

  for (const [key, expectedType] of specs) {
    const value = manifest?.artifacts?.[key];
    if (value === undefined) continue;

    const pathError = canonicalRelativePathError(value);
    if (pathError) {
      errors.push(`artifacts.${key} ${pathError}: ${String(value)}`);
      continue;
    }

    const artifactPath = resolveDeclaredPath(root, value);
    if (!fs.existsSync(artifactPath)) {
      errors.push(`declared artifact not found: artifacts.${key} -> ${value}`);
      continue;
    }

    const stat = fs.statSync(artifactPath);
    if (expectedType === 'directory' && !stat.isDirectory()) {
      errors.push(`declared artifact must be a directory: artifacts.${key} -> ${value}`);
    }
    if (expectedType === 'file' && !stat.isFile()) {
      errors.push(`declared artifact must be a file: artifacts.${key} -> ${value}`);
    }
  }

  return errors;
}

function loadContract(root, automation, errors) {
  if (!automation?.contract) {
    errors.push(`automation ${automation?.id ?? '<unknown>'} has no contract path`);
    return null;
  }

  const pathError = canonicalRelativePathError(automation.contract);
  if (pathError) {
    errors.push(`automation ${automation?.id ?? '<unknown>'} contract path ${pathError}: ${automation.contract}`);
    return null;
  }

  const contractPath = resolveDeclaredPath(root, automation.contract);
  if (!fs.existsSync(contractPath)) {
    errors.push(`automation ${automation.id} contract not found: ${automation.contract}`);
    return null;
  }
  if (!fs.statSync(contractPath).isFile()) {
    errors.push(`automation ${automation.id} contract is not a file: ${automation.contract}`);
    return null;
  }

  let contract;
  try {
    contract = readJson(contractPath);
  } catch (error) {
    errors.push(`automation ${automation.id} contract is invalid JSON: ${error.message}`);
    return null;
  }

  if (!SUPPORTED_CONTRACT_SCHEMAS.has(contract?.schema_version)) {
    errors.push(`automation ${automation.id} uses unsupported contract schema_version: ${String(contract?.schema_version)}`);
  }
  if (contract?.automation?.id && contract.automation.id !== automation.id) {
    errors.push(`automation id mismatch: manifest=${automation.id} contract=${contract.automation.id}`);
  }
  if (automation?.risk && contract?.risk?.class && automation.risk !== contract.risk.class) {
    errors.push(`automation risk mismatch for ${automation.id}: manifest=${automation.risk} contract=${contract.risk.class}`);
  }

  return { automation, contract, contractPath };
}

export function loadProject(root) {
  const manifestPath = path.join(root, 'tsal.project.json');
  const errors = [];
  const warnings = [];

  if (!fs.existsSync(manifestPath)) {
    return { root, manifestPath, manifest: null, contracts: [], errors: [`missing ${manifestPath}`], warnings };
  }

  let manifest;
  try {
    manifest = readJson(manifestPath);
  } catch (error) {
    return {
      root,
      manifestPath,
      manifest: null,
      contracts: [],
      errors: [`cannot parse tsal.project.json: ${error.message}`],
      warnings
    };
  }

  errors.push(...validateManifestShape(manifest));
  errors.push(...validateDeclaredArtifacts(root, manifest));

  const contracts = [];
  if (Array.isArray(manifest.automations)) {
    for (const automation of manifest.automations) {
      const loaded = loadContract(root, automation, errors);
      if (loaded) contracts.push(loaded);
    }
  }

  return { root, manifestPath, manifest, contracts, errors, warnings };
}
