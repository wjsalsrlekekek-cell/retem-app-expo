import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View, Text, TextInput, TouchableOpacity, Image, ScrollView,
    StyleSheet, Animated, ActivityIndicator, Dimensions, Platform,
    NativeSyntheticEvent, TextInputKeyPressEventData,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
    ArrowLeft, Mail, Camera, Shield, CheckCircle, AlertCircle,
    Upload, RefreshCw, Scan, UserCheck, FileText, Eye, EyeOff,
    ChevronRight, Info, X, Clock, Lock, ShieldCheck, Globe,
    AlertTriangle, User,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import * as storage from '../lib/storage';

type Step = 'email' | 'docType' | 'uploadDoc' | 'uploadSelfie' | 'processing' | 'result';
type DocType = 'passport' | 'visa' | 'alien_card' | 'student_id';

interface OcrResult {
    fullName: string;
    nationality: string;
    documentNumber: string;
    expiryDate: string;
    documentType: string;
}

const STEPS: Step[] = ['email', 'docType', 'uploadDoc', 'uploadSelfie', 'processing', 'result'];
const VISIBLE_STEPS: Step[] = ['email', 'docType', 'uploadDoc', 'uploadSelfie'];
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CONFETTI_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function VerificationScreen() {
    const navigation = useNavigation<any>();
    const { user, refreshUser } = useAuth();
    const { t } = useLanguage();
    const { showToast } = useToast();
    const codeInputsRef = useRef<(TextInput | null)[]>([]);

    const [step, setStep] = useState<Step>('email');
    const [codeDigits, setCodeDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [generatedCode, setGeneratedCode] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const [emailVerified, setEmailVerified] = useState(false);
    const [timer, setTimer] = useState(0);
    const [docType, setDocType] = useState<DocType | null>(null);
    const [docImage, setDocImage] = useState<string | null>(null);
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const [processingProgress, setProcessingProgress] = useState(0);
    const [processingLabel, setProcessingLabel] = useState('');
    const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
    const [faceMatchScore, setFaceMatchScore] = useState(0);
    const [verificationPassed, setVerificationPassed] = useState(false);
    const [codeError, setCodeError] = useState('');
    const [uploading, setUploading] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Animated values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0)).current;
    const progressBarWidth = useRef(new Animated.Value(0)).current;
    const scanLineAnim = useRef(new Animated.Value(0)).current;
    const confettiAnims = useRef(
        Array.from({ length: 30 }, () => ({
            translateY: new Animated.Value(-20),
            opacity: new Animated.Value(1),
            rotate: new Animated.Value(0),
        }))
    ).current;

    // Timer countdown
    useEffect(() => {
        if (timer <= 0) return;
        const interval = setInterval(() => setTimer(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [timer]);

    // Fade in animation on step change
    useEffect(() => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
        }).start();
    }, [step]);

    // Scan line animation for processing step
    useEffect(() => {
        if (step !== 'processing') return;
        const animate = () => {
            scanLineAnim.setValue(0);
            Animated.timing(scanLineAnim, {
                toValue: 1,
                duration: 2000,
                useNativeDriver: true,
            }).start(() => animate());
        };
        animate();
    }, [step]);

    const currentStepIndex = STEPS.indexOf(step);
    const fullCode = codeDigits.join('');

    // --- OTP Input Handlers ---
    const handleCodeDigitChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;
        const newDigits = [...codeDigits];
        newDigits[index] = value.slice(-1);
        setCodeDigits(newDigits);
        setCodeError('');
        if (value && index < 5) {
            codeInputsRef.current[index + 1]?.focus();
        }
    };

    const handleCodeKeyPress = (index: number, e: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
        if (e.nativeEvent.key === 'Backspace' && !codeDigits[index] && index > 0) {
            codeInputsRef.current[index - 1]?.focus();
        }
    };

    // --- Email Verification ---
    const handleSendCode = () => {
        const code = String(Math.floor(100000 + Math.random() * 900000));
        setGeneratedCode(code);
        setEmailSent(true);
        setTimer(60);
        setCodeError('');
        showToast(`${t('verify.code_sent')} (Demo: ${code})`, 'info');
    };

    const handleVerifyCode = () => {
        if (fullCode === generatedCode) {
            setEmailVerified(true);
            setCodeError('');
            showToast(t('verify.email_verified'), 'success');
            setTimeout(() => setStep('docType'), 800);
        } else {
            setCodeError(t('verify.code_invalid'));
            setCodeDigits(['', '', '', '', '', '']);
            codeInputsRef.current[0]?.focus();
        }
    };

    // --- Image Picking ---
    const pickDocImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            allowsEditing: true,
        });
        if (!result.canceled) {
            setDocImage(result.assets[0].uri);
        }
    };

    const takeDocPhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showToast(t('verify.camera_permission') || 'Camera permission needed', 'error');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            quality: 0.7,
            allowsEditing: true,
        });
        if (!result.canceled) {
            setDocImage(result.assets[0].uri);
        }
    };

    const pickSelfieImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.7,
            allowsEditing: true,
        });
        if (!result.canceled) {
            setSelfieImage(result.assets[0].uri);
        }
    };

    const takeSelfiePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showToast(t('verify.camera_permission') || 'Camera permission needed', 'error');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            quality: 0.7,
            allowsEditing: true,
            cameraType: ImagePicker.CameraType.front,
        });
        if (!result.canceled) {
            setSelfieImage(result.assets[0].uri);
        }
    };

    // --- Processing Simulation ---
    const startProcessing = () => {
        setStep('processing');
        setProcessingProgress(0);
        progressBarWidth.setValue(0);

        const stages = [
            { label: t('verify.processing_upload'), target: 20, duration: 800 },
            { label: t('verify.processing_ocr'), target: 50, duration: 1500 },
            { label: t('verify.processing_face'), target: 80, duration: 1200 },
            { label: t('verify.processing_verify'), target: 100, duration: 1000 },
        ];

        let delay = 0;
        stages.forEach((stage) => {
            setTimeout(() => {
                setProcessingLabel(stage.label);
                const startTime = Date.now();
                const from = stage.target - 20;
                const animate = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / stage.duration, 1);
                    const currentProgress = Math.round(from + (stage.target - from) * progress);
                    setProcessingProgress(currentProgress);
                    if (progress < 1) requestAnimationFrame(animate);
                };
                requestAnimationFrame(animate);
            }, delay);
            delay += stage.duration + 200;
        });

        setTimeout(async () => {
            const simulatedOcr = generateOcrResult();
            setOcrResult(simulatedOcr);
            const score = 92 + Math.floor(Math.random() * 7);
            setFaceMatchScore(score);
            setVerificationPassed(true);
            setShowConfetti(true);

            if (user) {
                await storage.updateUser(user.id, {
                    verified: true,
                    verificationStatus: 'approved',
                });
                await refreshUser();
            }

            setStep('result');
            startConfettiAnimation();
            setTimeout(() => setShowConfetti(false), 4000);
        }, delay + 500);
    };

    const startConfettiAnimation = () => {
        confettiAnims.forEach((anim, i) => {
            anim.translateY.setValue(-20);
            anim.opacity.setValue(1);
            anim.rotate.setValue(0);
            const duration = 2000 + Math.random() * 2000;
            const animDelay = Math.random() * 1000;
            Animated.parallel([
                Animated.timing(anim.translateY, {
                    toValue: 500,
                    duration,
                    delay: animDelay,
                    useNativeDriver: true,
                }),
                Animated.timing(anim.opacity, {
                    toValue: 0,
                    duration,
                    delay: animDelay,
                    useNativeDriver: true,
                }),
                Animated.timing(anim.rotate, {
                    toValue: 720,
                    duration,
                    delay: animDelay,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const generateOcrResult = (): OcrResult => {
        const docTypeLabels: Record<DocType, string> = {
            passport: 'Passport',
            visa: 'Visa',
            alien_card: 'Alien Registration Card',
            student_id: 'Foreign Student ID',
        };
        const names = ['JOHN SMITH', 'MARIA GARCIA', 'HIROSHI TANAKA', 'NGUYEN VAN ANH', 'ZHANG WEI'];
        const nationalities = ['USA', 'Philippines', 'Japan', 'Vietnam', 'China'];
        const idx = Math.floor(Math.random() * names.length);

        return {
            fullName: user?.fullName?.toUpperCase() || names[idx],
            nationality: nationalities[idx],
            documentNumber: `${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(10000000 + Math.random() * 90000000)}`,
            expiryDate: `2028-${String(Math.floor(1 + Math.random() * 12)).padStart(2, '0')}-${String(Math.floor(1 + Math.random() * 28)).padStart(2, '0')}`,
            documentType: docTypeLabels[docType || 'passport'],
        };
    };

    // --- Navigation ---
    const handleBack = () => {
        if (step === 'email' || step === 'result') {
            navigation.goBack();
        } else if (step === 'processing') {
            return;
        } else {
            const prev = STEPS[currentStepIndex - 1];
            if (prev) setStep(prev);
        }
    };

    // ============================
    // TRUST BANNER
    // ============================
    const renderTrustBanner = () => (
        <View style={styles.trustBanner}>
            <Lock size={14} color="#059669" />
            <Text style={styles.trustBannerText}>
                {t('verify.security_banner')}
            </Text>
            <View style={styles.trustBannerBadge}>
                <ShieldCheck size={12} color="#047857" />
                <Text style={styles.trustBannerBadgeText}>SSL</Text>
            </View>
        </View>
    );

    // ============================
    // STEP PROGRESS BAR
    // ============================
    const renderStepBar = () => {
        const stepLabels = [
            { key: 'email', Icon: Mail, label: t('verify.step_email') || 'Email' },
            { key: 'docType', Icon: FileText, label: t('verify.step_document') || 'Document' },
            { key: 'uploadDoc', Icon: Camera, label: t('verify.step_upload') || 'Upload' },
            { key: 'uploadSelfie', Icon: UserCheck, label: t('verify.step_selfie') || 'Selfie' },
        ];

        const activeIdx = VISIBLE_STEPS.indexOf(step as Step);
        const connectorWidth = (SCREEN_WIDTH - 40 - 144) / 3; // total minus padding and icon areas

        return (
            <View style={styles.stepBarContainer}>
                <View style={styles.stepCounterContainer}>
                    <View style={styles.stepCounterBadge}>
                        <Text style={styles.stepCounterText}>
                            {t('verify.step_counter')
                                ?.replace('{current}', String(Math.min(activeIdx + 1, 4)))
                                .replace('{total}', '4')
                                || `Step ${Math.min(activeIdx + 1, 4)} of 4`}
                        </Text>
                    </View>
                </View>

                <View style={styles.stepRow}>
                    {stepLabels.map((s, i) => {
                        const stepIdx = VISIBLE_STEPS.indexOf(s.key as Step);
                        const isCompleted = activeIdx > stepIdx;
                        const isActive = activeIdx === stepIdx;
                        const IconComponent = s.Icon;

                        return (
                            <React.Fragment key={s.key}>
                                {i > 0 && (
                                    <View style={[styles.connector, { width: connectorWidth }]}>
                                        <View style={styles.connectorBg} />
                                        {activeIdx > i - 1 && (
                                            <View style={[styles.connectorFill, {
                                                width: activeIdx > i ? '100%' : activeIdx === i ? '50%' : '0%',
                                            } as any]} />
                                        )}
                                    </View>
                                )}
                                <View style={styles.stepItem}>
                                    <View style={[
                                        styles.stepCircle,
                                        isCompleted && styles.stepCircleCompleted,
                                        isActive && styles.stepCircleActive,
                                    ]}>
                                        {isCompleted ? (
                                            <CheckCircle size={20} color="white" />
                                        ) : (
                                            <IconComponent size={18} color={isActive ? '#10b981' : '#94a3b8'} />
                                        )}
                                    </View>
                                    <Text style={[
                                        styles.stepLabel,
                                        (isActive || isCompleted) && styles.stepLabelActive,
                                    ]}>{s.label}</Text>
                                </View>
                            </React.Fragment>
                        );
                    })}
                </View>
            </View>
        );
    };

    // ============================
    // STEP 1: EMAIL
    // ============================
    const renderEmailStep = () => (
        <Animated.View style={{ opacity: fadeAnim }}>
            {/* Email card */}
            <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                    <View style={styles.iconCircleGreen}>
                        <Mail size={24} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{t('verify.email_title')}</Text>
                        <Text style={styles.cardSubtitle}>{t('verify.email_subtitle')}</Text>
                    </View>
                </View>

                <View style={styles.emailDisplay}>
                    <Mail size={18} color="#64748b" />
                    <Text style={styles.emailText}>{user?.email}</Text>
                </View>

                {!emailSent ? (
                    <TouchableOpacity style={styles.btnPrimary} onPress={handleSendCode}>
                        <Text style={styles.btnPrimaryText}>{t('verify.send_code')}</Text>
                    </TouchableOpacity>
                ) : !emailVerified ? (
                    <>
                        <View style={{ marginBottom: 20 }}>
                            <Text style={styles.otpLabel}>{t('verify.enter_code')}</Text>
                            <View style={styles.otpContainer}>
                                {codeDigits.map((digit, i) => (
                                    <TextInput
                                        key={i}
                                        ref={el => { codeInputsRef.current[i] = el; }}
                                        style={[
                                            styles.otpInput,
                                            codeError ? styles.otpInputError :
                                            digit ? styles.otpInputFilled : null,
                                        ]}
                                        maxLength={1}
                                        keyboardType="number-pad"
                                        value={digit}
                                        onChangeText={v => handleCodeDigitChange(i, v)}
                                        onKeyPress={e => handleCodeKeyPress(i, e)}
                                        selectTextOnFocus
                                    />
                                ))}
                            </View>
                            {codeError ? (
                                <View style={styles.errorRow}>
                                    <AlertCircle size={14} color="#ef4444" />
                                    <Text style={styles.errorText}>{codeError}</Text>
                                </View>
                            ) : null}
                        </View>

                        <View style={styles.timerContainer}>
                            {timer > 0 ? (
                                <Text style={styles.timerText}>
                                    {t('verify.resend_in')} {timer}s
                                </Text>
                            ) : (
                                <TouchableOpacity onPress={handleSendCode}>
                                    <Text style={styles.resendText}>{t('verify.resend_code')}</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </>
                ) : (
                    <View style={styles.verifiedContainer}>
                        <CheckCircle size={48} color="#10b981" />
                        <Text style={styles.verifiedText}>{t('verify.email_verified')}</Text>
                    </View>
                )}
            </View>

            {/* Notice */}
            <View style={[styles.card, styles.noticeCard]}>
                <Info size={18} color="#f59e0b" />
                <Text style={styles.noticeText}>{t('verify.email_notice')}</Text>
            </View>

            {/* Benefits */}
            <View style={styles.card}>
                <View style={styles.benefitHeader}>
                    <Shield size={20} color="#10b981" />
                    <Text style={styles.benefitTitle}>{t('verify.restriction_title')}</Text>
                </View>
                <Text style={styles.benefitDesc}>{t('verify.restriction_desc')}</Text>
                {[
                    { icon: 'sell', text: t('verify.benefit_sell') },
                    { icon: 'community', text: t('verify.benefit_community') },
                    { icon: 'chat', text: t('verify.benefit_chat') },
                    { icon: 'trust', text: t('verify.benefit_trust') },
                    { icon: 'badge', text: t('verify.benefit_badge') },
                ].map((item, i) => (
                    <View key={i} style={[styles.benefitRow, i === 0 && styles.benefitRowFirst]}>
                        <CheckCircle size={16} color="#10b981" />
                        <Text style={styles.benefitText}>{item.text}</Text>
                    </View>
                ))}
            </View>

            {/* Sticky Verify button */}
            {emailSent && !emailVerified && (
                <View style={styles.stickyBtnContainer}>
                    <TouchableOpacity
                        style={[styles.btnPrimary, fullCode.length !== 6 && styles.btnDisabled]}
                        onPress={handleVerifyCode}
                        disabled={fullCode.length !== 6}
                    >
                        <Text style={styles.btnPrimaryText}>{t('verify.verify_code')}</Text>
                    </TouchableOpacity>
                </View>
            )}
        </Animated.View>
    );

    // ============================
    // STEP 2: DOCUMENT TYPE
    // ============================
    const renderDocTypeStep = () => {
        const docTypes: { type: DocType; Icon: typeof FileText; label: string; desc: string }[] = [
            {
                type: 'passport',
                Icon: FileText,
                label: t('auth.verification.type_passport'),
                desc: t('verify.passport_desc'),
            },
            {
                type: 'visa',
                Icon: FileText,
                label: t('auth.verification.type_visa'),
                desc: t('verify.visa_desc'),
            },
            {
                type: 'alien_card',
                Icon: User,
                label: t('auth.verification.type_alien_card'),
                desc: t('verify.alien_card_desc'),
            },
            {
                type: 'student_id',
                Icon: User,
                label: t('auth.verification.type_student_id'),
                desc: t('verify.student_id_desc'),
            },
        ];

        return (
            <Animated.View style={{ opacity: fadeAnim }}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>{t('auth.verification.id_type')}</Text>
                    <Text style={[styles.cardSubtitle, { marginBottom: 20 }]}>
                        {t('verify.doc_select_desc')}
                    </Text>

                    {docTypes.map(d => {
                        const isSelected = docType === d.type;
                        const IconComp = d.Icon;
                        return (
                            <TouchableOpacity
                                key={d.type}
                                style={[
                                    styles.docTypeCard,
                                    isSelected && styles.docTypeCardSelected,
                                ]}
                                onPress={() => setDocType(d.type)}
                            >
                                <View style={styles.docTypeIconBox}>
                                    <IconComp size={24} color={isSelected ? '#10b981' : '#64748b'} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.docTypeLabel}>{d.label}</Text>
                                    <Text style={styles.docTypeDesc}>{d.desc}</Text>
                                </View>
                                {isSelected && <CheckCircle size={22} color="#10b981" />}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.stickyBtnContainer}>
                    <TouchableOpacity
                        style={[styles.btnPrimary, !docType && styles.btnDisabled]}
                        onPress={() => docType && setStep('uploadDoc')}
                        disabled={!docType}
                    >
                        <Text style={styles.btnPrimaryText}>{t('product.add.next')}</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        );
    };

    // ============================
    // STEP 3: UPLOAD DOCUMENT
    // ============================
    const renderUploadDocStep = () => (
        <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>{t('auth.verification.upload_id')}</Text>
                <Text style={[styles.cardSubtitle, { marginBottom: 20 }]}>
                    {t('verify.upload_doc_desc')}
                </Text>

                {/* Photo Guidelines */}
                <View style={styles.guidelinesBox}>
                    <Text style={styles.guidelinesTitle}>
                        {t('verify.photo_guidelines')}
                    </Text>
                    {[
                        t('verify.guideline_1'),
                        t('verify.guideline_2'),
                        t('verify.guideline_3'),
                        t('verify.guideline_4'),
                    ].map((text, i) => (
                        <View key={i} style={styles.guidelineRow}>
                            <CheckCircle size={14} color="#059669" />
                            <Text style={styles.guidelineText}>{text}</Text>
                        </View>
                    ))}
                </View>

                {/* Good / Bad Examples */}
                <View style={{ marginBottom: 20 }}>
                    <Text style={styles.exampleTitle}>{t('verify.example_title')}</Text>
                    <View style={styles.exampleRow}>
                        <View style={[styles.exampleBox, { borderColor: '#10b981' }]}>
                            <View style={[styles.examplePreview, { backgroundColor: '#f0fdf4' }]}>
                                <FileText size={16} color="#10b981" />
                            </View>
                            <View style={styles.exampleLabelRow}>
                                <CheckCircle size={12} color="#10b981" />
                                <Text style={[styles.exampleLabelText, { color: '#10b981' }]}>
                                    {t('verify.good_example')}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.exampleBox, { borderColor: '#ef4444' }]}>
                            <View style={[styles.examplePreview, { backgroundColor: '#fef2f2', opacity: 0.5 }]}>
                                <FileText size={16} color="#fca5a5" />
                            </View>
                            <View style={styles.exampleLabelRow}>
                                <X size={12} color="#ef4444" />
                                <Text style={[styles.exampleLabelText, { color: '#ef4444' }]}>
                                    {t('verify.bad_blurry')}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.exampleBox, { borderColor: '#ef4444' }]}>
                            <View style={[styles.examplePreview, { backgroundColor: '#1e293b' }]}>
                                <FileText size={16} color="#475569" />
                            </View>
                            <View style={styles.exampleLabelRow}>
                                <X size={12} color="#ef4444" />
                                <Text style={[styles.exampleLabelText, { color: '#ef4444' }]}>
                                    {t('verify.bad_dark')}
                                </Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Upload Area */}
                {!docImage ? (
                    <View>
                        <TouchableOpacity
                            style={styles.uploadAreaDoc}
                            onPress={takeDocPhoto}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator size="large" color="#10b981" />
                            ) : (
                                <>
                                    <View style={[styles.uploadIconCircle, { backgroundColor: '#d1fae5' }]}>
                                        <Camera size={28} color="#10b981" />
                                    </View>
                                    <Text style={[styles.uploadLabel, { color: '#10b981' }]}>
                                        {t('auth.verification.tap_upload_id')}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.galleryFallbackBtn}
                            onPress={pickDocImage}
                        >
                            <Upload size={16} color="#6b7280" />
                            <Text style={styles.galleryFallbackText}>
                                {t('verify.camera_fallback') || 'Choose from gallery'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <Image source={{ uri: docImage }} style={styles.previewImage} />
                        <View style={styles.previewBadge}>
                            <CheckCircle size={14} color="white" />
                            <Text style={styles.previewBadgeText}>{t('auth.verification.uploaded')}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.retakeBtn}
                            onPress={() => { setDocImage(null); }}
                        >
                            <RefreshCw size={14} color="white" />
                            <Text style={styles.retakeBtnText}>{t('auth.verification.change')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Security info */}
            <View style={[styles.card, { backgroundColor: '#f0fdf4', padding: 16 }]}>
                {[
                    { Icon: Lock, text: t('verify.security_ssl') },
                    { Icon: Clock, text: t('verify.security_delete') },
                    { Icon: ShieldCheck, text: t('verify.security_private') },
                ].map((item, i) => (
                    <View key={i} style={styles.securityRow}>
                        <item.Icon size={14} color="#059669" />
                        <Text style={styles.securityText}>{item.text}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.stickyBtnContainer}>
                <TouchableOpacity
                    style={[styles.btnPrimary, !docImage && styles.btnDisabled]}
                    onPress={() => docImage && setStep('uploadSelfie')}
                    disabled={!docImage}
                >
                    <Text style={styles.btnPrimaryText}>{t('product.add.next')}</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    // ============================
    // STEP 4: SELFIE
    // ============================
    const renderUploadSelfieStep = () => (
        <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>
                    {t('auth.verification.selfie_notice_title')}
                </Text>
                <Text style={[styles.cardSubtitle, { marginBottom: 20 }]}>
                    {t('auth.verification.selfie_notice_desc')}
                </Text>

                {/* Visual Guide */}
                <View style={styles.selfieGuideBox}>
                    <View style={styles.selfieIllustration}>
                        <View style={styles.faceOval}>
                            <User size={36} color="#3b82f6" />
                            <View style={styles.checkBadgeMini}>
                                <CheckCircle size={12} color="white" />
                            </View>
                        </View>
                        <Text style={styles.plusSign}>+</Text>
                        <View style={styles.docOval}>
                            <FileText size={24} color="#3b82f6" />
                            <View style={styles.checkBadgeMini}>
                                <CheckCircle size={12} color="white" />
                            </View>
                        </View>
                    </View>

                    {[
                        t('verify.selfie_hold_doc'),
                        t('verify.selfie_both_visible'),
                        t('verify.selfie_good_lighting'),
                    ].map((text, i) => (
                        <View key={i} style={styles.selfieInstructionRow}>
                            <View style={styles.selfieInstructionNum}>
                                <Text style={styles.selfieInstructionNumText}>{i + 1}</Text>
                            </View>
                            <Text style={styles.selfieInstructionText}>{text}</Text>
                        </View>
                    ))}
                </View>

                {/* Good/Bad selfie examples */}
                <View style={[styles.exampleRow, { marginBottom: 20 }]}>
                    <View style={[styles.exampleBox, { borderColor: '#10b981' }]}>
                        <View style={[styles.examplePreview, { backgroundColor: '#f0fdf4' }]}>
                            <User size={20} color="#10b981" />
                            <FileText size={14} color="#10b981" />
                        </View>
                        <View style={styles.exampleLabelRow}>
                            <CheckCircle size={12} color="#10b981" />
                            <Text style={[styles.exampleLabelText, { color: '#10b981' }]}>
                                {t('verify.good_example')}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.exampleBox, { borderColor: '#ef4444' }]}>
                        <View style={[styles.examplePreview, { backgroundColor: '#fef2f2' }]}>
                            <User size={20} color="#fca5a5" />
                        </View>
                        <View style={styles.exampleLabelRow}>
                            <X size={12} color="#ef4444" />
                            <Text style={[styles.exampleLabelText, { color: '#ef4444' }]}>
                                {t('verify.bad_no_doc')}
                            </Text>
                        </View>
                    </View>
                    <View style={[styles.exampleBox, { borderColor: '#ef4444' }]}>
                        <View style={[styles.examplePreview, { backgroundColor: '#fef2f2', opacity: 0.4 }]}>
                            <User size={20} color="#fca5a5" />
                            <FileText size={14} color="#fca5a5" />
                        </View>
                        <View style={styles.exampleLabelRow}>
                            <X size={12} color="#ef4444" />
                            <Text style={[styles.exampleLabelText, { color: '#ef4444' }]}>
                                {t('verify.bad_dark')}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Anti-fraud notice */}
                <View style={styles.antiFraudBox}>
                    <Lock size={16} color="#d97706" />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.antiFraudTitle}>{t('verify.security_notice')}</Text>
                        <Text style={styles.antiFraudDesc}>{t('verify.security_desc')}</Text>
                    </View>
                </View>

                {/* Upload Area */}
                {!selfieImage ? (
                    <View>
                        <TouchableOpacity
                            style={styles.uploadAreaSelfie}
                            onPress={takeSelfiePhoto}
                            disabled={uploading}
                        >
                            {uploading ? (
                                <ActivityIndicator size="large" color="#3b82f6" />
                            ) : (
                                <>
                                    <View style={[styles.uploadIconCircle, { backgroundColor: '#dbeafe' }]}>
                                        <Camera size={28} color="#3b82f6" />
                                    </View>
                                    <Text style={[styles.uploadLabel, { color: '#3b82f6' }]}>
                                        {t('auth.verification.tap_upload_selfie')}
                                    </Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.galleryFallbackBtn}
                            onPress={pickSelfieImage}
                        >
                            <Upload size={16} color="#6b7280" />
                            <Text style={styles.galleryFallbackText}>
                                {t('verify.camera_fallback') || 'Choose from gallery'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View>
                        <Image source={{ uri: selfieImage }} style={styles.previewImage} />
                        <View style={styles.previewBadge}>
                            <CheckCircle size={14} color="white" />
                            <Text style={styles.previewBadgeText}>{t('auth.verification.uploaded')}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.retakeBtn}
                            onPress={() => { setSelfieImage(null); }}
                        >
                            <RefreshCw size={14} color="white" />
                            <Text style={styles.retakeBtnText}>{t('auth.verification.change')}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            <View style={styles.stickyBtnContainer}>
                <TouchableOpacity
                    style={[styles.btnPrimary, !selfieImage && styles.btnDisabled]}
                    onPress={startProcessing}
                    disabled={!selfieImage}
                >
                    <Text style={styles.btnPrimaryText}>{t('auth.verification.submit')}</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    // ============================
    // STEP 5: PROCESSING
    // ============================
    const renderProcessingStep = () => {
        const scanTranslateY = scanLineAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 94],
        });

        const processingSteps = [
            { label: t('verify.processing_upload'), threshold: 20 },
            { label: t('verify.processing_ocr'), threshold: 50 },
            { label: t('verify.processing_face'), threshold: 80 },
            { label: t('verify.processing_verify'), threshold: 100 },
        ];

        return (
            <Animated.View style={[styles.processingContainer, { opacity: fadeAnim }]}>
                <View style={[styles.card, { width: '100%' }]}>
                    <View style={styles.processingContent}>
                        {/* Scanning icon */}
                        <View style={styles.scanBox}>
                            <Scan size={40} color="#10b981" />
                            <Animated.View style={[
                                styles.scanLine,
                                { transform: [{ translateY: scanTranslateY }] },
                            ]} />
                        </View>

                        <Text style={styles.processingTitle}>
                            {t('verify.processing_title')}
                        </Text>
                        <Text style={styles.processingLabel}>
                            {processingLabel || t('verify.processing_wait')}
                        </Text>
                        <Text style={styles.processingEstimate}>
                            {t('verify.processing_estimate')}
                        </Text>

                        {/* Progress bar */}
                        <View style={styles.progressBarBg}>
                            <View style={[styles.progressBarFill, { width: `${processingProgress}%` } as any]} />
                        </View>
                        <Text style={styles.progressPercent}>{processingProgress}%</Text>
                    </View>

                    {/* Steps checklist */}
                    <View style={styles.processingChecklist}>
                        {processingSteps.map((item, i) => (
                            <View key={i} style={styles.processingCheckRow}>
                                {processingProgress >= item.threshold ? (
                                    <CheckCircle size={20} color="#10b981" />
                                ) : processingProgress >= item.threshold - 20 ? (
                                    <ActivityIndicator size={20} color="#10b981" />
                                ) : (
                                    <View style={styles.processingCheckEmpty} />
                                )}
                                <Text style={[
                                    styles.processingCheckLabel,
                                    processingProgress >= item.threshold && styles.processingCheckLabelDone,
                                ]}>{item.label}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Warning */}
                    <View style={styles.warningBox}>
                        <AlertTriangle size={18} color="#d97706" />
                        <Text style={styles.warningText}>
                            {t('verify.processing_dont_close')}
                        </Text>
                    </View>
                </View>
            </Animated.View>
        );
    };

    // ============================
    // STEP 6: RESULT
    // ============================
    const renderResultStep = () => (
        <Animated.View style={{ opacity: fadeAnim }}>
            {/* Confetti */}
            {showConfetti && (
                <View style={styles.confettiContainer}>
                    {confettiAnims.map((anim, i) => {
                        const spin = anim.rotate.interpolate({
                            inputRange: [0, 720],
                            outputRange: ['0deg', '720deg'],
                        });
                        return (
                            <Animated.View
                                key={i}
                                style={[
                                    styles.confettiPiece,
                                    {
                                        left: `${Math.random() * 100}%` as any,
                                        backgroundColor: CONFETTI_COLORS[i % 6],
                                        width: 8 + Math.random() * 8,
                                        height: 8 + Math.random() * 8,
                                        borderRadius: Math.random() > 0.5 ? 50 : 2,
                                        opacity: anim.opacity,
                                        transform: [
                                            { translateY: anim.translateY },
                                            { rotate: spin },
                                        ],
                                    },
                                ]}
                            />
                        );
                    })}
                </View>
            )}

            {/* Success Banner */}
            <View style={styles.successBanner}>
                <View style={styles.successIconCircle}>
                    <Shield size={40} color="white" />
                </View>
                <Text style={styles.successTitle}>{t('auth.verification.success')}</Text>
                <Text style={styles.successDesc}>{t('auth.verification.success_desc')}</Text>
            </View>

            {/* Badge Preview */}
            <View style={styles.card}>
                <View style={styles.sectionHeaderRow}>
                    <ShieldCheck size={20} color="#10b981" />
                    <Text style={styles.sectionTitle}>{t('verify.result_badge_preview')}</Text>
                </View>
                <View style={styles.badgePreviewBox}>
                    <View style={styles.badgeAvatar}>
                        <User size={24} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                        <View style={styles.badgeNameRow}>
                            <Text style={styles.badgeName}>{user?.fullName || 'User'}</Text>
                            <CheckCircle size={16} color="#10b981" fill="#10b981" stroke="white" />
                        </View>
                        <Text style={styles.badgeDesc}>{t('verify.result_badge_desc')}</Text>
                    </View>
                </View>
            </View>

            {/* OCR Results */}
            {ocrResult && (
                <View style={styles.card}>
                    <View style={styles.sectionHeaderRow}>
                        <Scan size={20} color="#10b981" />
                        <Text style={styles.sectionTitle}>{t('verify.ocr_results')}</Text>
                    </View>

                    {[
                        { label: t('verify.ocr_doc_type'), value: ocrResult.documentType },
                        { label: t('verify.ocr_name'), value: ocrResult.fullName },
                        { label: t('verify.ocr_nationality'), value: ocrResult.nationality },
                        { label: t('verify.ocr_doc_number'), value: ocrResult.documentNumber },
                        { label: t('verify.ocr_expiry'), value: ocrResult.expiryDate },
                    ].map((item, i) => (
                        <View key={i} style={[styles.ocrRow, i < 4 && styles.ocrRowBorder]}>
                            <Text style={styles.ocrLabel}>{item.label}</Text>
                            <Text style={styles.ocrValue}>{item.value}</Text>
                        </View>
                    ))}
                </View>
            )}

            {/* Face Match Result */}
            <View style={styles.card}>
                <View style={styles.sectionHeaderRow}>
                    <UserCheck size={20} color="#10b981" />
                    <Text style={styles.sectionTitle}>{t('verify.face_match_title')}</Text>
                </View>

                <View style={styles.faceMatchCenter}>
                    <View style={styles.faceMatchCircle}>
                        <Text style={styles.faceMatchScore}>{faceMatchScore}%</Text>
                    </View>
                    <Text style={styles.faceMatchPass}>{t('verify.face_match_pass')}</Text>
                    <Text style={styles.faceMatchDesc}>{t('verify.face_match_desc')}</Text>
                </View>
            </View>

            {/* Trust Score Bonus */}
            <View style={[styles.card, { backgroundColor: '#f0fdf4', flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
                <View style={[styles.iconCircleGreen, { width: 44, height: 44 }]}>
                    <Shield size={22} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.trustBonusTitle}>{t('verify.trust_bonus')}</Text>
                    <Text style={styles.trustBonusDesc}>{t('verify.trust_bonus_desc')}</Text>
                </View>
            </View>

            {/* Go to Profile */}
            <View style={styles.stickyBtnContainer}>
                <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.btnPrimaryText}>{t('auth.verification.go_home')}</Text>
                </TouchableOpacity>
            </View>
        </Animated.View>
    );

    // ============================
    // MAIN RENDER
    // ============================
    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={handleBack}
                    style={[styles.headerBtn, step === 'processing' && { opacity: 0.3 }]}
                    disabled={step === 'processing'}
                >
                    <ArrowLeft size={24} color="#1e293b" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('auth.verification.title')}</Text>
                {step !== 'processing' && step !== 'result' ? (
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Text style={styles.skipText}>{t('auth.verification.skip')}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 40 }} />
                )}
            </View>

            {/* Trust Banner */}
            {step !== 'processing' && step !== 'result' && renderTrustBanner()}

            {/* Step Progress */}
            {step !== 'processing' && step !== 'result' && renderStepBar()}

            {/* Content */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {step === 'email' && renderEmailStep()}
                {step === 'docType' && renderDocTypeStep()}
                {step === 'uploadDoc' && renderUploadDocStep()}
                {step === 'uploadSelfie' && renderUploadSelfieStep()}
                {step === 'processing' && renderProcessingStep()}
                {step === 'result' && renderResultStep()}
            </ScrollView>
        </SafeAreaView>
    );
}

// ============================
// STYLES
// ============================
const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#f8faf9',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    headerBtn: {
        padding: 4,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    skipText: {
        fontSize: 14,
        color: '#64748b',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 100,
    },

    // Trust Banner
    trustBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: '#ecfdf5',
        borderBottomWidth: 1,
        borderBottomColor: '#d1fae5',
    },
    trustBannerText: {
        fontSize: 12,
        color: '#065f46',
        fontWeight: '600',
        flex: 1,
    },
    trustBannerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
    },
    trustBannerBadgeText: {
        fontSize: 10,
        color: '#047857',
    },

    // Step Bar
    stepBarContainer: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
        backgroundColor: 'white',
        marginBottom: 4,
    },
    stepCounterContainer: {
        alignItems: 'center',
        marginBottom: 14,
    },
    stepCounterBadge: {
        backgroundColor: '#ecfdf5',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
    },
    stepCounterText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#10b981',
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    stepItem: {
        alignItems: 'center',
        gap: 6,
    },
    stepCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f1f5f9',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    stepCircleCompleted: {
        backgroundColor: '#10b981',
        borderColor: '#10b981',
    },
    stepCircleActive: {
        backgroundColor: '#d1fae5',
        borderColor: '#10b981',
    },
    stepLabel: {
        fontSize: 10,
        fontWeight: '400',
        color: '#94a3b8',
    },
    stepLabelActive: {
        fontWeight: '700',
        color: '#10b981',
    },
    connector: {
        height: 3,
        marginTop: 17,
        position: 'relative',
    },
    connectorBg: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        height: 3,
        backgroundColor: '#e2e8f0',
        borderRadius: 2,
    },
    connectorFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: 3,
        backgroundColor: '#10b981',
        borderRadius: 2,
    },

    // Card
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    iconCircleGreen: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#d1fae5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: 13,
        color: '#64748b',
    },

    // Email Display
    emailDisplay: {
        backgroundColor: '#f8faf9',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    emailText: {
        fontSize: 15,
        color: '#334155',
        fontWeight: '500',
    },

    // Buttons
    btnPrimary: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 14,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 14,
        elevation: 4,
    },
    btnPrimaryText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    btnDisabled: {
        opacity: 0.4,
        shadowOpacity: 0,
        elevation: 0,
    },
    stickyBtnContainer: {
        paddingTop: 16,
        paddingBottom: 20,
    },

    // OTP
    otpLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 12,
    },
    otpContainer: {
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
    },
    otpInput: {
        width: 46,
        height: 56,
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '700',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
        backgroundColor: '#fff',
        color: '#1e293b',
    },
    otpInputFilled: {
        borderColor: '#10b981',
        backgroundColor: '#f0fdf4',
    },
    otpInputError: {
        borderColor: '#ef4444',
    },
    errorRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 10,
        justifyContent: 'center',
    },
    errorText: {
        color: '#ef4444',
        fontSize: 12,
    },
    timerContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    timerText: {
        fontSize: 13,
        color: '#94a3b8',
    },
    resendText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10b981',
    },
    verifiedContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    verifiedText: {
        fontWeight: '600',
        color: '#10b981',
        marginTop: 8,
        fontSize: 16,
    },

    // Notice
    noticeCard: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
        backgroundColor: '#fffbeb',
    },
    noticeText: {
        flex: 1,
        fontSize: 12,
        color: '#92400e',
        lineHeight: 18,
    },

    // Benefits
    benefitHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    benefitDesc: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 20,
        marginBottom: 16,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
    },
    benefitRowFirst: {
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    benefitText: {
        fontSize: 14,
        color: '#334155',
        flex: 1,
    },

    // Doc Type
    docTypeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        backgroundColor: 'white',
        marginBottom: 10,
    },
    docTypeCardSelected: {
        borderWidth: 2,
        borderColor: '#10b981',
        backgroundColor: '#f0fdf4',
    },
    docTypeIconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    docTypeLabel: {
        fontWeight: '600',
        fontSize: 15,
        color: '#1e293b',
    },
    docTypeDesc: {
        marginTop: 4,
        fontSize: 12,
        color: '#64748b',
    },

    // Guidelines
    guidelinesBox: {
        backgroundColor: '#f0fdf4',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
    },
    guidelinesTitle: {
        fontWeight: '600',
        fontSize: 13,
        color: '#166534',
        marginBottom: 10,
    },
    guidelineRow: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        marginBottom: 6,
    },
    guidelineText: {
        fontSize: 12,
        color: '#334155',
        flex: 1,
    },

    // Examples
    exampleTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginBottom: 10,
    },
    exampleRow: {
        flexDirection: 'row',
        gap: 8,
    },
    exampleBox: {
        flex: 1,
        borderRadius: 12,
        borderWidth: 2,
        padding: 8,
        alignItems: 'center',
    },
    examplePreview: {
        width: '100%',
        height: 60,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 4,
        marginBottom: 6,
    },
    exampleLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    exampleLabelText: {
        fontSize: 11,
        fontWeight: '600',
    },

    // Upload Area
    uploadAreaDoc: {
        width: '100%',
        height: 200,
        borderRadius: 14,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#10b981',
        backgroundColor: '#f0fdf4',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    uploadAreaSelfie: {
        width: '100%',
        height: 200,
        borderRadius: 14,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    uploadIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    uploadLabel: {
        fontSize: 14,
        fontWeight: '500',
    },
    galleryFallbackBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        marginTop: 10,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#e2e8f0',
        backgroundColor: '#f9fafb',
    },
    galleryFallbackText: {
        fontSize: 13,
        color: '#6b7280',
        fontWeight: '500',
    },

    // Image Preview
    previewImage: {
        width: '100%',
        height: 240,
        borderRadius: 14,
        resizeMode: 'cover',
    },
    previewBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#10b981',
    },
    previewBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
    retakeBtn: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.6)',
    },
    retakeBtnText: {
        color: 'white',
        fontSize: 13,
        fontWeight: '500',
    },

    // Security info
    securityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 6,
    },
    securityText: {
        fontSize: 11,
        color: '#065f46',
        flex: 1,
    },

    // Selfie Guide
    selfieGuideBox: {
        backgroundColor: '#eff6ff',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 24,
        marginBottom: 20,
    },
    selfieIllustration: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 16,
    },
    faceOval: {
        width: 72,
        height: 88,
        borderRadius: 36,
        borderWidth: 3,
        borderStyle: 'dashed',
        borderColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dbeafe',
    },
    docOval: {
        width: 72,
        height: 52,
        borderRadius: 8,
        borderWidth: 3,
        borderStyle: 'dashed',
        borderColor: '#3b82f6',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#dbeafe',
    },
    checkBadgeMini: {
        position: 'absolute',
        bottom: -4,
        right: -4,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusSign: {
        fontSize: 24,
        color: '#93c5fd',
        fontWeight: '700',
    },
    selfieInstructionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    selfieInstructionNum: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#bfdbfe',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selfieInstructionNumText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#2563eb',
    },
    selfieInstructionText: {
        fontSize: 12,
        color: '#1e40af',
        flex: 1,
    },

    // Anti-fraud
    antiFraudBox: {
        backgroundColor: '#fef3c7',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        marginBottom: 20,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'flex-start',
    },
    antiFraudTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400e',
        marginBottom: 4,
    },
    antiFraudDesc: {
        fontSize: 11,
        color: '#92400e',
        lineHeight: 16,
    },

    // Processing
    processingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 500,
    },
    processingContent: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    scanBox: {
        width: 100,
        height: 100,
        borderRadius: 20,
        backgroundColor: '#f0fdf4',
        borderWidth: 3,
        borderColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        marginBottom: 24,
    },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 3,
        backgroundColor: '#10b981',
        opacity: 0.6,
    },
    processingTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 8,
    },
    processingLabel: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 8,
    },
    processingEstimate: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 24,
    },
    progressBarBg: {
        width: '100%',
        height: 10,
        backgroundColor: '#e2e8f0',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 8,
        backgroundColor: '#10b981',
    },
    progressPercent: {
        fontSize: 14,
        fontWeight: '700',
        color: '#10b981',
    },
    processingChecklist: {
        marginTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 20,
        width: '100%',
    },
    processingCheckRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    processingCheckEmpty: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    processingCheckLabel: {
        fontSize: 14,
        color: '#94a3b8',
        fontWeight: '400',
    },
    processingCheckLabelDone: {
        color: '#10b981',
        fontWeight: '600',
    },
    warningBox: {
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#fef3c7',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    warningText: {
        fontSize: 12,
        color: '#92400e',
        fontWeight: '500',
        flex: 1,
    },

    // Confetti
    confettiContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        overflow: 'hidden',
    },
    confettiPiece: {
        position: 'absolute',
        top: -20,
    },

    // Result
    successBanner: {
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
        alignItems: 'center',
        backgroundColor: '#10b981',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
    },
    successIconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    successTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: 'white',
        marginBottom: 8,
    },
    successDesc: {
        fontSize: 14,
        color: 'white',
        opacity: 0.9,
        textAlign: 'center',
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1e293b',
    },
    badgePreviewBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 16,
        borderRadius: 14,
        backgroundColor: '#f8faf9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    badgeAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#d1fae5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    badgeName: {
        fontWeight: '700',
        fontSize: 15,
        color: '#1e293b',
    },
    badgeDesc: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },

    // OCR
    ocrRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
    },
    ocrRowBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    ocrLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    ocrValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },

    // Face Match
    faceMatchCenter: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    faceMatchCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 8,
        borderColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    faceMatchScore: {
        fontSize: 22,
        fontWeight: '700',
        color: '#10b981',
    },
    faceMatchPass: {
        fontSize: 14,
        fontWeight: '600',
        color: '#10b981',
        marginBottom: 4,
    },
    faceMatchDesc: {
        fontSize: 12,
        color: '#64748b',
    },

    // Trust Bonus
    trustBonusTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#166534',
    },
    trustBonusDesc: {
        fontSize: 12,
        color: '#15803d',
        marginTop: 2,
    },
});
