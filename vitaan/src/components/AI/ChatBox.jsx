import React, { useState, useRef, useEffect } from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';

export default function AIChatBox() {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'Hello! 👋 I\'m your AI assistant powered by Gemini. I can help you with questions about your projects, tasks, team members, and more. What would you like to know?',
      sender: 'ai',
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Call Gemini API via Cloud Functions
  const getAIResponse = async (userMessage) => {
    try {
      const aiChat = httpsCallable(functions, 'aiChat');
      const response = await aiChat({
        message: userMessage,
        context: {
          userRole: currentUser?.role || 'volunteer',
          userName: currentUser?.name || 'User',
        }
      });
      return response.data.reply;
    } catch (error) {
      console.error('AI Chat Error:', error);
      return 'Sorry, I encountered an error processing your request. Please try again.';
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!inputValue.trim()) {
      toast.info('Please type a message');
      return;
    }

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    setIsLoading(true);

    try {
      const aiReply = await getAIResponse(inputValue);
      
      const aiResponse = {
        id: messages.length + 2,
        text: aiReply,
        sender: 'ai',
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      toast.error('Failed to get AI response');
      console.error(err);
    } finally {
      setIsTyping(false);
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat history?')) {
      setMessages([
        {
          id: 1,
          text: 'Hello! 👋 Chat cleared. How can I help you now?',
          sender: 'ai',
          timestamp: new Date(),
        }
      ]);
      toast.success('Chat cleared');
    }
  };

  const copyMessage = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '20px', overflow: 'hidden', background: 'white' }}>
      {/* Enhanced Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '1.75rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: '0 8px 24px rgba(102, 126, 234, 0.3)'
      }}>
        <div>
          <h5 className="mb-1 fw-bold" style={{ fontSize: '1.3rem', letterSpacing: '-0.5px' }}>
            🤖 AI Assistant
          </h5>
          <small style={{ opacity: 0.85, fontSize: '0.9rem' }}>Powered by Google Gemini</small>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              fontSize: '0.9rem',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
          >
            ⚙️
          </button>
        </div>
      </div>

      {/* Settings Menu */}
      {showSettings && (
        <div style={{
          background: 'rgba(245, 247, 250, 0.95)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          padding: '1rem 2rem',
          display: 'flex',
          gap: '1rem'
        }}>
          <button
            onClick={clearChat}
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              padding: '0.6rem 1.2rem',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            🗑️ Clear Chat
          </button>
        </div>
      )}

      {/* Messages Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '2rem 2rem',
          background: 'linear-gradient(135deg, #f8fafc 0%, #f3f4f6 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.25rem'
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              animation: 'fadeInUp 0.4s ease-out'
            }}
          >
            {/* AI Avatar */}
            {message.sender === 'ai' && (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.1rem',
                  flexShrink: 0,
                  marginRight: '0.75rem',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                  border: '2px solid white'
                }}
              >
                🤖
              </div>
            )}

            {/* Message Bubble with Copy Action */}
            <div
              style={{
                maxWidth: '70%',
                animation: 'slideInUp 0.3s ease-out'
              }}
            >
              <div
                style={{
                  padding: '1rem 1.5rem',
                  borderRadius: message.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  background: message.sender === 'user'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'white',
                  color: message.sender === 'user' ? 'white' : '#1f2937',
                  boxShadow: message.sender === 'user'
                    ? '0 8px 20px rgba(102, 126, 234, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.08)',
                  wordBreak: 'break-word',
                  lineHeight: '1.6',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = message.sender === 'user'
                    ? '0 12px 28px rgba(102, 126, 234, 0.4)'
                    : '0 8px 20px rgba(0, 0, 0, 0.12)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = message.sender === 'user'
                    ? '0 8px 20px rgba(102, 126, 234, 0.3)'
                    : '0 4px 12px rgba(0, 0, 0, 0.08)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {message.text}
                </p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: '0.75rem',
                  paddingTop: '0.75rem',
                  borderTop: `1px solid ${message.sender === 'user' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)'}`
                }}>
                  <small style={{ opacity: 0.7, fontSize: '0.8rem' }}>
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </small>
                  <button
                    onClick={() => copyMessage(message.text)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: message.sender === 'user' ? 'rgba(255,255,255,0.8)' : '#6b7280',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = message.sender === 'user' 
                        ? 'rgba(255,255,255,0.1)' 
                        : 'rgba(0,0,0,0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                    title="Copy message"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>

            {/* User Avatar */}
            {message.sender === 'user' && (
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #28a745, #20c997)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.1rem',
                  flexShrink: 0,
                  marginLeft: '0.75rem',
                  boxShadow: '0 4px 12px rgba(40, 167, 69, 0.4)',
                  border: '2px solid white'
                }}
              >
                👤
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', animation: 'fadeInUp 0.3s ease-out' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1.1rem',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                border: '2px solid white'
              }}
            >
              🤖
            </div>
            <div
              style={{
                padding: '1rem 1.5rem',
                borderRadius: '20px 20px 20px 4px',
                background: 'white',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                gap: '0.5rem',
                alignItems: 'center'
              }}
            >
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                animation: 'bounce 1.4s infinite'
              }} />
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                animation: 'bounce 1.4s infinite',
                animationDelay: '0.2s'
              }} />
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                animation: 'bounce 1.4s infinite',
                animationDelay: '0.4s'
              }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div style={{
        padding: '1.5rem 2rem',
        background: 'white',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.04)'
      }}>
        <Form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <Form.Control
            type="text"
            placeholder="Ask me anything... 💬"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || isTyping}
            style={{
              borderRadius: '24px',
              padding: '0.875rem 1.5rem',
              border: '2px solid #e5e7eb',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease',
              fontWeight: '500'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 4px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.boxShadow = 'none';
            }}
          />
          <Button
            type="submit"
            disabled={isLoading || isTyping || !inputValue.trim()}
            style={{
              borderRadius: '24px',
              padding: '0.875rem 1.75rem',
              background: inputValue.trim() ? 'linear-gradient(135deg, #667eea, #764ba2)' : '#d1d5db',
              border: 'none',
              fontSize: '1.1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              minWidth: '70px',
              color: 'white',
              boxShadow: inputValue.trim() ? '0 4px 12px rgba(102, 126, 234, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
              }
            }}
          >
            {isLoading || isTyping ? (
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            ) : (
              '📤'
            )}
          </Button>
        </Form>
        <small style={{ display: 'block', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
          💡 Try: "Analyze my tasks", "Suggest projects", "Team insights", or "What should I do?"
        </small>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes typing {
          0%, 60%, 100% {
            opacity: 0.3;
            transform: translateY(0);
          }
          30% {
            opacity: 1;
            transform: translateY(-10px);
          }
        }

        @keyframes bounce {
          0%, 100% {
            opacity: 0.5;
            transform: translateY(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-8px);
          }
        }
      `}</style>
    </div>
  );
}
