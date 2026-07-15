// Localization Helpers for EDUCORE-OMEGA

// Localize relative dates
export const localizeTimeAgo = (date: Date, t: any): string => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return t('common.justNow');
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('common.minutesAgo', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('common.hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    return t('common.daysAgo', { count: days });
};

// Localize audit details
export const localizeAuditMessage = (details: string | undefined, action: string, entity: string, t: any): string => {
    if (!details) {
        const actionLabel = t(`auditLogs.actions.${action.toLowerCase()}`, { defaultValue: action });
        const entityLabel = t(`auditLogs.entities.${entity.toLowerCase()}`, { defaultValue: entity });
        return t('auditLogs.actionOnEntity', { action: actionLabel, entity: entityLabel, defaultValue: `${action} on ${entity}` });
    }

    const lowerDetails = details.toLowerCase();

    if (lowerDetails === 'user logged out') {
        return t('auditLogs.userLoggedOut');
    }
    if (lowerDetails === 'user logged in successfully') {
        return t('auditLogs.userLoggedIn');
    }
    if (lowerDetails === 'login attempt failed') {
        return t('auditLogs.loginFailed');
    }
    if (lowerDetails.startsWith('access denied')) {
        const role = details.split('Required role:')[1]?.trim() || '';
        return t('auditLogs.accessDeniedRole', { role });
    }
    
    // Pattern: Created student profile: [Name]
    if (lowerDetails.startsWith('created student profile:')) {
        const name = details.substring('Created student profile:'.length).trim();
        return t('auditLogs.createdStudentProfile', { name });
    }
    
    // Pattern: Updated student profile: [Name]
    if (lowerDetails.startsWith('updated student profile:')) {
        const name = details.substring('Updated student profile:'.length).trim();
        return t('auditLogs.updatedStudentProfile', { name });
    }

    // Pattern: Created teacher profile: [Name]
    if (lowerDetails.startsWith('created teacher profile:')) {
        const name = details.substring('Created teacher profile:'.length).trim();
        return t('auditLogs.createdTeacherProfile', { name });
    }
    
    // Pattern: Updated teacher profile: [Name]
    if (lowerDetails.startsWith('updated teacher profile:')) {
        const name = details.substring('Updated teacher profile:'.length).trim();
        return t('auditLogs.updatedTeacherProfile', { name });
    }

    // Pattern: Recorded payment of ₹[Amount] for student [StudentName]
    if (lowerDetails.includes('recorded payment') || lowerDetails.includes('payment of')) {
        return t('auditLogs.paymentRecorded', { details });
    }

    return details;
};

// Localize notification titles
export const localizeNotificationTitle = (title: string, t: any): string => {
    if (!title) return title;
    
    if (title.startsWith('Exam Published:')) {
        const examTitle = title.substring('Exam Published:'.length).trim();
        return t('notifications.examPublishedTitle', { title: examTitle, defaultValue: `தேர்வு வெளியிடப்பட்டது: ${examTitle}` });
    }
    if (title.startsWith('Exam Notice:')) {
        const examTitle = title.substring('Exam Notice:'.length).trim();
        return t('notifications.examNoticeTitle', { title: examTitle, defaultValue: `தேர்வு அறிவிப்பு: ${examTitle}` });
    }
    if (title.startsWith('Exam Schedule Updated:')) {
        const examTitle = title.substring('Exam Schedule Updated:'.length).trim();
        return t('notifications.examScheduleUpdatedTitle', { title: examTitle, defaultValue: `தேர்வு அட்டவணை புதுப்பிக்கப்பட்டது: ${examTitle}` });
    }
    if (title.startsWith('New Homework:')) {
        const hwTitle = title.substring('New Homework:'.length).trim();
        return t('notifications.newHomeworkTitle', { title: hwTitle, defaultValue: `புதிய வீட்டுப்பாடம்: ${hwTitle}` });
    }
    if (title.startsWith('New Announcement:')) {
        const annTitle = title.substring('New Announcement:'.length).trim();
        return t('notifications.newAnnouncementTitle', { title: annTitle, defaultValue: `புதிய அறிவிப்பு: ${annTitle}` });
    }
    if (title.startsWith('New Exam:')) {
        const examTitle = title.substring('New Exam:'.length).trim();
        return t('notifications.newExamTitle', { title: examTitle, defaultValue: `புதிய தேர்வு: ${examTitle}` });
    }
    if (title.startsWith('New Notice for your Child:')) {
        const noticeTitle = title.substring('New Notice for your Child:'.length).trim();
        return t('notifications.newNoticeForChildTitle', { title: noticeTitle, defaultValue: `உங்கள் குழந்தைக்கான புதிய அறிவிப்பு: ${noticeTitle}` });
    }
    
    return title;
};

// Localize notification messages
export const localizeNotificationMessage = (message: string, t: any): string => {
    if (!message) return message;

    // 1. The schedule for [Title] has been published. It begins on [Date]. Check your timetable for details.
    const pubMatch = message.match(/The schedule for (.+?) has been published\. It begins on (.+?)\. Check your timetable for details\./);
    if (pubMatch) {
        const title = pubMatch[1];
        const date = pubMatch[2];
        return t('notifications.examPublishedMsg', { 
            title, 
            date, 
            defaultValue: `${title} தேர்வுக்கான அட்டவணை வெளியிடப்பட்டுள்ளது. இது ${date} அன்று தொடங்குகிறது. விவரங்களுக்கு உங்கள் நேர அட்டவணையைச் சரிபார்க்கவும்.` 
        });
    }

    // 2. The exam "[Title]" has been scheduled from [Date1] to [Date2].
    const schedMatch = message.match(/The exam \"(.+?)\" has been scheduled from (.+?) to (.+?)\./);
    if (schedMatch) {
        const title = schedMatch[1];
        const startDate = schedMatch[2];
        const endDate = schedMatch[3];
        return t('notifications.examScheduledMsg', { 
            title, 
            startDate, 
            endDate, 
            defaultValue: `"${title}" தேர்வு ${startDate} முதல் ${endDate} வரை திட்டமிடப்பட்டுள்ளது.` 
        });
    }

    // 3. The exam "[Title]" is now published. Please ensure all internal marks are ready before the start date.
    const teacherMatch = message.match(/The exam \"(.+?)\" is now published\. Please ensure all internal marks are ready before the start date\./);
    if (teacherMatch) {
        const title = teacherMatch[1];
        return t('notifications.examTeacherNoticeMsg', { 
            title, 
            defaultValue: `"${title}" தேர்வு இப்போது வெளியிடப்பட்டுள்ளது. தயவுசெய்து தொடக்கத் தேதிக்கு முன் அனைத்து உள் மதிப்பெண்களும் தயாராக இருப்பதை உறுதிசெய்யவும்.` 
        });
    }

    return message;
};
