import { useMemo, type ReactElement } from 'react';
import { Modal, Typography, Space, Button, theme } from 'antd';
import { useChat } from '../../../context/ChatContext';
import { UI_LABELS } from '../../../constants/messages';

const { Text } = Typography;

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
    }),
    [token]
  );
};

export const BusyUserModal = (): ReactElement | null => {
  const { busyUser, clearBusyUser } = useChat();
  const styles = useStyles();

  if (!busyUser) {
    return null;
  }

  const handleDismiss = (): void => {
    clearBusyUser();
  };

  return (
    <Modal
      open={true}
      title={UI_LABELS.USER_BUSY}
      centered
      closable={false}
      styles={{ header: styles.modalHeader }}
      footer={
        <Button type="primary" onClick={handleDismiss}>
          {UI_LABELS.DISMISS}
        </Button>
      }
    >
      <Space direction="vertical" align="center" style={styles.content}>
        <Text strong style={styles.nameText}>
          {busyUser.name} ({busyUser.connectionId}) is currently in another chat.
        </Text>
        <Text type="secondary">
          Please try again later when they become available.
        </Text>
      </Space>
    </Modal>
  );
};
