import { useState, useEffect } from 'react';
import api from '../api/axios.js';

function BadgeModal({ isOpen, onClose }) {
    const [badges, setBadges] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen) return;

        let isMounted = true;
        api.get('/api/habits/badges')
            .then(res => {
                if (isMounted) {
                    setBadges(res.data);
                    setLoading(false);
                }
            })
            .catch(err => {
                console.error("Failed to fetch badges", err);
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const unlockedCount = badges.filter(b => b.unlocked).length;
    const totalCount = badges.length;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card badge-modal-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="badge-header-info">
                        <h3>🏆 Achievements & Trophies</h3>
                        <span className="badge-counter-pill">
                            {unlockedCount} of {totalCount} Unlocked
                        </span>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="loading-state">
                            <div className="spinner" />
                            <p>Loading achievements…</p>
                        </div>
                    ) : (
                        <div className="badges-grid">
                            {badges.map(badge => {
                                const percent = badge.maxProgress > 0
                                    ? Math.round((badge.progress / badge.maxProgress) * 100)
                                    : 0;

                                return (
                                    <div
                                        key={badge.id}
                                        className={`badge-card ${badge.unlocked ? 'badge-unlocked' : 'badge-locked'}`}
                                    >
                                        <div className="badge-icon-wrapper">
                                            <span className="badge-emoji">{badge.icon}</span>
                                            {badge.unlocked && <span className="badge-check-star">✓</span>}
                                        </div>

                                        <div className="badge-info">
                                            <div className="badge-title-row">
                                                <h4 className="badge-title">{badge.title}</h4>
                                                {badge.unlocked ? (
                                                    <span className="badge-status-tag">Unlocked</span>
                                                ) : (
                                                    <span className="badge-progress-text">{badge.progress} / {badge.maxProgress}</span>
                                                )}
                                            </div>
                                            <p className="badge-desc">{badge.description}</p>

                                            {!badge.unlocked && (
                                                <div className="badge-progress-bar">
                                                    <div
                                                        className="badge-progress-fill"
                                                        style={{ width: `${percent}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

export default BadgeModal;
