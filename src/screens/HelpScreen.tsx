import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, ChevronDown, ChevronUp, Mail, MessageCircle, Info, ExternalLink } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useLanguage } from '../contexts/LanguageContext';

export default function HelpScreen() {
    const { t } = useLanguage();
    const navigation = useNavigation<any>();
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const faqs = [
        { q: t('help.faq1_q'), a: t('help.faq1_a') },
        { q: t('help.faq2_q'), a: t('help.faq2_a') },
        { q: t('help.faq3_q'), a: t('help.faq3_a') },
        { q: t('help.faq4_q'), a: t('help.faq4_a') },
        { q: t('help.faq5_q'), a: t('help.faq5_a') },
        { q: t('help.faq6_q'), a: t('help.faq6_a') },
    ];

    const contacts = [
        { icon: Mail, label: t('help.email'), value: 'support@retem.app', color: '#3b82f6' },
        { icon: MessageCircle, label: t('help.kakao'), value: '@retem', color: '#f9e000' },
    ];

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft size={22} color="#334155" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('profile.help')}</Text>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
                {/* FAQ */}
                <Text style={styles.sectionLabel}>{t('help.faq_title')}</Text>
                <View style={styles.faqList}>
                    {faqs.map((faq, i) => (
                        <View key={i} style={styles.faqItem}>
                            <TouchableOpacity
                                onPress={() => setOpenFaq(openFaq === i ? null : i)}
                                style={styles.faqQuestion}
                            >
                                <Text style={styles.faqQuestionText}>{faq.q}</Text>
                                {openFaq === i
                                    ? <ChevronUp size={18} color="#94a3b8" />
                                    : <ChevronDown size={18} color="#94a3b8" />}
                            </TouchableOpacity>
                            {openFaq === i && (
                                <View style={styles.faqAnswer}>
                                    <Text style={styles.faqAnswerText}>{faq.a}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>

                {/* Contact */}
                <Text style={styles.sectionLabel}>{t('help.contact_title')}</Text>
                <View style={styles.contactList}>
                    {contacts.map((c, i) => {
                        const Icon = c.icon;
                        return (
                            <View key={i} style={styles.contactItem}>
                                <View style={[styles.contactIconWrap, { backgroundColor: c.color + '15' }]}>
                                    <Icon size={20} color={c.color} />
                                </View>
                                <View style={styles.contactInfo}>
                                    <Text style={styles.contactLabel}>{c.label}</Text>
                                    <Text style={styles.contactValue}>{c.value}</Text>
                                </View>
                                <ExternalLink size={16} color="#cbd5e1" />
                            </View>
                        );
                    })}
                </View>

                {/* App info */}
                <Text style={styles.sectionLabel}>{t('help.app_info')}</Text>
                <View style={styles.appInfoCard}>
                    <View style={styles.appInfoRow}>
                        <View style={styles.appInfoIconWrap}>
                            <Info size={20} color="#10b981" />
                        </View>
                        <View>
                            <Text style={styles.appName}>Re;Tem</Text>
                            <Text style={styles.appVersion}>v1.0.0</Text>
                        </View>
                    </View>
                    <Text style={styles.copyright}>{'\u00A9'} 2026 Re;Tem. All rights reserved.</Text>
                </View>
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
    sectionLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: '#334155',
        marginBottom: 12,
    },
    faqList: {
        gap: 8,
        marginBottom: 24,
    },
    faqItem: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
    },
    faqQuestion: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 14,
        paddingHorizontal: 16,
    },
    faqQuestionText: {
        flex: 1,
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        lineHeight: 18,
    },
    faqAnswer: {
        paddingHorizontal: 16,
        paddingBottom: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
    },
    faqAnswerText: {
        fontSize: 13,
        color: '#64748b',
        lineHeight: 21,
    },
    contactList: {
        gap: 8,
        marginBottom: 24,
    },
    contactItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#ffffff',
    },
    contactIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    contactInfo: {
        flex: 1,
    },
    contactLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
    },
    contactValue: {
        fontSize: 12,
        color: '#94a3b8',
    },
    appInfoCard: {
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        backgroundColor: '#ffffff',
        padding: 16,
    },
    appInfoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    appInfoIconWrap: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: '#ecfdf5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    appName: {
        fontSize: 14,
        fontWeight: '700',
        color: '#334155',
    },
    appVersion: {
        fontSize: 12,
        color: '#94a3b8',
    },
    copyright: {
        fontSize: 12,
        color: '#94a3b8',
        lineHeight: 18,
    },
});
