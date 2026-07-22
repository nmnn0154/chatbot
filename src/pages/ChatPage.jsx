import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { sendChatMessage, getChatById } from '../lib/chatApi';
import { Send, AlertTriangle, Bot, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'คุณสมบัติผู้กู้ กยศ. มีอะไรบ้าง?',
  'ต้องเตรียมเอกสารอะไรบ้าง?',
  'ขั้นตอนการกู้ยืมผ่านระบบ DSL',
  'ช่องทางชำระหนี้ กยศ.',
  'กยศ. คิดดอกเบี้ยเท่าไร?',
  'ติดต่องาน กยศ. มทร.ศรีวิชัย',
];

export default function ChatPage() {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const chatId = queryParams.get('id');

  useEffect(() => {
    async function loadChat() {
      if (chatId) {
        const chat = await getChatById(chatId);
        if (chat && chat.user_id === user?.id) {
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
            }
          ]);
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
      const response = await sendChatMessage(text, user?.id);
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response,
        time: new Date(),
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

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBotText = (text) => {
    // Simple markdown-like formatting
    return text
      .split('\n')
      .map((line, i) => {
        // Bold text
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        // Italic
        line = line.replace(/\*(.*?)\*/g, '<em>$1</em>');
        return line;
      })
      .join('\n');
  };

  const userInitial = profile?.full_name?.charAt(0) || 'U';

  return (
    <div className="chat-container" id="chat-page">
      {/* Disclaimer Banner */}
      <div className="chat-disclaimer">
        <AlertTriangle size={16} />
        <span>
          ระบบนี้ให้คำแนะนำเบื้องต้นเท่านั้น ไม่สามารถเข้าถึงข้อมูลส่วนบุคคลหรือยอดหนี้ กยศ. ได้
        </span>
      </div>

      {/* Messages Area */}
      <div className="chat-messages" id="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="chat-welcome-icon">
              <Sparkles size={32} color="white" />
            </div>
            <h2 className="gradient-text">สวัสดีครับ! 👋</h2>
            <p>
              ผมคือแชทบอท กยศ. พร้อมช่วยตอบคำถามเกี่ยวกับกองทุนเงินให้กู้ยืมเพื่อการศึกษา
              สำหรับนักศึกษา มทร.ศรีวิชัย
            </p>
            <div className="chat-suggestions">
              {SUGGESTIONS.map((suggestion, i) => (
                <button
                  key={i}
                  className="chat-suggestion-btn"
                  onClick={() => handleSend(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
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
                {msg.text.split('\n').map((line, i) => (
                  <p key={i} dangerouslySetInnerHTML={{
                    __html: line
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      || '&nbsp;'
                  }} />
                ))}
              </div>
              <div className="message-time">{formatTime(msg.time)}</div>
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
      </div>
    </div>
  );
}
