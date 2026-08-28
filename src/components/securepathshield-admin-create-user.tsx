"use client";
import { FormEvent, useState } from "react";
import { UserPlus } from "lucide-react";
export default function AdminCreateUser({onCreated}:{onCreated:()=>void}) {
 const [open,setOpen]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setSaving(true);setError("");const body=Object.fromEntries(new FormData(e.currentTarget));const r=await fetch("/api/admin/users",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...body,action:"create"})});const d=await r.json();setSaving(false);if(!r.ok)return setError(d.error);e.currentTarget.reset();setOpen(false);onCreated()}
 if(!open)return <button type="button" onClick={()=>setOpen(true)} className="btn mt-6"><UserPlus size={16}/>Set up new user</button>;
 return <form onSubmit={submit} className="card mt-6 grid gap-4 rounded-2xl p-5 sm:grid-cols-2"><h2 className="text-xl sm:col-span-2">Set up a customer account</h2><Input name="firstName" label="First name"/><Input name="lastName" label="Last name"/><Input name="email" label="Email" type="email"/><Input name="phone" label="Phone"/><Input name="dateOfBirth" label="Date of birth" type="date"/><Input name="country" label="Country"/><label><span className="label">Account type</span><select name="accountType" className="field"><option value="personal">Personal</option><option value="business">Business</option></select></label><Input name="password" label="Temporary password" type="password"/><Input name="pin" label="4-digit transaction PIN" type="password" pattern="[0-9]{4}"/>{error&&<p className="text-sm text-red-700 sm:col-span-2">{error}</p>}<div className="flex gap-3 sm:col-span-2"><button type="button" onClick={()=>setOpen(false)} className="rounded-xl border px-5 py-3 text-sm font-bold">Cancel</button><button disabled={saving} className="btn">{saving?"Creating…":"Create account"}</button></div></form>
}
function Input({name,label,type="text",pattern}:{name:string;label:string;type?:string;pattern?:string}){return <label><span className="label">{label}</span><input required name={name} type={type} pattern={pattern} className="field"/></label>}

// Hostinger source snapshot sync.
