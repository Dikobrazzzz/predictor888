import decor from '/icons/tg-3d.webp'

// ID_Language bo'limining BG simvoli: ko'k porlashlar va xiralashgan uchta
// Telegram belgisi. Koordinatalar Figma'dagi 375x809 kadrdan olingan,
// Figma blur radiusi CSS uchun ikkiga bo'linadi.
const GLOW_TOP = { left: 218, top: 7, w: 371, h: 284, color: '#00ACFF', blur: 229 }
const GLOW_DEEP = { left: 188, top: 486, w: 609, h: 545, color: '#062E5E', blur: 320 }
const GLOW_BOTTOM = { left: -144, top: 585, w: 371, h: 284, color: '#00ACFF', blur: 229 }

const DECOR = [
  { w: 183, h: 189, left: -76, top: 608, blur: 5.7 },
  { w: 190, h: 196, left: 229, top: 291, blur: 5.7 },
  { w: 116, h: 120, left: 267, top: 119, blur: 9 },
]

function Glow({ left, top, w, h, color, blur, opacity = 1 }) {
  return (
    <div style={{
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${w}px`,
      height: `${h}px`,
      background: color,
      borderRadius: '50%',
      filter: `blur(${blur}px)`,
      opacity,
    }} />
  )
}

// Muvaffaqiyat ekranida Telegram belgilari o'chirilgan — faqat porlash qoladi.
export default function ScreenBg({ decor = true }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', userSelect: 'none' }}>
      <Glow {...GLOW_TOP} />
      {decor && DECOR.map((d, i) => (
        <img
          key={i}
          src={decor}
          alt=""
          decoding="async"
          style={{
            position: 'absolute',
            left: `${d.left}px`,
            top: `${d.top}px`,
            width: `${d.w}px`,
            height: `${d.h}px`,
            filter: `blur(${d.blur}px)`,
          }}
        />
      ))}
      <Glow {...GLOW_DEEP} />
      <Glow {...GLOW_BOTTOM} />
    </div>
  )
}
