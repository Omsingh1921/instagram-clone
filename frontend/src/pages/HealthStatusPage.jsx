import React, { useState, useEffect } from 'react';
import { healthService } from '../services/health.service';
import { Skeleton } from '../components/ui/Skeleton';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw, Server, Database, Layers, Radio, ShieldCheck } from 'lucide-react';
import './HealthStatusPage.css';

export const HealthStatusPage = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await healthService.getHealthStatus();
      setHealthData(response.data);
    } catch (err) {
      setError(err.message || 'Unable to connect to Spring Boot backend API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const isDataLoading = loading;

  const infrastructureCards = [
    {
      key: 'backend',
      Icon: Server,
      title: 'Spring Boot Backend',
      badge: isDataLoading ? (
        <Skeleton className="w-32 h-3 mt-1 rounded" />
      ) : (
        `Java ${healthData?.javaVersion || '21'} • Boot ${healthData?.springBootVersion || '3.3.4'}`
      ),
      statusClass: healthData?.status === 'UP' ? 'status-ok' : 'status-err',
      StatusIcon: healthData?.status === 'UP' ? CheckCircle2 : XCircle,
      statusText: healthData?.status,
      desc: 'Stateless modular monolith with Spring Security 6, JWT, and JPA.',
      metaLabel: 'Timestamp:',
      metaValue: healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : '—',
      metaSkeletonClass: 'w-20 h-3.5 rounded',
    },
    {
      key: 'mysql',
      Icon: Database,
      title: 'MySQL Database',
      badge: isDataLoading ? (
        <Skeleton className="w-16 h-3 mt-1 rounded" />
      ) : (
        healthData?.database?.databaseProduct || 'MySQL 8.0'
      ),
      statusClass: healthData?.database?.status === 'CONNECTED' ? 'status-ok' : 'status-warn',
      StatusIcon: healthData?.database?.status === 'CONNECTED' ? CheckCircle2 : AlertCircle,
      statusText: healthData?.database?.status,
      desc: 'System of record for users, profiles, and transactional outbox. Managed by Flyway.',
      metaLabel: 'Engine Version:',
      metaValue: healthData?.database?.databaseVersion || '8.0+',
      metaSkeletonClass: 'w-14 h-3.5 rounded',
    },
    {
      key: 'redis',
      Icon: Layers,
      title: 'Redis Cache',
      badge: 'Port 6379',
      statusClass: healthData?.redis?.status === 'CONNECTED' ? 'status-ok' : 'status-standby',
      StatusIcon: healthData?.redis?.status === 'CONNECTED' ? CheckCircle2 : AlertCircle,
      statusText: healthData?.redis?.status,
      desc: 'Configured for rate-limiting, online presence, and ephemeral token sessions.',
      metaLabel: 'Ping:',
      metaValue: healthData?.redis?.ping || healthData?.redis?.note || 'STANDBY',
      metaSkeletonClass: 'w-14 h-3.5 rounded',
    },
    {
      key: 'kafka',
      Icon: Radio,
      title: 'Apache Kafka',
      badge: 'Port 9092',
      statusClass: 'status-ok',
      StatusIcon: CheckCircle2,
      statusText: healthData?.kafka?.status,
      desc: 'Prepared for event contracts (social, engagement, media) and transactional outbox.',
      metaLabel: 'Brokers:',
      metaValue: healthData?.kafka?.bootstrapServers || 'localhost:9092',
      metaSkeletonClass: 'w-28 h-3.5 rounded',
    },
    {
      key: 'websocket',
      Icon: Radio,
      title: 'WebSocket & STOMP',
      badge: 'Endpoint: /ws',
      statusClass: 'status-ok',
      StatusIcon: CheckCircle2,
      statusText: healthData?.websocket?.status,
      desc: 'Configured with SockJS fallback and destinations for chat, notifications, and typing.',
      metaLabel: 'Broker Descriptors:',
      metaValue: healthData?.websocket?.messageBroker,
      metaSkeletonClass: 'w-36 h-3.5 rounded',
    },
    {
      key: 'security',
      Icon: ShieldCheck,
      title: 'Security Baseline',
      badge: 'Spring Security 6',
      statusClass: 'status-ok',
      StatusIcon: CheckCircle2,
      statusText: 'CONFIGURED',
      desc: 'BCrypt (cost 12), stateless JWT filters, strict CORS, and centralized exception handling.',
      metaLabel: 'Auth Scheme:',
      metaValue: 'Bearer JWT (HMAC-SHA256)',
      isStaticMeta: true,
    },
  ];

  return (
    <div className="health-page">
      <div className="health-header">
        <div>
          <h1 className="health-title">System Foundation Status</h1>
          <p className="health-subtitle">Real-time status check of core infrastructure and Spring Boot modular monolith</p>
        </div>
        <button onClick={fetchHealth} disabled={loading} className="btn-refresh">
          <RefreshCw size={18} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="error-banner">
          <AlertCircle size={20} />
          <div>
            <strong>Backend Connection Offline:</strong> {error}
            <div className="error-hint">Ensure Spring Boot is started locally via <code>mvn spring-boot:run</code> on port 8080.</div>
          </div>
        </div>
      )}

      {(isDataLoading || healthData) && (
        <div className="health-grid">
          {infrastructureCards.map((card) => {
            const CardIcon = card.Icon;
            const CardStatusIcon = card.StatusIcon;
            return (
              <div key={card.key} className="health-card">
                <div className="card-header">
                  <CardIcon size={22} className="card-icon" />
                  <div className="card-title-group">
                    <h3>{card.title}</h3>
                    <span className="tech-badge">{card.badge}</span>
                  </div>
                  {isDataLoading ? (
                    <Skeleton className="w-24 h-6 rounded-full flex-shrink-0" />
                  ) : (
                    <span className={`status-badge ${card.statusClass}`}>
                      <CardStatusIcon size={16} />
                      {card.statusText}
                    </span>
                  )}
                </div>
                <div className="card-body">
                  <p className="card-desc">{card.desc}</p>
                  <div className="meta-row">
                    <span>{card.metaLabel}</span>
                    {isDataLoading && !card.isStaticMeta ? (
                      <Skeleton className={card.metaSkeletonClass} />
                    ) : (
                      <code>{card.metaValue}</code>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HealthStatusPage;
