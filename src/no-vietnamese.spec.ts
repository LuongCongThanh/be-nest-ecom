import * as fs from 'fs';
import * as path from 'path';

// Vietnamese diacritical characters (lower + upper)
const VIETNAMESE_PATTERN = /[àáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỷỹÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚÝĂĐƠƯẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼẾỀỂỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỶỸ]/;

// This spec file contains Vietnamese chars in the regex literal — exclude it from its own scan
const ALLOWED_BASENAMES = ['no-vietnamese.spec.ts'];

function collectTsFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...collectTsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.ts')) {
      results.push(fullPath);
    }
  }
  return results;
}

describe('Source files contain no Vietnamese text', () => {
  const srcDir = __dirname;

  it('should have zero Vietnamese characters outside of allowed files', () => {
    const files = collectTsFiles(srcDir).filter((f) => !ALLOWED_BASENAMES.includes(path.basename(f)));

    const violations: string[] = [];

    for (const file of files) {
      const lines = fs.readFileSync(file, 'utf-8').split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (VIETNAMESE_PATTERN.test(lines[i])) {
          const rel = path.relative(srcDir, file).replace(/\\/g, '/');
          violations.push(`${rel}:${i + 1}  →  ${lines[i].trim()}`);
        }
      }
    }

    expect(violations).toHaveLength(0);
    if (violations.length > 0) {
      console.error('Vietnamese text found:\n' + violations.join('\n'));
    }
  });
});
