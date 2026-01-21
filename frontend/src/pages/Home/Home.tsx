// Landing page

import { useMemo, type ReactElement, type CSSProperties } from 'react';
import { Badge, Card, Alert, Flex, Row, Col, Layout, Typography, Button, theme } from 'antd';
import { useUser } from '../../context/UserContext';
import { useChat } from '../../context/ChatContext';
import { ERROR_MESSAGES, UI_LABELS } from '../../constants/messages';
import { hasStoredUser } from '../../utils/localStorage';
import { RegisterForm } from './components/RegisterForm';
import { ChatRequestForm } from './components/ChatRequestForm';
import { IncomingRequestModal } from './components/IncomingRequestModal';
import { BusyUserModal } from './components/BusyUserModal';
import { gradients } from '../../themes';

const { Header, Content } = Layout;
const { Title } = Typography;
interface HomeStyles {
  layout: CSSProperties;
  header: CSSProperties;
  headerContent: CSSProperties;
  title: CSSProperties;
  statusButton: CSSProperties;
  statusText: (connected: boolean) => CSSProperties;
  content: CSSProperties;
  contentWrapper: CSSProperties;
  row: CSSProperties;
  card: CSSProperties;
}

const useStyles = (): HomeStyles => {
  const { token } = theme.useToken();

  return useMemo(
    (): HomeStyles => ({
      layout: {
        minHeight: '100vh',
      },
      header: {
        boxShadow: token.boxShadowTertiary,
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: token.zIndexPopupBase,
      },
      headerContent: {
        height: '100%',
      },
      title: {
        margin: 0,
        background: gradients.primary,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        fontWeight: token.fontWeightStrong,
      },
      statusButton: {
        padding: `${token.paddingXXS}px ${token.paddingSM}px`,
        height: 'auto',
      },
      statusText: (connected: boolean): CSSProperties => ({
        color: connected ? token.colorSuccess : token.colorError,
      }),
      content: {
        background: gradients.primary,
        paddingTop: token.controlHeightLG + token.paddingLG,
        minHeight: '100vh',
      },
      contentWrapper: {
        minHeight: `calc(100vh - ${token.controlHeightLG + token.paddingLG}px)`,
        padding: token.padding,
      },
      row: {
        width: '100%',
      },
      card: {
        textAlign: 'center',
      },
    }),
    [token]
  );
};

export const Home = (): ReactElement => {
  const { isRegistered, isConnected, registrationError } = useUser();
  const { incomingRequest, busyUser } = useChat();
  const styles = useStyles();

  const showConnected = isConnected && hasStoredUser();
  const isMultiTabError = registrationError?.includes('another tab');

  return (
    <Layout style={styles.layout}>
      <Header style={styles.header}>
        <Flex justify="space-between" align="center" style={styles.headerContent}>
          <Title level={4} style={styles.title}>
            {UI_LABELS.APP_TITLE}
          </Title>
          <Button type="text" style={styles.statusButton}>
            <Flex align="center" gap={8}>
              <Badge status={showConnected ? 'success' : 'error'} />
              <span style={styles.statusText(showConnected)}>
                {showConnected ? 'Connected' : 'Not Connected'}
              </span>
            </Flex>
          </Button>
        </Flex>
      </Header>

      <Content style={styles.content}>
        <Flex vertical align="center" justify="center" style={styles.contentWrapper}>
          <Row justify="center" align="middle" style={styles.row}>
            <Col xs={24} sm={20} md={16} lg={12} xl={10} xxl={8}>
              {isMultiTabError ? (
                <Card style={styles.card}>
                  <Alert
                    type="error"
                    message="Already Open"
                    description={ERROR_MESSAGES.MULTI_TAB_ERROR}
                    showIcon
                  />
                </Card>
              ) : isRegistered ? (
                <ChatRequestForm />
              ) : (
                <RegisterForm />
              )}
            </Col>
          </Row>
        </Flex>
      </Content>

      {incomingRequest && <IncomingRequestModal />}
      {busyUser && <BusyUserModal />}
    </Layout>
  );
};
