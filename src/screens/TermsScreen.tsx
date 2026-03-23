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

export default function TermsScreen() {
    const { t } = useLanguage();
    const navigation = useNavigation<any>();

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={22} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('settings.terms')}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                <Section title="1. Acceptance of Terms">
                    By accessing or using Re;Tem, you agree to be bound by these Terms of Service. If you do not agree, do not use the service.
                </Section>
                <Section title="2. Description of Service">
                    Re;Tem is a peer-to-peer marketplace that connects buyers and sellers of secondhand goods. We do not own, sell, or resell any products listed on the platform.
                </Section>
                <Section title="3. User Accounts">
                    You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your credentials and for all activities under your account.
                </Section>
                <Section title="4. Listings & Transactions">
                    Sellers must accurately describe items, including condition, defects, and pricing. Buyers and sellers transact directly; Re;Tem is not a party to the transaction and assumes no liability for disputes.
                </Section>
                <Section title="5. Prohibited Content">
                    You may not list illegal items, counterfeit goods, weapons, drugs, or any items violating local laws. Re;Tem reserves the right to remove listings and suspend accounts.
                </Section>
                <Section title="6. Trust Score">
                    Trust Scores are calculated based on identity verification, transaction history, response time, reviews, and community participation. Manipulation of scores is prohibited.
                </Section>
                <Section title="7. Intellectual Property">
                    All content, trademarks, and designs on Re;Tem are owned by Re;Tem or its licensors. Users retain ownership of content they create but grant Re;Tem a license to display it.
                </Section>
                <Section title="8. Limitation of Liability">
                    Re;Tem is provided "as is" without warranties. We are not liable for damages arising from use of the service, including losses from transactions between users.
                </Section>
                <Section title="9. Termination">
                    We may suspend or terminate your account for violations of these terms. You may delete your account at any time through Settings.
                </Section>
                <Section title="10. Changes to Terms">
                    We may update these terms. Continued use of Re;Tem after changes constitutes acceptance.
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
