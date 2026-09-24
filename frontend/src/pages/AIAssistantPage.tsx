// ==============================================================================
// OceanSense — Maritime Operations AI Assistant Console
// Demonstrates: Week 7 & 15 Function Calling, Multi-Step Maritime Tool Execution & Chat Trace
// ==============================================================================

import React, { useState } from 'react';

interface ToolTrace {
  toolName: string;
  arguments: any;
  result: any;
}

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  toolCalls?: ToolTrace[];
}

export const AIAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: 'Maritime Operations AI Assistant online. Acoustic telemetry linked to 1,000 seabed sonar nodes, 4 surface gateway buoys, and 4 autonomous AUV drones. What operational commands do you require?',
      timestamp: new Date().toLocaleTimeString(),
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const samplePrompts = [
    'Diagnose node SN-0431 telemetry',
    'Trigger tamper test on SN-0431',
    'Query active fish school biomass',
    'Dispatch AUV-01 to Sector Delta',
    'List battery critical nodes',
    'Reset tamper alarm on SN-0431',
  ];

  const handleSend = async (queryToSend?: string) => {
    const query = queryToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();

      const assistantMsg: Message = {
        id: `a-${Date.now()}`,
        sender: 'assistant',
        text: data.answer || 'Query processed.',
        timestamp: new Date().toLocaleTimeString(),
        toolCalls: data.toolCalls || [],
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `Communication error: ${e.message}`,
          timestamp: new Date().toLocaleTimeString(),
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      padding: '1.5rem',
      paddingBottom: '3rem',
      background: 'var(--color-page-bg)',
      minHeight: '100%',
      color: 'var(--color-text-secondary)',
      fontFamily: 'Inter, sans-serif',
      maxWidth: '1100px',
      margin: '0 auto',
      width: '100%',
    }}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--color-electric-cyan)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
            AGENTIC MARITIME REASONING // 13 REGISTERED HARDWARE TOOLS
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '4px 0 0 0', color: 'var(--color-text-primary)' }}>
            Maritime Operations AI Assistant
          </h1>
        </div>

        <div style={{
          padding: '6px 12px',
          background: 'rgba(0, 242, 254, 0.15)',
          border: '1px solid var(--color-electric-cyan)',
          borderRadius: '4px',
          fontSize: '0.8rem',
          fontFamily: 'monospace',
          color: 'var(--color-electric-cyan)',
        }}>
          ● FUNCTION CALLING ENGINE ONLINE
        </div>
      </div>

      {/* Suggested Prompt Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {samplePrompts.map((p) => (
          <button
            key={p}
            onClick={() => handleSend(p)}
            style={{
              padding: '6px 12px',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
              borderRadius: '20px',
              border: '1px solid var(--color-slate-border)',
              background: 'var(--color-slate-card)',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-electric-cyan)';
              (e.currentTarget as HTMLElement).style.color = 'var(--color-electric-cyan)';
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-slate-border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--color-text-muted)';
            }}
          >
            ⚡ {p}
          </button>
        ))}
      </div>

      {/* Chat Messages Feed */}
      <div style={{
        flex: 1,
        background: 'var(--color-surface-navy)',
        border: '1px solid var(--color-slate-border)',
        borderRadius: '6px',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        minHeight: '400px',
        maxHeight: '580px',
        overflowY: 'auto',
      }}>
        {messages.map((m) => (
          <div
            key={m.id}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: m.sender === 'user' ? '70%' : '85%',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.7rem',
              fontFamily: 'monospace',
              color: 'var(--color-text-muted)',
              justifyContent: m.sender === 'user' ? 'flex-end' : 'flex-start',
            }}>
              <span>{m.sender === 'user' ? 'OPERATOR' : 'OCEANSENSE AI AGENT'}</span>
              <span>{m.timestamp}</span>
            </div>

            <div style={{
              padding: '0.85rem 1.1rem',
              borderRadius: '6px',
              background: m.sender === 'user' ? 'rgba(0, 242, 254, 0.15)' : 'var(--color-slate-card)',
              border: m.sender === 'user' ? '1px solid var(--color-electric-cyan)' : '1px solid var(--color-slate-border)',
              color: 'var(--color-text-primary)',
              fontSize: '0.85rem',
              lineHeight: '1.5',
            }}>
              {m.text}
            </div>

            {/* Tool Execution Trace Cards */}
            {m.toolCalls && m.toolCalls.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.25rem' }}>
                {m.toolCalls.map((t, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--color-abyssal-deep)',
                      border: '1px solid rgba(0, 242, 254, 0.3)',
                      borderRadius: '4px',
                      padding: '0.75rem',
                      fontSize: '0.75rem',
                      fontFamily: 'monospace',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-electric-cyan)', marginBottom: '4px' }}>
                      <span>⚙️ TOOL EXECUTED: {t.toolName}</span>
                      <span style={{ color: 'var(--color-aquamarine)' }}>SUCCESS</span>
                    </div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', marginBottom: '4px' }}>
                      Args: {JSON.stringify(t.arguments)}
                    </div>
                    <pre style={{
                      margin: 0,
                      padding: '6px',
                      background: 'var(--color-surface-navy)',
                      borderRadius: '3px',
                      color: 'var(--color-text-secondary)',
                      fontSize: '0.7rem',
                      maxHeight: '120px',
                      overflowX: 'auto',
                      overflowY: 'auto',
                    }}>
                      {JSON.stringify(t.result, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div style={{ color: 'var(--color-electric-cyan)', fontFamily: 'monospace', fontSize: '0.8rem' }}>
            ● Reasoning & invoking subsea telemetry tools...
          </div>
        )}
      </div>

      {/* Input Box */}
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        background: 'var(--color-surface-navy)',
        padding: '0.75rem',
        borderRadius: '6px',
        border: '1px solid var(--color-slate-border)',
      }}>
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask operations questions or dispatch subsea commands (e.g., 'Check node SN-0431 and send drone')..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'var(--color-text-primary)',
            fontSize: '0.85rem',
            fontFamily: 'Inter, sans-serif',
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={isProcessing}
          style={{
            padding: '8px 18px',
            background: 'var(--color-electric-cyan)',
            border: 'none',
            borderRadius: '4px',
            color: '#070B14',
            fontWeight: 700,
            fontFamily: 'monospace',
            cursor: 'pointer',
          }}
        >
          EXECUTE
        </button>
      </div>
    </div>
  );
};
