import { useState, useMemo, type ChangeEvent, type ReactElement, type CSSProperties } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Avatar, Flex, Spin, Space, Divider, theme } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useUser } from '../../../context/UserContext';
import { useChat } from '../../../context/ChatContext';
import { ERROR_MESSAGES, UI_LABELS, INFO_MESSAGES } from '../../../constants/messages';
import { gradients } from '../../../themes';

const { Title, Text } = Typography;

const useStyles = () => {
  const { token } = theme.useToken();

  return useMemo(
    () => ({
      avatar: {
        background: gradients.primary,
      },
      secondaryText: {
        fontSize: token.fontSizeSM,
      },
      title: {
        marginBottom: token.margin,
      },
      connectionIdInput: {
        textAlign: 'center' as const,
      } as CSSProperties,
      submitItem: {
        marginBottom: 0,
      },
    }),
    [token]
  );
};

//Constants

const CONNECTION_ID_REGEX = /^\d{3}$/;

export const ChatRequestForm = (): ReactElement => {
  const { user } = useUser();
  const { sendChatRequest, pendingRequest, requestError, clearRequestError } = useChat();
  const styles = useStyles();

  const [targetId, setTargetId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleTargetIdChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    setTargetId(value);
    setError(null);
    clearRequestError();
  };

  const handleSubmit = (): void => {
    if (!CONNECTION_ID_REGEX.test(targetId)) {
      setError(ERROR_MESSAGES.INVALID_CONNECTION_ID);
      return;
    }

    if (targetId === user?.connectionId) {
      setError(ERROR_MESSAGES.SELF_CHAT);
      return;
    }

    setError(null);
    sendChatRequest(targetId);
  };

  const isPending = pendingRequest !== null;
  const displayError = error || requestError;

  return (
    <Card>
      <Flex justify="space-between" align="center">
        <Space>
          <Avatar style={styles.avatar} icon={<UserOutlined />}>
            {user?.connectionId}
          </Avatar>
          <Space direction="vertical" size={0}>
            <Text strong>{user?.name}</Text>
            <Text type="secondary" style={styles.secondaryText}>
              ID: {user?.connectionId}
            </Text>
          </Space>
        </Space>
      </Flex>

      <Divider />

      <Form layout="vertical" onFinish={handleSubmit}>
        <Title level={4} style={styles.title}>
          Start a Chat
        </Title>

        <Form.Item label={UI_LABELS.TARGET_CONNECTION_ID}>
          <Input
            value={targetId}
            onChange={handleTargetIdChange}
            placeholder="Enter Connection ID"
            maxLength={3}
            disabled={isPending}
            style={styles.connectionIdInput}
          />
        </Form.Item>

        {displayError && (
          <Form.Item>
            <Alert type="error" message={displayError} showIcon />
          </Form.Item>
        )}

        {isPending && (
          <Form.Item>
            <Alert
              type="info"
              message={
                <Space>
                  <Spin size="small" />
                  <span>
                    {INFO_MESSAGES.WAITING_FOR_RESPONSE}
                    {pendingRequest.targetName && (
                      <Text strong> from {pendingRequest.targetName}</Text>
                    )}
                  </span>
                </Space>
              }
            />
          </Form.Item>
        )}

        <Form.Item style={styles.submitItem}>
          <Button
            type="primary"
            htmlType="submit"
            block
            disabled={isPending || targetId.length !== 3}
            loading={isPending}
          >
            {isPending ? 'Waiting...' : UI_LABELS.START_CHAT}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};
