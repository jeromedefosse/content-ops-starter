const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE',
  'MAIL_FROM'
];
const missing = required.filter((v) => !process.env[v]);
if (missing.length) {
  console.error('Missing env vars: ' + missing.join(', '));
  process.exit(1);
} else {
  console.log('Environment variables OK');
}
