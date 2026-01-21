import { type ReactElement } from 'react';
import { Routes as RouterRoutes, Route } from 'react-router';

import { Chat } from './Chat';
import { Home } from './Home';

export const AppRoutes = (): ReactElement => {
  return (
    <RouterRoutes>
      <Route path="/" element={<Home />} />
      <Route path="/chat/:userId" element={<Chat />} />
    </RouterRoutes>
  );
};
