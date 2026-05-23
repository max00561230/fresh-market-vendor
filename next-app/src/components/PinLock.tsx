"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";

export default function PinLock({ onSuccess }: { onSuccess: () => void }) {
  const { verifyPin, data } = useApp();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyPin(pin)) {
      setError(false);
      onSuccess();
    } else {
      setError(true);
      setPin("");
    }
  };

  const handleDigit = (d: string) => {
    if (pin.length < 6) {
      setPin((prev) => prev + d);
      setError(false);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg-dark)] z-[100] flex items-center justify-center">
      <div className="w-full max-w-xs text-center">
        {/* Lock icon */}
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-white text-lg font-bold mb-1">Admin Access</h2>
        <p className="text-[#9ca3af] text-sm mb-6">Enter your PIN to continue</p>

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all ${
                i < pin.length
                  ? error ? "bg-red-400" : "bg-[var(--gold)]"
                  : "bg-[#374151]"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-400 text-sm mb-4 animate-pulse">Incorrect PIN</p>
        )}

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="w-full aspect-square rounded-full bg-[#1f2937] text-white text-xl font-bold hover:bg-[#374151] active:bg-[#4b5563] transition-colors"
            >
              {d}
            </button>
          ))}
          <div /> {/* empty corner */}
          <button
            onClick={() => handleDigit("0")}
            className="w-full aspect-square rounded-full bg-[#1f2937] text-white text-xl font-bold hover:bg-[#374151] active:bg-[#4b5563] transition-colors"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="w-full aspect-square rounded-full bg-[#1f2937] text-white text-lg hover:bg-[#374151] active:bg-[#4b5563] transition-colors flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        {/* Hidden form for Enter key */}
        <form onSubmit={handleSubmit} className="hidden">
          <input
            type="password"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
          />
        </form>
      </div>
    </div>
  );
}