import Icon from '../Icon.jsx';
import '../../styles/workspace.css';

export default function EmptyState({ title = 'Chưa có dữ liệu', description, children }) {
  return <div className="ui-empty-state"><span className="ui-empty-state__icon"><Icon name="search" size={28} /></span><h3>{title}</h3>{description && <p>{description}</p>}{children && <div className="ui-empty-state__actions">{children}</div>}</div>;
}
