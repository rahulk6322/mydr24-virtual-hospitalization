import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

export type RootNav = NativeStackNavigationProp<RootStackParamList>;

/** Typed root-stack navigation usable from any screen (including tab screens). */
export const useRootNav = () => useNavigation<RootNav>();

/** Typed route params for a given root-stack route. */
export function useParams<K extends keyof RootStackParamList>() {
  return useRoute<RouteProp<RootStackParamList, K>>().params;
}
