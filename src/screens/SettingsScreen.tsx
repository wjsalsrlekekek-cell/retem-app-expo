import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch, Modal,
  TextInput, StyleSheet, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ChevronLeft, Globe, Bell, Lock, FileText, Shield,
  Trash2, LogOut, ChevronRight, X, Eye, EyeOff,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'th', label: 'ภาษาไทย' },
  { code: 'tl', label: 'Filipino' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'uz', label: "O'zbek" },
];

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { showToast } = useToast();
  const navigation = useNavigation<any>();

  const [notifMessages, setNotifMessages] = useState(true);
  const [notifOffers, setNotifOffers] = useState(true);
  const [notifReviews, setNotifReviews] = useState(true);
  const [notifSystem, setNotifSystem] = useState(true);

  const [langModalVisible, setLangModalVisible] = useState(false);
  const [pwModalVisible, setPwModalVisible] = useState(false);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('retem_notif_settings');
        if (stored) {
          const s = JSON.parse(stored);
          setNotifMessages(s.messages ?? true);
          setNotifOffers(s.offers ?? true);
          setNotifReviews(s.reviews ?? true);
          setNotifSystem(s.system ?? true);
        }
      } catch {}
    })();
  }, []);

  const saveNotifSettings = async (key: string, val: boolean) => {
    const current = { messages: notifMessages, offers: notifOffers, reviews: notifReviews, system: notifSystem };
    const updated = { ...current, [key]: val };
    await AsyncStorage.setItem('retem_notif_settings', JSON.stringify(updated));
  };

  const handleToggle = (key: string, setter: (v: boolean) => void) => (val: boolean) => {
    setter(val);
    saveNotifSettings(key, val);
  };

  const handleChangePassword = () => {
    if (!currentPw || !newPw || !confirmPw) {
      showToast(t('error.fill_all_fields') || 'Please fill all fields', 'error');
      return;
    }
    if (newPw.length < 6) {
      showToast(t('error.password_min') || 'Password must be at least 6 characters', 'error');
      return;
    }
    if (newPw !== confirmPw) {
      showToast(t('error.password_mismatch') || 'Passwords do not match', 'error');
      return;
    }
    setPwModalVisible(false);
    setCurrentPw('');
    setNewPw('');
    setConfirmPw('');
    showToast(t('settings.password_changed') || 'Password changed successfully', 'success');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('settings.delete_account') || 'Delete Account',
      t('settings.delete_confirm') || 'Are you sure? This action cannot be undone.',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            await logout();
            showToast(t('settings.account_deleted') || 'Account deleted', 'info');
          },
        },
      ],
    );
  };

  const handleLogout = async () => {
    await logout();
    showToast(t('profile.logged_out') || 'Logged out', 'info');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Language */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('settings.account') || 'Account'}</Text>

        <TouchableOpacity style={styles.menuItem} onPress={() => setLangModalVisible(true)}>
          <Globe size={20} color="#4b5563" />
          <Text style={styles.menuLabel}>{t('settings.language') || 'Language'}</Text>
          <Text style={styles.menuValue}>{LANGUAGES.find(l => l.code === language)?.label}</Text>
          <ChevronRight size={18} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.menuBorder]} onPress={() => setPwModalVisible(true)}>
          <Lock size={20} color="#4b5563" />
          <Text style={styles.menuLabel}>{t('settings.change_password') || 'Change Password'}</Text>
          <ChevronRight size={18} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Privacy')}>
          <Shield size={20} color="#4b5563" />
          <Text style={styles.menuLabel}>{t('settings.privacy_policy') || 'Privacy Policy'}</Text>
          <ChevronRight size={18} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Terms')}>
          <FileText size={20} color="#4b5563" />
          <Text style={styles.menuLabel}>{t('settings.terms') || 'Terms of Service'}</Text>
          <ChevronRight size={18} color="#9ca3af" />
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('settings.notifications') || 'Notifications'}</Text>

        <View style={styles.toggleItem}>
          <Bell size={20} color="#4b5563" />
          <Text style={styles.menuLabel}>{t('settings.notif_messages') || 'Messages'}</Text>
          <Switch
            value={notifMessages}
            onValueChange={handleToggle('messages', setNotifMessages)}
            trackColor={{ true: '#10b981', false: '#d1d5db' }}
            thumbColor="#fff"
          />
        </View>

        <View style={[styles.toggleItem, styles.menuBorder]}>
          <Bell size={20} color="#4b5563" />
          <Text style={styles.menuLabel}>{t('settings.notif_offers') || 'Offers'}</Text>
          <Switch
            value={notifOffers}
            onValueChange={handleToggle('offers', setNotifOffers)}
            trackColor={{ true: '#10b981', false: '#d1d5db' }}
            thumbColor="#fff"
          />
        </View>

        <View style={[styles.toggleItem, styles.menuBorder]}>
          <Bell size={20} color="#4b5563" />
          <Text style={styles.menuLabel}>{t('settings.notif_reviews') || 'Reviews'}</Text>
          <Switch
            value={notifReviews}
            onValueChange={handleToggle('reviews', setNotifReviews)}
            trackColor={{ true: '#10b981', false: '#d1d5db' }}
            thumbColor="#fff"
          />
        </View>

        <View style={[styles.toggleItem, styles.menuBorder]}>
          <Bell size={20} color="#4b5563" />
          <Text style={styles.menuLabel}>{t('settings.notif_system') || 'System'}</Text>
          <Switch
            value={notifSystem}
            onValueChange={handleToggle('system', setNotifSystem)}
            trackColor={{ true: '#10b981', false: '#d1d5db' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Danger Zone */}
      <View style={styles.card}>
        <Text style={[styles.sectionTitle, { color: '#ef4444' }]}>{t('settings.danger_zone') || 'Danger Zone'}</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={[styles.menuLabel, { color: '#ef4444' }]}>{t('profile.logout') || 'Logout'}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.menuBorder]} onPress={handleDeleteAccount}>
          <Trash2 size={20} color="#ef4444" />
          <Text style={[styles.menuLabel, { color: '#ef4444' }]}>{t('settings.delete_account') || 'Delete Account'}</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />

      {/* Language Modal */}
      <Modal visible={langModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.language') || 'Language'}</Text>
              <TouchableOpacity onPress={() => setLangModalVisible(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {LANGUAGES.map(lang => (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langItem, language === lang.code && styles.langItemActive]}
                onPress={() => {
                  setLanguage(lang.code);
                  setLangModalVisible(false);
                  showToast(`${lang.label}`, 'success');
                }}
              >
                <Text style={[styles.langLabel, language === lang.code && styles.langLabelActive]}>
                  {lang.label}
                </Text>
                {language === lang.code && <View style={styles.langCheck} />}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
      <Modal visible={pwModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('settings.change_password') || 'Change Password'}</Text>
              <TouchableOpacity onPress={() => setPwModalVisible(false)}>
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('settings.current_password') || 'Current Password'}</Text>
            <View style={styles.pwRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={currentPw}
                onChangeText={setCurrentPw}
                secureTextEntry={!showCurrentPw}
                placeholder="••••••"
              />
              <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)} style={styles.eyeBtn}>
                {showCurrentPw ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('settings.new_password') || 'New Password'}</Text>
            <View style={styles.pwRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry={!showNewPw}
                placeholder="••••••"
              />
              <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)} style={styles.eyeBtn}>
                {showNewPw ? <EyeOff size={20} color="#9ca3af" /> : <Eye size={20} color="#9ca3af" />}
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>{t('settings.confirm_password') || 'Confirm Password'}</Text>
            <TextInput
              style={styles.input}
              value={confirmPw}
              onChangeText={setConfirmPw}
              secureTextEntry
              placeholder="••••••"
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleChangePassword}>
              <Text style={styles.saveBtnText}>{t('common.save') || 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  card: {
    backgroundColor: '#fff', borderRadius: 12, marginHorizontal: 16,
    marginTop: 16, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#6b7280', marginBottom: 12, textTransform: 'uppercase' },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, gap: 12 },
  menuBorder: { borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  menuLabel: { flex: 1, fontSize: 15, color: '#374151' },
  menuValue: { fontSize: 13, color: '#9ca3af', marginRight: 4 },
  toggleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  langItem: {
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10,
    flexDirection: 'row', alignItems: 'center', marginBottom: 4,
  },
  langItemActive: { backgroundColor: '#ecfdf5' },
  langLabel: { flex: 1, fontSize: 16, color: '#374151' },
  langLabelActive: { color: '#10b981', fontWeight: '600' },
  langCheck: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' },
  inputLabel: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 12, fontSize: 15, color: '#111827',
  },
  pwRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  eyeBtn: { padding: 8 },
  saveBtn: {
    backgroundColor: '#10b981', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 24,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
