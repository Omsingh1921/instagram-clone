import React, { useState, useMemo } from 'react';

const formatCompactTick = (val) => {
  if (val >= 1000000) return `${(val / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (val >= 1000) return `${(val / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(val);
};

// Generates smooth monotone-like cubic Bezier SVG path string
const buildSmoothPath = (points) => {
  if (!points || points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
};

const SERIES_MODES = {
  USERS: [
    { key: 'users', label: 'Users', color: '#8b5cf6', gradId: 'gradUsers' },
    { key: 'posts', label: 'Posts', color: '#ec4899', gradId: 'gradPosts' },
    { key: 'reels', label: 'Reels', color: '#f59e0b', gradId: 'gradReels' },
  ],
  CONTENT: [
    { key: 'posts', label: 'Posts', color: '#ec4899', gradId: 'gradPosts' },
    { key: 'stories', label: 'Stories', color: '#8b5cf6', gradId: 'gradUsers' },
    { key: 'reels', label: 'Reels', color: '#f59e0b', gradId: 'gradReels' },
  ],
  ENGAGEMENT: [
    { key: 'engagement', label: 'Total Engagement', color: '#8b5cf6', gradId: 'gradUsers' },
    { key: 'likes', label: 'Likes', color: '#ec4899', gradId: 'gradPosts' },
    { key: 'comments', label: 'Comments', color: '#38bdf8', gradId: 'gradReels' },
  ],
};

export const PlatformGrowthChart = ({ series = [], mode = 'USERS' }) => {
  const [hoverIdx, setHoverIdx] = useState(null);
  const [hiddenSeries, setHiddenSeries] = useState({});

  const activeConfig = SERIES_MODES[mode] || SERIES_MODES.USERS;
  const visibleConfig = activeConfig.filter((s) => !hiddenSeries[s.key]);
  const chartData = series.length > 0 ? series : [{ date: '', label: 'Today', users: 0, posts: 0, reels: 0, stories: 0, likes: 0, comments: 0, engagement: 0 }];

  const W = 560;
  const H = 205;
  const padL = 38;
  const padR = 14;
  const padT = 14;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const { maxVal, yTicks, seriesPaths } = useMemo(() => {
    let rawMax = 0;
    chartData.forEach((row) => {
      visibleConfig.forEach((s) => {
        const v = Number(row[s.key]) || 0;
        if (v > rawMax) rawMax = v;
      });
    });

    const stepBase = rawMax <= 4 ? 1 : Math.ceil(rawMax / 4);
    const niceStep =
      stepBase <= 1 ? 1
      : stepBase <= 2 ? 2
      : stepBase <= 5 ? 5
      : stepBase <= 10 ? 10
      : Math.ceil(stepBase / 5) * 5;
    const ceiling = niceStep * 4;

    const ticks = [0, 1, 2, 3, 4].map((idx) => ({
      val: idx * niceStep,
      y: padT + plotH - (idx / 4) * plotH,
    }));

    const paths = visibleConfig.map((cfg) => {
      const pts = chartData.map((row, idx) => {
        const val = Number(row[cfg.key]) || 0;
        const x =
          chartData.length === 1
            ? padL + plotW / 2
            : padL + (idx / (chartData.length - 1)) * plotW;
        const y = padT + plotH - (val / ceiling) * plotH;
        return { x, y, val, label: row.label || row.date };
      });
      const lineD = buildSmoothPath(pts);
      const areaD =
        pts.length > 0
          ? `${lineD} L ${pts[pts.length - 1].x} ${padT + plotH} L ${pts[0].x} ${padT + plotH} Z`
          : '';
      return { ...cfg, pts, lineD, areaD };
    });

    return { maxVal: ceiling, yTicks: ticks, seriesPaths: paths };
  }, [chartData, visibleConfig, plotW, plotH]);

  const xLabelStride = chartData.length > 14 ? Math.ceil(chartData.length / 7) : 1;

  const toggleSeries = (key) => {
    setHiddenSeries((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="platform-chart-wrapper">
      <div className="platform-chart-svg-box">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="platform-growth-svg"
          role="img"
          aria-label="Platform growth line chart"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="gradPosts" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ec4899" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#ec4899" stopOpacity="0.01" />
            </linearGradient>
            <linearGradient id="gradReels" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid Lines + Y-Axis Labels */}
          {yTicks.map((tick) => (
            <g key={tick.val}>
              <line
                x1={padL}
                y1={tick.y}
                x2={W - padR}
                y2={tick.y}
                stroke="rgba(167, 139, 250, 0.14)"
                strokeDasharray="3 4"
                strokeWidth="1"
              />
              <text
                x={padL - 8}
                y={tick.y + 4}
                textAnchor="end"
                className="chart-axis-text"
              >
                {formatCompactTick(tick.val)}
              </text>
            </g>
          ))}

          {/* X-Axis Labels */}
          {chartData.map((row, idx) => {
            if (idx % xLabelStride !== 0 && idx !== chartData.length - 1) return null;
            const x =
              chartData.length === 1
                ? padL + plotW / 2
                : padL + (idx / (chartData.length - 1)) * plotW;
            return (
              <text
                key={`${row.date}-${idx}`}
                x={x}
                y={H - 6}
                textAnchor="middle"
                className="chart-axis-text"
              >
                {row.label || row.date}
              </text>
            );
          })}

          {/* Hover Vertical Hairline */}
          {hoverIdx !== null && seriesPaths[0]?.pts[hoverIdx] && (
            <line
              x1={seriesPaths[0].pts[hoverIdx].x}
              y1={padT}
              x2={seriesPaths[0].pts[hoverIdx].x}
              y2={padT + plotH}
              stroke="rgba(255, 255, 255, 0.25)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
          )}

          {/* Area Fills & Smooth Lines */}
          {seriesPaths.map((s) => (
            <g key={s.key}>
              {s.areaD && <path d={s.areaD} fill={`url(#${s.gradId})`} />}
              {s.lineD && (
                <path
                  d={s.lineD}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 6px ${s.color}66)` }}
                />
              )}
              {s.pts.map((pt, idx) => (
                <circle
                  key={`${s.key}-${idx}`}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoverIdx === idx ? 4.5 : 2.8}
                  fill="#ffffff"
                  stroke={s.color}
                  strokeWidth="2"
                  style={{ transition: 'r 0.12s ease' }}
                />
              ))}
            </g>
          ))}

          {/* Invisible Interactive Column Hit Targets */}
          {chartData.map((row, idx) => {
            const colW = chartData.length > 1 ? plotW / (chartData.length - 1) : plotW;
            const center =
              chartData.length === 1
                ? padL + plotW / 2
                : padL + (idx / (chartData.length - 1)) * plotW;
            return (
              <rect
                key={`hit-${idx}`}
                x={Math.max(padL, center - colW / 2)}
                y={padT}
                width={colW}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(idx)}
                style={{ cursor: 'crosshair' }}
              />
            );
          })}
        </svg>

        {hoverIdx !== null && chartData[hoverIdx] && (
          <div className="chart-hover-tooltip">
            <div className="chart-tooltip-date">
              {chartData[hoverIdx].label || chartData[hoverIdx].date}
            </div>
            {visibleConfig.map((s) => (
              <div key={s.key} className="chart-tooltip-row">
                <span className="chart-dot" style={{ backgroundColor: s.color }} />
                <span>{s.label}:</span>
                <strong>{Number(chartData[hoverIdx][s.key] || 0).toLocaleString()}</strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="chart-legend-row">
        {activeConfig.map((s) => {
          const isHidden = Boolean(hiddenSeries[s.key]);
          return (
            <button
              key={s.key}
              type="button"
              className={`chart-legend-pill ${isHidden ? 'muted' : ''}`}
              onClick={() => toggleSeries(s.key)}
            >
              <span className="chart-legend-bar" style={{ backgroundColor: s.color }} />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export const ContentDistributionDonut = ({ posts = 0, stories = 0, reels = 0 }) => {
  const total = posts + stories + reels;
  const safeTotal = total > 0 ? total : 1;

  const segments = [
    { key: 'posts', label: 'Feed Posts', value: posts, color: '#7c3aed' },
    { key: 'stories', label: 'Stories', value: stories, color: '#ec4899' },
    { key: 'reels', label: 'Reels', value: reels, color: '#f59e0b' },
  ];

  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <div className="content-donut-wrapper">
      <div className="donut-svg-container">
        <svg viewBox="0 0 130 130" className="content-donut-svg" role="img" aria-label="Content distribution chart">
          <circle
            cx="65"
            cy="65"
            r={radius}
            fill="none"
            stroke="rgba(167, 139, 250, 0.12)"
            strokeWidth="16"
          />
          {total > 0 &&
            segments.map((seg) => {
              const fraction = seg.value / safeTotal;
              const dashLen = Math.max(0, fraction * circumference - 2);
              const dashOffset = -cumulativeOffset;
              cumulativeOffset += fraction * circumference;
              if (seg.value <= 0) return null;
              return (
                <circle
                  key={seg.key}
                  cx="65"
                  cy="65"
                  r={radius}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="16"
                  strokeDasharray={`${dashLen} ${circumference}`}
                  strokeDashoffset={dashOffset}
                  strokeLinecap="round"
                  transform="rotate(-90 65 65)"
                  style={{ filter: `drop-shadow(0 0 6px ${seg.color}55)` }}
                />
              );
            })}
        </svg>

        <div className="donut-center-label">
          <strong>{total.toLocaleString()}</strong>
          <span>Total Content</span>
        </div>
      </div>

      <div className="donut-legend-list">
        {segments.map((seg) => {
          const pct = total > 0 ? ((seg.value / safeTotal) * 100).toFixed(1) : '0.0';
          return (
            <div key={seg.key} className="donut-legend-item">
              <div className="donut-legend-left">
                <span className="chart-dot" style={{ backgroundColor: seg.color }} />
                <span>{seg.label}</span>
              </div>
              <strong className="donut-legend-pct">{pct}%</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
};

