"use client";

import { useState } from "react";
import { X, Github, Coffee } from "lucide-react";

export default function FloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm p-4 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="flex flex-col gap-4 pt-4">
            <a
              href="https://github.com/mintahandrews"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
            >
              <Github size={24} />
              <span>GitHub</span>
            </a>
            <a
              href="https://buymeacoffee.com/codemintah"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-yellow-600 dark:hover:text-yellow-400 transition-colors"
            >
              <Coffee size={24} />
              <span>Buy Me a Coffee</span>
            </a>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-violet-500 hover:bg-violet-600 text-white p-3 rounded-full shadow-lg transition-colors"
        >
          <Github size={24} />
        </button>
      )}
    </div>
  );
}
