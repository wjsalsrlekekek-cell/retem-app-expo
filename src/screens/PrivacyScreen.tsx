import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';

interface SectionProps {
    title: string;
    children: React.ReactNode;
}

function Section({ title, children }: SectionProps) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.sectionBody}>{children}</Text>
        </View>
    );
}

export default function PrivacyScreen() {
    const { t } = useLanguage();
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={22} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('settings.privacy')}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                <Section title="1. Information We Collect">
                    We collect information you provide during registration (name, email, location), content you create (listings, messages, reviews), and usage data (device info, analytics).
                </Section>
                <Section title="2. How We Use Information">
                    Your information is used to operate the marketplace, facilitate transactions, calculate Trust Scores, send notifications, improve our services, and ensure safety.
                </Section>
                <Section title="3. Identity Verification">
                    For verification, we collect government-issued ID images and selfies. These are encrypted, stored securely, and used solely for identity confirmation. Documents are deleted after verification.
                </Section>
                <Section title="4. Information Sharing">
                    We share your public profile (name, profile photo, Trust Score) with other users. We do not sell personal data. We may share data with law enforcement when required by law.
                </Section>
                <Section title="5. Data Storage & Security">
                    Your data is stored securely with encryption at rest and in transit. We implement industry-standard security measures to protect your information.
                </Section>
                <Section title="6. Your Rights">
                    You can access, update, or delete your personal data through the app settings. You can request a copy of your data or request complete account deletion.
                </Section>
                <Section title="7. Chat & Messages">
                    Messages between users are stored to facilitate transactions and dispute resolution. You can delete your chat history, but the other party's copy is retained.
                </Section>
                <Section title="8. Cookies & Analytics">
                    We use cookies and similar technologies for authentication, preferences, and anonymous analytics to improve the user experience.
                </Section>
                <Section title="9. Children's Privacy">
                    Re;Tem is not intended for users under 14 years of age. We do not knowingly collect data from children.
                </Section>
                <Section title="10. Changes to Policy">
                    We may update this policy and will notify users of significant changes through the app.
                </Section>

                <Text style={styles.lastUpdated}>Last updated: March 2026</Text>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 6,
    },
    sectionBody: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 22,
    },
    lastUpdated: {
        marginTop: 20,
        color: '#94a3b8',
        fontSize: 12,
        textAlign: 'center',
    },
});
