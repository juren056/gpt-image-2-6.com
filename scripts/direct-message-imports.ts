import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import MagicString from 'magic-string';
import ts from 'typescript';
import type { Plugin } from 'vite';

/** Keep Paraglide's original compiled functions, avoiding the namespace barrel. */
export function rewriteMessageImports(
  code: string,
  id: string,
  modules: ReadonlyMap<string, string>
) {
  const file = ts.createSourceFile(
    id,
    code,
    ts.ScriptTarget.Latest,
    true,
    id.split('?')[0].endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const declaration = file.statements.find(
    (node): node is ts.ImportDeclaration =>
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      node.moduleSpecifier.text === '@/paraglide/messages.js' &&
      !!node.importClause?.namedBindings &&
      ts.isNamedImports(node.importClause.namedBindings) &&
      node.importClause.namedBindings.elements.some(
        (element) => element.name.text === 'm'
      )
  );
  if (!declaration) return null;
  const bindings = declaration.importClause!.namedBindings as ts.NamedImports;
  if (bindings.elements.length !== 1)
    throw new Error(`Separate the m namespace import in ${id}`);
  const output = new MagicString(code);
  const aliases = new Map<string, string>();
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node)) return;
    if (
      ts.isElementAccessExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'm'
    ) {
      if (
        !ts.isStringLiteral(node.argumentExpression) &&
        !ts.isNoSubstitutionTemplateLiteral(node.argumentExpression)
      )
        throw new Error(`Unbounded translation namespace in ${id}`);
      const key = node.argumentExpression.text;
      if (!modules.has(key)) throw new Error(`No compiled message: ${key}`);
      let alias = aliases.get(key);
      if (!alias) {
        alias = `__directParaglideMessage${aliases.size}`;
        if (code.includes(alias))
          throw new Error(`Message alias collision in ${id}`);
        aliases.set(key, alias);
      }
      output.overwrite(node.getStart(file), node.end, alias);
      return;
    }
    if (ts.isIdentifier(node) && node.text === 'm')
      throw new Error(`Unsupported translation namespace use in ${id}`);
    ts.forEachChild(node, visit);
  };
  visit(file);
  output.overwrite(
    declaration.getStart(file),
    declaration.end,
    [...aliases]
      .map(
        ([key, alias]) =>
          `import { ${JSON.stringify(key)} as ${alias} } from ${JSON.stringify(modules.get(key))};`
      )
      .join('\n')
  );
  return {
    code: output.toString(),
    map: output.generateMap({ source: id, includeContent: true, hires: true }),
  };
}

export function directMessageImports(): Plugin {
  let root = '';
  let modules: Map<string, string> | undefined;
  return {
    name: 'direct-paraglide-message-imports',
    apply: 'build',
    enforce: 'pre',
    configResolved(config) {
      root = config.root;
    },
    buildStart() {
      modules = undefined;
    },
    transform(code, id) {
      if (
        !id.replaceAll('\\', '/').includes('/src/') ||
        !code.includes('@/paraglide/messages.js')
      )
        return null;
      if (!modules) {
        modules = new Map();
        const folder = path.join(root, 'src/paraglide/messages');
        for (const filename of readdirSync(folder)) {
          if (!filename.endsWith('.js') || filename === '_index.js') continue;
          const compiled = readFileSync(path.join(folder, filename), 'utf8');
          const key = compiled.match(
            /export\s*\{\s*\w+\s+as\s+"([^"]+)"\s*\}/
          )?.[1];
          if (key) modules.set(key, `@/paraglide/messages/${filename}`);
        }
        if (!modules.size)
          throw new Error(
            'Direct messages require message-modules compilation'
          );
      }
      return rewriteMessageImports(code, id, modules);
    },
  };
}
