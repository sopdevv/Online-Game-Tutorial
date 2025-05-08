import React, { useEffect, useState } from "react";

interface JoinFormProps {
  onJoin: (data: { code: string; name: string }) => void;
  defaultCode?: string;
}

export function JoinForm({ onJoin, defaultCode }: JoinFormProps) {
  const [code, setCode] = useState(defaultCode || "");
  const [name, setName] = useState("");

  useEffect(() => {
    if (defaultCode) {
      setCode(defaultCode);
    }
  }, [defaultCode]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code && name) {
      onJoin({ code, name });
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

      {!defaultCode && (
        <div>
          <label className="block mb-2 text-sm font-medium">
            كود غرفة السباق
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-2 font-mono text-white uppercase bg-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="ادخل كود الغرفة"
            required
          />
        </div>
      )}

      <button
        type="submit"
        disabled={!code || !name}
        className={`
          w-full py-3 px-4 rounded-full font-bold text-lg transition-all
          ${
            code && name
              ? "bg-gradient-to-r from-blue-400 to-blue-600 hover:from-blue-500 hover:to-blue-700 transform hover:scale-105 active:scale-95"
              : "bg-gray-700 cursor-not-allowed"
          }
        `}
      >
        🏎️ انضم للسباق
      </button>
    </form>
  );
}
