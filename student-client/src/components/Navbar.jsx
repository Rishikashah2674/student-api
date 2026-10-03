import React from 'react';

export const Navbar = () => {
  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-icon">SOA</div>
        <div className="brand-title">
          <h1>CampusConnect Portal</h1>
          <p>Lab 6 — Containerized Microservices Architecture</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div className="status-badge">
          <span className="status-dot"></span>
          <span>Connected to Microservices</span>
        </div>
      </div>
    </header>
  );
};
