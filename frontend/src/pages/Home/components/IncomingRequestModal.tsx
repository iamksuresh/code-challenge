import { useMemo, type ReactElement } from 'react';
import { Modal, Typography, Space, Button, Flex, theme } from 'antd';
import { useChat } from '../../../context/ChatContext';
import { UI_LABELS } from '../../../constants/messages';

const { Text } = Typography;

// ─── Styles Hook ───

const useStyles = () => {
  const { token } = theme.useToken();

  return useMemo(
    () => ({
      modalHeader: {
        textAlign: 'center' as const,
      },
      content: {
        width: '100%',
        padding: `${token.padding}px 0`,
      },
      nameText: {
        fontSize: token.fontSizeLG,
      },
      tag: {
        margin: 0,
      },
    }),
    [token]
  );
};

// ─── Component ───

export const IncomingRequestModal = (): ReactElement | null => {
  const { incomingRequest, respondToRequest } = useChat();
  const styles = useStyles();

  if (!incomingRequest) {
    return null;
  }

  const handleAccept = (): void => {
    respondToRequest(incomingRequest.from, true);
  };

  const handleDecline = (): void => {
    respondToRequest(incomingRequest.from, false);
  };

  return (
    <Modal
      open={true}
      title={UI_LABELS.INCOMING_REQUEST}
      centered
      closable={false}
      styles={{ header: styles.modalHeader }}
      footer={
        <Flex gap={12} justify="flex-end">
          <Button onClick={handleDecline}>{UI_LABELS.DECLINE}</Button>
          <Button type="primary" onClick={handleAccept}>
            {UI_LABELS.ACCEPT}
          </Button>
        </Flex>
      }
    >
      <Space direction="vertical" align="center" style={styles.content}>
        <Flex align="center" gap={8}>
          <Text strong style={styles.nameText}>
            {incomingRequest.fromName} ({incomingRequest.from}) wants to chat with you
          </Text>
         
        </Flex>
      </Space>
    </Modal>
  );
};
