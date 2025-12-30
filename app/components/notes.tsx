"use client"

import { useState, useMemo } from "react"
import { X } from "lucide-react"

interface StickyNoteProps {
  id: string
  initialContent?: string
  initialColor?: string
  initialRotation?: number
  onDelete?: (id: string) => void
  editable?: boolean
  onContentChange?: (content: string) => void
}

export default function StickyNote({
  id,
  initialContent = "Write your note here...",
  initialColor = "yellow",
  initialRotation,
  onDelete,
  editable = true,
  onContentChange,
}: StickyNoteProps) {
  const [content, setContent] = useState(initialContent)
  const color = initialColor

  // Calculate rotation only once when component mounts
  const rotation = useMemo(() => {
    return initialRotation ?? Math.floor(Math.random() * 10) - 5;
  }, [initialRotation]);

  const colorMap = {
    yellow: "bg-yellow-200 hover:bg-yellow-100",
    blue: "bg-blue-200 hover:bg-blue-100",
    green: "bg-green-200 hover:bg-green-100",
    pink: "bg-pink-200 hover:bg-pink-100",
    purple: "bg-purple-200 hover:bg-purple-100",
  }

  const isHex = typeof color === 'string' && color.startsWith('#');
  const bgColor = isHex ? '' : (colorMap[color as keyof typeof colorMap] || colorMap.yellow);

  return (
    <div
      className={`relative w-64 h-64 p-6 shadow-md ${bgColor} transition-all duration-200 ease-in-out`}
      style={{
        backgroundColor: isHex ? color : undefined,
        transform: `rotate(${rotation}deg)`,
        boxShadow: "2px 2px 15px rgba(0,0,0,0.1)",
      }}
    >
      
      {onDelete && (
        <button
          onClick={() => onDelete(id)}
          className="absolute top-2 right-2 text-black transition-colors"
          aria-label="Delete note"
        >
          <X size={16} />
        </button>
      )}

      {/* Content */}
      {editable ? (
        <textarea
          className="placeholder:text-sm w-full h-full bg-transparent resize-none focus:outline-none font-handwriting text-black"
          value={onContentChange ? (initialContent ?? '') : content}
          placeholder={
            "• Add your safe secret 👻\n" +
            "• Leave a note you always wanted to ✨\n" +
            "• Type your 3am thoughts… we won't judge 😏\n" +
            "• Manifest your dreams 💭\n" +
            "• Scream your wildest idea 👂\n" +
            "• Drop a truth bomb or tell the world a joke 💣" 
          }
          onChange={(e) => {
            if (onContentChange) {
              onContentChange(e.target.value);
            } else {
              setContent(e.target.value);
            }
          }}
          style={{ fontFamily: "'Comic Sans MS', 'Comic Neue', cursive" }}
        />
      ) : (
        <div className="w-full h-full overflow-auto" style={{ fontFamily: "'Comic Sans MS', 'Comic Neue', cursive", color: 'black' }}>
          {content}
        </div>
      )}
    </div>
  )
}