export function Marquee({ items }: { items: string[] }) {
  const render = (prefix: string) =>
    items.map((it, i) => (
      <span className="marquee-item" key={`${prefix}-${i}`}>
        {it}
        <span className="dot" />
      </span>
    ))
  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {render('a')}
        {render('b')}
      </div>
    </div>
  )
}
