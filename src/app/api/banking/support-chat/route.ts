import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db,type DatabaseRow } from "../../../../lib/db";
import { clientIp,rateLimit } from "../../../../lib/rate-limit";
import {decryptText,encryptText} from "../../../../lib/encryption";
export async function GET(){
  const user=await currentUser();if(!user||user.role!=="user")return NextResponse.json({error:"Customer access required."},{status:403});
  const[rows]=await db.execute<DatabaseRow[]>("SELECT id,sender_role,message,read_at,created_at FROM support_chat_messages WHERE user_id=? ORDER BY id DESC LIMIT 100",[user.id]);
  await db.execute("UPDATE support_chat_messages SET read_at=COALESCE(read_at,NOW()) WHERE user_id=? AND sender_role IN ('admin','bot')",[user.id]);
  return NextResponse.json({messages:rows.reverse().map(row=>({...row,message:decryptText(row.message)}))});
}
export async function POST(request:Request){
  const user=await currentUser();if(!user||user.role!=="user")return NextResponse.json({error:"Customer access required."},{status:403});
  if(!rateLimit(`support-chat:${user.id}:${clientIp(request)}`,20,60_000).allowed)return NextResponse.json({error:"Please wait before sending more messages."},{status:429});
  const body=await request.json(),message=String(body.message||"").trim();
  if(message.length<1||message.length>2000)return NextResponse.json({error:"Enter a message of up to 2,000 characters."},{status:400});
  await db.execute("INSERT INTO support_chat_messages(user_id,sender_id,sender_role,message) VALUES(?,?,'user',?)",[user.id,user.id,encryptText(message)]);
  const lower=message.toLowerCase();
  const reply=lower.includes("transfer")?"I can help with your transfer. Please share the transaction reference and current status. A customer-care administrator can review it next.":lower.includes("card")?"For card assistance, please share only the card type and last four digits. Never send your PIN, CVV, or full card number.":lower.includes("verify")||lower.includes("identity")?"Identity reviews are handled securely by customer care. Please check the Verification page for the current status; an administrator will follow up here if needed.":lower.includes("password")||lower.includes("login")?"For account access issues, use the password-reset option. Never share your password or transaction PIN in chat.":lower.includes("hello")||lower.includes("hi")?"Hello! I am the SecurePath Shield support bot. Tell me whether you need help with a transfer, card, identity verification, account access, or another issue.":"Thanks for your message. I have recorded the issue for customer care. Add any relevant reference number, but do not send passwords, PINs, CVVs, or full card numbers.";
  await db.execute("INSERT INTO support_chat_messages(user_id,sender_id,sender_role,message) VALUES(?,?,'bot',?)",[user.id,user.id,encryptText(reply)]);
  return NextResponse.json({ok:true},{status:201});
}
