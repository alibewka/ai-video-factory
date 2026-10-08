// ЦВЕТОВАЯ СИСТЕМА (правило 60-30-10, одна «горячая» пара к синему)
//  60% — тёмно-синий фон (bg, bg2, card)
//  30% — синий/голубой Wi-Fi: структура, схемы, «безопасно», выделения (yellow, accent, mint)
//  10% — оранжевый: только угроза/атака/опасность и самый важный момент (danger)
//  текст — белый; второстепенный — приглушённый голубой (muted)
//  фиолетовый, зелёный, лайм, розовый — НЕ используем
export const C = {
  bg: "#060E22",
  bg2: "#0C2250",
  card: "#0B1A38",
  cardLine: "#2A5CA8",
  text: "#FFFFFF",
  muted: "#8FB4EA",
  yellow: "#3BC4FF", // главный голубой (цвет Wi-Fi) — выделения, цифры
  accent: "#3D82F5", // тот же синий, темнее — линии, схемы
  mint: "#3BC4FF", // «безопасно» = голубой
  danger: "#FF8A3D", // оранжевый — угроза, атака
  ink: "#04112B",
};
export const rgba = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
export const F = {
  title: "Montserrat, sans-serif",
  mono: "'IBM Plex Mono', monospace",
};
