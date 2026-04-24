import './global.css';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from './src/store';
import { ThemeProvider } from './src/theme';
import { RootNavigator } from './src/navigation';
import { ToastHost } from './src/components/ToastHost';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <ThemeProvider>
            <AppProviders>
              <StatusBar style="auto" />
              <RootNavigator />
              <ToastHost />
            </AppProviders>
          </ThemeProvider>
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
