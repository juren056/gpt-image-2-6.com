import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { pageQuery } from '../src/lib/api-client';

// Contract checks use no real accounts or production database.
const read = (path: string) =>
  readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const generations = read('src/routes/admin/generations.tsx');
const users = read('src/routes/admin/users.tsx');
assert.match(generations, /encodeURIComponent\(item\.userId\)/);
assert.equal(
  (generations.match(/<GenerationUserLink item=\{item\}/g) || []).length,
  3
);
assert.match(generations, /<div\s+key=\{item\.id\}/);
assert.match(users, /validateSearch:/);
assert.match(
  users,
  /queryKey: \['admin-users', page, debouncedSearch, userId\]/
);
assert.match(users, /placeholderData: userId \? undefined : keepPreviousData/);
assert.match(users, /params\.set\('userId', userId\)/);
assert.match(users, /router\.replace\('\/admin\/users'\)/);
for (const path of [
  'src/routes/api/admin/users/index.ts',
  'src/routes/api/admin/users/export.ts',
]) {
  const route = read(path);
  assert.match(route, /conditions\.push\(eq\(user\.id, userId\)\)/);
  assert.match(route, /hasPermission\(session\.user\.id, 'admin\.\*'\)/);
}
for (const id of ['account-id', 'id+with/slash?&=', '用户编号']) {
  const url =
    pageQuery('/api/admin/users', { page: 1, pageSize: 10, search: '' }) +
    `&userId=${encodeURIComponent(id)}`;
  const params = new URL(url, 'https://example.test').searchParams;
  assert.equal(params.get('userId'), id);
  assert.equal(params.get('page'), '1');
  assert.equal(params.get('pageSize'), '10');
}
for (const locale of ['en', 'zh']) {
  assert.ok(
    JSON.parse(read(`messages/${locale}.json`))['admin.users.show_all']
  );
}
console.log(
  'PASS: generation user links, exact-ID filters, filtered export, clear filter, query isolation and URL encoding'
);
