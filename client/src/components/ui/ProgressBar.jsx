function ProgressBar({ value }) {
  return (
    <div className="progress-track" aria-hidden="true">
      <span className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

export default ProgressBar;
