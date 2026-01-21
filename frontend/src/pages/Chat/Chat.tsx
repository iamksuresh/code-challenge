import { useEffect, useMemo, type ReactElement, type CSSProperties } from 'react';
import { useNavigate } from 'react-router';
import { Layout, Row, Col, Card, theme } from 'antd';
import { useUser } from '../../context/UserContext';
import { useChat } from '../../context/ChatContext';
import { ChatHeader } from './components/ChatHeader';
import { MessageList } from './components/MessageList';
import { MessageInput } from './components/MessageInput';

const { Content, Footer } = Layout;

// ─── Styles Hook ───

const useStyles = () => {
  const { token } = theme.useToken();

  return useMemo(
    () => ({
      layout: {
        minHeight: '100vh',
        maxHeight: '100vh',
        overflow: 'hidden',
      } as CSSProperties,
      content: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: token.colorBgLayout,
        padding: `${token.padding}px`,
      } as CSSProperties,
      contentRow: {
        flex: 1,
        overflow: 'hidden',
        width: '100%',
      } as CSSProperties,
      contentCol: {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
      } as CSSProperties,
      card: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        height: '100%',
      } as CSSProperties,
      footer: {
        padding: `${token.paddingSM}px ${token.padding}px`,
        background: token.colorBgContainer,
        borderTop: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`,
      } as CSSProperties,
    }),
    [token]
  );
};

// ─── Component ───

export const Chat = (): ReactElement | null => {
  const navigate = useNavigate();
  const { user, isRegistered } = useUser();
  const { session, messages, sendMessage } = useChat();
  const styles = useStyles();

  useEffect(() => {
    if (!isRegistered || !session) {
      navigate('/', { replace: true });
    }
  }, [isRegistered, session, navigate]);

  if (!user || !session) {
    return null;
  }

  const handleSendMessage = (message: string): void => {
    sendMessage(message);
  };

  return (
    <Layout style={styles.layout}>
      <ChatHeader />

      <Content style={styles.content}>
        <Row justify="center" style={styles.contentRow}>
          <Col xs={24} sm={24} md={22} lg={20} xl={18} xxl={16} style={styles.contentCol}>
            <Card
              style={styles.card}
              styles={{ body: { flex: 1, overflow: 'hidden', padding: 0, display: 'flex', flexDirection: 'column' } }}
            >
              <MessageList messages={messages} />
            </Card>
          </Col>
        </Row>
      </Content>

      <Footer style={styles.footer}>
        <Row justify="center">
          <Col xs={24} sm={24} md={22} lg={20} xl={18} xxl={16}>
            <MessageInput onSendMessage={handleSendMessage} />
          </Col>
        </Row>
      </Footer>
    </Layout>
  );
};
