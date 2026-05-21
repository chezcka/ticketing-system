import { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getCommentsByTicket, addComment } from '../services/commentService';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

export function useTicketComments(ticketId, currentUserId, isAgent = false, wsEnabled = true) {
  const [comments, setComments]       = useState([]);
  const [loading, setLoading]         = useState(false);
  const [sending, setSending]         = useState(false);
  const [error, setError]             = useState(null);
  const [wsConnected, setWsConnected] = useState(false);

  const stompRef   = useRef(null);
  const seenIds    = useRef(new Set());
  const isAgentRef = useRef(isAgent);
  const loadedForTicketRef = useRef(null); // track which ticketId we've loaded for

  useEffect(() => { isAgentRef.current = isAgent; }, [isAgent]);

  // ── Append a single comment without resetting state ───────────────────────
  const appendComment = useCallback((raw) => {
    if (!raw) return;
    const c = raw.id !== undefined ? raw
            : raw.data?.id !== undefined ? raw.data
            : null;
    if (!c) return;
    if (seenIds.current.has(c.id)) return;  // deduplicate
    if (!isAgentRef.current && c.isInternal) return; // hide internal from clients
    seenIds.current.add(c.id);
    setComments(prev => [...prev, c]);
  }, []);

  // ── Fetch ONLY when ticketId actually changes ────────────────────────────
  useEffect(() => {
    if (!ticketId) {
      setComments([]);
      setError(null);
      seenIds.current = new Set();
      loadedForTicketRef.current = null;
      return;
    }

    // Skip if we already loaded for this exact ticketId
    if (loadedForTicketRef.current === ticketId) return;

    // New ticket — full reset
    setComments([]);
    setError(null);
    seenIds.current = new Set();
    loadedForTicketRef.current = ticketId;

    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        const data = await getCommentsByTicket(ticketId);
        if (cancelled) return;

        const arr = Array.isArray(data) ? data : [];
        const filtered = arr.filter(c => isAgentRef.current || !c.isInternal);
        const deduped = [];
        filtered.forEach(c => {
          if (!seenIds.current.has(c.id)) {
            seenIds.current.add(c.id);
            deduped.push(c);
          }
        });
        setComments(deduped);
      } catch {
        if (!cancelled) setError('Failed to load messages.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [ticketId]);

  // ── Reset loadedForTicketRef when modal closes (ticketId → null) ──────────
  // Already handled above when ticketId is falsy

  // ── WebSocket subscription ────────────────────────────────────────────────
  useEffect(() => {
    if (!ticketId || !wsEnabled) return;

    if (stompRef.current) {
      stompRef.current.deactivate();
      stompRef.current = null;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      reconnectDelay: 5000,
      onConnect: () => {
        setWsConnected(true);
        client.subscribe(`/topic/ticket/${ticketId}`, (frame) => {
          try {
            const raw = JSON.parse(frame.body);
            appendComment(raw);
          } catch { /* ignore malformed frames */ }
        });
      },
      onDisconnect: () => setWsConnected(false),
      onStompError:  () => setWsConnected(false),
    });

    client.activate();
    stompRef.current = client;

    return () => {
      client.deactivate();
      stompRef.current = null;
      setWsConnected(false);
    };
  }, [ticketId, wsEnabled, appendComment]);

  // ── Send ─────────────────────────────────────────────────────────────────
  const send = useCallback(async (content, isInternal = false) => {
    if (!content?.trim() || !ticketId) return false;
    try {
      setSending(true);
      setError(null);
      const comment = await addComment(ticketId, content.trim(), isInternal);
      if (comment?.id) {
        appendComment(comment); // instantly append — no re-fetch
      }
      return true;
    } catch {
      setError('Failed to send message. Please try again.');
      return false;
    } finally {
      setSending(false);
    }
  }, [ticketId, appendComment]);

  // ── Reset loaded tracker when ticket closes ───────────────────────────────
  const reset = useCallback(() => {
    loadedForTicketRef.current = null;
    seenIds.current = new Set();
    setComments([]);
  }, []);

  return { comments, loading, sending, error, send, wsConnected, reset };
}