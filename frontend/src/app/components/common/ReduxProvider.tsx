'use client';

import { store } from '@/lib/redux/store';
import { Provider } from 'react-redux';
import ToastContainer from '@/app/components/common/toast/ToastContainer';

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      {children}
      <ToastContainer />
    </Provider>
  );
}
