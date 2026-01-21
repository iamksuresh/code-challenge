import { ClientEvent, ServerEvent } from './events';
import {
  UserRegisterPayload,
  ChatRequestPayload,
  ChatResponsePayload,
  ChatMessagePayload,
  ChatLeavePayload,
  UserRegisteredPayload,
  ChatIncomingRequestPayload,
  ChatRequestResultPayload,
  ChatRequestCancelledPayload,
  ChatStartedPayload,
  ChatMessageReceivedPayload,
  ChatEndedPayload,
} from './payloads';

// ─── Payload Maps ───

// Maps Client events to their payload types
export interface ClientPayloadMap {
  [ClientEvent.USER_REGISTER]: UserRegisterPayload;
  [ClientEvent.CHAT_REQUEST]: ChatRequestPayload;
  [ClientEvent.CHAT_RESPONSE]: ChatResponsePayload;
  [ClientEvent.CHAT_MESSAGE]: ChatMessagePayload;
  [ClientEvent.CHAT_LEAVE]: ChatLeavePayload;
}

// Maps Server events to their payload types
export interface ServerPayloadMap {
  [ServerEvent.USER_REGISTERED]: UserRegisteredPayload;
  [ServerEvent.CHAT_INCOMING_REQUEST]: ChatIncomingRequestPayload;
  [ServerEvent.CHAT_REQUEST_RESULT]: ChatRequestResultPayload;
  [ServerEvent.CHAT_REQUEST_CANCELLED]: ChatRequestCancelledPayload;
  [ServerEvent.CHAT_STARTED]: ChatStartedPayload;
  [ServerEvent.CHAT_MESSAGE_RECEIVED]: ChatMessageReceivedPayload;
  [ServerEvent.CHAT_ENDED]: ChatEndedPayload;
}

// ─── Type Helpers ───

// Get payload type for a client event
export type ClientPayload<T extends ClientEvent> = ClientPayloadMap[T];

// Get payload type for a server event
export type ServerPayload<T extends ServerEvent> = ServerPayloadMap[T];

// ─── Typed Socket Interfaces (for type assertions) ───

// Typed interface for client socket (FE sends ClientEvents, receives ServerEvents)
export interface TypedClientSocket {
  emit<T extends ClientEvent>(event: T, payload: ClientPayloadMap[T]): void;
  on<T extends ServerEvent>(
    event: T,
    handler: (payload: ServerPayloadMap[T]) => void
  ): void;
  off<T extends ServerEvent>(
    event: T,
    handler?: (payload: ServerPayloadMap[T]) => void
  ): void;
  connected: boolean;
  connect(): void;
  disconnect(): void;
}

// Typed interface for server socket (BE sends ServerEvents, receives ClientEvents)
export interface TypedServerSocket {
  id: string;
  emit<T extends ServerEvent>(event: T, payload: ServerPayloadMap[T]): boolean;
  on<T extends ClientEvent>(
    event: T,
    handler: (payload: ClientPayloadMap[T]) => void
  ): void;
  off<T extends ClientEvent>(
    event: T,
    handler?: (payload: ClientPayloadMap[T]) => void
  ): void;
}

// ─── Helper Functions for Type-Safe Emit/On ───

// These can be used if you prefer helper functions over type assertions

import type { Socket as ClientSocketType } from 'socket.io-client';
import type { Socket as ServerSocketType, Server as IOServerType } from 'socket.io';

// Type-safe emit for client
export function emitClient<T extends ClientEvent>(
  socket: ClientSocketType,
  event: T,
  payload: ClientPayloadMap[T]
): void {
  socket.emit(event, payload);
}

// Type-safe on for client
export function onServer<T extends ServerEvent>(
  socket: ClientSocketType,
  event: T,
  handler: (payload: ServerPayloadMap[T]) => void
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket.on(event, handler as any);
}

// Type-safe emit for server
export function emitServer<T extends ServerEvent>(
  socket: ServerSocketType,
  event: T,
  payload: ServerPayloadMap[T]
): boolean {
  return socket.emit(event, payload);
}

// Type-safe on for server (listening to client events)
export function onClient<T extends ClientEvent>(
  socket: ServerSocketType,
  event: T,
  handler: (payload: ClientPayloadMap[T]) => void
): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  socket.on(event, handler as any);
}

// Type-safe emit to room
export function emitToRoom<T extends ServerEvent>(
  io: IOServerType,
  room: string,
  event: T,
  payload: ServerPayloadMap[T]
): boolean {
  return io.to(room).emit(event, payload);
}
