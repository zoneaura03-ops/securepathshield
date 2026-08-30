"use client";
import {useState} from "react";
import {usePathname} from "next/navigation";
import {MessageCircle,X} from "lucide-react";
import {SupportLiveChat} from "./support-live-chat";
export function DashboardLiveChat(){
  const[open,setOpen]=useState(false),path=usePathname();
  if(path==="/dashboard/support")return null;
  return <div className="fixed bottom-24 right-4 z-40 lg:bottom-7 lg:right-7">
    {open&&<div className="mb-3 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(16,35,63,.28)] ring-1 ring-black/5"><div className="flex items-center justify-between bg-[#0a1728] px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-xl bg-blue-400/15 text-blue-300"><MessageCircle size={19}/></span><div><p className="text-sm font-bold">Customer care</p><p className="text-[10px] text-white/55">Live support conversation</p></div></div><button type="button" onClick={()=>setOpen(false)} aria-label="Close live chat" className="grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"><X size={17}/></button></div><div className="[&>section]:mb-0 [&>section]:rounded-none [&>section]:border-0 [&>section]:shadow-none [&>section>div:first-child]:hidden"><SupportLiveChat/></div></div>}
    <button type="button" onClick={()=>setOpen(!open)} aria-expanded={open} aria-label="Open live customer care chat" className="relative ml-auto grid size-14 place-items-center rounded-2xl bg-bank-700 text-white shadow-[0_14px_35px_rgba(17,88,57,.35)] ring-4 ring-white transition hover:-translate-y-1"><MessageCircle size={24}/><span className="absolute -right-1 -top-1 size-3 rounded-full bg-blue-400 ring-2 ring-white"/></button>
  </div>
}

// Hostinger source snapshot sync.
