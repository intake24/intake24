/* eslint-disable regexp/no-trivially-nested-quantifier */
/* eslint-disable regexp/no-super-linear-backtracking */
/* eslint-disable style/no-multi-spaces */

import fs  from 'node:fs';
import path from 'node:path';

const sequelizeDecorators = [
  'HasMany',
  'BelongsTo',
  'HasOne',
  'BelongsToMany',
  'Scope',
  'ForeignKey',
];

export function onlySequelizeDecoratorImports(fromPath, toPath) {
  // console.log(`Checking ${fromPath} -> ${toPath}`);
  const source = fs.readFileSync(fromPath, 'utf-8');

  const usedInDecorators = new Set();

  const contentPattern = '(?:[^()]+|\\([^()]*\\))*';

  const decoratorsRegex = new RegExp(
    `@(${sequelizeDecorators.join('|')})\\s*\\((${contentPattern})\\)`,
    'g',
  );

  let match = decoratorsRegex.exec(source);

  while (match !== null) {
    const content = match[2];

    const modelRegex = /\(\s*\)\s*=>\s*(\w+)/g;

    let modelMatch = modelRegex.exec(content);

    while (modelMatch !== null) {
      usedInDecorators.add(modelMatch[1]);
      modelMatch = modelRegex.exec(content);
    }

    match = decoratorsRegex.exec(source);
  }

  //   if (usedInDecorators.size > 0) {
  //     console.warn(`Models used in Sequelize decorators: ${Array.from(usedInDecorators).join(', ')}`);
  //   }
  //   else {
  //     console.warn(`No Sequelize decorators found.`);
  //   }

  if (usedInDecorators.size === 0) {
    return false;
  }

  // Relative import path without extension
  let relativePath = path.relative(path.dirname(fromPath), toPath);
  relativePath = relativePath.replace(path.extname(relativePath), '');
  relativePath = relativePath.replace(/\\/g, '/');

  // Escape the relative path for use in regex (to handle special chars like . or /)
  const escapedRelativePath = relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const importRegex = new RegExp(
    `import\\s+`                                   // 'import' followed by mandatory space (JS syntax requires it)
    + `(\\*\\s+as\\s+(\\w+)`                       // Group 1 & 2: * as namespace with mandatory spaces
    + `|`
    + `{\\s*([\\w\\s,]+)\\s*}`                     // Group 3: { named imports } with optional internal spaces
    + `|`
    + `(\\w+)`                                     // Group 4: default import
    + `)`
    + `\\s+from\\s+`                               // mandatory spaces around 'from' (JS syntax)
    + `['"]([./]*)?${escapedRelativePath}['"]`,    // quoted path with optional ./ or ../
    'g',
  );

  const importedNames = new Set();

  match = importRegex.exec(source);
  while (match !== null) {
    if (match[2]) { // Import all (* as ns)
      return false;
    }
    else if (match[3]) { // Named imports { a, b }
      const names = match[3]
        .split(',')
        .map(n => n.trim())
        .filter(Boolean);

      names.forEach(name => importedNames.add(name));
    }
    else if (match[4]) { // Default import
      importedNames.add(match[4]);
    }
    match = importRegex.exec(source);
  }

  const isSafe = Array.from(importedNames).every(name => usedInDecorators.has(name));

  //   if (isSafe) {
  //     console.log(`Safe import from ${relativePath}: ${Array.from(importedNames).join(', ')} matches decorators`);
  //   }
  //   else {
  //     console.warn(`Unsafe import from ${relativePath}: ${Array.from(importedNames).join(', ')} does not fully match decorators`);
  //   }

  return isSafe;
}

export function isSubpath(basePath, targetPath) {
  const absBase = path.resolve(basePath);
  const absTarget = path.resolve(targetPath);

  const relative = path.relative(absBase, absTarget);

  if (relative === '') {
    return false;
  }

  return !relative.startsWith('..') && !path.isAbsolute(relative);
}
