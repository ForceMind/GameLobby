function SectionHeader({ title, desc, action, onAction }) {
  return (
    <div className="section-head">
      <div>
        <h2>{title}</h2>
        <p>{desc}</p>
      </div>
      {action ? (
        <button type="button" className="text-link" onClick={onAction}>
          {action}
        </button>
      ) : null}
    </div>
  );
}

export default SectionHeader;
