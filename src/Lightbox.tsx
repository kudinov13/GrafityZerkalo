import { useEffect } from 'react'

export default function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Просмотр изображения" onClick={onClose}>
      <img src={src} alt="" />
      <button type="button" className="lightbox__close" aria-label="Закрыть">×</button>
    </div>
  )
}
