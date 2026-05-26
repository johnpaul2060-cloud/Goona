import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView,
  ScrollView, KeyboardAvoidingView, Platform, StyleSheet, Dimensions,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import Svg, { Path, Circle, Ellipse, Rect, Line } from 'react-native-svg';
import { ArrowLeft, Sprout } from 'lucide-react-native';
import GoonaIcon from '../components/ui/GoonaIcon';
import CountryPicker from 'react-native-country-picker-modal';

const STATES_DATA: Record<string, { label: string; value: string }[]> = {
  NG: [
    { label: 'Lagos', value: 'Lagos' },
    { label: 'Oyo', value: 'Oyo' },
    { label: 'Kaduna', value: 'Kaduna' },
    { label: 'Kano', value: 'Kano' },
    { label: 'Rivers', value: 'Rivers' },
    { label: 'Abuja FCT', value: 'Abuja FCT' },
    { label: 'Ogun', value: 'Ogun' },
    { label: 'Kwara', value: 'Kwara' },
    { label: 'Plateau', value: 'Plateau' },
    { label: 'Enugu', value: 'Enugu' },
    { label: 'Edo', value: 'Edo' },
    { label: 'Delta', value: 'Delta' },
    { label: 'Nasarawa', value: 'Nasarawa' },
    { label: 'Benue', value: 'Benue' },
    { label: 'Kogi', value: 'Kogi' },
    { label: 'Niger', value: 'Niger' },
    { label: 'Sokoto', value: 'Sokoto' },
    { label: 'Katsina', value: 'Katsina' },
    { label: 'Borno', value: 'Borno' },
    { label: 'Yobe', value: 'Yobe' },
    { label: 'Adamawa', value: 'Adamawa' },
    { label: 'Taraba', value: 'Taraba' },
    { label: 'Bauchi', value: 'Bauchi' },
    { label: 'Gombe', value: 'Gombe' },
    { label: 'Jigawa', value: 'Jigawa' },
    { label: 'Zamfara', value: 'Zamfara' },
    { label: 'Kebbi', value: 'Kebbi' },
    { label: 'Cross River', value: 'Cross River' },
    { label: 'Akwa Ibom', value: 'Akwa Ibom' },
    { label: 'Bayelsa', value: 'Bayelsa' },
    { label: 'Anambra', value: 'Anambra' },
    { label: 'Abia', value: 'Abia' },
    { label: 'Imo', value: 'Imo' },
    { label: 'Ebonyi', value: 'Ebonyi' },
    { label: 'Ekiti', value: 'Ekiti' },
    { label: 'Ondo', value: 'Ondo' },
    { label: 'Osun', value: 'Osun' },
  ],
  US: [
    { label: 'Alabama', value: 'Alabama' },
    { label: 'Alaska', value: 'Alaska' },
    { label: 'Arizona', value: 'Arizona' },
    { label: 'Arkansas', value: 'Arkansas' },
    { label: 'California', value: 'California' },
    { label: 'Colorado', value: 'Colorado' },
    { label: 'Connecticut', value: 'Connecticut' },
    { label: 'Delaware', value: 'Delaware' },
    { label: 'Florida', value: 'Florida' },
    { label: 'Georgia', value: 'Georgia' },
    { label: 'Hawaii', value: 'Hawaii' },
    { label: 'Idaho', value: 'Idaho' },
    { label: 'Illinois', value: 'Illinois' },
    { label: 'Indiana', value: 'Indiana' },
    { label: 'Iowa', value: 'Iowa' },
    { label: 'Kansas', value: 'Kansas' },
    { label: 'Kentucky', value: 'Kentucky' },
    { label: 'Louisiana', value: 'Louisiana' },
    { label: 'Maine', value: 'Maine' },
    { label: 'Maryland', value: 'Maryland' },
    { label: 'Massachusetts', value: 'Massachusetts' },
    { label: 'Michigan', value: 'Michigan' },
    { label: 'Minnesota', value: 'Minnesota' },
    { label: 'Mississippi', value: 'Mississippi' },
    { label: 'Missouri', value: 'Missouri' },
    { label: 'Montana', value: 'Montana' },
    { label: 'Nebraska', value: 'Nebraska' },
    { label: 'Nevada', value: 'Nevada' },
    { label: 'New Hampshire', value: 'New Hampshire' },
    { label: 'New Jersey', value: 'New Jersey' },
    { label: 'New Mexico', value: 'New Mexico' },
    { label: 'New York', value: 'New York' },
    { label: 'North Carolina', value: 'North Carolina' },
    { label: 'North Dakota', value: 'North Dakota' },
    { label: 'Ohio', value: 'Ohio' },
    { label: 'Oklahoma', value: 'Oklahoma' },
    { label: 'Oregon', value: 'Oregon' },
    { label: 'Pennsylvania', value: 'Pennsylvania' },
    { label: 'Rhode Island', value: 'Rhode Island' },
    { label: 'South Carolina', value: 'South Carolina' },
    { label: 'South Dakota', value: 'South Dakota' },
    { label: 'Tennessee', value: 'Tennessee' },
    { label: 'Texas', value: 'Texas' },
    { label: 'Utah', value: 'Utah' },
    { label: 'Vermont', value: 'Vermont' },
    { label: 'Virginia', value: 'Virginia' },
    { label: 'Washington', value: 'Washington' },
    { label: 'West Virginia', value: 'West Virginia' },
    { label: 'Wisconsin', value: 'Wisconsin' },
    { label: 'Wyoming', value: 'Wyoming' },
  ],
  GB: [
    { label: 'England', value: 'England' },
    { label: 'Scotland', value: 'Scotland' },
    { label: 'Wales', value: 'Wales' },
    { label: 'Northern Ireland', value: 'Northern Ireland' },
  ],
  CA: [
    { label: 'Alberta', value: 'Alberta' },
    { label: 'British Columbia', value: 'British Columbia' },
    { label: 'Manitoba', value: 'Manitoba' },
    { label: 'New Brunswick', value: 'New Brunswick' },
    { label: 'Newfoundland & Labrador', value: 'Newfoundland & Labrador' },
    { label: 'Nova Scotia', value: 'Nova Scotia' },
    { label: 'Ontario', value: 'Ontario' },
    { label: 'Prince Edward Island', value: 'Prince Edward Island' },
    { label: 'Quebec', value: 'Quebec' },
    { label: 'Saskatchewan', value: 'Saskatchewan' },
  ],
  AU: [
    { label: 'New South Wales', value: 'New South Wales' },
    { label: 'Queensland', value: 'Queensland' },
    { label: 'South Australia', value: 'South Australia' },
    { label: 'Tasmania', value: 'Tasmania' },
    { label: 'Victoria', value: 'Victoria' },
    { label: 'Western Australia', value: 'Western Australia' },
  ],
  GH: [
    { label: 'Greater Accra', value: 'Greater Accra' },
    { label: 'Ashanti', value: 'Ashanti' },
    { label: 'Western', value: 'Western' },
    { label: 'Eastern', value: 'Eastern' },
    { label: 'Central', value: 'Central' },
    { label: 'Northern', value: 'Northern' },
    { label: 'Volta', value: 'Volta' },
    { label: 'Upper East', value: 'Upper East' },
    { label: 'Upper West', value: 'Upper West' },
    { label: 'Brong-Ahafo', value: 'Brong-Ahafo' },
  ],
  KE: [
    { label: 'Nairobi', value: 'Nairobi' },
    { label: 'Central', value: 'Central' },
    { label: 'Coast', value: 'Coast' },
    { label: 'Eastern', value: 'Eastern' },
    { label: 'North Eastern', value: 'North Eastern' },
    { label: 'Nyanza', value: 'Nyanza' },
    { label: 'Rift Valley', value: 'Rift Valley' },
    { label: 'Western', value: 'Western' },
  ],
  ZA: [
    { label: 'Eastern Cape', value: 'Eastern Cape' },
    { label: 'Free State', value: 'Free State' },
    { label: 'Gauteng', value: 'Gauteng' },
    { label: 'KwaZulu-Natal', value: 'KwaZulu-Natal' },
    { label: 'Limpopo', value: 'Limpopo' },
    { label: 'Mpumalanga', value: 'Mpumalanga' },
    { label: 'Northern Cape', value: 'Northern Cape' },
    { label: 'North West', value: 'North West' },
    { label: 'Western Cape', value: 'Western Cape' },
  ],
  IN: [
    { label: 'Andhra Pradesh', value: 'Andhra Pradesh' },
    { label: 'Assam', value: 'Assam' },
    { label: 'Bihar', value: 'Bihar' },
    { label: 'Gujarat', value: 'Gujarat' },
    { label: 'Haryana', value: 'Haryana' },
    { label: 'Karnataka', value: 'Karnataka' },
    { label: 'Madhya Pradesh', value: 'Madhya Pradesh' },
    { label: 'Maharashtra', value: 'Maharashtra' },
    { label: 'Punjab', value: 'Punjab' },
    { label: 'Rajasthan', value: 'Rajasthan' },
    { label: 'Tamil Nadu', value: 'Tamil Nadu' },
    { label: 'Uttar Pradesh', value: 'Uttar Pradesh' },
    { label: 'West Bengal', value: 'West Bengal' },
  ],
};

const LIVESTOCK_TYPES = [
  { id: 'poultry', label: 'Poultry', sub: 'Broilers, layers & hatchery', icon: '🐔' },
  { id: 'fish', label: 'Fish Farm', sub: 'Aquaculture operations', icon: '🐟' },
  { id: 'goat', label: 'Goat/Sheep', sub: 'Small ruminant farming', icon: '🐐' },
  { id: 'piggery', label: 'Piggery', sub: 'Pig breeding & management', icon: '🐷' },
  { id: 'rabbit', label: 'Rabbit Farm', sub: 'Compact livestock production', icon: '🐰' },
  { id: 'mixed', label: 'Mixed Farming', sub: 'Multiple livestock systems', icon: '🌿' },
];

const SIZE_OPTIONS = [
  { id: 'small', label: 'Small Scale', sub: 'Starter operation', icon: '🌱' },
  { id: 'medium', label: 'Medium Scale', sub: 'Growing farm', icon: '🌿' },
  { id: 'commercial', label: 'Commercial', sub: 'Large-scale production', icon: '🌳' },
];
const GOAL_OPTIONS = ['Egg Production', 'Meat Production', 'Breeding', 'Commercial Sales', 'Mixed Production'];



export default function FarmSetupScreen() {
  const [farmName, setFarmName] = useState('');
  const [countryCode, setCountryCode] = useState('NG');
  const [countryName, setCountryName] = useState('Nigeria');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [regionOpen, setRegionOpen] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');
  const [selectedType, setSelectedType] = useState('poultry');
  const [selectedSize, setSelectedSize] = useState('medium');
  const [workerCount, setWorkerCount] = useState(8);
  const [goalOpen, setGoalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState('Egg Production');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.blob} pointerEvents="none" />
      <View style={styles.contour1} pointerEvents="none" />
      <View style={styles.contour2} pointerEvents="none" />
      <View style={styles.dotGrid} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topNav}>
            <TouchableOpacity style={styles.navBack} onPress={() => router.back()}>
              <GoonaIcon icon={ArrowLeft} size={24} color="#1B1B1B" />
            </TouchableOpacity>
            <View style={styles.navLogo}>
              <GoonaIcon icon={Sprout} size={18} color="#2E7D32" />
              <Text style={styles.navLogoText}>GOONA</Text>
            </View>
            <View style={styles.progressPill}>
              <Text style={styles.progressPillText}>Step 1 of Farm Setup</Text>
            </View>
          </View>

          <View style={styles.headerSection}>
            <Text style={styles.headerLabel}>FARM SETUP</Text>
            <Text style={styles.headerTitle}>Let's Set Up{"\n"}Your Farm</Text>
            <Text style={styles.headerSub}>
              Tell GOONA about your farm so we can personalize your management experience.
            </Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Farm Name</Text>
              <View style={styles.fieldWrap}>
                <View style={styles.fieldIco}>
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Path d="M3 17H17" stroke="#A0AEA1" strokeWidth="1.4" strokeLinecap="round" />
                    <Rect x="5" y="4" width="10" height="14" rx="2" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                    <Path d="M8 4V3C8 2 9 1 10 1C11 1 12 2 12 3V4" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                  </Svg>
                </View>
                <View style={styles.fieldInputWrap}>
                  <Text style={styles.fieldLbl}>Farm Name</Text>
                  <TextInput
                    style={styles.fieldInput}
                    value={farmName}
                    onChangeText={setFarmName}
                    placeholder="e.g. Green Valley Poultry"
                    placeholderTextColor="#A0AEA1"
                  />
                </View>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Farm Location</Text>

              <View style={styles.locBlock}>
                <Text style={styles.locFieldLabel}>Country</Text>
                <View style={styles.locSelector}>
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Path d="M10 3C7 3 5 5 5 8C5 12 10 17 10 17C10 17 15 12 15 8C15 5 13 3 10 3Z" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                    <Circle cx="10" cy="8" r="2" stroke="#A0AEA1" strokeWidth="1.2" fill="none" />
                  </Svg>
                  <View style={styles.locSelectorContent}>
                    <CountryPicker
                      countryCode={countryCode as any}
                      withFilter
                      withFlag
                      withEmoji
                      withCountryNameButton
                      withCallingCode={false}
                      withAlphaFilter
                      containerButtonStyle={styles.countryPickerBtn}
                      onSelect={(c) => {
                        setCountryCode(c.cca2);
                        setCountryName(typeof c.name === 'string' ? c.name : c.cca2);
                        setSelectedRegion('');
                      }}
                    />
                  </View>
                  <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <Path d="M3 4.5L6 7.5L9 4.5" stroke="#A0AEA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
              </View>

              <View style={styles.locBlock}>
                <Text style={styles.locFieldLabel}>State / Region</Text>
                <TouchableOpacity
                  style={styles.locSelector}
                  activeOpacity={0.7}
                  onPress={() => setRegionOpen(true)}
                >
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Rect x="3" y="3" width="14" height="14" rx="2" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                    <Line x1="3" y1="8" x2="17" y2="8" stroke="#A0AEA1" strokeWidth="1.4" />
                    <Line x1="10" y1="8" x2="10" y2="17" stroke="#A0AEA1" strokeWidth="1.4" />
                  </Svg>
                  <Text style={[styles.locSelectorText, !selectedRegion && { color: '#A0AEA1' }]} numberOfLines={1}>
                    {selectedRegion || 'Select state or region'}
                  </Text>
                  <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <Path d="M3 4.5L6 7.5L9 4.5" stroke="#A0AEA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </TouchableOpacity>
              </View>

              <Modal
                visible={regionOpen}
                transparent
                animationType="slide"
                onRequestClose={() => setRegionOpen(false)}
              >
                <View style={styles.regionOverlay}>
                  <View style={styles.regionSheet}>
                    <View style={styles.regionHandle} />
                    <View style={styles.regionHeader}>
                      <Text style={styles.regionTitle}>Select State / Region</Text>
                      <TouchableOpacity onPress={() => setRegionOpen(false)} style={styles.regionClose}>
                        <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <Path d="M5 5L15 15M15 5L5 15" stroke="#1B1B1B" strokeWidth="1.5" strokeLinecap="round" />
                        </Svg>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.regionSearchWrap}>
                      <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <Circle cx="7" cy="7" r="4.5" stroke="#A0AEA1" strokeWidth="1.5" fill="none" />
                        <Path d="M10.5 10.5L14 14" stroke="#A0AEA1" strokeWidth="1.5" strokeLinecap="round" />
                      </Svg>
                      <TextInput
                        style={styles.regionSearchInput}
                        placeholder="Search regions..."
                        placeholderTextColor="#A0AEA1"
                        value={regionSearch}
                        onChangeText={setRegionSearch}
                        autoFocus
                      />
                    </View>
                    <ScrollView
                      style={styles.regionList}
                      showsVerticalScrollIndicator={false}
                      keyboardShouldPersistTaps="handled"
                    >
                      {(STATES_DATA[countryCode] || [])
                        .filter((r) => !regionSearch || r.label.toLowerCase().includes(regionSearch.toLowerCase()))
                        .map((r) => (
                          <TouchableOpacity
                            key={r.value}
                            style={[styles.regionItem, selectedRegion === r.value && styles.regionItemSelected]}
                            onPress={() => {
                              setSelectedRegion(r.value);
                              setRegionOpen(false);
                              setRegionSearch('');
                            }}
                          >
                            <Text style={[styles.regionItemText, selectedRegion === r.value && styles.regionItemTextSelected]}>
                              {r.label}
                            </Text>
                            {selectedRegion === r.value && (
                              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <Path d="M3 8L7 12L13 4" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </Svg>
                            )}
                          </TouchableOpacity>
                        ))}
                      {(!STATES_DATA[countryCode] || STATES_DATA[countryCode].length === 0) && (
                        <Text style={styles.regionEmpty}>No regions available for this country</Text>
                      )}
                    </ScrollView>
                  </View>
                </View>
              </Modal>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>What kind of livestock do you manage?</Text>
              <View style={styles.typeGrid}>
                {LIVESTOCK_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typeCard, selectedType === t.id && styles.typeCardSelected]}
                    onPress={() => setSelectedType(t.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.typeIconWrap, selectedType === t.id && styles.typeIconWrapSelected]}>
                      <Text style={[styles.typeIcon, selectedType === t.id && styles.typeIconSelected]}>{t.icon}</Text>
                    </View>
                    <Text style={[styles.typeName, selectedType === t.id && styles.typeNameSelected]}>{t.label}</Text>
                    <Text style={[styles.typeSub, selectedType === t.id && styles.typeSubSelected]}>{t.sub}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Farm Size</Text>
              <View style={styles.sizeRow}>
                {SIZE_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={[styles.sizeCard, selectedSize === s.id && styles.sizeCardSelected]}
                    onPress={() => setSelectedSize(s.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.sizeIcon}>{s.icon}</Text>
                    <Text style={[styles.sizeCardLabel, selectedSize === s.id && styles.sizeCardLabelSelected]}
                      numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.85}>
                      {s.label}
                    </Text>
                    <Text style={[styles.sizeCardSub, selectedSize === s.id && styles.sizeCardSubSelected]}>
                      {s.sub}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Number of Workers</Text>
              <View style={styles.stepperWrap}>
                <View style={styles.fieldIco}>
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Circle cx="10" cy="7" r="3" stroke="#A0AEA1" strokeWidth="1.4" fill="none" />
                    <Path d="M4 16C4 13.5 6.5 12 10 12C13.5 12 16 13.5 16 16" stroke="#A0AEA1" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                  </Svg>
                </View>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setWorkerCount(Math.max(1, workerCount - 1))}
                >
                  <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperVal}>{workerCount}</Text>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setWorkerCount(Math.min(99, workerCount + 1))}
                >
                  <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.formLabel}>What is your main goal?</Text>
              <TouchableOpacity
                style={styles.fieldWrap}
                activeOpacity={1}
                onPress={() => setGoalOpen(!goalOpen)}
              >
                <View style={styles.fieldIco}>
                  <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <Path d="M3 8L10 14L17 8" stroke="#A0AEA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
                <View style={styles.fieldInputWrap}>
                  <Text style={styles.fieldLbl}>Production Goal</Text>
                  <Text style={[styles.fieldInput, !selectedGoal && { color: '#A0AEA1' }]}>
                    {selectedGoal || 'Select your main goal'}
                  </Text>
                </View>
                <View style={styles.fieldRight}>
                  <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <Path d="M4 6L8 10L12 6" stroke="#A0AEA1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </Svg>
                </View>
              </TouchableOpacity>
              {goalOpen && (
                <View style={styles.dropdownMenu}>
                  {GOAL_OPTIONS.map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.dropdownItem, selectedGoal === g && styles.dropdownItemSelected]}
                      onPress={() => { setSelectedGoal(g); setGoalOpen(false); }}
                    >
                      <Text style={[styles.dropdownItemText, selectedGoal === g && styles.dropdownItemTextSelected]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                  <Path d="M11 3L9 8L4 9.5L9 11L11 16L13 11L18 9.5L13 8L11 3Z" fill="#F9A825" fillOpacity="0.2" stroke="#F9A825" strokeWidth="1.3" strokeLinejoin="round" />
                </Svg>
              </View>
              <Text style={styles.insightText}>
                GOONA will help you track production, monitor farm performance, and prepare financially for your next cycle.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.95}
            onPress={() => router.push('/farm-structure')}
          >
            <Text style={styles.continueBtnText}>Continue to Dashboard Setup</Text>
            <Svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <Path d="M4 10H16" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              <Path d="M11 5L16 10L11 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>

          <Text style={styles.footerNote}>You can update your farm information anytime.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAF7' },
  flex: { flex: 1 },
  scrollInner: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 },
  blob: {
    position: 'absolute', top: -50, right: -50, width: 320, height: 320,
    borderRadius: 160, backgroundColor: 'rgba(232,245,233,0.45)', zIndex: 0,
  },
  contour1: {
    position: 'absolute', width: 380, height: 130, top: '10%', right: '-15%',
    borderWidth: 1, borderColor: '#2E7D32', borderBottomWidth: 0,
    borderTopLeftRadius: 190, borderTopRightRadius: 190, opacity: 0.04,
    transform: [{ rotate: '10deg' }], zIndex: 0,
  },
  contour2: {
    position: 'absolute', width: 300, height: 100, bottom: '20%', left: '-10%',
    borderWidth: 1, borderColor: '#2E7D32', borderTopWidth: 0,
    borderBottomLeftRadius: 150, borderBottomRightRadius: 150, opacity: 0.04,
    transform: [{ rotate: '-8deg' }], zIndex: 0,
  },
  dotGrid: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    opacity: 0.03, zIndex: 0,
  },
  topNav: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 10, zIndex: 5,
  },
  navBack: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  navLogo: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  navLogoText: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  progressPill: {
    backgroundColor: '#E8F5E9', borderRadius: 100, paddingVertical: 5, paddingHorizontal: 12,
  },
  progressPillText: { fontSize: 11, fontWeight: '600', color: '#2E7D32' },
  headerSection: { marginTop: 24, zIndex: 5 },
  headerLabel: {
    fontSize: 11, fontWeight: '600', color: '#2E7D32', letterSpacing: 2, textTransform: 'uppercase',
  },
  headerTitle: { fontSize: 34, fontWeight: '800', lineHeight: 42, color: '#1B1B1B', marginTop: 6 },
  headerSub: { fontSize: 15, lineHeight: 24, color: '#616161', marginTop: 8, maxWidth: 330 },
  formCard: {
    backgroundColor: 'white', borderRadius: 30, padding: 24,
    marginTop: 22, zIndex: 100, position: 'relative',
    shadowColor: '#000', shadowOffset: { width: 0, height: 15 }, shadowOpacity: 0.06, shadowRadius: 40, elevation: 4,
  },
  formSection: { marginBottom: 20 },
  formLabel: { fontSize: 14, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  fieldWrap: {
    flexDirection: 'row', alignItems: 'center', height: 58, borderRadius: 16,
    backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 16, gap: 12,
  },
  fieldIco: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  fieldInputWrap: { flex: 1, justifyContent: 'center', minWidth: 0 },
  fieldLbl: { fontSize: 10, fontWeight: '500', color: '#A0AEA1', marginBottom: 1 },
  fieldInput: { fontSize: 15, fontWeight: '500', color: '#1B1B1B', padding: 0, margin: 0 },
  fieldRight: { flexShrink: 0, padding: 4 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  typeCard: {
    width: '47%', borderRadius: 24,
    backgroundColor: 'white', paddingVertical: 18, paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  typeCardSelected: {
    backgroundColor: '#2E7D32',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 24, elevation: 8,
  },
  typeIconWrap: {
    width: 48, height: 48, borderRadius: 20,
    backgroundColor: '#F0FDF4', alignItems: 'center', justifyContent: 'center',
    marginBottom: 10,
  },
  typeIconWrapSelected: { backgroundColor: 'rgba(255,255,255,0.2)' },
  typeIcon: { fontSize: 22 },
  typeIconSelected: { },
  typeName: { fontSize: 14, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
  typeNameSelected: { color: 'white' },
  typeSub: { fontSize: 11, color: '#9CA3AF', marginTop: 3, textAlign: 'center', lineHeight: 14 },
  typeSubSelected: { color: 'rgba(255,255,255,0.8)' },
  sizeRow: { flexDirection: 'row', gap: 10 },
  sizeCard: {
    flex: 1, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 8,
    backgroundColor: 'white', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  sizeCardSelected: {
    backgroundColor: '#2E7D32',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
  },
  sizeIcon: { fontSize: 18, marginBottom: 4 },
  sizeCardLabel: { fontSize: 11.5, fontWeight: '700', color: '#1F2937', lineHeight: 15, textAlign: 'center' },
  sizeCardLabelSelected: { color: 'white' },
  sizeCardSub: { fontSize: 9, color: '#9CA3AF', marginTop: 2, lineHeight: 12, textAlign: 'center' },
  sizeCardSubSelected: { color: 'rgba(255,255,255,0.8)' },
  stepperWrap: {
    flexDirection: 'row', alignItems: 'center', height: 58, borderRadius: 16,
    backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 6, gap: 6,
  },
  stepperBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  stepperBtnText: { fontSize: 20, fontWeight: '500', color: '#1B1B1B' },
  stepperVal: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '700', color: '#1B1B1B' },
  dropdownMenu: {
    backgroundColor: 'white', borderRadius: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.12, shadowRadius: 40, elevation: 8,
    borderWidth: 1, borderColor: '#E2E8F0', marginTop: 4, overflow: 'hidden',
  },
  dropdownItem: { paddingVertical: 14, paddingHorizontal: 18 },
  dropdownItemSelected: { backgroundColor: '#F0FDF4' },
  dropdownItemText: { fontSize: 14, fontWeight: '500', color: '#1F2937' },
  dropdownItemTextSelected: { color: '#2E7D32' },
  insightCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#E8F5E9', borderRadius: 22, padding: 18, marginTop: 16,
  },
  insightIcon: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: 'white',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  insightText: { fontSize: 13, lineHeight: 20, color: '#1F2937', flex: 1 },
  continueBtn: {
    width: '100%', height: 58, borderRadius: 18,
    backgroundColor: '#2E7D32', flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 10, marginTop: 24,
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 30, elevation: 6, zIndex: 5,
  },
  continueBtnText: { fontSize: 16, fontWeight: '600', color: 'white' },
  footerNote: { textAlign: 'center', fontSize: 12, color: '#A0AEA1', marginTop: 12, zIndex: 5 },
  locBlock: { marginBottom: 16 },
  locFieldLabel: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8 },
  locSelector: {
    flexDirection: 'row', alignItems: 'center', height: 60, borderRadius: 16,
    backgroundColor: '#F8FAF7', borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingLeft: 16, paddingRight: 12, gap: 12,
  },
  locSelectorContent: { flex: 1, minWidth: 0 },
  locSelectorText: { fontSize: 17, fontWeight: '600', color: '#1F2937', flex: 1 },
  countryPickerBtn: { justifyContent: 'center' },
  regionOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  regionSheet: {
    backgroundColor: 'white', borderTopLeftRadius: 30, borderTopRightRadius: 30,
    paddingHorizontal: 24, paddingBottom: 40, maxHeight: '75%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08, shadowRadius: 32, elevation: 16,
  },
  regionHandle: {
    width: 40, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0',
    alignSelf: 'center', marginTop: 12, marginBottom: 8,
  },
  regionHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 8, marginBottom: 16,
  },
  regionTitle: { fontSize: 18, fontWeight: '700', color: '#1B1B1B' },
  regionClose: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10 },
  regionSearchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F8FAF7', borderRadius: 14, paddingHorizontal: 14,
    height: 48, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12,
  },
  regionSearchInput: { flex: 1, fontSize: 15, color: '#1B1B1B', padding: 0, margin: 0 },
  regionList: { flexGrow: 0 },
  regionItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  regionItemSelected: { backgroundColor: '#F0FDF4', marginHorizontal: -8, paddingHorizontal: 12, borderRadius: 12 },
  regionItemText: { fontSize: 15, fontWeight: '500', color: '#1F2937' },
  regionItemTextSelected: { color: '#2E7D32', fontWeight: '600' },
  regionEmpty: { textAlign: 'center', color: '#9CA3AF', fontSize: 14, paddingVertical: 40 },
});
