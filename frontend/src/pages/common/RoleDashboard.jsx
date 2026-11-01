import { Link } from 'react-router-dom';
import Icon from '../../components/Icon.jsx';
import '../../styles/workspace.css';

export default function RoleDashboard({ title, description, roleCode, cards = [] }) {
  return (
    <div className="workspace-page">
      <header className="workspace-page__header" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0f172a' }}>{title}</h1>
        <p style={{ color: '#64748b', marginTop: '0.25rem' }}>{description}</p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem',
        }}
      >
        {cards.map((card, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              padding: '1.5rem',
              border: '1px solid #e2e8f0',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '42px',
                  height: '42px',
                  borderRadius: '0.5rem',
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  marginBottom: '1rem',
                }}
              >
                <Icon name={card.icon || 'shield'} size={24} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem' }}>
                {card.title}
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                {card.description}
              </p>
            </div>
            <Link
              to={card.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#2563eb',
                textDecoration: 'none',
              }}
            >
              Truy cập chức năng <Icon name="arrow-right" size={16} />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

