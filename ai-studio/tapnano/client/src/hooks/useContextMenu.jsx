import { useState, useCallback, useEffect } from 'react'

export const useContextMenu = () => {
  const [menu, setMenu] = useState(null)

  const showMenu = useCallback((x, y, items) => {
    setMenu({ x, y, items })
  }, [])

  const hideMenu = useCallback(() => {
    setMenu(null)
  }, [])

  useEffect(() => {
    const handleClick = () => hideMenu()
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') hideMenu()
    }

    document.addEventListener('click', handleClick)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('click', handleClick)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [hideMenu])

  const ContextMenu = menu ? (
    <div
      className="fixed z-[100] glass rounded-lg py-2 min-w-[150px] shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {menu.items.map((item, index) => (
        <button
          key={index}
          onClick={() => {
            item.onClick()
            hideMenu()
          }}
          className={`
            w-full px-4 py-2 text-sm text-left transition-colors
            ${item.danger
              ? 'text-cyber-magenta hover:bg-cyber-magenta/20'
              : 'text-white hover:bg-cyber-cyan/20'
            }
            ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          disabled={item.disabled}
        >
          {item.label}
        </button>
      ))}
    </div>
  ) : null

  return { showMenu, hideMenu, ContextMenu }
}
