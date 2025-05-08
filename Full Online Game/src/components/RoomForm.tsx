import React, { useState } from "react";

interface RoomFormProps {
  onCreate: (data: { name: string; duration: number }) => void;
}

export function RoomForm({ onCreate }: RoomFormProps) {
  const [name, setName] = useState("");
  const [duration, setDuration] = useState(60);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name) {
      onCreate({ name, duration });
    }
  }

  return (
    <form dir="rtl" onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2 text-sm font-medium">اسمك في السباق</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 text-white bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
          placeholder="ادخل اسمك"
          required
        />
      </div>

      <div>
        <label className="block mb-2 text-sm font-medium">مدة السباق</label>
        <div className="grid grid-cols-3 gap-2">
          {[60, 180, 300].map((seconds) => (
            <button
              key={seconds}
              type="button"
              className={`
                px-4 py-2 rounded-lg font-medium transition-all
                ${
                  duration === seconds
                    ? "bg-yellow-500 text-white"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                }
              `}
              onClick={() => setDuration(seconds)}
            >
              {seconds / 60} دقيقة
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={!name}
        className={`
          w-full py-3 px-4 rounded-full font-bold text-lg transition-all
          ${
            name
              ? "bg-gradient-to-r from-yellow-400 to-red-500 hover:from-yellow-500 hover:to-red-600 transform hover:scale-105 active:scale-95"
              : "bg-gray-700 cursor-not-allowed"
          }
        `}
      >
        🏎️ أنشئ غرفة سباق
      </button>
    </form>
  );
}
