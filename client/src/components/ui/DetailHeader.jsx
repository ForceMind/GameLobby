function DetailHeader({ title, desc, badge, onBack }) {
  return (
    <section className="surface-card detail-banner">
      <div className="detail-topline">
        <button type="button" className="back-btn" onClick={onBack}>
          <span className="back-arrow" aria-hidden="true" />
          返回
        </button>
        {badge ? <span className="detail-badge">{badge}</span> : <span className="detail-spacer" />}
      </div>
      <div className="detail-heading">
        <h1>{title}</h1>
        <p>{desc}</p>
      </div>
    </section>
  );
}

export default DetailHeader;
