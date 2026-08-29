# 冰箱管家 MVP

手機優先的 Next.js + TypeScript + Tailwind CSS MVP，聚焦「我的冰箱」。資料目前存於瀏覽器 `localStorage`，適合單機本地使用；未來可將存取邏輯抽換為 Prisma/SQLite 或 PostgreSQL API。

## 開始使用

```bash
npm install
npm run dev
```

開啟 `http://localhost:3000`。

## 開啟 AI 對話

首頁的料理助手支援多輪開放式問答。複製 `.env.example` 為 `.env.local`，填入 `OPENAI_API_KEY` 後重新啟動 Next.js；未設定金鑰時會自動使用內建推薦邏輯，不影響基本功能。

部署到 Vercel 時，請在 Project Settings → Environment Variables 設定 `OPENAI_API_KEY`。API 金鑰只會在伺服器端使用，不要放入 `NEXT_PUBLIC_` 變數。

目前支援：

- 新增食材、數量、單位、分類與保存期限
- 庫存依到期日排序
- 數量加減與到期日直接修改
- 標記吃完、恢復與刪除
- 重新整理後保留資料
