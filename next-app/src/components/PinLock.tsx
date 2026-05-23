"use client";

import { useState } from "react";
import { useApp } from "@/lib/context";

export default function PinLock({ onSuccess }: { onSuccess: () => void }) {
  const { verifyPin, changePin, data } = useApp();
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [changeError, setChangeError] = useState("");
  const [changeSuccess, setChangeSuccess] = useState(false);
  const isDefault = data.adminPin === "1234";

  const handleDigit = (d: string) => {
    if (pin.length < 6) {
      const newPinVal = pin + d;
      setPin(newPinVal);
      setError(false);
      if (newPinVal.length >= 4) {
        if (verifyPin(newPinVal)) {
          setError(false);
          onSuccess();
        } else {
          setError(true);
          setPin("");
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleChangePin = () => {
    if (newPin.length < 4) {
      setChangeError("PIN must be at least 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      setChangeError("PINs do not match");
      return;
    }
    changePin(newPin);
    setChangeError("");
    setChangeSuccess(true);
    setNewPin("");
    setConfirmPin("");
    setTimeout(() => {
      setChangeSuccess(false);
      setShowChange(false);
    }, 1500);
  };

  if (showChange || changeSuccess) {
    return (
      <div className="fixed inset-0 bg-[var(--bg-dark)] z-[100] flex items-center justify-center">
        <div className="w-full max-w-xs text-center">
          {changeSuccess ? (
            <>
              <div className="text-5xl mb-4">✅</div>
              <h2 className="text-white text-lg font-bold mb-2">PIN Changed!</h2>
              <p className="text-[#9ca3af] text-sm">Your new PIN has been saved.</p>
            </>
          ) : (
            <>
              <div className="text-5xl mb-4">🔑</div>
              <h2 className="text-white text-lg font-bold mb-1">Change PIN</h2>
              <p className="text-[#9ca3af] text-sm mb-6">Enter a new 4-6 digit PIN</p>
              <div className="space-y-3">
                <input
                  className="input w-full text-center text-lg tracking-widest"
                  type="password"
                  maxLength={6}
                  placeholder="New PIN"
                  value={newPin}
                  onChange={(e) => { setNewPin(e.target.value.replace(/\D/g, '')); setChangeError(''); }}
                  autoFocus
                />
                <input
                  className="input w-full text-center text-lg tracking-widest"
                  type="password"
                  maxLength={6}
                  placeholder="Confirm PIN"
                  value={confirmPin}
                  onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '')); setChangeError(''); }}
                />
                {changeError && <p className="text-red-400 text-sm">{changeError}</p>}
                <button
                  className="btn btn-primary w-full"
                  onClick={handleChangePin}
                >
                  Save New PIN
                </button>
                <button
                  className="btn btn-ghost w-full"
                  onClick={() => { setShowChange(false); setChangeError(''); }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[var(--bg-dark)] z-[100] flex items-center justify-center">
      <div className="w-full max-w-xs text-center">
        {/* Lock icon */}
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="text-white text-lg font-bold mb-1">Admin Access</h2>
        <p className="text-[#9ca3af] text-sm mb-2">Enter your PIN to continue</p>

        {/* Show default PIN hint */}
        {isDefault && (
          <div className="bg-[#1f2937] border border-[var(--border)] rounded-lg px-4 py-2 mb-4 mx-4">
            <p className="text-[var(--gold)] text-sm font-semibold">Default PIN: 1234</p>
            <p className="text-[#9ca3af] text-xs mt-0.5">Tap the numbers below to enter</p>
          </div>
        )}

        {/* PIN dots */}
        <div className="flex justify-center gap-3 mb-4">
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
          <div />
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

        {/* Change PIN link */}
        <button
          className="text-[#9ca3af] text-sm mt-6 hover:text-white transition-colors underline"
          onClick={() => setShowChange(true)}
        >
          Change PIN
        </button>
      </div>
    </div>
  );
}