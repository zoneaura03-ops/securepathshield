import { NextResponse } from "next/server";
import { currentUser } from "../../../../lib/auth";
import { db,type DatabaseRow } from "../../../../lib/db";
import {decryptText,encryptText} from "../../../../lib/encryption";
export async function GET(request:Request){
  const admin=await currentUser();if(!admin||admin.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});
  const id=Number(new URL(request.url).searchParams.get("userId"));
  if(Number.isInteger(id)&&id>0){const[rows]=await db.execute<DatabaseRow[]>("SELECT id,sender_role,message,read_at,created_at FROM support_chat_messages WHERE user_id=? ORDER BY id DESC LIMIT 100",[id]);await db.execute("UPDATE support_chat_messages SET read_at=COALESCE(read_at,NOW()) WHERE user_id=? AND sender_role='user'",[id]);return NextResponse.json({messages:rows.reverse().map(row=>({...row,message:decryptText(row.message)}))});}
  const[rows]=await db.execute<DatabaseRow[]>("SELECT u.id,u.first_name,u.last_name,u.email,MAX(m.created_at) last_message_at,SUM(m.sender_role='user' AND m.read_at IS NULL) unread_count,SUBSTRING_INDEX(GROUP_CONCAT(m.message ORDER BY m.id DESC SEPARATOR '\\n'),'\\n',1) last_message FROM support_chat_messages m JOIN users u ON u.id=m.user_id GROUP BY u.id,u.first_name,u.last_name,u.email ORDER BY last_message_at DESC LIMIT 100");
  return NextResponse.json({conversations:rows.map(row=>({...row,last_message:decryptText(row.last_message)}))});
}
export async function POST(request:Request){
  const admin=await currentUser();if(!admin||admin.role!=="admin")return NextResponse.json({error:"Administrator access required."},{status:403});
  const body=await request.json(),userId=Number(body.userId),message=String(body.message||"").trim();
  if(!Number.isInteger(userId)||userId<1||message.length<1||message.length>2000)return NextResponse.json({error:"Choose a customer and enter a message of up to 2,000 characters."},{status:400});
  const[users]=await db.execute<DatabaseRow[]>("SELECT id FROM users WHERE id=? AND role='user' LIMIT 1",[userId]);if(!users[0])return NextResponse.json({error:"Customer not found."},{status:404});
  await db.execute("INSERT INTO support_chat_messages(user_id,sender_id,sender_role,message) VALUES(?,?,'admin',?)",[userId,admin.id,encryptText(message)]);
  await db.execute("INSERT INTO notifications(user_id,type,title,body,action_url) VALUES(?,'support','New customer care message','Customer care sent you a new live-chat message.','/dashboard/support')",[userId]);
  return NextResponse.json({ok:true},{status:201});
}
