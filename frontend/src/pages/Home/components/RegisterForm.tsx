import { useState, useEffect, useMemo, type ReactElement, type CSSProperties } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Flex, theme } from 'antd';
import { useUser } from '../../../context/UserContext';
import { ERROR_MESSAGES, UI_LABELS } from '../../../constants/messages';

const { Title, Text } = Typography;

// ─── Styles Hook ───

const useStyles = () => {
  const { token } = theme.useToken();

  return useMemo(
    () => ({
      title: {
        textAlign: 'center' as const,
        marginBottom: token.marginLG,
      },
      connectionIdInput: {
        flex: 1,
        textAlign: 'center' as const,
      } as CSSProperties,
      generateButton: {
        flex: 1,
      },
      submitItem: {
        marginBottom: 0,
      },
    }),
    [token]
  );
};

// ─── Constants ───

const CONNECTION_ID_REGEX = /^\d{3}$/;
const NAME_REGEX = /^[a-zA-Z0-9]+$/;
const NAME_MIN_LENGTH = 3;
const NAME_MAX_LENGTH = 15;

// ─── Component ───

export const RegisterForm = (): ReactElement => {
  const {
    isRegistering,
    registrationError,
    register,
    generateConnectionId,
    validateConnectionId,
  } = useUser();
  const styles = useStyles();

  // Form state
  const [connectionId, setConnectionId] = useState('');
  const [name, setName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<
    'idle' | 'checking' | 'valid' | 'invalid' | 'taken'
  >('idle');

  // ─── Connection ID Generation ───

  const handleGenerateId = async () => {
    setIsGenerating(true);
    const newId = await generateConnectionId();
    if (newId) {
      setConnectionId(newId);
      setValidationStatus('valid');
    }
    setIsGenerating(false);
  };

  // ─── Connection ID Validation ───

  useEffect(() => {
    if (!connectionId) {
      setValidationStatus('idle');
      return;
    }

    // Check format first
    if (!CONNECTION_ID_REGEX.test(connectionId)) {
      setValidationStatus('invalid');
      return;
    }

    // Debounce server validation
    const timeout = setTimeout(async () => {
      setValidationStatus('checking');
      const result = await validateConnectionId(connectionId);
      if (result) {
        if (!result.valid) {
          setValidationStatus('invalid');
        } else if (!result.available) {
          setValidationStatus('taken');
        } else {
          setValidationStatus('valid');
        }
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [connectionId, validateConnectionId]);

  // ─── Form Submission ───

  const handleSubmit = async () => {
    if (validationStatus !== 'valid' || !name.trim()) {
      return;
    }

    await register(connectionId, name.trim());
  };

  // ─── Input Handlers ───

  const handleConnectionIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 3);
    setConnectionId(value);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Allow only alphanumeric characters
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, NAME_MAX_LENGTH);
    setName(value);
  };

  // ─── Validation Message ───

  const getValidationMessage = () => {
    switch (validationStatus) {
      case 'invalid':
        return ERROR_MESSAGES.INVALID_CONNECTION_ID;
      case 'taken':
        return ERROR_MESSAGES.CONNECTION_ID_TAKEN;
      case 'checking':
        return 'Checking availability...';
      case 'valid':
        return 'Available!';
      default:
        return null;
    }
  };

  const getValidateStatus = () => {
    if (validationStatus === 'valid') return 'success';
    if (validationStatus === 'invalid' || validationStatus === 'taken') return 'error';
    if (validationStatus === 'checking') return 'validating';
    return undefined;
  };

  // ─── Name Validation ───

  const getNameValidationStatus = () => {
    if (!name) return undefined;
    if (name.length < NAME_MIN_LENGTH) return 'error';
    if (!NAME_REGEX.test(name)) return 'error';
    return 'success';
  };

  const getNameValidationMessage = () => {
    if (!name) return undefined;
    if (name.length < NAME_MIN_LENGTH) return ERROR_MESSAGES.NAME_TOO_SHORT;
    if (name.length === NAME_MAX_LENGTH) return <Text type="warning">Maximum length reached</Text>;
    if (!NAME_REGEX.test(name)) return ERROR_MESSAGES.NAME_INVALID;
    return undefined;
  };

  const validationMessage = getValidationMessage();
  const nameValidationStatus = getNameValidationStatus();
  const isNameValid = name.length >= NAME_MIN_LENGTH && NAME_REGEX.test(name);
  const isFormValid = validationStatus === 'valid' && isNameValid;
  const isSubmitting = isRegistering || isGenerating;

  // ─── Render ───

  return (
    <Card>
      <Form layout="vertical" onFinish={handleSubmit}>
        <Title level={3} style={styles.title}>
          {UI_LABELS.APP_TITLE}
        </Title>

        {/* Name Field */}
        <Form.Item
          label={UI_LABELS.ENTER_NAME}
          validateStatus={nameValidationStatus}
          help={getNameValidationMessage()}
        >
          <Input
            value={name}
            onChange={handleNameChange}
            placeholder="Your name"
            maxLength={NAME_MAX_LENGTH}
            disabled={isSubmitting}
          />
        </Form.Item>

        {/* Connection ID Field */}
        <Form.Item
          label={UI_LABELS.YOUR_CONNECTION_ID}
          validateStatus={getValidateStatus()}
          help={validationMessage}
        >
          <Flex gap={12}>
            <Input
              value={connectionId}
              onChange={handleConnectionIdChange}
              placeholder="Enter connection Id"
              maxLength={3}
              disabled={isSubmitting}
              style={styles.connectionIdInput}
            />
            <Button
              onClick={handleGenerateId}
              disabled={isSubmitting}
              loading={isGenerating}
              style={styles.generateButton}
            >
              {UI_LABELS.GENERATE_ID}
            </Button>
          </Flex>
        </Form.Item>

        {/* Registration Error */}
        {registrationError && (
          <Form.Item>
            <Alert type="error" message={registrationError} showIcon />
          </Form.Item>
        )}

        {/* Submit Button */}
        <Form.Item style={styles.submitItem}>
          <Button
            type="primary"
            htmlType="submit"
            block
            disabled={!isFormValid}
            loading={isRegistering}
          >
            {UI_LABELS.REGISTER}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
