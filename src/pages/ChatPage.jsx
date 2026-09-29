import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendChatMessage, getChatById, rateChatResponse, deleteChatFromLocal } from '../lib/chatApi';
import { confirmDelete, showSuccess } from '../lib/swalHelper';
import { Send, AlertTriangle, Bot, Sparkles, Star, Trash2, Plus } from 'lucide-react';
import DOMPurify from 'dompurify';


export default function ChatPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [ratings, setRatings] = useState({}); // Track local ratings by historyId
  const [hoveredRatings, setHoveredRatings] = useState({}); // Track hover state by historyId
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const chatId = queryParams.get('id');

  useEffect(() => {
    function loadChat() {
      if (chatId) {
        const chat = getChatById(chatId, user?.id);
        if (chat) {
          setMessages([
            {
              id: chat.id + '_u',
              type: 'user',
              text: chat.user_message,
              time: chat.created_at,
            },
            {
              id: chat.id + '_b',
              type: 'bot',
              text: chat.bot_response,
              time: chat.created_at,
              historyId: chat.id,
            }
          ]);
          if (chat.rating) {
            setRatings(prev => ({ ...prev, [chat.id]: chat.rating }));
          }
        }
      } else {
        setMessages([]);
      }
    }
    loadChat();
  }, [chatId, user?.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || isTyping) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text,
      time: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const { text: responseText, id: historyId } = await sendChatMessage(text, user?.id);
      const botMessage = {
        id: historyId || Date.now() + 1,
        type: 'bot',
        text: responseText,
        time: new Date(),
        historyId: historyId, // Store historyId to rate it later
      };
      setMessages((prev) => [...prev, botMessage]);

      // If we are looking at a history item, submitting a new message should perhaps clear the history ID from URL
      if (chatId) {
        navigate('/chat', { replace: true });
      }
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: 'ขออภัยครับ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง',
        time: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRate = async (historyId, rating) => {
    if (!historyId) return;
    
    // Optimistic UI update
    setRatings(prev => ({ ...prev, [historyId]: rating }));
    
    const success = await rateChatResponse(historyId, rating, user?.id);
    if (!success) {
      // Revert on failure
      setRatings(prev => {
        const next = { ...prev };
        delete next[historyId];
        return next;
      });
      alert('ขออภัย ไม่สามารถบันทึกคะแนนได้');
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  const userInitial = profile?.full_name?.charAt(0) || 'U';

  const handleDeleteCurrentChat = async () => {
    if (!chatId) return;
    const isConfirmed = await confirmDelete({
      title: 'ลบประวัติการสนทนานี้?',
      text: 'ข้อความในประวัตินี้จะถูกลบถาวร ไม่สามารถกู้คืนได้',
      confirmText: 'ใช่, ลบเลย',
      cancelText: 'ยกเลิก',
    });

    if (isConfirmed) {
      deleteChatFromLocal(chatId, user?.id);
      window.dispatchEvent(new Event('chatHistoryUpdated'));
      showSuccess('ลบแชทเรียบร้อยแล้ว', '', 1200);
      navigate('/chat');
    }
  };

  return (
    <div className="chat-container" id="chat-page">
      {/* Disclaimer Banner */}
      <div className="chat-disclaimer">
        <AlertTriangle size={16} />
        <span>
          ระบบนี้ให้คำแนะนำเบื้องต้นเท่านั้น ไม่สามารถเข้าถึงข้อมูลส่วนบุคคลหรือยอดหนี้ กยศ. ได้
        </span>
      </div>

      {/* Active History Notice Banner */}
      {chatId && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'var(--color-bg-hover)',
          borderBottom: '1px solid var(--color-border)',
          fontSize: 'var(--text-sm)',
          color: 'var(--color-text-secondary)',
        }}>
          <span>กำลังดูประวัติการสนทนา</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '4px 10px', fontSize: 'var(--text-xs)', height: 'auto', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={() => navigate('/chat')}
            >
              <Plus size={14} />
              แชทใหม่
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              style={{ padding: '4px 10px', fontSize: 'var(--text-xs)', height: 'auto', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={handleDeleteCurrentChat}
            >
              <Trash2 size={14} />
              ลบแชทนี้
            </button>
          </div>
        </div>
      )}

      {/* Messages Area */}
      <div className="chat-messages" id="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">
              <Sparkles size={32} color="white" />
            </div>
            <h2 className="gradient-text">สวัสดีครับ</h2>
            <p>
              ผมคือแชทบอท กยศ. พร้อมช่วยตอบคำถามเกี่ยวกับกองทุนเงินให้กู้ยืมเพื่อการศึกษา
              สำหรับนักศึกษา มทร.ศรีวิชัย
            </p>
            <div style={{ marginTop: '12px', padding: '6px 12px', background: 'var(--color-bg-hover)', borderRadius: '8px', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}>
              ⚠️ ระบบนี้ให้คำแนะนำเบื้องต้นเท่านั้น ไม่สามารถเข้าถึงข้อมูลส่วนบุคคลหรือยอดหนี้ กยศ. ได้
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`message message-${msg.type}`}>
            <div className="message-avatar">
              {msg.type === 'bot' ? (
                <Bot size={16} />
              ) : profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
                  referrerPolicy="no-referrer"
                />
              ) : (
                userInitial
              )}
            </div>
            <div>
              <div className="message-bubble">
                {msg.text.split('\n').map((line, i) => {
                  const formatted = line
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>');
                  const cleanHtml = DOMPurify.sanitize(formatted) || '&nbsp;';
                  return <p key={i} dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
                })}
              </div>
              <div className="message-time" style={{ marginTop: '4px' }}>{formatTime(msg.time)}</div>
              
              {msg.type === 'bot' && msg.historyId && (() => {
                const currentRating = ratings[msg.historyId];
                const hoverRating = hoveredRatings[msg.historyId] || 0;
                const activeScore = hoverRating || currentRating || 0;
                const starDescriptions = {
                  1: '1 ดาว (ต้องปรับปรุง)',
                  2: '2 ดาว (พอใช้)',
                  3: '3 ดาว (ปานกลาง)',
                  4: '4 ดาว (ดี)',
                  5: '5 ดาว (ดีเยี่ยม)'
                };

                return (
                  <div 
                    className="rating-container" 
                    style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      marginTop: '16px',
                      padding: '12px 18px',
                      background: 'var(--color-bg-hover)',
                      borderRadius: '12px',
                      border: '1px solid var(--color-border)',
                      width: 'fit-content',
                      margin: '16px auto 0' // Center it below the bubble
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-text)', marginBottom: '8px' }}>
                      {currentRating ? 'ขอบคุณสำหรับการประเมิน' : 'คุณพึงพอใจกับคำตอบนี้หรือไม่?'}
                    </span>
                    <div 
                      style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                      onMouseLeave={() => {
                        if (currentRating === undefined) {
                          setHoveredRatings(prev => ({ ...prev, [msg.historyId]: 0 }));
                        }
                      }}
                    >
                      {[1, 2, 3, 4, 5].map(star => {
                        const isFilled = activeScore >= star;
                        return (
                          <button
                            key={star}
                            onClick={() => handleRate(msg.historyId, star)}
                            disabled={currentRating !== undefined}
                            aria-label={`ให้คะแนน ${star} ดาว`}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: currentRating !== undefined ? 'default' : 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              color: isFilled ? '#f59e0b' : 'var(--color-text-muted)',
                              transition: 'transform 0.15s ease, color 0.15s ease',
                              opacity: currentRating !== undefined && currentRating < star ? 0.35 : 1,
                              transform: activeScore === star ? 'scale(1.2)' : isFilled ? 'scale(1.1)' : 'scale(1)'
                            }}
                            title={starDescriptions[star]}
                            onMouseEnter={() => {
                              if (currentRating === undefined) {
                                setHoveredRatings(prev => ({ ...prev, [msg.historyId]: star }));
                              }
                            }}
                          >
                            <Star 
                              size={26} 
                              fill={isFilled ? '#f59e0b' : 'transparent'} 
                              stroke={isFilled ? '#f59e0b' : 'currentColor'}
                              strokeWidth={1.75}
                            />
                          </button>
                        );
                      })}
                    </div>
                    {/* แสดงคำอธิบายระดับดาวที่กำลังเลือกหรือเลือกแล้ว */}
                    <div style={{ marginTop: '6px', fontSize: '12px', minHeight: '18px', color: activeScore ? '#d97706' : 'var(--color-text-muted)' }}>
                      {activeScore ? starDescriptions[activeScore] : 'เลือก 1 (น้อย) ถึง 5 (มาก)'}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="message message-bot">
            <div className="message-avatar">
              <Bot size={16} />
            </div>
            <div className="message-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="chat-input-wrapper">
        <form className="chat-input-form" onSubmit={handleSubmit}>
          <textarea
            ref={inputRef}
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="พิมพ์คำถามเกี่ยวกับ กยศ. ที่นี่..."
            rows={1}
            disabled={isTyping}
            id="chat-input"
            aria-label="พิมพ์คำถามเกี่ยวกับ กยศ."
          />
          <button
            type="submit"
            className="chat-send-btn"
            disabled={!input.trim() || isTyping}
            aria-label="ส่งข้อความ"
            id="chat-send-btn"
          >
            <Send size={20} />
          </button>
        </form>
        <p style={{ fontSize: '11px', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: '6px', marginBottom: 0 }}>
          ระบบนี้ให้คำแนะนำเบื้องต้นเท่านั้น ไม่สามารถเข้าถึงข้อมูลส่วนบุคคลหรือยอดหนี้ กยศ. ได้
        </p>
      </div>
    </div>
  );
}
