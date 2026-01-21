import { useState, type KeyboardEvent, type ReactElement } from 'react';
import { Button, Input, Row, Col } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { UI_LABELS } from '../../../constants/messages';

const { TextArea } = Input;

// ─── Props ───

type MessageInputProps = {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
};

// ─── Component ───

export const MessageInput = ({ onSendMessage, disabled = false }: MessageInputProps): ReactElement => {
  const [message, setMessage] = useState('');

  const handleSubmit = (): void => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || disabled) {
      return;
    }

    onSendMessage(trimmedMessage);
    setMessage('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isButtonDisabled = disabled || !message.trim();

  return (
    <Row gutter={[8, 8]} align="bottom">
      <Col flex="auto">
        <TextArea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={UI_LABELS.TYPE_MESSAGE}
          disabled={disabled}
          autoSize={{ minRows: 1, maxRows: 4 }}
          autoFocus
        />
      </Col>
      <Col flex="none">
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSubmit}
          disabled={isButtonDisabled}
          aria-label={UI_LABELS.SEND}
        >
          {UI_LABELS.SEND}
        </Button>
      </Col>
    </Row>
  );
};
