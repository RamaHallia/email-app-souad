import { supabase } from '../lib/supabase';

export type EmailCategory = 'info' | 'pub' | 'traite';

interface EmailData {
    messageId: string;
    subject: string;
    sender: string;
    body: string;
    receivedDate?: string;
}

export async function insertEmail(
    emailAddress: string,
    category: EmailCategory,
    emailData: EmailData
) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    const tableName = category === 'info' ? 'email_info'
        : category === 'pub' ? 'email_pub'
            : 'email_traite';

    const { data, error } = await supabase
        .from(tableName)
        .insert({
            user_id: user.id,
            message_id: emailData.messageId,
            email: emailAddress,
            subject: emailData.subject,
            sender: emailData.sender,
            body: emailData.body,
            received_date: emailData.receivedDate || new Date().toISOString()
        })
        .select('id, email_account_id')
        .maybeSingle();

    if (error) {
        console.error(`Error inserting email into ${tableName}:`, error);
        throw error;
    }

    return data;
}

export async function insertMultipleEmails(
    emailAddress: string,
    category: EmailCategory,
    emails: EmailData[]
) {
    const results = [];
    const errors = [];

    for (const email of emails) {
        try {
            const result = await insertEmail(emailAddress, category, email);
            results.push(result);
        } catch (error) {
            errors.push({ email, error });
        }
    }

    return { results, errors };
}
