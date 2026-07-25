"use client";

export default function PrintButton() {
  return (
    <button onClick={() => window.print()} className="bg-primary-blue text-white px-8 py-2 rounded-xl hover:bg-blue-600 transition-colors">
      طباعة
    </button>
  );
}
