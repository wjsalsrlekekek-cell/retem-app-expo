import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Mail, Lock, Eye, EyeOff, User, Check, X, ArrowLeft, ChevronDown } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import type { AuthStackParamList } from '../navigation/AppNavigator';

type SignupNav = NativeStackNavigationProp<AuthStackParamList, 'Signup'>;

interface LanguageOption {
  code: string;
  label: string;
}

const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English' },
  { code: 'ko', label: '한국어' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'th', label: 'ไทย' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'id', label: 'Bahasa Indonesia' },
];

export default function SignupScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [terms, setTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signup, loginWithGoogle } = useAuth();
  const { t, setLanguage } = useLanguage();
  const { showToast } = useToast();
  const navigation = useNavigation<SignupNav>();

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t('error.invalid_email');
    if (password.length < 6) e.password = t('error.password_short');
    if (password !== confirmPassword) e.confirmPassword = t('error.password_mismatch');
    if (!fullName.trim()) e.fullName = t('error.field_required');
    if (!terms) e.terms = t('error.terms_required');
    setErrors(e);
    setGeneralError(null);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const err = await signup(email, password, fullName);
      if (err) {
        setGeneralError(t(err) || 'Signup failed');
      } else {
        setLanguage(selectedLanguage);
        showToast(t('toast.signup_success'));
      }
    } catch {
      setGeneralError('Signup failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    setGeneralError(null);
    try {
      const err = await loginWithGoogle();
      if (err) {
        setGeneralError(t(err) || 'Google signup failed');
      } else {
        showToast(t('toast.signup_success'));
      }
    } catch {
      setGeneralError('Google signup failed');
    } finally {
      setGoogleLoading(false);
    }
  };

  const getInputBorderColor = (field: string): string => {
    return errors[field] ? '#ef4444' : '#e2e8f0';
  };

  const selectedLangLabel =
    LANGUAGES.find((l) => l.code === selectedLanguage)?.label ?? 'English';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>Re;Tem</Text>
          <Text style={styles.title}>{t('auth.signup.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.signup.subtitle')}</Text>
        </View>

        {/* General Error */}
        {generalError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{generalError}</Text>
          </View>
        ) : null}

        {/* Email */}
        <View style={[styles.inputWrapper, { borderColor: getInputBorderColor('email') }]}>
          <Mail size={18} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('auth.signup.email')}
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}

        {/* Password */}
        <View style={[styles.inputWrapper, { borderColor: getInputBorderColor('password') }]}>
          <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('auth.signup.password')}
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
            {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
          </TouchableOpacity>
        </View>
        {errors.password ? <Text style={styles.fieldError}>{errors.password}</Text> : null}

        {/* Confirm Password */}
        <View style={[styles.inputWrapper, { borderColor: getInputBorderColor('confirmPassword') }]}>
          <Lock size={18} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('auth.signup.confirm_password')}
            placeholderTextColor="#94a3b8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          {confirmPassword ? (
            <View style={styles.matchIcon}>
              {password === confirmPassword ? (
                <Check size={18} color="#10b981" />
              ) : (
                <X size={18} color="#ef4444" />
              )}
            </View>
          ) : null}
        </View>
        {errors.confirmPassword ? (
          <Text style={styles.fieldError}>{errors.confirmPassword}</Text>
        ) : null}

        {/* Full Name */}
        <View style={[styles.inputWrapper, { borderColor: getInputBorderColor('fullName') }]}>
          <User size={18} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder={t('auth.signup.full_name')}
            placeholderTextColor="#94a3b8"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
        </View>
        {errors.fullName ? <Text style={styles.fieldError}>{errors.fullName}</Text> : null}

        {/* Language Selector */}
        <TouchableOpacity
          style={styles.languageSelector}
          onPress={() => setShowLanguagePicker(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.languageSelectorLabel}>Language</Text>
          <View style={styles.languageSelectorValue}>
            <Text style={styles.languageSelectorText}>{selectedLangLabel}</Text>
            <ChevronDown size={16} color="#64748b" />
          </View>
        </TouchableOpacity>

        {/* Terms */}
        <TouchableOpacity
          style={styles.termsRow}
          onPress={() => setTerms(!terms)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, terms && styles.checkboxChecked]}>
            {terms ? <Check size={14} color="#ffffff" /> : null}
          </View>
          <Text style={styles.termsText}>{t('auth.signup.terms')}</Text>
        </TouchableOpacity>
        {errors.terms ? <Text style={styles.fieldError}>{errors.terms}</Text> : null}

        {/* Signup Button */}
        <TouchableOpacity
          style={[styles.primaryButton, loading && styles.buttonDisabled]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <Text style={styles.primaryButtonText}>{t('auth.signup.button')}</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>{t('auth.signup.or')}</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Signup */}
        <TouchableOpacity
          style={[styles.secondaryButton, googleLoading && styles.buttonDisabled]}
          onPress={handleGoogleSignup}
          disabled={googleLoading}
          activeOpacity={0.8}
        >
          {googleLoading ? (
            <ActivityIndicator color="#334155" size="small" />
          ) : (
            <>
              <Image
                source={{ uri: 'https://developers.google.com/identity/images/g-logo.png' }}
                style={styles.googleIcon}
              />
              <Text style={styles.secondaryButtonText}>{t('auth.signup.google')}</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Login Link */}
        <View style={styles.linkContainer}>
          <Text style={styles.linkText}>{t('auth.signup.have_account')} </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkAction}>{t('auth.signup.sign_in')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Language Picker Modal */}
      <Modal
        visible={showLanguagePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLanguagePicker(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguagePicker(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Select Language</Text>
            <FlatList
              data={LANGUAGES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.languageItem,
                    selectedLanguage === item.code && styles.languageItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedLanguage(item.code);
                    setShowLanguagePicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.languageItemText,
                      selectedLanguage === item.code && styles.languageItemTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {selectedLanguage === item.code ? (
                    <Check size={18} color="#10b981" />
                  ) : null}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 48,
  },
  backButton: {
    marginBottom: 16,
    padding: 4,
    alignSelf: 'flex-start',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#10b981',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 4,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    height: '100%',
  },
  eyeButton: {
    padding: 4,
  },
  matchIcon: {
    padding: 4,
  },
  fieldError: {
    color: '#ef4444',
    fontSize: 12,
    marginBottom: 12,
    marginLeft: 4,
  },
  languageSelector: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  languageSelectorLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 4,
  },
  languageSelectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageSelectorText: {
    fontSize: 15,
    color: '#0f172a',
    fontWeight: '500',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxChecked: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  termsText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    gap: 8,
  },
  secondaryButtonText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  googleIcon: {
    width: 20,
    height: 20,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  linkText: {
    fontSize: 14,
    color: '#64748b',
  },
  linkAction: {
    fontSize: 14,
    color: '#10b981',
    fontWeight: '600',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 18,
    paddingBottom: 40,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  languageItemSelected: {
    backgroundColor: '#ecfdf5',
  },
  languageItemText: {
    fontSize: 15,
    color: '#334155',
  },
  languageItemTextSelected: {
    color: '#059669',
    fontWeight: '600',
  },
});
