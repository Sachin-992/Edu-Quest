import re
import os

STUDENT_PATH = r"c:\Users\Ragu\Downloads\edu-core\edu-main\components\student\StudentDashboard.tsx"
TEACHER_PATH = r"c:\Users\Ragu\Downloads\edu-core\edu-main\components\teacher\TeacherDashboard.tsx"
PARENT_PATH = r"c:\Users\Ragu\Downloads\edu-core\edu-main\components\ParentDashboard.tsx"

# ════════════════════════════════════════════════════════════════
# 1. LOCALIZING STUDENT DASHBOARD
# ════════════════════════════════════════════════════════════════
if os.path.exists(STUDENT_PATH):
    print("Localizing Student Dashboard...")
    with open(STUDENT_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    # Replacements dictionary
    replacements = {
        'return <div className="flex min-h-dvh items-center justify-center">Loading Student Portal...</div>;':
            'return <div className="flex min-h-dvh items-center justify-center">{t(\'studentPortal.loadingStudentPortal\')}</div>;',
        'setProfileError(\'No student profile found for your account. Please contact administration.\');':
            'setProfileError(t(\'studentPortal.noStudentProfileFound\'));',
        'setProfileError(\'Failed to load your profile. Please try logging out and back in.\');':
            'setProfileError(t(\'studentPortal.failedToLoadProfile\'));',
        '<h2 className="text-xl font-bold text-slate-800 mb-2">Profile Error</h2>':
            '<h2 className="text-xl font-bold text-slate-800 mb-2">{t(\'studentPortal.profileError\')}</h2>',
        'Sign Out & Try Again':
            '{t(\'studentPortal.signOutTryAgain\')}',
        '<span className="font-bold text-lg">Student Portal</span>':
            '<span className="font-bold text-lg">{t(\'dashboard.student\')}</span>',
        "{ id: 'overview', label: 'Overview', icon: <TrendingUp size={20} /> },":
            "{ id: 'overview', label: t('dashboard.overview'), icon: <TrendingUp size={20} /> },",
        "{ id: 'attendance', label: 'Attendance', icon: <Calendar size={20} /> },":
            "{ id: 'attendance', label: t('studentPortal.myAttendance'), icon: <Calendar size={20} /> },",
        "{ id: 'timetable', label: 'Timetable', icon: <Clock size={20} /> },":
            "{ id: 'timetable', label: t('studentPortal.myTimetable'), icon: <Clock size={20} /> },",
        "{ id: 'marks', label: 'Marks', icon: <Award size={20} /> },":
            "{ id: 'marks', label: t('studentPortal.myMarks'), icon: <Award size={20} /> },",
        "{ id: 'homework', label: 'Homework', icon: <FileText size={20} /> },":
            "{ id: 'homework', label: t('studentPortal.assignedHomework'), icon: <FileText size={20} /> },",
        "{ id: 'downloads', label: 'Downloads', icon: <Download size={20} /> },":
            "{ id: 'downloads', label: t('studentPortal.downloads'), icon: <Download size={20} /> },",
        "{ id: 'feedback', label: 'Feedback', icon: <MessageSquare size={20} /> },":
            "{ id: 'feedback', label: t('studentPortal.myFeedback'), icon: <MessageSquare size={20} /> },",
        '<span className="text-sm font-semibold">Logout</span>':
            '<span className="text-sm font-semibold">{t(\'common.logout\')}</span>',
        '<span className="text-slate-500 text-xs sm:text-sm">Attendance</span>':
            '<span className="text-slate-500 text-xs sm:text-sm">{t(\'studentPortal.myAttendance\')}</span>',
        '{attendanceStats.present}/{attendanceStats.total} days':
            '{attendanceStats.present}/{attendanceStats.total} {t(\'studentPortal.total\', { defaultValue: \'days\' })}',
        '<span className="text-slate-500 text-xs sm:text-sm">Status</span>':
            '<span className="text-slate-500 text-xs sm:text-sm">{t(\'studentPortal.status\')}</span>',
        '<p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">Active</p>':
            '<p className="text-2xl sm:text-3xl font-bold text-slate-800 mt-2">{t(\'studentPortal.open\', { defaultValue: \'Active\' })}</p>',
        '<p className="text-[10px] sm:text-xs text-slate-400 mt-1">Academic Year</p>':
            '<p className="text-[10px] sm:text-xs text-slate-400 mt-1">{t(\'studentPortal.academicYear\')}</p>',
        '<span className="text-slate-500 text-xs sm:text-sm">Pending</span>':
            '<span className="text-slate-500 text-xs sm:text-sm">{t(\'studentPortal.pending\')}</span>',
        '<p className="text-[10px] sm:text-xs text-slate-400 mt-1">Assignments due</p>':
            '<p className="text-[10px] sm:text-xs text-slate-400 mt-1">{t(\'studentPortal.assignmentsDue\')}</p>',
        '<span className="text-slate-500 text-xs sm:text-sm">Downloads</span>':
            '<span className="text-slate-500 text-xs sm:text-sm">{t(\'studentPortal.downloads\')}</span>',
        '<p className="text-[10px] sm:text-xs text-slate-400 mt-1">Files available</p>':
            '<p className="text-[10px] sm:text-xs text-slate-400 mt-1">{t(\'studentPortal.filesAvailable\')}</p>',
        '<h3 className="font-bold text-slate-800 mb-4">Recent Results</h3>':
            '<h3 className="font-bold text-slate-800 mb-4">{t(\'studentPortal.recentResults\')}</h3>',
        '<p className="text-slate-500 text-sm">No marks recorded yet.</p>':
            '<p className="text-slate-500 text-sm">{t(\'studentPortal.noMarksRecorded\')}</p>',
        'Upcoming Exams\n':
            '{t(\'studentPortal.upcomingExams\')}\n',
        '<p className="text-slate-500 text-sm">No upcoming exams scheduled.</p>':
            '<p className="text-slate-500 text-sm">{t(\'studentPortal.noUpcomingExams\')}</p>',
        'Overall Attendance\n':
            '{t(\'studentPortal.overallAttendance\')}\n',
        '<p className="text-xs text-green-700 mt-1">Present</p>':
            '<p className="text-xs text-green-700 mt-1">{t(\'studentPortal.present\')}</p>',
        '<p className="text-xs text-red-700 mt-1">Absent</p>':
            '<p className="text-xs text-red-700 mt-1">{t(\'studentPortal.absent\')}</p>',
        '<p className="text-xs text-blue-700 mt-1">Rate</p>':
            '<p className="text-xs text-blue-700 mt-1">{t(\'studentPortal.rate\')}</p>',
        '<h3 className="text-lg font-bold text-slate-800 mb-4">Monthly Breakdown</h3>':
            '<h3 className="text-lg font-bold text-slate-800 mb-4">{t(\'studentPortal.monthlyBreakdown\')}</h3>',
        '<p>No attendance records found yet.</p>':
            '<p>{t(\'studentPortal.noAttendanceRecords\')}</p>',
        'Academic Marks & Grades\n':
            '{t(\'studentPortal.academicMarksGrades\')}\n',
        '<p className="text-xs text-slate-400">Obtained</p>':
            '<p className="text-xs text-slate-400">{t(\'studentPortal.obtained\')}</p>',
        '<p className="text-xs text-slate-400">Total</p>':
            '<p className="text-xs text-slate-400">{t(\'studentPortal.total\')}</p>',
        '<p className="text-center text-slate-400 py-8">No marks available yet.</p>':
            '<p className="text-center text-slate-400 py-8">{t(\'studentPortal.noMarksAvailable\')}</p>',
        'Assigned Homework & Projects\n':
            '{t(\'studentPortal.assignedHomework\')}\n',
        '👁 View Only Mode':
            '{t(\'studentPortal.viewOnlyMode\')}',
        '<span className="flex items-center"><Clock size={14} className="mr-1" /> Due: ':
            '<span className="flex items-center"><Clock size={14} className="mr-1" /> {t(\'studentPortal.due\')} ',
        '<span className="flex items-center"><Award size={14} className="mr-1" /> Marks: ':
            '<span className="flex items-center"><Award size={14} className="mr-1" /> {t(\'studentPortal.marksLabel\')} ',
        '<span>View Details</span>':
            '<span>{t(\'studentPortal.viewDetails\')}</span>',
        '<h3 className="text-lg font-semibold text-slate-600 mb-2">No Assignments Yet</h3>':
            '<h3 className="text-lg font-semibold text-slate-600 mb-2">{t(\'studentPortal.noAssignmentsYet\')}</h3>',
        '<p className="text-slate-500 text-sm">Your teachers haven\'t assigned any homework for your class yet.</p>':
            '<p className="text-slate-500 text-sm">{t(\'studentPortal.noHomeworkForClass\')}</p>',
        '📋 Homework submissions are handled by your class teacher. Contact them for submission details.':
            '{t(\'studentPortal.homeworkSubmissionNote\')}',
        'Downloadable Resources\n':
            '{t(\'studentPortal.downloadableResources\')}\n',
        '<span>Download</span>':
            '<span>{t(\'studentPortal.download\')}</span>',
        '<p className="text-slate-500">No downloads available.</p>':
            '<p className="text-slate-500">{t(\'studentPortal.noDownloadsAvailable\')}</p>',
        '<p className="text-blue-750 font-medium">Timetable Integration</p>':
            '<p className="text-blue-750 font-medium">{t(\'studentPortal.timetableIntegration\')}</p>',
        '<p className="text-blue-700 font-medium">Timetable Integration</p>':
            '<p className="text-blue-700 font-medium">{t(\'studentPortal.timetableIntegration\')}</p>',
        '<p className="text-blue-600 text-sm">Your class schedule is being synced from the master database.</p>':
            '<p className="text-blue-600 text-sm">{t(\'studentPortal.classScheduleSyncMsg\')}</p>',
        '<p className="text-amber-700 font-medium">Timetable Not Found</p>':
            '<p className="text-amber-700 font-medium">{t(\'studentPortal.timetableNotFound\')}</p>',
        'No timetable has been published for Class {studentProfile ? `${studentProfile.class}-${studentProfile.section}` : \'\'} yet.':
            '{t(\'studentPortal.noTimetablePublished\', { class: studentProfile ? `${studentProfile.class}-${studentProfile.section}` : \'\' })}',
        'My Feedback\n':
            '{t(\'studentPortal.myFeedback\')}\n',
        "{showFeedbackForm ? 'Cancel' : 'Submit Feedback'}":
            "{showFeedbackForm ? t('studentPortal.cancel') : t('studentPortal.submitFeedback')}",
        '<h3 className="font-semibold text-slate-800 mb-4">Submit New Feedback</h3>':
            '<h3 className="font-semibold text-slate-800 mb-4">{t(\'studentPortal.submitNewFeedback\')}</h3>',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Category</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'studentPortal.category\')}</label>',
        '<option value="academic">📚 Academic</option>':
            '<option value="academic">📚 {t(\'studentPortal.academic\')}</option>',
        '<option value="teacher">👨‍🏫 Teacher</option>':
            '<option value="teacher">👨‍🏫 {t(\'studentPortal.teacher\')}</option>',
        '<option value="infrastructure">🏗️ Infrastructure</option>':
            '<option value="infrastructure">🏗️ {t(\'studentPortal.infrastructure\')}</option>',
        '<option value="complaint">⚠️ Complaint</option>':
            '<option value="complaint">⚠️ {t(\'studentPortal.complaint\')}</option>',
        '<option value="suggestion">💡 Suggestion</option>':
            '<option value="suggestion">💡 {t(\'studentPortal.suggestion\')}</option>',
        '<option value="general">💬 General</option>':
            '<option value="general">💬 {t(\'studentPortal.general\')}</option>',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Title</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'studentPortal.title\')}</label>',
        'placeholder="Brief title for your feedback"':
            'placeholder={t(\'studentPortal.briefTitlePlaceholder\')}',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Description</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'studentPortal.description\')}</label>',
        'placeholder="Describe your feedback in detail..."':
            'placeholder={t(\'studentPortal.describeFeedbackPlaceholder\')}',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Rating (optional)</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'studentPortal.ratingOptional\')}</label>',
        'Submit anonymously':
            '{t(\'studentPortal.submitAnonymously\')}',
        "{feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}":
            "{feedbackSubmitting ? t('studentPortal.submitting') : t('studentPortal.submitFeedback')}",
        '<div className="text-center py-8 text-slate-500">Loading your feedback...</div>':
            '<div className="text-center py-8 text-slate-500">{t(\'studentPortal.loadingFeedback\')}</div>',
        '<h3 className="text-lg font-semibold text-slate-600 mb-2">No Feedback Yet</h3>':
            '<h3 className="text-lg font-semibold text-slate-600 mb-2">{t(\'studentPortal.noFeedbackYet\')}</h3>',
        '<p className="text-slate-500 text-sm">Tap "Submit Feedback" to share your thoughts with the school.</p>':
            '<p className="text-slate-500 text-sm">{t(\'studentPortal.tapSubmitFeedback\')}</p>',
        "fb.status === 'open' ? 'Open' : fb.status === 'under_review' ? 'Under Review' : fb.status === 'resolved' ? 'Resolved' : 'Archived'":
            "fb.status === 'open' ? t('studentPortal.open') : fb.status === 'under_review' ? t('studentPortal.underReview') : fb.status === 'resolved' ? t('studentPortal.resolved') : t('studentPortal.archived')",
        '<p className="text-xs font-semibold text-green-700 mb-1">Admin Response</p>':
            '<p className="text-xs font-semibold text-green-700 mb-1">{t(\'studentPortal.adminResponse\')}</p>',
        '🔒 This is a read-only student portal. All data is view-only and protected under institutional privacy policies.':
            '{t(\'studentPortal.readOnlyPortalNotice\')}',
        "setFeedbackMessage({ type: 'success', text: 'Feedback submitted successfully!' });":
            "setFeedbackMessage({ type: 'success', text: t('studentPortal.feedbackSuccess') });",
        "setFeedbackMessage({ type: 'error', text: result.error || 'Failed to submit feedback' });":
            "setFeedbackMessage({ type: 'error', text: result.error || t('studentPortal.feedbackFailure') });",
        "alert('Download error occurred');":
            "alert(t('studentPortal.downloadError'));",
        "alert('Failed to get download link: ' + error);":
            "alert(t('studentPortal.failedDownloadLink') + ' ' + error);",
        "Overall Results\n":
            "{t('studentPortal.recentResults')}\n"
    }

    # Perform replacements
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(STUDENT_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("Student Dashboard localized successfully!")

# ════════════════════════════════════════════════════════════════
# 2. LOCALIZING TEACHER DASHBOARD
# ════════════════════════════════════════════════════════════════
if os.path.exists(TEACHER_PATH):
    print("Localizing Teacher Dashboard...")
    with open(TEACHER_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = {
        'return <div className="flex min-h-dvh items-center justify-center">Loading Teacher Profile...</div>;':
            'return <div className="flex min-h-dvh items-center justify-center">{t(\'teacherPortal.loadingTeacherProfile\')}</div>;',
        '<span className="font-bold text-lg">Teacher Console</span>':
            '<span className="font-bold text-lg">{t(\'teacherPortal.teacherConsole\')}</span>',
        "{ id: 'assignments', label: 'Assignments', icon: <PlusCircle size={20} /> },":
            "{ id: 'assignments', label: t('teacherPortal.createAssignment'), icon: <PlusCircle size={20} /> },",
        "{ id: 'attendance', label: 'Attendance', icon: <Calendar size={20} /> },":
            "{ id: 'attendance', label: t('teacherPortal.markPeriodAttendance'), icon: <Calendar size={20} /> },",
        "{ id: 'timetable', label: 'Schedule', icon: <Clock size={20} /> },":
            "{ id: 'timetable', label: t('teacherPortal.weeklySchedule'), icon: <Clock size={20} /> },",
        "{ id: 'marks', label: 'Marks', icon: <Award size={20} /> },":
            "{ id: 'marks', label: t('teacherPortal.marksEntry'), icon: <Award size={20} /> },",
        "{ id: 'remarks', label: 'Remarks', icon: <MessageSquare size={20} /> },":
            "{ id: 'remarks', label: t('teacherPortal.studentRemarks'), icon: <MessageSquare size={20} /> },",
        "{ id: 'resources', label: 'Resources', icon: <FileText size={20} /> },":
            "{ id: 'resources', label: t('teacherPortal.classResources'), icon: <FileText size={20} /> },",
        "{ id: 'notices', label: 'Notices', icon: <Megaphone size={20} /> },":
            "{ id: 'notices', label: t('teacherPortal.classNotices'), icon: <Megaphone size={20} /> },",
        "{ id: 'homework', label: 'Homework', icon: <FileSignature size={20} /> },":
            "{ id: 'homework', label: t('teacherPortal.dailyHomeworkLog'), icon: <FileSignature size={20} /> },",
        '<span className="text-sm font-semibold">Change Password</span>':
            '<span className="text-sm font-semibold">{t(\'teacherPortal.changePassword\')}</span>',
        '<span className="text-sm font-semibold">Logout</span>':
            '<span className="text-sm font-semibold">{t(\'common.logout\')}</span>',
        'title="Change Password"':
            'title={t(\'teacherPortal.changePassword\')}',
        'title="Delete Assignment"':
            'title={t(\'teacherPortal.publishAssignment\')}',
        "confirm('Are you sure you want to delete this assignment?')":
            "confirm(t('teacherPortal.deleteAssignmentConfirm'))",
        "confirm('Are you sure you want to delete this homework?')":
            "confirm(t('teacherPortal.deleteHomeworkConfirm'))",
        "setSuccessMsg('Assignment deleted!');":
            "setSuccessMsg(t('teacherPortal.assignmentDeleted'));",
        "setSuccessMsg('Homework deleted!');":
            "setSuccessMsg(t('teacherPortal.homeworkDeleted'));",
        "setSuccessMsg('Assignment created successfully!');":
            "setSuccessMsg(t('teacherPortal.assignmentCreated'));",
        "alert(\"Please select a period first.\");":
            "alert(t('teacherPortal.selectPeriod'));",
        "setSuccessMsg('Attendance marked for period!');":
            "setSuccessMsg(t('teacherPortal.attendanceMarked'));",
        "alert(\"Please select an active exam.\");":
            "alert(t('teacherPortal.selectActiveExam'));",
        "setSuccessMsg(`Marks saved for ${selectedExamTitle}`);":
            "setSuccessMsg(t('teacherPortal.marksSavedFor', { title: selectedExamTitle }));",
        "alert(\"Failed to save marks: \" + error);":
            "alert(t('teacherPortal.selectActiveExamWarning') + ': ' + error);",
        "setSuccessMsg('Remarks saved successfully!');":
            "setSuccessMsg(t('teacherPortal.remarksSubtitle'));",
        "alert(\"Please select a file and ensure you are logged in.\");":
            "alert(t('teacherPortal.chooseFile'));",
        "setSuccessMsg('File uploaded successfully!');":
            "setSuccessMsg(t('teacherPortal.uploadSuccess'));",
        "alert('Upload failed: ' + error);":
            "alert('Upload failed: ' + error);",
        "setSuccessMsg('Notice posted!');":
            "setSuccessMsg(t('teacherPortal.noticePosted'));",
        "setSuccessMsg('Homework updated!');":
            "setSuccessMsg(t('teacherPortal.homeworkUpdated'));",
        'setPasswordError("Passwords do not match");':
            'setPasswordError(t(\'teacherPortal.passwordErrorMatch\'));',
        'setPasswordError("Password must be at least 6 characters");':
            'setPasswordError(t(\'teacherPortal.passwordErrorLength\'));',
        'setSuccessMsg("Password changed successfully");':
            'setSuccessMsg(t(\'teacherPortal.passwordChangedSuccess\'));',
        'Create New Assignment\n':
            '{t(\'teacherPortal.createAssignment\')}\n',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Assignment Title</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.assignmentTitle\')}</label>',
        'placeholder="e.g. Algebra Chapter 5 Exercises"':
            'placeholder={t(\'teacherPortal.assignmentTitlePlaceholder\')}',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.dueDate\')}</label>',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Max Marks</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.maxMarks\')}</label>',
        'Allow Online Submission':
            '{t(\'teacherPortal.allowOnlineSubmission\')}',
        'Allow Late Submission':
            '{t(\'teacherPortal.allowLateSubmission\')}',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Instructions</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.instructions\')}</label>',
        'placeholder="Detailed instructions for students..."':
            'placeholder={t(\'teacherPortal.instructionsPlaceholder\')}',
        '{isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}\n                                            Publish Assignment':
            '{isSubmitting ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}\n                                            {t(\'teacherPortal.publishAssignment\')}',
        'Published Assignments\n':
            '{t(\'teacherPortal.publishedAssignments\')}\n',
        '<p>No assignments published yet.</p>':
            '<p>{t(\'teacherPortal.noAssignmentsPublished\')}</p>',
        'Mark Period Attendance\n':
            '{t(\'teacherPortal.markPeriodAttendance\')}\n',
        '<label className="block text-sm font-medium mb-1">Select Period</label>':
            '<label className="block text-sm font-medium mb-1">{t(\'teacherPortal.selectPeriod\')}</label>',
        '<option value="">-- Choose Period --</option>':
            '<option value="">{t(\'teacherPortal.choosePeriod\')}</option>',
        '<th className="px-3 py-3">Roll</th>':
            '<th className="px-3 py-3">{t(\'teacherPortal.roll\')}</th>',
        '<th className="px-3 py-3">Name</th>':
            '<th className="px-3 py-3">{t(\'teacherPortal.name\')}</th>',
        '<th className="px-3 py-3">Status</th>':
            '<th className="px-3 py-3">{t(\'teacherPortal.status\')}</th>',
        'Present\n':
            '{t(\'teacherPortal.statusPresent\')}\n',
        'Absent\n':
            '{t(\'teacherPortal.statusAbsent\')}\n',
        'Late\n':
            '{t(\'teacherPortal.statusLate\')}\n',
        'Save Attendance':
            '{t(\'teacherPortal.saveAttendance\')}',
        'Class Notices\n':
            '{t(\'teacherPortal.classNotices\')}\n',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Notice Title</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.noticeTitle\')}</label>',
        'placeholder="e.g. Science Fair Registration"':
            'placeholder={t(\'teacherPortal.noticeTitlePlaceholder\')}',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Notice Type</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.noticeType\')}</label>',
        '<option value="announcement">📢 Announcement</option>':
            '<option value="announcement">📢 {t(\'teacherPortal.announcement\')}</option>',
        '<option value="homework">📝 Homework</option>':
            '<option value="homework">📝 {t(\'teacherPortal.homework\')}</option>',
        '<option value="exam">🎓 Exam</option>':
            '<option value="exam">🎓 {t(\'teacherPortal.exam\')}</option>',
        '<option value="event">🎉 Event</option>':
            '<option value="event">🎉 {t(\'teacherPortal.event\')}</option>',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Content</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.content\')}</label>',
        'placeholder="Write your message here..."':
            'placeholder={t(\'teacherPortal.contentPlaceholder\')}',
        'Post Notice':
            '{t(\'teacherPortal.postNotice\')}',
        '<p>No notices posted yet.</p>':
            '<p>{t(\'teacherPortal.noNoticesPosted\')}</p>',
        'Daily Homework Log\n':
            '{t(\'teacherPortal.dailyHomeworkLog\')}\n',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Date</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.dueDate\')}</label>',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.selectSubject\')}</label>',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Homework Details</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.homeworkDetails\')}</label>',
        'placeholder="Enter homework details..."':
            'placeholder={t(\'teacherPortal.homeworkDetailsPlaceholder\')}',
        'Update Homework':
            '{t(\'teacherPortal.updateHomework\')}',
        'Published Homework\n':
            '{t(\'teacherPortal.publishedHomework\')}\n',
        '<p>No homework published yet.</p>':
            '<p>{t(\'teacherPortal.noHomeworkPublished\')}</p>',
        'Marks Entry\n':
            '{t(\'teacherPortal.marksEntry\')}\n',
        '<label className="block text-sm font-bold mb-2 text-slate-700">Select Active Exam</label>':
            '<label className="block text-sm font-bold mb-2 text-slate-700">{t(\'teacherPortal.selectActiveExam\')}</label>',
        '<option value="">-- Locked by Admin (Select Exam) --</option>':
            '<option value="">{t(\'teacherPortal.examLockedPlaceholder\')}</option>',
        '<th className="p-4 text-xs font-bold text-yellow-800 uppercase tracking-wider">Student Name</th>':
            '<th className="p-4 text-xs font-bold text-yellow-800 uppercase tracking-wider">{t(\'teacherPortal.studentName\')}</th>',
        '<th className="p-4 text-xs font-bold text-yellow-800 uppercase tracking-wider w-32 text-center">Marks Obtainted</th>':
            '<th className="p-4 text-xs font-bold text-yellow-800 uppercase tracking-wider w-32 text-center">{t(\'teacherPortal.marksObtained\')}</th>',
        'Submit Marks':
            '{t(\'teacherPortal.submitMarks\')}',
        '<p className="text-slate-500 font-medium">Please select an active exam to begin entering marks.</p>':
            '<p className="text-slate-500 font-medium">{t(\'teacherPortal.selectActiveExamWarning\')}</p>',
        'Student Remarks\n':
            '{t(\'teacherPortal.studentRemarks\')}\n',
        '<p className="text-sm text-slate-500 mt-1">Private notes visible only to teachers and admins.</p>':
            '<p className="text-sm text-slate-500 mt-1">{t(\'teacherPortal.remarksSubtitle\')}</p>',
        'Save All Remarks':
            '{t(\'teacherPortal.saveAllRemarks\')}',
        '<p className="text-xs text-slate-500">Roll No: ':
            '<p className="text-xs text-slate-500">{t(\'teacherPortal.roll\')}: ',
        'Private Note':
            '{t(\'teacherPortal.privateNote\')}',
        'placeholder={`Write a private remark for ${student.name}...`}':
            'placeholder={t(\'teacherPortal.remarksPlaceholder\', { name: student.name })}',
        '<h3 className="text-lg font-bold text-slate-700">No Students Found</h3>':
            '<h3 className="text-lg font-bold text-slate-700">{t(\'teacherPortal.noStudentsFound\')}</h3>',
        '<p className="text-slate-500">Select a different class to view students.</p>':
            '<p className="text-slate-500">{t(\'teacherPortal.selectDifferentClass\')}</p>',
        'Class Resources\n':
            '{t(\'teacherPortal.classResources\')}\n',
        '<h3 className="font-bold text-slate-700 mb-4">Upload New Resource</h3>':
            '<h3 className="font-bold text-slate-700 mb-4">{t(\'teacherPortal.uploadNewResource\')}</h3>',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.selectSubject\')}</label>',
        '<label className="block text-sm font-medium text-slate-700 mb-1">File</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.chooseFile\')}</label>',
        '<span className="text-teal-600 text-xs text-center mt-1">\n                                                                    Click to change\n                                                                </span>':
            '<span className="text-teal-600 text-xs text-center mt-1">{t(\'teacherPortal.clickToChange\')}</span>',
        '<span className="text-slate-600 font-medium text-sm">Choose File</span>':
            '<span className="text-slate-600 font-medium text-sm">{t(\'teacherPortal.chooseFile\')}</span>',
        '<span>Publish Resource</span>':
            '<span>{t(\'teacherPortal.publishResource\')}</span>',
        '<span>Uploading...</span>':
            '<span>{t(\'teacherPortal.uploading\')}</span>',
        'Uploading to: ':
            '{t(\'teacherPortal.uploadingTo\')} ',
        'Section ':
            '{t(\'teacherPortal.section\')} ',
        '<h3 className="font-bold text-slate-700 mb-4">Uploaded Resources</h3>':
            '<h3 className="font-bold text-slate-700 mb-4">{t(\'teacherPortal.uploadedResources\')}</h3>',
        '<p>No resources uploaded yet for this class.</p>':
            '<p>{t(\'teacherPortal.noResourcesUploaded\')}</p>',
        'Change Password\n':
            '{t(\'teacherPortal.changePassword\')}\n',
        '<label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.newPassword\')}</label>',
        'placeholder="Enter new password (min 6 chars)"':
            'placeholder={t(\'teacherPortal.passwordPlaceholder\')}',
        '<label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>':
            '<label className="block text-sm font-medium text-slate-700 mb-1">{t(\'teacherPortal.confirmPassword\')}</label>',
        'placeholder="Re-enter new password"':
            'placeholder={t(\'teacherPortal.confirmPasswordPlaceholder\')}',
        'Cancel\n':
            '{t(\'common.cancel\')}\n',
        'Update Password\n':
            '{t(\'teacherPortal.updatePassword\')}\n',
    }

    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(TEACHER_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("Teacher Dashboard localized successfully!")

# ════════════════════════════════════════════════════════════════
# 3. LOCALIZING PARENT DASHBOARD
# ════════════════════════════════════════════════════════════════
if os.path.exists(PARENT_PATH):
    print("Localizing Parent Dashboard...")
    with open(PARENT_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = {
        'return <div className="flex min-h-dvh items-center justify-center">Loading Parent Portal...</div>;':
            'return <div className="flex min-h-dvh items-center justify-center">{t(\'parentPortal.loadingParentPortal\')}</div>;',
        'span className="font-bold text-lg">Parent Portal</span>':
            'span className="font-bold text-lg">{t(\'dashboard.parent\')}</span>',
        '<span className="text-sm font-semibold">Logout</span>':
            '<span className="text-sm font-semibold">{t(\'common.logout\')}</span>',
        'Viewing: {studentName}':
            '{t(\'common.viewing\')}: {studentName}',
        'Score\n':
            '{t(\'studentPortal.marks\')}\n',
        'Attend.\n':
            '{t(\'parentPortal.attendanceTracker\')}\n',
        'Pending\n':
            '{t(\'studentPortal.pending\')}\n',
        'Assignments\n':
            '{t(\'studentPortal.assignedHomework\')}\n',
        'Roll No.\n':
            '{t(\'teacherPortal.roll\')}\n',
        'Subject-wise Performance\n':
            '{t(\'parentPortal.academicProgress\')}\n',
        'No marks recorded yet.':
            '{t(\'studentPortal.noMarksRecorded\')}',
        'Recent Results\n':
            '{t(\'studentPortal.recentResults\')}\n',
        'Upcoming Exams\n':
            '{t(\'studentPortal.upcomingExams\')}\n',
        'No upcoming exams scheduled.':
            '{t(\'studentPortal.noUpcomingExams\')}',
        'Overall Attendance\n':
            '{t(\'studentPortal.overallAttendance\')}\n',
        '<p className="text-xs text-green-700 mt-1">Present</p>':
            '<p className="text-xs text-green-700 mt-1">{t(\'studentPortal.present\')}</p>',
        '<p className="text-xs text-red-700 mt-1">Absent</p>':
            '<p className="text-xs text-red-700 mt-1">{t(\'studentPortal.absent\')}</p>',
        '<p className="text-xs text-blue-700 mt-1">Rate</p>':
            '<p className="text-xs text-blue-700 mt-1">{t(\'studentPortal.rate\')}</p>',
        'Monthly Breakdown\n':
            '{t(\'studentPortal.monthlyBreakdown\')}\n',
        'No attendance records found yet.':
            '{t(\'studentPortal.noAttendanceRecords\')}',
        'Academic Marks & Grades\n':
            '{t(\'studentPortal.academicMarksGrades\')}\n',
        'No marks available yet.':
            '{t(\'studentPortal.noMarksAvailable\')}',
        'Assigned Homework & Projects\n':
            '{t(\'studentPortal.assignedHomework\')}\n',
        '👁 View Only Mode':
            '{t(\'studentPortal.viewOnlyMode\')}',
        'Due: ':
            '{t(\'studentPortal.due\')} ',
        'Marks: ':
            '{t(\'studentPortal.marksLabel\')} ',
        'View Details':
            '{t(\'studentPortal.viewDetails\')}',
        'No Assignments Yet':
            '{t(\'studentPortal.noAssignmentsYet\')}',
        'Your child\'s teachers haven\'t assigned any homework for this class yet.':
            '{t(\'parentPortal.noHomeworkForClass\')}',
        '📋 Homework submissions are handled by the class teacher. Contact them for details.':
            '{t(\'parentPortal.homeworkSubmissionNote\')}',
        'Announcements\n':
            '{t(\'parentPortal.announcements\')}\n',
        'No announcements or remarks posted yet for your child.':
            '{t(\'parentPortal.noAnnouncements\')}',
        'Downloadable Resources\n':
            '{t(\'studentPortal.downloadableResources\')}\n',
        'No downloads available.':
            '{t(\'studentPortal.noDownloadsAvailable\')}',
        'Timetable Integration\n':
            '{t(\'studentPortal.timetableIntegration\')}\n',
        'Your child\'s class schedule is being synced from the master database.':
            '{t(\'parentPortal.classScheduleSyncMsg\')}',
        'Timetable Not Found\n':
            '{t(\'studentPortal.timetableNotFound\')}\n',
        'No timetable has been published for Class {selectedStudent ? `${selectedStudent.class}-${selectedStudent.section}` : \'\'} yet.':
            '{t(\'parentPortal.noTimetablePublished\', { class: selectedStudent ? `${selectedStudent.class}-${selectedStudent.section}` : \'\' })}',
        'Notices\n':
            '{t(\'parentPortal.notices\')}\n',
        'Loading notices...':
            '{t(\'parentPortal.loadingNotices\')}',
        'No notices found yet.':
            '{t(\'parentPortal.noNoticesYet\')}',
        '🔒 This is a read-only parent portal. All data is view-only and protected under institutional privacy policies.':
            '{t(\'parentPortal.parentPortalNotice\')}',
        'Profile Error\n':
            '{t(\'parentPortal.profileError\')}\n',
        'No student accounts linked to your parent profile. Please contact administration.':
            '{t(\'parentPortal.noStudentLinked\')}',
        'Failed to load child profiles. Please try logging out and back in.':
            '{t(\'parentPortal.failedToLoadProfile\')}',
        'Sign Out & Try Again':
            '{t(\'parentPortal.signOutTryAgain\')}',
        'Download\n':
            '{t(\'studentPortal.download\')}\n'
    }

    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(PARENT_PATH, "w", encoding="utf-8") as f:
        f.write(content)
    print("Parent Dashboard localized successfully!")
