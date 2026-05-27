function requireEnv(name: string): string {
  const val = process.env[name];
  if (!val) {
    throw new Error(`[FATAL] 环境变量 ${name} 未设置`);
  }
  return val;
}

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || 'file:./dev.db',
  jwtSecret: requireEnv('JWT_SECRET'),
  deepseekApiKey: requireEnv('DEEPSEEK_API_KEY'),
};
