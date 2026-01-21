import { useMemo, type ReactElement, type CSSProperties } from 'react';
import { Button, Flex, Typography, Tag, Row, Col, theme } from 'antd';
import { useUser } from '../../../context/UserContext';
import { useChat } from '../../../context/ChatContext';
import { UI_LABELS } from '../../../constants/messages';

const { Text } = Typography;

// ─── Styles Hook ───

const useStyles = () => {
  const { token } = theme.useToken();

  return useMemo(
    () => ({
      header: {
        padding: `${token.paddingSM}px ${token.padding}px`,
        background: token.colorBgContainer,
        borderBottom: `${token.lineWidth}px ${token.lineType} ${token.colorBorder}`,
        flexWrap: 'nowrap',
      } as CSSProperties,
      partnerName: {
        fontSize: token.fontSizeLG,
      },
    }),
    [token]
  );
};

// ─── Component ───

export const ChatHeader = (): ReactElement | null => {
  const { user } = useUser();
  const { session, leaveChat } = useChat();
  const styles = useStyles();

  if (!session || !user) {
    return null;
  }

  const handleLeaveChat = (): void => {
    leaveChat();
  };

  return (
    <Row align="middle" justify="space-between" gutter={[8, 8]} style={styles.header}>
      <Col flex="auto">
        <Flex align="center" gap={8} wrap="wrap">
          <Text strong style={styles.partnerName}>
            {session.partner.name}
          </Text>
          <Text type="secondary">({session.partner.connectionId})</Text>
        </Flex>
      </Col>

      <Col xs={0} sm={0} md="auto">
        <Tag color="default">
          <Text type="secondary">You: </Text>
          <Text strong>{user.name}</Text>
          <Text type="secondary"> ({user.connectionId})</Text>
        </Tag>
      </Col>

      <Col flex="none">
        <Button danger onClick={handleLeaveChat}>
          {UI_LABELS.LEAVE_CHAT}
        </Button>
      </Col>
    </Row>
  );
};
