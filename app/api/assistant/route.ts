import { NextResponse } from "next/server";

type Food={name:string;quantity:number;expiry?:string;done?:boolean};
type Ingredient={name:string;quantity:number;unit:string};
type Recipe={id:string;name:string;emoji:string;minutes:number;ingredients:Ingredient[];note:string};
type HistoryItem={role?:string;text?:string;reply?:{recipeId?:string|null;recipeName?:string|null}};
type Preferences={people?:number;methods?:string[];notes?:string};
const days=(d?:string)=>d?Math.ceil((new Date(d+"T23:59:59").getTime()-Date.now())/86400000):99;

async function fallback(request:Request){
  const body=await request.json() as {message?:string;foods?:Food[];recipes?:Recipe[];history?:HistoryItem[]};
  const message=(body.message||"").trim(), foods=(body.foods||[]).filter(f=>!f.done), recipes=body.recipes||[], history=body.history||[];
  const text=message.toLowerCase(), previous=history.map(x=>x.reply?.recipeId).filter(Boolean) as string[];
  const timeMatch=text.match(/(\d+)\s*分鐘/), limit=timeMatch?Number(timeMatch[1]):99;
  const avoidEgg=/不吃蛋|不要蛋|不想吃蛋/.test(text), avoidMeat=/不吃肉|不要肉|素食/.test(text), tired=/好累|不想洗|少洗|簡單|懶得/.test(text), noBuy=/不出門|不想買|不要買|不想出去/.test(text), clear=/清冰箱|快過期|即期/.test(text);
  const wantsNoodle=/麵|麵食/.test(text), wantsSoup=/湯|喝的/.test(text), wantsRice=/飯|米飯/.test(text), wantsSpicy=/辣|酸辣/.test(text);
  const knownIntent=/吃|喝|料理|食譜|煮|做|冰箱|食材|分鐘|推薦|清冰箱|辣|酸|甜|鹹|麵|湯|飯|早餐|午餐|晚餐|不吃|不要|不想|好累|出門|買/.test(text)||recipes.some(r=>text.includes(r.name)||r.ingredients.some(i=>text.includes(i.name)));
  if(!knownIntent){const greetings=["早安！今天想聊點什麼？如果剛好卡在煮飯步驟，也可以直接問我。","嗨，歡迎來找我！料理、食材，甚至煮到一半的小慌張，都可以一起想辦法。","你好呀！我在這裡。你可以隨口聊天，也可以把眼前的料理問題丟給我。"];return NextResponse.json({message:greetings[message.length%greetings.length],recipeId:null,recipeName:null,reason:[],availableIngredients:[],missingIngredients:[],cookTime:null,difficulty:1,actions:["ask"]});}
  const isAnother=/換一個|另一個|別的推薦|不要這個/.test(text);
  const scored=recipes.map(recipe=>{
    const available=recipe.ingredients.filter(i=>foods.some(f=>f.name===i.name&&f.quantity>=i.quantity)), missing=recipe.ingredients.filter(i=>!foods.some(f=>f.name===i.name&&f.quantity>=i.quantity)), expiring=recipe.ingredients.filter(i=>foods.some(f=>f.name===i.name&&days(f.expiry)<=3));
    let score=available.length*18-missing.length*12+expiring.length*16;
    if(previous.includes(recipe.id)&&(isAnother||previous.length>0))score-=90;
    if(recipe.minutes<=limit)score+=20;else if(limit<99)score-=40;
    if(tired&&recipe.minutes<=20)score+=25;if(noBuy)score-=missing.length*20;if(clear)score+=expiring.length*28;
    if(wantsNoodle&&recipe.name.includes("麵"))score+=38;if(wantsSoup&&recipe.name.includes("湯"))score+=38;if(wantsRice&&recipe.name.includes("飯"))score+=38;
    if(wantsSpicy&&/咖哩|辣/.test(recipe.name+recipe.note))score+=130;if(text.includes("酸辣湯")&&recipe.name.includes("湯"))score+=45;if(text.includes("番茄")&&recipe.ingredients.some(i=>i.name==="番茄"))score+=24;
    if(avoidEgg&&recipe.ingredients.some(i=>i.name==="雞蛋"))score-=120;if(avoidMeat&&recipe.ingredients.some(i=>/肉|香腸/.test(i.name)))score-=120;
    return{recipe,available,missing,expiring,score};
  }).sort((a,b)=>b.score-a.score);
  const best=scored.find(x=>x.score>-100);
  if(!best)return NextResponse.json({message:foods.length?"我暫時找不到符合條件的料理。可以換個口味，或放寬時間限制。":"你的冰箱目前還沒有食材資料。先加入幾樣食材，我才能更準確地幫你決定今天吃什麼。",recipeId:null,recipeName:null,reason:[],availableIngredients:[],missingIngredients:[],cookTime:null,difficulty:1,actions:[]});
  const expiry=best.expiring.sort((a,b)=>days(foods.find(f=>f.name===a.name)?.expiry)-days(foods.find(f=>f.name===b.name)?.expiry))[0], reason=expiry?[expiry.name+" "+(days(foods.find(f=>f.name===expiry.name)?.expiry)===0?"今天到期":"剩 "+days(foods.find(f=>f.name===expiry.name)?.expiry)+" 天，適合優先用掉")]:[best.available.length+" 項食材已經在冰箱裡"];
  if(tired)reason.push("步驟簡單，適合今天不想忙太久");if(noBuy&&best.missing.length)reason.push("可以先省略缺少食材，做成簡易版");if(limit<99)reason.push("料理時間約 "+best.recipe.minutes+" 分鐘");
  return NextResponse.json({message:noBuy&&best.missing.length?"如果不想出門，可以先做簡易版 "+best.recipe.name+"，缺少的食材先省略。":"可以，"+best.recipe.name+"很適合你現在的需求。",recipeId:best.recipe.id,recipeName:best.recipe.name,emoji:best.recipe.emoji,reason,availableIngredients:best.available.map(i=>i.name),missingIngredients:best.missing.map(i=>i.name),cookTime:best.recipe.minutes,difficulty:1,actions:best.missing.length?["start","detail","shopping","another"]:["start","detail","another"]});
}

const replySchema={
  type:"object",
  additionalProperties:false,
  properties:{
    message:{type:"string"},
    recipeId:{type:["string","null"]},
    recipeName:{type:["string","null"]},
    emoji:{type:"string"},
    generatedRecipe:{type:["object","null"],additionalProperties:false,properties:{id:{type:"string"},name:{type:"string"},emoji:{type:"string"},minutes:{type:"number"},ingredients:{type:"array",items:{type:"object",additionalProperties:false,properties:{name:{type:"string"},quantity:{type:"number"},unit:{type:"string"}},required:["name","quantity","unit"]}},note:{type:"string"},steps:{type:"array",items:{type:"string"}},url:{type:"string"}},required:["id","name","emoji","minutes","ingredients","note","steps","url"]},
    suggestions:{type:"array",items:{type:"string"}},
    reason:{type:"array",items:{type:"string"}},
    availableIngredients:{type:"array",items:{type:"string"}},
    missingIngredients:{type:"array",items:{type:"string"}},
    cookTime:{type:["number","null"]},
    difficulty:{type:"number"},
    actions:{type:"array",items:{type:"string"}}
  },
  required:["message","recipeId","recipeName","emoji","generatedRecipe","suggestions","reason","availableIngredients","missingIngredients","cookTime","difficulty","actions"]
};

export async function POST(request:Request){
  const raw=await request.clone().json() as {message?:string;foods?:Food[];recipes?:Recipe[];history?:HistoryItem[];preferences?:Preferences};
  if(!process.env.OPENAI_API_KEY)return fallback(request);
  try{
    const foods=(raw.foods||[]).filter(f=>!f.done).slice(0,100);
    const recipes=(raw.recipes||[]).slice(0,100);
    const history=(raw.history||[]).slice(-8).map(x=>({role:x.role==="assistant"?"assistant":"user",content:x.text||""}));
    const system=`你是「冰箱管家」，用繁體中文回答，語氣像貼心、實用的料理助手。
你只能根據提供的冰箱食材判斷「已有什麼」，不要虛構庫存；但你可以自由創作不在內建食譜庫的新料理。若缺少食材，清楚列出缺少項目。
理解使用者的多輪對話，例如「換一個」、「那不要蛋」、「剛剛那道改兩人份」。
若使用者只是閒聊，仍要自然回到料理、冰箱或購物清單相關協助。
若使用內建食譜，填 recipeId 並將 generatedRecipe 設為 null；若是創意料理，recipeId 填 null 並完整填 generatedRecipe（id 固定填 ai-generated）。actions 只能使用 ask、start、detail、shopping、another。
回覆要有變化，避免每次使用相同開場；可用溫暖、俏皮但實用的語氣。可以回答打招呼、情緒、切菜、火候、鍋具太小、食材太大、煮飯失敗等問題，不必硬塞食譜。遇到生熟、過敏或安全疑慮時要提醒使用者確認食材狀態並使用安全做法。
reason 最多 3 項，suggestions 放 0 到 3 個替代食材或下一步建議。`;
    const payload={
      model:process.env.OPENAI_MODEL||"gpt-5-mini",
      store:false,
      input:[
        {role:"system",content:[{type:"input_text",text:system}]},
        ...history.map(x=>({role:x.role,content:[{type:"input_text",text:x.content}]})),
        {role:"user",content:[{type:"input_text",text:`目前冰箱：${JSON.stringify(foods)}\n可用食譜：${JSON.stringify(recipes)}\n使用者偏好：${JSON.stringify(raw.preferences||{})}\n本次問題：${String(raw.message||"")}`}]}
      ],
      text:{format:{type:"json_schema",name:"fridge_reply",strict:true,schema:replySchema}}
    };
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
    if(!response.ok)throw new Error("OpenAI request failed");
    const data=await response.json() as {output_text?:string};
    const parsed=JSON.parse(data.output_text||"");
    const recipe=recipes.find(r=>r.id===parsed.recipeId);
    if(parsed.recipeId&&!recipe)throw new Error("Invalid recipe id");
    const generated=parsed.generatedRecipe?.name?{...parsed.generatedRecipe,id:"ai-generated"}:null;
    if(!recipe&&!generated&&parsed.recipeId)throw new Error("Missing recipe");
    return NextResponse.json({...parsed,recipeId:recipe?.id||null,recipeName:recipe?.name||generated?.name||null,emoji:recipe?.emoji||generated?.emoji||parsed.emoji||"🍽️",generatedRecipe:generated,cookTime:recipe?.minutes??generated?.minutes??parsed.cookTime??null,difficulty:Math.min(3,Math.max(1,Number(parsed.difficulty)||1))});
  }catch(error){
    console.error("AI assistant fallback:",error);
    return fallback(request);
  }
}
