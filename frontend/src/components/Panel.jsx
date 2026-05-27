export default function Panel({ title, description, children, style }) {
  return (
    <section className="panel" style={style}>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {children}
    </section>
  );
}
