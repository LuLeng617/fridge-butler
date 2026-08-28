import { NextResponse } from "next/server";

type Food={name:string;quantity:number;expiry?:string;done?:boolean};
type Ingredient={name:string;quantity:number;unit:string};
type Recipe={id:string;name:string;emoji:string;minutes:number;ingredients:Ingredient[];note:string};
const days=(d?:string)=>d?Math.ceil((new Date(d+"T23:59:59").getTime()-Date.now())/86400000):99;

export async function POST(request:Request){
  const body=await request.json() as {message?:string;foods?:Food[];recipes?:Recipe[]};
  const message=(body.message||"").trim(), foods=(body.foods||[]).filter(f=>!f.done), recipes=body.recipes||[], text=message.toLowerCase();
  const timeMatch=text.match(/(\d+)\s*分鐘/), limit=timeMatch?Number(timeMatch[1]):99;
  const avoidEgg=/不吃蛋|不要蛋|不想吃蛋/.test(text), tired=/好累|不想洗|少洗|簡單|懶得/.test(text), clear=/清冰箱|快過期|即期/.test(text), wantsNoodle=/麵|麵食/.test(text);
  const scored=recipes.map(recipe=>{
    const available=recipe.ingredients.filter(i=>foods.some(f=>f.name===i.name&&f.quantity>=i.quantity)), missing=recipe.ingredients.filter(i=>!foods.some(f=>f.name===i.name&&f.quantity>=i.quantity)), expiring=recipe.ingredients.filter(i=>foods.some(f=>f.name===i.name&&days(f.expiry)<=3));
    let score=available.length*18-missing.length*12+expiring.length*16;
    if(recipe.minutes<=limit)score+=20;else if(limit<99)score-=25;
    if(tired&&recipe.minutes<=20)score+=18;if(clear)score+=expiring.length*25;if(wantsNoodle&&recipe.name.includes("麵"))score+=35;if(avoidEgg&&recipe.ingredients.some(i=>i.name==="雞蛋"))score-=100;if(text.includes("酸辣湯")&&recipe.name.includes("湯"))score+=38;if(text.includes("番茄")&&recipe.ingredients.some(i=>i.name==="番茄"))score+=24;
    return{recipe,available,missing,expiring,score};
  }).filter(x=>x.score>-70).sort((a,b)=>b.score-a.score);
  const best=scored[0];
  if(!best)return NextResponse.json({message:foods.length?"目前找不到完全符合的料理，可以換個食材或放寬時間。":"目前沒有冰箱資料，所以這次只能提供一般建議。先加入幾樣食材，我就能更準確幫你決定。",recipeId:null,recipeName:null,reason:[],availableIngredients:[],missingIngredients:[],cookTime:null,difficulty:1,actions:[]});
  const expiry=best.expiring.sort((a,b)=>days(foods.find(f=>f.name===a.name)?.expiry)-days(foods.find(f=>f.name===b.name)?.expiry))[0];
  const reason=expiry?[expiry.name+" "+(days(foods.find(f=>f.name===expiry.name)?.expiry)===0?"今天到期":"剩 "+days(foods.find(f=>f.name===expiry.name)?.expiry)+" 天，適合優先用掉")]:[best.available.length+" 項食材已經在冰箱裡"];
  if(tired)reason.push("步驟簡單，適合今天不想忙太久的時候");if(limit<99)reason.push("料理時間約 "+best.recipe.minutes+" 分鐘");
  return NextResponse.json({message:"可以，"+best.recipe.name+"很適合你現在的需求。",recipeId:best.recipe.id,recipeName:best.recipe.name,emoji:best.recipe.emoji,reason,availableIngredients:best.available.map(i=>i.name),missingIngredients:best.missing.map(i=>i.name),cookTime:best.recipe.minutes,difficulty:1,actions:best.missing.length?["start","detail","shopping","another"]:["start","detail","another"]});
}
