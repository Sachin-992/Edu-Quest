#!/usr/bin/env python3
"""
EDUCORE-OMEGA Fee Reminder Script
==================================
Sends automated fee reminders to parents for pending/overdue fees.

Usage:
    python send_fee_reminders.py [--dry-run] [--days-before=7]

Environment Variables Required:
    SUPABASE_URL          - Your Supabase project URL
    SUPABASE_SERVICE_KEY  - Supabase service role key (NOT anon key)
    SMTP_HOST             - SMTP server host (e.g. smtp.gmail.com)
    SMTP_PORT             - SMTP port (e.g. 587)
    SMTP_USER             - SMTP username / email
    SMTP_PASS             - SMTP password / app password
    SCHOOL_NAME           - School name for email templates
    SCHOOL_LOGO_URL       - Logo URL for email header

Install dependencies:
    pip install supabase python-dotenv
"""

import os
import sys
import json
import smtplib
import argparse
import logging
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # .env optional

try:
    from supabase import create_client
except ImportError:
    print("ERROR: supabase-py not installed. Run: pip install supabase")
    sys.exit(1)

# ─────────────────────────────────────────────
# CONFIG
# ─────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("fee-reminders")

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
SMTP_HOST = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "587"))
SMTP_USER = os.environ.get("SMTP_USER", "")
SMTP_PASS = os.environ.get("SMTP_PASS", "")
SCHOOL_NAME = os.environ.get("SCHOOL_NAME", "EDUCORE-OMEGA School")
SCHOOL_LOGO_URL = os.environ.get("SCHOOL_LOGO_URL", "")

# ─────────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────────

def get_supabase_client():
    if not SUPABASE_URL or not SUPABASE_KEY:
        log.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set.")
        sys.exit(1)
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def fetch_pending_fees(client, days_before: int):
    """Return fee_records that are pending/overdue and due within `days_before` days."""
    cutoff_date = (datetime.now(timezone.utc) + timedelta(days=days_before)).date().isoformat()

    result = client.table("fee_records").select(
        "id, student_id, student_name, class, fee_type, amount, paid, due, status, due_date"
    ).in_("status", ["pending", "overdue"]).lte("due_date", cutoff_date).execute()

    if result.data:
        log.info(f"Found {len(result.data)} pending/overdue fee records.")
    else:
        log.info("No pending/overdue fees found.")
    return result.data or []


def fetch_parent_email(client, student_id: str) -> list[dict]:
    """Return list of {name, email} for parents linked to the given student."""
    result = client.table("parent_student_links").select(
        "parent_id, profiles!parent_id(full_name, email)"
    ).eq("student_id", student_id).execute()

    parents = []
    for row in (result.data or []):
        profile = row.get("profiles") or {}
        email = profile.get("email")
        name = profile.get("full_name", "Parent")
        if email:
            parents.append({"name": name, "email": email})
    return parents


def build_email_html(parent_name: str, student_name: str, student_class: str,
                     fee_type: str, amount: float, paid: float, due: float,
                     due_date: str, status: str) -> str:
    status_color = "#e53e3e" if status == "overdue" else "#d97706"
    status_label = "OVERDUE" if status == "overdue" else "PENDING"

    return f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {{ font-family: 'Segoe UI', sans-serif; background: #f8fafc; color: #1a202c; margin: 0; padding: 20px; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 12px;
                      box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; }}
        .header {{ background: linear-gradient(135deg, #4f46e5, #6d28d9); color: white;
                   padding: 32px 24px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 22px; font-weight: 700; }}
        .header p {{ margin: 6px 0 0; opacity: 0.85; font-size: 14px; }}
        .body {{ padding: 28px 24px; }}
        .badge {{ display: inline-block; background: {status_color}; color: white;
                  padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; margin-bottom: 16px; }}
        .fee-card {{ background: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 8px;
                     padding: 16px; margin: 16px 0; }}
        .fee-row {{ display: flex; justify-content: space-between; margin: 6px 0;
                    font-size: 14px; color: #4a5568; }}
        .fee-row strong {{ color: #1a202c; }}
        .amount-highlight {{ font-size: 28px; font-weight: 800; color: {status_color};
                              text-align: center; margin: 20px 0; }}
        .cta {{ text-align: center; margin: 24px 0; }}
        .cta a {{ display: inline-block; background: #4f46e5; color: white; text-decoration: none;
                   padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; }}
        .footer {{ text-align: center; padding: 16px; background: #f8fafc;
                    font-size: 12px; color: #718096; }}
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏫 {SCHOOL_NAME}</h1>
          <p>Fee Payment Reminder</p>
        </div>
        <div class="body">
          <p>Dear <strong>{parent_name}</strong>,</p>
          <p>This is a reminder that a fee payment is due for your child:</p>
          <span class="badge">⚠️ {status_label}</span>

          <div class="fee-card">
            <div class="fee-row"><span>Student</span><strong>{student_name}</strong></div>
            <div class="fee-row"><span>Class</span><strong>{student_class}</strong></div>
            <div class="fee-row"><span>Fee Type</span><strong>{fee_type.title()}</strong></div>
            <div class="fee-row"><span>Total Fee</span><strong>₹{amount:,.2f}</strong></div>
            <div class="fee-row"><span>Amount Paid</span><strong style="color:#38a169">₹{paid:,.2f}</strong></div>
            <div class="fee-row"><span>Due Date</span><strong>{due_date}</strong></div>
          </div>

          <div class="amount-highlight">₹{due:,.2f} Due</div>

          <div class="cta">
            <a href="{SUPABASE_URL.replace('.supabase.co', '')}/parent">Pay Now via Parent Portal →</a>
          </div>

          <p style="font-size:13px;color:#718096;">
            If you have already made the payment, please ignore this reminder.
            For queries, contact the school accounts office.
          </p>
        </div>
        <div class="footer">
          © {datetime.now().year} {SCHOOL_NAME} · This is an automated notification
        </div>
      </div>
    </body>
    </html>
    """


def send_email(to_email: str, to_name: str, subject: str, html_body: str, dry_run: bool) -> bool:
    if dry_run:
        log.info(f"[DRY-RUN] Would send to: {to_name} <{to_email}> | {subject}")
        return True

    if not SMTP_USER or not SMTP_PASS:
        log.warning(f"SMTP credentials not set. Skipping email to {to_email}.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{SCHOOL_NAME} <{SMTP_USER}>"
        msg["To"] = f"{to_name} <{to_email}>"
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())

        log.info(f"✉️  Sent reminder to {to_name} <{to_email}>")
        return True
    except Exception as e:
        log.error(f"Failed to send to {to_email}: {e}")
        return False


def log_reminder_to_db(client, fee_record_id: str, parent_email: str):
    """Insert a log entry so we don't double-send."""
    try:
        client.table("notifications").insert({
            "title": "Fee Reminder Sent",
            "message": f"Automated fee reminder sent to {parent_email}",
            "type": "payment",
            "recipient_role": "parent",
            "metadata": {"fee_record_id": fee_record_id, "sent_at": datetime.now(timezone.utc).isoformat()}
        }).execute()
    except Exception as e:
        log.warning(f"Could not log reminder to DB: {e}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Send fee reminders to parents")
    parser.add_argument("--dry-run", action="store_true", help="Print emails without sending")
    parser.add_argument("--days-before", type=int, default=7,
                        help="Send reminders for fees due within N days (default: 7)")
    args = parser.parse_args()

    log.info(f"Starting fee reminder job | dry_run={args.dry_run} | days_before={args.days_before}")

    client = get_supabase_client()
    fee_records = fetch_pending_fees(client, args.days_before)

    if not fee_records:
        log.info("No reminders to send. Exiting.")
        return

    sent = 0
    failed = 0

    for record in fee_records:
        student_id = record.get("student_id")
        student_name = record.get("student_name", "Student")
        student_class = record.get("class", "N/A")
        fee_type = record.get("fee_type", "tuition")
        amount = float(record.get("amount", 0))
        paid = float(record.get("paid", 0))
        due = float(record.get("due", amount - paid))
        due_date = record.get("due_date", "N/A")
        status = record.get("status", "pending")
        record_id = record.get("id")

        if not student_id or due <= 0:
            continue

        parents = fetch_parent_email(client, student_id)
        if not parents:
            log.warning(f"No parent email found for student: {student_name} ({student_id})")
            continue

        for parent in parents:
            subject = f"[{SCHOOL_NAME}] Fee Reminder: ₹{due:,.0f} due for {student_name}"
            html_body = build_email_html(
                parent["name"], student_name, student_class,
                fee_type, amount, paid, due, due_date, status
            )
            success = send_email(parent["email"], parent["name"], subject, html_body, args.dry_run)

            if success:
                sent += 1
                if not args.dry_run:
                    log_reminder_to_db(client, record_id, parent["email"])
            else:
                failed += 1

    log.info(f"Job complete. Sent: {sent} | Failed: {failed}")


if __name__ == "__main__":
    main()
