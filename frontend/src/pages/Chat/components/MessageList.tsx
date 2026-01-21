import { useEffect, useRef, useMemo, type ReactElement, type CSSProperties } from 'react';
import { Flex, Typography, Empty, Row, Col, theme } from 'antd';
import { ChatMessage } from '../../../types';

const { Text } = Typography;

// ─── Styles Hook ───

const useStyles = () => {
  const { token } = theme.useToken();

  return useMemo(
    () => ({
      row: {
        width: '100%',
        flexShrink: 0,
      } as CSSProperties,
      bubbleOwn: {
        maxWidth: '100%',
        padding: `${token.paddingSM}px ${token.padding}px`,
        borderRadius: `${token.borderRadiusLG}px ${token.borderRadiusLG}px ${token.borderRadiusXS}px ${token.borderRadiusLG}px`,
        background: token.colorPrimary,
        wordBreak: 'break-word',
      } as CSSProperties,
      bubbleOther: {
        maxWidth: '100%',
        padding: `${token.paddingSM}px ${token.padding}px`,
        borderRadius: `${token.borderRadiusLG}px ${token.borderRadiusLG}px ${token.borderRadiusLG}px ${token.borderRadiusXS}px`,
        background: token.colorBgElevated,
        border: `${token.lineWidth}px ${token.lineType} ${token.colorBorderSecondary}`,
        wordBreak: 'break-word',
      } as CSSProperties,
      senderInfo: {
        marginBottom: token.marginXXS,
      },
      senderText: {
        fontSize: token.fontSizeSM,
      },
      messageTextOwn: {
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        color: token.colorTextLightSolid,
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      } as CSSProperties,
      messageTextOther: {
        lineHeight: 1.5,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
      } as CSSProperties,
      timestampOwn: {
        fontSize: token.fontSizeSM - 1,
        marginTop: token.marginXS,
        textAlign: 'right',
        opacity: 0.7,
        color: token.colorTextLightSolid,
      } as CSSProperties,
      timestampOther: {
        fontSize: token.fontSizeSM - 1,
        marginTop: token.marginXS,
        textAlign: 'right',
        color: token.colorTextSecondary,
      } as CSSProperties,
      emptyContainer: {
        flex: 1,
        padding: token.padding,
      } as CSSProperties,
      listContainer: {
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        padding: token.padding,
        minHeight: 0,
      } as CSSProperties,
    }),
    [token]
  );
};

// ─── Props ───

type MessageListProps = {
  messages: ChatMessage[];
};

type MessageItemProps = {
  message: ChatMessage;
};

// ─── Message Item Component ───

const MessageItem = ({ message }: MessageItemProps): ReactElement => {
  const styles = useStyles();

  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const isOwn = message.isOwn;

  return (
    <Row justify={isOwn ? 'end' : 'start'} style={styles.row}>
      <Col xs={22} sm={20} md={18} lg={16} xl={14}>
        <Flex justify={isOwn ? 'flex-end' : 'flex-start'}>
          <Flex vertical style={isOwn ? styles.bubbleOwn : styles.bubbleOther}>
            {!isOwn && (
              <Flex gap={4} style={styles.senderInfo}>
                <Text strong style={styles.senderText}>
                  {message.fromName}
                </Text>
                <Text type="secondary" style={styles.senderText}>
                  ({message.from})
                </Text>
              </Flex>
            )}
            <Text style={isOwn ? styles.messageTextOwn : styles.messageTextOther}>
              {message.content}
            </Text>
            <Text style={isOwn ? styles.timestampOwn : styles.timestampOther}>
              {formattedTime}
            </Text>
          </Flex>
        </Flex>
      </Col>
    </Row>
  );
};

// ─── Component ───

export const MessageList = ({ messages }: MessageListProps): ReactElement => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const styles = useStyles();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <Flex align="center" justify="center" style={styles.emptyContainer}>
        <Empty description="No messages yet. Start the conversation!" />
      </Flex>
    );
  }

  return (
    <Flex vertical gap={16} style={styles.listContainer}>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} />
      ))}
      <div ref={messagesEndRef} />
    </Flex>
  );
};
