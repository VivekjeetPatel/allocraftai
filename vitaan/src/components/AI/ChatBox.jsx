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

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: '16px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1f2937 0%, #374151 100%)',
        color: 'white',
        padding: '1.5rem',
        textAlign: 'center',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <h5 className="mb-1 fw-bold" style={{ fontSize: '1.2rem' }}>
          🤖 AI Assistant (Powered by Gemini)
        </h5>
        <small style={{ opacity: 0.9 }}>Ask me anything about your tasks and projects</small>
      </div>

      {/* Messages Container */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              animation: 'slideInUp 0.3s ease-out'
            }}
          >
            {/* AI Avatar */}
            {message.sender === 'ai' && (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #007bff, #0d6efd)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1rem',
                  flexShrink: 0,
                  marginRight: '0.75rem',
                  boxShadow: '0 2px 8px rgba(13, 110, 253, 0.3)'
                }}
              >
                🤖
              </div>
            )}

            {/* Message Bubble */}
            <div
              style={{
                maxWidth: '70%',
                padding: '0.75rem 1.25rem',
                borderRadius: message.sender === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                background: message.sender === 'user'
                  ? 'linear-gradient(135deg, #1f2937, #374151)'
                  : 'white',
                color: message.sender === 'user' ? 'white' : '#1f2937',
                boxShadow: message.sender === 'user'
                  ? '0 4px 12px rgba(31, 41, 55, 0.2)'
                  : '0 2px 8px rgba(0, 0, 0, 0.08)',
                wordBreak: 'break-word',
                lineHeight: '1.5'
              }}
            >
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                {message.text}
              </p>
              <small
                style={{
                  display: 'block',
                  marginTop: '0.5rem',
                  opacity: 0.7,
                  fontSize: '0.75rem'
                }}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </small>
            </div>

            {/* User Avatar */}
            {message.sender === 'user' && (
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #28a745, #20c997)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1rem',
                  flexShrink: 0,
                  marginLeft: '0.75rem',
                  boxShadow: '0 2px 8px rgba(40, 167, 69, 0.3)'
                }}
              >
                👤
              </div>
            )}
          </div>
        ))}

        {/* Typing Indicator */}
        {isTyping && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #007bff, #0d6efd)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '1rem',
                flexShrink: 0
              }}
            >
              🤖
            </div>
            <div
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: '20px 20px 20px 4px',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                display: 'flex',
                gap: '0.4rem',
                alignItems: 'center'
              }}
            >
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#999',
                  animation: 'typing 1.4s infinite'
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#999',
                  animation: 'typing 1.4s infinite',
                  animationDelay: '0.2s'
                }}
              />
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#999',
                  animation: 'typing 1.4s infinite',
                  animationDelay: '0.4s'
                }}
              />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div style={{
        padding: '1.5rem',
        background: 'white',
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.04)'
      }}>
        <Form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.75rem' }}>
          <Form.Control
            type="text"
            placeholder="Ask me anything... 💬"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading || isTyping}
            style={{
              borderRadius: '24px',
              padding: '0.75rem 1.25rem',
              border: '2px solid #e5e7eb',
              fontSize: '0.95rem',
              transition: 'all 0.2s ease'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#0d6efd';
              e.target.style.boxShadow = '0 0 0 3px rgba(13, 110, 253, 0.1)';
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
              padding: '0.75rem 1.5rem',
              background: inputValue.trim() ? 'linear-gradient(135deg, #1f2937, #374151)' : '#d1d5db',
              border: 'none',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              minWidth: '60px'
            }}
            onMouseEnter={(e) => {
              if (inputValue.trim()) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 0, 0, 0.2)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isLoading || isTyping ? (
              <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
            ) : (
              '📤'
            )}
          </Button>
        </Form>
        <small style={{ display: 'block', marginTop: '0.75rem', textAlign: 'center', color: '#6b7280' }}>
          💡 Tip: Try asking about "tasks", "team", "projects", or "queries"
        </small>
      </div>

      <style>{`
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
      `}</style>
    </div>
  );
}
