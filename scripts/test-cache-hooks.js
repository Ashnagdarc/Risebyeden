const fs = require('node:fs');
const path = require('node:path');

function assertIncludes(filePath, needle) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes(needle)) {
    throw new Error(`Expected "${needle}" in ${filePath}`);
  }
}

function main() {
  const root = process.cwd();
  const clientRoute = path.join(root, 'app/api/client/interest-requests/route.ts');
  const adminRoute = path.join(root, 'app/api/admin/interest-requests/route.ts');

  assertIncludes(clientRoute, "import { CACHE_KEYS } from '@/lib/cache/keys';");
  assertIncludes(clientRoute, "import { deleteCacheKeys } from '@/lib/cache/valkey';");
  assertIncludes(clientRoute, 'await deleteCacheKeys([CACHE_KEYS.adminOverview]);');

  assertIncludes(adminRoute, "import { CACHE_KEYS } from '@/lib/cache/keys';");
  assertIncludes(adminRoute, "import { deleteCacheKeys } from '@/lib/cache/valkey';");
  assertIncludes(adminRoute, 'await deleteCacheKeys([CACHE_KEYS.adminOverview]);');

  console.log('cache hook test passed');
}

main();
