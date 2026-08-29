"use client";
import { useEffect, useState } from "react";
type View = "home" | "fridge" | "recipes" | "shopping";
type Food = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  expiry: string;
  category: string;
  done: boolean;
};
type Shop = {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  source: string;
  done: boolean;
};
type Ingredient = { name: string; quantity: number; unit: string };
type Recipe = {
  id: string;
  name: string;
  emoji: string;
  flavor: string;
  minutes: number;
  ingredients: Ingredient[];
  note: string;
  steps: string[];
  url: string;
};
type Reply = {
  message: string;
  recipeId: string | null;
  recipeName: string | null;
  emoji?: string;
  generatedRecipe?: Recipe | null;
  suggestions?: string[];
  reason: string[];
  availableIngredients: string[];
  missingIngredients: string[];
  cookTime: number | null;
  difficulty: number;
  actions: string[];
};
type Chat = {
  role: "user" | "assistant";
  text: string;
  reply?: Reply;
  error?: boolean;
  retry?: string;
};
const FK = "fridge-butler-foods",
  SK = "fridge-butler-shopping";
const CUSTOM_KEY = "fridge-butler-custom-ingredients";
const categories = ["蔬菜", "蛋奶", "肉類", "水果", "主食", "其他"],
  icons: Record<string, string> = {
    蔬菜: "🥬",
    蛋奶: "🥚",
    肉類: "🍖",
    水果: "🍎",
    主食: "🍚",
    其他: "📦",
  },
  flavorIcons: Record<string, string> = {
    全部: "🛍️",
    台式家常: "🍳",
    西式輕食: "🥪",
    清爽湯品: "🍲",
    麵食料理: "🍜",
    日式風味: "🍛",
    蔬菜料理: "🥬",
    早餐甜點: "🥞",
    肉類料理: "🥩",
  };
const catalog: Record<string, string[]> = {
  蔬菜: [
    "番茄",
    "青菜",
    "高麗菜",
    "小黃瓜",
    "洋蔥",
    "青蔥",
    "紅蘿蔔",
    "金針菇",
    "玉米",
  ],
  蛋奶: ["雞蛋", "牛奶", "起司", "優格"],
  肉類: ["雞胸肉", "豬肉", "牛肉", "香腸", "貢丸", "火腿"],
  水果: ["香蕉", "蘋果", "橘子", "葡萄"],
  主食: ["白飯", "吐司", "麵條", "燕麥", "泡麵", "白米"],
  其他: ["醬油", "鹽", "胡椒", "奶油", "咖哩塊", "豆腐", "紫菜"],
};
const units = ["份", "顆", "把", "包", "瓶", "克", "公斤", "片", "條", "盒"],
  flavors = [
    "全部",
    "台式家常",
    "西式輕食",
    "清爽湯品",
    "麵食料理",
    "日式風味",
    "蔬菜料理",
    "早餐甜點",
    "肉類料理",
  ];
const ingredientDefaults: Record<string, { unit: string; days: number }> = {
  蘋果: { unit: "顆", days: 7 },
  香蕉: { unit: "根", days: 5 },
  橘子: { unit: "顆", days: 7 },
  葡萄: { unit: "串", days: 5 },
  青菜: { unit: "把", days: 3 },
  青江菜: { unit: "把", days: 3 },
  番茄: { unit: "顆", days: 5 },
  高麗菜: { unit: "顆", days: 7 },
  小黃瓜: { unit: "條", days: 5 },
  洋蔥: { unit: "顆", days: 14 },
  雞蛋: { unit: "顆", days: 21 },
  牛奶: { unit: "瓶", days: 7 },
  豆腐: { unit: "盒", days: 3 },
  貢丸: { unit: "包", days: 14 },
  麵條: { unit: "包", days: 30 },
  泡麵: { unit: "包", days: 180 },
  白飯: { unit: "份", days: 1 },
};
function defaults(name: string) {
  const d = ingredientDefaults[name];
  return { unit: d?.unit || "份", expiry: future(d?.days || 5) };
}
const baseRecipes: Recipe[] = [
  {
    id: "tomato",
    name: "番茄炒蛋",
    emoji: "🍅",
    flavor: "台式家常",
    minutes: 15,
    ingredients: [
      { name: "雞蛋", quantity: 2, unit: "顆" },
      { name: "番茄", quantity: 2, unit: "顆" },
      { name: "青蔥", quantity: 1, unit: "把" },
    ],
    note: "酸甜下飯，優先消耗番茄",
    steps: [
      "番茄切塊，雞蛋打散。",
      "蛋炒至半熟盛起。",
      "炒番茄後加入蛋與青蔥。",
    ],
    url: "",
  },
  {
    id: "noodle",
    name: "蔬菜拌麵",
    emoji: "🍜",
    flavor: "麵食料理",
    minutes: 15,
    ingredients: [
      { name: "麵條", quantity: 1, unit: "份" },
      { name: "青菜", quantity: 1, unit: "把" },
      { name: "雞蛋", quantity: 1, unit: "顆" },
    ],
    note: "一鍋完成，快速解決一餐",
    steps: ["麵條與青菜燙熟。", "雞蛋煎熟切絲。", "拌入醬油即可。"],
    url: "",
  },
  {
    id: "soup",
    name: "番茄蛋花湯",
    emoji: "🍲",
    flavor: "清爽湯品",
    minutes: 18,
    ingredients: [
      { name: "番茄", quantity: 2, unit: "顆" },
      { name: "雞蛋", quantity: 1, unit: "顆" },
    ],
    note: "清爽暖胃",
    steps: ["番茄煮出湯汁。", "加水與調味料煮滾。", "倒入蛋液成蛋花。"],
    url: "",
  },
  {
    id: "rice",
    name: "蛋炒飯",
    emoji: "🍚",
    flavor: "台式家常",
    minutes: 20,
    ingredients: [
      { name: "雞蛋", quantity: 2, unit: "顆" },
      { name: "白飯", quantity: 2, unit: "份" },
      { name: "青蔥", quantity: 1, unit: "把" },
    ],
    note: "隔夜飯的好朋友",
    steps: ["雞蛋打散，青蔥切末。", "熱鍋炒蛋與白飯。", "加入青蔥調味。"],
    url: "",
  },
  {
    id: "egg",
    name: "家常蒸蛋",
    emoji: "🥚",
    flavor: "清爽料理",
    minutes: 20,
    ingredients: [
      { name: "雞蛋", quantity: 2, unit: "顆" },
      { name: "醬油", quantity: 1, unit: "份" },
    ],
    note: "柔嫩簡單，適合蒸煮",
    steps: [
      "蛋與溫水約一比一混合。",
      "撇去泡沫並蓋上盤子。",
      "蒸至中心凝固後淋醬油。",
    ],
    url: "",
  },
  {
    id: "meatball",
    name: "貢丸蔬菜麵",
    emoji: "🍜",
    flavor: "麵食料理",
    minutes: 15,
    ingredients: [
      { name: "貢丸", quantity: 3, unit: "顆" },
      { name: "麵條", quantity: 1, unit: "份" },
      { name: "青菜", quantity: 1, unit: "把" },
    ],
    note: "適合快煮鍋的一鍋料理",
    steps: ["貢丸先煮熟。", "加入麵條煮軟。", "最後加入青菜與調味料。"],
    url: "",
  },
  {
    id: "toast",
    name: "起司蛋吐司",
    emoji: "🥪",
    flavor: "西式輕食",
    minutes: 8,
    ingredients: [
      { name: "雞蛋", quantity: 1, unit: "顆" },
      { name: "吐司", quantity: 2, unit: "片" },
      { name: "起司", quantity: 1, unit: "片" },
    ],
    note: "早餐快速完成",
    steps: ["雞蛋煎熟。", "吐司放起司與煎蛋。", "對切即可享用。"],
    url: "",
  },
  {
    id: "tofu",
    name: "玉米豆腐煎餅",
    emoji: "🥞",
    flavor: "蔬菜料理",
    minutes: 18,
    ingredients: [
      { name: "豆腐", quantity: 1, unit: "盒" },
      { name: "玉米", quantity: 1, unit: "份" },
      { name: "雞蛋", quantity: 1, unit: "顆" },
    ],
    note: "外酥內嫩，不需複雜調味",
    steps: ["豆腐壓乾水分捏碎。", "拌入玉米與蛋液。", "小火煎成兩面金黃。"],
    url: "",
  },
  {
    id: "chicken",
    name: "雞胸肉蔬菜盤",
    emoji: "🥗",
    flavor: "肉類料理",
    minutes: 20,
    ingredients: [
      { name: "雞胸肉", quantity: 1, unit: "包" },
      { name: "小黃瓜", quantity: 1, unit: "條" },
      { name: "番茄", quantity: 1, unit: "顆" },
    ],
    note: "清爽少油，適合一人份",
    steps: ["雞胸肉煎熟切片。", "蔬菜切片。", "全部放在盤中即可。"],
    url: "",
  },
  {
    id: "onion-egg",
    name: "洋蔥炒蛋",
    emoji: "🧅",
    flavor: "台式家常",
    minutes: 12,
    ingredients: [
      { name: "雞蛋", quantity: 2, unit: "顆" },
      { name: "洋蔥", quantity: 1, unit: "顆" },
    ],
    note: "食材少、步驟簡單",
    steps: ["洋蔥切絲，蛋打散。", "先炒軟洋蔥。", "加入蛋液炒熟。"],
    url: "",
  },
  {
    id: "cabbage",
    name: "清炒高麗菜",
    emoji: "🥬",
    flavor: "蔬菜料理",
    minutes: 10,
    ingredients: [
      { name: "高麗菜", quantity: 2, unit: "份" },
      { name: "醬油", quantity: 1, unit: "份" },
    ],
    note: "快速消耗蔬菜",
    steps: ["高麗菜洗淨切片。", "放入鍋中翻炒。", "加少量醬油拌勻。"],
    url: "",
  },
  {
    id: "cucumber",
    name: "涼拌小黃瓜",
    emoji: "🥒",
    flavor: "清爽料理",
    minutes: 8,
    ingredients: [
      { name: "小黃瓜", quantity: 2, unit: "條" },
      { name: "醬油", quantity: 1, unit: "份" },
    ],
    note: "不用開火，炎熱天氣很適合",
    steps: ["小黃瓜拍裂切段。", "加入醬油拌勻。", "冷藏十分鐘。"],
    url: "",
  },
  {
    id: "curry",
    name: "簡易咖哩飯",
    emoji: "🍛",
    flavor: "日式風味",
    minutes: 35,
    ingredients: [
      { name: "雞胸肉", quantity: 1, unit: "包" },
      { name: "洋蔥", quantity: 1, unit: "顆" },
      { name: "咖哩塊", quantity: 1, unit: "盒" },
      { name: "白飯", quantity: 2, unit: "份" },
    ],
    note: "一次煮好幾餐",
    steps: ["肉與洋蔥切塊。", "炒香後加水煮軟。", "放咖哩塊淋白飯。"],
    url: "",
  },
  {
    id: "soy-noodle",
    name: "醬油乾麵",
    emoji: "🍜",
    flavor: "麵食料理",
    minutes: 10,
    ingredients: [
      { name: "麵條", quantity: 1, unit: "份" },
      { name: "醬油", quantity: 1, unit: "份" },
    ],
    note: "食材不多時的安心選擇",
    steps: ["麵條煮熟瀝乾。", "加入醬油拌勻。", "可加青蔥或雞蛋。"],
    url: "",
  },
  {
    id: "apple-yogurt",
    name: "蘋果優格杯",
    emoji: "🍎",
    flavor: "早餐甜點",
    minutes: 5,
    ingredients: [
      { name: "蘋果", quantity: 1, unit: "顆" },
      { name: "優格", quantity: 1, unit: "份" },
    ],
    note: "不用開火，五分鐘完成",
    steps: ["蘋果切丁。", "放入優格中。", "拌勻即可。"],
    url: "",
  },
  {
    id: "milk-oat",
    name: "牛奶燕麥粥",
    emoji: "🥣",
    flavor: "早餐甜點",
    minutes: 10,
    ingredients: [
      { name: "牛奶", quantity: 1, unit: "份" },
      { name: "燕麥", quantity: 1, unit: "份" },
    ],
    note: "溫和飽足，適合早餐",
    steps: ["牛奶加熱。", "加入燕麥小火煮。", "煮至濃稠即可。"],
    url: "",
  },
  {
    id: "pork-cabbage",
    name: "高麗菜炒豬肉",
    emoji: "🥩",
    flavor: "肉類料理",
    minutes: 20,
    ingredients: [
      { name: "豬肉", quantity: 1, unit: "份" },
      { name: "高麗菜", quantity: 2, unit: "份" },
    ],
    note: "肉和菜一起完成",
    steps: ["豬肉切片。", "先炒豬肉至變色。", "加入高麗菜炒軟。"],
    url: "",
  },
];
const recipeSeeds: {
  flavor: string;
  emoji: string;
  names: string[];
  minutes: number;
  ingredients: Ingredient[];
}[] = [
  {
    flavor: "台式家常",
    emoji: "🍳",
    names: [
      "蔥花煎蛋",
      "洋蔥炒肉",
      "家常三杯豆腐",
      "番茄肉醬",
      "蒜香豬肉",
      "高麗菜炒蛋",
      "醬油雞丁",
      "玉米炒蛋",
      "青菜炒肉",
      "家常滷味",
    ],
    minutes: 20,
    ingredients: [
      { name: "雞蛋", quantity: 1, unit: "顆" },
      { name: "青蔥", quantity: 1, unit: "把" },
    ],
  },
  {
    flavor: "西式輕食",
    emoji: "🥪",
    names: [
      "蔬菜沙拉",
      "火腿起司吐司",
      "番茄蛋沙拉",
      "奶油玉米",
      "優格水果杯",
      "雞肉三明治",
      "鮪魚吐司",
      "起司焗蔬菜",
      "蔬菜蛋捲",
      "早餐法式吐司",
    ],
    minutes: 12,
    ingredients: [
      { name: "吐司", quantity: 2, unit: "片" },
      { name: "起司", quantity: 1, unit: "片" },
    ],
  },
  {
    flavor: "清爽湯品",
    emoji: "🍲",
    names: [
      "青菜豆腐湯",
      "玉米蛋花湯",
      "洋蔥清湯",
      "蔬菜味噌湯",
      "金針菇蛋花湯",
      "蘿蔔清湯",
      "番茄蔬菜湯",
      "雞肉蔬菜湯",
      "紫菜豆腐湯",
      "清爽貢丸湯",
    ],
    minutes: 20,
    ingredients: [
      { name: "青菜", quantity: 1, unit: "把" },
      { name: "豆腐", quantity: 1, unit: "盒" },
    ],
  },
  {
    flavor: "麵食料理",
    emoji: "🍜",
    names: [
      "番茄湯麵",
      "貢丸蔬菜麵",
      "麻醬乾麵",
      "青菜蛋麵",
      "泡菜拌麵",
      "雞絲拌麵",
      "蔥油拌麵",
      "豆腐湯麵",
      "海鮮麵",
      "咖哩拌麵",
    ],
    minutes: 15,
    ingredients: [
      { name: "麵條", quantity: 1, unit: "份" },
      { name: "青菜", quantity: 1, unit: "把" },
    ],
  },
  {
    flavor: "日式風味",
    emoji: "🍛",
    names: [
      "親子丼",
      "日式炒烏龍",
      "照燒雞肉",
      "日式咖哩",
      "味噌豆腐",
      "玉子燒",
      "日式豬肉丼",
      "和風蔬菜",
      "日式炒飯",
      "茶泡飯",
    ],
    minutes: 25,
    ingredients: [
      { name: "雞蛋", quantity: 1, unit: "顆" },
      { name: "洋蔥", quantity: 1, unit: "顆" },
    ],
  },
  {
    flavor: "蔬菜料理",
    emoji: "🥬",
    names: [
      "蒜炒青菜",
      "清炒高麗菜",
      "涼拌小黃瓜",
      "番茄拌洋蔥",
      "玉米炒蛋",
      "金針菇炒蛋",
      "蔬菜煎餅",
      "胡椒杏鮑菇",
      "紅蘿蔔炒蛋",
      "蔬菜豆腐",
    ],
    minutes: 15,
    ingredients: [
      { name: "青菜", quantity: 1, unit: "把" },
      { name: "醬油", quantity: 1, unit: "份" },
    ],
  },
  {
    flavor: "早餐甜點",
    emoji: "🥞",
    names: [
      "香蕉燕麥",
      "蘋果優格杯",
      "牛奶燕麥粥",
      "水果吐司",
      "起司蛋餅",
      "蜂蜜香蕉",
      "優格水果碗",
      "玉米蛋餅",
      "奶油吐司",
      "蘋果煎餅",
    ],
    minutes: 10,
    ingredients: [
      { name: "雞蛋", quantity: 1, unit: "顆" },
      { name: "牛奶", quantity: 1, unit: "份" },
    ],
  },
  {
    flavor: "肉類料理",
    emoji: "🥩",
    names: [
      "洋蔥牛肉片",
      "高麗菜炒豬肉",
      "香腸炒蛋",
      "雞胸肉蔬菜盤",
      "貢丸煎蛋",
      "豬肉蔥蛋",
      "黑胡椒雞丁",
      "蒜香豬排",
      "牛肉蔬菜炒",
      "雞肉拌飯",
    ],
    minutes: 25,
    ingredients: [
      { name: "豬肉", quantity: 1, unit: "份" },
      { name: "洋蔥", quantity: 1, unit: "顆" },
    ],
  },
];
const generatedRecipes = recipeSeeds.flatMap((seed) =>
  seed.names.map((name, index) => ({
    id: `generated-${seed.flavor}-${index}`,
    name,
    emoji: seed.emoji,
    flavor: seed.flavor,
    minutes: seed.minutes + (index % 3) * 3,
    ingredients: seed.ingredients,
    note: "可以依照冰箱現有食材調整",
    steps: ["先準備並清洗食材。", "依火候煮熟或炒香。", "最後調味即可享用。"],
    url: "",
  })),
);
const recipes: Recipe[] = [...baseRecipes, ...generatedRecipes];
function recipeIcon(name: string, fallback: string) {
  if (/湯|湯麵|味噌|清湯/.test(name)) return "🍲";
  if (/麵|烏龍|乾麵/.test(name)) return "🍜";
  if (/吐司|三明治|沙拉/.test(name)) return "🥪";
  if (/咖哩/.test(name)) return "🍛";
  if (/牛奶|燕麥|優格|水果|香蕉|蘋果|蜂蜜|法式/.test(name)) return "🍎";
  if (/蛋|玉子|蛋餅|煎蛋/.test(name)) return "🍳";
  if (/飯|丼|炒飯|茶泡飯/.test(name)) return "🍚";
  if (/肉|雞|豬|牛|排|香腸|貢丸/.test(name)) return "🥩";
  if (/蔬菜|青菜|高麗菜|小黃瓜|菇|蘿蔔/.test(name)) return "🥬";
  return fallback;
}
const today = () => new Date().toISOString().slice(0, 10),
  future = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  },
  left = (d: string) =>
    Math.ceil((new Date(d + "T23:59:59").getTime() - Date.now()) / 86400000),
  label = (d: string) =>
    left(d) < 0
      ? "已過期"
      : left(d) === 0
        ? "今天到期"
        : "還有 " + left(d) + " 天";
function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
// @ts-ignore The existing compact component accepts the callback prop at runtime.
export default function Home() {
  const [v, setV] = useState<View>("home"),
    [foods, setFoods] = useState<Food[]>([]),
    [shop, setShop] = useState<Shop[]>([]),
    [notice, setNotice] = useState("");
  useEffect(() => {
    setFoods(read(FK, []));
    setShop(read(SK, []));
  }, []);
  useEffect(() => {
    localStorage.setItem(FK, JSON.stringify(foods));
    localStorage.setItem(SK, JSON.stringify(shop));
  }, [foods, shop]);
  function add(r: Recipe) {
    const missing = r.ingredients.filter((i) => {
      const f = foods.find((x) => !x.done && x.name === i.name);
      return !f || f.quantity < i.quantity;
    });
    setShop((old) => {
      const n = [...old];
      missing.forEach((i) => {
        const f = n.find((x) => !x.done && x.name === i.name);
        if (f) f.quantity = Math.max(f.quantity, i.quantity);
        else
          n.push({
            id: crypto.randomUUID(),
            name: i.name,
            quantity: i.quantity,
            unit: i.unit,
            category:
              categories.find((c) => catalog[c].includes(i.name)) || "其他",
            source: r.name,
            done: false,
          });
      });
      return n;
    });
    setNotice("已加入缺少食材");
  }
  return (
    <main className="shell">
      <header className="topbar">
        <button className="brand" onClick={() => setV("home")} type="button">
          <span className="logo">🧊</span>
          <span>冰箱管家</span>
        </button>
        <span className="eyebrow">
          {v === "home"
            ? "GOOD TO EAT"
            : v === "fridge"
              ? "MY FRIDGE"
              : v === "recipes"
                ? "FIND FOOD"
                : "SHOPPING"}
        </span>
      </header>
      {v === "home" && <ChatHome foods={foods} add={add} />}{" "}
      {v === "fridge" && <Fridge foods={foods} setFoods={setFoods} />}{" "}
      {v === "recipes" && <RecipePage foods={foods} addMissing={add} />}{" "}
      {v === "shopping" && (
        <Shopping shop={shop} setShop={setShop} setFoods={setFoods} />
      )}
      <nav className="bottom-nav">
        <Nav a={v === "home"} f={() => setV("home")} i="🏠" t="首頁" />
        <Nav a={v === "fridge"} f={() => setV("fridge")} i="🧊" t="我的冰箱" />
        <Nav a={v === "recipes"} f={() => setV("recipes")} i="🍳" t="找料理" />
        <Nav
          a={v === "shopping"}
          f={() => setV("shopping")}
          i="🛒"
          t={`購物 ${shop.filter((x) => !x.done).length}`}
        />
      </nav>
      {notice && <div className="toast success">✓ {notice}</div>}
    </main>
  );
}
function Nav(p: { a: boolean; f: () => void; i: string; t: string }) {
  return (
    <button
      className={`nav-item ${p.a ? "active" : ""}`}
      onClick={p.f}
      type="button"
    >
      {p.i} {p.t}
    </button>
  );
}
function ChatHome({ foods, add }: { foods: Food[]; add: (r: Recipe) => void }) {
  const [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [chat, setChat] = useState<Chat[]>([]);
  async function ask(q = input) {
    if (!q.trim() || busy) return;
    setInput("");
    setBusy(true);
    setChat((h) => [...h, { role: "user", text: q }]);
    try {
      const r = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: q, foods, recipes, history: chat }),
      });
      if (!r.ok) throw new Error();
      const d = (await r.json()) as Reply;
      setChat((h) => [...h, { role: "assistant", text: d.message, reply: d }]);
    } catch {
      setChat((h) => [
        ...h,
        {
          role: "assistant",
          text: "我現在暫時連不上料理助手，你仍可以問我料理、食材或煮飯問題。",
          error: true,
          retry: q,
        },
      ]);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="ai-hero">
      <div className="eyebrow">AI 冰箱管家</div>
      <h1 className="title">想聊什麼都可以</h1>
      <div className="ai-chat">
        <div className="ai-message assistant">
          <span className="ai-avatar">✦</span>
          <div>
            <strong>你好！我是你的冰箱管家</strong>
            <p>早安！想吃什麼、怎麼切菜，或煮飯卡住了，都可以問我。</p>
          </div>
        </div>
        {chat.map((x, i) => (
          <div className={`chat-entry ${x.role}`} key={i}>
            <div className={`ai-message ${x.role}`}>
              <span className="ai-avatar">
                {x.role === "user" ? "你" : "✦"}
              </span>
              <div>{x.text}</div>
            </div>
            {x.error && (
              <button
                className="retry-btn"
                onClick={() => ask(x.retry || "")}
                type="button"
              >
                ↻ 重新嘗試
              </button>
            )}
            {x.reply && <AIResult data={x.reply} add={add} />}
          </div>
        ))}
        {busy && (
          <div className="ai-loading" role="status">
            正在想一個適合你的回答…
          </div>
        )}
      </div>
      <form
        className="ai-input-row"
        onSubmit={(e) => {
          e.preventDefault();
          ask();
        }}
      >
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="輸入你想聊的事，料理問題也可以…"
          disabled={busy}
        />
        <button
          className="primary ai-send"
          disabled={busy || !input.trim()}
          type="submit"
        >
          {busy ? "處理中…" : "送出"}
        </button>
      </form>
      {chat.length === 0 && (
        <div className="quick-questions">
          <div className="section-title">
            <h2>試著問我</h2>
          </div>
          <div className="quick-question-grid">
            {[
              "今天吃什麼？",
              "消耗快過期食材",
              "15 分鐘內能做什麼？",
              "今天不想洗太多鍋",
              "用現有食材就好",
            ].map((x) => (
              <button key={x} onClick={() => ask(x)} type="button">
                {x}
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
function AIResult({ data, add }: { data: Reply; add: (r: Recipe) => void }) {
  const r = data.generatedRecipe || recipes.find((x) => x.id === data.recipeId);
  if (!r && !data.reason?.length && !data.suggestions?.length) return null;
  return (
    <div className="ai-result">
      {r && (
        <div className="ai-result-title">
          <span>{data.emoji || r.emoji}</span>
          <div>
            <strong>{data.recipeName || r.name}</strong>
            {data.cookTime && <small>約 {data.cookTime} 分鐘</small>}
          </div>
        </div>
      )}
      {data.reason?.map((x) => (
        <div className="ai-reasons" key={x}>
          💡 {x}
        </div>
      ))}
      {data.availableIngredients?.length > 0 && (
        <p>你已有：{data.availableIngredients.join("、")}</p>
      )}
      {data.missingIngredients?.length > 0 && (
        <p>還缺少：{data.missingIngredients.join("、")}</p>
      )}
      {data.suggestions?.map((x) => (
        <p key={x}>✨ {x}</p>
      ))}
      {r && data.missingIngredients?.length > 0 && (
        <button className="soft-btn" onClick={() => add(r)} type="button">
          加入缺少食材
        </button>
      )}
    </div>
  );
}
function Fridge({
  foods,
  setFoods,
}: {
  foods: Food[];
  setFoods: React.Dispatch<React.SetStateAction<Food[]>>;
}) {
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState("蔬菜"),
    [picked, setPicked] = useState(""),
    [custom, setCustom] = useState(""),
    [unit, setUnit] = useState("份"),
    [qty, setQty] = useState(1),
    [expiry, setExpiry] = useState(future(5)),
    [search, setSearch] = useState(""),
    [soon, setSoon] = useState(false),
    [customItems, setCustomItems] = useState<Record<string, string[]>>({});
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_KEY);
      if (saved) setCustomItems(JSON.parse(saved));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customItems));
  }, [customItems]);
  useEffect(() => {
    if (picked) {
      const d = defaults(picked);
      setUnit(d.unit);
      setExpiry(d.expiry);
    }
  }, [picked]);
  const list = foods.filter(
    (f) =>
      !f.done &&
      (!search || f.name.includes(search)) &&
      (!soon || left(f.expiry) <= 3),
  );
  function addFood() {
    const name = (picked || custom).trim();
    if (!name) return;
    if (custom && !catalog[selected].includes(name))
      setCustomItems((old) => ({
        ...old,
        [selected]: Array.from(new Set([...(old[selected] || []), name])),
      }));
    const preset = picked ? defaults(picked) : null;
    const finalUnit = preset?.unit || unit;
    const finalExpiry = preset?.expiry || expiry;
    setFoods((old) => {
      const found = old.find((f) => !f.done && f.name === name);
      if (found)
        return old.map((f) =>
          f.id === found.id
            ? {
                ...f,
                quantity: f.quantity + qty,
                unit: finalUnit,
                expiry: f.expiry < finalExpiry ? f.expiry : finalExpiry,
              }
            : f,
        );
      return [
        {
          id: crypto.randomUUID(),
          name,
          quantity: qty,
          unit: finalUnit,
          expiry: finalExpiry,
          category: selected,
          done: false,
        },
        ...old,
      ];
    });
    setPicked("");
    setCustom("");
    setQty(1);
    setOpen(false);
  }
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">庫存管理</div>
        <h1 className="title">我的冰箱</h1>
      </div>
      <section className="card inventory-card">
        <div className="section-title">
          <h2>目前庫存 ({list.length})</h2>
          <button
            className="primary small-btn"
            onClick={() => setOpen(!open)}
            type="button"
          >
            {open ? "收起新增" : "＋ 新增食材"}
          </button>
        </div>
        <input
          className="input inventory-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜尋庫存食材"
        />
        <button
          className="filter-button"
          onClick={() => setSoon(!soon)}
          type="button"
        >
          {soon ? "顯示全部" : "只看即將到期"}
        </button>
        <div className="fridge-visual">
          {categories.map((c) => (
            <div className="fridge-shelf" key={c}>
              <div className="fridge-category">
                {icons[c]} {c}
              </div>
              {list
                .filter((f) => f.category === c)
                .map((f) => (
                  <button
                    className="fridge-food"
                    key={f.id}
                    onClick={() =>
                      setFoods((old) =>
                        old.map((x) =>
                          x.id === f.id
                            ? { ...x, quantity: x.quantity + 1 }
                            : x,
                        ),
                      )
                    }
                    type="button"
                  >
                    <span>{icons[c]}</span>
                    <strong>{f.name}</strong>
                    <small>
                      {f.quantity} {f.unit} · {label(f.expiry)}
                    </small>
                  </button>
                ))}
            </div>
          ))}
        </div>
      </section>
      {open && (
        <section className="card form-card">
          <h2>新增食材</h2>
          <div className="category-grid">
            {categories.map((c) => (
              <button
                className={`category-tile ${selected === c ? "selected" : ""}`}
                key={c}
                onClick={() => {
                  setSelected(c);
                  setPicked("");
                }}
                type="button"
              >
                <span>{icons[c]}</span>
                <strong>{c}</strong>
                <small>
                  {catalog[c].length + (customItems[c]?.length || 0)} 種
                </small>
              </button>
            ))}
          </div>
          <div className="ingredient-grid compact-grid">
            {[...catalog[selected], ...(customItems[selected] || [])].map(
              (x) => (
                <button
                  className={`ingredient-btn ${picked === x ? "chosen" : ""}`}
                  key={x}
                  onClick={() => {
                    setPicked(x);
                    setCustom("");
                  }}
                  onDoubleClick={() => {
                    const next = window.prompt("修改常用食材名稱", x)?.trim();
                    if (next && next !== x)
                      setCustomItems((old) => ({
                        ...old,
                        [selected]: Array.from(
                          new Set([...(old[selected] || []), next]),
                        ),
                      }));
                  }}
                  title="雙擊可編輯食材名稱"
                  type="button"
                >
                  {x} <span className="preset-edit-hint">✎</span>
                </button>
              ),
            )}
            <button
              className="ingredient-btn free-btn"
              onClick={() => setPicked("")}
              type="button"
            >
              ＋ 自由輸入
            </button>
            {(customItems[selected] || []).length > 0 && (
              <button
                className="ingredient-btn edit-preset-btn"
                onClick={() => {
                  const oldName = window.prompt(
                    "要修改哪個常用食材？",
                    customItems[selected][0],
                  );
                  if (!oldName || !customItems[selected].includes(oldName))
                    return;
                  const next = window
                    .prompt("請輸入新的食材名稱", oldName)
                    ?.trim();
                  if (next && next !== oldName)
                    setCustomItems((old) => ({
                      ...old,
                      [selected]: old[selected].map((item) =>
                        item === oldName ? next : item,
                      ),
                    }));
                }}
                type="button"
              >
                ✎ 編輯常用食材
              </button>
            )}
          </div>
          <input
            className="input"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setPicked("");
            }}
            placeholder="自由輸入食材名稱"
          />
          <div className="row">
            <select
              className="input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {units.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <div className="quantity-picker">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                type="button"
              >
                −
              </button>
              <strong>{qty}</strong>
              <button onClick={() => setQty(qty + 1)} type="button">
                ＋
              </button>
            </div>
          </div>
          <label className="label">到期日</label>
          <input
            className="input"
            type="date"
            min={today()}
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
          <button
            className="primary"
            disabled={!picked && !custom.trim()}
            onClick={addFood}
            type="button"
          >
            確認加入冰箱
          </button>
        </section>
      )}
    </>
  );
}
function RecipePage({
  foods,
  addMissing,
}: {
  foods: Food[];
  addMissing: (r: Recipe) => void;
}) {
  const [q, setQ] = useState(""),
    [flavor, setFlavor] = useState("全部"),
    [selected, setSelected] = useState<Recipe | null>(null),
    [onlyAvailable, setOnlyAvailable] = useState(false);
  const list = recipes.filter(
    (r) =>
      (flavor === "全部" || r.flavor === flavor) &&
      (!onlyAvailable ||
        r.ingredients.every((i) =>
          foods.some(
            (f) => !f.done && f.name === i.name && f.quantity >= i.quantity,
          ),
        )) &&
      (!q ||
        r.name.includes(q) ||
        r.ingredients.some((i) => i.name.includes(q))),
  );
  if (selected)
    return (
      <section className="card detail-panel">
        <button
          className="back-btn"
          onClick={() => setSelected(null)}
          type="button"
        >
          ← 返回料理
        </button>
        <div className="recipe-emoji large">{selected.emoji}</div>
        <h1 className="title">{selected.name}</h1>
        <p className="subtle">
          約 {selected.minutes} 分鐘 · {selected.flavor}
        </p>
        <h2>食材與份量</h2>
        {selected.ingredients.map((i) => (
          <p key={i.name}>
            • {i.name} {i.quantity}
            {i.unit}
          </p>
        ))}
        <h2>製作步驟</h2>
        <ol>
          {selected.steps.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ol>
        <button
          className="primary"
          onClick={() => addMissing(selected)}
          type="button"
        >
          缺少食材加入購物
        </button>
      </section>
    );
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">料理探索</div>
        <h1 className="title">找料理</h1>
      </div>
      <section className="card recipe-toolbar">
        <input
          className="input search-box"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜尋料理或食材"
        />
        <div className="flavor-strip">
          {flavors.map((f) => (
            <button
              className={`flavor-choice ${flavor === f ? "active" : ""}`}
              key={f}
              onClick={() => setFlavor(f)}
              type="button"
            >
              <span>{flavorIcons[f] || "🍽️"}</span> {f}
            </button>
          ))}
        </div>
        <button
          className={`filter-button ${onlyAvailable ? "active" : ""}`}
          onClick={() => setOnlyAvailable(!onlyAvailable)}
          type="button"
        >
          {onlyAvailable ? "顯示全部料理" : "🧊 已有食材"}
        </button>
      </section>
      <section className="recipe-section">
        <div className="section-title">
          <h2>推薦料理</h2>
          <span>{list.length} 道</span>
        </div>
        <div className="recipe-grid">
          {list.map((r) => (
            <article className="card recipe-card" key={r.id}>
              <div className="recipe-emoji">{recipeIcon(r.name, r.emoji)}</div>
              <div className="recipe-info">
                <h3>{r.name}</h3>
                <p className="subtle">
                  約 {r.minutes} 分鐘 · {r.flavor}
                </p>
                <p>{r.note}</p>
                <button
                  className="secondary"
                  onClick={() => setSelected(r)}
                  type="button"
                >
                  查看食譜
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
function Shopping({
  shop,
  setShop,
  setFoods,
}: {
  shop: Shop[];
  setShop: React.Dispatch<React.SetStateAction<Shop[]>>;
  setFoods: React.Dispatch<React.SetStateAction<Food[]>>;
}) {
  const [open, setOpen] = useState(false),
    [selected, setSelected] = useState("蔬菜"),
    [picked, setPicked] = useState(""),
    [custom, setCustom] = useState(""),
    [unit, setUnit] = useState("份"),
    [qty, setQty] = useState(1),
    [editing, setEditing] = useState<Shop | null>(null),
    [customItems, setCustomItems] = useState<Record<string, string[]>>({}),
    [hiddenItems, setHiddenItems] = useState<Record<string, string[]>>({});
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_KEY);
      if (saved) setCustomItems(JSON.parse(saved));
      const hidden = localStorage.getItem(`${CUSTOM_KEY}-hidden`);
      if (hidden) setHiddenItems(JSON.parse(hidden));
    } catch {}
  }, []);
  useEffect(() => {
    localStorage.setItem(CUSTOM_KEY, JSON.stringify(customItems));
  }, [customItems]);
  useEffect(() => {
    localStorage.setItem(`${CUSTOM_KEY}-hidden`, JSON.stringify(hiddenItems));
  }, [hiddenItems]);
  useEffect(() => {
    if (picked) setUnit(defaults(picked).unit);
  }, [picked]);
  const add = () => {
    const name = (picked || custom).trim();
    if (!name) return;
    if (custom && !catalog[selected].includes(name))
      setCustomItems((old) => ({
        ...old,
        [selected]: Array.from(new Set([...(old[selected] || []), name])),
      }));
    setShop((old) => {
      if (editing)
        return old.map((x) =>
          x.id === editing.id
            ? { ...x, name, quantity: qty, unit, category: selected }
            : x,
        );
      const found = old.find((x) => !x.done && x.name === name);
      if (found)
        return old.map((x) =>
          x.id === found.id ? { ...x, quantity: x.quantity + qty } : x,
        );
      return [
        {
          id: crypto.randomUUID(),
          name,
          quantity: qty,
          unit,
          category: selected,
          source: "手動加入",
          done: false,
        },
        ...old,
      ];
    });
    setPicked("");
    setCustom("");
    setQty(1);
    setEditing(null);
    setOpen(false);
  };
  const edit = (item: Shop) => {
    setEditing(item);
    setSelected(item.category);
    setPicked(catalog[item.category]?.includes(item.name) ? item.name : "");
    setCustom(catalog[item.category]?.includes(item.name) ? "" : item.name);
    setUnit(item.unit);
    setQty(item.quantity);
    setOpen(true);
  };
  const move = () => {
    const done = shop.filter((x) => x.done);
    setFoods((old) => [
      ...old,
      ...done.map((x) => ({
        id: crypto.randomUUID(),
        name: x.name,
        quantity: x.quantity,
        unit: x.unit,
        expiry: future(5),
        category: x.category,
        done: false,
      })),
    ]);
    setShop(shop.filter((x) => !x.done));
  };
  return (
    <>
      <div className="page-heading">
        <div className="eyebrow">採買管理</div>
        <h1 className="title">購物清單</h1>
      </div>
      <section className="card shopping-list">
        <div className="section-title">
          <h2>下次採買</h2>
          <div>
            <button
              className="primary small-btn"
              onClick={() => setOpen(!open)}
              type="button"
            >
              {open ? "收起新增" : "＋ 新增採買"}
            </button>
            <button
              className="soft-btn"
              disabled={!shop.some((x) => x.done)}
              onClick={move}
              type="button"
            >
              移入冰箱
            </button>
          </div>
        </div>
        {shop.length ? (
          shop.map((x) => (
            <div className="shopping-row" key={x.id}>
              <button
                className={`shopping-tile ${x.done ? "completed" : ""}`}
                onClick={() =>
                  setShop(
                    shop.map((y) =>
                      y.id === x.id ? { ...y, done: !y.done } : y,
                    ),
                  )
                }
                type="button"
              >
                {x.done ? "✓" : "○"} {x.name} · {x.quantity} {x.unit}{" "}
                <small>{x.source}</small>
              </button>
              <button
                className="edit-btn"
                onClick={() => edit(x)}
                type="button"
              >
                編輯
              </button>
            </div>
          ))
        ) : (
          <p>購物清單目前是空的。</p>
        )}
      </section>
      {open && (
        <section className="card shopping-form">
          <h2>{editing ? "編輯採買" : "新增採買"}</h2>
          <div className="category-grid">
            {categories.map((c) => (
              <button
                className={`category-tile ${selected === c ? "selected" : ""}`}
                key={c}
                onClick={() => {
                  setSelected(c);
                  setPicked("");
                  setCustom("");
                }}
                type="button"
              >
                <span>{icons[c]}</span>
                <strong>{c}</strong>
                <small>
                  {catalog[c].length + (customItems[c]?.length || 0)} 種
                </small>
              </button>
            ))}
          </div>
          <div className="ingredient-grid compact-grid">
            {[...catalog[selected], ...(customItems[selected] || [])]
              .filter((x) => !(hiddenItems[selected] || []).includes(x))
              .map((x) => (
                <button
                  className={`ingredient-btn ${picked === x ? "chosen" : ""}`}
                  key={x}
                  onClick={() => {
                    setPicked(x);
                    setCustom("");
                  }}
                  onDoubleClick={() => {
                    const next = window.prompt("修改食材名稱", x)?.trim();
                    if (!next || next === x) return;
                    setCustomItems((old) => ({
                      ...old,
                      [selected]: Array.from(
                        new Set([...(old[selected] || []), next]),
                      ),
                    }));
                    if (catalog[selected].includes(x))
                      setHiddenItems((old) => ({
                        ...old,
                        [selected]: [...(old[selected] || []), x],
                      }));
                    else
                      setCustomItems((old) => ({
                        ...old,
                        [selected]: (old[selected] || [])
                          .filter((item) => item !== x)
                          .concat(next),
                      }));
                  }}
                  title="雙擊可編輯食材名稱"
                  type="button"
                >
                  {x} <span className="preset-edit-hint">✎</span>
                </button>
              ))}
            <button
              className="ingredient-btn free-btn"
              onClick={() => setPicked("")}
              type="button"
            >
              ＋ 自由輸入
            </button>
          </div>
          <input
            className="input"
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              setPicked("");
            }}
            placeholder="輸入或選擇食材名稱"
          />
          <div className="row">
            <select
              className="input"
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
            >
              {categories.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
            <select
              className="input"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            >
              {units.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="quantity-picker">
            <button onClick={() => setQty(Math.max(1, qty - 1))} type="button">
              −
            </button>
            <strong>{qty}</strong>
            <button onClick={() => setQty(qty + 1)} type="button">
              ＋
            </button>
          </div>
          <button
            className="primary"
            disabled={!picked && !custom.trim()}
            onClick={add}
            type="button"
          >
            {editing ? "儲存變更" : "加入購物清單"}
          </button>
        </section>
      )}
    </>
  );
}
