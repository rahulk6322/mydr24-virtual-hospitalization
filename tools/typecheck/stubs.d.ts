/* Minimal ambient type stubs used ONLY to type-check the app's own wiring offline
 * (imports, route params, store actions, model fields). They are intentionally loose for
 * third-party component props. Real projects use the packages' bundled types. */

declare namespace React {
  type ReactNode = any;
  type ReactElement = any;
  type Key = string | number;
  type SetStateAction<S> = S | ((prev: S) => S);
  type Dispatch<A> = (value: A) => void;
  type ComponentProps<T> = T extends (props: infer P) => any ? P : never;
  interface Context<T> { Provider: (props: { value: T; children?: ReactNode }) => any }
  const Fragment: (props: { children?: ReactNode }) => any;
  function createElement(type: any, props?: any, ...children: any[]): any;
}

declare module 'react' {
  export = React;
  export as namespace React;
}
declare module 'react' {
  export function useState<S>(initial: S | (() => S)): [S, React.Dispatch<React.SetStateAction<S>>];
  export function useState<S = undefined>(): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useReducer<S, A>(reducer: (s: S, a: A) => S, initial: S): [S, React.Dispatch<A>];
  export function createContext<T>(value: T): React.Context<T>;
  export function useContext<T>(ctx: React.Context<T>): T;
  export const Fragment: typeof React.Fragment;
  export type ReactNode = React.ReactNode;
  export type ComponentProps<T> = React.ComponentProps<T>;
  export type Dispatch<A> = React.Dispatch<A>;
}

declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
}

declare namespace JSX {
  type Element = any;
  interface IntrinsicAttributes { key?: React.Key }
  interface ElementChildrenAttribute { children: {} }
  interface IntrinsicElements {}
}

declare module 'react-native' {
  type AnyComp = (props: any) => any;
  export type ViewStyle = any;
  export const View: AnyComp;
  export const Text: AnyComp;
  export const ScrollView: AnyComp;
  export const Pressable: (props: {
    style?: ((s: { pressed: boolean }) => unknown) | object | unknown[] | null;
    children?: any; onPress?: () => void; disabled?: boolean; hitSlop?: number; testID?: string;
    accessibilityRole?: string; accessibilityLabel?: string; accessibilityState?: object;
  }) => any;
  export const TextInput: AnyComp;
  export const ActivityIndicator: AnyComp;
  export const KeyboardAvoidingView: AnyComp;
  export const StyleSheet: { create<T>(styles: T): T };
  export const Platform: { OS: 'ios' | 'android' | 'web' };
  export const Linking: { openURL(url: string): Promise<void> };
}

declare module '@expo/vector-icons' {
  export const Ionicons: (props: { name: string; size?: number; color?: string; style?: any }) => any;
}

declare module 'expo' {
  export function registerRootComponent(c: any): void;
}
declare module 'expo-status-bar' {
  export const StatusBar: (props: { style?: 'dark' | 'light' | 'auto' }) => any;
}
declare module 'react-native-safe-area-context' {
  export const SafeAreaProvider: (props: { children?: any }) => any;
  export const SafeAreaView: (props: any) => any;
}

declare module '@react-navigation/native' {
  export type NavigatorScreenParams<T> = { [K in keyof T]: { screen: K; params?: T[K] } }[keyof T];
  export type RouteProp<P, K extends keyof P> = { key: string; name: K; params: P[K] };
  export function useNavigation<T>(): T;
  export function useRoute<T>(): T;
  export const NavigationContainer: (props: { theme?: any; children?: any }) => any;
  export const DefaultTheme: { dark: boolean; colors: { primary: string; background: string; card: string; text: string; border: string; notification: string } };
  export const CommonActions: { reset(state: { index: number; routes: { name: string; params?: object }[] }): any };
}

declare module '@react-navigation/native-stack' {
  type Args<P, K extends keyof P> = undefined extends P[K] ? [screen: K, params?: P[K]] : [screen: K, params: P[K]];
  export interface NativeStackNavigationProp<P> {
    navigate<K extends keyof P>(...args: Args<P, K>): void;
    replace<K extends keyof P>(...args: Args<P, K>): void;
    goBack(): void;
    dispatch(action: any): void;
  }
  export function createNativeStackNavigator<P>(): {
    Navigator: (props: { screenOptions?: any; children?: any }) => any;
    Screen: <K extends keyof P>(props: { name: K; component: (...a: any[]) => any; options?: any }) => any;
  };
}

declare module '@react-navigation/bottom-tabs' {
  export function createBottomTabNavigator<P>(): {
    Navigator: (props: { screenOptions?: (o: { route: { name: keyof P } }) => { tabBarIcon?: (p: { color: string; size: number }) => any; [k: string]: any }; children?: any }) => any;
    Screen: <K extends keyof P>(props: { name: K; component: (...a: any[]) => any; options?: any }) => any;
  };
}

declare function setInterval(cb: () => void, ms: number): number;
declare function clearInterval(id: number): void;
