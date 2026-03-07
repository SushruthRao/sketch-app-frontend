/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import rough from 'roughjs';
import { motion, AnimatePresence } from 'framer-motion';
import { getMatchHistory, getRoundCanvas } from '../service/HistoryService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(isoString) {
    if (!isoString) return '';
    const d = new Date(isoString);
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatSeconds(s) {
    if (s == null) return '';
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function endReasonLabel(reason) {
    const map = {
        ALL_GUESSED: 'Everyone guessed!',
        TIME_UP: 'Time ran out',
        DRAWER_LEFT: 'Drawer left',
        NOT_ENOUGH_PLAYERS: 'Not enough players',
    };
    return map[reason] || reason;
}

// Renders strokes onto an offscreen 800×600 canvas and returns a blob URL
async function renderStrokesToBlob(strokes) {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 800, 600);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of strokes) {
        if (!stroke.points || stroke.points.length === 0) continue;
        ctx.strokeStyle = stroke.tool === 'eraser' ? '#FFFFFF' : stroke.color;
        ctx.lineWidth = stroke.lineWidth;
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
    }

    return new Promise((resolve) => {
        canvas.toBlob((blob) => {
            resolve(URL.createObjectURL(blob));
        }, 'image/png');
    });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// Sketchy panel border drawn on a canvas overlay
function SketchBorder({ children, className = '', innerClassName = '' }) {
    const borderRef = useRef(null);
    const canvasRef = useRef(null);

    useEffect(() => {
        const el = borderRef.current;
        if (!el) return;
        const obs = new ResizeObserver(() => {
            const { width, height } = el.getBoundingClientRect();
            const cvs = canvasRef.current;
            if (!cvs) return;
            cvs.width = width;
            cvs.height = height;
            const rc = rough.canvas(cvs);
            const ctx = cvs.getContext('2d');
            ctx.clearRect(0, 0, width, height);
            rc.rectangle(3, 3, width - 6, height - 6, {
                roughness: 1.4,
                stroke: '#333',
                strokeWidth: 1.8,
                fill: 'transparent',
                bowing: 1.2,
            });
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div ref={borderRef} className={`relative ${className}`}>
            <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }} />
            <div className={`relative ${innerClassName}`} style={{ zIndex: 1 }}>
                {children}
            </div>
        </div>
    );
}

// Preview canvas shown inside the round row before download
function StrokePreview({ strokes, word, drawerUsername }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const cvs = canvasRef.current;
        if (!cvs || !strokes || strokes.length === 0) return;
        const ctx = cvs.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (const stroke of strokes) {
            if (!stroke.points || stroke.points.length === 0) continue;
            ctx.strokeStyle = stroke.tool === 'eraser' ? '#FFFFFF' : stroke.color;
            ctx.lineWidth = stroke.lineWidth;
            ctx.beginPath();
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            ctx.stroke();
        }
    }, [strokes]);

    return (
        <div className="mt-2 mb-1">
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full rounded"
                style={{ border: '1px solid #ccc', maxHeight: 220, objectFit: 'contain' }}
            />
            <p className="text-center font-gloria text-xs text-gray-500 mt-1">
                "{word}" drawn by {drawerUsername}
            </p>
        </div>
    );
}

// Individual round row
function RoundRow({ round }) {
    const [expanded, setExpanded] = useState(false);
    const [canvasData, setCanvasData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [downloading, setDownloading] = useState(false);

    const loadCanvas = useCallback(async () => {
        if (canvasData) return;
        setLoading(true);
        try {
            const data = await getRoundCanvas(round.roundRecordId);
            setCanvasData(data);
        } catch {
            /* ignore */
        } finally {
            setLoading(false);
        }
    }, [round.roundRecordId, canvasData]);

    const handleToggle = () => {
        const next = !expanded;
        setExpanded(next);
        if (next) loadCanvas();
    };

    const handleDownload = async () => {
        if (!canvasData || !canvasData.strokes) return;
        setDownloading(true);
        try {
            const blobUrl = await renderStrokesToBlob(canvasData.strokes);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `round-${round.roundNumber}-${round.word}.png`;
            a.click();
            URL.revokeObjectURL(blobUrl);
        } finally {
            setDownloading(false);
        }
    };

    const guessers = round.correctGuessers ?? [];
    const wonBadge = guessers.length > 0;

    return (
        <div
            className="mb-2 p-2 px-3 font-gloria"
            style={{
                background: 'rgba(255,255,255,0.55)',
                borderRadius: '12px 2px 10px 2px / 2px 10px 2px 12px',
                border: '1px solid rgba(0,0,0,0.12)',
            }}
        >
            {/* Round header */}
            <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-gray-500 text-xs">Round {round.roundNumber}</span>
                    <span className="font-bold text-base text-gray-800">"{round.word}"</span>
                    <span className="text-xs text-gray-500">by {round.drawerUsername}</span>
                    {wonBadge ? (
                        <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full border border-green-300">
                            ✓ {guessers.length} guessed
                        </span>
                    ) : (
                        <span className="text-xs px-2 py-0.5 bg-red-50 text-red-500 rounded-full border border-red-200">
                            ✗ none
                        </span>
                    )}
                    <span className="text-xs text-gray-400 italic">{endReasonLabel(round.endReason)}</span>
                    {round.createdAt && (
                        <span className="text-xs text-gray-400">ended {formatTime(round.createdAt)}</span>
                    )}
                </div>

                <div className="flex gap-2 items-center">
                    {expanded && canvasData && (
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="text-xs px-2 py-1 font-gloria text-blue-600 hover:text-blue-800 underline decoration-dashed"
                        >
                            {downloading ? 'Saving…' : '↓ PNG'}
                        </button>
                    )}
                    <button
                        onClick={handleToggle}
                        className="text-xs px-2 py-1 font-gloria text-gray-500 hover:text-gray-800"
                    >
                        {expanded ? '▲ hide' : '▼ drawing'}
                    </button>
                </div>
            </div>

            {/* Correct guessers with time taken */}
            {guessers.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                    {guessers.map((g, i) => {
                        const name = typeof g === 'object' ? g.username : g;
                        const secs = typeof g === 'object' ? g.secondsTaken : null;
                        return (
                            <span key={i} className="text-xs text-gray-500">
                                ✓ {name}{secs != null ? ` (${formatSeconds(secs)})` : ''}
                            </span>
                        );
                    })}
                </div>
            )}

            {/* Canvas preview */}
            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        style={{ overflow: 'hidden' }}
                    >
                        {loading && (
                            <p className="text-xs text-gray-400 font-gloria mt-2">Loading drawing…</p>
                        )}
                        {canvasData && canvasData.strokes && (
                            <StrokePreview
                                strokes={canvasData.strokes}
                                word={round.word}
                                drawerUsername={round.drawerUsername}
                            />
                        )}
                        {canvasData && (!canvasData.strokes || canvasData.strokes.length === 0) && (
                            <p className="text-xs text-gray-400 font-gloria mt-2 italic">No drawing recorded.</p>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function sessionStatusLabel(status, roundsPlayed, totalRounds) {
    if (status === 'ACTIVE') return { text: 'Abandoned', style: 'bg-gray-100 text-gray-500 border-gray-300' };
    if (roundsPlayed < totalRounds && totalRounds > 0) return { text: 'Ended early', style: 'bg-orange-50 text-orange-600 border-orange-200' };
    return null;
}

// Individual match card
function MatchCard({ match, username }) {
    const [open, setOpen] = useState(false);

    const myScore = match.players.find(p => p.username === username)?.score ?? match.myScore ?? 0;
    const isWinner = match.winner === username;
    const roundsPlayed = match.rounds?.length ?? 0;
    const statusBadge = sessionStatusLabel(match.status, roundsPlayed, match.totalRounds);

    return (
        <SketchBorder className="mb-4">
            <div className="p-3 px-4">
                {/* Match header */}
                <button
                    className="w-full text-left"
                    onClick={() => setOpen(o => !o)}
                >
                    <div className="flex items-start justify-between flex-wrap gap-1">
                        <div>
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-gloria font-bold text-base text-gray-800">
                                    Room {match.roomCode}
                                </span>
                                {isWinner && (
                                    <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full border border-yellow-300 font-gloria">
                                        Winner
                                    </span>
                                )}
                                {statusBadge && (
                                    <span className={`text-xs px-2 py-0.5 rounded-full border font-gloria ${statusBadge.style}`}>
                                        {statusBadge.text}
                                    </span>
                                )}
                            </div>
                            <p className="font-gloria text-xs text-gray-500 mt-0.5">
                                {formatDate(match.playedAt)} · {roundsPlayed}/{match.totalRounds} rounds · {myScore} pts
                            </p>
                            {match.players.length > 0 && (
                                <p className="font-gloria text-xs text-gray-500">
                                    Players: {match.players.map(p => `${p.username} (${p.score})`).join(' · ')}
                                </p>
                            )}
                            <p className="font-gloria text-xs text-gray-400">
                                {match.winner ? `Won by ${match.winner}` : 'No winner'}
                                {match.hostUsername ? ` · Host: ${match.hostUsername}` : ''}
                            </p>
                        </div>
                        <span className="font-gloria text-gray-400 text-sm mt-1">{open ? '▲' : '▼'}</span>
                    </div>
                </button>

                {/* Rounds */}
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            style={{ overflow: 'hidden' }}
                        >
                            <div className="mt-3 border-t border-dashed border-gray-200 pt-3">
                                {roundsPlayed === 0 ? (
                                    <p className="font-gloria text-xs text-gray-400 italic">
                                        {match.status === 'ACTIVE'
                                            ? 'Game was abandoned before any round completed.'
                                            : 'No rounds were completed in this match.'}
                                    </p>
                                ) : (
                                    match.rounds.map((round) => (
                                        <RoundRow key={round.roundRecordId} round={round} />
                                    ))
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </SketchBorder>
    );
}

// ---------------------------------------------------------------------------
// Main overlay
// ---------------------------------------------------------------------------

const MatchHistoryOverlay = ({ onClose, username }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const overlayCanvasRef = useRef(null);

    useEffect(() => {
        getMatchHistory()
            .then(data => setMatches(data.matches || []))
            .catch(() => setError('Failed to load match history.'))
            .finally(() => setLoading(false));
    }, []);

    // Close on backdrop click
    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    // Sketchy title underline
    const titleCanvasRef = useRef(null);
    useEffect(() => {
        const cvs = titleCanvasRef.current;
        if (!cvs) return;
        cvs.width = 260;
        cvs.height = 14;
        const rc = rough.canvas(cvs);
        rc.line(0, 7, 260, 7, { roughness: 1.5, stroke: '#555', strokeWidth: 1.5 });
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(2px)' }}
            onClick={handleBackdropClick}
        >
            <motion.div
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 60, damping: 14 }}
                className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-sm"
                style={{
                    background: 'rgba(253,251,244,0.97)',
                    boxShadow: '4px 6px 24px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(0,0,0,0.06)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Sketchy outer border */}
                <SketchBorder className="flex flex-col flex-1 min-h-0" innerClassName="flex flex-col flex-1 min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
                        <div>
                            <h2 className="font-gloria text-2xl text-gray-800 tracking-wide">
                                Match History
                            </h2>
                            <canvas ref={titleCanvasRef} width={260} height={14} className="block -mt-1" />
                        </div>
                        <button
                            onClick={onClose}
                            className="font-gloria text-gray-400 hover:text-gray-700 text-2xl leading-none transition-colors"
                            style={{ fontFamily: 'Gloria Hallelujah, cursive' }}
                        >
                            ✕
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto px-5 pb-5 min-h-0 sketch-scrollbar">
                        {loading && (
                            <div className="flex items-center justify-center py-16">
                                <p className="font-gloria text-gray-400 animate-pulse">Loading matches…</p>
                            </div>
                        )}

                        {error && (
                            <p className="font-gloria text-red-400 text-center py-8">{error}</p>
                        )}

                        {!loading && !error && matches.length === 0 && (
                            <div className="flex flex-col items-center py-16 gap-2">
                                <p className="font-gloria text-gray-400 text-lg">No matches played yet</p>
                                <p className="font-gloria text-gray-300 text-sm">
                                    Your games will appear here after they finish
                                </p>
                            </div>
                        )}

                        {!loading && !error && matches.map((match) => (
                            <MatchCard
                                key={match.sessionId}
                                match={match}
                                username={username}
                            />
                        ))}
                    </div>
                </SketchBorder>
            </motion.div>
        </motion.div>
    );
};

export default MatchHistoryOverlay;
