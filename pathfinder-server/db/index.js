const { Pool } = require('pg');
require('dotenv').config();

// Railway는 DATABASE_URL 단일 변수로 제공 — 개발 환경은 개별 변수 사용
const pool = process.env.DATABASE_URL
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // Railway PostgreSQL SSL 필수
    })
  : new Pool({
      host:                    process.env.DB_HOST     || 'localhost',
      port:                    parseInt(process.env.DB_PORT || '5432'),
      database:                process.env.DB_NAME     || 'pathfinder_db',
      user:                    process.env.DB_USER     || 'postgres',
      password:                process.env.DB_PASSWORD || '',
      max:                     10,    // 최대 커넥션 수
      idleTimeoutMillis:       30000, // 유휴 커넥션 30초 후 해제
      connectionTimeoutMillis: 5000,  // 연결 5초 초과 시 에러 반환
    });

pool.on('error', (err) => {
  console.error('[DB] 예상치 못한 오류:', err.message);
});

module.exports = pool;
