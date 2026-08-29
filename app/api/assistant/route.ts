import { NextResponse } from "next/server";

type Food={name:string;quantity:number;expiry?:string;done?:boolean};
type Ingredient={name:string;quantity:number;unit:string};
type Recipe={id:string;name:string;emoji:string;minutes:number;ingredients:Ingredient[];note:string};
type HistoryItem={role?:string;text?:string;reply?:{recipeId?:string|null;recipeName?:string|null}};
const days=(d?:string)=>d?Math.ceil((new Date(d+"T23:59:59").getTime()-Date.now())/86400000):99;

export async function POST(request:Request){
  const body=await request.json() as {message?:string;foods?:Food[];recipes?:Recipe[];history?:HistoryItem[]};
  const message=(body.message||"").trim(), foods=(body.foods||[]).filter(f=>!f.done), recipes=body.recipes||[], history=body.history||[];
  const text=message.toLowerCase(), previous=history.map(x=>x.reply?.recipeId).filter(Boolean) as string[];
  const timeMatch=text.match(/(\d+)\s*分鐘/), limit=timeMatch?Number(timeMatch[1]):99;
  const avoidEgg=/不吃蛋|不要蛋|不想吃蛋/.test(text), avoidMeat=/不吃肉|不要肉|素食/.test(text), tired=/好累|不想洗|少洗|簡單|懶得/.test(text), noBuy=/不出門|不想買|不要買|不想出去/.test(text), clear=/清冰箱|快過期|即期/.test(text);
  const wantsNoodle=/麵|麵食/.test(text), wantsSoup=/湯|喝的/.test(text), wantsRice=/飯|米飯/.test(text), wantsSpicy=/辣|酸辣/.test(text);
  const isAnother=/換一個|另一個|別的推薦|不要這個/.test(text);
  const scored=recipes.map(recipe=>{
    const available=recipe.ingredients.filter(i=>foods.some(f=>f.name===i.name&&f.quantity>=i.quantity)), missing=recipe.ingredients.filter(i=>!foods.some(f=>f.name===i.name&&f.quantity>=i.quantity)), expiring=recipe.ingredients.filter(i=>foods.some(f=>f.name===i.name&&days(f.expiry)<=3));
    let score=available.length*18-missing.length*12+expiring.length*16;
    if(previous.includes(recipe.id)&&(isAnother||previous.length>0))score-=90;
    if(recipe.minutes<=limit)score+=20;else if(limit<99)score-=40;
    if(tired&&recipe.minutes<=20)score+=25;if(noBuy)score-=missing.length*20;if(clear)score+=expiring.length*28;
    if(wantsNoodle&&recipe.name.includes("麵"))score+=38;if(wantsSoup&&recipe.name.includes("湯"))score+=38;if(wantsRice&&recipe.name.includes("飯"))score+=38;
    if(wantsSpicy&&/咖哩|辣/.test(recipe.name+recipe.note))score+=20;if(text.includes("酸辣湯")&&recipe.name.includes("湯"))score+=45;if(text.includes("番茄")&&recipe.ingredients.some(i=>i.name==="番茄"))score+=24;
    if(avoidEgg&&recipe.ingredients.some(i=>i.name==="雞蛋"))score-=120;if(avoidMeat&&recipe.ingredients.some(i=>/肉|香腸/.test(i.name)))score-=120;
    return{recipe,available,missing,expiring,score};
  }).sort((a,b)=>b.score-a.score);
  const best=scored.find(x=>x.score>-100);
  if(!best)return NextResponse.json({message:foods.length?"我暫時找不到符合條件的料理。可以換個口味，或放寬時間限制。":"你的冰箱目前還沒有食材資料。先加入幾樣食材，我才能更準確地幫你決定今天吃什麼。",recipeId:null,recipeName:null,reason:[],availableIngredients:[],missingIngredients:[],cookTime:null,difficulty:1,actions:[]});
  const expiry=best.expiring.sort((a,b)=>days(foods.find(f=>f.name===a.name)?.expiry)-days(foods.find(f=>f.name===b.name)?.expiry))[0], reason=expiry?[expiry.name+" "+(days(foods.find(f=>f.name===expiry.name)?.expiry)===0?"今天到期":"剩 "+days(foods.find(f=>f.name===expiry.name)?.expiry)+" 天，適合優先用掉")]:[best.available.length+" 項食材已經在冰箱裡"];
  if(tired)reason.push("步驟簡單，適合今天不想忙太久");if(noBuy&&best.missing.length)reason.push("可以先省略缺少食材，做成簡易版");if(limit<99)reason.push("料理時間約 "+best.recipe.minutes+" 分鐘");
  return NextResponse.json({message:noBuy&&best.missing.length?"如果不想出門，可以先做簡易版 "+best.recipe.name+"，缺少的食材先省略。":"可以，"+best.recipe.name+"很適合你現在的需求。",recipeId:best.recipe.id,recipeName:best.recipe.name,emoji:best.recipe.emoji,reason,availableIngredients:best.available.map(i=>i.name),missingIngredients:best.missing.map(i=>i.name),cookTime:best.recipe.minutes,difficulty:1,actions:best.missing.length?["start","detail","shopping","another"]:["start","detail","another"]});
}
