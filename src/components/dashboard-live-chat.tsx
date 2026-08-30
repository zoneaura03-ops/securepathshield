"use client";
import { PointerEvent, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle, X } from "lucide-react";
import { SupportLiveChat } from "./support-live-chat";

type Position = { left: number; top: number };
export function DashboardLiveChat() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const drag = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const path = usePathname();
  if (path === "/dashboard/support") return null;
  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    drag.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }
  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    const left = Math.min(
      window.innerWidth - 72,
      Math.max(16, event.clientX - drag.current.offsetX),
    );
    const top = Math.min(
      window.innerHeight - 72,
      Math.max(16, event.clientY - drag.current.offsetY),
    );
    if (Math.abs(event.movementX) + Math.abs(event.movementY) > 2)
      drag.current.moved = true;
    setPosition({ left, top });
  }
  function finishDrag(event: PointerEvent<HTMLButtonElement>) {
    if (drag.current?.pointerId === event.pointerId)
      event.currentTarget.releasePointerCapture(event.pointerId);
  }
  function toggle() {
    if (drag.current?.moved) {
      drag.current = null;
      return;
    }
    drag.current = null;
    setOpen((current) => !current);
  }
  const alignLeft = position
    ? position.left <
      (typeof window === "undefined" ? 500 : window.innerWidth / 2)
    : false;
  return (
    <div
      className={`fixed z-40 ${position ? "" : "bottom-24 right-4 lg:bottom-7 lg:right-7"}`}
      style={position || undefined}
    >
      {open && (
        <div
          className={`absolute bottom-16 mb-3 w-[min(420px,calc(100vw-2rem))] overflow-hidden rounded-3xl bg-white shadow-[0_24px_80px_rgba(10,23,40,.28)] ring-1 ring-black/5 ${alignLeft ? "left-0" : "right-0"}`}
        >
          <div className="flex items-center justify-between bg-[#0a1728] px-5 py-4 text-white">
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-xl bg-gold-400/15 text-gold-300">
                <MessageCircle size={19} />
              </span>
              <div>
                <p className="text-sm font-bold">Customer care</p>
                <p className="text-[10px] text-white/55">
                  Live support conversation
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close live chat"
              className="grid size-9 place-items-center rounded-full bg-white/10 hover:bg-white/20"
            >
              <X size={17} />
            </button>
          </div>
          <div className="[&>section]:mb-0 [&>section]:rounded-none [&>section]:border-0 [&>section]:shadow-none [&>section>div:first-child]:hidden">
            <SupportLiveChat />
          </div>
        </div>
      )}
      <button
        type="button"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={finishDrag}
        onClick={toggle}
        aria-expanded={open}
        aria-label="Open or move live customer care chat"
        title="Drag to move or click to open"
        className="relative ml-auto grid size-14 touch-none select-none place-items-center rounded-2xl bg-bank-700 text-white shadow-[0_14px_35px_rgba(10,23,40,.35)] ring-4 ring-white transition hover:-translate-y-1"
      >
        <MessageCircle size={24} />
        <span className="absolute -right-1 -top-1 size-3 rounded-full bg-gold-400 ring-2 ring-white" />
      </button>
    </div>
  );
}
