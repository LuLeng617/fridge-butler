# 冰箱管家 MVP

手機優先的 Next.js + TypeScript + Tailwind CSS MVP，聚焦「我的冰箱」。資料目前存於瀏覽器 `localStorage`，適合單機本地使用；未來可將存取邏輯抽換為 Prisma/SQLite 或 PostgreSQL API。

## 開始使用

```bash
npm install
npm run dev
```

開啟 `http://localhost:3000`。

目前支援：

- 新增食材、數量、單位、分類與保存期限
- 庫存依到期日排序
- 數量加減與到期日直接修改
- 標記吃完、恢復與刪除
- 重新整理後保留資料
