-- 添加复合索引优化历史记录查询
-- 这些索引不会删除任何数据，只会加速查询
CREATE INDEX IF NOT EXISTS idx_generation_user_status_created ON "Generation"(userId, status, createdAt);
CREATE INDEX IF NOT EXISTS idx_generation_user_created ON "Generation"(userId, createdAt);
