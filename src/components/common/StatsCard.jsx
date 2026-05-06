import './StatsCard.css';

const StatsCard = ({ title, value, change, changeType, icon }) => {
  return (
    <div className="stats-card">
      <div className="stats-card__header">
        <span className="stats-card__title">{title}</span>
        {icon && <span className="stats-card__icon">{icon}</span>}
      </div>
      <div className="stats-card__body">
        <span className="stats-card__value">{value}</span>
        {change !== undefined && (
          <span className={`stats-card__change stats-card__change--${changeType || 'neutral'}`}>
            {changeType === 'positive' ? '+' : changeType === 'negative' ? '' : ''}{change}
          </span>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
