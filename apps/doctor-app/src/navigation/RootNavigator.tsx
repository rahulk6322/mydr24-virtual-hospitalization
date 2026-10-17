import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/tokens';
import { useStore } from '../store/AppStore';
import type { RootStackParamList, TabParamList } from './types';

import LoginScreen from '../screens/auth/LoginScreen';
import DashboardScreen from '../screens/home/DashboardScreen';
import PatientListScreen from '../screens/patients/PatientListScreen';
import PatientChartScreen from '../screens/patients/PatientChartScreen';
import VitalsTrendsScreen from '../screens/patients/VitalsTrendsScreen';
import IcuMonitorScreen from '../screens/patients/IcuMonitorScreen';
import DeviceStatusScreen from '../screens/patients/DeviceStatusScreen';
import ResultsScreen from '../screens/patients/ResultsScreen';
import EligibilityScreen from '../screens/admission/EligibilityScreen';
import ConsentScreen from '../screens/admission/ConsentScreen';
import BaselineScreen from '../screens/admission/BaselineScreen';
import GoalsOfCareScreen from '../screens/admission/GoalsOfCareScreen';
import CareTeamScreen from '../screens/admission/CareTeamScreen';
import CarePlanScreen from '../screens/admission/CarePlanScreen';
import MedRecScreen from '../screens/orders/MedRecScreen';
import OrdersScreen from '../screens/orders/OrdersScreen';
import PrescriptionScreen from '../screens/orders/PrescriptionScreen';
import OvernightReviewScreen from '../screens/rounds/OvernightReviewScreen';
import TeleRoundScreen from '../screens/rounds/TeleRoundScreen';
import SoapNoteScreen from '../screens/rounds/SoapNoteScreen';
import AlertInboxScreen from '../screens/alerts/AlertInboxScreen';
import AlertDetailScreen from '../screens/alerts/AlertDetailScreen';
import EmergencyScreen from '../screens/alerts/EmergencyScreen';
import EscalationScreen from '../screens/alerts/EscalationScreen';
import HandoverScreen from '../screens/alerts/HandoverScreen';
import TransitionScreen from '../screens/alerts/TransitionScreen';
import ShiftHandoverScreen from '../screens/team/ShiftHandoverScreen';
import ChatScreen from '../screens/team/ChatScreen';
import FamilyUpdateScreen from '../screens/team/FamilyUpdateScreen';
import DischargeScreen from '../screens/discharge/DischargeScreen';
import AcuteQueueScreen from '../screens/acute/AcuteQueueScreen';
import AcuteTriageScreen from '../screens/acute/AcuteTriageScreen';
import AcuteWorkspaceScreen from '../screens/acute/AcuteWorkspaceScreen';
import AcuteClosureScreen from '../screens/acute/AcuteClosureScreen';
import ChronicReassessScreen from '../screens/chronic/ChronicReassessScreen';
import MoreScreen from '../screens/more/MoreScreen';
import ScreenCatalogueScreen from '../screens/more/ScreenCatalogueScreen';
import AuditLogScreen from '../screens/more/AuditLogScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, primary: colors.primary, background: colors.bg, card: colors.card, text: colors.text, border: colors.border } };

function Tabs() {
  const { openEvents } = useStore();
  const critical = openEvents.filter((e) => e.cls === 'E' || e.cls === 'U').length;
  const icons: Record<keyof TabParamList, React.ComponentProps<typeof Ionicons>['name']> = {
    Home: 'grid-outline', Patients: 'people-outline', Acute: 'flash-outline', Alerts: 'notifications-outline', More: 'menu-outline',
  };
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ color, size }) => <Ionicons name={icons[route.name]} size={size} color={color} />,
        headerTitleStyle: { fontWeight: '700' },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="Patients" component={PatientListScreen} options={{ title: 'Patients' }} />
      <Tab.Screen name="Acute" component={AcuteQueueScreen} options={{ title: 'Acute Care' }} />
      <Tab.Screen
        name="Alerts"
        component={AlertInboxScreen}
        options={{ title: 'Alerts', tabBarBadge: critical || undefined, tabBarBadgeStyle: { backgroundColor: colors.critical } }}
      />
      <Tab.Screen name="More" component={MoreScreen} options={{ title: 'More' }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { signedIn } = useStore();
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerTitleStyle: { fontWeight: '700' }, headerTintColor: colors.primary, headerBackTitle: 'Back' }}>
        {!signedIn ? (
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={Tabs} options={{ headerShown: false }} />
            <Stack.Screen name="PatientChart" component={PatientChartScreen} options={{ title: 'Patient Chart' }} />
            <Stack.Screen name="VitalsTrends" component={VitalsTrendsScreen} options={{ title: 'Vitals & Trends' }} />
            <Stack.Screen name="IcuMonitor" component={IcuMonitorScreen} options={{ title: 'ICU Monitoring' }} />
            <Stack.Screen name="DeviceStatus" component={DeviceStatusScreen} options={{ title: 'Devices & Connectivity' }} />
            <Stack.Screen name="Results" component={ResultsScreen} options={{ title: 'Results' }} />
            <Stack.Screen name="Eligibility" component={EligibilityScreen} options={{ title: 'Admission Eligibility' }} />
            <Stack.Screen name="Consent" component={ConsentScreen} options={{ title: 'Consent Review' }} />
            <Stack.Screen name="Baseline" component={BaselineScreen} options={{ title: 'Baseline Assessment' }} />
            <Stack.Screen name="GoalsOfCare" component={GoalsOfCareScreen} options={{ title: 'Goals of Care' }} />
            <Stack.Screen name="CareTeam" component={CareTeamScreen} options={{ title: 'Care Team' }} />
            <Stack.Screen name="CarePlan" component={CarePlanScreen} options={{ title: 'Initial Care Plan' }} />
            <Stack.Screen name="MedRec" component={MedRecScreen} options={{ title: 'Medication Reconciliation' }} />
            <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Order Entry (CPOE)' }} />
            <Stack.Screen name="Prescription" component={PrescriptionScreen} options={{ title: 'e-Prescription & MAR' }} />
            <Stack.Screen name="OvernightReview" component={OvernightReviewScreen} options={{ title: 'Since Last Seen' }} />
            <Stack.Screen name="TeleRound" component={TeleRoundScreen} options={{ title: 'Tele-Round', headerShown: false }} />
            <Stack.Screen name="SoapNote" component={SoapNoteScreen} options={{ title: 'Clinical Note' }} />
            <Stack.Screen name="AlertDetail" component={AlertDetailScreen} options={{ title: 'Alert Detail' }} />
            <Stack.Screen name="Emergency" component={EmergencyScreen} options={{ title: 'Live Emergency', headerStyle: { backgroundColor: colors.critical }, headerTintColor: colors.white }} />
            <Stack.Screen name="Escalation" component={EscalationScreen} options={{ title: 'Escalation Decision' }} />
            <Stack.Screen name="Handover" component={HandoverScreen} options={{ title: 'Hospital Handover' }} />
            <Stack.Screen name="Transition" component={TransitionScreen} options={{ title: 'Pathway Transition' }} />
            <Stack.Screen name="ShiftHandover" component={ShiftHandoverScreen} options={{ title: 'Shift Handover (I-PASS)' }} />
            <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Care-Team Chat' }} />
            <Stack.Screen name="FamilyUpdate" component={FamilyUpdateScreen} options={{ title: 'Family Update' }} />
            <Stack.Screen name="Discharge" component={DischargeScreen} options={{ title: 'Discharge' }} />
            <Stack.Screen name="AcuteTriage" component={AcuteTriageScreen} options={{ title: 'Red Flags & Triage' }} />
            <Stack.Screen name="AcuteWorkspace" component={AcuteWorkspaceScreen} options={{ title: 'Acute Consultation' }} />
            <Stack.Screen name="AcuteClosure" component={AcuteClosureScreen} options={{ title: 'Close / Escalate Episode' }} />
            <Stack.Screen name="ChronicReassess" component={ChronicReassessScreen} options={{ title: 'Chronic Reassessment' }} />
            <Stack.Screen name="ScreenCatalogue" component={ScreenCatalogueScreen} options={{ title: 'Screen Catalogue' }} />
            <Stack.Screen name="AuditLog" component={AuditLogScreen} options={{ title: 'Audit Log' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
